import { createAdminExamAction, updateAdminExamAction } from "@/lib/exams/actions";
import type { AdminExamEditorData } from "@/lib/exams/repository";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { ReactNode } from "react";

type ExamFormData = AdminExamEditorData["exam"];
type CourseOption = AdminExamEditorData["courseOptions"][number];

function dateTimeValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function ToggleField({
  name,
  label,
  helper,
  defaultChecked,
}: {
  name: string;
  label: string;
  helper: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex gap-3 rounded-lg border border-border bg-muted/35 p-4 text-sm">
      <input className="mt-1" defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span>
        <span className="block font-black text-foreground">{label}</span>
        <span className="mt-1 block leading-6 text-muted-foreground">{helper}</span>
      </span>
    </label>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function ExamForm({
  mode,
  exam,
  courseOptions,
}: {
  mode: "create" | "edit";
  exam?: ExamFormData;
  courseOptions: CourseOption[];
}) {
  const action = mode === "create" ? createAdminExamAction : updateAdminExamAction;

  return (
    <form action={action} className="grid gap-5">
      {mode === "edit" ? <input name="examId" type="hidden" value={exam?.id} /> : null}

      <FormSection
        title="بيانات الامتحان الأساسية"
        description="سمِّ الامتحان بوضوح وحدد هل هو مستقل أم مرتبط بكورس."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">
            عنوان الامتحان
            <input className="form-input" defaultValue={exam?.title} name="title" required />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Slug الامتحان
            <input
              className="form-input"
              defaultValue={exam?.slug}
              name="slug"
              placeholder="medical-basics-final"
              required
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-bold">
          وصف مختصر
          <textarea
            className="form-input min-h-24 py-3"
            defaultValue={exam?.description}
            name="description"
            placeholder="ملخص قصير يظهر للطالب قبل بدء الامتحان."
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          تعليمات للطالب
          <textarea
            className="form-input min-h-28 py-3"
            defaultValue={exam?.instructions}
            name="instructions"
            placeholder="أضف التعليمات، ملاحظات الوقت، وما الذي يجب على الطالب معرفته قبل البدء."
          />
        </label>
      </FormSection>

      <FormSection
        title="الوصول والتوقيت"
        description="الامتحان المستقل متاح للطلاب النشطين، والامتحان المرتبط بكورس يحتاج وصولًا فعالًا للكورس."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-bold">
            الكورس المرتبط
            <select className="form-input" defaultValue={exam?.courseId ?? ""} name="courseId">
              <option value="">امتحان مستقل</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            يبدأ في
            <input className="form-input" defaultValue={dateTimeValue(exam?.startsAt)} name="startsAt" type="datetime-local" />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            ينتهي في
            <input className="form-input" defaultValue={dateTimeValue(exam?.endsAt)} name="endsAt" type="datetime-local" />
          </label>
        </div>
      </FormSection>

      <FormSection
        title="الدرجات"
        description="درجات الأسئلة تُكوّن المجموع تلقائيًا. درجة النجاح هي الحد الأدنى لاجتياز الامتحان."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-bold">
            مدة الامتحان بالدقائق
            <input className="form-input" defaultValue={exam?.durationMinutes ?? 30} min="1" name="durationMinutes" required type="number" />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            درجة النجاح
            <input className="form-input" defaultValue={exam?.passingScore ?? 1} min="0" name="passingScore" required type="number" />
          </label>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">إجمالي الدرجات</p>
            <p className="mt-2 text-2xl font-black text-primary">{exam?.totalMarks ?? 0}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">يتم تحديثه تلقائيًا من درجات الأسئلة المحفوظة.</p>
          </div>
        </div>
      </FormSection>

      <FormSection title="النشر" description="اترك الامتحان كمسودة حتى يكتمل بنك الأسئلة ويصبح جاهزًا للطلاب.">
        <div className="grid gap-3 md:grid-cols-3">
          <ToggleField
            defaultChecked={exam?.isPublished}
            helper="يظهر للطلاب عندما تسمح قواعد الوصول بذلك."
            label="منشور"
            name="isPublished"
          />
          <ToggleField
            defaultChecked={exam?.allowRetakes}
            helper="يسمح للطالب بمحاولة جديدة بعد الإرسال."
            label="السماح بإعادة المحاولة"
            name="allowRetakes"
          />
          <ToggleField
            defaultChecked={exam?.showResults ?? true}
            helper="يمكن للطالب رؤية النتيجة والحالة بعد الإرسال."
            label="إظهار النتيجة"
            name="showResults"
          />
        </div>
      </FormSection>

      <div className="flex justify-end">
        <PendingSubmitButton pendingLabel={mode === "create" ? "جارٍ إنشاء الامتحان..." : "جارٍ حفظ الامتحان..."} size="md">
          {mode === "create" ? "إنشاء الامتحان والانتقال للأسئلة" : "حفظ بيانات الامتحان"}
        </PendingSubmitButton>
      </div>
    </form>
  );
}
