import Image from "next/image";
import Link from "next/link";
import { Bell, BookOpen } from "lucide-react";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { buttonVariants } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server-session";
import { getStudentDashboardOverview } from "@/lib/student/repository";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireServerSession();
  const overview = await getStudentDashboardOverview(session.userId);

  if (!overview) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
        لا توجد بيانات متاحة لهذا الحساب الآن.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={overview.stats} />
      <ContinueLearning course={overview.continueLearning} />
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">اقتراحات مناسبة لك</h2>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/courses">
              تصفح الكورسات
            </Link>
          </div>
          {overview.recommendedCourses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overview.recommendedCourses.map((course) => (
                <article key={course.id} className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                  <div className="relative aspect-[16/10] bg-[#eef6f3]">
                    <Image
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 768px) 35vw, 100vw"
                      className="object-cover"
                      src={course.thumbnail}
                      alt={course.title}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
                      <span>{course.categoryName}</span>
                      <span>•</span>
                      <span>{course.instructorName}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-black">{course.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                      {course.subtitle ?? "كورس طبي منظم ومباشر مناسب للمراجعة والتركيز."}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">السعر</p>
                        <p className="text-lg font-black text-primary">
                          {formatCurrency(course.discountPrice ?? course.price)}
                        </p>
                      </div>
                      <Link className={buttonVariants({ size: "sm" })} href={`/courses/${course.slug}`}>
                        عرض الكورس
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
              لا توجد اقتراحات إضافية الآن. بمجرد شراء كورسات جديدة ستظهر هنا اقتراحات مرتبطة بمسارك.
            </div>
          )}
        </div>
        <aside className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">آخر الإشعارات</h2>
            <Link className="rounded-lg border border-border p-2 hover:bg-muted" href="/dashboard/notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </div>
          {overview.notifications.length ? (
            <div className="mt-4 grid gap-3">
              {overview.notifications.map((notification) => (
                <div key={notification.id} className="rounded-lg bg-muted p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{notification.title}</p>
                    <span className="rounded-lg bg-surface px-2 py-1 text-[11px] font-black text-muted-foreground">
                      {notification.read ? "مقروء" : "جديد"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{notification.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm font-bold text-muted-foreground">
              لا توجد إشعارات جديدة الآن.
            </div>
          )}
          <div className="mt-5 rounded-lg border border-border bg-[#eef8f5] p-4">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4" />
              <p className="font-black">ملخص سريع</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              لديك {overview.stats.activeCourses.toLocaleString("ar-EG")} كورس نشط و{" "}
              {overview.stats.completedLessons.toLocaleString("ar-EG")} درس مكتمل حتى الآن.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
