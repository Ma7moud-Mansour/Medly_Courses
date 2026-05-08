"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildFeedbackPath, getActionErrorMessage } from "@/lib/actions/server-action-feedback";
import { requireServerRole, requireServerSession } from "@/lib/auth/server-session";
import {
  createAdminExam,
  deleteAdminExam,
  deleteExamQuestion,
  startExamAttempt,
  submitExamAttempt,
  updateAdminExam,
  upsertExamQuestion,
} from "@/lib/exams/repository";
import { adminExamQuestionSchema, adminExamSchema } from "@/lib/validators/schemas";
import type { ExamQuestionType } from "@/types";

function checked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function text(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

async function requireExamAdmin() {
  return requireServerRole(["admin", "support"]);
}

export async function createAdminExamAction(formData: FormData) {
  await requireExamAdmin();
  let destination = "/admin/exams/new";

  try {
    const parsed = adminExamSchema.parse({
      title: formData.get("title"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      instructions: formData.get("instructions"),
      durationMinutes: formData.get("durationMinutes"),
      passingScore: formData.get("passingScore"),
      courseId: formData.get("courseId"),
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
      isPublished: checked(formData.get("isPublished")),
      allowRetakes: checked(formData.get("allowRetakes")),
      showResults: checked(formData.get("showResults")),
    });

    const exam = await createAdminExam({
      ...parsed,
      description: parsed.description || undefined,
      instructions: parsed.instructions || undefined,
      courseId: parsed.courseId || undefined,
      startsAt: parsed.startsAt || undefined,
      endsAt: parsed.endsAt || undefined,
    });

    revalidatePath("/admin/exams");
    destination = buildFeedbackPath(`/admin/exams/${exam.id}/edit`, {
      flash: "exam-created",
    });
  } catch (error) {
    destination = buildFeedbackPath("/admin/exams/new", {
      error: getActionErrorMessage(error, "Unable to create the exam right now."),
    });
  }

  redirect(destination);
}

export async function updateAdminExamAction(formData: FormData) {
  await requireExamAdmin();
  const examId = String(formData.get("examId") ?? "");
  const editPath = `/admin/exams/${examId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminExamSchema.parse({
      title: formData.get("title"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      instructions: formData.get("instructions"),
      durationMinutes: formData.get("durationMinutes"),
      passingScore: formData.get("passingScore"),
      courseId: formData.get("courseId"),
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
      isPublished: checked(formData.get("isPublished")),
      allowRetakes: checked(formData.get("allowRetakes")),
      showResults: checked(formData.get("showResults")),
    });

    await updateAdminExam({
      examId,
      ...parsed,
      description: parsed.description || undefined,
      instructions: parsed.instructions || undefined,
      courseId: parsed.courseId || undefined,
      startsAt: parsed.startsAt || undefined,
      endsAt: parsed.endsAt || undefined,
    });

    revalidatePath("/admin/exams");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "exam-updated" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to save the exam settings."),
    });
  }

  redirect(destination);
}

export async function deleteAdminExamAction(formData: FormData) {
  await requireExamAdmin();
  const examId = String(formData.get("examId") ?? "");
  let destination = "/admin/exams";

  try {
    if (!examId) {
      throw new Error("لم يتم تحديد الامتحان المطلوب حذفه.");
    }

    await deleteAdminExam({ examId });

    revalidatePath("/admin/exams");
    revalidatePath("/dashboard/exams");
    revalidatePath(`/exams/${examId}`);
    destination = buildFeedbackPath("/admin/exams", { flash: "exam-deleted" });
  } catch (error) {
    destination = buildFeedbackPath(examId ? `/admin/exams/${examId}/edit` : "/admin/exams", {
      error: getActionErrorMessage(error, "تعذر حذف الامتحان الآن."),
    });
  }

  redirect(destination);
}

export async function saveExamQuestionAction(formData: FormData) {
  await requireExamAdmin();
  const examId = String(formData.get("examId") ?? "");
  const editPath = `/admin/exams/${examId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminExamQuestionSchema.parse({
      examId: formData.get("examId"),
      questionId: text(formData.get("questionId")),
      type: formData.get("type"),
      order: formData.get("order"),
      prompt: formData.get("prompt"),
      explanation: formData.get("explanation"),
      marks: formData.get("marks"),
      optionsText: formData.get("optionsText"),
      correctOptionOrders: formData.get("correctOptionOrders"),
    });

    await upsertExamQuestion({
      examId: parsed.examId,
      questionId: parsed.questionId,
      type: parsed.type as ExamQuestionType,
      order: parsed.order,
      prompt: parsed.prompt,
      explanation: parsed.explanation || undefined,
      marks: parsed.marks,
      optionsText: parsed.optionsText || undefined,
      correctOptionOrders: parsed.correctOptionOrders || undefined,
    });

    revalidatePath("/admin/exams");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "question-saved" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to save the question."),
    });
  }

  redirect(destination);
}

export async function deleteExamQuestionAction(formData: FormData) {
  await requireExamAdmin();
  const examId = String(formData.get("examId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const editPath = `/admin/exams/${examId}/edit`;
  let destination = editPath;

  try {
    await deleteExamQuestion({ examId, questionId });

    revalidatePath("/admin/exams");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "question-deleted" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to delete the question."),
    });
  }

  redirect(destination);
}

export async function startExamAttemptAction(formData: FormData) {
  const session = await requireServerSession();
  const examId = String(formData.get("examId") ?? "");
  let destination = `/exams/${examId}`;

  try {
    const attempt = await startExamAttempt({
      userId: session.userId,
      examId,
    });

    destination = buildFeedbackPath(`/exams/${examId}`, {
      extras: { attempt: attempt.id },
    });
  } catch (error) {
    destination = buildFeedbackPath(`/exams/${examId}`, {
      error: getActionErrorMessage(error, "Unable to start this exam right now."),
    });
  }

  redirect(destination);
}

export async function submitExamAttemptAction(formData: FormData) {
  const session = await requireServerSession();
  const examId = String(formData.get("examId") ?? "");
  const attemptId = String(formData.get("attemptId") ?? "");
  const answers: Record<string, string[]> = {};

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("answer:")) {
      const questionId = key.replace("answer:", "");
      const existing = answers[questionId] ?? [];
      answers[questionId] = [...existing, String(value)];
    }
  }

  let destination = buildFeedbackPath(`/exams/${examId}`, {
    extras: { attempt: attemptId },
  });

  try {
    await submitExamAttempt({
      userId: session.userId,
      examId,
      attemptId,
      answers,
    });

    revalidatePath("/dashboard/exams");
    destination = buildFeedbackPath(`/exams/${examId}`, {
      extras: { attempt: attemptId, submitted: "1" },
    });
  } catch (error) {
    destination = buildFeedbackPath(`/exams/${examId}`, {
      error: getActionErrorMessage(error, "Unable to submit the exam attempt."),
      extras: { attempt: attemptId },
    });
  }

  redirect(destination);
}
