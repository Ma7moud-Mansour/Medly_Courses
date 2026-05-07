"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Tag } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { couponSchema } from "@/lib/validators/schemas";
import { useCartStore } from "@/store/useCartStore";

export function CouponForm() {
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const coupon = useCartStore((state) => state.coupon);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const [message, setMessage] = useState<string>();
  const [isApplying, setIsApplying] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(couponSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setIsApplying(true);
    setMessage(undefined);

    try {
      const response = await fetch("/api/cart/apply-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: values.code,
          subtotal,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.data?.valid) {
        throw new Error(payload?.error ?? "الكود غير صالح.");
      }

      applyCoupon({
        code: payload.data.code,
        type: payload.data.type,
        value: payload.data.value,
        minOrderAmount: payload.data.minOrderAmount,
      });
      setMessage("تم تطبيق الكود.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "الكود غير صالح.");
    } finally {
      setIsApplying(false);
    }
  });

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-bold">
        كود الخصم
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className="form-input" placeholder="SAVE20" {...register("code")} defaultValue={coupon} />
          <Button disabled={isApplying} type="submit" variant="outline">
            <Tag className="h-4 w-4" />
            {isApplying ? "..." : "تطبيق"}
          </Button>
        </div>
      </label>
      {errors.code?.message ? <span className="text-xs text-danger">{errors.code.message as string}</span> : null}
      {message ? <p className="text-sm font-bold text-[#0e5f5c]">{message}</p> : null}
    </form>
  );
}
