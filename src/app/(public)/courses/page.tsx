import type { Metadata } from "next";
import { CourseFilters } from "@/components/course/course-filters";
import { CourseGrid } from "@/components/course/course-grid";
import { CoursePagination } from "@/components/course/course-pagination";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { discoverPublicCourses } from "@/lib/course/repository";
import { formatNumber } from "@/lib/utils";
import { publicCourseDiscoverySchema } from "@/lib/validators/schemas";

export const metadata: Metadata = {
  title: "الكورسات",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toViewerContext(session: Awaited<ReturnType<typeof getServerSessionUser>>) {
  if (!session.isAuthenticated || !session.userId || !session.role) {
    return { isAuthenticated: false } as const;
  }

  return {
    isAuthenticated: true as const,
    userId: session.userId,
    role: session.role,
  };
}

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const parsed = publicCourseDiscoverySchema.safeParse({
    query: first(params.query),
    category: first(params.category),
    level: first(params.level),
    price: first(params.price),
    instructor: first(params.instructor),
    rating: first(params.rating),
    sort: first(params.sort),
    page: first(params.page),
  });

  const session = await getServerSessionUser();
  const result = await discoverPublicCourses(parsed.success ? parsed.data : {}, toViewerContext(session));

  return (
    <>
      <PageHeader
        eyebrow="اكتشاف الكورسات"
        title="ابحث، فلتر، واختر الكورس المناسب بسرعة"
        subtitle="النتائج هنا مربوطة مباشرة بقاعدة البيانات، وتعرض فقط الكورسات المنشورة المتاحة للشراء أو المتابعة."
      />
      <Container className="py-10">
        <CourseFilters defaults={result.applied} options={result.filters} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            {formatNumber(result.total)} كورس متاح
            {result.total ? ` • صفحة ${formatNumber(result.page)} من ${formatNumber(result.totalPages)}` : ""}
          </p>
          <p>الفرز والبحث والفلاتر كلها تعمل من السيرفر مباشرة.</p>
        </div>

        <div className="mt-6">
          {result.courses.length ? (
            <>
              <CourseGrid courses={result.courses} />
              <CoursePagination className="mt-8" currentPage={result.page} totalPages={result.totalPages} />
            </>
          ) : (
            <EmptyState
              title="لا توجد نتائج بهذه الفلاتر"
              body="جرّب إزالة بعض الفلاتر أو ابحث باسم المادة أو الدكتور فقط، وسنعرض لك الكورسات المنشورة المطابقة."
              actionHref="/courses"
              actionLabel="عرض كل الكورسات"
            />
          )}
        </div>
      </Container>
    </>
  );
}
