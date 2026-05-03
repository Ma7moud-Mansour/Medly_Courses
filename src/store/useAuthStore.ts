"use client";

import { create } from "zustand";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendEmailCodeInput,
  ResetPasswordInput,
  VerifyEmailCodeInput,
} from "@/lib/validators/schemas";
import type { User } from "@/types";

type AuthPayload = {
  user: User;
  redirectTo: string;
};

type PasswordResetFlowPayload = {
  email: string;
  redirectTo: string;
  message?: string;
};

export type PendingVerificationPayload = {
  requiresVerification: true;
  email: string;
  purpose: "login" | "register";
  redirectTo: string;
  message?: string;
};

type AuthFlowPayload = AuthPayload | PendingVerificationPayload;

type AuthState = {
  user?: User;
  isAuthenticated: boolean;
  initialized: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (input: LoginInput & { redirectTo?: string; resendCode?: boolean }) => Promise<AuthFlowPayload>;
  register: (input: RegisterInput & { redirectTo?: string }) => Promise<AuthFlowPayload>;
  forgotPassword: (input: ForgotPasswordInput) => Promise<PasswordResetFlowPayload>;
  resetPassword: (input: ResetPasswordInput) => Promise<PasswordResetFlowPayload>;
  verifyEmailCode: (input: VerifyEmailCodeInput) => Promise<AuthPayload>;
  resendEmailCode: (input: ResendEmailCodeInput) => Promise<PendingVerificationPayload>;
  resendPasswordResetCode: (input: ForgotPasswordInput) => Promise<PasswordResetFlowPayload>;
  logout: () => Promise<void>;
};

async function parseResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string; code?: string }
    | null;

  if (!response.ok || !payload?.data) {
    const err = new Error(payload?.error ?? "Something went wrong. Please try again.");
    if (payload?.code) {
      (err as any).code = payload.code;
    }
    throw err;
  }

  return payload.data;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: undefined,
  isAuthenticated: false,
  initialized: false,
  isLoading: false,
  initialize: async () => {
    if (get().initialized || get().isLoading) {
      return;
    }

    set({ isLoading: true });

    try {
      const response = await fetch("/api/me", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        set({
          user: undefined,
          isAuthenticated: false,
          initialized: true,
          isLoading: false,
        });
        return;
      }

      const payload = await parseResponse<User>(response);

      set({
        user: payload,
        isAuthenticated: true,
        initialized: true,
        isLoading: false,
      });
    } catch {
      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });
    }
  },
  login: async ({ redirectTo, resendCode, ...input }) => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...input, redirectTo, resendCode }),
      });
      const payload = await parseResponse<AuthFlowPayload>(response);

      if ("requiresVerification" in payload) {
        set({
          user: undefined,
          isAuthenticated: false,
          initialized: true,
          isLoading: false,
        });

        return payload;
      }

      set({
        user: payload.user,
        isAuthenticated: true,
        initialized: true,
        isLoading: false,
      });

      return payload;
    } catch (error) {
      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });
      throw error;
    }
  },
  register: async ({ redirectTo, ...input }) => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...input, redirectTo }),
      });
      const payload = await parseResponse<AuthFlowPayload>(response);

      if ("requiresVerification" in payload) {
        set({
          user: undefined,
          isAuthenticated: false,
          initialized: true,
          isLoading: false,
        });

        return payload;
      }

      set({
        user: payload.user,
        isAuthenticated: true,
        initialized: true,
        isLoading: false,
      });

      return payload;
    } catch (error) {
      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });
      throw error;
    }
  },
  forgotPassword: async (input) => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      });
      const payload = await parseResponse<PasswordResetFlowPayload>(response);

      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });

      return payload;
    } catch (error) {
      set({
        isLoading: false,
      });
      throw error;
    }
  },
  resetPassword: async (input) => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      });
      const payload = await parseResponse<PasswordResetFlowPayload>(response);

      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });

      return payload;
    } catch (error) {
      set({
        isLoading: false,
      });
      throw error;
    }
  },
  verifyEmailCode: async (input) => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          intent: "verify",
          ...input,
        }),
      });
      const payload = await parseResponse<AuthPayload>(response);

      set({
        user: payload.user,
        isAuthenticated: true,
        initialized: true,
        isLoading: false,
      });

      return payload;
    } catch (error) {
      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });
      throw error;
    }
  },
  resendEmailCode: async (input) => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          intent: "resend",
          ...input,
        }),
      });
      const payload = await parseResponse<PendingVerificationPayload>(response);

      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });

      return payload;
    } catch (error) {
      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });
      throw error;
    }
  },
  resendPasswordResetCode: async (input) => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...input,
          intent: "resend",
        }),
      });
      const payload = await parseResponse<PasswordResetFlowPayload>(response);

      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });

      return payload;
    } catch (error) {
      set({
        isLoading: false,
      });
      throw error;
    }
  },
  logout: async () => {
    set({ isLoading: true });

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      set({
        user: undefined,
        isAuthenticated: false,
        initialized: true,
        isLoading: false,
      });
    }
  },
}));
