import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CurriculumAccordion } from "@/components/course/curriculum-accordion";
import { CourseHero } from "@/components/course/course-hero";
import { InstructorBox } from "@/components/course/instructor-box";
import { PurchaseCard } from "@/components/course/purchase-card";
import { RelatedCourses } from "@/components/course/related-courses";
import { ReviewList } from "@/components/course/review-list";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getCourseDetailsBySlug } from "@/lib/course/repository";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

function normalizeRouteSlug(slug: string) {
  try {
    return decodeURIComponent(slug).trim();
  } catch {
    return slug.trim();
  }
}

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
  const { slug: routeSlug } = await params;
  const slug = normalizeRouteSlug(routeSlug);
  const details = await getCourseDetailsBySlug(slug, { isAuthenticated: false });

  return {
    title: details?.course.title ?? "كورس غير موجود",
    description: details?.course.description,
  };
}

export default async function CourseDetailsPage({ params }: { params: Params }) {
  await connection();

  const { slug: routeSlug } = await params;
  const slug = normalizeRouteSlug(routeSlug);
  const viewer = await getViewerContext();
  const details =
    (await getCourseDetailsBySlug(slug, viewer)) ??
    (await getCourseDetailsBySlug(slug, { isAuthenticated: false }));

  if (!details) {
    notFound();
  }

  return (
    <>
      <CourseHero course={details.course} />
      <Container className="grid gap-8 py-8 lg:gap-10 lg:py-10 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="min-w-0 space-y-10 lg:space-y-12 xl:col-start-1 xl:row-start-1">
          <section>
            <SectionHeader
              title="ماذا ستحصل من الكورس"
              subtitle="هذه النقاط مبنية على البيانات الحقيقية للكورس وحالة الوصول داخل حسابك."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {details.course.learningOutcomes.map((outcome) => (
                <div key={outcome} className="rounded-lg border border-border bg-surface p-4 font-bold leading-7">
                  {outcome}
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              title="محتوى الكورس"
              subtitle={`${details.curriculum.length} وحدة منظمة، وكل وحدة تحتوي دروسًا حقيقية مسجلة في قاعدة البيانات.`}
            />
            <div className="mt-5">
              <CurriculumAccordion curriculum={details.curriculum} />
            </div>
          </section>

          <section>
            <SectionHeader title="الدكتور" subtitle="بيانات المحاضر وعدد الكورسات والطلاب مأخوذة من قاعدة البيانات مباشرة." />
            <div className="mt-5">
              <InstructorBox instructor={details.instructor} />
            </div>
          </section>

          <section>
            <SectionHeader title="تقييمات الطلاب" subtitle="لا يمكن إرسال التقييم إلا من طالب لديه وصول نشط للكورس." />
            <div className="mt-5">
              <ReviewList
                courseId={details.course.id}
                reviews={details.reviews}
                canSubmit={details.canReview && viewer.isAuthenticated && viewer.role === "student"}
                currentUserReview={details.currentUserReview}
                reviewEligibilityMessage={details.reviewEligibilityMessage}
              />
            </div>
          </section>

          <section>
            <SectionHeader title="كورسات مرتبطة" subtitle="اقتراحات حقيقية من نفس الدكتور أو نفس التخصص." />
            <div className="mt-5">
              <RelatedCourses courses={details.relatedCourses} />
            </div>
          </section>
        </div>
        <div className="row-start-1 min-w-0 xl:col-start-2 xl:row-start-1">
          <PurchaseCard course={details.course} />
        </div>
      </Container>
    </>
  );
}
