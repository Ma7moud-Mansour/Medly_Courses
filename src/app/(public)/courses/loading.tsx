import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export default function CoursesLoading() {
  return (
    <>
      <PageHeader
        eyebrow="اكتشاف الكورسات"
        title="جارٍ تحميل الكورسات"
        subtitle="نجهز لك نتائج البحث والفلاتر من قاعدة البيانات."
      />
      <Container className="py-10">
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[420px] animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      </Container>
    </>
  );
}
