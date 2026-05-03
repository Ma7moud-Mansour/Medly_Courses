import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { listStudentCourses } from "@/lib/student/repository";

export async function GET() {
  const session = await requireServerSession();
  const courses = await listStudentCourses(session.userId);

  if (!courses) {
    return NextResponse.json({ error: "Student data was not found." }, { status: 404 });
  }

  return NextResponse.json({ data: courses });
}
