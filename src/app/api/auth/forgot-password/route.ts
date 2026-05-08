import { NextResponse } from "next/server";
import { requestPasswordResetChallenge } from "@/lib/auth/email-auth";
import { forgotPasswordSchema } from "@/lib/validators/schemas";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid password reset request." }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: payload.email,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const challenge = await requestPasswordResetChallenge(parsed.data.email);

    return NextResponse.json({
      data: {
        email: challenge.email,
        redirectTo: challenge.redirectTo,
        message:
          payload.intent === "resend"
            ? "We sent a new password reset code to your email."
            : "We sent a password reset code to your email.",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We couldn't send the password reset code right now.";
    const status = message.includes("wait 15 seconds") ? 429 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
