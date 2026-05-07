import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { CourseGrid } from "@/components/course/course-grid";
import { buttonVariants } from "@/components/ui/button";
import { listFeaturedCourses } from "@/lib/course/repository";

export async function FeaturedCourses() {
  const featured = await listFeaturedCourses({ isAuthenticated: false }, 3);

  if (!featured.length) {
    return null;
  }

  return (
    <section className="bg-[#f8faf8] py-20">
      <Container>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeader
            eyebrow="كورسات مختارة"
            title="محتوى طبي جاد، بتصميم يساعدك تركز."
            subtitle="اختر الكورس المناسب، ادفع مرة واحدة، وابدأ الدراسة فورًا من حسابك."
          />
          <Link className={buttonVariants({ variant: "outline" })} href="/courses">
            كل الكورسات
          </Link>
        </div>
        <div className="mt-10">
          <CourseGrid courses={featured} />
        </div>
      </Container>
    </section>
  );
}
