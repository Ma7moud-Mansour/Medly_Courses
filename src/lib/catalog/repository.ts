import { prisma } from "@/lib/db";
import { resolveInstructorAvatar } from "@/lib/instructors/avatar";
import { clamp } from "@/lib/utils";
import { discoverPublicCourses, type CourseDiscoveryQuery, type CourseDiscoveryResult } from "@/lib/course/repository";
import type { Category, Instructor, UserRole } from "@/types";

type ViewerContext =
  | {
      isAuthenticated: true;
      userId: string;
      role: UserRole;
    }
  | {
      isAuthenticated: false;
    };

export type CategoryBrowseItem = Category & {
  coursesCount: number;
};

export type InstructorBrowseItem = Instructor & {
  coursesCount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
};

export type CategoryListingQuery = {
  query?: string;
  page?: number;
  pageSize?: number;
};

export type InstructorListingSort = "popular" | "rating" | "courses" | "name";

export type InstructorListingQuery = {
  query?: string;
  sort?: InstructorListingSort;
  page?: number;
  pageSize?: number;
};

export type CategoryListingResult = {
  categories: CategoryBrowseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  applied: Required<Pick<CategoryListingQuery, "page" | "pageSize">> & Pick<CategoryListingQuery, "query">;
};

export type InstructorListingResult = {
  instructors: InstructorBrowseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  applied: Required<Pick<InstructorListingQuery, "sort" | "page" | "pageSize">> &
    Pick<InstructorListingQuery, "query">;
};

export type CategoryDetailsView = {
  category: CategoryBrowseItem;
  discovery: CourseDiscoveryResult;
};

export type InstructorDetailsView = {
  instructor: InstructorBrowseItem;
  discovery: CourseDiscoveryResult;
};

function normalizeValue(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

async function getPublishedCourseCountsByCategory(categoryIds: string[]) {
  if (!categoryIds.length) {
    return new Map<string, number>();
  }

  const groups = await prisma.course.groupBy({
    by: ["categoryId"],
    where: {
      isPublished: true,
      categoryId: {
        in: categoryIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(groups.map((entry) => [entry.categoryId, entry._count._all]));
}

async function buildInstructorMetrics(instructorIds: string[]) {
  if (!instructorIds.length) {
    return new Map<string, Pick<InstructorBrowseItem, "coursesCount" | "studentsCount" | "rating" | "reviewsCount">>();
  }

  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      instructorId: {
        in: instructorIds,
      },
    },
    select: {
      id: true,
      instructorId: true,
    },
  });

  const metrics = new Map<string, Pick<InstructorBrowseItem, "coursesCount" | "studentsCount" | "rating" | "reviewsCount">>();

  for (const instructorId of instructorIds) {
    metrics.set(instructorId, {
      coursesCount: 0,
      studentsCount: 0,
      rating: 0,
      reviewsCount: 0,
    });
  }

  if (!courses.length) {
    return metrics;
  }

  const courseIds = courses.map((course) => course.id);
  const courseInstructorMap = new Map(courses.map((course) => [course.id, course.instructorId]));

  for (const course of courses) {
    const current = metrics.get(course.instructorId);

    if (current) {
      current.coursesCount += 1;
    }
  }

  const [reviewGroups, enrollmentGroups] = await Promise.all([
    prisma.review.groupBy({
      by: ["courseId"],
      where: {
        courseId: {
          in: courseIds,
        },
      },
      _count: {
        _all: true,
      },
      _avg: {
        rating: true,
      },
    }),
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: {
        courseId: {
          in: courseIds,
        },
        accessStatus: "active",
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const ratingAccumulator = new Map<string, { weighted: number; reviewsCount: number }>();

  for (const reviewGroup of reviewGroups) {
    const instructorId = courseInstructorMap.get(reviewGroup.courseId);

    if (!instructorId) {
      continue;
    }

    const current = metrics.get(instructorId);

    if (!current) {
      continue;
    }

    const reviewsCount = reviewGroup._count._all;
    const avgRating = reviewGroup._avg.rating ?? 0;
    current.reviewsCount += reviewsCount;

    const existing = ratingAccumulator.get(instructorId) ?? { weighted: 0, reviewsCount: 0 };
    existing.weighted += avgRating * reviewsCount;
    existing.reviewsCount += reviewsCount;
    ratingAccumulator.set(instructorId, existing);
  }

  for (const enrollmentGroup of enrollmentGroups) {
    const instructorId = courseInstructorMap.get(enrollmentGroup.courseId);

    if (!instructorId) {
      continue;
    }

    const current = metrics.get(instructorId);

    if (current) {
      current.studentsCount += enrollmentGroup._count._all;
    }
  }

  for (const [instructorId, accumulator] of ratingAccumulator) {
    const current = metrics.get(instructorId);

    if (current && accumulator.reviewsCount) {
      current.rating = Number((accumulator.weighted / accumulator.reviewsCount).toFixed(1));
    }
  }

  return metrics;
}

// Public category discovery stays repository-driven and only counts published courses.
export async function listPublicCategories(input: CategoryListingQuery = {}): Promise<CategoryListingResult> {
  const query = normalizeValue(input.query);
  const pageSize = clamp(input.pageSize ?? 8, 1, 24);

  const categories = await prisma.category.findMany({
    where: {
      courses: {
        some: {
          isPublished: true,
        },
      },
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: {
      name: "asc",
    },
  });

  const countMap = await getPublishedCourseCountsByCategory(categories.map((category) => category.id));
  const mapped = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined,
    icon: category.icon ?? undefined,
    coursesCount: countMap.get(category.id) ?? 0,
  }));

  const filtered = mapped.filter((category) => category.coursesCount > 0);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = clamp(input.page ?? 1, 1, totalPages);
  const start = (page - 1) * pageSize;

  return {
    categories: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    applied: {
      query,
      page,
      pageSize,
    },
  };
}

export async function getPublicCategoryDetailsBySlug(
  slug: string,
  discoveryQuery: CourseDiscoveryQuery = {},
  viewer?: ViewerContext,
): Promise<CategoryDetailsView | undefined> {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
    },
  });

  if (!category) {
    return undefined;
  }

  const countMap = await getPublishedCourseCountsByCategory([category.id]);
  const discovery = await discoverPublicCourses(
    {
      ...discoveryQuery,
      category: slug,
    },
    viewer,
  );

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      icon: category.icon ?? undefined,
      coursesCount: countMap.get(category.id) ?? 0,
    },
    discovery,
  };
}

// Instructor browsing uses Prisma metrics aggregated from published courses, reviews, and active enrollments.
export async function listPublicInstructors(input: InstructorListingQuery = {}): Promise<InstructorListingResult> {
  const query = normalizeValue(input.query);
  const sort = input.sort ?? "popular";
  const pageSize = clamp(input.pageSize ?? 6, 1, 24);

  const instructors = await prisma.instructor.findMany({
    where: {
      courses: {
        some: {
          isPublished: true,
        },
      },
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { title: { contains: query, mode: "insensitive" } },
              { specialization: { contains: query, mode: "insensitive" } },
              { bio: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
  });

  const metricMap = await buildInstructorMetrics(instructors.map((instructor) => instructor.id));
  const mapped = instructors
    .map((instructor) => ({
      id: instructor.id,
      name: instructor.name,
      slug: instructor.slug,
      title: instructor.title ?? undefined,
      avatar: resolveInstructorAvatar(instructor.avatar ?? undefined, instructor.slug, instructor.name),
      bio: instructor.bio ?? undefined,
      specialization: instructor.specialization ?? undefined,
      ...(metricMap.get(instructor.id) ?? {
        coursesCount: 0,
        studentsCount: 0,
        rating: 0,
        reviewsCount: 0,
      }),
    }))
    .filter((instructor) => instructor.coursesCount > 0);

  const sorted = mapped.sort((left, right) => {
    switch (sort) {
      case "name":
        return left.name.localeCompare(right.name, "ar");
      case "courses":
        return right.coursesCount - left.coursesCount || right.studentsCount - left.studentsCount;
      case "rating":
        return right.rating - left.rating || right.reviewsCount - left.reviewsCount;
      case "popular":
      default:
        return right.studentsCount - left.studentsCount || right.coursesCount - left.coursesCount;
    }
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = clamp(input.page ?? 1, 1, totalPages);
  const start = (page - 1) * pageSize;

  return {
    instructors: sorted.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    applied: {
      query,
      sort,
      page,
      pageSize,
    },
  };
}

export async function getPublicInstructorDetailsBySlug(
  slug: string,
  discoveryQuery: CourseDiscoveryQuery = {},
  viewer?: ViewerContext,
): Promise<InstructorDetailsView | undefined> {
  const instructor = await prisma.instructor.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      title: true,
      avatar: true,
      bio: true,
      specialization: true,
    },
  });

  if (!instructor) {
    return undefined;
  }

  const [metricMap, discovery] = await Promise.all([
    buildInstructorMetrics([instructor.id]),
    discoverPublicCourses(
      {
        ...discoveryQuery,
        instructor: slug,
      },
      viewer,
    ),
  ]);

  const metrics = metricMap.get(instructor.id) ?? {
    coursesCount: 0,
    studentsCount: 0,
    rating: 0,
    reviewsCount: 0,
  };

  return {
    instructor: {
      id: instructor.id,
      name: instructor.name,
      slug: instructor.slug,
      title: instructor.title ?? undefined,
      avatar: resolveInstructorAvatar(instructor.avatar ?? undefined, instructor.slug, instructor.name),
      bio: instructor.bio ?? undefined,
      specialization: instructor.specialization ?? undefined,
      ...metrics,
    },
    discovery,
  };
}
