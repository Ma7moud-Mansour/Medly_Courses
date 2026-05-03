import Link from "next/link";
import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Failed",
};

export default function CheckoutFailedPage() {
  return (
    <Container className="grid min-h-[60vh] place-items-center py-16">
      <div className="max-w-xl rounded-lg border border-border bg-surface p-8 text-center shadow-xl">
        <XCircle className="mx-auto h-14 w-14 text-danger" />
        <h1 className="mt-4 text-3xl font-black">Payment request failed</h1>
        <p className="mt-3 leading-8 text-muted-foreground">
          Medly could not save your manual Vodafone Cash request. Your cart remains intact so you can try again.
        </p>
        <Link className={buttonVariants({ className: "mt-6" })} href="/checkout">
          Try checkout again
        </Link>
      </div>
    </Container>
  );
}
