import { NextResponse } from "next/server";
import { listPublicCategories } from "@/lib/catalog/repository";

export async function GET() {
  const { categories } = await listPublicCategories({ pageSize: 24 });
  return NextResponse.json({ data: categories });
}
