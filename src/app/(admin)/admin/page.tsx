import Link from "next/link";
import { AlertTriangle, ClipboardList, ScrollText, UserCog, Users } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminDashboardPageData } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const cards = [
  { key: "totalStudents", label: "إجمالي الطلاب", icon: Users },
  { key: "openTickets", label: "التذاكر المفتوحة", icon: ClipboardList },
  { key: "activeImpersonations", label: "جلسات الانتحال النشطة", icon: UserCog },
  { key: "auditCount", label: "سجلات التدقيق", icon: ScrollText },
] as const;

export default async function AdminPage() {
  const { summary, flaggedStudents, tickets, logs } = await getAdminDashboardPageData();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.key} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-3xl font-black text-[#0f172a]">
                  {summary[card.key].toLocaleString("ar-EG")}
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#eef8f5] text-primary">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">تنبيهات تحتاج متابعة</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                الطلاب المحظورون أو الحالات التي تحتاج تدخل سريع من الإدارة تظهر هنا أولًا.
              </p>
            </div>
            <Link className="text-sm font-black text-primary" href="/admin/students">
              فتح صفحة الطلاب
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {flaggedStudents.length ? (
              flaggedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-black">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge label="محظور" tone="blocked" />
                    <Link className="text-sm font-black text-primary" href={`/admin/students/${student.id}`}>
                      فتح الملف
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm font-bold text-muted-foreground">
                لا توجد حسابات محظورة حاليًا.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#8a6a2f]">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-black">ملخص تشغيلي سريع</p>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-bold text-muted-foreground">طلاب نشطون</p>
              <p className="mt-2 text-2xl font-black">{summary.activeStudents.toLocaleString("ar-EG")}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-bold text-muted-foreground">طلاب موقوفون</p>
              <p className="mt-2 text-2xl font-black">{summary.suspendedStudents.toLocaleString("ar-EG")}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-bold text-muted-foreground">صلاحيات فردية مفعّلة</p>
              <p className="mt-2 text-2xl font-black">{summary.overrideCount.toLocaleString("ar-EG")}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">أحدث تذاكر الدعم</h2>
            <Link className="text-sm font-black text-primary" href="/admin/tickets">
              كل التذاكر
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {tickets.length ? (
              tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-border bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{ticket.title}</p>
                    <StatusBadge
                      label={ticket.status === "open" ? "مفتوحة" : "قيد المتابعة"}
                      tone={ticket.status}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{ticket.user?.name ?? "بدون حساب"}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm font-bold text-muted-foreground">
                لا توجد تذاكر جديدة في الوقت الحالي.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">آخر الأنشطة الإدارية</h2>
            <Link className="text-sm font-black text-primary" href="/admin/audit-logs">
              سجل التدقيق
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {logs.length ? (
              logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-border bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{log.action}</p>
                    <p className="text-xs font-bold text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {(log.admin?.name ?? "الإدارة")} ← {log.targetUser?.name ?? "بدون مستخدم مستهدف"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm font-bold text-muted-foreground">
                لا توجد أنشطة مسجلة بعد.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
