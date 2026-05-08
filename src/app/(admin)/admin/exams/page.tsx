import Link from "next/link";
import { FileQuestion, PlusCircle, Timer, Trash2 } from "lucide-react";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requireServerRole } from "@/lib/auth/server-session";
import { deleteAdminExamAction } from "@/lib/exams/actions";
import { listAdminExams } from "@/lib/exams/repository";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const flashMessages: Record<string, string> = {
  "exam-deleted": "تم حذف الامتحان وكل الأسئلة والمحاولات المرتبطة به.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function DeleteExamButton({ examId }: { examId: string }) {
  return (
    <form action={deleteAdminExamAction}>
      <input name="examId" type="hidden" value={examId} />
      <PendingSubmitButton
        className="border-danger/30 px-3 py-2 text-xs text-danger hover:bg-danger/5"
        pendingLabel="جاري حذف الامتحان..."
        size="sm"
        variant="outline"
      >
        <Trash2 className="h-4 w-4" />
        حذف
      </PendingSubmitButton>
    </form>
  );
}

export default async function AdminExamsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireServerRole(["admin", "support"]);
  const query = await searchParams;
  const flash = first(query.flash);
  const error = first(query.error);
  const exams = await listAdminExams();
  const published = exams.filter((exam) => exam.isPublished).length;
  const standalone = exams.filter((exam) => !exam.courseId).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">إدارة الامتحانات</p>
            <h1 className="mt-2 text-3xl font-black">الامتحانات</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              أنشئ امتحانات مستقلة أو اربطها بكورسات. الأسئلة والمحاولات والتقييم وتوقيت الإتاحة كلها مربوطة بقاعدة
              البيانات فعليًا.
            </p>
          </div>
          <Link className={buttonVariants({ size: "lg" })} href="/admin/exams/new">
            <PlusCircle className="h-4 w-4" />
            إضافة امتحان
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <p className="text-xs font-black text-muted-foreground">إجمالي الامتحانات</p>
            <p className="mt-2 text-2xl font-black">{exams.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <p className="text-xs font-black text-muted-foreground">المنشور</p>
            <p className="mt-2 text-2xl font-black text-primary">{published}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <p className="text-xs font-black text-muted-foreground">المستقل</p>
            <p className="mt-2 text-2xl font-black">{standalone}</p>
          </div>
        </div>
      </div>

      {flash ? <ActionFeedbackBanner kind="success" message={flashMessages[flash] ?? "تم تنفيذ الإجراء بنجاح."} /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      {exams.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="p-4">الامتحان</th>
                <th className="p-4">النوع</th>
                <th className="p-4">الأسئلة</th>
                <th className="p-4">المحاولات</th>
                <th className="p-4">التوقيت</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr className="border-t border-border align-top" key={exam.id}>
                  <td className="p-4">
                    <p className="font-black">{exam.title}</p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                      {exam.description || exam.slug}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-black">
                      <FileQuestion className="h-3.5 w-3.5 text-primary" />
                      {exam.courseTitle ?? "مستقل"}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{exam.questionsCount}</td>
                  <td className="p-4 font-bold">{exam.attemptsCount}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Timer className="h-4 w-4 text-primary" />
                      {exam.durationMinutes} دقيقة • النجاح {exam.passingScore}/{exam.totalMarks}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge label={exam.isPublished ? "منشور" : "مسودة"} tone={exam.isPublished ? "active" : "draft"} />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link className="font-black text-primary" href={`/admin/exams/${exam.id}/edit`}>
                        فتح مساحة الامتحان
                      </Link>
                      <DeleteExamButton examId={exam.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center shadow-sm">
          <FileQuestion className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-black">لا توجد امتحانات بعد</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
            ابدأ بامتحان مستقل أو اربط امتحانًا بكورس، ثم أكمل بنك الأسئلة من مساحة العمل الخاصة به.
          </p>
          <Link className={buttonVariants({ className: "mt-5" })} href="/admin/exams/new">
            إنشاء أول امتحان
          </Link>
        </div>
      )}
    </div>
  );
}
