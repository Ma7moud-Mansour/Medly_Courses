"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MessageSquare,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { useLanguage } from "@/components/i18n/language-provider";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn, getDiscountPercent } from "@/lib/utils";
import { getLocalizedField } from "@/lib/i18n/utils";
import type { CourseListItem } from "@/lib/course/repository";

const copy = {
  ar: {
    eyebrow: "أحدث إضافات Medly",
    title: "أحدث الكورسات",
    subtitle:
      "كورسات منشورة من قاعدة البيانات مباشرة، مرتبة بوضوح وتوصلك لأهم المحتوى الطبي بطريقة هادئة وعملية.",
    latest: "جديد",
    cta: "عرض الكورس",
    price: "سعر الكورس",
    hours: "ساعة",
    reviews: "تقييم",
    instructorLabel: "مع",
    save: "وفر",
    defaultInstructorSummary: "شرح منظم ومراجعة هادئة تساعدك تذاكر بثقة وتثبت المعلومة بسرعة.",
    emptyTitle: "لا توجد كورسات منشورة الآن",
    emptyBody: "بمجرد نشر أول كورس سيظهر هنا تلقائيًا بدون أي بيانات تجريبية.",
  },
  en: {
    eyebrow: "Latest Medly additions",
    title: "Latest Courses",
    subtitle:
      "Published courses loaded from the real database, organized clearly for a calm and focused medical-learning experience.",
    latest: "New",
    cta: "View course",
    price: "Course price",
    hours: "hours",
    reviews: "reviews",
    instructorLabel: "By",
    save: "Save",
    defaultInstructorSummary:
      "Clear structure and focused review that help students retain information with less friction.",
    emptyTitle: "No published courses yet",
    emptyBody: "As soon as the first published course is available, it will appear here automatically.",
  },
};

function formatPrice(value: number, language: "ar" | "en") {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatReviews(value: number, language: "ar" | "en") {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US").format(value);
}

function LandingCourseCard({ course }: { course: CourseListItem }) {
  const { language } = useLanguage();
  const text = copy[language];
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;
  const discount = getDiscountPercent(course.price, course.discountPrice);
  const currentPrice = course.discountPrice ?? course.price;

  const localizedTitle = getLocalizedField(course, "title", language);
  const localizedCategory = getLocalizedField(course, "categoryName", language);
  const localizedInstructor = getLocalizedField(course, "instructorName", language);
  const localizedBio = getLocalizedField(course, "instructorBio", language);
  const localizedSubtitle = getLocalizedField(course, "subtitle", language);
  const localizedDesc = getLocalizedField(course, "description", language);

  const instructorSummary = localizedBio || text.defaultInstructorSummary;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#e2ece9] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#b9d8d1] hover:shadow-[0_22px_44px_rgba(15,23,42,0.1)]">
      <Link className="relative block aspect-[1.34] overflow-hidden bg-[#eef8f5]" href={`/courses/${course.slug}`}>
        <Image
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.035]"
          src={course.thumbnail}
          alt={course.title}
        />
        <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-black text-[#0e5f5c] shadow-[0_8px_18px_rgba(15,23,42,0.08)] backdrop-blur">
          <Stethoscope className="h-3.5 w-3.5" />
          {localizedCategory}
        </span>
        {discount ? (
          <span className="absolute end-3 bottom-3 rounded-lg bg-[#fbf8ef] px-3 py-1.5 text-xs font-black text-[#8a6a2f] shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
            {text.save} {discount}%
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <span className="w-fit rounded-lg bg-[#eef8f5] px-3 py-1 text-xs font-black text-[#0e5f5c]">
          {text.latest}
        </span>

        <Link href={`/courses/${course.slug}`}>
          <h3 className="mt-4 line-clamp-2 text-xl font-black leading-8 text-[#0f172a] transition duration-200 group-hover:text-[#0e5f5c]">
            {localizedTitle}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 min-h-14 text-sm leading-7 text-[#5f6f6c]">
          {localizedSubtitle || localizedDesc}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-[#edf4f2] bg-[#fbfcfc] px-3 py-2.5 text-xs font-bold text-[#536a66]">
          <span className="inline-flex items-center gap-1.5 font-black text-[#0f172a]">
            <RatingStars rating={course.rating} />
            {course.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#5f6f6c]">
            <MessageSquare className="h-3.5 w-3.5 text-[#0e5f5c]" />
            {formatReviews(course.reviewsCount, language)} {text.reviews}
          </span>
        </div>

        <div className="mt-4 rounded-lg border border-[#e8efec] bg-[#f9fbfb] p-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#0f172a]">
            <UserRound className="h-4 w-4 text-[#0e5f5c]" />
            {text.instructorLabel} {localizedInstructor}
          </span>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#5f6f6c]">{instructorSummary}</p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[#edf3f1] pt-4 text-sm">
          <span className="inline-flex items-center gap-2 font-bold text-[#536a66]">
            <Clock className="h-4 w-4 text-[#0e5f5c]" />
            {course.durationHours} {text.hours}
          </span>
          <div className="rounded-lg border border-[#dcebe7] bg-[#f5fbf9] px-3 py-2 text-end shadow-[0_10px_24px_rgba(14,95,92,0.05)]">
            <span className="block text-[11px] font-bold text-[#5f6f6c]">{text.price}</span>
            <span className="mt-1 block text-lg font-black text-[#0f172a]">
              {formatPrice(currentPrice, language)}
            </span>
            {course.discountPrice ? (
              <span className="block text-[11px] font-bold text-[#8b9a97] line-through">
                {formatPrice(course.price, language)}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          className={cn(
            "mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0e5f5c] px-4 text-sm font-black text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#0a4f4c]",
          )}
          href={`/courses/${course.slug}`}
        >
          {text.cta}
          <ArrowIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function CoursesSection({ courses }: { courses: CourseListItem[] }) {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <section data-no-translate className="bg-[#f8fbfa] pb-24 pt-20">
      <Container>
        <div className="mb-8 flex flex-col gap-3 text-start md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-lg border border-[#cfe3de] bg-white px-3 py-1.5 text-sm font-black text-[#0e5f5c]">
              {text.eyebrow}
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight text-[#0f172a] md:text-4xl">
              {text.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[#5f6f6c]">{text.subtitle}</p>
          </div>
        </div>

        {courses.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {courses.map((course) => (
              <LandingCourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cfe3de] bg-white p-10 text-center shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <h3 className="text-xl font-black text-[#0f172a]">{text.emptyTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-[#5f6f6c]">{text.emptyBody}</p>
          </div>
        )}
      </Container>
    </section>
  );
}
