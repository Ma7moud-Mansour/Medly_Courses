"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { StudentProfileView } from "@/lib/student/repository";

export function ProfileSettingsForm({ profile }: { profile: StudentProfileView }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [university, setUniversity] = useState(profile.university ?? "");
  const [academicYear, setAcademicYear] = useState(profile.academicYear ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          university,
          academicYear,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "تعذر حفظ التعديلات الآن.");
        return;
      }

      setMessage("تم حفظ بياناتك بنجاح.");
    });
  }

  return (
    <form className="mt-6 grid max-w-2xl gap-4 rounded-lg border border-border bg-surface p-6" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold">
        الاسم
        <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        البريد
        <input className="form-input bg-muted/60" value={profile.email} readOnly />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        الهاتف
        <input className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        الجامعة
        <input className="form-input" value={university} onChange={(event) => setUniversity(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        السنة الدراسية
        <input className="form-input" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
      </label>
      {error ? <p className="text-sm font-bold text-[#bd372d]">{error}</p> : null}
      {message ? <p className="text-sm font-bold text-primary">{message}</p> : null}
      <Button className="w-full sm:w-fit" disabled={isPending} type="submit">
        {isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
      </Button>
    </form>
  );
}
