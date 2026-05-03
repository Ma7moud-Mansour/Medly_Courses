import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { markLessonComplete } from "@/lib/student/repository";

export async function POST(request: Request) {
  const session = await requireServerSession();
  const payload = await request.json();

  if (typeof payload.lessonId !== "string" || !payload.lessonId.trim()) {
    return NextResponse.json({ error: "Lesson id is required." }, { status: 400 });
  }

  const result = await markLessonComplete(session.userId, payload.lessonId);

  if (!result) {
    return NextResponse.json({ error: "This lesson is not available for this student." }, { status: 403 });
  }

  return NextResponse.json({ data: result });
}
