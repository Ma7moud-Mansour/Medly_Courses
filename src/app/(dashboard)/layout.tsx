import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    await requireServerSession();
  } catch {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f6fbf8] lg:grid lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      <div className="flex flex-col">
        <DashboardHeader />
        <div className="lg:hidden">
          <DashboardSidebar />
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
