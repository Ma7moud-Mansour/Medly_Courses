import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseGrid } from "@/components/course/course-grid";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getPublicCategoryDetailsBySlug } from "@/lib/catalog/repository";

type Params = Promise<{ slug: string }>;

async function getViewerContext() {
  const session = await getServerSessionUser();

  if (!session.isAuthenticated || !session.userId || !session.role) {
    return { isAuthenticated: false } as const;
  }

  return {
    isAuthenticated: true as const,
    userId: session.userId,
    role: session.role,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const details = await getPublicCategoryDetailsBySlug(slug);

  return { title: details?.category.name ?? "تصنيف غير موجود" };
}

export default async function CategoryDetailsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const details = await getPublicCategoryDetailsBySlug(slug, {}, await getViewerContext());

  if (!details) {
    notFound();
  }

  return (
    <>
      <PageHeader eyebrow="تصنيف" title={details.category.name} subtitle={details.category.description} />
      <Container className="py-10">
        {details.discovery.courses.length ? (
          <CourseGrid courses={details.discovery.courses} />
        ) : (
          <EmptyState
            actionHref="/courses"
            actionLabel="عرض كل الكورسات"
            body="لا توجد كورسات منشورة داخل هذا التصنيف حتى الآن."
            title="التصنيف فارغ"
          />
        )}
      </Container>
    </>
  );
}
