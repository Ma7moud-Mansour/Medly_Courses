import {
  courses,
  enrichedCategories,
  enrichedInstructors,
  getCategoryById,
  getInstructorById,
} from "@/data/medly";
import type { Course, CourseLevel, SearchResultGroup } from "@/types";

export type CourseQuery = {
  query?: string;
  category?: string;
  year?: string;
  level?: CourseLevel | "all";
  price?: "all" | "free" | "paid" | "discount";
  sort?: "popular" | "newest" | "rating" | "price-low" | "price-high";
};

function normalize(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function priceOf(course: Course) {
  return course.discountPrice ?? course.price;
}

export function getCourseMeta(course: Course) {
  return {
    category: getCategoryById(course.categoryId),
    instructor: getInstructorById(course.instructorId),
  };
}

export function filterCourses(query: CourseQuery = {}) {
  const text = normalize(query.query);

  const filtered = courses.filter((course) => {
    const { category, instructor } = getCourseMeta(course);
    const haystack = normalize(
      [
        course.title,
        course.subtitle,
        course.description,
        course.year,
        course.tags.join(" "),
        category?.name,
        instructor?.name,
      ].join(" "),
    );

    const matchesText = !text || haystack.includes(text);
    const matchesCategory =
      !query.category || query.category === "all" || category?.slug === query.category;
    const matchesYear = !query.year || query.year === "all" || course.year === query.year;
    const matchesLevel = !query.level || query.level === "all" || course.level === query.level;
    const matchesPrice =
      !query.price ||
      query.price === "all" ||
      (query.price === "free" && priceOf(course) === 0) ||
      (query.price === "paid" && priceOf(course) > 0) ||
      (query.price === "discount" && Boolean(course.discountPrice));

    return matchesText && matchesCategory && matchesYear && matchesLevel && matchesPrice;
  });

  return filtered.sort((a, b) => {
    switch (query.sort) {
      case "newest":
        return b.id.localeCompare(a.id);
      case "rating":
        return b.rating - a.rating;
      case "price-low":
        return priceOf(a) - priceOf(b);
      case "price-high":
        return priceOf(b) - priceOf(a);
      case "popular":
      default:
        return b.studentsCount - a.studentsCount;
    }
  });
}

export function searchMedly(query: string): SearchResultGroup {
  const text = normalize(query);

  if (!text) {
    return {
      courses: courses.slice(0, 5),
      categories: enrichedCategories.slice(0, 4),
      instructors: enrichedInstructors.slice(0, 4),
    };
  }

  const rankedCourses = courses
    .map((course) => {
      const { category, instructor } = getCourseMeta(course);
      const title = normalize(course.title);
      const instructorName = normalize(instructor?.name);
      const categoryName = normalize(category?.name);
      const description = normalize(course.description);
      const score =
        title === text
          ? 100
          : title.includes(text)
            ? 80
            : instructorName.includes(text)
              ? 55
              : categoryName.includes(text)
                ? 45
                : description.includes(text)
                  ? 25
                  : 0;

      return { course, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.course);

  return {
    courses: rankedCourses.slice(0, 8),
    categories: enrichedCategories
      .filter((category) => normalize(category.name + category.description).includes(text))
      .slice(0, 5),
    instructors: enrichedInstructors
      .filter((instructor) =>
        normalize([instructor.name, instructor.specialization, instructor.bio].join(" ")).includes(
          text,
        ),
      )
      .slice(0, 5),
  };
}

export const courseYears = Array.from(new Set(courses.map((course) => course.year).filter(Boolean)));
