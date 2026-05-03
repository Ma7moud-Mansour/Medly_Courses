import Link from "next/link";
import { GraduationCap, Phone, PlusCircle, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { InstructorAvatar } from "@/components/instructors/instructor-avatar";
import { getAdminInstructorsPageData } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminInstructorsPage() {
  const instructors = await getAdminInstructorsPageData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef8f5] text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black">الدكاترة</h1>
          </div>
        </div>
        <Link className={buttonVariants({ size: "lg" })} href="/admin/instructors/new">
          <PlusCircle className="mr-2 h-4 w-4" />
          إضافة دكتور
        </Link>
      </section>

      {instructors.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {instructors.map((instructor) => (
            <article
              key={instructor.id}
              className="grid gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm md:grid-cols-[96px_1fr]"
            >
              <InstructorAvatar
                avatar={instructor.avatar}
                className="h-24 w-24"
                name={instructor.name}
                slug={instructor.slug}
              />
              <div className="space-y-3">
                <div>
                  <h2 className="text-xl font-black">{instructor.name}</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Metric label="الكورسات" value={instructor.coursesCount ?? 0} />
                  <Metric label="منشور" value={instructor.publishedCourses} />
                  <Metric label="طلاب" value={instructor.studentsCount ?? 0} />
                  <Metric label="التقييم" value={instructor.ratingAverage} />
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    {instructor.vodafoneCashNumber ?? "رقم فودافون كاش غير مضاف"}
                  </p>
                  <Link
                    className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                    href={`/admin/instructors/${instructor.id}/edit`}
                  >
                    <Pencil className="h-4 w-4" />
                    تعديل
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm font-bold text-muted-foreground shadow-sm">
          لا توجد بيانات دكاترة حتى الآن.
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black">{value.toLocaleString("ar-EG")}</p>
    </div>
  );
}
