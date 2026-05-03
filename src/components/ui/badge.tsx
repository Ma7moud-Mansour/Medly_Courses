import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "teal",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "teal" | "coral" | "amber" | "green" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold",
        tone === "teal" && "bg-[#e1f6f1] text-[#087467]",
        tone === "coral" && "bg-[#ffe9e4] text-[#b83e2d]",
        tone === "amber" && "bg-[#fff4cc] text-[#88630b]",
        tone === "green" && "bg-[#e9f8dd] text-[#44750f]",
        tone === "neutral" && "bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
