import Link from "next/link";
import { BookOpen, PlusCircle, UsersRound } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getAdminCoursesPageData } from "@/lib/admin/actions";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const courses = await getAdminCoursesPageData();
  const published = courses.filter((course) => course.isPublished).length;
  const activeStudents = courses.reduce((sum, course) => sum + course.activeStudents, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">إدارة الكورسات</p>
            <h1 className="mt-2 text-3xl font-black">الكورسات</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              أدر بيانات الكورس، السعر، الدكتور، حالة النشر، المحتوى الرئيسي، الدروس، والفيديوهات من مساحة عمل واحدة.
            </p>
          </div>
          <Link className={buttonVariants({ size: "lg" })} href="/admin/courses/new">
            <PlusCircle className="h-4 w-4" />
            إضافة كورس
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-black">{courses.length}</p>
            <p className="text-xs font-bold text-muted-foreground">إجمالي الكورسات</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <StatusBadge label={`${published} منشور`} tone="active" />
            <p className="mt-3 text-xs font-bold text-muted-foreground">جاهز للظهور والشراء</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <UsersRound className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-black">{activeStudents.toLocaleString("ar-EG")}</p>
            <p className="text-xs font-bold text-muted-foreground">تسجيلات فعالة</p>
          </div>
        </div>
      </div>

      {courses.length ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="p-4">الكورس</th>
                <th className="p-4">التصنيف</th>
                <th className="p-4">الدكتور</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الوصول</th>
                <th className="p-4">السعر</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-t border-border align-top">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        alt={course.title}
                        className="h-14 w-20 rounded-lg border border-border object-cover"
                        src={course.thumbnail}
                      />
                      <div>
                        <p className="font-black">{course.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{course.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{course.categoryName}</td>
                  <td className="p-4 text-muted-foreground">{course.instructorName}</td>
                  <td className="p-4">
                    <StatusBadge label={course.isPublished ? "منشور" : "مخفي"} tone={course.isPublished ? "active" : "closed"} />
                  </td>
                  <td className="p-4">
                    <div className="grid gap-1">
                      <span className="font-black">{course.activeStudents.toLocaleString("ar-EG")} فعّال</span>
                      {course.revokedStudents ? (
                        <span className="text-xs text-muted-foreground">
                          {course.revokedStudents.toLocaleString("ar-EG")} مسحوب
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-4 font-black">{formatCurrency(course.discountPrice ?? course.price)}</td>
                  <td className="p-4">
                    <Link className="font-black text-primary" href={`/admin/courses/${course.id}/edit`}>
                      فتح مساحة العمل
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-black">لا توجد كورسات بعد</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
            أنشئ أول كورس، وبعدها أضف الأقسام والدروس والفيديوهات والموارد والامتحانات من مساحة العمل الخاصة به.
          </p>
          <Link className={buttonVariants({ className: "mt-5" })} href="/admin/courses/new">
            إنشاء أول كورس
          </Link>
        </div>
      )}
    </div>
  );
}
