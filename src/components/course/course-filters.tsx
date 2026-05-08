import Link from "next/link";
import { Search } from "lucide-react";
import type { CourseDiscoveryResult } from "@/lib/course/repository";

const ratingOptions = [
  { value: "all", label: "كل التقييمات" },
  { value: "4", label: "4 نجوم فأعلى" },
  { value: "4.5", label: "4.5 نجوم فأعلى" },
];

const sortOptions = [
  { value: "popular", label: "الأكثر شيوعًا" },
  { value: "newest", label: "الأحدث" },
  { value: "rating", label: "الأعلى تقييمًا" },
  { value: "price-low", label: "الأقل سعرًا" },
  { value: "price-high", label: "الأعلى سعرًا" },
];

export function CourseFilters({
  defaults,
  options,
}: {
  defaults: CourseDiscoveryResult["applied"];
  options: CourseDiscoveryResult["filters"];
}) {
  return (
    <form
      action="/courses"
      className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.8fr)_repeat(5,minmax(0,1fr))_auto_auto]"
      method="GET"
    >
      <label className="relative min-w-0 sm:col-span-2 xl:col-span-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="min-h-11 w-full rounded-lg border border-border bg-white pr-10 pl-3 text-sm outline-none focus:border-primary"
          name="query"
          defaultValue={defaults.query}
          placeholder="اسم كورس، دكتور، أو كلمة مفتاحية"
        />
      </label>

      <Select name="category" defaultValue={defaults.category ?? "all"} label="التصنيف">
        <option value="all">كل التصنيفات</option>
        {options.categories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label} ({category.count})
          </option>
        ))}
      </Select>

      <Select name="price" defaultValue={defaults.price} label="السعر">
        <option value="all">كل الأسعار</option>
        <option value="free">مجاني</option>
        <option value="paid">مدفوع</option>
      </Select>

      <Select name="instructor" defaultValue={defaults.instructor ?? "all"} label="الدكتور">
        <option value="all">كل الدكاترة</option>
        {options.instructors.map((instructor) => (
          <option key={instructor.value} value={instructor.value}>
            {instructor.label} ({instructor.count})
          </option>
        ))}
      </Select>

      <Select name="rating" defaultValue={defaults.rating} label="التقييم">
        {ratingOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select name="sort" defaultValue={defaults.sort} label="الترتيب">
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <button className="min-h-11 rounded-lg bg-primary px-5 text-sm font-black text-white hover:bg-[#0b7467]">
        تطبيق
      </button>
      <Link
        className="grid min-h-11 place-items-center rounded-lg border border-border px-4 text-sm font-black text-foreground hover:bg-muted"
        href="/courses"
      >
        مسح
      </Link>
    </form>
  );
}

function Select({
  label,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-white px-3 text-sm font-bold outline-none focus:border-primary"
        {...props}
      />
    </label>
  );
}
