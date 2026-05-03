"use client";

import Link from "next/link";
import { BookOpen, Grid2X2, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { useLanguage } from "@/components/i18n/language-provider";

const copy = {
  ar: {
    placeholder: "ابحث عن كورس، مادة، أو دكتور",
    courses: "الكورسات",
    categories: "التصنيفات",
    search: "بحث",
    aria: "بحث في كورسات Medly",
  },
  en: {
    placeholder: "Search for a course, subject, or doctor",
    courses: "Courses",
    categories: "Categories",
    search: "Search",
    aria: "Search Medly courses",
  },
};

export function SearchFilter() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <section data-no-translate className="relative z-20 -mt-10">
      <Container>
        <form
          action="/courses"
          className="medly-card-shadow mx-auto grid max-w-5xl gap-3 rounded-lg border border-[#dce9e5] bg-white/96 p-3 backdrop-blur md:grid-cols-[1fr_auto_auto_auto] md:items-center"
          aria-label={text.aria}
        >
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[#edf3f1] bg-[#f9fcfb] px-4">
            <Search className="h-5 w-5 shrink-0 text-[#70827e]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0f172a] outline-none placeholder:text-[#7a8784]"
              name="query"
              placeholder={text.placeholder}
            />
          </label>

          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#dce9e5] bg-white px-4 text-sm font-black text-[#304844] transition duration-200 hover:border-[#0e5f5c]/35 hover:bg-[#f2f8f6]"
            href="/courses"
          >
            <BookOpen className="h-4 w-4 text-[#0e5f5c]" />
            {text.courses}
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#dce9e5] bg-white px-4 text-sm font-black text-[#304844] transition duration-200 hover:border-[#0e5f5c]/35 hover:bg-[#f2f8f6]"
            href="/categories"
          >
            <Grid2X2 className="h-4 w-4 text-[#0e5f5c]" />
            {text.categories}
          </Link>
          <button className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#0e5f5c] px-6 text-sm font-black text-white shadow-[0_12px_22px_rgba(14,95,92,0.13)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0a4f4c]">
            <Search className="h-4 w-4" />
            <span className="sr-only">{text.search}</span>
          </button>
        </form>
      </Container>
    </section>
  );
}
