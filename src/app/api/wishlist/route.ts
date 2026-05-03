import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listWishlistCourses } from "@/lib/course/repository";

export async function GET() {
  const session = await getServerSessionUser();

  if (!session.isAuthenticated || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "student") {
    return NextResponse.json({ error: "Wishlist is available for student accounts only." }, { status: 403 });
  }

  const wishlist = await listWishlistCourses(session.userId);

  return NextResponse.json({ data: wishlist });
}
