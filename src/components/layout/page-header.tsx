import { Container } from "@/components/layout/container";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="border-b border-[#e8eeec] bg-[#f8faf8]">
      <Container className="py-12 sm:py-16">
        {eyebrow ? <p className="text-sm font-black text-[#8a6a2f]">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.25] text-[#0f172a] sm:text-5xl">{title}</h1>
        {subtitle ? (
          <p className="mt-5 max-w-3xl text-lg leading-9 text-[#5f6f6c]">{subtitle}</p>
        ) : null}
      </Container>
    </header>
  );
}
