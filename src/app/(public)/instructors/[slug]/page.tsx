import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseGrid } from "@/components/course/course-grid";
import { InstructorAvatar } from "@/components/instructors/instructor-avatar";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { courses, getInstructorBySlug } from "@/data/medly";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const instructor = getInstructorBySlug(slug);
  return { title: instructor?.name ?? "دكتور غير موجود" };
}

export default async function InstructorDetailsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const instructor = getInstructorBySlug(slug);

  if (!instructor) {
    notFound();
  }

  const instructorCourses = courses.filter((course) => course.instructorId === instructor.id);

  return (
    <>
      <PageHeader title={instructor.name} />
      <Container className="grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-border bg-surface p-5">
          <InstructorAvatar
            avatar={instructor.avatar}
            className="h-52 w-full"
            name={instructor.name}
            priority
            slug={instructor.slug}
          />
          <h2 className="mt-4 text-xl font-black">{instructor.name}</h2>
        </aside>
        <div>
          <h2 className="mb-5 text-2xl font-black">كورسات الدكتور</h2>
          <CourseGrid courses={instructorCourses} />
        </div>
      </Container>
    </>
  );
}
