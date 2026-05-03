"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();

  const handleLanguageChange = (item: "ar" | "en") => {
    setLanguage(item);
    document.cookie = `medly-language=${item}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div data-no-translate className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#dce9e5] bg-white/90 p-0.5 backdrop-blur">
      {(["ar", "en"] as const).map((item) => (
        <button
          key={item}
          className={`h-7 rounded-md px-2 text-xs font-black transition duration-200 ${
            language === item ? "bg-[#0e5f5c] text-white" : "text-[#5f6f6c] hover:bg-[#f2f6f4] hover:text-[#0f172a]"
          }`}
          onClick={() => handleLanguageChange(item)}
          type="button"
        >
          {item === "ar" ? "عربي" : "EN"}
        </button>
      ))}
    </div>
  );
}
