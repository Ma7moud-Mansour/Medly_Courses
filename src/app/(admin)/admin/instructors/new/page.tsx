import Link from "next/link";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { InstructorForm } from "@/components/admin/instructor-form";
import { buttonVariants } from "@/components/ui/button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewInstructorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">دكتور جديد</p>
          <h1 className="mt-2 text-3xl font-black">إضافة دكتور</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            أدخل بيانات الدكتور الأساسية والنبذة. بعد الإنشاء سيظهر الدكتور في قائمة الدكاترة ويمكن ربط الكورسات به.
          </p>
        </div>
        <Link className={buttonVariants({ variant: "outline" })} href="/admin/instructors">
          العودة إلى الدكاترة
        </Link>
      </div>

      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <InstructorForm mode="create" />
    </div>
  );
}
