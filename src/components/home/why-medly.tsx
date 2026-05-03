import { BookOpenCheck, Landmark, LayoutDashboard } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";

const items = [
  {
    title: "تنظيم أكاديمي واضح",
    body: "كل كورس مرتب في وحدات قصيرة، موارد مختصرة، وأسئلة تطبيقية بدون حشو.",
    icon: BookOpenCheck,
  },
  {
    title: "شراء مباشر وشفاف",
    body: "كل كورس له سعر مستقل. لا اشتراكات، ولا خطط متكررة، ولا خطوات مربكة.",
    icon: Landmark,
  },
  {
    title: "حساب طالب هادئ",
    body: "الكورس يظهر بعد الدفع مباشرة، مع تقدم محفوظ ومتابعة آخر درس.",
    icon: LayoutDashboard,
  },
];

export function WhyMedly() {
  return (
    <section className="border-y border-[#e8eeec] bg-white py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeader
            eyebrow="لماذا Medly"
            title="منصة تبدو كبيئة دراسة طبية، لا كسوق كورسات."
            subtitle="نقلل الضوضاء ونترك القرار واضحًا: اختر، ادفع، وابدأ التعلم."
          />
          <div className="grid gap-4">
            {items.map((item) => (
              <div key={item.title} className="grid gap-4 rounded-lg border border-[#e8eeec] bg-[#fbfcfb] p-5 sm:grid-cols-[44px_1fr]">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#dceeea] text-[#0e5f5c]">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#0f172a]">{item.title}</h3>
                  <p className="mt-2 leading-7 text-[#5f6f6c]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
