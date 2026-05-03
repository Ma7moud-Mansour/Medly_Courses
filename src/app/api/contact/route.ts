import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { createContactSupportTicket } from "@/lib/support/repository";
import { contactSchema } from "@/lib/validators/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Contact message is invalid.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const session = await getServerSessionUser();
    const ticket = await createContactSupportTicket({
      ...parsed.data,
      userId: session.isAuthenticated ? session.userId : undefined,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/tickets");

    if (session.isAuthenticated) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/support");
    }

    return NextResponse.json({
      data: {
        ticketId: ticket.id,
        status: ticket.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Message could not be sent.",
      },
      { status: 400 },
    );
  }
}
