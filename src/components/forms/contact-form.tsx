"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { contactSchema, type ContactInput } from "@/lib/validators/schemas";

type ContactResult = {
  ticketId: string;
};

export function ContactForm() {
  const [sent, setSent] = useState<ContactResult>();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      topic: "support",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSent(undefined);
    setServerError(undefined);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setServerError(payload?.error ?? "تعذر إرسال الرسالة. حاول مرة أخرى.");
      return;
    }

    setSent({ ticketId: payload?.data?.ticketId ?? "" });
    reset({ topic: "support", name: "", email: "", message: "" });
  });

  return (
    <form className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-black">أرسل رسالة للدعم</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          رسالتك هتتحول لتذكرة حقيقية داخل لوحة الأدمن، والردود هتظهر في صندوق الدعم لو حسابك مسجل.
        </p>
      </div>

      <Field label="الاسم" error={errors.name?.message}>
        <input className="form-input" {...register("name")} autoComplete="name" placeholder="اكتب اسمك" />
      </Field>

      <Field label="البريد الإلكتروني" error={errors.email?.message}>
        <input className="form-input" {...register("email")} autoComplete="email" placeholder="example@email.com" type="email" />
      </Field>

      <Field label="نوع الرسالة" error={errors.topic?.message}>
        <select className="form-input" {...register("topic")}>
          <option value="support">دعم فني</option>
          <option value="billing">الدفع والفواتير</option>
          <option value="course_access">الوصول للكورس</option>
          <option value="content">اقتراح محتوى</option>
          <option value="general">استفسار عام</option>
        </select>
      </Field>

      <Field label="الرسالة" error={errors.message?.message}>
        <textarea
          className="form-input min-h-36 resize-y py-3"
          {...register("message")}
          placeholder="اكتب تفاصيل المشكلة أو الاستفسار..."
        />
      </Field>

      {serverError ? (
        <p className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm font-bold text-danger">
          {serverError}
        </p>
      ) : null}

      {sent ? (
        <p className="rounded-lg border border-[#cfe3de] bg-[#eef8f5] p-3 text-sm font-bold text-primary">
          وصلت رسالتك واتفتحت تذكرة للدعم. رقم التذكرة: {sent.ticketId}
        </p>
      ) : null}

      <Button disabled={isSubmitting} type="submit">
        <Send className="h-4 w-4" />
        {isSubmitting ? "جاري الإرسال..." : "إرسال الرسالة"}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
