import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  Exam,
  ExamAnswer,
  ExamAttempt,
  ExamOption,
  ExamQuestion,
  ExamQuestionType,
} from "@/types";

const examInclude = Prisma.validator<Prisma.ExamInclude>()({
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
    },
  },
  questions: {
    orderBy: { order: "asc" },
    include: {
      options: {
        orderBy: { order: "asc" },
      },
    },
  },
});

const attemptInclude = Prisma.validator<Prisma.ExamAttemptInclude>()({
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  answers: {
    include: {
      selectedOption: true,
      question: {
        include: {
          options: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: {
      question: {
        order: "asc",
      },
    },
  },
});

type ExamRecord = Prisma.ExamGetPayload<{ include: typeof examInclude }>;
type AttemptRecord = Prisma.ExamAttemptGetPayload<{ include: typeof attemptInclude }>;

export type AdminExamListItem = Exam & {
  courseTitle?: string;
  questionsCount: number;
  attemptsCount: number;
};

export type AdminExamEditorData = {
  exam: Exam & {
    courseTitle?: string;
  };
  questions: Array<
    ExamQuestion & {
      options: ExamOption[];
      correctOptionOrders: number[];
      allowsMultipleAnswers: boolean;
      manualReviewRequired: boolean;
    }
  >;
  attempts: Array<
    ExamAttempt & {
      studentName: string;
      studentEmail: string;
      requiresManualReview: boolean;
    }
  >;
  courseOptions: Array<{ id: string; title: string; slug: string }>;
};

export type StudentExamListItem = Exam & {
  courseTitle?: string;
  accessLabel: string;
  attemptsCount: number;
  latestAttempt?: ExamAttempt;
  canStart: boolean;
  lockedReason?: string;
};

export type StudentExamView = {
  exam: Exam & {
    courseTitle?: string;
  };
  questions: Array<
    ExamQuestion & {
      options: Array<Omit<ExamOption, "isCorrect">>;
      allowsMultipleAnswers: boolean;
      manualReviewRequired: boolean;
    }
  >;
  attempt?: ExamAttempt & {
    requiresManualReview: boolean;
    answers: Array<
      ExamAnswer & {
        selectedOptionText?: string;
        selectedOptionIds?: string[];
        questionPrompt: string;
        manualReviewRequired: boolean;
      }
    >;
  };
  canStart: boolean;
  lockedReason?: string;
};

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function toDate(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapExam(exam: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  durationMinutes: number;
  totalMarks: number;
  passingScore: number;
  isPublished: boolean;
  allowRetakes: boolean;
  showResults: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  courseId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Exam {
  return {
    id: exam.id,
    title: exam.title,
    slug: exam.slug,
    description: exam.description ?? undefined,
    instructions: exam.instructions ?? undefined,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    passingScore: exam.passingScore,
    isPublished: exam.isPublished,
    allowRetakes: exam.allowRetakes,
    showResults: exam.showResults,
    startsAt: toIso(exam.startsAt),
    endsAt: toIso(exam.endsAt),
    courseId: exam.courseId ?? undefined,
    createdAt: exam.createdAt.toISOString(),
    updatedAt: exam.updatedAt.toISOString(),
  };
}

function mapQuestion(question: {
  id: string;
  examId: string;
  type: string;
  order: number;
  prompt: string;
  explanation: string | null;
  marks: number;
}): ExamQuestion {
  return {
    id: question.id,
    examId: question.examId,
    type: question.type as ExamQuestionType,
    order: question.order,
    prompt: question.prompt,
    explanation: question.explanation ?? undefined,
    marks: question.marks,
  };
}

function mapOption(option: {
  id: string;
  questionId: string;
  order: number;
  text: string;
  isCorrect: boolean;
}): ExamOption {
  return {
    id: option.id,
    questionId: option.questionId,
    order: option.order,
    text: option.text,
    isCorrect: option.isCorrect,
  };
}

function mapAttempt(attempt: {
  id: string;
  examId: string;
  userId: string;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  score: number;
  totalMarks: number;
  passed: boolean | null;
}): ExamAttempt {
  return {
    id: attempt.id,
    examId: attempt.examId,
    userId: attempt.userId,
    status: attempt.status as ExamAttempt["status"],
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: toIso(attempt.submittedAt),
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    passed: attempt.passed ?? undefined,
  };
}

function parseStoredSelectedOptionIds(answer: {
  selectedOptionId?: string | null;
  answerText?: string | null;
  question: {
    type: string;
    options: Array<{ id: string; text: string }>;
  };
}) {
  if (answer.question.type === "short_answer") {
    return [];
  }

  if (answer.answerText) {
    try {
      const parsed = JSON.parse(answer.answerText);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === "string");
      }
    } catch {
      return answer.answerText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return answer.selectedOptionId ? [answer.selectedOptionId] : [];
}

function isExamWithinAvailability(exam: Pick<ExamRecord, "startsAt" | "endsAt">) {
  const now = new Date();
  if (exam.startsAt && exam.startsAt > now) return false;
  if (exam.endsAt && exam.endsAt < now) return false;
  return true;
}

async function recalculateExamMarks(tx: Prisma.TransactionClient, examId: string) {
  const aggregate = await tx.examQuestion.aggregate({
    where: { examId },
    _sum: { marks: true },
  });

  await tx.exam.update({
    where: { id: examId },
    data: {
      totalMarks: aggregate._sum.marks ?? 0,
    },
  });
}

async function ensureActiveStudent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, role: true },
  });

  if (!user || user.status !== "active" || user.role !== "student") {
    throw new Error("Only active students can access exams.");
  }
}

async function getExamAccess(userId: string, exam: ExamRecord) {
  const override = await prisma.userOverride.findUnique({
    where: { userId },
    select: { canTakeExam: true },
  });

  if (override?.canTakeExam === false) {
    return { canAccess: false, reason: "Exam access is disabled for this account." };
  }

  if (!exam.isPublished) {
    return { canAccess: false, reason: "This exam is not published yet." };
  }

  if (!isExamWithinAvailability(exam)) {
    return { canAccess: false, reason: "This exam is outside its availability window." };
  }

  if (!exam.courseId) {
    return { canAccess: true, reason: undefined };
  }

  if (!exam.course?.isPublished) {
    return { canAccess: false, reason: "The linked course is not published." };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: exam.courseId,
      },
    },
    select: {
      accessStatus: true,
      expiresAt: true,
    },
  });

  if (!enrollment || enrollment.accessStatus !== "active") {
    return { canAccess: false, reason: "Enroll in the linked course to open this exam." };
  }

  if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
    return { canAccess: false, reason: "Your course access has expired." };
  }

  return { canAccess: true, reason: undefined };
}

export async function listExamCourseOptions() {
  return prisma.course.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
    },
    orderBy: { title: "asc" },
  });
}

export async function listAdminExams(): Promise<AdminExamListItem[]> {
  const exams = await prisma.exam.findMany({
    include: {
      course: {
        select: {
          title: true,
        },
      },
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return exams.map((exam) => ({
    ...mapExam(exam),
    courseTitle: exam.course?.title ?? undefined,
    questionsCount: exam._count.questions,
    attemptsCount: exam._count.attempts,
  }));
}

export async function getAdminExamEditorData(examId: string): Promise<AdminExamEditorData | undefined> {
  const [exam, courseOptions] = await Promise.all([
    prisma.exam.findUnique({
      where: { id: examId },
      include: {
        ...examInclude,
        attempts: {
          include: attemptInclude,
          orderBy: { startedAt: "desc" },
          take: 25,
        },
      },
    }),
    listExamCourseOptions(),
  ]);

  if (!exam) return undefined;

  return {
    exam: {
      ...mapExam(exam),
      courseTitle: exam.course?.title ?? undefined,
    },
    questions: exam.questions.map((question) => ({
      ...mapQuestion(question),
      options: question.options.map(mapOption),
      correctOptionOrders: question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.order),
      allowsMultipleAnswers: question.options.filter((option) => option.isCorrect).length > 1,
      manualReviewRequired: question.type === "short_answer",
    })),
    attempts: exam.attempts.map((attempt: AttemptRecord) => ({
      ...mapAttempt(attempt),
      studentName: attempt.user.name,
      studentEmail: attempt.user.email,
      requiresManualReview: attempt.answers.some((answer) => answer.question.type === "short_answer"),
    })),
    courseOptions,
  };
}

export async function createAdminExam(input: {
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  passingScore: number;
  courseId?: string;
  startsAt?: string;
  endsAt?: string;
  isPublished: boolean;
  allowRetakes: boolean;
  showResults: boolean;
}) {
  return prisma.exam.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description || null,
      instructions: input.instructions || null,
      durationMinutes: input.durationMinutes,
      passingScore: input.passingScore,
      courseId: input.courseId || null,
      startsAt: toDate(input.startsAt),
      endsAt: toDate(input.endsAt),
      isPublished: input.isPublished,
      allowRetakes: input.allowRetakes,
      showResults: input.showResults,
    },
  });
}

export async function updateAdminExam(input: {
  examId: string;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  passingScore: number;
  courseId?: string;
  startsAt?: string;
  endsAt?: string;
  isPublished: boolean;
  allowRetakes: boolean;
  showResults: boolean;
}) {
  return prisma.exam.update({
    where: { id: input.examId },
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description || null,
      instructions: input.instructions || null,
      durationMinutes: input.durationMinutes,
      passingScore: input.passingScore,
      courseId: input.courseId || null,
      startsAt: toDate(input.startsAt),
      endsAt: toDate(input.endsAt),
      isPublished: input.isPublished,
      allowRetakes: input.allowRetakes,
      showResults: input.showResults,
    },
  });
}

export async function deleteAdminExam(input: { examId: string }) {
  await prisma.exam.delete({
    where: {
      id: input.examId,
    },
  });
}

function parseOptions(input: {
  type: ExamQuestionType;
  optionsText?: string;
  correctOptionOrders?: string;
}) {
  const rawOptions =
    input.type === "true_false" && !input.optionsText?.trim()
      ? ["True", "False"]
      : input.optionsText
          ?.split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean) ?? [];

  const correctOrders = new Set(
    input.correctOptionOrders
      ?.split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isInteger(value) && value > 0) ?? [],
  );

  if (input.type !== "short_answer" && rawOptions.length < 2) {
    throw new Error("Choice questions need at least two options.");
  }

  if (input.type !== "short_answer" && !correctOrders.size) {
    throw new Error("Mark at least one correct option by order number.");
  }

  return rawOptions.map((text, index) => ({
    order: index + 1,
    text,
    isCorrect: correctOrders.has(index + 1),
  }));
}

export async function upsertExamQuestion(input: {
  examId: string;
  questionId?: string;
  type: ExamQuestionType;
  order: number;
  prompt: string;
  explanation?: string;
  marks: number;
  optionsText?: string;
  correctOptionOrders?: string;
}) {
  const options = parseOptions(input);

  return prisma.$transaction(async (tx) => {
    const question = input.questionId
      ? await tx.examQuestion.update({
          where: { id: input.questionId },
          data: {
            type: input.type,
            order: input.order,
            prompt: input.prompt,
            explanation: input.explanation || null,
            marks: input.marks,
          },
        })
      : await tx.examQuestion.create({
          data: {
            examId: input.examId,
            type: input.type,
            order: input.order,
            prompt: input.prompt,
            explanation: input.explanation || null,
            marks: input.marks,
          },
        });

    await tx.examOption.deleteMany({ where: { questionId: question.id } });

    if (options.length) {
      await tx.examOption.createMany({
        data: options.map((option) => ({
          ...option,
          questionId: question.id,
        })),
      });
    }

    await recalculateExamMarks(tx, input.examId);

    return question;
  });
}

export async function deleteExamQuestion(input: { examId: string; questionId: string }) {
  await prisma.$transaction(async (tx) => {
    await tx.examQuestion.delete({ where: { id: input.questionId } });
    await recalculateExamMarks(tx, input.examId);
  });
}

export async function listStudentAvailableExams(userId: string): Promise<StudentExamListItem[]> {
  await ensureActiveStudent(userId);

  const exams = await prisma.exam.findMany({
    where: { isPublished: true },
    include: {
      ...examInclude,
      attempts: {
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
    orderBy: [{ courseId: "asc" }, { updatedAt: "desc" }],
  });

  const result: StudentExamListItem[] = [];

  for (const exam of exams) {
    const access = await getExamAccess(userId, exam);
    const latestAttempt = exam.attempts[0] ? mapAttempt(exam.attempts[0]) : undefined;
    const hasFinalAttempt = exam.attempts.some((attempt) => attempt.status !== "in_progress");
    const retakeLocked = hasFinalAttempt && !exam.allowRetakes;

    result.push({
      ...mapExam(exam),
      courseTitle: exam.course?.title ?? undefined,
      accessLabel: exam.courseId ? "Course exam" : "Standalone exam",
      attemptsCount: exam.attempts.length,
      latestAttempt,
      canStart: access.canAccess && !retakeLocked,
      lockedReason: access.reason ?? (retakeLocked ? "Retakes are not enabled for this exam." : undefined),
    });
  }

  return result;
}

export async function getStudentExamView(input: {
  userId: string;
  examId: string;
  attemptId?: string;
}): Promise<StudentExamView | undefined> {
  await ensureActiveStudent(input.userId);

  const exam = await prisma.exam.findUnique({
    where: { id: input.examId },
    include: {
      ...examInclude,
      attempts: input.attemptId
        ? {
            where: {
              id: input.attemptId,
              userId: input.userId,
            },
            include: attemptInclude,
          }
        : {
            where: { userId: input.userId },
            orderBy: { startedAt: "desc" },
            take: 1,
            include: attemptInclude,
          },
    },
  });

  if (!exam) return undefined;

  const access = await getExamAccess(input.userId, exam);
  const attempt = exam.attempts[0] as AttemptRecord | undefined;

  return {
    exam: {
      ...mapExam(exam),
      courseTitle: exam.course?.title ?? undefined,
    },
    questions: exam.questions.map((question) => ({
      ...mapQuestion(question),
      options: question.options.map((option) => {
        const mapped = mapOption(option);
        return {
          id: mapped.id,
          questionId: mapped.questionId,
          order: mapped.order,
          text: mapped.text,
        };
      }),
      allowsMultipleAnswers: question.options.filter((option) => option.isCorrect).length > 1,
      manualReviewRequired: question.type === "short_answer",
    })),
    attempt: attempt
      ? {
          ...mapAttempt(attempt),
          requiresManualReview: attempt.answers.some((answer) => answer.question.type === "short_answer"),
          answers: attempt.answers.map((answer) => ({
            ...(() => {
              const selectedOptionIds = parseStoredSelectedOptionIds(answer);
              const selectedTexts = selectedOptionIds
                .map((optionId) => answer.question.options.find((option) => option.id === optionId)?.text)
                .filter((value): value is string => Boolean(value));

              return {
                selectedOptionIds: selectedOptionIds.length ? selectedOptionIds : undefined,
                selectedOptionText: selectedTexts.length ? selectedTexts.join(", ") : answer.selectedOption?.text,
              };
            })(),
            id: answer.id,
            attemptId: answer.attemptId,
            questionId: answer.questionId,
            selectedOptionId: answer.selectedOptionId ?? undefined,
            answerText: answer.answerText ?? undefined,
            isCorrect: answer.isCorrect ?? undefined,
            marksAwarded: answer.marksAwarded,
            questionPrompt: answer.question.prompt,
            manualReviewRequired: answer.question.type === "short_answer",
          })),
        }
      : undefined,
    canStart: access.canAccess,
    lockedReason: access.reason,
  };
}

export async function startExamAttempt(input: { userId: string; examId: string }) {
  await ensureActiveStudent(input.userId);

  const exam = await prisma.exam.findUnique({
    where: { id: input.examId },
    include: examInclude,
  });

  if (!exam) throw new Error("Exam was not found.");

  const access = await getExamAccess(input.userId, exam);
  if (!access.canAccess) throw new Error(access.reason ?? "You cannot access this exam.");

  const existingInProgress = await prisma.examAttempt.findFirst({
    where: {
      examId: input.examId,
      userId: input.userId,
      status: "in_progress",
    },
    orderBy: { startedAt: "desc" },
  });

  if (existingInProgress) return existingInProgress;

  if (!exam.allowRetakes) {
    const previousFinalAttempt = await prisma.examAttempt.findFirst({
      where: {
        examId: input.examId,
        userId: input.userId,
        status: { not: "in_progress" },
      },
    });

    if (previousFinalAttempt) {
      throw new Error("You already submitted this exam and retakes are disabled.");
    }
  }

  return prisma.examAttempt.create({
    data: {
      examId: input.examId,
      userId: input.userId,
      totalMarks: exam.totalMarks,
    },
  });
}

export async function submitExamAttempt(input: {
  userId: string;
  examId: string;
  attemptId: string;
  answers: Record<string, string[]>;
}) {
  await ensureActiveStudent(input.userId);

  const attempt = await prisma.examAttempt.findFirst({
    where: {
      id: input.attemptId,
      examId: input.examId,
      userId: input.userId,
    },
    include: {
      exam: {
        include: examInclude,
      },
    },
  });

  if (!attempt) throw new Error("Exam attempt was not found.");
  if (attempt.status !== "in_progress") throw new Error("This attempt was already submitted.");

  const expiresAt = new Date(attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60 * 1000);
  if (expiresAt < new Date()) {
    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "expired",
        submittedAt: new Date(),
      },
    });
    throw new Error("The exam time limit has expired.");
  }

  const answerRows = attempt.exam.questions.map((question) => {
    const submittedValues = input.answers[question.id] ?? [];

    if (question.type === "short_answer") {
      const essayAnswer = submittedValues[0]?.trim() || "";

      return {
        attemptId: attempt.id,
        questionId: question.id,
        selectedOptionId: null,
        answerText: essayAnswer || null,
        isCorrect: null,
        marksAwarded: 0,
      };
    }

    const selectedOptionIds = [...new Set(submittedValues.map((value) => value.trim()).filter(Boolean))].sort();
    const selectedOption = selectedOptionIds.length === 1
      ? question.options.find((option) => option.id === selectedOptionIds[0])
      : null;
    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort();
    const isCorrect =
      selectedOptionIds.length > 0 &&
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every((optionId, index) => optionId === correctOptionIds[index]);

    return {
      attemptId: attempt.id,
      questionId: question.id,
      selectedOptionId: selectedOption?.id ?? null,
      answerText: selectedOptionIds.length > 1 ? JSON.stringify(selectedOptionIds) : null,
      isCorrect,
      marksAwarded: isCorrect ? question.marks : 0,
    };
  });

  const score = answerRows.reduce((sum, answer) => sum + answer.marksAwarded, 0);
  const totalMarks = attempt.exam.totalMarks || attempt.exam.questions.reduce((sum, question) => sum + question.marks, 0);
  const requiresManualReview = attempt.exam.questions.some((question) => question.type === "short_answer");
  const passed = requiresManualReview ? null : totalMarks > 0 ? score >= attempt.exam.passingScore : false;

  return prisma.$transaction(async (tx) => {
    await tx.examAnswer.deleteMany({ where: { attemptId: attempt.id } });
    if (answerRows.length) {
      await tx.examAnswer.createMany({ data: answerRows });
    }

    return tx.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: requiresManualReview ? "submitted" : "graded",
        submittedAt: new Date(),
        score,
        totalMarks,
        passed,
      },
    });
  });
}
