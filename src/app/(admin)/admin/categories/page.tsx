import { Boxes, FolderOpen } from "lucide-react";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { getAdminCategoriesPageData } from "@/lib/admin/actions";
import {
  createAdminCategoryAction,
  deleteAdminCategoryAction,
  updateAdminCategoryAction,
} from "@/lib/admin/content-actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ flash?: string; error?: string }>;
}) {
  const params = await searchParams;
  const flash = params?.flash;
  const error = params?.error;
  const categories = await getAdminCategoriesPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef8f5] text-primary">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black">التصنيفات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              قائمة التصنيفات الحقيقية مع عدد الكورسات المنشورة والمخفية داخل كل تصنيف.
            </p>
          </div>
        </div>
      </section>

      {flash ? <ActionFeedbackBanner kind="success" message="تم تحديث التصنيفات بنجاح." /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-black">إضافة تصنيف جديد</h2>
        <form action={createAdminCategoryAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input className="form-input" name="name" placeholder="اسم التصنيف" required />
          <input className="form-input" name="nameEn" placeholder="English name" />
          <input className="form-input" name="slug" placeholder="slug" required />
          <input className="form-input xl:col-span-2" name="description" placeholder="وصف اختياري" />
          <input className="form-input xl:col-span-2" name="descriptionEn" placeholder="English description" />
          <input className="form-input" name="icon" placeholder="icon اختياري" />
          <div className="md:col-span-2 xl:col-span-6">
            <PendingSubmitButton pendingLabel="جاري الإضافة..." size="md">
              إضافة تصنيف
            </PendingSubmitButton>
          </div>
        </form>
      </section>

      {categories.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{category.name}</h2>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">{category.slug}</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-primary">
                  <FolderOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {category.description ?? "لا يوجد وصف مضاف لهذا التصنيف بعد."}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-bold text-muted-foreground">إجمالي</p>
                  <p className="mt-1 text-xl font-black">{category.totalCourses.toLocaleString("ar-EG")}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-bold text-muted-foreground">منشور</p>
                  <p className="mt-1 text-xl font-black text-primary">{category.publishedCourses.toLocaleString("ar-EG")}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-bold text-muted-foreground">مخفي</p>
                  <p className="mt-1 text-xl font-black">{category.hiddenCourses.toLocaleString("ar-EG")}</p>
                </div>
              </div>
              <form action={updateAdminCategoryAction} className="mt-5 grid gap-3">
                <input name="categoryId" type="hidden" value={category.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="form-input" defaultValue={category.name} name="name" required />
                  <input className="form-input" defaultValue={category.nameEn} name="nameEn" placeholder="English name" />
                  <input className="form-input" defaultValue={category.slug} name="slug" required />
                </div>
                <input className="form-input" defaultValue={category.description} name="description" placeholder="وصف التصنيف" />
                <input
                  className="form-input"
                  defaultValue={category.descriptionEn}
                  name="descriptionEn"
                  placeholder="English description"
                />
                <input className="form-input" defaultValue={category.icon} name="icon" placeholder="icon" />
                <PendingSubmitButton pendingLabel="جاري الحفظ..." size="sm" variant="outline">
                  حفظ التعديل
                </PendingSubmitButton>
              </form>
              <form action={deleteAdminCategoryAction} className="mt-3">
                <input name="categoryId" type="hidden" value={category.id} />
                <PendingSubmitButton
                  disabled={category.totalCourses > 0}
                  pendingLabel="جاري الحذف..."
                  size="sm"
                  variant="outline"
                >
                  حذف التصنيف
                </PendingSubmitButton>
                {category.totalCourses > 0 ? (
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    لا يمكن حذف التصنيف قبل نقل أو حذف الكورسات المرتبطة به.
                  </p>
                ) : null}
              </form>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm font-bold text-muted-foreground shadow-sm">
          لا توجد تصنيفات مرتبطة بكورسات حتى الآن.
        </div>
      )}
    </div>
  );
}
