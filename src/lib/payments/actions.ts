"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildFeedbackPath, getActionErrorMessage } from "@/lib/actions/server-action-feedback";
import { requireServerRole } from "@/lib/auth/server-session";
import { reviewVodafoneCashOrder } from "@/lib/payments/repository";
import { adminPaymentReviewSchema } from "@/lib/validators/schemas";

export async function performAdminPaymentReviewAction(formData: FormData) {
  const session = await requireServerRole(["admin", "support"]);
  let destination = "/admin/payments";

  try {
    const parsed = adminPaymentReviewSchema.parse({
      orderId: formData.get("orderId"),
      decision: formData.get("decision"),
      rejectionReason: formData.get("rejectionReason") ?? "",
    });

    await reviewVodafoneCashOrder({
      adminId: session.userId,
      orderId: parsed.orderId,
      decision: parsed.decision,
      rejectionReason: parsed.rejectionReason || undefined,
    });

    revalidatePath("/admin/payments");
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    destination = buildFeedbackPath("/admin/payments", {
      flash: parsed.decision === "approve" ? "approved" : "rejected",
    });
  } catch (error) {
    destination = buildFeedbackPath("/admin/payments", {
      error: getActionErrorMessage(error, "Unable to review this payment request right now."),
    });
  }

  redirect(destination);
}
