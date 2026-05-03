import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listRelatedCoursesByCourseId } from "@/lib/course/repository";

type Params = Promise<{ id: string }>;

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

export async function GET(_: Request, { params }: { params: Params }) {
  const { id } = await params;
  const session = await getServerSessionUser();
  const data = await listRelatedCoursesByCourseId(id, toViewerContext(session));

  if (!data) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  return NextResponse.json({ data });
}
