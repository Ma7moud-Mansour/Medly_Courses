"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WishlistButton({
  courseId,
  className,
  initialActive = false,
  label,
  activeLabel = "في المفضلة",
}: {
  courseId: string;
  className?: string;
  initialActive?: boolean;
  label?: string;
  activeLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(initialActive);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/courses")}`);
        return;
      }

      if (!response.ok) {
        setError(payload?.error ?? "تعذر تحديث المفضلة الآن.");
        return;
      }

      setActive(Boolean(payload?.data?.active));
      router.refresh();
    });
  }

  const textLabel = label ? (active ? activeLabel : label) : null;

  return (
    <div className={cn("inline-flex flex-col items-stretch gap-1", className)}>
      <Button
        className={cn(!textLabel && "px-3")}
        variant="outline"
        type="button"
        disabled={isPending}
        onClick={handleToggle}
        aria-label={active ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        title={error ?? undefined}
      >
        <Heart className={cn("h-4 w-4", active && "fill-accent text-accent")} />
        {textLabel ? <span>{isPending ? "جارٍ التحديث..." : textLabel}</span> : null}
      </Button>
      {error ? <span className="text-xs font-bold text-danger">{error}</span> : null}
    </div>
  );
}
