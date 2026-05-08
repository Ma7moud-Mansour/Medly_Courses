import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { sendMail } from "@/lib/mail";
import {
  authUserSelect,
  createSessionForUser,
  mapAuthenticatedUser,
  normalizeEmail,
} from "@/lib/auth/auth-service";
import { resolvePostAuthRedirect } from "@/lib/auth/redirects";
import type { SessionRequestMetadata } from "@/lib/auth/auth-service";

export type EmailAuthCodePurpose = "login" | "register" | "password_reset";

type PendingVerificationResult = {
  requiresVerification: true;
  email: string;
  purpose: EmailAuthCodePurpose;
  redirectTo: string;
};

const EMAIL_CODE_EXPIRY_MS = 1000 * 60 * 10;
const EMAIL_CODE_RESEND_COOLDOWN_MS = 1000 * 15;
const EMAIL_CODE_MAX_ATTEMPTS = 5;

function getCodeSecret() {
  const secret = process.env.EMAIL_CODE_SECRET?.trim() || process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "medly-dev-email-code-secret-change-me";
  }

  throw new Error("EMAIL_CODE_SECRET or AUTH_SECRET is required.");
}

function getCodeExpiryDate() {
  return new Date(Date.now() + EMAIL_CODE_EXPIRY_MS);
}

function hashCode(input: {
  email: string;
  purpose: EmailAuthCodePurpose;
  code: string;
}) {
  return createHash("sha256")
    .update(`${getCodeSecret()}:${input.purpose}:${input.email}:${input.code}`)
    .digest("hex");
}

function generateCode() {
  return String(randomInt(100000, 999999));
}

function buildChallengePath(email: string, purpose: EmailAuthCodePurpose, redirectTo?: string) {
  const params = new URLSearchParams({ email });

  if (redirectTo) {
    params.set("redirect", redirectTo);
  }

  if (purpose === "password_reset") {
    return `/reset-password?${params.toString()}`;
  }

  params.set("purpose", purpose);
  return `/verify-email?${params.toString()}`;
}

function getPurposeCopy(purpose: EmailAuthCodePurpose) {
  if (purpose === "register") {
    return {
      subject: "Medly account verification code",
      title: "Use this code to finish creating your Medly account",
      textPrefix: "Medly account verification code",
    };
  }

  if (purpose === "password_reset") {
    return {
      subject: "Medly password reset code",
      title: "Use this code to reset your Medly password",
      textPrefix: "Medly password reset code",
    };
  }

  return {
    subject: "Medly login verification code",
    title: "Use this code to complete your Medly sign in",
    textPrefix: "Medly login verification code",
  };
}

async function sendEmailCode(input: {
  email: string;
  code: string;
  purpose: EmailAuthCodePurpose;
}) {
  const purposeCopy = getPurposeCopy(input.purpose);
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #0f172a;">
      <h2 style="margin-bottom: 12px;">Medly</h2>
      <p style="margin-bottom: 8px;">${purposeCopy.title}</p>
      <div style="display: inline-block; font-size: 28px; font-weight: 700; letter-spacing: 6px; padding: 12px 18px; border-radius: 12px; background: #e7f5f1; color: #0f766e;">
        ${input.code}
      </div>
      <p style="margin-top: 16px;">This code expires in 10 minutes.</p>
      <p style="color: #64748b;">If you did not request this code, you can ignore this message.</p>
    </div>
  `;
  const text = `${purposeCopy.textPrefix}: ${input.code}. This code expires in 10 minutes.`;

  await sendMail({
    to: input.email,
    subject: purposeCopy.subject,
    html,
    text,
  });
}

async function findActiveChallenge(input: {
  email: string;
  purpose: EmailAuthCodePurpose;
}) {
  return prisma.emailAuthCode.findFirst({
    where: {
      email: input.email,
      purpose: input.purpose,
      consumedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function validateChallengeCode(input: {
  email: string;
  code: string;
  purpose: EmailAuthCodePurpose;
}) {
  const email = normalizeEmail(input.email);
  const challenge = await findActiveChallenge({
    email,
    purpose: input.purpose,
  });

  if (!challenge || challenge.expiresAt <= new Date()) {
    throw new Error("The verification code has expired. Please request a new one.");
  }

  const isCodeValid =
    challenge.codeHash ===
    hashCode({
      email,
      purpose: input.purpose,
      code: input.code.trim(),
    });

  if (!isCodeValid) {
    const attempts = challenge.attemptCount + 1;
    await prisma.emailAuthCode.update({
      where: { id: challenge.id },
      data: {
        attemptCount: attempts,
        consumedAt: attempts >= EMAIL_CODE_MAX_ATTEMPTS ? new Date() : undefined,
      },
    });

    throw new Error(
      attempts >= EMAIL_CODE_MAX_ATTEMPTS
        ? "Too many incorrect attempts. Request a new code."
        : "The verification code is incorrect.",
    );
  }

  return {
    email,
    challenge,
  };
}

export async function createEmailCodeChallenge(input: {
  email: string;
  purpose: EmailAuthCodePurpose;
  redirectTo?: string;
  userId?: string;
  pendingName?: string;
  pendingPhone?: string;
  pendingPasswordHash?: string;
}) {
  const email = normalizeEmail(input.email);
  const existingRecent = await prisma.emailAuthCode.findFirst({
    where: {
      email,
      purpose: input.purpose,
      consumedAt: null,
      createdAt: {
        gte: new Date(Date.now() - EMAIL_CODE_RESEND_COOLDOWN_MS),
      },
    },
    select: { id: true },
  });

  if (existingRecent) {
    throw new Error("Please wait 15 seconds before requesting another code.");
  }

  await prisma.emailAuthCode.updateMany({
    where: {
      email,
      purpose: input.purpose,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  const code = generateCode();
  const challenge = await prisma.emailAuthCode.create({
    data: {
      email,
      purpose: input.purpose,
      codeHash: hashCode({
        email,
        purpose: input.purpose,
        code,
      }),
      userId: input.userId,
      pendingName: input.pendingName,
      pendingPhone: input.pendingPhone,
      pendingPasswordHash: input.pendingPasswordHash,
      redirectTo: input.redirectTo,
      expiresAt: getCodeExpiryDate(),
    },
  });

  try {
    await sendEmailCode({
      email,
      code,
      purpose: input.purpose,
    });
  } catch (error) {
    await prisma.emailAuthCode.delete({
      where: { id: challenge.id },
    });
    throw error;
  }

  return {
    requiresVerification: true,
    email,
    purpose: input.purpose,
    redirectTo: buildChallengePath(email, input.purpose, input.redirectTo),
  } satisfies PendingVerificationResult;
}

export async function resendEmailCodeChallenge(input: {
  email: string;
  purpose: EmailAuthCodePurpose;
}) {
  const email = normalizeEmail(input.email);
  const latestChallenge = await findActiveChallenge({
    email,
    purpose: input.purpose,
  });

  if (!latestChallenge) {
    throw new Error("No pending verification was found for this email.");
  }

  return createEmailCodeChallenge({
    email,
    purpose: input.purpose,
    redirectTo: latestChallenge.redirectTo ?? undefined,
    userId: latestChallenge.userId ?? undefined,
    pendingName: latestChallenge.pendingName ?? undefined,
    pendingPhone: latestChallenge.pendingPhone ?? undefined,
    pendingPasswordHash: latestChallenge.pendingPasswordHash ?? undefined,
  });
}

export async function consumeEmailCodeChallenge(input: {
  email: string;
  code: string;
  purpose: Extract<EmailAuthCodePurpose, "login" | "register">;
  requestMeta?: SessionRequestMetadata;
}) {
  const { email, challenge } = await validateChallengeCode(input);

  let user =
    challenge.userId
      ? await prisma.user.findUnique({
          where: { id: challenge.userId },
          select: authUserSelect,
        })
      : null;

  if (input.purpose === "register") {
    if (!challenge.pendingName || !challenge.pendingPasswordHash) {
      throw new Error("The registration request is incomplete. Please register again.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    user = await prisma.user.create({
      data: {
        name: challenge.pendingName,
        email,
        passwordHash: challenge.pendingPasswordHash,
        role: "student",
        status: "active",
        phone: challenge.pendingPhone || undefined,
        emailVerified: true,
        lastLoginAt: new Date(),
        studentProfile: {
          create: {
            phone: challenge.pendingPhone || undefined,
          },
        },
      },
      select: authUserSelect,
    });
  } else {
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
        select: authUserSelect,
      });
    }

    if (!user) {
      throw new Error("This account no longer exists.");
    }

    if (user.status !== "active") {
      throw new Error("This account is currently blocked or suspended.");
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        lastLoginAt: new Date(),
      },
      select: authUserSelect,
    });
  }

  if (!user) {
    throw new Error("This account could not be loaded.");
  }

  await prisma.emailAuthCode.updateMany({
    where: {
      email,
      purpose: input.purpose,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  const { token, expiresAt } = await createSessionForUser(user, input.requestMeta);
  const redirectTo = resolvePostAuthRedirect(user.role, challenge.redirectTo);

  return {
    token,
    expiresAt,
    redirectTo,
    user: mapAuthenticatedUser(user),
  };
}

export async function requestPasswordResetChallenge(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
    },
  });

  if (!user) {
    return {
      requiresVerification: true,
      email: normalizedEmail,
      purpose: "password_reset" as const,
      redirectTo: buildChallengePath(normalizedEmail, "password_reset"),
    };
  }

  return createEmailCodeChallenge({
    email: normalizedEmail,
    purpose: "password_reset",
    userId: user.id,
  });
}

export async function consumePasswordResetChallenge(input: {
  email: string;
  code: string;
  password: string;
}) {
  const { email } = await validateChallengeCode({
    email: input.email,
    code: input.code,
    purpose: "password_reset",
  });

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error("This account no longer exists.");
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true,
      },
    }),
    prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    prisma.emailAuthCode.updateMany({
      where: {
        email,
        purpose: "password_reset",
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    }),
  ]);

  return {
    email,
    redirectTo: `/login?email=${encodeURIComponent(email)}`,
    message: "Your password has been updated. Sign in with your new password.",
  };
}
