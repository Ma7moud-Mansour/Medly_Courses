import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { listStudentNotifications } from "@/lib/student/repository";

export async function GET() {
  const session = await requireServerSession();
  const notifications = await listStudentNotifications(session.userId);

  return NextResponse.json({ data: notifications });
}
