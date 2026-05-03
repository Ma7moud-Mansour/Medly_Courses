import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requireServerRole } from "@/lib/auth/server-session";
import { getAdminSupportTicket, listAdminSupportTickets } from "@/lib/support/repository";
import { performAdminSupportAction } from "@/lib/support/actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusLabels: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المتابعة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

export default async function AdminTicketsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireServerRole(["admin", "support"]);
  const params = await searchParams;
  const status = (first(params.status) as "open" | "in_progress" | "resolved" | "closed" | "all" | undefined) ?? "all";
  const selectedTicketId = first(params.ticket);
  const flash = first(params.flash);
  const error = first(params.error);
  const tickets = await listAdminSupportTickets({ status });
  const selectedTicket =
    (selectedTicketId ? await getAdminSupportTicket(selectedTicketId) : undefined) ??
    (tickets[0] ? await getAdminSupportTicket(tickets[0].id) : undefined);

  return (
    <div className="space-y-6">
      {flash ? <ActionFeedbackBanner kind="success" message="تم تحديث التذكرة بنجاح." /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">صندوق الدعم</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              راجع رسائل الطلاب ورسائل التواصل الجديدة، ورد عليها، وحدّث حالة التذاكر من نفس المساحة.
            </p>
          </div>
          <form>
            <select className="form-input min-w-[220px]" defaultValue={status} name="status">
              <option value="all">كل التذاكر</option>
              <option value="open">مفتوحة</option>
              <option value="in_progress">قيد المتابعة</option>
              <option value="resolved">تم الحل</option>
              <option value="closed">مغلقة</option>
            </select>
          </form>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="space-y-3">
            {tickets.length ? (
              tickets.map((ticket) => (
                <a
                  key={ticket.id}
                  className={`block rounded-lg border px-4 py-4 transition ${
                    selectedTicket?.id === ticket.id
                      ? "border-primary bg-[#eef8f5]"
                      : "border-border bg-white hover:border-primary/30"
                  }`}
                  href={`/admin/tickets?status=${status}&ticket=${ticket.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{ticket.title}</p>
                    {ticket.unreadForAdmin ? (
                      <span className="rounded-full bg-[#f4b942] px-2 py-1 text-[10px] font-black text-[#3d3213]">
                        جديد
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">
                    {ticket.userName} - {statusLabels[ticket.status] ?? ticket.status}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {ticket.latestMessagePreview || ticket.description}
                  </p>
                </a>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-white p-5 text-sm font-bold text-muted-foreground">
                لا توجد تذاكر مطابقة للفلتر الحالي.
              </div>
            )}
          </div>
        </aside>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          {selectedTicket ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black">{selectedTicket.title}</h2>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                  {statusLabels[selectedTicket.status] ?? selectedTicket.status}
                </span>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <div>
                  <p className="font-black text-foreground">المرسل</p>
                  <p>{selectedTicket.userName}</p>
                  <p>{selectedTicket.userEmail}</p>
                </div>
                <div>
                  <p className="font-black text-foreground">المسؤول الحالي</p>
                  <p>{selectedTicket.assignedToAdminName || "غير مسندة"}</p>
                </div>
                <div>
                  <p className="font-black text-foreground">آخر نشاط</p>
                  <p>{selectedTicket.lastMessageAt ? new Date(selectedTicket.lastMessageAt).toLocaleString("ar-EG") : "-"}</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-white p-4">
                {selectedTicket.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`rounded-lg px-4 py-3 ${
                      message.senderRole === "admin" || message.senderRole === "support" ? "bg-[#eef8f5]" : "bg-[#f7fbfa]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-black">
                        {message.senderName}{" "}
                        <span className="text-xs font-bold text-muted-foreground">({message.senderRole})</span>
                      </p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString("ar-EG")}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{message.body}</p>
                  </article>
                ))}
              </div>

              <form action={performAdminSupportAction} className="grid gap-4 rounded-lg border border-border bg-white p-4">
                <input name="intent" type="hidden" value="reply-ticket" />
                <input name="ticketId" type="hidden" value={selectedTicket.id} />
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <label className="grid gap-2 text-sm font-bold">
                    الحالة بعد الرد
                    <select className="form-input" defaultValue={selectedTicket.status} name="status">
                      <option value="open">مفتوحة</option>
                      <option value="in_progress">قيد المتابعة</option>
                      <option value="resolved">تم الحل</option>
                      <option value="closed">مغلقة</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    نص الرد
                    <textarea className="form-input min-h-32 py-3" name="message" placeholder="اكتب ردًا واضحًا ومباشرًا للطالب" />
                  </label>
                </div>
                <PendingSubmitButton pendingLabel="جارٍ إرسال الرد...">
                  إرسال الرد
                </PendingSubmitButton>
              </form>

              <form action={performAdminSupportAction} className="grid gap-3 rounded-lg border border-border bg-white p-4">
                <input name="intent" type="hidden" value="status-ticket" />
                <input name="ticketId" type="hidden" value={selectedTicket.id} />
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <label className="grid gap-2 text-sm font-bold">
                    تحديث الحالة فقط
                    <select className="form-input" defaultValue={selectedTicket.status} name="status">
                      <option value="open">مفتوحة</option>
                      <option value="in_progress">قيد المتابعة</option>
                      <option value="resolved">تم الحل</option>
                      <option value="closed">مغلقة</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    ملاحظة الحل
                    <textarea
                      className="form-input min-h-24 py-3"
                      defaultValue={selectedTicket.resolutionNote || ""}
                      name="resolutionNote"
                      placeholder="ملاحظة اختيارية تُحفظ داخل التذكرة"
                    />
                  </label>
                </div>
                <PendingSubmitButton pendingLabel="جارٍ حفظ الحالة..." variant="outline">
                  حفظ حالة التذكرة
                </PendingSubmitButton>
              </form>
            </div>
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-border bg-white p-6 text-center text-sm font-bold text-muted-foreground">
              اختر تذكرة من القائمة لعرض المحادثة ومتابعة الردود.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
