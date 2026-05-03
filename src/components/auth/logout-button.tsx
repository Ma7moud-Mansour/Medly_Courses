"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

export function LogoutButton({
  className,
  label = "Logout",
  redirectTo = "/login",
}: {
  className?: string;
  label?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      onClick={() =>
        startTransition(async () => {
          await logout();
          router.replace(redirectTo);
          router.refresh();
        })
      }
      disabled={pending}
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : label}
    </button>
  );
}
