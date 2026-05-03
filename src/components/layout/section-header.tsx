import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "start",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <p className="mb-3 text-sm font-black text-[#8a6a2f]">{eyebrow}</p> : null}
      <h2 className="text-3xl font-black leading-[1.25] text-foreground sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}
