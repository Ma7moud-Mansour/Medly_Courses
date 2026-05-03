import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getCourseDetailsBySlug } from "@/lib/course/repository";

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const session = await getServerSessionUser();
  const course = await getCourseDetailsBySlug(
    slug,
    session.isAuthenticated && session.userId && session.role
      ? {
          isAuthenticated: true,
          userId: session.userId,
          role: session.role,
        }
      : { isAuthenticated: false },
  );

  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  return NextResponse.json({ data: course });
}
