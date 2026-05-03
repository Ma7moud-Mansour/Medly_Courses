"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Boxes,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  TicketPercent,
  Users,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/students", label: "الطلاب", icon: Users },
  { href: "/admin/payments", label: "المدفوعات", icon: WalletCards },
  { href: "/admin/tickets", label: "صندوق الدعم", icon: ClipboardList },
  { href: "/admin/security-events", label: "سجل الحماية", icon: ShieldAlert },
  { href: "/admin/audit-logs", label: "سجل التدقيق", icon: ScrollText },
  { href: "/admin/courses", label: "الكورسات", icon: BookOpen },
  { href: "/admin/exams", label: "الامتحانات", icon: FileQuestion },
  { href: "/admin/categories", label: "التصنيفات", icon: Boxes },
  { href: "/admin/instructors", label: "الدكاترة", icon: GraduationCap },
  { href: "/admin/coupons", label: "الكوبونات", icon: TicketPercent },
  { href: "/admin/reviews", label: "المراجعات", icon: MessageSquare },
  { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
] as const;

function isActiveLink(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-l border-border bg-[#123c35] p-4 text-white lg:min-h-screen">
      <Link className="mb-6 flex items-center gap-2 text-2xl font-black" href="/admin">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white">M</span>
        <span className="flex flex-col">
          <span>Medly Admin</span>
          <span className="text-xs font-bold text-white/65">إدارة الطلاب والمحتوى والمدفوعات</span>
        </span>
      </Link>

      <div className="mb-4 rounded-lg border border-white/10 bg-white/6 p-3">
        <p className="flex items-center gap-2 text-xs font-black text-white/75">
          <ShieldCheck className="h-4 w-4 text-[#f4b942]" />
          الصلاحيات وسجل التدقيق مفعّلان
        </p>
      </div>

      <nav className="grid gap-2">
        {links.map((link) => {
          const active = isActiveLink(pathname, link.href);

          return (
            <Link
              key={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition",
                active
                  ? "bg-white text-[#123c35] shadow-sm"
                  : "text-white/78 hover:bg-white/10 hover:text-white",
              )}
              href={link.href}
            >
              <link.icon className={cn("h-4 w-4", active ? "text-primary" : "text-[#f4b942]")} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
