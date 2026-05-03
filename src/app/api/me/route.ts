import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";

export async function GET() {
  const session = await getServerSessionUser();

  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ data: session.user });
}
