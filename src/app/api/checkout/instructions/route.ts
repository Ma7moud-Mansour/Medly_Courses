import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { getCheckoutPaymentInstructions } from "@/lib/payments/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireServerSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const courseIds = Array.isArray(payload?.courseIds)
    ? payload.courseIds.map((value: unknown) => String(value)).filter(Boolean)
    : [];

  const instructions = await getCheckoutPaymentInstructions(courseIds);

  return NextResponse.json({ data: instructions });
}
