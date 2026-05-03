import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-[#f6fbf8] lg:grid-cols-[1fr_480px]">
      <section className="relative hidden overflow-hidden bg-[#123c35] text-white lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=85"
          alt="تعليم طبي رقمي"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link className="text-3xl font-black" href="/">
            Medly
          </Link>
          <div>
            <p className="max-w-xl text-4xl font-black leading-tight">
              حساب واحد لكورساتك، وتقدّمك، وتأكيد الدخول الآمن عبر البريد الإلكتروني.
            </p>
            <p className="mt-4 max-w-lg leading-8 text-white/80">
              التسجيل والدخول للطلاب أصبحا مرتبطين بكود تحقق يصل إلى البريد الإلكتروني،
              مع جلسات حقيقية وآمنة حسب دور كل مستخدم.
            </p>
          </div>
        </div>
      </section>
      <section className="grid place-items-center px-4 py-10">{children}</section>
    </main>
  );
}
