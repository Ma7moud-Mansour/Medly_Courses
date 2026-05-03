import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  authUserSelect,
  createSessionForUser,
  mapAuthenticatedUser,
  normalizeEmail,
} from "@/lib/auth/auth-service";
import { createEmailCodeChallenge } from "@/lib/auth/email-auth";
import { resolvePostAuthRedirect } from "@/lib/auth/redirects";
import { setSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validators/schemas";

function getRequestMeta(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? undefined,
  };
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your email and password.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...authUserSelect,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.status !== "active") {
    return NextResponse.json(
      { error: "This account is currently blocked or suspended." },
      { status: 403 },
    );
  }

  const passwordValid = await verifyPassword(user.passwordHash, parsed.data.password);

  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const requestedRedirect =
    typeof payload.redirectTo === "string" ? payload.redirectTo : undefined;

  if (!user.emailVerified) {
    if (payload.resendCode) {
      try {
        const challenge = await createEmailCodeChallenge({
          email,
          purpose: "login",
          userId: user.id,
          redirectTo: requestedRedirect,
        });

        return NextResponse.json({
          data: {
            ...challenge,
            message: "We sent a new verification code to your email.",
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "We couldn't send the verification code right now.";
        const status = message.toLowerCase().includes("wait") ? 429 : 500;

        return NextResponse.json({ error: message }, { status });
      }
    }

    return NextResponse.json(
      { error: "Your email is not verified.", code: "UNVERIFIED_EMAIL" },
      { status: 403 },
    );
  }

  const requestMeta = getRequestMeta(request);
  const { token, expiresAt } = await createSessionForUser(user, {
    ...requestMeta,
    rememberMe: parsed.data.rememberMe,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  const redirectTo = resolvePostAuthRedirect(
    user.role,
    requestedRedirect,
  );
  const response = NextResponse.json({
    data: {
      user: mapAuthenticatedUser({ ...user, lastLoginAt: new Date() }),
      redirectTo,
    },
  });

  setSessionCookie(response, token, expiresAt);

  return response;
}
