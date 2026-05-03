import { MyCoursesClient } from "@/components/dashboard/my-courses-client";
import { requireServerSession } from "@/lib/auth/server-session";
import { listStudentCourses } from "@/lib/student/repository";

export default async function MyCoursesPage() {
  const session = await requireServerSession();
  const courses = await listStudentCourses(session.userId);

  if (!courses) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
        تعذر تحميل كورسات هذا الحساب الآن.
      </div>
    );
  }

  return (
    <MyCoursesClient
      activeCourses={courses.activeCourses}
      unavailableCourses={courses.unavailableCourses}
      customNote={
        courses.activeCourses[0]?.permissions.customNote ??
        courses.unavailableCourses[0]?.permissions.customNote
      }
    />
  );
}
