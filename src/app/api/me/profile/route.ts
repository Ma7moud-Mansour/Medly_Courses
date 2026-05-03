import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { getStudentProfile, updateStudentProfile } from "@/lib/student/repository";
import { studentProfileSettingsSchema } from "@/lib/validators/schemas";

export async function GET() {
  const session = await requireServerSession();
  const profile = await getStudentProfile(session.userId);

  if (!profile) {
    return NextResponse.json({ error: "Profile was not found." }, { status: 404 });
  }

  return NextResponse.json({ data: profile });
}

export async function PATCH(request: Request) {
  const session = await requireServerSession();
  const payload = await request.json();
  const parsed = studentProfileSettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please review the profile fields.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const profile = await updateStudentProfile(session.userId, parsed.data);

  return NextResponse.json({ data: profile });
}
