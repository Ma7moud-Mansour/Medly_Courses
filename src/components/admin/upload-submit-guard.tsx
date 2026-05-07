"use client";

import { useEffect, useRef, useState } from "react";

export function UploadSubmitGuard() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const form = anchorRef.current?.closest("form");

    if (!form) {
      return;
    }

    const handleSubmit = (event: SubmitEvent) => {
      const pendingUpload = form.querySelector<HTMLElement>("[data-upload-state='pending']");
      const missingRequiredUpload = form.querySelector<HTMLElement>(
        "[data-upload-required='true'][data-upload-has-file='false']",
      );

      if (!pendingUpload && !missingRequiredUpload) {
        setMessage("");
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const target = pendingUpload ?? missingRequiredUpload;

      setMessage(
        pendingUpload
          ? "استنى رفع الملف يخلص الأول، وبعدها اضغط حفظ."
          : "ارفع صورة الكورس الأول، وبعدها اضغط حفظ.",
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    form.addEventListener("submit", handleSubmit, true);

    return () => {
      form.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  return (
    <div ref={anchorRef} aria-live="polite">
      {message ? (
        <div className="rounded-xl border border-[#efc3bd] bg-[#fff4f2] px-4 py-3 text-sm font-bold leading-6 text-[#9f3c2d]">
          {message}
        </div>
      ) : null}
    </div>
  );
}
