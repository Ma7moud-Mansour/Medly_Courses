import { canAccessPath } from "@/lib/auth/access-control";
import type { UserRole } from "@/types";

export function getRoleHomePath(role: UserRole) {
  if (role === "admin" || role === "support") {
    return "/admin";
  }

  return "/dashboard";
}

export function normalizeRedirectPath(value?: string | null) {
  if (!value) {
    return undefined;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }

  return value;
}

export function resolvePostAuthRedirect(role: UserRole, requestedPath?: string | null) {
  const safePath = normalizeRedirectPath(requestedPath);

  if (!safePath) {
    return getRoleHomePath(role);
  }

  const pathname = safePath.split("?")[0] ?? safePath;

  if (!canAccessPath({ pathname, authenticated: true, role })) {
    return getRoleHomePath(role);
  }

  return safePath;
}
