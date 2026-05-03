import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { authUserSelect, mapAuthenticatedUser } from "@/lib/auth/auth-service";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import type { User, UserRole, UserStatus } from "@/types";

type ServerSessionUser = {
  sessionId?: string;
  role?: UserRole;
  userId?: string;
  email?: string;
  status?: UserStatus;
  user?: User;
  isAuthenticated: boolean;
};

type AuthenticatedServerSession = {
  sessionId: string;
  role: UserRole;
  userId: string;
  email: string;
  status?: UserStatus;
  user: User;
  isAuthenticated: true;
};

export const getServerSessionUser = cache(async (): Promise<ServerSessionUser> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);

  if (!payload) {
    return {
      isAuthenticated: false,
    };
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: {
      user: {
        select: authUserSelect,
      },
    },
  });

  if (
    !session ||
    session.userId !== payload.uid ||
    session.user.email !== payload.email ||
    session.expiresAt <= new Date() ||
    session.user.status !== "active"
  ) {
    return {
      isAuthenticated: false,
    };
  }

  const user = mapAuthenticatedUser(session.user);

  return {
    sessionId: session.id,
    role: user.role,
    userId: user.id,
    email: user.email,
    status: user.status,
    user,
    isAuthenticated: true,
  };
});

export const getSession = getServerSessionUser;

export async function requireServerSession(): Promise<AuthenticatedServerSession> {
  const session = await getServerSessionUser();

  if (!session.isAuthenticated || !session.user || !session.userId || !session.role || !session.email || !session.sessionId) {
    throw new Error("Unauthorized");
  }

  return {
    sessionId: session.sessionId,
    role: session.role,
    userId: session.userId,
    email: session.email,
    status: session.status,
    user: session.user,
    isAuthenticated: true,
  };
}

export async function requireServerRole(allowedRoles: UserRole[]): Promise<AuthenticatedServerSession> {
  const session = await requireServerSession();

  if (!allowedRoles.includes(session.role)) {
    throw new Error("Unauthorized admin action");
  }

  return session;
}
