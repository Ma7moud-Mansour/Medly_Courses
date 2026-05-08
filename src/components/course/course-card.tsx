"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  GraduationCap,
  MessageSquare,
  PlayCircle,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/course/wishlist-button";
import { buttonVariants } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn, formatCurrency, formatNumber, getDiscountPercent } from "@/lib/utils";
import { getLocalizedField } from "@/lib/i18n/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import type { Course } from "@/types";

type CourseCardData = Course & {
  categoryName?: string;
  instructorName?: string;
  instructorBio?: string;
  isWishlisted?: boolean;
  isEnrolled?: boolean;
  accessStatus?: "active" | "revoked" | "expired" | "inactive";
  isAccessible?: boolean;
  learningHref?: string;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  const { language } = useLanguage();
  const discount = getDiscountPercent(course.price, course.discountPrice);
  const currentPrice = course.discountPrice ?? course.price;
  
  const localizedTitle = getLocalizedField(course, "title", language);
  const localizedSubtitle = getLocalizedField(course, "subtitle", language);
  const categoryName = course.categoryName ?? "كورس طبي";
  
  const instructorName = course.instructorName ?? "هيئة التدريس";
  
  const instructorBio = course.instructorBio ?? "شرح طبي منظم ومباشر يختصر عليك وقت المذاكرة.";

  return (
    <article className="motion-card group flex h-full flex-col overflow-hidden rounded-lg border border-[#e4eeeb] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#d0e4de] hover:shadow-[0_24px_48px_rgba(15,23,42,0.11)]">
      <Link className="relative block aspect-[16/9] overflow-hidden bg-[#f2f6f4]" href={`/courses/${course.slug}`}>
        <Image
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          src={course.thumbnail}
          alt={localizedTitle}
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {discount ? (
            <span className="rounded-lg bg-[#fbf8ef] px-3 py-1.5 text-xs font-black text-[#8a6a2f] shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
              خصم {discount}%
            </span>
          ) : (
            <span />
          )}
          {course.isEnrolled ? (
            <span
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-black shadow-[0_8px_18px_rgba(15,23,42,0.08)]",
                course.isAccessible ? "bg-[#e8f6f1] text-primary" : "bg-[#fbf4e6] text-[#8a6a2f]",
              )}
            >
              {course.isAccessible ? "ضمن كورساتك" : "وصول غير نشط"}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs font-black">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5fbf9] px-2.5 py-1 text-[#0e5f5c]">
            <Stethoscope className="h-3.5 w-3.5" />
            {categoryName}
          </span>
        </div>

        <Link href={`/courses/${course.slug}`}>
          <h3 className="mt-3 line-clamp-2 text-xl font-black leading-8 text-[#0f172a] transition hover:text-[#0e5f5c]">
            {localizedTitle}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-7 text-[#5f6f6c]">
          {localizedSubtitle || (language === "ar" ? "شرح طبي منظم، مع خطوات واضحة للمذاكرة والمتابعة." : "Structured medical explanation with clear steps for studying and following up.")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-[#edf4f2] bg-[#fbfcfc] px-3 py-2.5 text-xs font-bold text-[#536a66]">
          <span className="inline-flex items-center gap-1.5 font-black text-[#0f172a]">
            <RatingStars rating={course.rating} />
            {course.rating ? course.rating.toFixed(1) : "0.0"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#5f6f6c]">
            <MessageSquare className="h-3.5 w-3.5 text-[#0e5f5c]" />
            {formatNumber(course.reviewsCount)} تقييم
          </span>
        </div>

        <div className="mt-4 rounded-lg border border-[#e8efec] bg-[#f9fbfb] p-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#0f172a]">
            <UserRound className="h-4 w-4 text-[#0e5f5c]" />
            {instructorName}
          </span>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#5f6f6c]">{instructorBio}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e8eeec] pt-4 text-xs font-bold text-[#5f6f6c]">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#0e5f5c]" />
            {course.durationHours} ساعة
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-[#0e5f5c]" />
            {course.lessonsCount} درس
          </span>
          {course.studentsCount ? (
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#0e5f5c]" />
              {formatNumber(course.studentsCount)} طالب
            </span>
          ) : null}
        </div>

        <div className="mt-auto grid gap-3 pt-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
          <div className="w-full rounded-lg border border-[#dcebe7] bg-[#f5fbf9] px-4 py-3 shadow-[0_10px_24px_rgba(14,95,92,0.05)] sm:w-auto">
            <p className="text-xs font-bold text-[#5f6f6c]">سعر الكورس</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#0f172a]">
              {formatCurrency(currentPrice)}
            </p>
            {course.discountPrice ? (
              <div className="mt-1 flex items-center gap-2 text-xs font-bold">
                <span className="text-[#8b9a97] line-through">{formatCurrency(course.price)}</span>
                <span className="rounded-md bg-[#fbf8ef] px-2 py-0.5 text-[#8a6a2f]">وفر {discount}%</span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {course.isAccessible ? (
              <Link className={buttonVariants()} href={course.learningHref ?? `/learn/${course.slug}`}>
                <PlayCircle className="h-4 w-4" />
                متابعة
              </Link>
            ) : (
              <AddToCartButton course={course} label="أضف" />
            )}
            <WishlistButton courseId={course.id} initialActive={course.isWishlisted} />
          </div>
        </div>
      </div>
    </article>
  );
}
