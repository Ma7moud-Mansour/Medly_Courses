import { Clock, ShieldCheck, Users } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import { formatNumber } from "@/lib/utils";
import type { Course } from "@/types";

type CourseHeroData = Course & {
  categoryName?: string;
  instructorName?: string;
  isEnrolled?: boolean;
  isAccessible?: boolean;
  accessStatus?: "active" | "revoked" | "expired" | "inactive";
};

function getAccessLabel(course: CourseHeroData) {
  if (!course.isEnrolled) {
    return "متاح للشراء الفردي";
  }

  if (course.isAccessible) {
    return "مضاف بالفعل إلى كورساتك";
  }

  if (course.accessStatus === "revoked") {
    return "الوصول موقوف لهذا الكورس";
  }

  if (course.accessStatus === "expired") {
    return "مدة الوصول انتهت";
  }

  return "حالة الوصول تحتاج مراجعة";
}

export function CourseHero({ course }: { course: CourseHeroData }) {
  return (
    <section className="border-b border-[#e8eeec] bg-[#f8faf8]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:py-18">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-black text-[#8a6a2f]">{course.categoryName ?? "كورس طبي"}</p>
            <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-black text-primary shadow-sm">
              {getAccessLabel(course)}
            </span>
          </div>
          <h1 className="mt-4 max-w-4xl break-words text-3xl font-black leading-[1.25] text-[#0f172a] sm:text-4xl lg:text-5xl">
            {course.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#5f6f6c] sm:mt-5 sm:text-lg sm:leading-9">{course.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-[#5f6f6c]">
            <span className="flex items-center gap-2">
              <RatingStars rating={course.rating} />
              {course.rating ? course.rating.toFixed(1) : "0.0"} من {formatNumber(course.reviewsCount)} مراجعة
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0e5f5c]" />
              {formatNumber(course.studentsCount)} طالب
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0e5f5c]" />
              {course.durationHours} ساعة
            </span>
          </div>

          <p className="mt-6 flex items-start gap-2 text-sm font-bold leading-7 text-[#5f6f6c] sm:items-center">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#0e5f5c] sm:mt-0" />
            الدكتور: {course.instructorName ?? "هيئة التدريس"} · آخر تحديث {course.lastUpdated}
          </p>
        </div>
      </div>
    </section>
  );
}
