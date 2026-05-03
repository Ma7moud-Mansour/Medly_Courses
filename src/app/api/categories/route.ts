import { NextResponse } from "next/server";
import { enrichedCategories } from "@/data/medly";

export function GET() {
  return NextResponse.json({ data: enrichedCategories });
}
