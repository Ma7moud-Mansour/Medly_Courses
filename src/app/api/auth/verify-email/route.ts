import { NextResponse, type NextRequest } from "next/server";
import {
  consumeEmailCodeChallenge,
  resendEmailCodeChallenge,
  type EmailAuthCodePurpose,
} from "@/lib/auth/email-auth";
import { setSessionCookie } from "@/lib/auth/session";
import {
  resendEmailCodeSchema,
  verifyEmailCodeSchema,
} from "@/lib/validators/schemas";

function getRequestMeta(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? undefined,
  };
}

function normalizePurpose(value: unknown): EmailAuthCodePurpose {
  return value === "login" ? "login" : "register";
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
  }

  const intent = payload.intent === "resend" ? "resend" : "verify";

  if (intent === "resend") {
    const parsed = resendEmailCodeSchema.safeParse({
      email: payload.email,
      purpose: normalizePurpose(payload.purpose),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address before requesting a new code." },
        { status: 400 },
      );
    }

    try {
      const challenge = await resendEmailCodeChallenge(parsed.data);

      return NextResponse.json({
        data: {
          ...challenge,
          message: "A new verification code was sent to your email.",
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't send a new verification code right now.";
      const status = message.toLowerCase().includes("wait") ? 429 : 400;

      return NextResponse.json({ error: message }, { status });
    }
  }

  const parsed = verifyEmailCodeSchema.safeParse({
    email: payload.email,
    code: payload.code,
    purpose: normalizePurpose(payload.purpose),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the 6-digit code exactly as it was sent to your email." },
      { status: 400 },
    );
  }

  try {
    const session = await consumeEmailCodeChallenge({
      ...parsed.data,
      requestMeta: getRequestMeta(request),
    });

    const response = NextResponse.json({
      data: {
        user: session.user,
        redirectTo: session.redirectTo,
      },
    });

    setSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The verification code could not be confirmed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
