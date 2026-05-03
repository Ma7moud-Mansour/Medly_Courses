import { CourseGrid } from "@/components/course/course-grid";
import type { Course } from "@/types";

export function RelatedCourses({ courses }: { courses: Course[] }) {
  if (!courses.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-5 text-sm font-bold text-muted-foreground">
        لا توجد كورسات مرتبطة متاحة الآن. بمجرد إضافة كورسات أخرى من نفس المسار ستظهر هنا تلقائيًا.
      </div>
    );
  }

  return <CourseGrid courses={courses} />;
}
