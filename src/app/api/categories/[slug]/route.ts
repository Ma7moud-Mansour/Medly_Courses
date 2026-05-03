import { NextResponse } from "next/server";
import { courses, getCategoryBySlug } from "@/data/medly";

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      category,
      courses: courses.filter((course) => course.categoryId === category.id),
    },
  });
}
