"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Dna,
  HeartPulse,
  Microscope,
  Moon,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserCheck,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

const doctorImage = "/images/medly-medical-student.jpeg";

const copy = {
  ar: {
    eyebrow: "منصة عربية لتعلّم الطب بهدوء",
    headline: "تعلّم الطب في بيئة أكثر تنظيماً ووضوحاً",
    description:
      "كورسات طبية مبسطة، شرح منظم، وتجربة تعليمية هادئة تساعدك على التركيز والمراجعة بدون تشتيت.",
    primary: "استكشف الكورسات",
    secondary: "ابدأ الآن مجاناً",
    features: ["وصول فوري من حسابك", "مراجعة دفع عبر فودافون كاش", "شراء كورسات بشكل فردي"],
    statLabel: "كورس طبي",
    statValue: "+50",
    cardTitle: "تعلم منظم",
    cardBody: "دروس قصيرة ومراجعة هادئة",
    darkMode: "وضع ليلي",
    lightMode: "وضع نهاري",
    imageAlt: "طالب طب يذاكر على تابلت وبجانبه كتب ولابتوب",
  },
  en: {
    eyebrow: "Calm Arabic-first medical learning",
    headline: "Learn medicine in a clearer, more organized environment",
    description:
      "Simplified medical courses, structured explanations, and a calm study experience built for focus and review without noise.",
    primary: "Explore courses",
    secondary: "Start free now",
    features: ["Instant account access", "Manual Vodafone Cash review", "Individual course purchase"],
    statLabel: "medical courses",
    statValue: "50+",
    cardTitle: "Structured learning",
    cardBody: "Short lessons and calm review",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    imageAlt: "Medical student studying on a tablet with books and a laptop",
  },
};

const featureIcons = [UserCheck, CreditCard, BadgeCheck];
const medicalLineArt = [
  { Icon: Activity, className: "end-1 top-7 h-12 w-12 rotate-3" },
  { Icon: Microscope, className: "end-10 top-[32%] h-14 w-14 -rotate-6" },
  { Icon: HeartPulse, className: "end-0 bottom-[31%] h-12 w-12 rotate-6" },
  { Icon: Dna, className: "end-16 bottom-7 h-14 w-14 -rotate-12" },
];

export function HeroSection() {
  const { language } = useLanguage();
  const text = copy[language];
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("medly-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("medly-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function toggleDarkMode() {
    setDarkMode((value) => !value);
  }

  return (
    <section data-no-translate className="medly-landing-bg relative overflow-hidden border-b border-[#d9e8e4]">
      <div className="absolute inset-0 medical-grid opacity-30" />
      <Stethoscope
        aria-hidden
        className="pointer-events-none absolute -right-16 top-16 h-64 w-64 text-[#0e5f5c]/10 md:h-96 md:w-96"
        strokeWidth={1}
      />
      <Activity
        aria-hidden
        className="pointer-events-none absolute left-6 top-24 h-56 w-56 text-[#0e5f5c]/10 md:h-80 md:w-80"
        strokeWidth={1}
      />
      <HeartPulse
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-[42%] hidden h-44 w-44 text-[#0e5f5c]/8 lg:block"
        strokeWidth={1}
      />

      <Container className="relative grid min-h-0 items-center gap-8 pt-20 pb-14 sm:pb-20 lg:min-h-[560px] lg:grid-cols-[0.96fr_1.04fr] lg:pt-16 lg:pb-24">
        <button
          className="absolute left-4 top-4 z-20 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#b8dcd4] bg-white/70 px-4 text-sm font-black text-[#0e5f5c] shadow-[0_10px_22px_rgba(14,95,92,0.06)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white sm:left-6 lg:left-8"
          onClick={toggleDarkMode}
          type="button"
          aria-pressed={darkMode}
        >
          {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {darkMode ? text.darkMode : text.lightMode}
        </button>

        <div
          className={cn(
            "hero-preview order-2 relative mx-auto h-[280px] w-full max-w-[430px] sm:h-[380px] lg:h-[460px] lg:max-w-[500px]",
            language === "ar" ? "lg:order-1" : "lg:order-2",
          )}
        >
          <div className="pointer-events-none absolute inset-y-6 end-[-1.75rem] z-[2] hidden w-24 lg:block">
            {medicalLineArt.map(({ Icon, className }) => (
              <span
                key={className}
                className={cn(
                  "absolute grid place-items-center rounded-lg border border-[#0e5f5c]/12 bg-white/35 text-[#0e5f5c]/55 shadow-[0_12px_25px_rgba(14,95,92,0.045)] backdrop-blur-sm",
                  className,
                )}
              >
                <Icon className="h-[58%] w-[58%]" strokeWidth={1.55} />
              </span>
            ))}
          </div>
          <div className="absolute inset-4 rounded-lg bg-white/32 shadow-[0_22px_55px_rgba(14,95,92,0.08)] backdrop-blur-sm" />
          <div className="absolute inset-x-10 bottom-1 h-20 rounded-[50%] bg-[#0e5f5c]/12 blur-2xl" />
          <div className="absolute right-11 top-10 z-10 hidden rounded-lg border border-white/80 bg-white/88 px-4 py-3 text-sm font-black text-[#0e5f5c] shadow-[0_14px_34px_rgba(15,23,42,0.075)] backdrop-blur sm:block">
            <span className="block text-2xl leading-none text-[#0f172a]">{text.statValue}</span>
            <span className="mt-1 block text-xs text-[#5f6f6c]">{text.statLabel}</span>
          </div>
          <div className="absolute bottom-8 left-11 z-10 max-w-[155px] rounded-lg border border-white/80 bg-white/88 p-2.5 text-sm shadow-[0_14px_34px_rgba(15,23,42,0.075)] backdrop-blur">
            <span className="inline-flex items-center gap-1.5 font-black leading-5 text-[#0f172a]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0e5f5c]" />
              {text.cardTitle}
            </span>
            <span className="mt-1 block text-[11px] font-bold leading-5 text-[#5f6f6c]">{text.cardBody}</span>
          </div>
          <div className="absolute inset-x-8 bottom-0 top-5 overflow-hidden rounded-lg border border-white/70 bg-[#eef8f5] shadow-[0_26px_48px_rgba(14,95,92,0.13)]">
            <Image
              priority
              fill
              sizes="(min-width: 1024px) 38vw, 90vw"
              className="object-cover object-[52%_12%]"
              src={doctorImage}
              alt={text.imageAlt}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_66%,rgba(223,244,239,0.42)_100%)]" />
          </div>
        </div>

        <div
          className={cn(
            "hero-copy order-1 mx-auto max-w-[590px] text-center lg:mx-0 lg:text-start",
            language === "ar" ? "lg:order-2" : "lg:order-1",
          )}
        >
          <p className="inline-flex items-center gap-2 rounded-lg border border-[#b8dcd4] bg-white/62 px-3 py-2 text-sm font-black text-[#0e5f5c] shadow-[0_8px_18px_rgba(14,95,92,0.055)]">
            <Stethoscope className="h-4 w-4" />
            {text.eyebrow}
          </p>

          <h1 className="mt-5 text-3xl font-black leading-[1.24] text-[#0f172a] sm:text-[46px] lg:text-[54px]">
            {text.headline}
          </h1>

          <p className="mt-5 max-w-[540px] text-base leading-8 text-[#415854] sm:text-lg">
            {text.description}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              className={buttonVariants({
                size: "lg",
                className:
                  "min-h-12 w-full bg-[#0e5f5c] px-8 shadow-[0_14px_28px_rgba(14,95,92,0.17)] hover:-translate-y-0.5 hover:bg-[#0a4f4c] sm:w-auto",
              })}
              href="/courses"
            >
              {text.primary}
              <ArrowIcon className="h-4 w-4" />
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "min-h-12 w-full border-[#b8cac6] bg-white/78 px-8 text-[#0f172a] shadow-[0_10px_22px_rgba(15,23,42,0.04)] hover:border-[#0e5f5c]/40 hover:bg-white sm:w-auto",
              })}
              href="/register"
            >
              {text.secondary}
            </Link>
          </div>

          <div className="mt-7 grid gap-3 text-sm font-bold text-[#425a56] sm:grid-cols-3">
            {text.features.map((item, index) => {
              const Icon = featureIcons[index];

              return (
                <span
                  key={item}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#cfe3de]/80 bg-white/50 px-3 py-2.5 lg:justify-start"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#0e5f5c]" />
                  {item}
                </span>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
