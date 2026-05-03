import { Boxes, FolderOpen } from "lucide-react";
import { getAdminCategoriesPageData } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
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
