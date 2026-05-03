import { BarChart3, BookOpen, FileQuestion, Receipt, TicketPercent, Users } from "lucide-react";
import { AnalyticsCards } from "@/components/admin/analytics-cards";
import { getAdminAnalyticsPageData } from "@/lib/admin/actions";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function ChartBox({
  title,
  description,
  values,
  formatter,
}: {
  title: string;
  description: string;
  values: Array<{ label: string; value: number }>;
  formatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...values.map((item) => item.value), 1);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex h-56 items-end gap-3">
        {values.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex w-full items-end justify-center rounded-lg bg-primary/12 px-2 pb-2 pt-3"
              style={{ height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 18 : 8)}%` }}
            >
              <span className="text-[11px] font-black text-primary">
                {formatter ? formatter(item.value) : item.value.toLocaleString("ar-EG")}
              </span>
            </div>
            <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalyticsPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef8f5] text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black">التحليلات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              أرقام حقيقية من PostgreSQL عن المستخدمين، الكورسات، الامتحانات، المدفوعات، والنشاط الشهري.
            </p>
          </div>
        </div>
      </section>

      <AnalyticsCards
        cards={[
          {
            label: "إجمالي المستخدمين",
            value: analytics.summary.totalUsers.toLocaleString("ar-EG"),
            helper: `${analytics.summary.totalStudents.toLocaleString("ar-EG")} طالب فعلي`,
            icon: Users,
          },
          {
            label: "الكورسات المنشورة",
            value: analytics.summary.publishedCourses.toLocaleString("ar-EG"),
            helper: `${analytics.summary.draftCourses.toLocaleString("ar-EG")} مسودة`,
            icon: BookOpen,
          },
          {
            label: "الامتحانات المنشورة",
            value: analytics.summary.publishedExams.toLocaleString("ar-EG"),
            helper: `${analytics.summary.totalExams.toLocaleString("ar-EG")} إجمالي امتحان`,
            icon: FileQuestion,
          },
          {
            label: "إيراد المدفوعات المعتمدة",
            value: formatCurrency(analytics.summary.approvedRevenue),
            helper: `${analytics.summary.waitingPayments.toLocaleString("ar-EG")} طلب دفع ينتظر المراجعة`,
            icon: Receipt,
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartBox
          description="إجمالي قيمة الطلبات المعتمدة لكل شهر."
          formatter={(value) => formatCurrency(value)}
          title="الإيراد الشهري"
          values={analytics.revenueSeries}
        />
        <ChartBox
          description="عدد التسجيلات التي بدأت خلال كل شهر."
          title="التسجيلات الشهرية"
          values={analytics.enrollmentSeries}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">أقوى الكورسات أداءً</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {analytics.topCourses.length ? (
              analytics.topCourses.map((course) => (
                <article key={course.id} className="rounded-lg border border-border bg-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{course.title}</h3>
                      <p className="mt-1 text-xs font-bold text-muted-foreground">
                        {course.categoryName} • د. {course.instructorName}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary">
                      {course.studentsCount.toLocaleString("ar-EG")} طالب
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-muted-foreground">
                    <span>التقييم {course.rating.toFixed(1)}</span>
                    <span>السعر {formatCurrency(course.price)}</span>
                    <span>{course.isPublished ? "منشور" : "مخفي"}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted p-5 text-sm font-bold text-muted-foreground">
                لا توجد كورسات كافية لعرض الترتيب بعد.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TicketPercent className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">أعلى الدكاترة نشاطًا</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {analytics.topInstructors.length ? (
              analytics.topInstructors.map((instructor) => (
                <article key={instructor.id} className="rounded-lg border border-border bg-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{instructor.name}</h3>
                      <p className="mt-1 text-xs font-bold text-muted-foreground">
                        {instructor.publishedCourses.toLocaleString("ar-EG")} كورس منشور
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary">
                      {instructor.studentsCount.toLocaleString("ar-EG")} طالب
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-muted-foreground">
                    <span>متوسط التقييم {instructor.ratingAverage.toFixed(1)}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted p-5 text-sm font-bold text-muted-foreground">
                لا توجد بيانات كافية عن الدكاترة بعد.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
