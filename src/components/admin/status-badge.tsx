import { cn } from "@/lib/utils";

const styles = {
  active: "bg-[#e8f7f1] text-[#0e5f5c]",
  blocked: "bg-[#fdeceb] text-[#b63f36]",
  suspended: "bg-[#fbf4e6] text-[#8a6a2f]",
  open: "bg-[#e8f7f1] text-[#0e5f5c]",
  in_progress: "bg-[#eef5ff] text-[#315d9c]",
  resolved: "bg-[#edf7e8] text-[#4c7a1f]",
  closed: "bg-[#eef2f1] text-[#536a66]",
  draft: "bg-[#eef2f1] text-[#536a66]",
  paused: "bg-[#fbf4e6] text-[#8a6a2f]",
  admin: "bg-[#eef5ff] text-[#315d9c]",
  support: "bg-[#fbf4e6] text-[#8a6a2f]",
  student: "bg-[#e8f7f1] text-[#0e5f5c]",
  instructor: "bg-[#f4efff] text-[#6942aa]",
  active_access: "bg-[#e8f7f1] text-[#0e5f5c]",
  revoked: "bg-[#fdeceb] text-[#b63f36]",
  expired: "bg-[#fbf4e6] text-[#8a6a2f]",
} as const;

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof styles;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black",
        styles[tone],
      )}
    >
      {label}
    </span>
  );
}
