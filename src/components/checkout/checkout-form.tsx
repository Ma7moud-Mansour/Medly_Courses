"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Landmark, LockKeyhole, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/schemas";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

type CheckoutInstructions = {
  canSubmit: boolean;
  message: string;
  generatedCodeLabel: string;
  recipient?: {
    instructorId: string;
    instructorName: string;
    vodafoneCashNumber?: string;
    courseTitles: string[];
    total: number;
  };
  recipients: Array<{
    instructorId: string;
    instructorName: string;
    vodafoneCashNumber?: string;
    courseTitles: string[];
    total: number;
  }>;
  total: number;
  courseTitles: string[];
};

export function CheckoutForm() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const fallbackTotal = useCartStore((state) => state.getTotal());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string>();
  const [instructions, setInstructions] = useState<CheckoutInstructions>();
  const [instructionsLoading, setInstructionsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "vodafone_cash",
      transactionReference: "",
      senderPhone: "",
    },
  });

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.replace("/login?redirect=/checkout");
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    let canceled = false;

    async function loadInstructions() {
      if (!initialized || !isAuthenticated || !items.length) {
        setInstructions(undefined);
        return;
      }

      setInstructionsLoading(true);

      const response = await fetch("/api/checkout/instructions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseIds: items.map((item) => item.courseId),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!canceled) {
        setInstructions(payload?.data);
        setInstructionsLoading(false);
      }
    }

    loadInstructions();

    return () => {
      canceled = true;
    };
  }, [initialized, isAuthenticated, items]);

  const onSubmit = handleSubmit(async (values) => {
    if (!items.length) {
      setServerError("Your cart is empty.");
      return;
    }

    if (!instructions?.canSubmit) {
      setServerError(instructions?.message ?? "Payment instructions are not ready yet.");
      return;
    }

    if (!receiptFile) {
      setServerError("Upload the payment receipt before submitting.");
      return;
    }

    setServerError(undefined);

    const formData = new FormData();
    formData.append("paymentMethod", values.paymentMethod);

    if (values.transactionReference) {
      formData.append("transactionReference", values.transactionReference);
    }

    if (values.senderPhone) {
      formData.append("senderPhone", values.senderPhone);
    }

    items.forEach((item) => {
      formData.append("courseId", item.courseId);
    });

    formData.append("receipt", receiptFile);

    const response = await fetch("/api/checkout/create-order", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setServerError(payload?.error ?? "The payment request could not be submitted.");
      return;
    }

    clearCart();
    const code = payload?.data?.internalPaymentCode ? `&code=${encodeURIComponent(payload.data.internalPaymentCode)}` : "";
    router.push(`/checkout/success?order=${payload?.data?.orderId ?? ""}${code}`);
  });

  if (initialized && !isAuthenticated) {
    return (
      <div className="grid gap-4 rounded-lg border border-[#e8eeec] bg-white p-6">
        <div className="rounded-lg border border-[#e6dcc4] bg-[#fbf8ef] p-4 text-sm font-bold text-[#8a6a2f]">
          <LockKeyhole className="mb-2 h-5 w-5" />
          You need to log in before submitting a payment request. Medly will return you to checkout automatically.
        </div>
      </div>
    );
  }

  const totalToDisplay = instructions?.total ?? fallbackTotal;

  return (
    <form className="grid gap-5 rounded-lg border border-[#e8eeec] bg-white p-6" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-black">Vodafone Cash payment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Medly creates the tracking code automatically. Send to the instructor number, then upload the receipt.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-[#e6ecea] bg-[#f7fbfa] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#0e5f5c] text-white">
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="grid gap-1">
            <p className="font-black">Send money to</p>
            {instructionsLoading ? (
              <p className="text-sm font-bold text-muted-foreground">Loading instructor payment number...</p>
            ) : instructions?.recipient ? (
              <>
                <p className="text-lg font-black text-primary">{instructions.recipient.vodafoneCashNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {instructions.recipient.instructorName} - {instructions.message}
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-muted-foreground">
                {instructions?.message ?? "Add courses to the cart to see payment instructions."}
              </p>
            )}
          </div>
        </div>

        {instructions && instructions.recipients.length > 0 && !instructions.canSubmit ? (
          <div className="grid gap-2 rounded-lg border border-[#e6dcc4] bg-[#fbf8ef] p-3 text-sm">
            {instructions.recipients.map((recipient) => (
              <div key={`${recipient.instructorId}-${recipient.vodafoneCashNumber ?? "missing"}`}>
                <p className="font-black text-[#8a6a2f]">
                  {recipient.instructorName}: {recipient.vodafoneCashNumber ?? "No Vodafone Cash number"}
                </p>
                <p className="text-[#8a6a2f]/80">{recipient.courseTitles.join(", ")}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <p className="font-black text-foreground">Current account</p>
            <p>{user?.email || "Signed-in Medly account"}</p>
          </div>
          <div>
            <p className="font-black text-foreground">Exact amount to send</p>
            <p className="text-lg font-black text-primary">{formatCurrency(totalToDisplay)}</p>
          </div>
        </div>
      </div>

      <input type="hidden" value="vodafone_cash" {...register("paymentMethod")} />

      <Field label="Medly payment code">
        <input className="form-input bg-muted/25 font-black text-primary" readOnly value={instructions?.generatedCodeLabel ?? "Generated automatically after submission"} />
      </Field>

      <Field label="Vodafone transaction reference (optional)" error={errors.transactionReference?.message}>
        <input className="form-input" {...register("transactionReference")} placeholder="Optional transfer reference from Vodafone Cash" />
      </Field>

      <Field label="Sender phone (optional)" error={errors.senderPhone?.message}>
        <input className="form-input" {...register("senderPhone")} placeholder="Phone used in Vodafone Cash transfer" />
      </Field>

      <div className="grid gap-3 rounded-lg border border-border bg-[#fbfcfc] p-4">
        <div>
          <p className="text-sm font-black">Receipt upload</p>
          <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, WEBP, or PDF.</p>
        </div>

        <input
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
          type="file"
        />

        <Button onClick={() => fileInputRef.current?.click()} type="button" variant="outline">
          <ImagePlus className="h-4 w-4" />
          {receiptFile ? "Replace receipt" : "Upload receipt"}
        </Button>

        {receiptFile ? (
          <p className="text-sm font-bold text-muted-foreground">
            {receiptFile.name} - {(receiptFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        ) : (
          <p className="text-sm font-bold text-muted-foreground">No receipt uploaded yet.</p>
        )}
      </div>

      {serverError || (instructions && !instructions.canSubmit && items.length) ? (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-bold text-danger">
          {serverError ?? instructions?.message}
        </div>
      ) : null}

      <Button disabled={isSubmitting || !items.length || !instructions?.canSubmit} type="submit">
        <Landmark className="h-4 w-4" />
        {isSubmitting ? "Submitting request..." : "Submit for manual review"}
      </Button>

      {!items.length ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm font-bold text-muted-foreground">
          Add one or more courses to the cart before starting a payment request.
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
