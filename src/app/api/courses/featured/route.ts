import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listFeaturedCourses } from "@/lib/course/repository";

function toViewerContext(session: Awaited<ReturnType<typeof getServerSessionUser>>) {
  if (!session.isAuthenticated || !session.userId || !session.role) {
    return { isAuthenticated: false } as const;
  }

  return {
    isAuthenticated: true as const,
    userId: session.userId,
    role: session.role,
  };
}

export async function GET() {
  const session = await getServerSessionUser();
  const data = await listFeaturedCourses(toViewerContext(session));

  return NextResponse.json({ data });
}
