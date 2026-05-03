"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailCodeSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResendEmailCodeInput,
  type ResetPasswordInput,
  type VerifyEmailCodeInput,
} from "@/lib/validators/schemas";
import { useAuthStore } from "@/store/useAuthStore";

type AuthMode = "login" | "register" | "forgot" | "reset" | "verify";

type AuthFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  code: string;
  rememberMe?: boolean;
};

const copy = {
  login: {
    title: "تسجيل الدخول",
    subtitle: "أدخل بريدك الإلكتروني وكلمة المرور.",
    submit: "تسجيل الدخول",
  },
  register: {
    title: "إنشاء حساب جديد",
    subtitle: "أدخل بياناتك أولًا، ثم فعّل بريدك الإلكتروني بكود يصل إلى Gmail لإكمال الحساب.",
    submit: "إرسال كود التفعيل",
  },
  forgot: {
    title: "نسيت كلمة المرور",
    subtitle: "أدخل بريدك الإلكتروني وسنرسل لك كود استعادة لتعيين كلمة مرور جديدة.",
    submit: "إرسال كود الاستعادة",
  },
  reset: {
    title: "تعيين كلمة مرور جديدة",
    subtitle: "أدخل الكود الذي وصلك على Gmail، ثم اكتب كلمة المرور الجديدة.",
    submit: "حفظ كلمة المرور الجديدة",
    resend: "إعادة إرسال كود الاستعادة",
  },
  verify: {
    title: "تأكيد البريد الإلكتروني",
    subtitle: "أدخل الكود المكوّن من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني.",
    submit: "تأكيد الكود والدخول",
    resend: "إعادة إرسال الكود",
  },
} as const;

export function AuthForm({
  mode,
  redirectTo,
  verificationEmail,
  verificationPurpose = "register",
}: {
  mode: AuthMode;
  redirectTo?: string;
  verificationEmail?: string;
  verificationPurpose?: "login" | "register";
}) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const registerUser = useAuthStore((state) => state.register);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const verifyEmailCode = useAuthStore((state) => state.verifyEmailCode);
  const resendEmailCode = useAuthStore((state) => state.resendEmailCode);
  const resendPasswordResetCode = useAuthStore((state) => state.resendPasswordResetCode);
  const [message, setMessage] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const schema = useMemo(() => {
    switch (mode) {
      case "register":
        return registerSchema;
      case "forgot":
        return forgotPasswordSchema;
      case "reset":
        return resetPasswordSchema;
      case "verify":
        return verifyEmailCodeSchema.omit({ purpose: true });
      default:
        return loginSchema;
    }
  }, [mode]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<AuthFormValues>,
    defaultValues: {
      name: "",
      email: verificationEmail ?? "",
      phone: "",
      password: "",
      confirmPassword: "",
      code: "",
    },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      setSubmitError(undefined);
      setMessage(undefined);
      setNeedsVerification(false);

      try {
        if (mode === "login") {
          const response = await login({
            ...(values as LoginInput),
            redirectTo,
          });

          if ("requiresVerification" in response) {
            router.push(response.redirectTo);
            router.refresh();
            return;
          }

          router.push(response.redirectTo);
          router.refresh();
          return;
        }

        if (mode === "register") {
          const response = await registerUser({
            ...(values as RegisterInput),
            redirectTo,
          });

          if ("requiresVerification" in response) {
            router.push(response.redirectTo);
            router.refresh();
            return;
          }

          router.push(response.redirectTo);
          router.refresh();
          return;
        }

        if (mode === "forgot") {
          const response = await forgotPassword({
            email: values.email,
          } satisfies ForgotPasswordInput);

          router.push(response.redirectTo);
          router.refresh();
          return;
        }

        if (mode === "verify") {
          const response = await verifyEmailCode({
            email: values.email,
            code: values.code,
            purpose: verificationPurpose,
          } satisfies VerifyEmailCodeInput);

          router.push(response.redirectTo);
          router.refresh();
          return;
        }

        const response = await resetPassword({
          email: values.email,
          code: values.code,
          password: values.password,
          confirmPassword: values.confirmPassword,
        } satisfies ResetPasswordInput);

        setMessage(response.message ?? "تم تحديث كلمة المرور بنجاح.");
        window.setTimeout(() => {
          router.push(response.redirectTo);
          router.refresh();
        }, 1200);
      } catch (error) {
        if ((error as any).code === "UNVERIFIED_EMAIL") {
          setNeedsVerification(true);
        }
        setSubmitError(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
      }
    },
    () => {
      setSubmitError("راجع البيانات المطلوبة ثم جرّب مرة أخرى.");
      setMessage(undefined);
      setNeedsVerification(false);
    },
  );

  async function handleResendCode() {
    setSubmitError(undefined);
    setMessage(undefined);
    setNeedsVerification(false);
    setIsResending(true);

    try {
      const email = getValues("email") || verificationEmail || "";

      if (!email) {
        throw new Error("أدخل البريد الإلكتروني أولًا.");
      }

      if (mode === "reset") {
        const response = await resendPasswordResetCode({ email });
        setMessage(response.message ?? "أرسلنا كود استعادة جديد إلى بريدك الإلكتروني.");
      } else {
        const response = await resendEmailCode({
          email,
          purpose: verificationPurpose,
        } satisfies ResendEmailCodeInput);
        setMessage(response.message ?? "أرسلنا كودًا جديدًا إلى بريدك الإلكتروني.");
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "تعذر إعادة إرسال الكود الآن.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleResendLoginVerification() {
    setSubmitError(undefined);
    setMessage(undefined);
    setIsResending(true);

    try {
      const values = getValues();
      const response = await login({
        ...(values as LoginInput),
        resendCode: true,
        redirectTo,
      });

      if ("requiresVerification" in response) {
        router.push(response.redirectTo);
        router.refresh();
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "تعذر إرسال كود التحقق.");
    } finally {
      setIsResending(false);
    }
  }

  const showEmailHint = mode === "verify" || mode === "reset";
  const canResendCode = mode === "verify" || mode === "reset";

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
      <div className="mb-6">
        <h1 className="text-3xl font-black">{copy[mode].title}</h1>
        <p className="mt-2 leading-7 text-muted-foreground">{copy[mode].subtitle}</p>
      </div>

      {showEmailHint ? (
        <div className="mb-5 rounded-lg border border-[color:rgba(15,118,110,0.16)] bg-[color:rgba(15,118,110,0.05)] p-4 text-sm leading-7 text-[#16524c]">
          <div className="flex items-center gap-2 font-bold">
            {mode === "reset" ? (
              <KeyRound className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {mode === "reset" ? "استعادة كلمة المرور" : "تأكيد البريد مطلوب"}
          </div>
          <p className="mt-2">
            {mode === "reset"
              ? "أرسلنا كود الاستعادة إلى:"
              : "أرسلنا كود التحقق إلى:"}
            <span className="ms-2 font-bold text-foreground">
              {verificationEmail || getValues("email") || "البريد الذي أدخلته"}
            </span>
          </p>
        </div>
      ) : null}

      <form className="grid gap-4" onSubmit={onSubmit}>
        {mode === "register" ? (
          <Field label="الاسم" error={errors.name?.message as string | undefined}>
            <input {...register("name")} className="form-input" placeholder="اسم الطالب" />
          </Field>
        ) : null}

        <Field label="البريد الإلكتروني" error={errors.email?.message as string | undefined}>
          <input
            {...register("email")}
            className="form-input"
            dir="ltr"
            inputMode="email"
            placeholder="student@gmail.com"
            readOnly={showEmailHint && Boolean(verificationEmail)}
          />
        </Field>

        {mode === "register" ? (
          <Field label="الهاتف" error={errors.phone?.message as string | undefined}>
            <input {...register("phone")} className="form-input" placeholder="010..." />
          </Field>
        ) : null}

        {mode === "verify" || mode === "reset" ? (
          <Field
            label={mode === "reset" ? "كود الاستعادة" : "كود التحقق"}
            error={errors.code?.message as string | undefined}
          >
            <input
              {...register("code")}
              className="form-input text-center text-lg tracking-[0.35em]"
              dir="ltr"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
            />
          </Field>
        ) : null}

        {mode === "login" || mode === "register" || mode === "reset" ? (
          <Field label="كلمة المرور" error={errors.password?.message as string | undefined}>
            <input
              {...register("password")}
              className="form-input"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Field>
        ) : null}

        {mode === "login" ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input
              {...register("rememberMe")}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-[#0f766e] focus:ring-[#0f766e]"
            />
            تذكرني (30 يوم)
          </label>
        ) : null}

        {mode === "register" || mode === "reset" ? (
          <Field
            label="تأكيد كلمة المرور"
            error={errors.confirmPassword?.message as string | undefined}
          >
            <input
              {...register("confirmPassword")}
              className="form-input"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
        ) : null}

        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : mode === "verify" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : mode === "reset" ? (
            <KeyRound className="h-4 w-4" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {isSubmitting ? "جارٍ التنفيذ..." : copy[mode].submit}
        </Button>
      </form>

      {canResendCode ? (
        <button
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0f766e] transition hover:text-[#0c615a] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isResending}
          onClick={handleResendCode}
          type="button"
        >
          {isResending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          {isResending
            ? "جارٍ إعادة الإرسال..."
            : mode === "reset"
              ? copy.reset.resend
              : copy.verify.resend}
        </button>
      ) : null}

      {submitError ? (
        <div className="mt-4 rounded-lg border border-[#efd6d6] bg-[#fff6f6] p-4 text-[#b44343]">
          <p className="text-sm font-bold">{submitError}</p>
          {needsVerification ? (
            <button
              className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#0f766e] transition hover:text-[#0c615a] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isResending}
              onClick={handleResendLoginVerification}
              type="button"
            >
              {isResending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              {isResending ? "جارٍ الإرسال..." : "إعادة إرسال كود التحقق"}
            </button>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-lg bg-[#e9f8dd] p-3 text-sm font-bold text-[#44750f]">{message}</p>
      ) : null}

      <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
        {mode === "login" ? <Link href="/forgot-password">نسيت كلمة المرور؟</Link> : null}
        {mode === "login" ? <Link href="/register">ليس لديك حساب؟ سجّل الآن</Link> : null}
        {mode === "register" ? <Link href="/login">لديك حساب بالفعل؟ دخول</Link> : null}
        {mode === "verify" ? <Link href="/login">العودة إلى صفحة الدخول</Link> : null}
        {mode === "forgot" || mode === "reset" ? <Link href="/login">العودة إلى الدخول</Link> : null}
      </div>
    </div>
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
