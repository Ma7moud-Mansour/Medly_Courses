import { MediaUploadField } from "@/components/admin/media-upload-field";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { createAdminInstructorAction, updateAdminInstructorAction } from "@/lib/admin/content-actions";
import type { ReactNode } from "react";

type Instructor = {
  id?: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  title?: string | null;
  titleEn?: string | null;
  avatar?: string | null;
  bio?: string | null;
  bioEn?: string | null;
  specialization?: string | null;
  specializationEn?: string | null;
  vodafoneCashNumber?: string | null;
};

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
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

export function InstructorForm({
  mode,
  instructor,
}: {
  mode: "create" | "update";
  instructor?: Instructor;
}) {
  const action = mode === "create" ? createAdminInstructorAction : updateAdminInstructorAction;

  return (
    <form action={action} className="grid gap-6">
      {mode === "update" && instructor?.id ? <input name="instructorId" type="hidden" value={instructor.id} /> : null}

      <FormSection
        description="الاسم والمعرّف الخاص بالدكتور على المنصة. الرابط (Slug) يجب أن يكون باللغة الإنجليزية بدون مسافات."
        title="البيانات الأساسية"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">الاسم (عربي) *</span>
            <input
              required
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.name}
              name="name"
              placeholder="د. محمد أحمد"
              type="text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">الاسم (إنجليزي)</span>
            <input
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.nameEn ?? ""}
              name="nameEn"
              placeholder="Dr. Mohamed Ahmed"
              type="text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">الرابط (Slug) *</span>
            <input
              required
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.slug}
              name="slug"
              placeholder="dr-mohamed"
              type="text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">رقم فودافون كاش (لتحويل الأرباح)</span>
            <input
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.vodafoneCashNumber ?? ""}
              name="vodafoneCashNumber"
              placeholder="010XXXXXXXX"
              type="text"
            />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="المسمى الوظيفي والتخصص الذي يظهر أسفل اسم الدكتور وفي الكروت."
        title="التخصص والمسمى"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">اللقب (عربي)</span>
            <input
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.title ?? ""}
              name="title"
              placeholder="أستاذ مشارك"
              type="text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">اللقب (إنجليزي)</span>
            <input
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.titleEn ?? ""}
              name="titleEn"
              placeholder="Associate Professor"
              type="text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">التخصص (عربي)</span>
            <input
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.specialization ?? ""}
              name="specialization"
              placeholder="الجراحة العامة"
              type="text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">التخصص (إنجليزي)</span>
            <input
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.specializationEn ?? ""}
              name="specializationEn"
              placeholder="General Surgery"
              type="text"
            />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="الصورة الشخصية والنبذة التفصيلية عن الدكتور."
        title="الصورة والنبذة"
      >
        <div className="grid gap-4">
          <div className="max-w-[200px]">
            <MediaUploadField
              accept="image/jpeg,image/png,image/webp"
              current={
                instructor?.avatar
                  ? {
                      provider: "local",
                      url: instructor.avatar,
                      fileName: "instructor-avatar",
                    }
                  : undefined
              }
              fieldNames={{ url: "avatar" }}
              helper="يُفضل صورة مربعة واضحة"
              kind="thumbnail"
              label="الصورة الشخصية"
            />
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">النبذة (عربي)</span>
            <textarea
              className="h-32 w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.bio ?? ""}
              name="bio"
              placeholder="اكتب نبذة مختصرة عن الدكتور..."
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-muted-foreground">النبذة (إنجليزي)</span>
            <textarea
              className="h-32 w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
              defaultValue={instructor?.bioEn ?? ""}
              name="bioEn"
              placeholder="Write a short bio..."
            />
          </label>
        </div>
      </FormSection>

      <div className="flex items-center gap-4 border-t border-border pt-6">
        <PendingSubmitButton className="w-full sm:w-auto" label={mode === "create" ? "إنشاء الدكتور" : "حفظ التعديلات"} />
      </div>
    </form>
  );
}
