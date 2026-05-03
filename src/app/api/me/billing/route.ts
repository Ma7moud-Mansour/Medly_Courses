import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { listStudentBilling } from "@/lib/student/repository";

export async function GET() {
  const session = await requireServerSession();
  const billing = await listStudentBilling(session.userId);

  return NextResponse.json({ data: billing });
}
