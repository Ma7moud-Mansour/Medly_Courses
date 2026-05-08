import Link from "next/link";
import { ShieldCheck, TicketPlus, UserRoundSearch } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { requireServerRole } from "@/lib/auth/server-session";

export async function AdminHeader() {
  const session = await requireServerRole(["admin", "support"]);

  return (
    <header className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black text-primary">
            <ShieldCheck className="h-4 w-4" />
            {session.role === "support" ? "Support operations" : "Admin / Support operations"}
          </p>
          <h1 className="text-2xl font-black leading-tight">Medly Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student access, individual overrides, support tickets, and audit activity from one place.
          </p>
        </div>

        <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          <span className="rounded-lg bg-[#eef8f5] px-3 py-2 text-sm font-black text-primary">
            {session.user!.name}
          </span>

          <Link className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })} href="/admin/students">
            <UserRoundSearch className="h-4 w-4" />
            Find student
          </Link>

          <Link className={buttonVariants({ className: "w-full sm:w-auto" })} href="/admin/tickets">
            <TicketPlus className="h-4 w-4" />
            Support tickets
          </Link>

          <LogoutButton
            className="w-full border-[#cbd8d5] bg-white text-[#0f172a] hover:border-[#0e5f5c]/35 hover:bg-[#f2f8f6] sm:w-auto"
            label="Log out"
            redirectTo="/login"
          />
        </div>
      </div>
    </header>
  );
}
