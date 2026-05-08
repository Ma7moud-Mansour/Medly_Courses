import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireServerRole } from "@/lib/auth/server-session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireServerRole(["admin", "support"]);
  } catch {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="min-h-screen bg-[#f6fbf8] xl:grid xl:grid-cols-[280px_minmax(0,1fr)]">
      <AdminSidebar />
      <div className="min-w-0">
        <AdminHeader />
        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
