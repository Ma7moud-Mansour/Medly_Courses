"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function buildPages(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

export function CoursePagination({
  currentPage,
  totalPages,
  className,
}: {
  currentPage: number;
  totalPages: number;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPages(currentPage, totalPages);

  function hrefFor(page: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    const query = params.toString();

    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <nav className={cn("flex flex-wrap items-center justify-center gap-2", className)} aria-label="Pagination">
      <Link
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: currentPage <= 1 ? "pointer-events-none opacity-50" : "",
        })}
        href={hrefFor(currentPage - 1)}
      >
        <ChevronRight className="h-4 w-4" />
        السابق
      </Link>

      {pages.map((page, index) => {
        const previousPage = pages[index - 1];
        const showGap = previousPage && page - previousPage > 1;

        return (
          <div key={page} className="flex items-center gap-2">
            {showGap ? <span className="px-1 text-sm text-muted-foreground">…</span> : null}
            <Link
              className={buttonVariants({
                variant: page === currentPage ? "primary" : "outline",
                size: "sm",
              })}
              href={hrefFor(page)}
            >
              {page}
            </Link>
          </div>
        );
      })}

      <Link
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: currentPage >= totalPages ? "pointer-events-none opacity-50" : "",
        })}
        href={hrefFor(currentPage + 1)}
      >
        التالي
        <ChevronLeft className="h-4 w-4" />
      </Link>
    </nav>
  );
}
