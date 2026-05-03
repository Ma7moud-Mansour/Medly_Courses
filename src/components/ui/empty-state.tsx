import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
      <SearchX className="mx-auto h-10 w-10 text-primary" />
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">{body}</p>
      {actionHref && actionLabel ? (
        <Link className={buttonVariants({ className: "mt-5" })} href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
