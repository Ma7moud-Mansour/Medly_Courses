import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/auth-form";
import { resolvePostAuthRedirect } from "@/lib/auth/redirects";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "دخول",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string; email?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSessionUser();

  if (session.isAuthenticated && session.role) {
    redirect(resolvePostAuthRedirect(session.role, resolvedSearchParams?.redirect));
  }

  return (
    <AuthForm
      mode="login"
      redirectTo={resolvedSearchParams?.redirect}
      verificationEmail={resolvedSearchParams?.email}
    />
  );
}
