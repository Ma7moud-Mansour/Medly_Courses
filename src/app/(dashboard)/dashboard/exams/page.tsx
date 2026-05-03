import Link from "next/link";
import { ClipboardCheck, LockKeyhole, Timer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server-session";
import { listStudentAvailableExams } from "@/lib/exams/repository";

export const dynamic = "force-dynamic";

export default async function DashboardExamsPage() {
  const session = await requireServerSession();
  const exams = await listStudentAvailableExams(session.userId);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Assessments</p>
        <h1 className="mt-2 text-3xl font-black">Available Exams</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          Standalone exams appear here automatically. Course exams unlock when your enrollment is active.
        </p>
      </div>

      {exams.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {exams.map((exam) => (
            <article className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm" key={exam.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                    {exam.accessLabel}
                  </span>
                  <h2 className="mt-3 text-xl font-black">{exam.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{exam.description || exam.courseTitle || "Medly exam"}</p>
                </div>
                {exam.canStart ? (
                  <ClipboardCheck className="h-6 w-6 shrink-0 text-primary" />
                ) : (
                  <LockKeyhole className="h-6 w-6 shrink-0 text-muted-foreground" />
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <Timer className="h-4 w-4 text-primary" />
                  {exam.durationMinutes} minutes
                </span>
                <span className="rounded-lg bg-muted px-3 py-2">
                  Pass {exam.passingScore}/{exam.totalMarks || "TBD"}
                </span>
                <span className="rounded-lg bg-muted px-3 py-2">{exam.attemptsCount} attempts</span>
              </div>

              {exam.lockedReason ? (
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm font-bold text-muted-foreground">
                  {exam.lockedReason}
                </p>
              ) : null}

              {exam.latestAttempt ? (
                <p className="text-sm font-bold text-muted-foreground">
                  Latest: {exam.latestAttempt.status.replace("_", " ")} • {exam.latestAttempt.score}/{exam.latestAttempt.totalMarks}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Link
                  className={buttonVariants({ variant: exam.canStart ? "primary" : "outline" })}
                  href={`/exams/${exam.id}`}
                >
                  {exam.canStart ? "Open exam" : "View details"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center shadow-sm">
          <ClipboardCheck className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-black">No exams available</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
            Your standalone exams and enrolled-course assessments will appear here when published.
          </p>
        </div>
      )}
    </div>
  );
}
