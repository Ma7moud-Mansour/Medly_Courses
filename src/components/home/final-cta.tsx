import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="bg-[#f8faf8] py-20">
      <Container>
        <div className="rounded-lg border border-[#173b38] bg-[#0f172a] px-6 py-10 text-white sm:px-10 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black text-[#c8a96b]">ابدأ بهدوء</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black leading-[1.3] sm:text-4xl">
                اختر كورسك الطبي، وابدأ الدراسة من حسابك فورًا.
              </h2>
              <p className="mt-4 max-w-2xl leading-8 text-white/72">
                تجربة شراء واضحة، دفع عبر فوري باي، ومتابعة تقدمك داخل منصة واحدة.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className={buttonVariants({ size: "lg", className: "bg-white text-[#0f172a] hover:bg-[#eef3f1]" })} href="/courses">
                تصفح الكورسات
              </Link>
              <Link
                className={buttonVariants({ variant: "outline", size: "lg", className: "border-white/20 bg-transparent text-white hover:bg-white/10" })}
                href="/contact"
              >
                تواصل معنا
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
