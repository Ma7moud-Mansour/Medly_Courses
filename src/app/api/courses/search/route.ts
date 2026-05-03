import { NextResponse } from "next/server";
import { searchPublicCourses } from "@/lib/course/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const data = await searchPublicCourses(query);

  return NextResponse.json({ data });
}
