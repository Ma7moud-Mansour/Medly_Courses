import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ValidatedCoupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUsage?: number;
  expiresAt?: string;
  discountAmount: number;
};

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

export function calculateCouponDiscount(input: {
  subtotal: number;
  type: "percent" | "fixed";
  value: number;
}) {
  const subtotal = Math.max(0, input.subtotal);

  if (!subtotal) {
    return 0;
  }

  if (input.type === "percent") {
    return Math.min(subtotal, Math.round((subtotal * input.value) / 100));
  }

  return Math.min(subtotal, input.value);
}

export async function validateCouponForSubtotal(input: {
  code: string;
  subtotal: number;
  userId?: string;
}): Promise<ValidatedCoupon> {
  const code = normalizeCouponCode(input.code);
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: {
        equals: code,
        mode: "insensitive",
      },
    },
    include: {
      _count: {
        select: {
          usages: true,
        },
      },
    },
  });

  if (!coupon) {
    throw new Error("Coupon code was not found.");
  }

  if (!coupon.active) {
    throw new Error("Coupon code is not active.");
  }

  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new Error("Coupon code has expired.");
  }

  if (coupon.minOrderAmount != null && input.subtotal < coupon.minOrderAmount) {
    throw new Error("Cart total does not meet this coupon minimum order amount.");
  }

  if (coupon.maxUsage != null && coupon._count.usages >= coupon.maxUsage) {
    throw new Error("Coupon code has reached its usage limit.");
  }

  if (input.userId) {
    const existingUsage = await prisma.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId: input.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingUsage) {
      throw new Error("Coupon code was already used by this account.");
    }
  }

  const discountAmount = calculateCouponDiscount({
    subtotal: input.subtotal,
    type: coupon.type,
    value: coupon.value,
  });

  if (discountAmount <= 0) {
    throw new Error("Coupon code cannot be applied to this cart.");
  }

  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount ?? undefined,
    maxUsage: coupon.maxUsage ?? undefined,
    expiresAt: toIso(coupon.expiresAt),
    discountAmount,
  };
}

export async function recordCouponUsage(
  tx: Prisma.TransactionClient,
  input: {
    couponId: string;
    userId: string;
  },
) {
  await tx.couponUsage.create({
    data: {
      couponId: input.couponId,
      userId: input.userId,
    },
  });
}
