"use client";

import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { CouponForm } from "@/components/cart/coupon-form";
import { EmptyState } from "@/components/ui/empty-state";
import { useCartStore } from "@/store/useCartStore";

export function CartPageClient() {
  const items = useCartStore((state) => state.items);

  if (!items.length) {
    return (
      <EmptyState
        title="السلة فارغة"
        body="ابدأ بإضافة كورس من صفحة الكورسات. السلة محفوظة في المتصفح وجاهزة للمزامنة عند تسجيل الدخول."
        actionHref="/courses"
        actionLabel="تصفح الكورسات"
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-3">
        {items.map((item) => (
          <CartItem key={item.courseId} item={item} />
        ))}
      </div>
      <div className="space-y-4">
        <CouponForm />
        <CartSummary />
      </div>
    </div>
  );
}
