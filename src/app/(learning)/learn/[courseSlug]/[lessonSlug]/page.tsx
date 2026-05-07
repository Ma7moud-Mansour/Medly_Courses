import { redirect } from "next/navigation";
import { CoursePlayer } from "@/components/course/course-player";
import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getAuthorizedLessonContent } from "@/lib/content/repository";

type Params = Promise<{ courseSlug: string; lessonSlug: string }>;

export default async function LearnLessonPage({ params }: { params: Params }) {
  const { courseSlug, lessonSlug } = await params;
  const session = await getServerSessionUser();

  if (!session.isAuthenticated || !session.userId) {
    redirect(`/login?redirect=${encodeURIComponent(`/learn/${courseSlug}/${lessonSlug}`)}`);
  }

  const learningCourse = await getAuthorizedLessonContent(session.userId, courseSlug, lessonSlug);

  if (!learningCourse) {
    redirect(`/courses/${encodeURIComponent(courseSlug)}`);
  }

  const lesson = learningCourse.currentLesson;

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
