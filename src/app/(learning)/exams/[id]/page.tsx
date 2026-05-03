import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, FileQuestion } from "lucide-react";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { buttonVariants } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requireServerSession } from "@/lib/auth/server-session";
import { startExamAttemptAction, submitExamAttemptAction } from "@/lib/exams/actions";
import { getStudentExamView } from "@/lib/exams/repository";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StudentExamPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, requireServerSession()]);
  const attemptQuery = first(query.attempt);
  const submitted = first(query.submitted);
  const error = first(query.error);
  const data = await getStudentExamView({
    userId: session.userId,
    examId: id,
    attemptId: attemptQuery,
  });

  if (!data) {
    notFound();
  }

  const attempt = data.attempt;
  const isActiveAttempt = attempt?.status === "in_progress";
  const showResult = Boolean(attempt && attempt.status !== "in_progress" && data.exam.showResults);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                {data.exam.courseTitle ? `Course exam • ${data.exam.courseTitle}` : "Standalone exam"}
              </p>
              <h1 className="mt-2 text-3xl font-black">{data.exam.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                {data.exam.description || "Answer the questions carefully. Your attempt is saved when you submit."}
              </p>
            </div>
            <Link className={buttonVariants({ variant: "outline" })} href="/dashboard/exams">
              Back to exams
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <Clock className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-black">{data.exam.durationMinutes} minutes</p>
              <p className="text-xs text-muted-foreground">Server-enforced time limit</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <FileQuestion className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-black">{data.questions.length} questions</p>
              <p className="text-xs text-muted-foreground">{data.exam.totalMarks} total marks</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-black">Pass score: {data.exam.passingScore}</p>
              <p className="text-xs text-muted-foreground">
                {data.exam.allowRetakes ? "Retakes enabled" : "Single final attempt"}
              </p>
            </div>
          </div>
        </div>

        {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}
        {submitted ? <ActionFeedbackBanner kind="success" message="Your attempt was submitted successfully." /> : null}

        {!data.canStart ? (
          <div className="rounded-2xl border border-warning/30 bg-[#fbf4e6] p-5">
            <AlertTriangle className="h-5 w-5 text-[#8a6a2f]" />
            <h2 className="mt-3 text-lg font-black text-[#8a6a2f]">Exam unavailable</h2>
            <p className="mt-2 text-sm font-bold text-[#8a6a2f]">{data.lockedReason}</p>
          </div>
        ) : null}

        {showResult ? (
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Result</p>
            <h2 className="mt-2 text-2xl font-black">
              {attempt?.passed === undefined ? "Submitted for review" : attempt.passed ? "Passed" : "Failed"} •{" "}
              {attempt?.score}/{attempt?.totalMarks}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Submitted at {attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "recently"}.
            </p>
            {attempt?.requiresManualReview ? (
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                Essay answers still need manual review. The current score only reflects auto-graded questions.
              </p>
            ) : null}

            {attempt?.answers.length ? (
              <div className="mt-5 grid gap-3">
                {attempt.answers.map((answer) => (
                  <div className="rounded-xl border border-border bg-muted/20 p-4" key={answer.id}>
                    <p className="font-black">{answer.questionPrompt}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Answer: {answer.selectedOptionText || answer.answerText || "No answer"} • Marks:{" "}
                      {answer.manualReviewRequired ? "Pending review" : answer.marksAwarded}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {!isActiveAttempt ? (
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-xl font-black">Before you start</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {data.exam.instructions ||
                "Once you start, the timer is enforced on the server. Submit before the time limit ends."}
            </p>
            <form action={startExamAttemptAction} className="mt-5">
              <input name="examId" type="hidden" value={data.exam.id} />
              <PendingSubmitButton disabled={!data.canStart} pendingLabel="Starting exam...">
                Start exam
              </PendingSubmitButton>
            </form>
          </section>
        ) : (
          <form
            action={submitExamAttemptAction}
            className="grid gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <input name="examId" type="hidden" value={data.exam.id} />
            <input name="attemptId" type="hidden" value={attempt.id} />

            <div className="rounded-xl border border-primary/20 bg-[#eaf8f4] p-4">
              <h2 className="text-lg font-black text-primary">Attempt in progress</h2>
              <p className="mt-1 text-sm font-bold text-primary">
                Submit before the {data.exam.durationMinutes}-minute limit. Late attempts are rejected server-side.
              </p>
            </div>

            {data.questions.map((question, index) => (
              <fieldset className="rounded-xl border border-border bg-muted/20 p-5" key={question.id}>
                <legend className="px-2 text-sm font-black">
                  {index + 1}. {question.prompt}
                </legend>
                <p className="mt-2 text-xs font-bold text-muted-foreground">{question.marks} marks</p>

                {question.type === "short_answer" ? (
                  <div className="mt-4 grid gap-3">
                    <textarea
                      className="form-input min-h-28 py-3"
                      name={`answer:${question.id}`}
                      placeholder="Write your answer here"
                    />
                    <p className="text-xs font-bold text-muted-foreground">
                      This written answer will be reviewed manually after submission.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {question.options.map((option) => (
                      <label
                        className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-bold"
                        key={option.id}
                      >
                        <input
                          name={`answer:${question.id}`}
                          type={question.allowsMultipleAnswers ? "checkbox" : "radio"}
                          value={option.id}
                        />
                        {option.text}
                      </label>
                    ))}
                    {question.allowsMultipleAnswers ? (
                      <p className="text-xs font-bold text-muted-foreground">
                        More than one answer may be correct for this question.
                      </p>
                    ) : null}
                  </div>
                )}
              </fieldset>
            ))}

            <div className="flex justify-end">
              <PendingSubmitButton pendingLabel="Submitting attempt..." size="lg">
                Submit attempt
              </PendingSubmitButton>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
