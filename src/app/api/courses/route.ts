import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { discoverPublicCourses } from "@/lib/course/repository";
import { publicCourseDiscoverySchema } from "@/lib/validators/schemas";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = publicCourseDiscoverySchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    level: searchParams.get("level") ?? undefined,
    price: searchParams.get("price") ?? undefined,
    instructor: searchParams.get("instructor") ?? undefined,
    rating: searchParams.get("rating") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid course discovery query." }, { status: 400 });
  }

  const session = await getServerSessionUser();
  const data = await discoverPublicCourses(parsed.data, toViewerContext(session));

  return NextResponse.json({ data });
}
