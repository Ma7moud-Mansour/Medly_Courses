import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { listAdminPaymentRequests } from "@/lib/payments/repository";
import { performAdminPaymentReviewAction } from "@/lib/payments/actions";
import { requireServerRole } from "@/lib/auth/server-session";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusLabels: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  waiting_review: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  expired: "منتهي",
  refunded: "مسترد",
};

const flashMessages: Record<string, string> = {
  approved: "تم اعتماد الدفع وفتح الكورس للطالب بنجاح.",
  rejected: "تم رفض طلب الدفع وحفظ السبب بنجاح.",
};

export default async function AdminPaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireServerRole(["admin", "support"]);
  const params = await searchParams;
  const status =
    (first(params.status) as
      | "pending_payment"
      | "waiting_review"
      | "approved"
      | "rejected"
      | "expired"
      | "refunded"
      | "all"
      | undefined) ?? "all";
  const flash = first(params.flash);
  const error = first(params.error);
  const payments = await listAdminPaymentRequests({
    adminUserId: session.userId,
    status,
  });

  return (
    <div className="space-y-6">
      {flash && flashMessages[flash] ? <ActionFeedbackBanner kind="success" message={flashMessages[flash]} /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">مراجعة مدفوعات فودافون كاش</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              راجع الإيصالات المرفوعة يدويًا قبل فتح الوصول الحقيقي للكورس داخل حساب الطالب.
            </p>
          </div>
          <form>
            <select className="form-input min-w-[220px]" defaultValue={status} name="status">
              <option value="all">كل الحالات</option>
              <option value="pending_payment">بانتظار الدفع</option>
              <option value="waiting_review">بانتظار المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
              <option value="expired">منتهي</option>
            </select>
          </form>
        </div>
      </section>

      {payments.length ? (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <article key={payment.id} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <div className="grid gap-5 xl:grid-cols-[1.2fr_320px]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black">{payment.studentName}</h2>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                      {statusLabels[payment.status] ?? payment.status}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                    <div>
                      <p className="font-black text-foreground">الطالب</p>
                      <p>{payment.studentEmail}</p>
                    </div>
                    <div>
                      <p className="font-black text-foreground">تاريخ الإرسال</p>
                      <p>{new Date(payment.createdAt).toLocaleString("ar-EG")}</p>
                    </div>
                    <div>
                      <p className="font-black text-foreground">المبلغ</p>
                      <p>{formatCurrency(payment.total)}</p>
                    </div>
                    <div>
                      <p className="font-black text-foreground">كود Medly للدفع</p>
                      <p className="font-black text-primary">{payment.internalPaymentCode || "لم يتم إنشاؤه بعد"}</p>
                    </div>
                    <div>
                      <p className="font-black text-foreground">مرجع فودافون كاش</p>
                      <p>{payment.paymentReference || "غير مضاف"}</p>
                    </div>
                    <div>
                      <p className="font-black text-foreground">رقم المرسل</p>
                      <p>{payment.senderPhone || "غير مضاف"}</p>
                    </div>
                    <div>
                      <p className="font-black text-foreground">رقم الاستلام</p>
                      <p>{payment.paymentRecipientNumber || "غير مضبوط"}</p>
                    </div>
                    <div>
                      <p className="font-black text-foreground">الدكتور</p>
                      <p>{payment.paymentRecipientInstructorName || "غير مضبوط"}</p>
                    </div>
                    <div>
                      <p className="font-black text-foreground">الكورسات</p>
                      <p>{payment.courseTitles.join(", ")}</p>
                    </div>
                  </div>

                  {payment.rejectionReason ? (
                    <div className="rounded-lg border border-[#f1d4d4] bg-[#fff5f5] p-4 text-sm text-[#9a3e3e]">
                      <p className="font-black">سبب الرفض</p>
                      <p className="mt-1">{payment.rejectionReason}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-3 rounded-lg border border-border bg-white p-4">
                    <p className="text-sm font-black">إجراء المراجعة</p>

                    <form action={performAdminPaymentReviewAction} className="flex flex-wrap gap-3">
                      <input name="orderId" type="hidden" value={payment.id} />
                      <input name="decision" type="hidden" value="approve" />
                      <PendingSubmitButton
                        className="min-h-10 px-4 text-sm"
                        disabled={payment.status !== "waiting_review" && payment.status !== "pending_payment"}
                        pendingLabel="جارٍ الاعتماد..."
                      >
                        اعتماد الدفع وفتح الكورس
                      </PendingSubmitButton>
                    </form>

                    <form action={performAdminPaymentReviewAction} className="grid gap-3">
                      <input name="orderId" type="hidden" value={payment.id} />
                      <input name="decision" type="hidden" value="reject" />
                      <textarea
                        className="form-input min-h-24 py-3"
                        name="rejectionReason"
                        placeholder="اكتب سبب رفض الإيصال أو سبب طلب إعادة الرفع"
                      />
                      <PendingSubmitButton
                        className="min-h-10 px-4 text-sm border-danger/30 text-danger hover:bg-danger/5"
                        disabled={payment.status !== "waiting_review" && payment.status !== "pending_payment"}
                        pendingLabel="جارٍ الرفض..."
                        variant="outline"
                      >
                        رفض الطلب
                      </PendingSubmitButton>
                    </form>
                  </div>
                </div>

                <aside className="rounded-lg border border-border bg-white p-4">
                  <p className="mb-3 text-sm font-black">الإيصال المرفوع</p>
                  {payment.receiptPreviewUrl ? (
                    payment.paymentReceiptMimeType?.startsWith("image/") ? (
                      <img
                        alt={`إيصال الدفع ${payment.id}`}
                        className="w-full rounded-lg border border-border object-cover"
                        src={payment.receiptPreviewUrl}
                      />
                    ) : (
                      <iframe className="h-[420px] w-full rounded-lg border border-border" src={payment.receiptPreviewUrl} title={payment.id} />
                    )
                  ) : (
                    <div className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-border bg-muted/20 text-sm font-bold text-muted-foreground">
                      لا يوجد معاينة متاحة للإيصال.
                    </div>
                  )}
                </aside>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
          لا توجد طلبات دفع مطابقة للفلتر الحالي.
        </div>
      )}
    </div>
  );
}
