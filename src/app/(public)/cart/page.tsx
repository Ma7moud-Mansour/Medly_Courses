import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "السلة",
};

export default function CartPage() {
  return (
    <>
      <PageHeader
        eyebrow="السلة"
        title="راجع الكورسات والكوبون قبل الدفع"
        subtitle="المنطق يمنع تكرار نفس الكورس ويحسب السعر النهائي بعد الخصم."
      />
      <Container className="py-10">
        <CartPageClient />
      </Container>
    </>
  );
}
