import type { Metadata } from "next";
import { CartSummary } from "@/components/cart/cart-summary";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Manual Vodafone Cash review"
        subtitle="Medly generates the tracking code automatically. Send to the course instructor's Vodafone Cash number, then upload the receipt."
      />
      <Container className="grid gap-6 py-10 lg:grid-cols-[1fr_360px]">
        <CheckoutForm />
        <CartSummary checkout={false} />
      </Container>
    </>
  );
}
