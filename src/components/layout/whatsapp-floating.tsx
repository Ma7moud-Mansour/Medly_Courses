"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { contactNumbers, whatsappUrl } from "@/data/medly";

export function WhatsappFloating() {
  const [open, setOpen] = useState(false);

  return (
    <div className="whatsapp-float fixed bottom-4 left-4 z-40">
      {open ? (
        <div className="mb-3 w-64 rounded-lg border border-[#e8eeec] bg-white/96 p-3 shadow-[0_16px_42px_rgba(15,23,42,0.09)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-[#0f172a]">راسلنا الآن</p>
              <p className="mt-1 text-xs leading-5 text-[#5f6f6c]">اختر رقم واتساب للتواصل مع الدعم.</p>
            </div>
            <button
              className="grid h-8 w-8 place-items-center rounded-lg text-[#5f6f6c] transition hover:bg-[#f2f6f4] hover:text-[#0f172a]"
              onClick={() => setOpen(false)}
              type="button"
              aria-label="إغلاق واتساب"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            {contactNumbers.map((phone) => (
              <a
                key={phone}
                className="flex items-center justify-between rounded-lg border border-[#e8eeec] bg-[#fbfcfb] px-3 py-2 text-sm font-black text-[#0e5f5c] transition hover:-translate-y-0.5 hover:bg-[#f2f6f4]"
                href={whatsappUrl(phone)}
                target="_blank"
                rel="noreferrer"
              >
                <span>{phone}</span>
                <MessageCircle className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <button
        className="grid h-9 w-9 place-items-center rounded-full border border-[#dce7e4] bg-white/95 text-[#0e5f5c] shadow-[0_8px_22px_rgba(15,23,42,0.08)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-[#f2f6f4]"
        onClick={() => setOpen((value) => !value)}
        type="button"
        aria-label="فتح واتساب"
      >
        <MessageCircle className="h-4 w-4" />
      </button>
    </div>
  );
}
