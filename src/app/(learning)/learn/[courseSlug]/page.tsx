import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getLearningCourseBySlug } from "@/lib/student/repository";

type Params = Promise<{ courseSlug: string }>;

export default async function LearnCoursePage({ params }: { params: Params }) {
  const { courseSlug } = await params;
  const session = await getServerSessionUser();

  if (!session.isAuthenticated || !session.userId) {
    redirect(`/login?redirect=${encodeURIComponent(`/learn/${courseSlug}`)}`);
  }

  const learningCourse = await getLearningCourseBySlug(session.userId, courseSlug);

  if (!learningCourse) {
    redirect(`/courses/${encodeURIComponent(courseSlug)}`);
  }

  const firstLesson = learningCourse.curriculum[0]?.lessons[0];

  if (!firstLesson) {
    redirect(`/courses/${encodeURIComponent(learningCourse.course.slug)}`);
  }

  redirect(`/learn/${encodeURIComponent(learningCourse.course.slug)}/${encodeURIComponent(firstLesson.slug)}`);
}
