import { NextResponse } from "next/server";
import { courses, getInstructorBySlug } from "@/data/medly";

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const instructor = getInstructorBySlug(slug);

  if (!instructor) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      instructor,
      courses: courses.filter((course) => course.instructorId === instructor.id),
    },
  });
}
