"use client";

import { Star } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn } from "@/lib/utils";
import type { CourseReviewItem } from "@/lib/course/repository";

export function ReviewList({
  courseId,
  reviews: initialReviews,
  canSubmit = false,
  currentUserReview,
  reviewEligibilityMessage,
}: {
  courseId: string;
  reviews: CourseReviewItem[];
  canSubmit?: boolean;
  currentUserReview?: CourseReviewItem;
  reviewEligibilityMessage?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/reviews/${courseId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/courses")}`);
        return;
      }

      if (!response.ok) {
        setError(payload?.error ?? "تعذر حفظ التقييم الآن.");
        return;
      }

      if (payload?.data) {
        setReviews((current) => [payload.data, ...current]);
      }

      setComment("");
      setRating(5);
      setMessage("تم حفظ تقييمك بنجاح.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black">آراء الطلاب</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              التقييمات المعروضة هنا مخزنة فعليًا في قاعدة البيانات ومربوطة بالطلاب المشتركين.
            </p>
          </div>
          <span className="rounded-lg bg-muted px-3 py-2 text-sm font-black">
            {reviews.length.toLocaleString("ar-EG")} تقييم
          </span>
        </div>

        {canSubmit ? (
          <form className="mt-5 grid gap-4 rounded-lg border border-border bg-muted/40 p-4" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm font-black">قيّم تجربتك مع الكورس</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1;

                  return (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "rounded-lg border px-3 py-2 transition",
                        rating >= value
                          ? "border-[#f2b84b] bg-[#fff7e8] text-[#c68a12]"
                          : "border-border bg-surface text-muted-foreground hover:bg-muted",
                      )}
                      onClick={() => setRating(value)}
                    >
                      <Star className={cn("h-4 w-4", rating >= value && "fill-current")} />
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="grid gap-2 text-sm font-bold">
              تعليقك
              <textarea
                className="form-input min-h-32 py-3"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="اكتب ملاحظتك على الشرح، التنظيم، أو قيمة الكورس في مذاكرتك."
              />
            </label>

            {message ? <p className="text-sm font-bold text-primary">{message}</p> : null}
            {error ? <p className="text-sm font-bold text-danger">{error}</p> : null}

            <Button className="w-full sm:w-fit" disabled={isPending} type="submit">
              {isPending ? "جارٍ إرسال التقييم..." : "إرسال التقييم"}
            </Button>
          </form>
        ) : reviewEligibilityMessage ? (
          <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm font-bold text-muted-foreground">
            {currentUserReview ? "تم حفظ تقييمك لهذا الكورس بالفعل." : reviewEligibilityMessage}
          </div>
        ) : null}
      </section>

      {reviews.length ? (
        reviews.map((review) => (
          <figure key={review.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <figcaption className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#e8f4f0] text-sm font-black text-primary">
                  {(review.userName ?? "م").slice(0, 1)}
                </div>
                <div>
                  <p className="font-black">{review.userName}</p>
                  <RatingStars rating={review.rating} />
                </div>
              </figcaption>
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
            <blockquote className="mt-3 text-sm leading-7 text-muted-foreground">
              {review.comment ?? "بدون تعليق نصي."}
            </blockquote>
          </figure>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface p-5 text-sm font-bold text-muted-foreground">
          لا توجد تقييمات لهذا الكورس بعد. أول تقييم من طالب مشترك سيظهر هنا.
        </div>
      )}
    </div>
  );
}
