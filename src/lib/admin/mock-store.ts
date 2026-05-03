import { courses, enrollments as seededEnrollments, users as seededUsers } from "@/data/medly";
import type {
  AuditLog,
  EffectiveStudentPermissions,
  Enrollment,
  ImpersonationSession,
  StudentProfile,
  SupportTicket,
  SupportTicketIssueType,
  SupportTicketStatus,
  User,
  UserOverride,
  UserStatus,
} from "@/types";

// This mock repository mirrors the Prisma-backed admin shape so the dashboard,
// permissions helper, and server actions can be wired now and swapped to DB calls later.
function iso(offsetDays = 0) {
  const date = new Date("2026-04-21T10:00:00.000Z");
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const baseUsers: User[] = [
  ...seededUsers.map((user, index) => ({
    ...user,
    status: "active" as UserStatus,
    updatedAt: iso(index),
    lastLoginAt: iso(index - 1),
  })),
  {
    id: "support-1",
    name: "فريق الدعم",
    email: "support@medly.app",
    role: "support",
    status: "active",
    emailVerified: true,
    createdAt: iso(-14),
    updatedAt: iso(-1),
    lastLoginAt: iso(0),
  },
  {
    id: "user-2",
    name: "مروان حسام",
    email: "marwan@student.medly.app",
    role: "student",
    status: "active",
    emailVerified: true,
    createdAt: iso(-20),
    updatedAt: iso(-2),
    lastLoginAt: iso(-1),
    phone: "01011112222",
  },
];

const adminUsers = [...baseUsers];

const studentProfiles: StudentProfile[] = [
  {
    id: "profile-user-1",
    userId: "user-1",
    phone: "01003797694",
    university: "جامعة القاهرة",
    academicYear: "السنة الثالثة",
  },
  {
    id: "profile-user-2",
    userId: "user-2",
    phone: "01011112222",
    university: "جامعة عين شمس",
    academicYear: "السنة الثانية",
  },
];

let adminEnrollments: Enrollment[] = seededEnrollments.map((enrollment, index) => ({
  ...enrollment,
  accessStatus: "active",
  startedAt: iso(-(index + 10)),
  expiresAt: index % 3 === 0 ? iso(30 + index) : undefined,
  openedByAdminId: "admin-1",
}));

adminEnrollments.push({
  id: "enroll-user2-course1",
  userId: "user-2",
  courseId: courses[0]?.id ?? "course-1",
  progress: 12,
  completed: false,
  accessStatus: "revoked",
  startedAt: iso(-18),
  expiresAt: iso(20),
  openedByAdminId: "admin-1",
});

let userOverrides: UserOverride[] = [
  {
    id: "override-user-1",
    userId: "user-1",
    canTakeExam: true,
    canAccessLive: true,
    canDownloadVideos: false,
    hideAssignments: false,
    hideForum: true,
    customNote: "تم إخفاء المنتدى لهذا الطالب مؤقتًا لحين إغلاق البلاغ.",
    updatedByAdminId: "admin-1",
    updatedAt: iso(-1),
  },
  {
    id: "override-user-2",
    userId: "user-2",
    canTakeExam: null,
    canAccessLive: false,
    canDownloadVideos: false,
    hideAssignments: null,
    hideForum: null,
    customNote: "صلاحية البث المباشر معلقة لحين تفعيل الدفعة.",
    updatedByAdminId: "support-1",
    updatedAt: iso(-2),
  },
];

let supportTickets: SupportTicket[] = [
  {
    id: "ticket-1",
    userId: "user-1",
    title: "الكورس لا يظهر داخل حسابي",
    issueType: "course_access",
    description: "تم الدفع لكن مادة القلب لا تظهر في صفحة كورساتي.",
    status: "resolved",
    assignedToAdminId: "support-1",
    resolutionNote: "تم تفعيل الكورس يدويًا وإبلاغ الطالبة.",
    createdAt: iso(-5),
    updatedAt: iso(-4),
  },
  {
    id: "ticket-2",
    userId: "user-2",
    title: "أحتاج إلغاء إخفاء المنتدى",
    issueType: "permissions",
    description: "الطالب لا يرى المنتدى ويريد متابعة النقاشات.",
    status: "in_progress",
    assignedToAdminId: "support-1",
    createdAt: iso(-2),
    updatedAt: iso(-1),
  },
];

let auditLogs: AuditLog[] = [
  {
    id: "audit-1",
    adminId: "admin-1",
    targetUserId: "user-1",
    action: "grant_course_access",
    entityType: "Enrollment",
    entityId: adminEnrollments[0]?.id ?? "enroll-1",
    metadata: { courseId: adminEnrollments[0]?.courseId },
    createdAt: iso(-6),
  },
  {
    id: "audit-2",
    adminId: "support-1",
    targetUserId: "user-1",
    action: "update_user_override",
    entityType: "UserOverride",
    entityId: "override-user-1",
    metadata: { hideForum: true },
    createdAt: iso(-2),
  },
  {
    id: "audit-3",
    adminId: "support-1",
    targetUserId: "user-2",
    action: "update_ticket_status",
    entityType: "SupportTicket",
    entityId: "ticket-2",
    metadata: { status: "in_progress" },
    createdAt: iso(-1),
  },
];

let impersonationSessions: ImpersonationSession[] = [
  {
    id: "imp-1",
    adminId: "admin-1",
    targetUserId: "user-1",
    startedAt: iso(-8),
    endedAt: iso(-8),
    isActive: false,
  },
];

export const globalPermissionDefaults = {
  canTakeExam: true,
  canAccessLive: true,
  canDownloadVideos: false,
  hideAssignments: false,
  hideForum: false,
};

export function listAdminUsers() {
  return [...adminUsers];
}

export function listStudents(filters?: { query?: string; status?: UserStatus | "all" }) {
  const query = filters?.query?.trim().toLowerCase() ?? "";
  const status = filters?.status;

  return adminUsers
    .filter((user) => user.role === "student")
    .filter((user) => {
      const matchesQuery =
        !query || [user.name, user.email, user.phone].filter(Boolean).join(" ").toLowerCase().includes(query);
      const matchesStatus = !status || status === "all" || user.status === status;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export function searchStudents(query?: string, status?: UserStatus | "all") {
  return listStudents({ query, status });
}

export function getUserById(userId: string) {
  return adminUsers.find((user) => user.id === userId);
}

export function getStudentProfile(userId: string) {
  return studentProfiles.find((profile) => profile.userId === userId);
}

export function getStudentOverride(userId: string) {
  return userOverrides.find((override) => override.userId === userId);
}

export function getStudentEnrollments(userId: string) {
  return adminEnrollments
    .filter((enrollment) => enrollment.userId === userId)
    .map((enrollment) => ({
      ...enrollment,
      course: courses.find((course) => course.id === enrollment.courseId),
      openedByAdmin: enrollment.openedByAdminId ? getUserById(enrollment.openedByAdminId) : undefined,
    }));
}

export function getStudentTickets(userId: string) {
  return supportTickets
    .filter((ticket) => ticket.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getStudentAuditLogs(userId: string) {
  return auditLogs
    .filter((log) => log.targetUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getStudentById(userId: string) {
  const user = getUserById(userId);

  if (!user || user.role !== "student") {
    return undefined;
  }

  return {
    user,
    profile: getStudentProfile(userId),
    enrollments: getStudentEnrollments(userId),
    overrides: getStudentOverride(userId),
    tickets: getStudentTickets(userId),
    auditLogs: getStudentAuditLogs(userId),
    activeImpersonation: impersonationSessions.find(
      (session) => session.targetUserId === userId && session.isActive,
    ),
  };
}

export function listTickets(filters?: {
  status?: SupportTicketStatus | "all";
  issueType?: SupportTicketIssueType | "all";
}) {
  return supportTickets
    .filter((ticket) => !filters?.status || filters.status === "all" || ticket.status === filters.status)
    .filter(
      (ticket) =>
        !filters?.issueType || filters.issueType === "all" || ticket.issueType === filters.issueType,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((ticket) => ({
      ...ticket,
      user: ticket.userId ? getUserById(ticket.userId) : undefined,
      assignee: ticket.assignedToAdminId ? getUserById(ticket.assignedToAdminId) : undefined,
    }));
}

export function listAuditLogs(filters?: { targetUserId?: string; adminId?: string }) {
  return auditLogs
    .filter((log) => !filters?.targetUserId || log.targetUserId === filters.targetUserId)
    .filter((log) => !filters?.adminId || log.adminId === filters.adminId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((log) => ({
      ...log,
      admin: getUserById(log.adminId),
      targetUser: log.targetUserId ? getUserById(log.targetUserId) : undefined,
    }));
}

export function getAdminCoursesSummary() {
  return courses.map((course) => ({
    ...course,
    activeStudents: adminEnrollments.filter(
      (enrollment) => enrollment.courseId === course.id && enrollment.accessStatus === "active",
    ).length,
    revokedStudents: adminEnrollments.filter(
      (enrollment) => enrollment.courseId === course.id && enrollment.accessStatus === "revoked",
    ).length,
  }));
}

export function getAdminDashboardSummary() {
  const students = adminUsers.filter((user) => user.role === "student");

  return {
    totalStudents: students.length,
    activeStudents: students.filter((user) => user.status === "active").length,
    blockedStudents: students.filter((user) => user.status === "blocked").length,
    suspendedStudents: students.filter((user) => user.status === "suspended").length,
    openTickets: supportTickets.filter((ticket) => ticket.status === "open").length,
    inProgressTickets: supportTickets.filter((ticket) => ticket.status === "in_progress").length,
    activeImpersonations: impersonationSessions.filter((session) => session.isActive).length,
    overrideCount: userOverrides.length,
    auditCount: auditLogs.length,
  };
}

export function createAuditLog(input: Omit<AuditLog, "id" | "createdAt">) {
  const entry: AuditLog = {
    id: createId("audit"),
    createdAt: new Date().toISOString(),
    ...input,
  };

  auditLogs = [entry, ...auditLogs];
  return entry;
}

export function grantCourseAccess(input: {
  adminId: string;
  userId: string;
  courseId: string;
  expiresAt?: string;
}) {
  const existing = adminEnrollments.find(
    (enrollment) => enrollment.userId === input.userId && enrollment.courseId === input.courseId,
  );

  if (existing) {
    existing.accessStatus = "active";
    existing.expiresAt = input.expiresAt;
    existing.openedByAdminId = input.adminId;
    existing.startedAt = existing.startedAt ?? new Date().toISOString();
  } else {
    adminEnrollments = [
      {
        id: createId("enroll"),
        userId: input.userId,
        courseId: input.courseId,
        progress: 0,
        completed: false,
        accessStatus: "active",
        startedAt: new Date().toISOString(),
        expiresAt: input.expiresAt,
        openedByAdminId: input.adminId,
      },
      ...adminEnrollments,
    ];
  }

  return createAuditLog({
    adminId: input.adminId,
    targetUserId: input.userId,
    action: "grant_course_access",
    entityType: "Enrollment",
    entityId: existing?.id ?? adminEnrollments[0]!.id,
    metadata: { courseId: input.courseId, expiresAt: input.expiresAt },
  });
}

export function revokeCourseAccess(input: { adminId: string; userId: string; courseId: string }) {
  const existing = adminEnrollments.find(
    (enrollment) => enrollment.userId === input.userId && enrollment.courseId === input.courseId,
  );

  if (!existing) {
    return undefined;
  }

  existing.accessStatus = "revoked";
  existing.expiresAt = existing.expiresAt ?? new Date().toISOString();

  return createAuditLog({
    adminId: input.adminId,
    targetUserId: input.userId,
    action: "revoke_course_access",
    entityType: "Enrollment",
    entityId: existing.id,
    metadata: { courseId: input.courseId },
  });
}

export function updateUserOverrides(
  input: Omit<UserOverride, "id" | "updatedAt"> & { updatedAt?: string },
) {
  const existing = userOverrides.find((override) => override.userId === input.userId);

  if (existing) {
    Object.assign(existing, {
      ...input,
      updatedAt: new Date().toISOString(),
    });
  } else {
    userOverrides = [
      {
        id: createId("override"),
        ...input,
        updatedAt: new Date().toISOString(),
      },
      ...userOverrides,
    ];
  }

  const next = getStudentOverride(input.userId)!;

  createAuditLog({
    adminId: input.updatedByAdminId,
    targetUserId: input.userId,
    action: "update_user_override",
    entityType: "UserOverride",
    entityId: next.id,
    metadata: {
      canTakeExam: next.canTakeExam,
      canAccessLive: next.canAccessLive,
      canDownloadVideos: next.canDownloadVideos,
      hideAssignments: next.hideAssignments,
      hideForum: next.hideForum,
    },
  });

  return next;
}

export function blockUser(input: { adminId: string; userId: string }) {
  const user = getUserById(input.userId);
  if (!user) return undefined;
  user.status = "blocked";
  user.updatedAt = new Date().toISOString();

  return createAuditLog({
    adminId: input.adminId,
    targetUserId: input.userId,
    action: "block_user",
    entityType: "User",
    entityId: user.id,
    metadata: { status: "blocked" },
  });
}

export function unblockUser(input: { adminId: string; userId: string }) {
  const user = getUserById(input.userId);
  if (!user) return undefined;
  user.status = "active";
  user.updatedAt = new Date().toISOString();

  return createAuditLog({
    adminId: input.adminId,
    targetUserId: input.userId,
    action: "unblock_user",
    entityType: "User",
    entityId: user.id,
    metadata: { status: "active" },
  });
}

export function createSupportTicket(input: {
  adminId: string;
  userId: string;
  title: string;
  issueType: SupportTicketIssueType;
  description: string;
  assignedToAdminId?: string;
}) {
  const ticket: SupportTicket = {
    id: createId("ticket"),
    userId: input.userId,
    title: input.title,
    issueType: input.issueType,
    description: input.description,
    status: "open",
    assignedToAdminId: input.assignedToAdminId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  supportTickets = [ticket, ...supportTickets];

  createAuditLog({
    adminId: input.adminId,
    targetUserId: input.userId,
    action: "create_support_ticket",
    entityType: "SupportTicket",
    entityId: ticket.id,
    metadata: { issueType: input.issueType },
  });

  return ticket;
}

export function updateTicketStatus(input: {
  adminId: string;
  ticketId: string;
  status: SupportTicketStatus;
  resolutionNote?: string;
}) {
  const ticket = supportTickets.find((entry) => entry.id === input.ticketId);
  if (!ticket) return undefined;

  ticket.status = input.status;
  ticket.updatedAt = new Date().toISOString();
  ticket.assignedToAdminId = input.adminId;
  if (input.resolutionNote) {
    ticket.resolutionNote = input.resolutionNote;
  }

  createAuditLog({
    adminId: input.adminId,
    targetUserId: ticket.userId,
    action: "update_ticket_status",
    entityType: "SupportTicket",
    entityId: ticket.id,
    metadata: { status: input.status },
  });

  return ticket;
}

export function startImpersonation(input: { adminId: string; targetUserId: string }) {
  impersonationSessions = impersonationSessions.map((session) =>
    session.adminId === input.adminId && session.isActive
      ? { ...session, isActive: false, endedAt: new Date().toISOString() }
      : session,
  );

  const session: ImpersonationSession = {
    id: createId("imp"),
    adminId: input.adminId,
    targetUserId: input.targetUserId,
    startedAt: new Date().toISOString(),
    isActive: true,
  };

  impersonationSessions = [session, ...impersonationSessions];

  createAuditLog({
    adminId: input.adminId,
    targetUserId: input.targetUserId,
    action: "start_impersonation",
    entityType: "ImpersonationSession",
    entityId: session.id,
    metadata: { isActive: true },
  });

  return session;
}

export function endImpersonation(input: { adminId: string; targetUserId?: string }) {
  const session = impersonationSessions.find(
    (entry) =>
      entry.adminId === input.adminId &&
      entry.isActive &&
      (!input.targetUserId || entry.targetUserId === input.targetUserId),
  );

  if (!session) return undefined;

  session.isActive = false;
  session.endedAt = new Date().toISOString();

  createAuditLog({
    adminId: input.adminId,
    targetUserId: session.targetUserId,
    action: "end_impersonation",
    entityType: "ImpersonationSession",
    entityId: session.id,
    metadata: { isActive: false },
  });

  return session;
}

export function resetStudentProgress(input: { adminId: string; userId: string; courseId?: string }) {
  adminEnrollments = adminEnrollments.map((enrollment) =>
    enrollment.userId === input.userId && (!input.courseId || enrollment.courseId === input.courseId)
      ? { ...enrollment, progress: 0, completed: false, lastLessonId: undefined }
      : enrollment,
  );

  return createAuditLog({
    adminId: input.adminId,
    targetUserId: input.userId,
    action: "reset_progress",
    entityType: "Enrollment",
    entityId: input.courseId ?? input.userId,
    metadata: { courseId: input.courseId ?? "all" },
  });
}

export function getCourseAvailability(courseId: string) {
  const course = courses.find((entry) => entry.id === courseId);
  return Boolean(course && course.isPublished !== false);
}

export function getEffectiveStudentPermissions(userId: string, courseId?: string): EffectiveStudentPermissions {
  const user = getUserById(userId);
  const override = getStudentOverride(userId);
  const enrollment = courseId
    ? adminEnrollments.find((entry) => entry.userId === userId && entry.courseId === courseId)
    : undefined;
  const coursePublished = courseId ? getCourseAvailability(courseId) : true;
  const accessStatus = enrollment?.accessStatus ?? "inactive";

  const canAccessPortal = user?.status === "active";
  const canAccessCourse =
    canAccessPortal && (!courseId || (accessStatus === "active" && coursePublished));

  return {
    canAccessPortal,
    canAccessCourse,
    canTakeExam: override?.canTakeExam ?? globalPermissionDefaults.canTakeExam,
    canAccessLive: override?.canAccessLive ?? globalPermissionDefaults.canAccessLive,
    canDownloadVideos:
      override?.canDownloadVideos ?? globalPermissionDefaults.canDownloadVideos,
    hideAssignments: override?.hideAssignments ?? globalPermissionDefaults.hideAssignments,
    hideForum: override?.hideForum ?? globalPermissionDefaults.hideForum,
    status: user?.status ?? "blocked",
    accessStatus,
    coursePublished,
    customNote: override?.customNote,
  };
}

export function canStudentAccessCourse(userId: string, courseId: string) {
  return getEffectiveStudentPermissions(userId, courseId).canAccessCourse;
}

export function getStudentPortalSnapshot(userId: string) {
  const enrollments = getStudentEnrollments(userId).map((item) => ({
    ...item,
    permissions: item.course ? getEffectiveStudentPermissions(userId, item.course.id) : undefined,
  }));

  return {
    user: getUserById(userId),
    profile: getStudentProfile(userId),
    enrollments,
    overrides: getStudentOverride(userId),
  };
}
