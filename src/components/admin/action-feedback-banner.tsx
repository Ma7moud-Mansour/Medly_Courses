import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActionFeedbackBanner({
  kind,
  message,
  className,
}: {
  kind: "success" | "error";
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm",
        kind === "success" && "border-primary/15 bg-[#eef8f5] text-primary",
        kind === "error" && "border-[#efc3bd] bg-[#fff4f2] text-[#9f3c2d]",
        className,
      )}
      role="status"
    >
      {kind === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="leading-6">{message}</span>
    </div>
  );
}
