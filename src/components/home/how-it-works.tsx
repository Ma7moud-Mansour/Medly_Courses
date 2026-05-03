import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";

const steps = [
  ["ابحث", "اكتب اسم المادة أو الدكتور وشوف suggestions منظمة."],
  ["اختار", "راجع المنهج، الدكتور، التقييمات، والسعر قبل القرار."],
  ["ادفع", "سلة واضحة، كوبونات، وخطوات checkout قليلة."],
  ["كمل", "Dashboard يرجعك لآخر درس ويحفظ تقدمك تلقائيًا."],
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface py-16">
      <Container>
        <SectionHeader title="رحلة الطالب من أول بحث حتى بدء الدراسة" subtitle="كل خطوة لها state واضح: loading، empty، error، success." />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map(([title, body], index) => (
            <div key={title} className="rounded-lg bg-muted p-5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
