import { NextResponse } from "next/server";
import { sampleCartItems } from "@/data/medly";

export function GET() {
  return NextResponse.json({ data: sampleCartItems });
}
