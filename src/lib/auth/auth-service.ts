import { prisma } from "@/lib/db";
import { getSessionExpiryDate, signSessionToken } from "@/lib/auth/session";
import type { User, UserRole, UserStatus } from "@/types";

export const authUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  status: true,
  phone: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
} as const;

export type AuthenticatedDatabaseUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

export type SessionRequestMetadata = {
  userAgent?: string;
  ipAddress?: string;
  rememberMe?: boolean;
};

function toIso(value?: Date | null) {
  return value?.toISOString();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function mapAuthenticatedUser(user: AuthenticatedDatabaseUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? undefined,
    role: user.role,
    status: user.status,
    phone: user.phone ?? undefined,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: toIso(user.lastLoginAt),
  };
}

export async function createSessionForUser(
  user: Pick<AuthenticatedDatabaseUser, "id" | "email" | "role">,
  requestMeta: SessionRequestMetadata = {},
) {
  const expiresAt = getSessionExpiryDate(requestMeta.rememberMe);

  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt,
      userAgent: requestMeta.userAgent,
      ipAddress: requestMeta.ipAddress,
    },
  });

  const token = await signSessionToken({
    sessionId: session.id,
    userId: user.id,
    role: user.role,
    email: user.email,
    expiresAt,
  });

  return {
    sessionId: session.id,
    token,
    expiresAt,
  };
}

export const createSession = createSessionForUser;

export async function deleteSessionById(sessionId?: string) {
  if (!sessionId) {
    return;
  }

  await prisma.session.deleteMany({
    where: { id: sessionId },
  });
}
