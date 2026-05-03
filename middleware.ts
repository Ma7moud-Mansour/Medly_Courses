import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath } from "@/lib/auth/access-control";
import { getRoleHomePath } from "@/lib/auth/redirects";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const authPages = new Set(["/login", "/register"]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);
  const role = payload?.role;
  const authenticated = Boolean(payload?.sid && role);

  if (authenticated && role && authPages.has(pathname)) {
    return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
  }

  if (canAccessPath({ pathname, authenticated, role })) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/:path*",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/learn/:path*",
    "/api/admin/:path*",
    "/api/me/:path*",
    "/api/progress/:path*",
    "/api/wishlist/:path*",
  ],
};
