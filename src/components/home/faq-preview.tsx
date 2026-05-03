import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { buttonVariants } from "@/components/ui/button";
import { faqs } from "@/data/medly";

export function FaqPreview() {
  return (
    <section className="border-y border-[#e8eeec] bg-white py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="قبل الشراء"
              title="أسئلة قصيرة، بإجابات مباشرة."
              subtitle="كل شيء حول الدفع، الوصول للكورس، وحساب الطالب بدون تفاصيل مشتتة."
            />
            <Link className={buttonVariants({ variant: "outline", className: "mt-7" })} href="/faq">
              كل الأسئلة
            </Link>
          </div>
          <div className="grid gap-3">
            {faqs.slice(0, 4).map((faq) => (
              <details key={faq.id} className="rounded-lg border border-[#e8eeec] bg-[#fbfcfb] p-5">
                <summary className="cursor-pointer font-black text-[#0f172a]">{faq.question}</summary>
                <p className="mt-3 text-sm leading-7 text-[#5f6f6c]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
