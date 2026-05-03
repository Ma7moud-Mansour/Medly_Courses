import { MediaUploadField } from "@/components/admin/media-upload-field";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { createAdminCourseAction, updateAdminCourseAction } from "@/lib/admin/content-actions";
import type { AdminCourseEditorData, AdminCourseOption } from "@/lib/content/repository";
import type { ReactNode } from "react";

type MetadataCourse = AdminCourseEditorData["course"];

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

export function CourseMetadataForm({
  mode,
  course,
  categories,
  instructors,
}: {
  mode: "create" | "edit";
  course?: MetadataCourse;
  categories: AdminCourseOption[];
  instructors: AdminCourseOption[];
}) {
  const action = mode === "create" ? createAdminCourseAction : updateAdminCourseAction;

  return (
    <form action={action} className="grid gap-5">
      {mode === "edit" ? <input name="courseId" type="hidden" value={course?.id} /> : null}

      <FormSection
        title="البيانات الأساسية"
        description="هذه المعلومات تظهر للطالب في الكروت، صفحة الكورس، صفحة الدفع، ولوحة الطالب."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">
            عنوان الكورس
            <input className="form-input" defaultValue={course?.title} name="title" required />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Slug
            <input className="form-input" defaultValue={course?.slug} name="slug" required />
            <span className="text-xs leading-5 text-muted-foreground">
              سلوك الـ slug كما هو. من الأفضل تثبيته بعد شراء الطلاب للكورس.
            </span>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-bold">
          العنوان الفرعي
          <input
            className="form-input"
            defaultValue={course?.subtitle}
            name="subtitle"
            placeholder="جملة قصيرة توضّح قيمة الكورس"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          الوصف
          <textarea
            className="form-input min-h-32 py-3"
            defaultValue={course?.description}
            name="description"
            placeholder="اشرح لمن هذا الكورس، وما الذي يغطيه، والنتيجة المتوقعة للطالب."
            required
          />
        </label>
      </FormSection>

      <FormSection title="التسعير" description="حدد سعر الكورس بوضوح. إذا وُجد سعر مخفّض فسيظهر بدل السعر الأساسي.">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-bold">
            السعر الأساسي
            <input className="form-input" defaultValue={course?.price} min="0" name="price" required type="number" />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            سعر الخصم
            <input className="form-input" defaultValue={course?.discountPrice} min="0" name="discountPrice" type="number" />
          </label>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">نموذج البيع</p>
            <p className="mt-2 text-sm font-black">شراء كورس بشكل فردي</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">لا توجد اشتراكات متكررة في الوصول إلى الكورسات.</p>
          </div>
        </div>
      </FormSection>

      <FormSection title="التصنيف والدكتور" description="اختر التصنيف والدكتور والمستوى واللغة بشكل صحيح لتسهيل الاكتشاف والشراء.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-bold">
            التصنيف
            <select className="form-input" defaultValue={course?.categoryId} name="categoryId" required>
              <option value="">اختر التصنيف</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold">
            الدكتور
            <select className="form-input" defaultValue={course?.instructorId} name="instructorId" required>
              <option value="">اختر الدكتور</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold">
            المستوى
            <select className="form-input" defaultValue={course?.level} name="level" required>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold">
            اللغة
            <input className="form-input" defaultValue={course?.language ?? "العربية"} name="language" />
          </label>
        </div>
      </FormSection>

      <FormSection title="الوسائط" description="ارفع صورة غلاف الكورس. قاعدة البيانات تخزن الرابط والبيانات فقط، وليس الملف الخام.">
        <MediaUploadField
          accept="image/jpeg,image/png,image/webp"
          current={
            course?.thumbnail
              ? {
                  provider: "local",
                  url: course.thumbnail,
                  fileName: "course-thumbnail",
                }
              : undefined
          }
          fieldNames={{ url: "thumbnail" }}
          hint="يفضّل صورة طبية نظيفة مع مساحة مناسبة للنصوص والكروت."
          kind="thumbnail"
          label="صورة الغلاف"
        />
      </FormSection>

      <FormSection title="النشر" description="تحكم في ظهور الكورس داخل الاكتشاف العام وتجربة الشراء للطالب.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ToggleField
            defaultChecked={course?.isPublished}
            helper="يظهر للطلاب ويمكن شراؤه عند التفعيل."
            label="منشور"
            name="isPublished"
          />
          <ToggleField
            defaultChecked={course?.featured}
            helper="يمكن أن يظهر في الأقسام المميزة على الواجهة."
            label="مميز"
            name="featured"
          />
          <ToggleField
            defaultChecked={course?.bestseller}
            helper="يضيف شارة ثقة في الكروت وصفحة الكورس."
            label="الأكثر مبيعًا"
            name="bestseller"
          />
          <ToggleField
            defaultChecked={course?.examPrep}
            helper="يوضح أن الكورس مناسب للمراجعة والاستعداد للامتحان."
            label="تحضير امتحان"
            name="examPrep"
          />
        </div>
      </FormSection>

      <div className="flex justify-end">
        <PendingSubmitButton
          pendingLabel={mode === "create" ? "جارٍ إنشاء الكورس..." : "جارٍ حفظ الكورس..."}
          size="md"
        >
          {mode === "create" ? "إنشاء الكورس والانتقال للمحتوى" : "حفظ بيانات الكورس"}
        </PendingSubmitButton>
      </div>
    </form>
  );
}
