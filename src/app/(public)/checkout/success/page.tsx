import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Submitted",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const paymentCode = first(params.code);

  return (
    <Container className="grid min-h-[60vh] place-items-center py-16">
      <div className="max-w-xl rounded-lg border border-border bg-surface p-8 text-center shadow-xl">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-3xl font-black">Payment request submitted</h1>
        <p className="mt-3 leading-8 text-muted-foreground">
          Medly received your Vodafone Cash receipt. The course will become available after a manual admin review.
        </p>

        {paymentCode ? (
          <div className="mx-auto mt-5 max-w-sm rounded-lg border border-[#cfe3de] bg-[#eef8f5] p-4 text-start">
            <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Medly payment code</p>
            <input className="form-input mt-2 bg-white font-black text-primary" readOnly value={paymentCode} />
            <p className="mt-2 text-xs font-bold text-muted-foreground">
              Keep this code for support or payment follow-up.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className={buttonVariants()} href="/dashboard/billing">
            View payment status
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/courses">
            Browse more courses
          </Link>
        </div>
      </div>
    </Container>
  );
}
