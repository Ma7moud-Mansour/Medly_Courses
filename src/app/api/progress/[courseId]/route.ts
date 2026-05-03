import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { getStudentCourseProgress } from "@/lib/student/repository";

type Params = Promise<{ courseId: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const session = await requireServerSession();
  const { courseId } = await params;
  const progress = await getStudentCourseProgress(session.userId, courseId);

  if (!progress) {
    return NextResponse.json({ error: "Course progress was not found." }, { status: 404 });
  }

  return NextResponse.json({ data: progress });
}
