import { Activity, BookOpenCheck, GraduationCap, Users } from "lucide-react";
import { Container } from "@/components/layout/container";

const stats = [
  { label: "طالب نشط", value: "+42 ألف", icon: Users },
  { label: "درس طبي", value: "+240", icon: BookOpenCheck },
  { label: "مراجعة امتحان", value: "+80", icon: GraduationCap },
  { label: "تقدم محفوظ", value: "لحظي", icon: Activity },
];

export function TrustBar() {
  return (
    <section className="border-b border-border bg-surface">
      <Container className="grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-lg bg-muted p-4">
            <stat.icon className="h-6 w-6 text-primary" />
            <div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}
