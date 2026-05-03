import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth/auth-service";
import { createEmailCodeChallenge } from "@/lib/auth/email-auth";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validators/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete the required fields correctly.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const requestedRedirect =
    typeof payload.redirectTo === "string" ? payload.redirectTo : undefined;

  try {
    const challenge = await createEmailCodeChallenge({
      email,
      purpose: "register",
      redirectTo: requestedRedirect,
      pendingName: parsed.data.name.trim(),
      pendingPhone: parsed.data.phone?.trim() || undefined,
      pendingPasswordHash: passwordHash,
    });

    return NextResponse.json(
      {
        data: {
          ...challenge,
          message: "We sent a verification code to your email to finish creating your account.",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We couldn't send the verification code right now.";
    const status = message.toLowerCase().includes("wait") ? 429 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
