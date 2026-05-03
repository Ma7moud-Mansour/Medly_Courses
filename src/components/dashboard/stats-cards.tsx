import { BookOpen, CheckCircle2, LifeBuoy, ShieldCheck } from "lucide-react";
import type { StudentDashboardStats } from "@/lib/student/repository";
import { formatNumber } from "@/lib/utils";

const statsConfig = [
  { key: "enrolledCourses", label: "الكورسات المسجلة", icon: BookOpen },
  { key: "activeCourses", label: "الكورسات النشطة", icon: ShieldCheck },
  { key: "completedLessons", label: "الدروس المكتملة", icon: CheckCircle2 },
  { key: "supportTickets", label: "تذاكر الدعم", icon: LifeBuoy },
] as const;

export function StatsCards({ stats }: { stats: StudentDashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statsConfig.map((stat) => (
        <div key={stat.key} className="rounded-lg border border-border bg-surface p-5">
          <stat.icon className="h-6 w-6 text-primary" />
          <p className="mt-4 text-3xl font-black">{formatNumber(stats[stat.key])}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
