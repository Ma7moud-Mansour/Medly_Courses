"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

export function CartSummary({ checkout = true }: { checkout?: boolean }) {
  const subtotal = useCartStore((state) => state.getSubtotal());
  const discount = useCartStore((state) => state.getDiscount());
  const total = useCartStore((state) => state.getTotal());
  const count = useCartStore((state) => state.items.length);

  return (
    <aside className="rounded-lg border border-[#e8eeec] bg-white p-5">
      <h2 className="text-xl font-black text-[#0f172a]">ملخص الطلب</h2>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[#5f6f6c]">عدد العناصر</dt>
          <dd className="font-bold">{count}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#5f6f6c]">الإجمالي الفرعي</dt>
          <dd className="font-bold">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#5f6f6c]">الخصم</dt>
          <dd className="font-bold text-[#0e5f5c]">-{formatCurrency(discount)}</dd>
        </div>
        <div className="border-t border-[#e8eeec] pt-3">
          <div className="flex justify-between gap-3 text-lg">
            <dt className="font-black">الإجمالي</dt>
            <dd className="font-black">{formatCurrency(total)}</dd>
          </div>
        </div>
      </dl>
      {checkout ? (
        <Link
          className={buttonVariants({ className: "mt-5 w-full" })}
          href={count ? "/checkout" : "/courses"}
        >
          {count ? "إتمام الشراء" : "اختار كورس"}
        </Link>
      ) : null}
    </aside>
  );
}
