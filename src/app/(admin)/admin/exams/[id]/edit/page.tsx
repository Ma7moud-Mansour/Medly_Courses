import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { ExamForm } from "@/components/admin/exam-form";
import { ExamQuestionManager } from "@/components/admin/exam-question-manager";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireServerRole } from "@/lib/auth/server-session";
import { getAdminExamEditorData } from "@/lib/exams/repository";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const flashMessages: Record<string, string> = {
  "exam-created": "تم إنشاء الامتحان. أضف الأسئلة قبل نشره للطلاب.",
  "exam-updated": "تم حفظ بيانات الامتحان.",
  "question-saved": "تم حفظ السؤال وتحديث مجموع الدرجات.",
  "question-deleted": "تم حذف السؤال وتحديث مجموع الدرجات.",
};

export default async function EditAdminExamPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireServerRole(["admin", "support"]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getAdminExamEditorData(id);
  const flash = Array.isArray(query.flash) ? query.flash[0] : query.flash;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              {data.exam.courseTitle ? `امتحان مرتبط بكورس: ${data.exam.courseTitle}` : "امتحان مستقل"}
            </p>
            <h1 className="mt-2 text-3xl font-black">{data.exam.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              من هنا تدير إعدادات الامتحان، بنك الأسئلة، الدرجات، وتتابع أحدث محاولات الطلاب.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={data.exam.isPublished ? "منشور" : "مسودة"} tone={data.exam.isPublished ? "active" : "draft"} />
            <Link className={buttonVariants({ variant: "outline" })} href="/admin/exams">
              العودة إلى الامتحانات
            </Link>
          </div>
        </div>
      </div>

      {flash && flashMessages[flash] ? <ActionFeedbackBanner kind="success" message={flashMessages[flash]} /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <ExamForm courseOptions={data.courseOptions} exam={data.exam} mode="edit" />
      <ExamQuestionManager exam={data} />

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black">أحدث المحاولات</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            أحدث المحاولات المرسلة أو الجارية تساعدك على متابعة نشاط الطلاب الحقيقي داخل الامتحان.
          </p>
        </div>

        {data.attempts.length ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="p-4">الطالب</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">النتيجة</th>
                  <th className="p-4">بدأ في</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((attempt) => (
                  <tr className="border-t border-border" key={attempt.id}>
                    <td className="p-4">
                      <p className="font-black">{attempt.studentName}</p>
                      <p className="text-xs text-muted-foreground">{attempt.studentEmail}</p>
                    </td>
                    <td className="p-4 font-bold">{attempt.status.replace("_", " ")}</td>
                    <td className="p-4 font-black">
                      {attempt.score}/{attempt.totalMarks}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(attempt.startedAt).toLocaleString("ar-EG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm font-bold text-muted-foreground">
            لا توجد محاولات طلابية مسجلة لهذا الامتحان بعد.
          </div>
        )}
      </section>
    </div>
  );
}
