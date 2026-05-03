import { notFound } from "next/navigation";
import { CoursePlayer } from "@/components/course/course-player";
import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { requireServerSession } from "@/lib/auth/server-session";
import { getLearningCourseBySlug } from "@/lib/student/repository";

type Params = Promise<{ courseSlug: string; lessonSlug: string }>;

export default async function LearnLessonPage({ params }: { params: Params }) {
  const session = await requireServerSession();
  const { courseSlug, lessonSlug } = await params;
  const learningCourse = await getLearningCourseBySlug(session.userId, courseSlug);

  if (!learningCourse) {
    notFound();
  }

  const lesson = learningCourse.curriculum
    .flatMap((chapter) => chapter.lessons)
    .find((item) => item.slug === lessonSlug);

  if (!lesson) {
    notFound();
  }

  const completedLessonIds = Object.entries(learningCourse.lessonProgress)
    .filter(([, progress]) => progress.completed)
    .map(([lessonId]) => lessonId);

  return (
    <div className="lg:grid lg:grid-cols-[340px_1fr]">
      <LessonSidebar
        course={learningCourse.course}
        curriculum={learningCourse.curriculum}
        currentLesson={lesson}
        completedLessonIds={completedLessonIds}
      />
      <CoursePlayer
        course={learningCourse.course}
        lesson={lesson}
        permissions={learningCourse.permissions}
        watermark={learningCourse.watermark}
        enrollmentId={learningCourse.enrollment.id}
        initialCompleted={Boolean(learningCourse.lessonProgress[lesson.id]?.completed)}
      />
    </div>
  );
}
