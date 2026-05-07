import { NextResponse } from "next/server";
import { validateCouponForSubtotal } from "@/lib/coupons/repository";
import { couponSchema } from "@/lib/validators/schemas";

export async function POST(request: Request) {
  const parsed = couponSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coupon", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const coupon = await validateCouponForSubtotal({
      code: parsed.data.code,
      subtotal: parsed.data.subtotal ?? 0,
    });

    return NextResponse.json({
      data: {
        valid: true,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: coupon.discountAmount,
        minOrderAmount: coupon.minOrderAmount,
        maxUsage: coupon.maxUsage,
        expiresAt: coupon.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: {
          valid: false,
        },
        error: error instanceof Error ? error.message : "Coupon code is invalid.",
      },
      { status: 404 },
    );
  }
}
