"use client";

import { useMemo, useState } from "react";
import { CircleHelp, PlusCircle, Trash2 } from "lucide-react";
import { deleteExamQuestionAction, saveExamQuestionAction } from "@/lib/exams/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { AdminExamEditorData } from "@/lib/exams/repository";

type Question = AdminExamEditorData["questions"][number];
type QuestionType = Question["type"];
type EditableOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

const QUESTION_TYPE_OPTIONS: Array<{
  value: QuestionType;
  label: string;
  description: string;
}> = [
  {
    value: "multiple_choice",
    label: "اختيار من متعدد",
    description: "يختار الطالب إجابة واحدة أو أكثر من بين عدة خيارات.",
  },
  {
    value: "true_false",
    label: "صح / خطأ",
    description: "سؤال موضوعي بإجابة صحيحة واحدة فقط.",
  },
  {
    value: "short_answer",
    label: "سؤال مقالي",
    description: "إجابة كتابية حرة تحتاج مراجعة يدوية بعد التسليم.",
  },
];

function createOption(text = "", isCorrect = false, index = 0): EditableOption {
  return {
    id: `option-${index}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    isCorrect,
  };
}

function createDefaultMcqOptions() {
  return [
    createOption("", true, 1),
    createOption("", false, 2),
    createOption("", false, 3),
    createOption("", false, 4),
  ];
}

function createTrueFalseOptions(correctValue: "true" | "false" = "true") {
  return [
    createOption("True", correctValue === "true", 1),
    createOption("False", correctValue === "false", 2),
  ];
}

function getInitialOptions(question?: Question) {
  if (!question) {
    return createDefaultMcqOptions();
  }

  if (question.type === "true_false") {
    const correctOption = question.options.find((option) => option.isCorrect);
    return createTrueFalseOptions(correctOption?.text.toLowerCase() === "false" ? "false" : "true");
  }

  if (question.type === "short_answer") {
    return [];
  }

  if (question.options.length) {
    return question.options.map((option, index) =>
      createOption(option.text, option.isCorrect, index + 1),
    );
  }

  return createDefaultMcqOptions();
}

function normalizeQuestionOptions(type: QuestionType, options: EditableOption[]) {
  if (type === "short_answer") {
    return [];
  }

  if (type === "true_false") {
    const normalized = options.length === 2 ? options : createTrueFalseOptions();
    return normalized.map((option, index) => ({
      text: index === 0 ? "True" : "False",
      isCorrect: option.isCorrect,
    }));
  }

  return options
    .map((option) => ({
      text: option.text.trim(),
      isCorrect: option.isCorrect,
    }))
    .filter((option) => option.text.length > 0);
}

function QuestionTypeChips({
  type,
  onChange,
}: {
  type: QuestionType;
  onChange: (value: QuestionType) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {QUESTION_TYPE_OPTIONS.map((option) => (
        <button
          className={`rounded-xl border p-4 text-start transition ${
            option.value === type
              ? "border-primary bg-[#eef8f5] shadow-[0_10px_24px_rgba(14,95,92,0.08)]"
              : "border-border bg-white hover:border-primary/25"
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <span className="block text-sm font-black text-foreground">{option.label}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
        </button>
      ))}
    </div>
  );
}

function QuestionEditorForm({
  examId,
  question,
  nextOrder,
}: {
  examId: string;
  question?: Question;
  nextOrder?: number;
}) {
  const isEdit = Boolean(question);
  const [type, setType] = useState<QuestionType>(question?.type ?? "multiple_choice");
  const [options, setOptions] = useState<EditableOption[]>(getInitialOptions(question));

  const normalizedOptions = useMemo(() => normalizeQuestionOptions(type, options), [options, type]);
  const optionsText = useMemo(
    () => normalizedOptions.map((option) => option.text).join("\n"),
    [normalizedOptions],
  );
  const correctOptionOrders = useMemo(
    () =>
      normalizedOptions
        .map((option, index) => (option.isCorrect ? index + 1 : null))
        .filter((value): value is number => value !== null)
        .join(", "),
    [normalizedOptions],
  );

  function handleTypeChange(nextType: QuestionType) {
    setType(nextType);

    if (nextType === "short_answer") {
      setOptions([]);
      return;
    }

    if (nextType === "true_false") {
      const previousCorrect = options.find((option) => option.isCorrect)?.text.toLowerCase();
      setOptions(createTrueFalseOptions(previousCorrect === "false" ? "false" : "true"));
      return;
    }

    if (!options.length) {
      setOptions(createDefaultMcqOptions());
    } else if (options.length < 2) {
      setOptions([
        ...options,
        createOption("", false, options.length + 1),
        createOption("", false, options.length + 2),
      ]);
    }
  }

  function updateOption(index: number, patch: Partial<EditableOption>) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              ...patch,
            }
          : option,
      ),
    );
  }

  function toggleMcqCorrect(index: number, checked: boolean) {
    updateOption(index, { isCorrect: checked });
  }

  function setTrueFalseCorrect(index: number) {
    setOptions((current) =>
      current.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      })),
    );
  }

  function addOption() {
    setOptions((current) => [...current, createOption("", false, current.length + 1)]);
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index));
  }

  return (
    <form action={saveExamQuestionAction} className="grid gap-5 rounded-xl border border-border bg-white p-5">
      <input name="examId" type="hidden" value={examId} />
      <input name="type" type="hidden" value={type} />
      <input name="optionsText" type="hidden" value={optionsText} />
      <input name="correctOptionOrders" type="hidden" value={correctOptionOrders} />
      {question ? <input name="questionId" type="hidden" value={question.id} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black">{isEdit ? "تعديل السؤال" : "إضافة سؤال"}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            أنشئ السؤال كما سيظهر للطالب وحدد نوعه ودرجته وخياراته الصحيحة.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
          {isEdit ? `السؤال ${question?.order}` : `الترتيب التالي ${nextOrder ?? 1}`}
        </span>
      </div>

      <QuestionTypeChips onChange={handleTypeChange} type={type} />

      <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
        <label className="grid gap-2 text-sm font-bold">
          نص السؤال
          <textarea
            className="form-input min-h-28 py-3"
            defaultValue={question?.prompt}
            name="prompt"
            placeholder="اكتب السؤال بالشكل الذي سيظهر للطالب."
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          الترتيب
          <input
            className="form-input"
            defaultValue={question?.order ?? nextOrder ?? 1}
            min="1"
            name="order"
            required
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          الدرجة
          <input
            className="form-input"
            defaultValue={question?.marks ?? 1}
            min="1"
            name="marks"
            required
            type="number"
          />
        </label>
      </div>

      {type === "multiple_choice" ? (
        <div className="grid gap-4 rounded-xl border border-border bg-[#fbfcfc] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black">خيارات الإجابة</h4>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                أضف الخيارات ثم حدّد الإجابة الصحيحة أو الصحيحة المتعددة. إذا كانت هناك أكثر من إجابة صحيحة فسيظهر
                السؤال للطالب بصيغة متعددة الإجابات تلقائيًا.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-black"
              onClick={addOption}
              type="button"
            >
              <PlusCircle className="h-4 w-4 text-primary" />
              إضافة خيار
            </button>
          </div>

          <div className="grid gap-3">
            {options.map((option, index) => (
              <div className="grid gap-3 rounded-lg border border-border bg-white p-3 md:grid-cols-[auto_1fr_auto]" key={option.id}>
                <label className="inline-flex items-center gap-2 text-sm font-black">
                  <input
                    checked={option.isCorrect}
                    onChange={(event) => toggleMcqCorrect(index, event.target.checked)}
                    type="checkbox"
                  />
                  صحيح
                </label>
                <input
                  className="form-input"
                  onChange={(event) => updateOption(index, { text: event.target.value })}
                  placeholder={`الخيار ${index + 1}`}
                  type="text"
                  value={option.text}
                />
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-danger/30 px-3 py-2 text-xs font-black text-danger disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={options.length <= 2}
                  onClick={() => removeOption(index)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {type === "true_false" ? (
        <div className="grid gap-4 rounded-xl border border-border bg-[#fbfcfc] p-4">
          <div>
            <h4 className="text-sm font-black">اختيار الإجابة الصحيحة</h4>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              حدّد هل العبارة الصحيحة هي True أم False. سيظهر للطالب تحكم صح/خطأ مباشر.
            </p>
          </div>

          <div className="grid gap-3">
            {options.map((option, index) => (
              <label
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-black ${
                  option.isCorrect ? "border-primary bg-[#eef8f5]" : "border-border bg-white"
                }`}
                key={option.id}
              >
                <span>{option.text === "True" ? "صح" : "خطأ"}</span>
                <input
                  checked={option.isCorrect}
                  name={`true-false-${examId}-${question?.id ?? "new"}`}
                  onChange={() => setTrueFalseCorrect(index)}
                  type="radio"
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {type === "short_answer" ? (
        <div className="rounded-xl border border-border bg-[#fbfcfc] p-4">
          <div className="flex items-start gap-3">
            <CircleHelp className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h4 className="text-sm font-black">سؤال مقالي / كتابي</h4>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                يجيب الطالب في حقل نصي حر. يتم حفظ المحاولة بأمان لكن درجة السؤال تبقى معلّقة حتى المراجعة اليدوية.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-bold">
        شرح الإجابة
        <textarea
          className="form-input min-h-24 py-3"
          defaultValue={question?.explanation}
          name="explanation"
          placeholder="شرح اختياري يظهر بعد النتيجة أو أثناء المراجعة."
        />
      </label>

      <div className="flex justify-end">
        <PendingSubmitButton pendingLabel={isEdit ? "جارٍ حفظ السؤال..." : "جارٍ إضافة السؤال..."} size="md">
          {isEdit ? "حفظ السؤال" : "إضافة السؤال"}
        </PendingSubmitButton>
      </div>
    </form>
  );
}

function DeleteQuestionButton({ examId, questionId }: { examId: string; questionId: string }) {
  return (
    <form action={deleteExamQuestionAction}>
      <input name="examId" type="hidden" value={examId} />
      <input name="questionId" type="hidden" value={questionId} />
      <PendingSubmitButton
        className="border-danger/30 text-danger hover:bg-danger/5"
        pendingLabel="جارٍ الحذف..."
        variant="outline"
      >
        حذف
      </PendingSubmitButton>
    </form>
  );
}

export function ExamQuestionManager({ exam }: { exam: AdminExamEditorData }) {
  const nextOrder = exam.questions.length + 1;

  return (
    <section className="grid gap-5 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">بنك الأسئلة</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            أضف أسئلة اختيار من متعدد، صح وخطأ، أو أسئلة مقالية بالترتيب الذي سيظهر للطالب. مجموع الدرجات يتحدث
            تلقائيًا بعد كل حفظ.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="font-black text-primary">{exam.exam.totalMarks}</span>{" "}
          <span className="font-bold text-muted-foreground">إجمالي الدرجات</span>
        </div>
      </div>

      {exam.questions.length ? (
        <div className="grid gap-4">
          {exam.questions.map((question) => (
            <details className="rounded-xl border border-border bg-muted/20" key={question.id}>
              <summary className="cursor-pointer list-none px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                      {question.type === "multiple_choice"
                        ? question.allowsMultipleAnswers
                          ? "اختيار من متعدد (أكثر من إجابة)"
                          : "اختيار من متعدد"
                        : question.type === "true_false"
                          ? "صح / خطأ"
                          : "سؤال مقالي"}{" "}
                      • {question.marks} درجة
                    </p>
                    <h3 className="mt-1 text-base font-black">{question.prompt}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-muted-foreground">
                      الترتيب {question.order}
                    </span>
                    <DeleteQuestionButton examId={exam.exam.id} questionId={question.id} />
                  </div>
                </div>
              </summary>
              <div className="border-t border-border p-4">
                <QuestionEditorForm examId={exam.exam.id} question={question} />
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm font-bold text-muted-foreground">
          لا توجد أسئلة بعد. أضف أول سؤال في الأسفل لتحويل الامتحان إلى تقييم فعلي.
        </div>
      )}

      <QuestionEditorForm examId={exam.exam.id} nextOrder={nextOrder} />
    </section>
  );
}
