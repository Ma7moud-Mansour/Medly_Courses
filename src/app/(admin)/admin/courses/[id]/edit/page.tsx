import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { CourseCurriculumEditor } from "@/components/admin/course-curriculum-editor";
import { CourseMetadataForm } from "@/components/admin/course-metadata-form";
import { DeleteCourseButton } from "@/components/admin/delete-course-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getAdminCourseEditorData } from "@/lib/content/repository";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const flashMessages: Record<string, string> = {
  "course-created": "تم إنشاء الكورس. يمكنك الآن إضافة المحتوى الرئيسي.",
  "course-updated": "تم حفظ بيانات الكورس.",
  "section-created": "تم إنشاء القسم بنجاح.",
  "section-updated": "تم تحديث القسم بنجاح.",
  "lesson-created": "تم إنشاء الدرس بنجاح.",
  "lesson-updated": "تم تحديث الدرس بنجاح.",
  "attachment-created": "تم حفظ المرفق بنجاح.",
  "attachment-updated": "تم تحديث المرفق بنجاح.",
  "attachment-deleted": "تم حذف المرفق بنجاح.",
};

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getAdminCourseEditorData(id);
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">مساحة عمل الكورس</p>
            <h1 className="mt-2 text-3xl font-black">{data.course.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              من هنا تعدّل البيانات الأساسية وتضيف الأقسام والدروس والفيديوهات. استخدم زر المعاينة لفتح صفحة الطالب مباشرة.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DeleteCourseButton courseId={data.course.id} courseTitle={data.course.title} />
            <StatusBadge label={data.course.isPublished ? "منشور" : "مخفي"} tone={data.course.isPublished ? "active" : "closed"} />
            <Link className={buttonVariants({ variant: "outline" })} href={`/courses/${data.course.slug}`}>
              معاينة صفحة الطالب
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/admin/courses">
              العودة إلى الكورسات
            </Link>
          </div>
        </div>
      </div>

      {flash && flashMessages[flash] ? <ActionFeedbackBanner kind="success" message={flashMessages[flash]} /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <CourseMetadataForm categories={data.categories} course={data.course} instructors={data.instructors} mode="edit" />
      <CourseCurriculumEditor course={data} />
    </div>
  );
}
