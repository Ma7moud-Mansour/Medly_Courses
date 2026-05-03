import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseGrid } from "@/components/course/course-grid";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { courses, getCategoryBySlug } from "@/data/medly";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  return { title: category?.name ?? "تصنيف غير موجود" };
}

export default async function CategoryDetailsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const categoryCourses = courses.filter((course) => course.categoryId === category.id);

  return (
    <>
      <PageHeader
        eyebrow="تصنيف"
        title={category.name}
        subtitle={category.description}
      />
      <Container className="py-10">
        <CourseGrid courses={categoryCourses} />
      </Container>
    </>
  );
}
