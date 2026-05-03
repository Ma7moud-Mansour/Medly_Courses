import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";

export const metadata: Metadata = {
  title: "تعيين كلمة المرور",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{
    email?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;

  return <AuthForm mode="reset" verificationEmail={resolvedSearchParams?.email} />;
}
