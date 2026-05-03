import { notFound } from "next/navigation";
import Link from "next/link";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { InstructorForm } from "@/components/admin/instructor-form";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireServerRole } from "@/lib/auth/server-session";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditInstructorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireServerRole(["admin"]);
  const { id } = await params;
  const qParams = await searchParams;
  const flash = first(qParams.flash);
  const error = first(qParams.error);

  const instructor = await prisma.instructor.findUnique({
    where: { id },
  });

  if (!instructor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">تعديل بيانات</p>
          <h1 className="mt-2 text-3xl font-black">{instructor.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            تعديل بيانات الدكتور. سيتم تحديث هذه البيانات تلقائياً في كل الكورسات المرتبطة به.
          </p>
        </div>
        <Link className={buttonVariants({ variant: "outline" })} href="/admin/instructors">
          العودة إلى الدكاترة
        </Link>
      </div>

      {flash ? <ActionFeedbackBanner kind="success" message={flash} /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <InstructorForm instructor={instructor} mode="update" />
    </div>
  );
}
