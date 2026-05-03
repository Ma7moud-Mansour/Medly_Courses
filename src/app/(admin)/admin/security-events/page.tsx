import { ShieldAlert } from "lucide-react";
import { requireServerRole } from "@/lib/auth/server-session";
import { prisma } from "@/lib/db";

export default async function AdminSecurityEventsPage() {
  await requireServerRole(["admin", "support"]);

  const events = await prisma.antiPiracyEvent.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      lesson: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-primary">مراجعة الحماية</p>
            <h1 className="mt-2 text-3xl font-black text-foreground">سجل محاولات الالتقاط والحماية</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              هذه الشاشة تعرض أحدث الأحداث التي سجلها مشغل الفيديو عند الاشتباه في التقاط شاشة، فتح أدوات المطور،
              أو تجاوز حدود الأجهزة المسموحة.
            </p>
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm font-bold text-primary">
            {events.length} حدثًا حديثًا
          </div>
        </div>
      </section>

      {events.length ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-[#f6fbf8] text-right text-xs font-black uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">الحدث</th>
                  <th className="px-4 py-3">الطالب</th>
                  <th className="px-4 py-3">الكورس / الدرس</th>
                  <th className="px-4 py-3">الجهاز</th>
                  <th className="px-4 py-3">الجلسة</th>
                  <th className="px-4 py-3">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-4 py-4 font-bold text-foreground">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-[#fff4d9] px-3 py-1 text-xs text-[#8a5a00]">
                        <ShieldAlert className="h-4 w-4" />
                        {event.eventType}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      <div className="font-bold">{event.user.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{event.user.email}</div>
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      <div className="font-bold">{event.course?.title ?? "بدون كورس محدد"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{event.lesson?.title ?? "بدون درس محدد"}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      <div>{event.deviceId ?? "غير معروف"}</div>
                      <div className="mt-1 line-clamp-2">{event.userAgent ?? "بدون user agent"}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {event.sessionId ?? "بدون جلسة"}
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-foreground">
                      {event.createdAt.toLocaleString("ar-EG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-black text-foreground">لا توجد أحداث حماية مسجلة حاليًا</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            سيظهر هنا أي blur أو محاولات PrintScreen أو تغييرات أجهزة مرتبطة بتشغيل الفيديوهات المحمية.
          </p>
        </section>
      )}
    </div>
  );
}
