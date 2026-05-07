import { NextResponse } from "next/server";
import { listPublicInstructors } from "@/lib/catalog/repository";

export async function GET() {
  const { instructors } = await listPublicInstructors({ pageSize: 24 });
  return NextResponse.json({ data: instructors });
}
