import { requireServerSession } from "@/lib/auth/server-session";
import { listStudentBilling } from "@/lib/student/repository";
import { formatCurrency } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  pending_payment: "Pending payment",
  waiting_review: "Waiting review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  refunded: "Refunded",
};

export default async function BillingPage() {
  const session = await requireServerSession();
  const invoices = await listStudentBilling(session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Payments and orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track every manual Vodafone Cash submission and see whether it is still waiting review, approved, or rejected.
        </p>
      </div>

      {invoices.length ? (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <article key={invoice.id} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{invoice.id}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                  {statusLabels[invoice.status] ?? invoice.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="font-black text-foreground">Amount</p>
                  <p>{formatCurrency(invoice.total)}</p>
                </div>
                <div>
                  <p className="font-black text-foreground">Method</p>
                  <p>{invoice.paymentMethod || "Vodafone Cash"}</p>
                </div>
                <div>
                  <p className="font-black text-foreground">Medly payment code</p>
                  <p className="font-black text-primary">{invoice.internalPaymentCode || "Not generated"}</p>
                </div>
                <div>
                  <p className="font-black text-foreground">Vodafone reference</p>
                  <p>{invoice.paymentReference || "Not provided"}</p>
                </div>
                <div>
                  <p className="font-black text-foreground">Recipient</p>
                  <p>
                    {invoice.paymentRecipientInstructorName || "Instructor"} - {invoice.paymentRecipientNumber || "Not configured"}
                  </p>
                </div>
                <div>
                  <p className="font-black text-foreground">Courses</p>
                  <p>{invoice.courseTitles.join(", ")}</p>
                </div>
              </div>

              {invoice.rejectionReason ? (
                <div className="mt-4 rounded-lg border border-[#f1d4d4] bg-[#fff5f5] p-4 text-sm text-[#9a3e3e]">
                  <p className="font-black">Why this was rejected</p>
                  <p className="mt-1">{invoice.rejectionReason}</p>
                </div>
              ) : null}

              {invoice.receiptPreviewUrl ? (
                <div className="mt-4">
                  <a className="text-sm font-black text-primary underline-offset-4 hover:underline" href={invoice.receiptPreviewUrl} target="_blank" rel="noreferrer">
                    Open submitted receipt
                  </a>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
          No payment requests are linked to this account yet.
        </div>
      )}
    </div>
  );
}
