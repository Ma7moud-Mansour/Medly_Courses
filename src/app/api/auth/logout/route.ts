import { NextResponse, type NextRequest } from "next/server";
import { deleteSessionById } from "@/lib/auth/auth-service";
import { clearSessionCookie, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);

  await deleteSessionById(payload?.sid);

  const response = NextResponse.json({ data: { loggedOut: true } });
  clearSessionCookie(response);

  return response;
}
