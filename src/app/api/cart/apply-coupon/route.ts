import { NextResponse } from "next/server";
import { couponSchema } from "@/lib/validators/schemas";

export async function POST(request: Request) {
  const parsed = couponSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coupon", issues: parsed.error.flatten() }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase();
  const valid = code === "MEDLY20" || code === "FIRST100";

  return NextResponse.json({ data: { valid, code, discount: code === "MEDLY20" ? 20 : 100 } });
}
