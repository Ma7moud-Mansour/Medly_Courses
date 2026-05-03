import { NextResponse } from "next/server";
import { enrichedInstructors } from "@/data/medly";

export function GET() {
  return NextResponse.json({ data: enrichedInstructors });
}
