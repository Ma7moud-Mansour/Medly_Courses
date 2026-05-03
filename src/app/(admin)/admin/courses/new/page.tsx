import Link from "next/link";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { CourseMetadataForm } from "@/components/admin/course-metadata-form";
import { buttonVariants } from "@/components/ui/button";
import { listAdminCourseFormOptions } from "@/lib/content/repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewCoursePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);
  const options = await listAdminCourseFormOptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">كورس جديد</p>
          <h1 className="mt-2 text-3xl font-black">إنشاء كورس</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            ابدأ ببيانات الكورس الأساسية. بعد الحفظ سيتم نقلك مباشرة إلى مساحة المحتوى الرئيسية لإضافة الأقسام والدروس
            والفيديوهات والمرفقات والامتحانات المرتبطة.
          </p>
        </div>
        <Link className={buttonVariants({ variant: "outline" })} href="/admin/courses">
          العودة إلى الكورسات
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["المحتوى الرئيسي", "ستضيف الأقسام والدروس وترتيب المنهج مباشرة بعد إنشاء الكورس."],
          ["الفيديوهات والملفات", "رفع الفيديو والمرفقات يتم من محرر المحتوى نفسه وليس من صفحة خارجية."],
          ["الامتحانات المرتبطة", "يمكنك ربط امتحان بالكورس من مساحة العمل بعد الحفظ."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-base font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>

      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <CourseMetadataForm categories={options.categories} instructors={options.instructors} mode="create" />
    </div>
  );
}
