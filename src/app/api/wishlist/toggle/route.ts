import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { toggleWishlistCourse } from "@/lib/course/repository";

export async function POST(request: Request) {
  const session = await getServerSessionUser();

  if (!session.isAuthenticated || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "student") {
    return NextResponse.json({ error: "Wishlist is available for student accounts only." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const courseId = typeof payload?.courseId === "string" ? payload.courseId.trim() : "";

  if (!courseId) {
    return NextResponse.json({ error: "Course id is required." }, { status: 400 });
  }

  const result = await toggleWishlistCourse(session.userId, courseId);

  if (!result.ok) {
    return NextResponse.json({ error: "Course was not found." }, { status: 404 });
  }

  return NextResponse.json({ data: result });
}
