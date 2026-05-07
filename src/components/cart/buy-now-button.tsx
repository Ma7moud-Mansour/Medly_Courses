"use client";

import { Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import type { Course } from "@/types";

export function BuyNowButton({ course, className }: { course: Course; className?: string }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  return (
    <Button
      className={className}
      onClick={() => {
        addItem(course);
        router.push("/checkout");
      }}
      type="button"
      variant="secondary"
    >
      <Landmark className="h-4 w-4" />
      اشتري الآن
    </Button>
  );
}
