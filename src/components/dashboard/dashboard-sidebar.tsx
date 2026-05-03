import Link from "next/link";
import { Bell, BookOpen, FileQuestion, Gauge, Heart, LifeBuoy, Receipt, Settings, ShieldCheck } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/dashboard/my-courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/exams", label: "Exams", icon: FileQuestion },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/billing", label: "Payments", icon: Receipt },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
] as const;

export function DashboardSidebar() {
  return (
    <aside className="border-b border-border bg-surface p-4 lg:min-h-screen lg:border-b-0 lg:border-l">
      <Link className="mb-6 hidden items-center gap-2 text-2xl font-black lg:flex" href="/">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white">M</span>
        Medly
      </Link>
      <nav className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:pb-0">
        {links.map((link) => (
          <Link
            key={link.href}
            className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            href={link.href}
          >
            <link.icon className="h-4 w-4 text-primary" />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 hidden rounded-lg bg-[#e9f7f2] p-4 lg:block">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <p className="mt-3 font-black">Secure account access</p>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">
          Dashboard data is tied to the real authenticated Medly session, not client-only demo state.
        </p>
      </div>
    </aside>
  );
}
