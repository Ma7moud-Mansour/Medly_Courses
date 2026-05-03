import type { LucideIcon } from "lucide-react";

export type AnalyticsCardItem = {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
};

export function AnalyticsCards({ cards }: { cards: AnalyticsCardItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-border bg-surface p-5">
          <card.icon className="h-6 w-6 text-primary" />
          <p className="mt-4 text-3xl font-black">{card.value}</p>
          <p className="text-sm font-bold text-foreground">{card.label}</p>
          {card.helper ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}
