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
    <div className="min-h-screen bg-[#f6fbf8] lg:grid lg:grid-cols-[280px_1fr]">
      <AdminSidebar />
      <div>
        <AdminHeader />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
