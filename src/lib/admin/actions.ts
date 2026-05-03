"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildFeedbackPath, getActionErrorMessage } from "@/lib/actions/server-action-feedback";
import { requireServerRole } from "@/lib/auth/server-session";
import {
  blockUser as blockUserInRepository,
  createAuditLog as createAuditEntry,
  createSupportTicket as createSupportTicketInRepository,
  endImpersonation as endImpersonationInRepository,
  getAdminAnalyticsData,
  listAdminCategoriesSummary,
  getAdminCoursesSummary,
  getAdminDashboardSummary,
  getEffectiveStudentPermissions,
  getStudentById as getStudentRecord,
  grantCourseAccess as grantCourseAccessInRepository,
  listAdminCouponsSummary,
  listAdminInstructorsSummary,
  listAdminReviewsSummary,
  listAdminUsers,
  listAuditLogs,
  listCourseOptions,
  listStudents as listStudentsInRepository,
  listTickets,
  resetStudentProgress as resetStudentProgressInRepository,
  revokeCourseAccess as revokeCourseAccessInRepository,
  searchStudents as searchStudentsInRepository,
  startImpersonation as startImpersonationInRepository,
  unblockUser as unblockUserInRepository,
  updateTicketStatus as updateTicketStatusInRepository,
  updateUserOverrides as updateUserOverridesInRepository,
} from "@/lib/admin/repository";

const STUDENT_OPS_ROLES = ["admin", "support"] as const;
const IMPERSONATION_ROLES = ["admin"] as const;
const idSchema = z.string().min(1);

const grantSchema = z.object({
  userId: idSchema,
  courseId: idSchema,
  expiresAt: z.string().optional(),
});

const revokeSchema = z.object({
  userId: idSchema,
  courseId: idSchema,
});

const overrideSchema = z.object({
  userId: idSchema,
  canTakeExam: z.boolean().nullable(),
  canAccessLive: z.boolean().nullable(),
  canDownloadVideos: z.boolean().nullable(),
  hideAssignments: z.boolean().nullable(),
  hideForum: z.boolean().nullable(),
  customNote: z.string().optional(),
});

const ticketSchema = z.object({
  userId: idSchema,
  title: z.string().min(3),
  issueType: z.enum(["course_access", "payment", "technical", "permissions", "general"]),
  description: z.string().min(5),
  assignedToAdminId: z.string().optional(),
});

const ticketStatusSchema = z.object({
  ticketId: idSchema,
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  resolutionNote: z.string().optional(),
});

const impersonationSchema = z.object({
  targetUserId: idSchema,
});

const searchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["active", "blocked", "suspended", "all"]).optional(),
});

const resetProgressSchema = z.object({
  userId: idSchema,
  courseId: z.string().optional(),
});

async function requireStudentOpsActor() {
  return requireServerRole([...STUDENT_OPS_ROLES]);
}

async function requireImpersonationActor() {
  return requireServerRole([...IMPERSONATION_ROLES]);
}

// Server actions keep permission checks and validation in one place so student-specific
// exceptions always come from centralized backend helpers, not from page components.
export async function getStudentById(id: string) {
  await requireStudentOpsActor();
  return getStudentRecord(id);
}

export async function searchStudents(query?: string, status?: "active" | "blocked" | "suspended" | "all") {
  await requireStudentOpsActor();
  const parsed = searchSchema.parse({ query, status });
  return searchStudentsInRepository(parsed.query, parsed.status);
}

export async function grantCourseAccess(input: z.input<typeof grantSchema>) {
  const actor = await requireStudentOpsActor();
  const parsed = grantSchema.parse(input);

  return grantCourseAccessInRepository({
    adminId: actor.userId,
    userId: parsed.userId,
    courseId: parsed.courseId,
    expiresAt: parsed.expiresAt,
  });
}

export async function revokeCourseAccess(input: z.input<typeof revokeSchema>) {
  const actor = await requireStudentOpsActor();
  const parsed = revokeSchema.parse(input);

  return revokeCourseAccessInRepository({
    adminId: actor.userId,
    userId: parsed.userId,
    courseId: parsed.courseId,
  });
}

export async function updateUserOverrides(input: z.input<typeof overrideSchema>) {
  const actor = await requireStudentOpsActor();
  const parsed = overrideSchema.parse(input);

  return updateUserOverridesInRepository({
    ...parsed,
    updatedByAdminId: actor.userId,
  });
}

export async function blockUser(input: { userId: string }) {
  const actor = await requireStudentOpsActor();
  return blockUserInRepository({ adminId: actor.userId, userId: input.userId });
}

export async function unblockUser(input: { userId: string }) {
  const actor = await requireStudentOpsActor();
  return unblockUserInRepository({ adminId: actor.userId, userId: input.userId });
}

export async function createSupportTicket(input: z.input<typeof ticketSchema>) {
  const actor = await requireStudentOpsActor();
  const parsed = ticketSchema.parse(input);

  return createSupportTicketInRepository({
    adminId: actor.userId,
    userId: parsed.userId,
    title: parsed.title,
    issueType: parsed.issueType,
    description: parsed.description,
    assignedToAdminId: parsed.assignedToAdminId ?? actor.userId,
  });
}

export async function updateTicketStatus(input: z.input<typeof ticketStatusSchema>) {
  const actor = await requireStudentOpsActor();
  const parsed = ticketStatusSchema.parse(input);

  return updateTicketStatusInRepository({
    adminId: actor.userId,
    ticketId: parsed.ticketId,
    status: parsed.status,
    resolutionNote: parsed.resolutionNote,
  });
}

export async function startImpersonation(input: z.input<typeof impersonationSchema>) {
  const actor = await requireImpersonationActor();
  const parsed = impersonationSchema.parse(input);

  return startImpersonationInRepository({
    adminId: actor.userId,
    targetUserId: parsed.targetUserId,
  });
}

export async function endImpersonation(input: z.input<typeof impersonationSchema>) {
  const actor = await requireImpersonationActor();
  const parsed = impersonationSchema.parse(input);

  return endImpersonationInRepository({
    adminId: actor.userId,
    targetUserId: parsed.targetUserId,
  });
}

export async function createAuditLog(input: {
  targetUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const actor = await requireStudentOpsActor();

  return createAuditEntry({
    adminId: actor.userId,
    targetUserId: input.targetUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  });
}

export async function getAdminStudentsPageData(query?: string, status?: "active" | "blocked" | "suspended" | "all") {
  await requireStudentOpsActor();
  return listStudentsInRepository({ query, status });
}

export async function getAdminTicketsPageData(status?: "open" | "in_progress" | "resolved" | "closed" | "all") {
  await requireStudentOpsActor();
  return listTickets({ status });
}

export async function getAdminAuditLogsPageData(targetUserId?: string) {
  await requireStudentOpsActor();
  return listAuditLogs({ targetUserId });
}

export async function getAdminDashboardPageData() {
  await requireStudentOpsActor();
  const [summary, flaggedStudents, tickets, logs] = await Promise.all([
    getAdminDashboardSummary(),
    listStudentsInRepository({ status: "blocked" }),
    listTickets({ status: "open" }),
    listAuditLogs(),
  ]);

  return {
    summary,
    flaggedStudents,
    tickets: tickets.slice(0, 5),
    logs: logs.slice(0, 6),
  };
}

export async function getAdminCoursesPageData() {
  await requireStudentOpsActor();
  return getAdminCoursesSummary();
}

export async function getAdminCategoriesPageData() {
  await requireStudentOpsActor();
  return listAdminCategoriesSummary();
}

export async function getAdminInstructorsPageData() {
  await requireStudentOpsActor();
  return listAdminInstructorsSummary();
}

export async function getAdminReviewsPageData() {
  await requireStudentOpsActor();
  return listAdminReviewsSummary();
}

export async function getAdminCouponsPageData() {
  await requireStudentOpsActor();
  return listAdminCouponsSummary();
}

export async function getAdminUsersPageData() {
  await requireStudentOpsActor();
  return listAdminUsers();
}

export async function getAdminAnalyticsPageData() {
  await requireStudentOpsActor();
  return getAdminAnalyticsData();
}

export async function getStudentPermissions(userId: string, courseId?: string) {
  await requireStudentOpsActor();
  return getEffectiveStudentPermissions(userId, courseId);
}

export async function getCourseOptions() {
  await requireStudentOpsActor();
  return listCourseOptions();
}

export async function performStudentAdminAction(formData: FormData) {
  const intent = String(formData.get("intent") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const redirectBase = studentId ? `/admin/students/${studentId}` : "/admin/students";
  let destination = redirectBase;

  try {
    switch (intent) {
      case "grant-course":
        if (!studentId || !courseId) {
          throw new Error("Choose a student and course before granting access.");
        }
        await grantCourseAccess({ userId: studentId, courseId });
        break;
      case "revoke-course":
        if (!studentId || !courseId) {
          throw new Error("Choose a student and course before revoking access.");
        }
        await revokeCourseAccess({ userId: studentId, courseId });
        break;
      case "block-user":
        if (!studentId) {
          throw new Error("Student record was not provided.");
        }
        await blockUser({ userId: studentId });
        break;
      case "unblock-user":
        if (!studentId) {
          throw new Error("Student record was not provided.");
        }
        await unblockUser({ userId: studentId });
        break;
      case "reset-progress":
        if (!studentId) {
          throw new Error("Student record was not provided.");
        }
        await resetStudentProgress({
          userId: studentId,
          courseId: courseId || undefined,
        });
        break;
      case "start-impersonation":
        if (!studentId) {
          throw new Error("Student record was not provided.");
        }
        await startImpersonation({ targetUserId: studentId });
        break;
      case "end-impersonation":
        if (!studentId) {
          throw new Error("Student record was not provided.");
        }
        await endImpersonation({ targetUserId: studentId });
        break;
      case "update-overrides":
        if (!studentId) {
          throw new Error("Student record was not provided.");
        }
        await updateUserOverrides({
          userId: studentId,
          canTakeExam: formValueToNullableBoolean(formData.get("canTakeExam")),
          canAccessLive: formValueToNullableBoolean(formData.get("canAccessLive")),
          canDownloadVideos: formValueToNullableBoolean(formData.get("canDownloadVideos")),
          hideAssignments: formValueToNullableBoolean(formData.get("hideAssignments")),
          hideForum: formValueToNullableBoolean(formData.get("hideForum")),
          customNote: String(formData.get("customNote") ?? ""),
        });
        break;
      case "open-support-note":
        if (!studentId) {
          throw new Error("Student record was not provided.");
        }
        await createSupportTicket({
          userId: studentId,
          title: String(formData.get("ticketTitle") ?? "Support follow-up"),
          issueType: z
            .enum(["course_access", "payment", "technical", "permissions", "general"])
            .parse(String(formData.get("issueType") ?? "general")),
          description: String(
            formData.get("description") ??
              "A support follow-up note was created from the admin workspace.",
          ),
        });
        break;
      default:
        throw new Error("This admin action is not supported.");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/tickets");
    revalidatePath("/admin/audit-logs");
    destination = buildFeedbackPath(redirectBase, { flash: intent || "updated" });
  } catch (error) {
    destination = buildFeedbackPath(redirectBase, {
      error: getActionErrorMessage(error, "Unable to complete the admin action."),
    });
  }

  redirect(destination);
}

export async function performTicketAdminAction(formData: FormData) {
  const ticketId = String(formData.get("ticketId") ?? "");
  let destination = buildFeedbackPath("/admin/tickets", {
    extras: ticketId ? { ticket: ticketId } : undefined,
  });

  try {
    const status = z
      .enum(["open", "in_progress", "resolved", "closed"])
      .parse(String(formData.get("status") ?? "open"));
    const resolutionNote = String(formData.get("resolutionNote") ?? "");

    await updateTicketStatus({ ticketId, status, resolutionNote });

    revalidatePath("/admin/tickets");
    revalidatePath("/admin/audit-logs");
    destination = buildFeedbackPath("/admin/tickets", {
      flash: "ticket-updated",
      extras: ticketId ? { ticket: ticketId } : undefined,
    });
  } catch (error) {
    destination = buildFeedbackPath("/admin/tickets", {
      error: getActionErrorMessage(error, "Unable to update the ticket."),
      extras: ticketId ? { ticket: ticketId } : undefined,
    });
  }

  redirect(destination);
}

function formValueToNullableBoolean(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "inherit");

  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

async function resetStudentProgress(input: z.input<typeof resetProgressSchema>) {
  const actor = await requireStudentOpsActor();
  const parsed = resetProgressSchema.parse(input);

  return resetStudentProgressInRepository({
    adminId: actor.userId,
    userId: parsed.userId,
    courseId: parsed.courseId,
  });
}
