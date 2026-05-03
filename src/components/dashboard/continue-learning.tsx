import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { buttonVariants } from "@/components/ui/button";
import type { StudentCourseCard } from "@/lib/student/repository";

export function ContinueLearning({ course }: { course?: StudentCourseCard }) {
  if (!course) {
    return null;
  }

  return (
    <section className="grid gap-5 rounded-lg border border-border bg-surface p-5 lg:grid-cols-[220px_1fr_auto] lg:items-center">
      <div className="relative h-44 w-full overflow-hidden rounded-lg bg-[#eef6f3] lg:h-32">
        <Image fill className="object-cover" sizes="220px" src={course.thumbnail} alt={course.title} />
      </div>
      <div>
        <p className="text-sm font-black text-primary">كمل من حيث توقفت</p>
        <h2 className="mt-1 text-2xl font-black">{course.title}</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {course.lastLessonTitle
            ? `آخر درس محفوظ: ${course.lastLessonTitle}. التقدم يتحدث من حسابك مباشرة.`
            : "آخر درس محفوظ داخل الحساب، والتقدم يتحدث من قاعدة البيانات مباشرة."}
        </p>
        <div className="mt-4">
          <ProgressBar value={course.progress} />
          <p className="mt-2 text-xs font-bold text-muted-foreground">
            {course.progress}% مكتمل • {course.completedLessons} من {course.totalLessons} درس
          </p>
        </div>
      </div>
      <Link className={buttonVariants()} href={course.learningHref ?? `/learn/${course.courseSlug}`}>
        <PlayCircle className="h-4 w-4" />
        متابعة
      </Link>
    </section>
  );
}
