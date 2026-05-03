import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { testimonials } from "@/data/medly";

export function Testimonials() {
  return (
    <section className="py-16">
      <Container>
        <SectionHeader
          eyebrow="آراء الطلاب"
          title="ثقة مبنية على تجربة مذاكرة فعلية"
          subtitle="نماذج seed جاهزة لصفحة الهوم وصفحات التسويق."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((testimonial) => (
            <figure key={testimonial.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <img
                  className="h-12 w-12 rounded-lg object-cover"
                  src={testimonial.avatar}
                  alt={testimonial.name}
                />
                <figcaption>
                  <p className="font-black">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </figcaption>
              </div>
              <blockquote className="mt-4 text-sm leading-8 text-muted-foreground">
                {testimonial.quote}
              </blockquote>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
