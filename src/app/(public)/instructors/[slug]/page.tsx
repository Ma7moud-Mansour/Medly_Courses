import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseGrid } from "@/components/course/course-grid";
import { InstructorAvatar } from "@/components/instructors/instructor-avatar";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getPublicInstructorDetailsBySlug } from "@/lib/catalog/repository";
import { formatNumber } from "@/lib/utils";

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
  const details = await getPublicInstructorDetailsBySlug(slug);

  return { title: details?.instructor.name ?? "دكتور غير موجود" };
}

export default async function InstructorDetailsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const details = await getPublicInstructorDetailsBySlug(slug, {}, await getViewerContext());

  if (!details) {
    notFound();
  }

  return (
    <>
      <PageHeader title={details.instructor.name} subtitle={details.instructor.bio} />
      <Container className="grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-border bg-surface p-5">
          <InstructorAvatar
            avatar={details.instructor.avatar}
            className="h-52 w-full"
            name={details.instructor.name}
            priority
            slug={details.instructor.slug}
          />
          <h2 className="mt-4 text-xl font-black">{details.instructor.name}</h2>
          {details.instructor.specialization ? (
            <p className="mt-2 text-sm font-bold text-muted-foreground">{details.instructor.specialization}</p>
          ) : null}
          <div className="mt-4 grid gap-2 text-sm">
            <p className="font-bold">{formatNumber(details.instructor.coursesCount)} كورسات</p>
            <p className="font-bold">{formatNumber(details.instructor.studentsCount)} طالب</p>
            <p className="font-bold">{details.instructor.rating}/5 تقييم</p>
          </div>
        </aside>
        <div>
          <h2 className="mb-5 text-2xl font-black">كورسات الدكتور</h2>
          {details.discovery.courses.length ? (
            <CourseGrid courses={details.discovery.courses} />
          ) : (
            <EmptyState
              actionHref="/courses"
              actionLabel="عرض كل الكورسات"
              body="لا توجد كورسات منشورة لهذا الدكتور حتى الآن."
              title="لا توجد كورسات"
            />
          )}
        </div>
      </Container>
    </>
  );
}
