import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { faqs } from "@/data/medly";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="إجابات سريعة قبل التسجيل أو الشراء"
        subtitle="كل سؤال هنا يمثل state أو flow مهم في رحلة الطالب."
      />
      <Container className="grid gap-3 py-10">
        {faqs.map((faq) => (
          <details key={faq.id} className="rounded-lg border border-border bg-surface p-5">
            <summary className="cursor-pointer text-lg font-black">{faq.question}</summary>
            <p className="mt-3 leading-8 text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </Container>
    </>
  );
}
