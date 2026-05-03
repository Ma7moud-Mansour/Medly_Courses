import type { Metadata } from "next";
import { MessageCircle, PhoneCall } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { contactNumbers, whatsappUrl } from "@/data/medly";

export const metadata: Metadata = {
  title: "تواصل معنا",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="تواصل معنا"
        title="اسأل عن كورس أو مشكلة في الحساب"
        subtitle="اكتب رسالتك وسيتم فتح تذكرة دعم حقيقية داخل لوحة Medly، أو تواصل مباشرة عبر واتساب."
      />
      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_420px]">
        <ContactForm />
        <aside className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-[#e9f7f2] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-primary shadow-sm">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-black text-primary">واتساب مباشر</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  اختار الرقم المناسب وسيتم فتح واتساب مباشرة.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {contactNumbers.map((phone) => (
                <a
                  key={phone}
                  className="flex items-center justify-between rounded-lg bg-white px-4 py-3 font-black text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  href={whatsappUrl(phone)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{phone}</span>
                  <span className="inline-flex items-center gap-2 text-sm">
                    راسلنا الآن
                    <PhoneCall className="h-4 w-4" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 text-sm leading-7 text-muted-foreground shadow-sm">
            <p className="font-black text-foreground">متابعة الرسائل</p>
            <p className="mt-2">
              لو أنت مسجل دخول، هتظهر ردود الدعم داخل صفحة الدعم في حسابك. رسائل الزوار تظهر للأدمن
              بنفس البريد المكتوب في النموذج.
            </p>
          </div>
        </aside>
      </Container>
    </>
  );
}
