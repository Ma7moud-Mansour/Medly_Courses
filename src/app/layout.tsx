import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cairo, Geist_Mono } from "next/font/google";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { LanguageProvider } from "@/components/i18n/language-provider";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Medly - منصة التعليم الطبي العربي",
    template: "%s | Medly",
  },
  description:
    "منصة تعليم طبي عربية للكورسات الفردية، المراجعات، الاختبارات، والدفع اليدوي عبر فودافون كاش.",
  keywords: ["تعليم طبي", "كورسات طب", "Medly", "مراجعات طبية", "Vodafone Cash"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("medly-language")?.value;
  const lang = langCookie === "en" ? "en" : "ar";
  const dir = "rtl";

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${cairo.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className={`min-h-full bg-background text-foreground ${lang === "en" ? "lang-en" : ""}`}>
        <LanguageProvider initialLanguage={lang}>
          <AuthBootstrap />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
