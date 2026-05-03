"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import type { Course } from "@/types";

export function AddToCartButton({
  course,
  label = "أضف للسلة",
  className,
}: {
  course: Course;
  label?: string;
  className?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const exists = useCartStore((state) => state.items.some((item) => item.courseId === course.id));

  return (
    <Button
      className={className}
      variant={exists ? "outline" : "primary"}
      onClick={() => addItem(course)}
      type="button"
    >
      <ShoppingCart className="h-4 w-4" />
      {exists ? "موجود في السلة" : label}
    </Button>
  );
}
