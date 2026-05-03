import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "عن Medly",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="عن Medly"
        title="منصة تعليم طبي عربية هدفها الفهم والتطبيق"
        subtitle="Medly مصممة لطالب الطب الذي يحتاج مسارًا واضحًا من أول البحث عن الكورس حتى بدء الدراسة."
      />
      <Container className="grid gap-8 py-10 lg:grid-cols-2">
        <div className="space-y-4 text-lg leading-9 text-muted-foreground">
          <p>
            بنينا Medly حول تجربة الطالب اليومية: بحث سريع، صفحة كورس واضحة، شراء بخطوات قليلة عبر فودافون كاش،
            ومتابعة تقدم تحفظ آخر درس وموضع.
          </p>
          <p>
            المنصة تركز على التعليم الطبي، الامتياز، والتحضير للامتحانات، مع هيكلة حديثة تعتمد على PostgreSQL وPrisma
            وتسمح لنا بتقديم محتوى منظم وتجربة دراسة هادئة وقابلة للتوسع.
          </p>
        </div>
        <img
          className="h-full min-h-80 rounded-lg object-cover shadow-xl"
          src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80"
          alt="فريق طبي في ممر مستشفى"
        />
      </Container>
    </>
  );
}
