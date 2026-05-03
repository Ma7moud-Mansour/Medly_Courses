import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { InstructorAvatar } from "@/components/instructors/instructor-avatar";
import { formatNumber } from "@/lib/utils";
import type { Instructor } from "@/types";

export function InstructorBox({ instructor }: { instructor: Instructor }) {
  return (
    <Link
      className="grid gap-4 rounded-lg border border-border bg-surface p-5 transition hover:bg-muted sm:grid-cols-[96px_1fr]"
      href={`/instructors/${instructor.slug}`}
    >
      <InstructorAvatar
        avatar={instructor.avatar}
        className="h-24 w-24"
        name={instructor.name}
        slug={instructor.slug}
      />
      <div>
        <h3 className="text-2xl font-black">{instructor.name}</h3>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4 text-primary" />
            {formatNumber(instructor.studentsCount ?? 0)} طالب
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-primary" />
            {(instructor.coursesCount ?? 0).toLocaleString("ar-EG")} كورس
          </span>
        </div>
      </div>
    </Link>
  );
}
