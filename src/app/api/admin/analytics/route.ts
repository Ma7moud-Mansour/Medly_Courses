import { NextResponse } from "next/server";
import { requireServerRole } from "@/lib/auth/server-session";
import { getAdminAnalyticsData } from "@/lib/admin/repository";

export async function GET() {
  await requireServerRole(["admin", "support"]);

  const data = await getAdminAnalyticsData();

  return NextResponse.json({ data });
}
