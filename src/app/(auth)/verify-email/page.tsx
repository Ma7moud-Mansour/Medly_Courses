import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";

export const metadata: Metadata = {
  title: "تأكيد البريد الإلكتروني",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{
    email?: string;
    purpose?: string;
    redirect?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <AuthForm
      mode="verify"
      redirectTo={resolvedSearchParams?.redirect}
      verificationEmail={resolvedSearchParams?.email}
      verificationPurpose={resolvedSearchParams?.purpose === "login" ? "login" : "register"}
    />
  );
}
