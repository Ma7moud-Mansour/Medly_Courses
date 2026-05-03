import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { NextResponse } from "next/server";
import type { UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "medly-session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const LONG_SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_ISSUER = "medly";
const SESSION_AUDIENCE = "medly-app";

type SessionPayload = JWTPayload & {
  sid: string;
  uid: string;
  role: UserRole;
  email: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "medly-dev-auth-secret-change-me";
  }

  return undefined;
}

function getSigningKey() {
  const secret = getAuthSecret();

  if (!secret) {
    throw new Error("AUTH_SECRET is required for authenticated sessions in production.");
  }

  return new TextEncoder().encode(secret);
}

function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function getSessionExpiryDate(rememberMe?: boolean) {
  return new Date(Date.now() + (rememberMe ? LONG_SESSION_DURATION_MS : SESSION_DURATION_MS));
}

export async function signSessionToken(input: {
  sessionId: string;
  userId: string;
  role: UserRole;
  email: string;
  expiresAt: Date;
}) {
  return new SignJWT({
    sid: input.sessionId,
    uid: input.userId,
    role: input.role,
    email: input.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(input.expiresAt)
    .sign(getSigningKey());
}

export async function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const secret = getAuthSecret();

  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, new TextEncoder().encode(secret), {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (!payload.sid || !payload.uid || !payload.role || !payload.email) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt));
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(new Date(0)),
    maxAge: 0,
  });
}

export const clearSession = clearSessionCookie;
