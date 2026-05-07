import { NextResponse } from "next/server";
import { getPublicCategoryDetailsBySlug } from "@/lib/catalog/repository";

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const details = await getPublicCategoryDetailsBySlug(slug, {}, { isAuthenticated: false });

  if (!details) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      category: details.category,
      courses: details.discovery.courses,
    },
  });
}
