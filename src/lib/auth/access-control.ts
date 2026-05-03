import type { UserRole } from "@/types";

export const publicRoutes = [
  "/",
  "/courses",
  "/categories",
  "/instructors",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export const authRequiredPrefixes = [
  "/dashboard",
  "/checkout",
  "/exams",
  "/learn",
  "/api/me",
  "/api/progress",
  "/api/wishlist",
];

const adminRoleMatrix: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin/students", roles: ["admin", "support"] },
  { prefix: "/admin/tickets", roles: ["admin", "support"] },
  { prefix: "/admin/audit-logs", roles: ["admin", "support"] },
  { prefix: "/api/admin/students", roles: ["admin", "support"] },
  { prefix: "/api/admin/tickets", roles: ["admin", "support"] },
  { prefix: "/api/admin/audit-logs", roles: ["admin", "support"] },
  { prefix: "/admin", roles: ["admin", "support"] },
  { prefix: "/api/admin", roles: ["admin", "support"] },
];

export function getAllowedRolesForPath(pathname: string) {
  return adminRoleMatrix.find((entry) => pathname.startsWith(entry.prefix))?.roles;
}

export function canAccessPath({
  pathname,
  authenticated,
  role,
}: {
  pathname: string;
  authenticated: boolean;
  role?: UserRole;
}) {
  const allowedRoles = getAllowedRolesForPath(pathname);

  if (allowedRoles) {
    return authenticated && Boolean(role && allowedRoles.includes(role));
  }

  if (authRequiredPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return authenticated;
  }

  return true;
}
