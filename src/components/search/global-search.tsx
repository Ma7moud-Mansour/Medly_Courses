"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";
import type { SearchResultGroup } from "@/types";

const emptyResults: SearchResultGroup = {
  courses: [],
  categories: [],
  instructors: [],
};

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultGroup>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as { data?: SearchResultGroup } | null;

        if (!response.ok) {
          setResults(emptyResults);
          return;
        }

        setResults(payload?.data ?? emptyResults);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults(emptyResults);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, query ? 220 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  if (!open) {
    return null;
  }

  const isEmpty =
    !results.courses.length && !results.categories.length && !results.instructors.length && !isLoading;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/42 p-3 backdrop-blur-sm" role="dialog" aria-modal>
      <div className="mx-auto mt-16 max-w-3xl rounded-lg border border-[#e8eeec] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
        <div className="flex items-center gap-3 border-b border-[#e8eeec] p-4">
          <Search className="h-5 w-5 text-[#0e5f5c]" />
          <input
            autoFocus
            className="min-h-12 flex-1 bg-transparent text-lg font-bold text-[#0f172a] outline-none placeholder:text-[#7a8784]"
            placeholder="ابحث باسم الكورس أو الدكتور أو التصنيف"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="rounded-lg p-2 text-[#5f6f6c] hover:bg-[#f2f6f4]"
            onClick={() => onOpenChange(false)}
            aria-label="إغلاق البحث"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-lg bg-[#f2f6f4]" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="rounded-lg border border-dashed border-[#d8e4e0] bg-[#fbfcfc] p-6 text-center text-sm font-bold text-muted-foreground">
              لا توجد نتائج مطابقة الآن. جرّب اسم مادة أو اسم دكتور بشكل أبسط.
            </div>
          ) : (
            <>
              {results.courses.length ? (
                <SearchGroup title="الكورسات">
                  {results.courses.map((course) => (
                    <Link
                      key={course.id}
                      className="grid grid-cols-[64px_1fr] gap-3 rounded-lg p-2 transition hover:bg-[#f2f6f4]"
                      href={`/courses/${course.slug}`}
                      onClick={() => onOpenChange(false)}
                    >
                      <img className="h-16 w-16 rounded-lg object-cover" src={course.thumbnail} alt={course.title} />
                      <span>
                        <span className="block font-black">{course.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(course.studentsCount)} طالب
                        </span>
                      </span>
                    </Link>
                  ))}
                </SearchGroup>
              ) : null}

              {results.categories.length ? (
                <SearchGroup title="التصنيفات">
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((category) => (
                      <Link
                        key={category.id}
                        className="rounded-lg border border-[#e8eeec] px-3 py-2 text-sm font-bold text-[#0f172a] hover:bg-[#f2f6f4]"
                        href={`/courses?category=${encodeURIComponent(category.slug)}`}
                        onClick={() => onOpenChange(false)}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </SearchGroup>
              ) : null}

              {results.instructors.length ? (
                <SearchGroup title="الدكاترة">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {results.instructors.map((instructor) => (
                      <Link
                        key={instructor.id}
                        className="rounded-lg border border-[#e8eeec] p-3 font-bold text-[#0f172a] hover:bg-[#f2f6f4]"
                        href={`/courses?instructor=${encodeURIComponent(instructor.slug)}`}
                        onClick={() => onOpenChange(false)}
                      >
                        {instructor.name}
                        <span className="block text-xs font-medium text-muted-foreground">
                          {instructor.specialization}
                        </span>
                      </Link>
                    ))}
                  </div>
                </SearchGroup>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="not-last:mb-5">
      <h3 className="mb-3 text-sm font-black text-[#8a6a2f]">{title}</h3>
      {children}
    </section>
  );
}
