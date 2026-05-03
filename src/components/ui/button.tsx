import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition duration-150 focus-ring disabled:pointer-events-none disabled:opacity-55",
    size === "sm" && "min-h-9 px-3 text-sm",
    size === "md" && "min-h-11 px-5 text-sm",
    size === "lg" && "min-h-12 px-6 text-base",
    variant === "primary" && "bg-primary text-primary-foreground hover:bg-[#0a4f4c]",
    variant === "secondary" && "bg-accent text-accent-foreground hover:bg-[#b99958]",
    variant === "outline" && "border border-border bg-surface text-foreground hover:bg-muted",
    variant === "ghost" && "text-foreground hover:bg-muted",
    variant === "danger" && "bg-danger text-white hover:bg-[#bd372d]",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
