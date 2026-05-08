import Link from "next/link";
import { CheckCircle2, Landmark, PlayCircle } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { BuyNowButton } from "@/components/cart/buy-now-button";
import { WishlistButton } from "@/components/course/wishlist-button";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, getDiscountPercent } from "@/lib/utils";
import type { Course } from "@/types";

type PurchaseCourse = Course & {
  isWishlisted?: boolean;
  isEnrolled?: boolean;
  isAccessible?: boolean;
  accessStatus?: "active" | "revoked" | "expired" | "inactive";
  learningHref?: string;
};

function getAccessMessage(course: PurchaseCourse) {
  if (!course.isEnrolled) {
    return undefined;
  }

  if (course.isAccessible) {
    return "هذا الكورس موجود بالفعل داخل كورساتي ويمكنك المتابعة فورًا.";
  }

  if (course.accessStatus === "revoked") {
    return "تم إيقاف الوصول لهذا الكورس من الحساب الحالي.";
  }

  if (course.accessStatus === "expired") {
    return "انتهت مدة الوصول لهذا الكورس. راجع الدعم إذا كنت تتوقع استمرار الوصول.";
  }

  return "هذا الكورس مرتبط بحسابك لكن الوصول غير متاح حاليًا.";
}

export function PurchaseCard({ course }: { course: PurchaseCourse }) {
  const discount = getDiscountPercent(course.price, course.discountPrice);
  const accessMessage = getAccessMessage(course);

  return (
    <aside className="w-full min-w-0 xl:-mt-56 xl:sticky xl:top-20">
      <div className="overflow-hidden rounded-lg border border-[#e8eeec] bg-white shadow-[0_22px_70px_rgba(15,23,42,0.09)]">
        <div className="relative aspect-video bg-[#f2f6f4]">
          <img className="h-full w-full object-cover" src={course.thumbnail} alt={course.title} />
          {course.previewVideo ? (
            <a
              className="absolute inset-0 grid place-items-center bg-[#0f172a]/20 text-white"
              href={course.previewVideo}
              target="_blank"
              rel="noreferrer"
            >
              <span className="flex items-center gap-2 rounded-lg bg-[#0f172a]/70 px-4 py-3 font-black backdrop-blur">
                <PlayCircle className="h-5 w-5" />
                شاهد المعاينة
              </span>
            </a>
          ) : null}
        </div>
        <div className="p-5">
          <div className="grid gap-3 sm:flex sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#5f6f6c]">سعر الكورس</p>
              <p className="mt-1 text-3xl font-black text-[#0f172a]">
                {formatCurrency(course.discountPrice ?? course.price)}
              </p>
              {course.discountPrice ? (
                <p className="mt-1 text-sm text-[#5f6f6c]">
                  بدلًا من <span className="line-through">{formatCurrency(course.price)}</span>
                </p>
              ) : null}
            </div>
            {discount ? (
              <span className="rounded-lg bg-[#fbf8ef] px-3 py-2 text-sm font-black text-[#8a6a2f]">
                وفر {discount}%
              </span>
            ) : null}
          </div>

          <div className="mt-5 rounded-lg border border-[#e6dcc4] bg-[#fbf8ef] p-3 text-sm font-bold text-[#8a6a2f]">
            <Landmark className="mb-2 h-5 w-5" />
            الدفع يتم عبر فودافون كاش ثم مراجعة يدوية قبل تفعيل الكورس.
          </div>

          {accessMessage ? (
            <div className="mt-4 rounded-lg border border-[#dcebe7] bg-[#f5fbf9] p-3 text-sm font-bold text-[#0e5f5c]">
              {accessMessage}
            </div>
          ) : null}

          <div className="mt-5 grid gap-2">
            {course.isAccessible ? (
              <Link className={buttonVariants({ className: "w-full" })} href={course.learningHref ?? `/learn/${course.slug}`}>
                ابدأ الدراسة الآن
              </Link>
            ) : course.isEnrolled ? (
              <span
                className={buttonVariants({
                  variant: "outline",
                  className: "pointer-events-none w-full opacity-80",
                })}
              >
                الوصول غير متاح
              </span>
            ) : (
              <>
                <AddToCartButton course={course} label="أضف للسلة" className="w-full" />
                <BuyNowButton className="w-full" course={course} />
              </>
            )}
            <WishlistButton
              courseId={course.id}
              initialActive={course.isWishlisted}
              label="إضافة للمفضلة"
              activeLabel="في المفضلة"
              className="w-full"
            />
          </div>

          <ul className="mt-5 grid gap-3 text-sm text-[#5f6f6c]">
            {["وصول كامل للكورس", "موارد قابلة للتحميل", "حفظ آخر موضع", "يظهر في كورساتي بعد اعتماد الدفع"].map(
              (item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0e5f5c]" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
