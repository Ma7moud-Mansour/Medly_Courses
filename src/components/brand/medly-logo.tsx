import { cn } from "@/lib/utils";

export function MedlyIcon({ className }: { className?: string }) {
  return (
    <span
      data-no-translate
      className={cn(
        "inline-grid h-7 w-7 place-items-center rounded-lg border border-[#0e5f5c]/10 bg-[#0e5f5c] text-white shadow-[0_6px_14px_rgba(14,95,92,0.10)]",
        className,
      )}
      aria-hidden
    >
      <svg className="h-[18px] w-[18px]" viewBox="0 0 40 40" fill="none">
        <path
          d="M11 7v12c0 7 4 11.5 9 11.5S29 26 29 19V7"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
        />
        <path
          d="M20 30.5c0 4 2.9 6.5 6.9 6.5 3.6 0 6.1-2.3 6.1-5.4"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
        />
        <circle cx="33" cy="31.5" r="3.2" stroke="currentColor" strokeWidth="2.7" />
        <path d="M7 6h7M26 6h7" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function HeaderLogo({ className }: { className?: string }) {
  return (
    <span data-no-translate className={cn("inline-flex items-center gap-2", className)}>
      <MedlyIcon />
      <span className="text-[21px] font-black leading-none tracking-normal text-[#0f172a]">
        Medly
      </span>
    </span>
  );
}

export function FullMedlyLogo({ className }: { className?: string }) {
  return (
    <span data-no-translate className={cn("inline-flex flex-col items-start text-[#123f36]", className)}>
      <span className="inline-flex items-center gap-4">
        <span
          className="text-[56px] font-black leading-none tracking-[-0.04em]"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          Medly
        </span>
        <svg className="h-12 w-14 shrink-0 text-[#123f36]" viewBox="0 0 64 64" fill="none" aria-hidden>
          <path
            d="M16 8v20c0 11 7 19 17 19s17-8 17-19V8"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M33 47c0 7 5 11 12 11 6 0 10-4 10-9"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <circle cx="55" cy="48" r="5.5" stroke="currentColor" strokeWidth="5.5" />
          <path d="M9 7h11M46 7h11" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0f172a]">
        Organized Medical Learning Platform
      </span>
    </span>
  );
}
