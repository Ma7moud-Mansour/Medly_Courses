import { notFound, redirect } from "next/navigation";
import { requireServerSession } from "@/lib/auth/server-session";
import { getLearningCourseBySlug } from "@/lib/student/repository";

type Params = Promise<{ courseSlug: string }>;

export default async function LearnCoursePage({ params }: { params: Params }) {
  const session = await requireServerSession();
  const { courseSlug } = await params;
  const learningCourse = await getLearningCourseBySlug(session.userId, courseSlug);

  if (!learningCourse) {
    notFound();
  }

  const firstLesson = learningCourse.curriculum[0]?.lessons[0];

  if (!firstLesson) {
    notFound();
  }

  redirect(`/learn/${learningCourse.course.slug}/${firstLesson.slug}`);
}
