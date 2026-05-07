import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEMO_COURSE_SLUGS, isDemoCourseSlug } from "@/lib/course/demo-cleanup";
import { resolveInstructorAvatar } from "@/lib/instructors/avatar";
import { resolveStoredAssetUrl } from "@/lib/storage";
import { clamp } from "@/lib/utils";
import type {
  Category,
  Course,
  CurriculumChapter,
  EnrollmentAccessStatus,
  Instructor,
  Review,
  UserRole,
} from "@/types";

const courseSummaryInclude = Prisma.validator<Prisma.CourseInclude>()({
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  instructor: {
    select: {
      id: true,
      name: true,
      slug: true,
      title: true,
      avatar: true,
      bio: true,
      specialization: true,
    },
  },
});

const courseDetailsInclude = Prisma.validator<Prisma.CourseInclude>()({
  ...courseSummaryInclude,
  chapters: {
    where: {
      isPublished: true,
    },
    orderBy: {
      order: "asc",
    },
    include: {
      lessons: {
        where: {
          isPublished: true,
        },
        orderBy: {
          order: "asc",
        },
        include: {
          videoAsset: true,
          attachments: {
            where: {
              isPublished: true,
              visibilityStatus: {
                not: "hidden",
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  },
});

const reviewInclude = Prisma.validator<Prisma.ReviewInclude>()({
  user: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
});

type CourseSummaryRecord = Prisma.CourseGetPayload<{
  include: typeof courseSummaryInclude;
}>;

type CourseDetailsRecord = Prisma.CourseGetPayload<{
  include: typeof courseDetailsInclude;
}>;

type ReviewRecord = Prisma.ReviewGetPayload<{
  include: typeof reviewInclude;
}>;

type CourseViewerContext =
  | {
      isAuthenticated: true;
      userId: string;
      role: UserRole;
    }
  | {
      isAuthenticated: false;
    };

type AggregatedCourseMetrics = {
  activeStudents: number;
  reviewsCount: number;
  rating: number;
};

type ViewerCourseState = {
  wishlistedCourseIds: Set<string>;
  enrollments: Map<
    string,
    {
      accessStatus: EnrollmentAccessStatus;
      lastLessonId?: string;
    }
  >;
};

export type CourseListItem = Course & {
  categoryName: string;
  categorySlug: string;
  instructorName: string;
  instructorSlug: string;
  instructorBio?: string;
  isWishlisted: boolean;
  isEnrolled: boolean;
  accessStatus: EnrollmentAccessStatus | "inactive";
  isAccessible: boolean;
  learningHref?: string;
};

export type CourseInstructorView = Instructor;

export type CourseReviewItem = Review;

export type CourseDetailsView = {
  course: CourseListItem;
  curriculum: CurriculumChapter[];
  instructor: CourseInstructorView;
  reviews: CourseReviewItem[];
  relatedCourses: CourseListItem[];
  currentUserReview?: CourseReviewItem;
  canReview: boolean;
  reviewEligibilityMessage?: string;
  canManageWishlist: boolean;
};

export type CourseDiscoverySort = "popular" | "newest" | "rating" | "price-low" | "price-high";
export type CourseDiscoveryPrice = "all" | "free" | "paid";
export type CourseDiscoveryRating = "all" | "4" | "4.5";

export type CourseDiscoveryQuery = {
  query?: string;
  category?: string;
  price?: CourseDiscoveryPrice;
  instructor?: string;
  rating?: CourseDiscoveryRating;
  sort?: CourseDiscoverySort;
  page?: number;
  pageSize?: number;
};

export type CourseDiscoveryFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type CourseDiscoveryResult = {
  courses: CourseListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  filters: {
    categories: CourseDiscoveryFilterOption[];
    instructors: CourseDiscoveryFilterOption[];
  };
  applied: Required<
    Pick<CourseDiscoveryQuery, "price" | "rating" | "sort" | "page" | "pageSize">
  > &
    Pick<CourseDiscoveryQuery, "query" | "category" | "instructor">;
};

export type CourseSearchResultGroup = {
  courses: CourseListItem[];
  categories: Category[];
  instructors: Instructor[];
};

function formatUpdatedAt(value?: Date | null) {
  const date = value ?? new Date();

  return new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildLearningOutcomes(course: Pick<CourseSummaryRecord, "durationHours" | "lessonsCount" | "examPrep">) {
  return [
    `${course.lessonsCount} درس قصير منظم يساعدك على المذاكرة بدون تشتيت.`,
    `مدة مشاهدة إجمالية حوالي ${course.durationHours} ساعة مع متابعة واضحة للتقدم.`,
    course.examPrep ? "الكورس مناسب للمراجعة السريعة والاستعداد للاختبارات." : "شرح طبي منظم يربط الفهم بالتطبيق السريري.",
    "يظهر الكورس مباشرة داخل حسابك ويمكنك المتابعة من آخر درس محفوظ.",
  ];
}

function buildRequirements(course: Pick<CourseSummaryRecord, "language">) {
  return [
    `لغة الكورس: ${course.language}.`,
    "الهاتف أو اللابتوب يكفي لمتابعة الدروس وحفظ تقدمك.",
    "يمكنك البدء مباشرة ومتابعة الدروس بالترتيب الذي يناسبك.",
  ];
}

function mapReview(review: ReviewRecord): CourseReviewItem {
  return {
    id: review.id,
    userId: review.userId,
    userName: review.user.name,
    userAvatar: review.user.avatar ?? undefined,
    courseId: review.courseId,
    rating: review.rating,
    comment: review.comment ?? undefined,
    createdAt: review.createdAt.toISOString(),
  };
}

async function aggregateCourseMetrics(courseIds: string[]) {
  if (!courseIds.length) {
    return new Map<string, AggregatedCourseMetrics>();
  }

  const [reviewStats, enrollmentStats] = await Promise.all([
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

  const metrics = new Map<string, AggregatedCourseMetrics>();

  for (const courseId of courseIds) {
    metrics.set(courseId, {
      activeStudents: 0,
      reviewsCount: 0,
      rating: 0,
    });
  }

  for (const review of reviewStats) {
    metrics.set(review.courseId, {
      ...(metrics.get(review.courseId) ?? {
        activeStudents: 0,
        reviewsCount: 0,
        rating: 0,
      }),
      reviewsCount: review._count._all,
      rating: Number((review._avg.rating ?? 0).toFixed(1)),
    });
  }

  for (const enrollment of enrollmentStats) {
    metrics.set(enrollment.courseId, {
      ...(metrics.get(enrollment.courseId) ?? {
        activeStudents: 0,
        reviewsCount: 0,
        rating: 0,
      }),
      activeStudents: enrollment._count._all,
    });
  }

  return metrics;
}

async function getViewerCourseState(userId: string, courseIds: string[]): Promise<ViewerCourseState> {
  if (!courseIds.length) {
    return {
      wishlistedCourseIds: new Set(),
      enrollments: new Map(),
    };
  }

  const [wishlists, enrollments] = await Promise.all([
    prisma.wishlist.findMany({
      where: {
        userId,
        courseId: {
          in: courseIds,
        },
      },
      select: {
        courseId: true,
      },
    }),
    prisma.enrollment.findMany({
      where: {
        userId,
        courseId: {
          in: courseIds,
        },
      },
      select: {
        courseId: true,
        accessStatus: true,
        lastLessonId: true,
      },
    }),
  ]);

  return {
    wishlistedCourseIds: new Set(wishlists.map((item) => item.courseId)),
    enrollments: new Map(
      enrollments.map((item) => [
        item.courseId,
        {
          accessStatus: item.accessStatus,
          lastLessonId: item.lastLessonId ?? undefined,
        },
      ]),
    ),
  };
}

function mapCourseSummary(
  course: CourseSummaryRecord,
  metrics: AggregatedCourseMetrics | undefined,
  viewerState?: ViewerCourseState,
): CourseListItem {
  const enrollment = viewerState?.enrollments.get(course.id);
  const accessStatus = enrollment?.accessStatus ?? "inactive";

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle ?? undefined,
    description: course.description,
    thumbnail: resolveStoredAssetUrl({ url: course.thumbnail }) ?? course.thumbnail,
    isPublished: course.isPublished,
    previewVideo: course.previewVideo ?? undefined,
    price: course.price,
    discountPrice: course.discountPrice ?? undefined,
    rating: metrics?.rating ?? 0,
    reviewsCount: metrics?.reviewsCount ?? 0,
    studentsCount: metrics?.activeStudents ?? 0,
    durationHours: course.durationHours,
    lessonsCount: course.lessonsCount,
    level: course.level,
    language: course.language,
    lastUpdated: formatUpdatedAt(course.lastUpdated ?? course.updatedAt),
    featured: course.featured,
    bestseller: course.bestseller,
    examPrep: course.examPrep,
    categoryId: course.categoryId,
    instructorId: course.instructorId,
    tags: [course.category.name, course.instructor.name, course.language],
    learningOutcomes: buildLearningOutcomes(course),
    requirements: buildRequirements(course),
    categoryName: course.category.name,
    categorySlug: course.category.slug,
    instructorName: course.instructor.name,
    instructorSlug: course.instructor.slug,
    instructorBio: course.instructor.bio ?? undefined,
    isWishlisted: viewerState?.wishlistedCourseIds.has(course.id) ?? false,
    isEnrolled: Boolean(enrollment),
    accessStatus,
    isAccessible: accessStatus === "active" && course.isPublished,
    learningHref: accessStatus === "active" ? `/learn/${course.slug}` : undefined,
  };
}

function mapCurriculum(course: CourseDetailsRecord): CurriculumChapter[] {
  return course.chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description ?? undefined,
    order: chapter.order,
    isPublished: chapter.isPublished,
    courseId: course.id,
    lessons: chapter.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      order: lesson.order,
      lessonType: lesson.lessonType,
      summary: lesson.summary ?? undefined,
      contentBody: lesson.contentBody ?? undefined,
      durationMinutes: lesson.durationMinutes,
      videoUrl:
        resolveStoredAssetUrl({
          url: lesson.videoAsset?.playbackUrl,
          storageKey: lesson.videoAsset?.storageKey,
        }) ?? lesson.videoAsset?.playbackUrl ?? undefined,
      videoAsset: lesson.videoAsset
        ? {
            id: lesson.videoAsset.id,
            lessonId: lesson.id,
            provider: lesson.videoAsset.provider,
            providerAssetId: lesson.videoAsset.providerAssetId ?? undefined,
            playbackUrl:
              resolveStoredAssetUrl({
                url: lesson.videoAsset.playbackUrl,
                storageKey: lesson.videoAsset.storageKey,
              }) ?? lesson.videoAsset.playbackUrl,
            thumbnailUrl:
              resolveStoredAssetUrl({
                url: lesson.videoAsset.thumbnailUrl,
                storageKey: lesson.videoAsset.storageKey,
              }) ?? lesson.videoAsset.thumbnailUrl ?? undefined,
            durationSeconds: lesson.videoAsset.durationSeconds ?? undefined,
            storageKey: lesson.videoAsset.storageKey ?? undefined,
            visibilityStatus: lesson.videoAsset.visibilityStatus,
          }
        : undefined,
      isPreview: lesson.isPreview,
      isPublished: lesson.isPublished,
      chapterId: chapter.id,
      quizRequired: lesson.quizRequired,
      resources: lesson.attachments.map((attachment) => attachment.title || attachment.fileName),
      attachments: lesson.attachments.map((attachment) => ({
        id: attachment.id,
        lessonId: lesson.id,
        title: attachment.title ?? undefined,
        fileName: attachment.fileName,
        fileUrl:
          resolveStoredAssetUrl({
            url: attachment.fileUrl,
            storageKey: attachment.storageKey,
          }) ?? attachment.fileUrl,
        storageKey: attachment.storageKey ?? undefined,
        provider: attachment.provider,
        mimeType: attachment.mimeType,
        fileSizeBytes: attachment.fileSizeBytes,
        order: attachment.order,
        isPublished: attachment.isPublished,
        allowDownload: attachment.allowDownload,
        visibilityStatus: attachment.visibilityStatus,
      })),
    })),
  }));
}

function getReviewEligibility(input: {
  viewer: CourseViewerContext;
  course: CourseListItem;
  currentUserReview?: CourseReviewItem;
}) {
  if (!input.viewer.isAuthenticated) {
    return {
      canReview: false,
      message: "سجّل الدخول بعد شراء الكورس حتى تتمكن من إضافة تقييمك.",
    };
  }

  if (input.viewer.role !== "student") {
    return {
      canReview: false,
      message: "إضافة التقييمات متاحة من حسابات الطلاب فقط.",
    };
  }

  if (!input.course.isEnrolled) {
    return {
      canReview: false,
      message: "يمكنك إضافة تقييم بعد شراء الكورس وظهوره داخل كورساتي.",
    };
  }

  if (input.course.accessStatus !== "active") {
    return {
      canReview: false,
      message: "يلزم وجود وصول نشط للكورس حتى تتمكن من إضافة تقييم.",
    };
  }

  if (input.currentUserReview) {
    return {
      canReview: false,
      message: "تم حفظ تقييمك لهذا الكورس بالفعل.",
    };
  }

  return {
    canReview: true,
    message: undefined,
  };
}

function normalizeDiscoveryValue(value?: string) {
  const trimmed = value?.trim();

  return trimmed && trimmed !== "all" ? trimmed : undefined;
}

function getEffectivePrice(course: Pick<Course, "price" | "discountPrice">) {
  return course.discountPrice ?? course.price;
}

function getMinimumRatingFilter(value?: CourseDiscoveryRating) {
  if (value === "4") {
    return 4;
  }

  if (value === "4.5") {
    return 4.5;
  }

  return 0;
}

async function getPublishedCourseFilterOptions() {
  const [categoryGroups, instructorGroups] = await Promise.all([
    prisma.course.groupBy({
      by: ["categoryId"],
      where: {
        isPublished: true,
        slug: {
          notIn: DEMO_COURSE_SLUGS,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.course.groupBy({
      by: ["instructorId"],
      where: {
        isPublished: true,
        slug: {
          notIn: DEMO_COURSE_SLUGS,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const [categories, instructors] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.instructor.findMany({
      where: {
        id: {
          in: instructorGroups.map((entry) => entry.instructorId),
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        title: true,
        specialization: true,
        avatar: true,
        bio: true,
      },
    }),
  ]);

  const categoryCountMap = new Map(categoryGroups.map((entry) => [entry.categoryId, entry._count._all]));
  const instructorCountMap = new Map(
    instructorGroups.map((entry) => [entry.instructorId, entry._count._all]),
  );

  return {
    categories: categories
      .map((category) => ({
        value: category.slug,
        label: category.name,
        count: categoryCountMap.get(category.id) ?? 0,
      })),
    instructors: instructors
      .map((instructor) => ({
        value: instructor.slug,
        label: instructor.name,
        count: instructorCountMap.get(instructor.id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ar")),
  };
}

// Discovery queries stay server-side so filtering, search, sorting, and pagination
// always come from PostgreSQL instead of static client data.
export async function discoverPublicCourses(
  input: CourseDiscoveryQuery = {},
  viewer?: CourseViewerContext,
): Promise<CourseDiscoveryResult> {
  const normalizedQuery = normalizeDiscoveryValue(input.query);
  const normalizedCategory = normalizeDiscoveryValue(input.category);
  const normalizedInstructor = normalizeDiscoveryValue(input.instructor);
  const price = input.price ?? "all";
  const rating = input.rating ?? "all";
  const sort = input.sort ?? "popular";
  const requestedPage = input.page ?? 1;
  const pageSize = clamp(input.pageSize ?? 9, 1, 24);

  const where: Prisma.CourseWhereInput = {
    isPublished: true,
    slug: {
      notIn: DEMO_COURSE_SLUGS,
    },
    ...(normalizedCategory
      ? {
          category: {
            slug: normalizedCategory,
          },
        }
      : {}),
    ...(normalizedInstructor
      ? {
          instructor: {
            slug: normalizedInstructor,
          },
        }
      : {}),
    ...(normalizedQuery
      ? {
          OR: [
            { title: { contains: normalizedQuery, mode: "insensitive" } },
            { subtitle: { contains: normalizedQuery, mode: "insensitive" } },
            { description: { contains: normalizedQuery, mode: "insensitive" } },
            {
              instructor: {
                OR: [
                  { name: { contains: normalizedQuery, mode: "insensitive" } },
                  { title: { contains: normalizedQuery, mode: "insensitive" } },
                  { specialization: { contains: normalizedQuery, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const sourceCourses = await prisma.course.findMany({
    where,
    include: courseSummaryInclude,
  });

  const courseIds = sourceCourses.map((course) => course.id);
  const [metrics, viewerState, filterOptions] = await Promise.all([
    aggregateCourseMetrics(courseIds),
    viewer?.isAuthenticated && viewer.role === "student"
      ? getViewerCourseState(viewer.userId, courseIds)
      : Promise.resolve(undefined),
    getPublishedCourseFilterOptions(),
  ]);

  const minimumRating = getMinimumRatingFilter(rating);
  let rows = sourceCourses
    .map((course) => ({
      source: course,
      mapped: mapCourseSummary(course, metrics.get(course.id), viewerState),
    }))
    .filter((entry) => {
      const effectivePrice = getEffectivePrice(entry.mapped);
      const matchesPrice =
        price === "all" ||
        (price === "free" && effectivePrice === 0) ||
        (price === "paid" && effectivePrice > 0);
      const matchesRating = !minimumRating || entry.mapped.rating >= minimumRating;

      return matchesPrice && matchesRating;
    });

  rows = rows.sort((left, right) => {
    switch (sort) {
      case "newest":
        return right.source.updatedAt.getTime() - left.source.updatedAt.getTime();
      case "rating":
        return right.mapped.rating - left.mapped.rating || right.mapped.reviewsCount - left.mapped.reviewsCount;
      case "price-low":
        return getEffectivePrice(left.mapped) - getEffectivePrice(right.mapped);
      case "price-high":
        return getEffectivePrice(right.mapped) - getEffectivePrice(left.mapped);
      case "popular":
      default:
        return right.mapped.studentsCount - left.mapped.studentsCount || right.mapped.rating - left.mapped.rating;
    }
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = clamp(requestedPage, 1, totalPages);
  const start = (page - 1) * pageSize;
  const paginatedCourses = rows.slice(start, start + pageSize).map((entry) => entry.mapped);

  return {
    courses: paginatedCourses,
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    filters: filterOptions,
    applied: {
      query: normalizedQuery,
      category: normalizedCategory,
      price,
      instructor: normalizedInstructor,
      rating,
      sort,
      page,
      pageSize,
    },
  };
}

export async function searchPublicCourses(query: string): Promise<CourseSearchResultGroup> {
  const normalizedQuery = query.trim();
  const courseResult = await discoverPublicCourses(
    {
      query: normalizedQuery,
      sort: normalizedQuery ? "popular" : "newest",
      page: 1,
      pageSize: 8,
    },
    { isAuthenticated: false },
  );

  const [categories, instructors] = await Promise.all([
    normalizedQuery
      ? prisma.category.findMany({
          where: {
            OR: [
              { name: { contains: normalizedQuery, mode: "insensitive" } },
              { description: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: {
            name: "asc",
          },
        })
      : prisma.category.findMany({
          take: 5,
          orderBy: {
            name: "asc",
          },
        }),
    normalizedQuery
      ? prisma.instructor.findMany({
          where: {
            OR: [
              { name: { contains: normalizedQuery, mode: "insensitive" } },
              { title: { contains: normalizedQuery, mode: "insensitive" } },
              { specialization: { contains: normalizedQuery, mode: "insensitive" } },
              { bio: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: {
            name: "asc",
          },
        })
      : prisma.instructor.findMany({
          take: 5,
          orderBy: {
            name: "asc",
          },
        }),
  ]);

  return {
    courses: courseResult.courses,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      icon: category.icon ?? undefined,
    })),
    instructors: instructors.map((instructor) => ({
      id: instructor.id,
      name: instructor.name,
      slug: instructor.slug,
      title: instructor.title ?? undefined,
      avatar: resolveInstructorAvatar(instructor.avatar ?? undefined, instructor.slug, instructor.name),
      bio: instructor.bio ?? undefined,
      specialization: instructor.specialization ?? undefined,
    })),
  };
}

export async function listFeaturedCourses(viewer?: CourseViewerContext, limit = 6) {
  const sourceCourses = await prisma.course.findMany({
    where: {
      isPublished: true,
      featured: true,
      slug: {
        notIn: DEMO_COURSE_SLUGS,
      },
    },
    include: courseSummaryInclude,
    orderBy: [{ bestseller: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  const courseIds = sourceCourses.map((course) => course.id);
  const [metrics, viewerState] = await Promise.all([
    aggregateCourseMetrics(courseIds),
    viewer?.isAuthenticated && viewer.role === "student"
      ? getViewerCourseState(viewer.userId, courseIds)
      : Promise.resolve(undefined),
  ]);

  return sourceCourses.map((course) => mapCourseSummary(course, metrics.get(course.id), viewerState));
}

export async function listRelatedCoursesByCourseId(courseId: string, viewer?: CourseViewerContext) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      categoryId: true,
      instructorId: true,
      examPrep: true,
    },
  });

  if (!course) {
    return undefined;
  }

  const relatedSource = await prisma.course.findMany({
    where: {
      id: {
        not: course.id,
      },
      isPublished: true,
      slug: {
        notIn: DEMO_COURSE_SLUGS,
      },
      OR: [
        { categoryId: course.categoryId },
        { instructorId: course.instructorId },
        { examPrep: course.examPrep },
      ],
    },
    include: courseSummaryInclude,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 4,
  });

  const relatedCourseIds = relatedSource.map((item) => item.id);
  const [relatedMetrics, relatedViewerState] = await Promise.all([
    aggregateCourseMetrics(relatedCourseIds),
    viewer?.isAuthenticated && viewer.role === "student"
      ? getViewerCourseState(viewer.userId, relatedCourseIds)
      : Promise.resolve(undefined),
  ]);

  return relatedSource.map((item) =>
    mapCourseSummary(item, relatedMetrics.get(item.id), relatedViewerState),
  );
}

export async function getCourseCardList(courseIds: string[], viewer?: CourseViewerContext) {
  if (!courseIds.length) {
    return [];
  }

  const [courses, metrics, viewerState] = await Promise.all([
    prisma.course.findMany({
      where: {
        id: {
          in: courseIds,
        },
        isPublished: true,
        slug: {
          notIn: DEMO_COURSE_SLUGS,
        },
      },
      include: courseSummaryInclude,
    }),
    aggregateCourseMetrics(courseIds),
    viewer?.isAuthenticated && viewer.role === "student"
      ? getViewerCourseState(viewer.userId, courseIds)
      : Promise.resolve(undefined),
  ]);

  return courses.map((course) => mapCourseSummary(course, metrics.get(course.id), viewerState));
}

// All student-facing course data comes from PostgreSQL through Prisma.
// The viewer is optional so public pages can still render without trusting the client.
export async function getCourseDetailsBySlug(slug: string, viewer?: CourseViewerContext): Promise<CourseDetailsView | undefined> {
  if (isDemoCourseSlug(slug)) {
    return undefined;
  }

  const course = await prisma.course.findUnique({
    where: { slug },
    include: courseDetailsInclude,
  });

  if (!course) {
    return undefined;
  }

  const privilegedViewer = viewer?.isAuthenticated && viewer.role !== "student";

  if (!course.isPublished && !privilegedViewer) {
    return undefined;
  }

  const [metrics, viewerState, reviews, instructorStudentsCount] = await Promise.all([
    aggregateCourseMetrics([course.id]),
    viewer?.isAuthenticated && viewer.role === "student"
      ? getViewerCourseState(viewer.userId, [course.id])
      : Promise.resolve(undefined),
    prisma.review.findMany({
      where: {
        courseId: course.id,
      },
      include: reviewInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.enrollment.count({
      where: {
        accessStatus: "active",
        course: {
          instructorId: course.instructorId,
        },
      },
    }),
  ]);

  const mappedCourse = mapCourseSummary(course, metrics.get(course.id), viewerState);
  const currentUserReview =
    viewer?.isAuthenticated && viewer.role === "student"
      ? reviews.find((review) => review.userId === viewer.userId)
      : undefined;

  const relatedSource = await prisma.course.findMany({
    where: {
      id: {
        not: course.id,
      },
      isPublished: true,
      slug: {
        notIn: DEMO_COURSE_SLUGS,
      },
      OR: [
        { categoryId: course.categoryId },
        { instructorId: course.instructorId },
        { examPrep: course.examPrep },
      ],
    },
    include: courseSummaryInclude,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 4,
  });

  const relatedCourseIds = relatedSource.map((item) => item.id);
  const [relatedMetrics, relatedViewerState] = await Promise.all([
    aggregateCourseMetrics(relatedCourseIds),
    viewer?.isAuthenticated && viewer.role === "student"
      ? getViewerCourseState(viewer.userId, relatedCourseIds)
      : Promise.resolve(undefined),
  ]);

  const reviewEligibility = getReviewEligibility({
    viewer: viewer ?? { isAuthenticated: false },
    course: mappedCourse,
    currentUserReview: currentUserReview ? mapReview(currentUserReview) : undefined,
  });

  return {
    course: mappedCourse,
    curriculum: mapCurriculum(course),
    instructor: {
      id: course.instructor.id,
      name: course.instructor.name,
      slug: course.instructor.slug,
      title: course.instructor.title ?? undefined,
      avatar: resolveInstructorAvatar(
        course.instructor.avatar ?? undefined,
        course.instructor.slug,
        course.instructor.name,
      ),
      bio: course.instructor.bio ?? undefined,
      specialization: course.instructor.specialization ?? undefined,
      coursesCount: await prisma.course.count({
        where: {
          instructorId: course.instructor.id,
          isPublished: true,
          slug: {
            notIn: DEMO_COURSE_SLUGS,
          },
        },
      }),
      studentsCount: instructorStudentsCount,
    },
    reviews: reviews.map(mapReview),
    relatedCourses: relatedSource.map((item) =>
      mapCourseSummary(item, relatedMetrics.get(item.id), relatedViewerState),
    ),
    currentUserReview: currentUserReview ? mapReview(currentUserReview) : undefined,
    canReview: reviewEligibility.canReview,
    reviewEligibilityMessage: reviewEligibility.message,
    canManageWishlist: Boolean(viewer?.isAuthenticated && viewer.role === "student"),
  };
}

export async function listWishlistCourses(userId: string) {
  const wishlistRows = await prisma.wishlist.findMany({
    where: {
      userId,
      course: {
        isPublished: true,
        slug: {
          notIn: DEMO_COURSE_SLUGS,
        },
      },
    },
    include: {
      course: {
        include: courseSummaryInclude,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const courseIds = wishlistRows.map((item) => item.courseId);
  const [metrics, viewerState] = await Promise.all([
    aggregateCourseMetrics(courseIds),
    getViewerCourseState(userId, courseIds),
  ]);

  return wishlistRows.map((item) => mapCourseSummary(item.course, metrics.get(item.courseId), viewerState));
}

export async function toggleWishlistCourse(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      isPublished: true,
      slug: true,
    },
  });

  if (!course || !course.isPublished || isDemoCourseSlug(course.slug)) {
    return {
      ok: false as const,
      reason: "not_found" as const,
    };
  }

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: {
        id: existing.id,
      },
    });

    return {
      ok: true as const,
      active: false,
    };
  }

  await prisma.wishlist.create({
    data: {
      userId,
      courseId,
    },
  });

  return {
    ok: true as const,
    active: true,
  };
}

export async function listCourseReviews(courseId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      courseId,
    },
    include: reviewInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews.map(mapReview);
}

export async function createCourseReview(
  userId: string,
  courseId: string,
  input: {
    rating: number;
    comment: string;
  },
) {
  const [course, enrollment, existingReview] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        isPublished: true,
        slug: true,
      },
    }),
    prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        accessStatus: true,
      },
    }),
    prisma.review.findFirst({
      where: {
        userId,
        courseId,
      },
      include: reviewInclude,
    }),
  ]);

  if (!course || !course.isPublished || isDemoCourseSlug(course.slug)) {
    return {
      ok: false as const,
      reason: "not_found" as const,
    };
  }

  if (!enrollment || enrollment.accessStatus !== "active") {
    return {
      ok: false as const,
      reason: "not_enrolled" as const,
    };
  }

  if (existingReview) {
    return {
      ok: false as const,
      reason: "duplicate" as const,
      review: mapReview(existingReview),
    };
  }

  const created = await prisma.review.create({
    data: {
      userId,
      courseId,
      rating: input.rating,
      comment: input.comment.trim(),
    },
    include: reviewInclude,
  });

  return {
    ok: true as const,
    review: mapReview(created),
  };
}
