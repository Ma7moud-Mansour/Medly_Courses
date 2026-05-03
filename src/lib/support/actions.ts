"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildFeedbackPath, getActionErrorMessage } from "@/lib/actions/server-action-feedback";
import { requireServerRole, requireServerSession } from "@/lib/auth/server-session";
import {
  createStudentSupportTicket,
  replyToStudentSupportTicket,
  replyToSupportTicketAsAdmin,
  updateSupportTicketStatus,
} from "@/lib/support/repository";
import { supportTicketCreateSchema, supportTicketReplySchema } from "@/lib/validators/schemas";

export async function performStudentSupportAction(formData: FormData) {
  const session = await requireServerSession();
  const intent = String(formData.get("intent") ?? "");
  let destination = "/dashboard/support";

  try {
    if (intent === "create-ticket") {
      const parsed = supportTicketCreateSchema.parse({
        title: formData.get("title"),
        issueType: formData.get("issueType"),
        message: formData.get("message"),
      });

      const ticket = await createStudentSupportTicket({
        userId: session.userId,
        title: parsed.title,
        issueType: parsed.issueType,
        message: parsed.message,
      });

      revalidatePath("/dashboard/support");
      revalidatePath("/dashboard");
      destination = buildFeedbackPath("/dashboard/support", {
        flash: "created",
        extras: { ticket: ticket.id },
      });
    }

    if (intent === "reply-ticket") {
      const parsed = supportTicketReplySchema.parse({
        ticketId: formData.get("ticketId"),
        message: formData.get("message"),
      });

      await replyToStudentSupportTicket({
        userId: session.userId,
        ticketId: parsed.ticketId,
        message: parsed.message,
      });

      revalidatePath("/dashboard/support");
      revalidatePath("/dashboard/notifications");
      destination = buildFeedbackPath("/dashboard/support", {
        flash: "replied",
        extras: { ticket: parsed.ticketId },
      });
    }
  } catch (error) {
    const ticketId = String(formData.get("ticketId") ?? "");
    destination = buildFeedbackPath("/dashboard/support", {
      error: getActionErrorMessage(error, "Unable to send the support message."),
      extras: ticketId ? { ticket: ticketId } : undefined,
    });
  }

  redirect(destination);
}

export async function performAdminSupportAction(formData: FormData) {
  const session = await requireServerRole(["admin", "support"]);
  const intent = String(formData.get("intent") ?? "");
  const ticketId = String(formData.get("ticketId") ?? "");
  let destination = buildFeedbackPath("/admin/tickets", {
    extras: ticketId ? { ticket: ticketId } : undefined,
  });

  try {
    if (intent === "reply-ticket") {
      const parsed = supportTicketReplySchema.parse({
        ticketId: formData.get("ticketId"),
        message: formData.get("message"),
        status: formData.get("status") || undefined,
      });

      await replyToSupportTicketAsAdmin({
        adminId: session.userId,
        ticketId: parsed.ticketId,
        message: parsed.message,
        status: parsed.status,
      });

      revalidatePath("/admin/tickets");
      revalidatePath("/dashboard/support");
      revalidatePath("/dashboard/notifications");
      destination = buildFeedbackPath("/admin/tickets", {
        flash: "replied",
        extras: { ticket: parsed.ticketId },
      });
    }

    if (intent === "status-ticket") {
      const parsed = supportTicketReplySchema.pick({ ticketId: true, status: true }).parse({
        ticketId: formData.get("ticketId"),
        status: formData.get("status") || undefined,
      });

      await updateSupportTicketStatus({
        adminId: session.userId,
        ticketId: parsed.ticketId,
        status: parsed.status ?? "open",
        resolutionNote: String(formData.get("resolutionNote") ?? ""),
      });

      revalidatePath("/admin/tickets");
      revalidatePath("/dashboard/support");
      revalidatePath("/dashboard/notifications");
      destination = buildFeedbackPath("/admin/tickets", {
        flash: "status",
        extras: { ticket: parsed.ticketId },
      });
    }
  } catch (error) {
    destination = buildFeedbackPath("/admin/tickets", {
      error: getActionErrorMessage(error, "Unable to update the support ticket."),
      extras: ticketId ? { ticket: ticketId } : undefined,
    });
  }

  redirect(destination);
}
