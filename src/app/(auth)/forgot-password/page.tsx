import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
};

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
