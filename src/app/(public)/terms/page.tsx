import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
};

export default function TermsPage() {
  return (
    <>
      <PageHeader title="الشروط والأحكام" subtitle="بنود تشغيلية أولية للاستخدام وشراء الكورسات." />
      <Container className="prose prose-neutral max-w-4xl py-10 leading-8">
        <p>استخدام المنصة مخصص للتعلم والمراجعة ولا يغني عن التدريب العملي أو الرجوع للمراجع الرسمية.</p>
        <p>الوصول للكورسات يرتبط بشراء كل كورس منفصلًا وحالة الدفع وصلاحية الحساب.</p>
        <p>بعد الدفع يظهر الكورس داخل حساب الطالب في صفحة كورساتي.</p>
      </Container>
    </>
  );
}
