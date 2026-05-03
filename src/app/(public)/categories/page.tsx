import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { enrichedCategories } from "@/data/medly";

export const metadata: Metadata = {
  title: "التصنيفات",
};

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="التصنيفات"
        title="ابدأ من المادة أو نوع المراجعة"
        subtitle="كل تصنيف يجمع الكورسات والاختبارات والموارد المناسبة لنفس المسار."
      />
      <Container className="grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {enrichedCategories.map((category) => (
          <Link
            key={category.id}
            className="group rounded-lg border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            href={`/categories/${category.slug}`}
          >
            <p className="text-sm font-black text-primary">{category.coursesCount} كورسات</p>
            <h2 className="mt-3 text-2xl font-black">{category.name}</h2>
            <p className="mt-3 min-h-20 text-sm leading-7 text-muted-foreground">{category.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 font-black text-primary">
              عرض الكورسات
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
            </span>
          </Link>
        ))}
      </Container>
    </>
  );
}
