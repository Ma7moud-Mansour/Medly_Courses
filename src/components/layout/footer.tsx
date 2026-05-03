import Link from "next/link";
import { FullMedlyLogo } from "@/components/brand/medly-logo";
import { Container } from "@/components/layout/container";
import { contactNumbers, whatsappUrl } from "@/data/medly";

const columns = [
  {
    title: "المنصة",
    links: [
      { href: "/courses", label: "الكورسات" },
      { href: "/categories", label: "التصنيفات" },
      { href: "/instructors", label: "الدكاتره" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { href: "/faq", label: "الأسئلة الشائعة" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/cart", label: "السلة" },
    ],
  },
  {
    title: "قانوني",
    links: [
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "الشروط" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#e8eeec] bg-white">
      <Container className="grid gap-12 py-14 lg:grid-cols-[1.25fr_1.75fr]">
        <div>
          <Link className="inline-flex" href="/" aria-label="Medly">
            <FullMedlyLogo />
          </Link>
          <p className="mt-5 max-w-md leading-8 text-[#5f6f6c]">
            منصة عربية لتعلّم الطب بوضوح: كورسات فردية، دفع بسيط، وتجربة دراسة
            هادئة تناسب الطالب الجاد.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {contactNumbers.map((phone) => (
              <a
                key={phone}
                className="rounded-lg border border-[#e8eeec] bg-[#fbfcfb] px-3 py-2 text-sm font-black text-[#0e5f5c] transition hover:bg-[#f2f6f4]"
                href={whatsappUrl(phone)}
                target="_blank"
                rel="noreferrer"
              >
                واتساب {phone}
              </a>
            ))}
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-black text-[#0f172a]">{column.title}</h3>
              <ul className="mt-4 grid gap-3 text-sm text-[#5f6f6c]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link className="transition hover:text-[#0e5f5c]" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <div className="border-t border-[#e8eeec] py-4 text-center text-sm text-[#5f6f6c]">
        Medly 2026. كل الحقوق محفوظة.
      </div>
    </footer>
  );
}
