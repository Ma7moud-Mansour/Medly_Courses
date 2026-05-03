import Link from "next/link";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { ExamForm } from "@/components/admin/exam-form";
import { buttonVariants } from "@/components/ui/button";
import { requireServerRole } from "@/lib/auth/server-session";
import { listExamCourseOptions } from "@/lib/exams/repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewAdminExamPage({ searchParams }: { searchParams: SearchParams }) {
  await requireServerRole(["admin", "support"]);
  const params = await searchParams;
  const error = first(params.error);
  const courseOptions = await listExamCourseOptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">امتحان جديد</p>
          <h1 className="mt-2 text-3xl font-black">إنشاء امتحان</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            احفظ بيانات الامتحان أولًا، ثم ستنتقل مباشرة إلى بنك الأسئلة لإضافة أسئلة اختيار من متعدد وصح وخطأ وأسئلة
            مقالية بنفس المحرر الكامل.
          </p>
        </div>
        <Link className={buttonVariants({ variant: "outline" })} href="/admin/exams">
          العودة إلى الامتحانات
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["اختيار من متعدد", "إضافة خيارات متعددة وتحديد الإجابة الصحيحة أو الصحيحة المتعددة."],
          ["صح وخطأ", "نفس المحرر يدعم أسئلة صح وخطأ بإعداد مباشر وواضح."],
          ["أسئلة مقالية", "يمكنك إضافة سؤال كتابي مع مراجعة يدوية للدرجة بعد التسليم."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-base font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>

      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <ExamForm courseOptions={courseOptions} mode="create" />
    </div>
  );
}
