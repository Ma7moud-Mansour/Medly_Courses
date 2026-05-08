"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { HeaderLogo } from "@/components/brand/medly-logo";
import { useLanguage } from "@/components/i18n/language-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { GlobalSearch } from "@/components/search/global-search";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

const navItems = [
  { href: "/courses", key: "courses", icon: BookOpen },
  { href: "/categories", key: "categories", icon: FolderOpen },
  { href: "/instructors", key: "doctors", icon: Stethoscope },
  { href: "/faq", key: "faq", icon: HelpCircle },
  { href: "/contact", key: "contact", icon: MessageCircle },
];

const copy = {
  ar: {
    courses: "الكورسات",
    categories: "التصنيفات",
    doctors: "الدكاترة",
    faq: "الأسئلة",
    contact: "تواصل معنا",
    login: "دخول",
    start: "ابدأ الآن",
    dashboard: "حسابي",
    admin: "الإدارة",
    logout: "تسجيل الخروج",
    openMenu: "فتح القائمة",
    search: "البحث",
    cart: "السلة",
    platformSearch: "البحث في المنصة",
  },
  en: {
    courses: "Courses",
    categories: "Categories",
    doctors: "Doctors",
    faq: "FAQ",
    contact: "Contact",
    login: "Login",
    start: "Start now",
    dashboard: "Dashboard",
    admin: "Admin",
    logout: "Logout",
    openMenu: "Open menu",
    search: "Search",
    cart: "Cart",
    platformSearch: "Search the platform",
  },
};

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const count = useCartStore((state) => state.items.length);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initialized = useAuthStore((state) => state.initialized);
  const { language } = useLanguage();
  const text = copy[language];
  const roleHomePath =
    user?.role === "admin" || user?.role === "support" ? "/admin" : "/dashboard";

  return (
    <>
      <header data-no-translate className="site-nav-animated sticky top-0 z-40 border-b border-[#e8eeec] bg-white/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 w-full min-w-0 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="focus-ring rounded-lg p-2 text-foreground xl:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={text.openMenu}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link className="group inline-flex items-center gap-2.5" href="/" aria-label="Medly">
              <HeaderLogo className="transition duration-200 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="hidden min-w-0 items-center gap-1 xl:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-[#506662] transition duration-200 hover:bg-[#f2f6f4] hover:text-[#0e5f5c] 2xl:px-3"
                href={item.href}
                data-nav-link
              >
                <item.icon className="h-4 w-4" />
                {text[item.key as keyof typeof text]}
              </Link>
            ))}
          </div>

          <div className="flex min-w-0 items-center gap-1">
            <div className="hidden xl:block">
              <LanguageSwitcher />
            </div>
            <button
              className="focus-ring hidden h-8 w-8 items-center justify-center rounded-lg border border-[#e8eeec] bg-white text-[#5f6f6c] transition duration-200 hover:bg-[#f2f6f4] hover:text-[#0f172a] xl:inline-flex"
              onClick={() => setSearchOpen(true)}
              aria-label={text.search}
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              className="relative grid h-8 w-8 place-items-center rounded-lg border border-[#e8eeec] bg-white text-[#5f6f6c] transition duration-200 hover:bg-[#f2f6f4] hover:text-[#0f172a]"
              href="/cart"
              aria-label={text.cart}
            >
              <ShoppingCart className="h-4 w-4" />
              {count > 0 ? (
                <span className="absolute -left-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#0e5f5c] px-1 text-[10px] font-black text-white">
                  {count}
                </span>
              ) : null}
            </Link>

            {initialized ? (
              isAuthenticated && user ? (
                <>
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "hidden min-h-8 border-[#cbd8d5] bg-white px-3 text-[#0f172a] hover:border-[#0e5f5c]/35 hover:bg-[#f2f8f6] xl:inline-flex 2xl:px-4",
                    })}
                    href={roleHomePath}
                  >
                    {user.role === "admin" || user.role === "support" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <LayoutDashboard className="h-4 w-4" />
                    )}
                    {user.role === "admin" || user.role === "support" ? text.admin : text.dashboard}
                  </Link>
                  <LogoutButton
                    className="hidden min-h-8 border-[#cbd8d5] bg-white px-3 text-[#0f172a] hover:border-[#0e5f5c]/35 hover:bg-[#f2f8f6] xl:inline-flex 2xl:px-4"
                    label={text.logout}
                    redirectTo="/login"
                  />
                </>
              ) : (
                <>
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "hidden min-h-8 border-[#cbd8d5] bg-white px-3 text-[#0f172a] hover:border-[#0e5f5c]/35 hover:bg-[#f2f8f6] xl:inline-flex 2xl:px-4",
                    })}
                    href="/login"
                  >
                    {text.login}
                  </Link>
                  <Link
                    className={buttonVariants({
                      size: "sm",
                      className:
                        "hidden min-h-8 bg-[#0e5f5c] px-3 shadow-[0_10px_20px_rgba(14,95,92,0.12)] hover:-translate-y-0.5 hover:bg-[#0a4f4c] xl:inline-flex 2xl:px-4",
                    })}
                    href="/register"
                  >
                    {text.start}
                  </Link>
                </>
              )
            ) : (
              <div className="hidden h-8 w-36 rounded-lg bg-[#f2f6f4] xl:block" />
            )}
          </div>
        </nav>

        <div className={cn("border-t border-border bg-surface xl:hidden", !menuOpen && "hidden")}>
          <div className="mobile-menu-panel mx-auto grid max-w-7xl gap-2 px-4 py-4">
            <LanguageSwitcher />
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-3 font-bold hover:bg-muted"
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {text[item.key as keyof typeof text]}
              </Link>
            ))}
            <button
              className="rounded-lg px-3 py-3 text-right font-bold hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                setSearchOpen(true);
              }}
            >
              {text.platformSearch}
            </button>

            {initialized ? (
              isAuthenticated && user ? (
                <>
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-3 font-bold hover:bg-muted"
                    href={roleHomePath}
                    onClick={() => setMenuOpen(false)}
                  >
                    {user.role === "admin" || user.role === "support" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <LayoutDashboard className="h-4 w-4" />
                    )}
                    {user.role === "admin" || user.role === "support" ? text.admin : text.dashboard}
                  </Link>
                  <LogoutButton
                    className="w-full justify-start rounded-lg px-3 py-3 text-right font-bold hover:bg-muted"
                    label={text.logout}
                    redirectTo="/login"
                  />
                </>
              ) : (
                <>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#dce9e5] bg-white px-4 font-bold text-[#0f172a] transition hover:bg-[#f2f8f6]"
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                  >
                    {text.login}
                  </Link>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0e5f5c] px-4 font-black text-white shadow-[0_10px_20px_rgba(14,95,92,0.12)] transition hover:-translate-y-0.5 hover:bg-[#0a4f4c]"
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                  >
                    {text.start}
                  </Link>
                </>
              )
            ) : null}
          </div>
        </div>
      </header>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
