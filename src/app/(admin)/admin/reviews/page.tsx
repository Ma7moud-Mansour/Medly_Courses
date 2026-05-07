import Link from "next/link";
import { MessageSquare, Trash2 } from "lucide-react";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { deleteAdminReviewAction } from "@/lib/admin/content-actions";
import { getAdminReviewsPageData } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  const [reviews, params] = await Promise.all([getAdminReviewsPageData(), searchParams]);
  const flash = first(params.flash);
  const error = first(params.error);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef8f5] text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black">المراجعات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              مراجعات الطلاب مرتبطة بقاعدة البيانات، ويمكن حذف أي مراجعة غير مناسبة.
            </p>
          </div>
        </div>
      </section>

      {flash ? <ActionFeedbackBanner kind="success" message={flash} /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      {reviews.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black">{review.userName}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">{review.studentEmail}</p>
                </div>
                <p className="text-sm font-black text-primary">{review.rating}/5</p>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <p className="font-bold text-foreground">{review.courseTitle}</p>
                <p className="text-xs text-muted-foreground">د. {review.instructorName}</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {review.comment ?? "تم إرسال تقييم بدون تعليق مكتوب."}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground">
                <span>{new Date(review.createdAt).toLocaleDateString("ar-EG")}</span>
                <Link className="text-primary" href={`/courses/${review.courseSlug}`}>
                  فتح صفحة الكورس
                </Link>
              </div>

              <form action={deleteAdminReviewAction} className="mt-4 flex justify-end border-t border-border pt-4">
                <input name="reviewId" type="hidden" value={review.id} />
                <PendingSubmitButton
                  className="border-danger/40 text-danger hover:bg-danger/5"
                  label="حذف المراجعة"
                  pendingLabel="جاري الحذف..."
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                </PendingSubmitButton>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm font-bold text-muted-foreground shadow-sm">
          لا توجد مراجعات مسجلة بعد.
        </div>
      )}
    </div>
  );
}
