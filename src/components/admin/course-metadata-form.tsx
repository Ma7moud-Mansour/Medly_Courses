import { MediaUploadField } from "@/components/admin/media-upload-field";
import { UploadSubmitGuard } from "@/components/admin/upload-submit-guard";
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
  const isPublishedDefault = mode === "create" ? true : Boolean(course?.isPublished);
  const languageValue = course?.language ?? "العربية";

  return (
    <form action={action} className="grid gap-5">
      <UploadSubmitGuard />
      {mode === "edit" ? <input name="courseId" type="hidden" value={course?.id} /> : null}
      <input name="slug" type="hidden" value={course?.slug ?? ""} />
      <input name="level" type="hidden" value={course?.level ?? "beginner"} />
      <input name="language" type="hidden" value={languageValue} />
      <input name="featured" type="hidden" value={course?.featured ? "true" : "false"} />
      <input name="bestseller" type="hidden" value={course?.bestseller ? "true" : "false"} />
      <input name="examPrep" type="hidden" value={course?.examPrep ? "true" : "false"} />

      <FormSection
        title="بيانات الكورس التي تظهر للطالب"
        description="اكتب اسم الكورس ووصفه وارفع صورة الغلاف. باقي التفاصيل التقنية يتم ضبطها تلقائيًا."
      >
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold">
            عنوان الكورس
            <input className="form-input" defaultValue={course?.title} name="title" required />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            وصف قصير أو طويل، براحتك
            <textarea
              className="form-input min-h-28 py-3"
              defaultValue={course?.description}
              name="description"
              placeholder="مثال: شرح مبسط لمنهج الكورس مع أهم النقاط التي سيذاكرها الطالب."
              required
            />
          </label>

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
            required
            label="صورة الغلاف"
          />
        </div>
      </FormSection>

      <FormSection title="التصنيف والدكتور والسعر" description="اختار التصنيف والدكتور، واكتب السعر. هذه البيانات هي التي تظهر في صفحة الطالب والدفع.">
        <div className="grid gap-4 md:grid-cols-2">
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
            السعر الأساسي
            <input className="form-input" defaultValue={course?.price} min="0" name="price" required type="number" />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            سعر الخصم، اختياري
            <input className="form-input" defaultValue={course?.discountPrice} min="0" name="discountPrice" type="number" />
          </label>
        </div>

        <ToggleField
          defaultChecked={isPublishedDefault}
          helper="لو مقفول، الكورس يفضل محفوظ في الأدمن لكنه لن يظهر للطلبة."
          label="إظهار الكورس للطلبة بعد الحفظ"
          name="isPublished"
        />
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
