import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="سياسة الخصوصية" subtitle="صياغة أولية قابلة للمراجعة القانونية قبل الإطلاق." />
      <Container className="prose prose-neutral max-w-4xl py-10 leading-8">
        <p>نحفظ بيانات الحساب والتقدم والفواتير لتحسين تجربة التعلم وتقديم الخدمات المطلوبة.</p>
        <p>لا يتم تخزين بيانات الدفع الحساسة داخل Medly، ويتم تمريرها إلى بوابة دفع آمنة عند الربط الإنتاجي.</p>
        <p>يمكن للطالب طلب تصحيح بياناته أو حذف الحساب وفق القواعد التشغيلية والقانونية.</p>
      </Container>
    </>
  );
}
