import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireServerSession } from "@/lib/auth/server-session";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function DashboardHeader() {
  const session = await requireServerSession();
  const user = session.user!;

  return (
    <header className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-primary">مرحبًا، {user.name}</p>
          <h1 className="text-2xl font-black">لوحة الطالب</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link className="rounded-lg border border-border p-2 hover:bg-muted" href="/courses">
            <Search className="h-5 w-5" />
          </Link>
          <Link className="rounded-lg border border-border p-2 hover:bg-muted" href="/dashboard/notifications">
            <Bell className="h-5 w-5" />
          </Link>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0e5f5c] font-black text-white">
            {getInitials(user.name)}
          </div>
          <LogoutButton
            className="border-[#cbd8d5] bg-white text-[#0f172a] hover:border-[#0e5f5c]/35 hover:bg-[#f2f8f6]"
            label="تسجيل الخروج"
            redirectTo="/login"
          />
        </div>
      </div>
    </header>
  );
}
