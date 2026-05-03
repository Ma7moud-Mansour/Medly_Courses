import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstructorAvatar } from "@/components/instructors/instructor-avatar";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { enrichedInstructors } from "@/data/medly";

export function InstructorsShowcase() {
  return (
    <section className="bg-[#f8faf8] py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeader eyebrow="الدكاترة" title="الدكاترة" />
          <div className="grid gap-4 sm:grid-cols-2">
            {enrichedInstructors.map((instructor) => (
              <Link
                key={instructor.id}
                className="group rounded-lg border border-[#e8eeec] bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#dceeea]"
                href={`/instructors/${instructor.slug}`}
              >
                <InstructorAvatar
                  avatar={instructor.avatar}
                  className="h-16 w-16"
                  name={instructor.name}
                  slug={instructor.slug}
                />
                <h3 className="mt-5 text-2xl font-black text-[#0f172a]">{instructor.name}</h3>
                <div className="mt-5 flex items-center justify-between border-t border-[#e8eeec] pt-4 text-sm font-black">
                  <span className="text-[#8a6a2f]">{instructor.coursesCount} كورسات</span>
                  <span className="inline-flex items-center gap-2 text-[#0e5f5c]">
                    الملف الشخصي
                    <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
