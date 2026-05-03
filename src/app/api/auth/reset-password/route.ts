import { NextResponse } from "next/server";
import { consumePasswordResetChallenge } from "@/lib/auth/email-auth";
import { resetPasswordSchema } from "@/lib/validators/schemas";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the code and your new password correctly.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await consumePasswordResetChallenge(parsed.data);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We couldn't reset the password right now.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
