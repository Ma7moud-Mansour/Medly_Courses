import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { InstructorAvatar } from "@/components/instructors/instructor-avatar";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { listPublicInstructors } from "@/lib/catalog/repository";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الدكاترة",
};

export default async function InstructorsPage() {
  const { instructors } = await listPublicInstructors({ pageSize: 24 });

  return (
    <>
      <PageHeader eyebrow="الدكاترة" title="الدكاترة" />
      <Container className="grid gap-5 py-8 sm:grid-cols-2 lg:py-10 xl:grid-cols-3">
        {instructors.map((instructor) => (
          <Link
            key={instructor.id}
            className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-5"
            href={`/instructors/${instructor.slug}`}
          >
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <InstructorAvatar
                avatar={instructor.avatar}
                className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
                name={instructor.name}
                slug={instructor.slug}
              />
              <div className="min-w-0">
                <h2 className="break-words text-xl font-black sm:text-2xl">{instructor.name}</h2>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4 text-primary" />
                {formatNumber(instructor.studentsCount ?? 0)}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-primary" />
                {instructor.coursesCount} كورسات
              </span>
            </div>
          </Link>
        ))}
      </Container>
    </>
  );
}
