"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courses } from "@/data/medly";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import type { CartItem as CartItemType } from "@/types";

export function CartItem({ item }: { item: CartItemType }) {
  const removeItem = useCartStore((state) => state.removeItem);
  const course = courses.find((candidate) => candidate.id === item.courseId);
  const href = course ? `/courses/${course.slug}` : "/courses";

  return (
    <div className="grid gap-4 rounded-lg border border-[#e8eeec] bg-white p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
      <img className="h-24 w-24 rounded-lg object-cover" src={item.thumbnail} alt={item.title} />
      <div>
        <Link className="text-lg font-black text-[#0f172a] hover:text-[#0e5f5c]" href={href}>
          {item.title}
        </Link>
        <p className="mt-2 text-sm text-[#5f6f6c]">وصول كامل، موارد، وحفظ تقدم داخل حسابك.</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="font-black">{formatCurrency(item.discountPrice ?? item.price)}</span>
          {item.discountPrice ? (
            <span className="text-sm text-[#5f6f6c] line-through">{formatCurrency(item.price)}</span>
          ) : null}
        </div>
      </div>
      <Button variant="outline" onClick={() => removeItem(item.courseId)}>
        <Trash2 className="h-4 w-4" />
        حذف
      </Button>
    </div>
  );
}
