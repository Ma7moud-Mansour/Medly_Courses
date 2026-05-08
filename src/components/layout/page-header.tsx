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
    <header className="page-header-reveal border-b border-[#e8eeec] bg-[#f8faf8]">
      <Container className="py-9 sm:py-12 lg:py-16">
        {eyebrow ? <p className="page-header-eyebrow text-sm font-black text-[#8a6a2f]">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-4xl break-words text-3xl font-black leading-[1.25] text-[#0f172a] sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#5f6f6c] sm:mt-5 sm:text-lg sm:leading-9">{subtitle}</p>
        ) : null}
      </Container>
    </header>
  );
}
