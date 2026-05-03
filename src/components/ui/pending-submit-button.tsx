"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function PendingSubmitButton({
  children,
  label,
  pendingLabel,
  className,
  variant,
  size,
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }), pending && "cursor-wait")}
      disabled={disabled || pending}
      type={props.type ?? "submit"}
      {...props}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel ?? label ?? children : label ?? children}
    </button>
  );
}
