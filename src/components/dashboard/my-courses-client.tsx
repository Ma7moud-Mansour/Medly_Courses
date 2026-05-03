import Image from "next/image";
import Link from "next/link";
import { EyeOff, ShieldCheck, Video } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { buttonVariants } from "@/components/ui/button";
import type { StudentCourseCard } from "@/lib/student/repository";

export function MyCoursesClient({
  activeCourses,
  unavailableCourses,
  customNote,
}: {
  activeCourses: StudentCourseCard[];
  unavailableCourses: StudentCourseCard[];
  customNote?: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-black">كورساتي</h1>
      <p className="mt-2 text-muted-foreground">
        هنا تظهر الكورسات المربوطة بحسابك الحقيقي فقط، مع حالة الوصول والتقدم المحفوظ من قاعدة البيانات.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#eef8f5] px-3 py-1.5 text-sm font-black text-primary">
            <ShieldCheck className="h-4 w-4" />
            صلاحياتك الحالية
          </span>
          {activeCourses[0] ? (
            <>
              <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-bold">
                الامتحانات: {activeCourses[0].permissions.canTakeExam ? "مسموحة" : "مخفية"}
              </span>
              <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-bold">
                البث المباشر: {activeCourses[0].permissions.canAccessLive ? "مسموح" : "موقوف"}
              </span>
              <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-bold">
                المنتدى: {activeCourses[0].permissions.hideForum ? "مخفي" : "ظاهر"}
              </span>
              <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-bold">
                التحميل: {activeCourses[0].permissions.canDownloadVideos ? "مسموح" : "غير متاح"}
              </span>
            </>
          ) : null}
        </div>
        {customNote ? <p className="mt-3 text-sm font-bold text-muted-foreground">{customNote}</p> : null}
        {unavailableCourses.length ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#fbf4e6] px-3 py-2 text-sm font-black text-[#8a6a2f]">
            <EyeOff className="h-4 w-4" />
            يوجد {unavailableCourses.length.toLocaleString("ar-EG")} كورس غير متاح الآن بسبب حالة الوصول الحالية.
          </p>
        ) : null}
      </section>

      <div className="mt-6 grid gap-4">
        {activeCourses.length ? (
          activeCourses.map((course) => (
            <article
              key={course.courseId}
              className="grid gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm md:grid-cols-[180px_1fr_auto] md:items-center"
            >
              <div className="relative h-36 w-full overflow-hidden rounded-lg bg-[#eef6f3] md:h-28">
                <Image fill sizes="180px" className="object-cover" src={course.thumbnail} alt={course.title} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
                  <span>{course.categoryName}</span>
                  <span>•</span>
                  <span>{course.instructorName}</span>
                </div>
                <h2 className="mt-2 text-xl font-black">{course.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {course.lastLessonTitle
                    ? `آخر درس محفوظ: ${course.lastLessonTitle}`
                    : "الكورس جاهز للمتابعة من أول درس."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-lg bg-muted px-2.5 py-1">
                    {course.permissions.canTakeExam ? "الاختبار متاح" : "الاختبار غير متاح"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1">
                    <Video className="h-3.5 w-3.5" />
                    {course.permissions.canDownloadVideos ? "التحميل متاح" : "التحميل غير متاح"}
                  </span>
                </div>
                <div className="mt-4 max-w-md">
                  <ProgressBar value={course.progress} />
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    {course.progress}% • {course.completedLessons} من {course.totalLessons} درس
                  </p>
                </div>
              </div>
              <Link className={buttonVariants()} href={course.learningHref ?? `/learn/${course.courseSlug}`}>
                فتح
              </Link>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
            لا توجد كورسات نشطة في حسابك الآن.
          </div>
        )}
      </div>

      {unavailableCourses.length ? (
        <section className="mt-8">
          <h2 className="text-xl font-black">كورسات غير متاحة الآن</h2>
          <div className="mt-4 grid gap-4">
            {unavailableCourses.map((course) => (
              <article
                key={course.courseId}
                className="grid gap-4 rounded-lg border border-border bg-surface/80 p-4 opacity-80 md:grid-cols-[160px_1fr_auto] md:items-center"
              >
                <div className="relative h-32 w-full overflow-hidden rounded-lg bg-[#eef6f3] md:h-24">
                  <Image
                    fill
                    sizes="160px"
                    className="object-cover grayscale-[0.15]"
                    src={course.thumbnail}
                    alt={course.title}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black">{course.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{course.disabledReason}</p>
                </div>
                <span
                  className={buttonVariants({
                    variant: "outline",
                    className: "pointer-events-none opacity-80",
                  })}
                >
                  غير متاح
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
