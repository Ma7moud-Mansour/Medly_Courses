import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { getAuthorizedLessonContent } from "@/lib/content/repository";

type Params = Promise<{ courseSlug: string; lessonSlug: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const session = await requireServerSession();
  const { courseSlug, lessonSlug } = await params;
  const payload = await getAuthorizedLessonContent(session.userId, courseSlug, lessonSlug);

  if (!payload) {
    return NextResponse.json({ error: "Lesson not available for this student." }, { status: 404 });
  }

  return NextResponse.json({ data: payload });
}
