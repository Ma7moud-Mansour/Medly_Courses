import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { createCourseReview, listCourseReviews } from "@/lib/course/repository";
import { reviewSchema } from "@/lib/validators/schemas";

type Params = Promise<{ courseId: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { courseId } = await params;
  const reviews = await listCourseReviews(courseId);

  return NextResponse.json({ data: reviews });
}

export async function POST(request: Request, { params }: { params: Params }) {
  const session = await getServerSessionUser();

  if (!session.isAuthenticated || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "student") {
    return NextResponse.json({ error: "Only students can submit reviews." }, { status: 403 });
  }

  const { courseId } = await params;
  const payload = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please review the rating and comment.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createCourseReview(session.userId, courseId, parsed.data);

  if (!result.ok) {
    const status =
      result.reason === "duplicate" ? 409 : result.reason === "not_enrolled" ? 403 : 404;
    const error =
      result.reason === "duplicate"
        ? "You already submitted a review for this course."
        : result.reason === "not_enrolled"
          ? "Only students with active access can review this course."
          : "Course not found.";

    return NextResponse.json({ error, data: result.reason === "duplicate" ? result.review : undefined }, { status });
  }

  return NextResponse.json({ data: result.review }, { status: 201 });
}
