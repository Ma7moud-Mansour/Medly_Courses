import { NextResponse } from "next/server";
import { getPublicInstructorDetailsBySlug } from "@/lib/catalog/repository";

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const details = await getPublicInstructorDetailsBySlug(slug, {}, { isAuthenticated: false });

  if (!details) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      instructor: details.instructor,
      courses: details.discovery.courses,
    },
  });
}
