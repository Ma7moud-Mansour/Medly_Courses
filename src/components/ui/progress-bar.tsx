import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("h-2 rounded-full bg-muted", className)} role="progressbar">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
