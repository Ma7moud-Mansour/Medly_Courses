import Link from "next/link";
import { ShieldCheck, TicketPlus, UserRoundSearch } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { requireServerRole } from "@/lib/auth/server-session";

export async function AdminHeader() {
  const session = await requireServerRole(["admin", "support"]);

  return (
    <header className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-primary">
            <ShieldCheck className="h-4 w-4" />
            {session.role === "support" ? "Support operations" : "Admin / Support operations"}
          </p>
          <h1 className="text-2xl font-black">Medly Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student access, individual overrides, support tickets, and audit activity from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#eef8f5] px-3 py-2 text-sm font-black text-primary">
            {session.user!.name}
          </span>

          <Link className={buttonVariants({ variant: "outline" })} href="/admin/students">
            <UserRoundSearch className="h-4 w-4" />
            Find student
          </Link>

          <Link className={buttonVariants()} href="/admin/tickets">
            <TicketPlus className="h-4 w-4" />
            Support tickets
          </Link>

          <LogoutButton
            className="border-[#cbd8d5] bg-white text-[#0f172a] hover:border-[#0e5f5c]/35 hover:bg-[#f2f8f6]"
            label="Log out"
            redirectTo="/login"
          />
        </div>
      </div>
    </header>
  );
}
