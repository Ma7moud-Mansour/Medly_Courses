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
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(couponSchema) });

  const onSubmit = handleSubmit((values) => {
    const valid = applyCoupon(values.code);
    setMessage(valid ? "تم تطبيق الكود." : "الكود غير صالح. جرب MEDLY20 أو FIRST100.");
  });

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-bold">
        كود الخصم
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className="form-input" placeholder="MEDLY20" {...register("code")} defaultValue={coupon} />
          <Button type="submit" variant="outline">
            <Tag className="h-4 w-4" />
            تطبيق
          </Button>
        </div>
      </label>
      {errors.code?.message ? <span className="text-xs text-danger">{errors.code.message as string}</span> : null}
      {message ? <p className="text-sm font-bold text-[#0e5f5c]">{message}</p> : null}
    </form>
  );
}
