import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveInstructorAvatar } from "@/lib/instructors/avatar";
import { resolveStoredAssetUrl } from "@/lib/storage";
import type {
  AuditLog,
  Category,
  Coupon,
  Course,
  EffectiveStudentPermissions,
  Enrollment,
  Instructor,
  Review,
  StudentProfile,
  SupportTicket,
  User,
  UserOverride,
  UserStatus,
} from "@/types";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  status: string;
  phone: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

type CourseRecord = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  thumbnail: string;
  isPublished: boolean;
  previewVideo: string | null;
  price: number;
  discountPrice: number | null;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  durationHours: number;
  lessonsCount: number;
  level: string;
  language: string;
  lastUpdated: Date | null;
  featured: boolean;
  bestseller: boolean;
  examPrep: boolean;
  categoryId: string;
  instructorId: string;
};

type AuditLogRecord = {
  id: string;
  adminId: string;
  targetUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
  admin?: UserRecord | null;
  targetUser?: UserRecord | null;
};

type TicketRecord = {
  id: string;
  userId: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  title: string;
  issueType: string;
  description: string;
  status: string;
  assignedToAdminId: string | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: UserRecord | null;
  assignedToAdmin?: UserRecord | null;
};

type OverrideRecord = {
  id: string;
  userId: string;
  canTakeExam: boolean | null;
  canAccessLive: boolean | null;
  canDownloadVideos: boolean | null;
  hideAssignments: boolean | null;
  hideForum: boolean | null;
  customNote: string | null;
  updatedByAdminId: string;
  updatedAt: Date;
};

type StudentDetailsRecord = UserRecord & {
  studentProfile: {
    id: string;
    userId: string;
    phone: string | null;
    university: string | null;
    academicYear: string | null;
  } | null;
  userOverride: OverrideRecord | null;
  enrollments: Array<
    {
      id: string;
      userId: string;
      courseId: string;
      accessStatus: string;
      progress: number;
      completed: boolean;
      lastLessonId: string | null;
      startedAt: Date;
      expiresAt: Date | null;
      openedByAdminId: string | null;
    } & {
      course: CourseRecord;
      openedByAdmin: UserRecord | null;
    }
  >;
  createdSupportTickets: TicketRecord[];
  targetedAuditLogs: AuditLogRecord[];
  targetImpersonations: Array<{
    id: string;
    adminId: string;
    targetUserId: string;
    startedAt: Date;
    endedAt: Date | null;
    isActive: boolean;
  }>;
};

export const globalPermissionDefaults = {
  canTakeExam: true,
  canAccessLive: true,
  canDownloadVideos: false,
  hideAssignments: false,
  hideForum: false,
};

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function toMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function toInputJson(value?: Record<string, unknown>) {
  return value as Prisma.InputJsonValue | undefined;
}

function mapUser(user: UserRecord, phoneFallback?: string | null): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? undefined,
    role: user.role as User["role"],
    status: user.status as UserStatus,
    phone: user.phone ?? phoneFallback ?? undefined,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: toIso(user.lastLoginAt),
  };
}

function mapCourse(course: CourseRecord): Course {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle ?? undefined,
    description: course.description,
    thumbnail: resolveStoredAssetUrl({ url: course.thumbnail }) ?? course.thumbnail,
    isPublished: course.isPublished,
    previewVideo: course.previewVideo ?? undefined,
    price: course.price,
    discountPrice: course.discountPrice ?? undefined,
    rating: course.rating,
    reviewsCount: course.reviewsCount,
    studentsCount: course.studentsCount,
    durationHours: course.durationHours,
    lessonsCount: course.lessonsCount,
    level: course.level as Course["level"],
    language: course.language,
    lastUpdated: toIso(course.lastUpdated),
    featured: course.featured,
    bestseller: course.bestseller,
    examPrep: course.examPrep,
    categoryId: course.categoryId,
    instructorId: course.instructorId,
    tags: [],
    learningOutcomes: [],
    requirements: [],
  };
}

function mapEnrollment(
  enrollment: StudentDetailsRecord["enrollments"][number],
): Enrollment & { course: Course; openedByAdmin?: User } {
  return {
    id: enrollment.id,
    userId: enrollment.userId,
    courseId: enrollment.courseId,
    progress: enrollment.progress,
    completed: enrollment.completed,
    lastLessonId: enrollment.lastLessonId ?? undefined,
    accessStatus: enrollment.accessStatus as Enrollment["accessStatus"],
    startedAt: enrollment.startedAt.toISOString(),
    expiresAt: toIso(enrollment.expiresAt),
    openedByAdminId: enrollment.openedByAdminId ?? undefined,
    course: mapCourse(enrollment.course),
    openedByAdmin: enrollment.openedByAdmin ? mapUser(enrollment.openedByAdmin) : undefined,
  };
}

function mapStudentProfile(profile?: StudentDetailsRecord["studentProfile"]): StudentProfile | undefined {
  if (!profile) {
    return undefined;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    phone: profile.phone ?? undefined,
    university: profile.university ?? undefined,
    academicYear: profile.academicYear ?? undefined,
  };
}

function mapOverride(override?: OverrideRecord | null): UserOverride | undefined {
  if (!override) {
    return undefined;
  }

  return {
    id: override.id,
    userId: override.userId,
    canTakeExam: override.canTakeExam,
    canAccessLive: override.canAccessLive,
    canDownloadVideos: override.canDownloadVideos,
    hideAssignments: override.hideAssignments,
    hideForum: override.hideForum,
    customNote: override.customNote ?? undefined,
    updatedByAdminId: override.updatedByAdminId,
    updatedAt: override.updatedAt.toISOString(),
  };
}

function mapTicket(ticket: TicketRecord): SupportTicket & { user?: User; assignee?: User } {
  return {
    id: ticket.id,
    userId: ticket.userId ?? undefined,
    guestName: ticket.guestName ?? undefined,
    guestEmail: ticket.guestEmail ?? undefined,
    title: ticket.title,
    issueType: ticket.issueType as SupportTicket["issueType"],
    description: ticket.description,
    status: ticket.status as SupportTicket["status"],
    assignedToAdminId: ticket.assignedToAdminId ?? undefined,
    resolutionNote: ticket.resolutionNote ?? undefined,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    user: ticket.user ? mapUser(ticket.user) : undefined,
    assignee: ticket.assignedToAdmin ? mapUser(ticket.assignedToAdmin) : undefined,
  };
}

function mapAuditLog(log: AuditLogRecord): AuditLog & { admin?: User; targetUser?: User } {
  return {
    id: log.id,
    adminId: log.adminId,
    targetUserId: log.targetUserId ?? undefined,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: toMetadata(log.metadata),
    createdAt: log.createdAt.toISOString(),
    admin: log.admin ? mapUser(log.admin) : undefined,
    targetUser: log.targetUser ? mapUser(log.targetUser) : undefined,
  };
}

function mapImpersonationSession(session?: {
  id: string;
  adminId: string;
  targetUserId: string;
  startedAt: Date;
  endedAt: Date | null;
  isActive: boolean;
} | null) {
  if (!session) {
    return undefined;
  }

  return {
    id: session.id,
    adminId: session.adminId,
    targetUserId: session.targetUserId,
    startedAt: session.startedAt.toISOString(),
    endedAt: toIso(session.endedAt),
    isActive: session.isActive,
  };
}

export async function listStudents(filters?: { query?: string; status?: UserStatus | "all" }) {
  const query = filters?.query?.trim();
  const students = await prisma.user.findMany({
    where: {
      role: "student",
      ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
              {
                studentProfile: {
                  is: {
                    phone: { contains: query, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      studentProfile: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return students.map((student) => mapUser(student, student.studentProfile?.phone));
}

export async function searchStudents(query?: string, status?: UserStatus | "all") {
  return listStudents({ query, status });
}

export async function getStudentById(userId: string) {
  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "student",
    },
    include: {
      studentProfile: true,
      userOverride: true,
      enrollments: {
        include: {
          course: true,
          openedByAdmin: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      createdSupportTickets: {
        include: {
          user: true,
          assignedToAdmin: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
      targetedAuditLogs: {
        include: {
          admin: true,
          targetUser: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
      targetImpersonations: {
        where: {
          isActive: true,
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!student) {
    return undefined;
  }

  return {
    user: mapUser(student, student.studentProfile?.phone),
    profile: mapStudentProfile(student.studentProfile),
    enrollments: student.enrollments.map(mapEnrollment),
    overrides: mapOverride(student.userOverride),
    tickets: student.createdSupportTickets.map(mapTicket),
    auditLogs: student.targetedAuditLogs.map(mapAuditLog),
    activeImpersonation: mapImpersonationSession(student.targetImpersonations[0]),
  };
}

export async function listTickets(filters?: {
  status?: SupportTicket["status"] | "all";
  issueType?: SupportTicket["issueType"] | "all";
}) {
  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
      ...(filters?.issueType && filters.issueType !== "all" ? { issueType: filters.issueType } : {}),
    },
    include: {
      user: true,
      assignedToAdmin: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return tickets.map(mapTicket);
}

export async function listAuditLogs(filters?: { targetUserId?: string; adminId?: string }) {
  const logs = await prisma.auditLog.findMany({
    where: {
      ...(filters?.targetUserId ? { targetUserId: filters.targetUserId } : {}),
      ...(filters?.adminId ? { adminId: filters.adminId } : {}),
    },
    include: {
      admin: true,
      targetUser: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return logs.map(mapAuditLog);
}

export async function getAdminCoursesSummary() {
  const courses = await prisma.course.findMany({
    include: {
      category: {
        select: { name: true },
      },
      instructor: {
        select: { name: true },
      },
      enrollments: {
        select: {
          accessStatus: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return courses.map((course) => ({
    ...mapCourse(course),
    categoryName: course.category.name,
    instructorName: course.instructor.name,
    activeStudents: course.enrollments.filter((enrollment) => enrollment.accessStatus === "active").length,
    revokedStudents: course.enrollments.filter((enrollment) => enrollment.accessStatus === "revoked").length,
  }));
}

export async function listCourseOptions() {
  return prisma.course.findMany({
    select: {
      id: true,
      title: true,
      isPublished: true,
    },
    orderBy: {
      title: "asc",
    },
  });
}

export async function getAdminDashboardSummary() {
  const [
    totalStudents,
    activeStudents,
    blockedStudents,
    suspendedStudents,
    openTickets,
    inProgressTickets,
    activeImpersonations,
    overrideCount,
    auditCount,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { role: "student" } }),
    prisma.user.count({ where: { role: "student", status: "active" } }),
    prisma.user.count({ where: { role: "student", status: "blocked" } }),
    prisma.user.count({ where: { role: "student", status: "suspended" } }),
    prisma.supportTicket.count({ where: { status: "open" } }),
    prisma.supportTicket.count({ where: { status: "in_progress" } }),
    prisma.impersonationSession.count({ where: { isActive: true } }),
    prisma.userOverride.count(),
    prisma.auditLog.count(),
  ]);

  return {
    totalStudents,
    activeStudents,
    blockedStudents,
    suspendedStudents,
    openTickets,
    inProgressTickets,
    activeImpersonations,
    overrideCount,
    auditCount,
  };
}

export async function listAdminUsers() {
  const users = await prisma.user.findMany({
    include: {
      studentProfile: true,
      _count: {
        select: {
          enrollments: true,
          createdSupportTickets: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return users.map((user) => ({
    ...mapUser(user, user.studentProfile?.phone),
    university: user.studentProfile?.university ?? undefined,
    academicYear: user.studentProfile?.academicYear ?? undefined,
    enrollmentsCount: user._count.enrollments,
    ticketsCount: user._count.createdSupportTickets,
  }));
}

export async function listAdminCategoriesSummary() {
  const [categories, publishedCounts] = await Promise.all([
    prisma.category.findMany({
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.course.groupBy({
      by: ["categoryId"],
      where: {
        isPublished: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const publishedMap = new Map(publishedCounts.map((item) => [item.categoryId, item._count._all]));

  return categories.map((category) => {
    const totalCourses = category._count.courses;
    const publishedCourses = publishedMap.get(category.id) ?? 0;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      icon: category.icon ?? undefined,
      totalCourses,
      publishedCourses,
      hiddenCourses: Math.max(0, totalCourses - publishedCourses),
    } satisfies Category & {
      totalCourses: number;
      publishedCourses: number;
      hiddenCourses: number;
    };
  });
}

export async function listAdminInstructorsSummary() {
  const instructors = await prisma.instructor.findMany({
    include: {
      courses: {
        select: {
          id: true,
          isPublished: true,
          studentsCount: true,
          rating: true,
          reviewsCount: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return instructors.map((instructor) => {
    const publishedCourses = instructor.courses.filter((course) => course.isPublished);
    const totalStudents = publishedCourses.reduce((sum, course) => sum + course.studentsCount, 0);
    const totalReviews = publishedCourses.reduce((sum, course) => sum + course.reviewsCount, 0);
    const ratingAverage =
      publishedCourses.length > 0
        ? Number(
            (
              publishedCourses.reduce((sum, course) => sum + course.rating, 0) /
              publishedCourses.length
            ).toFixed(1),
          )
        : 0;

    return {
      id: instructor.id,
      name: instructor.name,
      slug: instructor.slug,
      title: instructor.title ?? undefined,
      avatar: resolveInstructorAvatar(instructor.avatar ?? undefined, instructor.slug, instructor.name),
      bio: instructor.bio ?? undefined,
      specialization: instructor.specialization ?? undefined,
      vodafoneCashNumber: instructor.vodafoneCashNumber ?? undefined,
      coursesCount: instructor.courses.length,
      publishedCourses: publishedCourses.length,
      studentsCount: totalStudents,
      reviewsCount: totalReviews,
      ratingAverage,
    } satisfies Instructor & {
      publishedCourses: number;
      reviewsCount: number;
      ratingAverage: number;
    };
  });
}

export async function listAdminReviewsSummary() {
  const reviews = await prisma.review.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          title: true,
          slug: true,
          instructor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    userId: review.userId,
    courseId: review.courseId,
    rating: review.rating,
    comment: review.comment ?? undefined,
    createdAt: review.createdAt.toISOString(),
    userName: review.user.name,
    courseTitle: review.course.title,
    courseSlug: review.course.slug,
    studentEmail: review.user.email,
    instructorName: review.course.instructor.name,
  } satisfies Review & {
    courseTitle: string;
    courseSlug: string;
    studentEmail: string;
    instructorName: string;
  }));
}

export async function deleteAdminReview(input: { adminId: string; reviewId: string }) {
  const deletedReview = await prisma.review.delete({
    where: {
      id: input.reviewId,
    },
    select: {
      id: true,
      courseId: true,
      userId: true,
    },
  });

  const aggregate = await prisma.review.aggregate({
    where: {
      courseId: deletedReview.courseId,
    },
    _count: {
      _all: true,
    },
    _avg: {
      rating: true,
    },
  });

  await prisma.course.update({
    where: {
      id: deletedReview.courseId,
    },
    data: {
      reviewsCount: aggregate._count._all,
      rating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      targetUserId: deletedReview.userId,
      action: "review.deleted",
      entityType: "review",
      entityId: deletedReview.id,
    },
  });
}

export async function listAdminCouponsSummary() {
  const coupons = await prisma.coupon.findMany({
    include: {
      _count: {
        select: {
          usages: true,
        },
      },
    },
    orderBy: [{ active: "desc" }, { code: "asc" }],
  });

  return coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount ?? undefined,
    maxUsage: coupon.maxUsage ?? undefined,
    expiresAt: toIso(coupon.expiresAt),
    active: coupon.active,
    usagesCount: coupon._count.usages,
    usageRemaining:
      coupon.maxUsage != null ? Math.max(coupon.maxUsage - coupon._count.usages, 0) : undefined,
  } satisfies Coupon & {
    usagesCount: number;
    usageRemaining?: number;
  }));
}

function parseCouponExpiry(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Coupon expiry date is invalid.");
  }

  return date;
}

function normalizeCouponCodeInput(code: string) {
  return code.trim().toUpperCase();
}

export async function createAdminCoupon(input: {
  adminId: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUsage?: number;
  expiresAt?: string;
  active: boolean;
}) {
  const coupon = await prisma.coupon.create({
    data: {
      code: normalizeCouponCodeInput(input.code),
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount ?? null,
      maxUsage: input.maxUsage ?? null,
      expiresAt: parseCouponExpiry(input.expiresAt),
      active: input.active,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "coupon.created",
      entityType: "coupon",
      entityId: coupon.id,
    },
  });

  return coupon;
}

export async function updateAdminCoupon(input: {
  adminId: string;
  couponId: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUsage?: number;
  expiresAt?: string;
  active: boolean;
}) {
  const coupon = await prisma.coupon.update({
    where: {
      id: input.couponId,
    },
    data: {
      code: normalizeCouponCodeInput(input.code),
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount ?? null,
      maxUsage: input.maxUsage ?? null,
      expiresAt: parseCouponExpiry(input.expiresAt),
      active: input.active,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "coupon.updated",
      entityType: "coupon",
      entityId: coupon.id,
    },
  });

  return coupon;
}

export async function deleteAdminCoupon(input: { adminId: string; couponId: string }) {
  await prisma.coupon.delete({
    where: {
      id: input.couponId,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "coupon.deleted",
      entityType: "coupon",
      entityId: input.couponId,
    },
  });
}

export async function getAdminAnalyticsData() {
  const now = new Date();
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: new Intl.DateTimeFormat("ar-EG", {
        month: "short",
        year: "2-digit",
      }).format(date),
      date,
    };
  });

  const analyticsWindowStart = monthBuckets[0]?.date ?? new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalStudents,
    totalAdmins,
    totalSupport,
    totalInstructors,
    totalCategories,
    totalCourses,
    publishedCourses,
    totalExams,
    publishedExams,
    totalReviews,
    activeCoupons,
    openTickets,
    waitingPayments,
    approvedRevenueAggregate,
    orders,
    enrollments,
    topCourses,
    instructors,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { role: "student" } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.count({ where: { role: "support" } }),
    prisma.instructor.count(),
    prisma.category.count(),
    prisma.course.count(),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.exam.count(),
    prisma.exam.count({ where: { isPublished: true } }),
    prisma.review.count(),
    prisma.coupon.count({ where: { active: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.order.count({ where: { status: { in: ["pending_payment", "waiting_review"] } } }),
    prisma.order.aggregate({
      where: { status: "approved" },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: {
        status: "approved",
        createdAt: {
          gte: analyticsWindowStart,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
    }),
    prisma.enrollment.findMany({
      where: {
        startedAt: {
          gte: analyticsWindowStart,
        },
      },
      select: {
        startedAt: true,
      },
    }),
    prisma.course.findMany({
      include: {
        category: {
          select: { name: true },
        },
        instructor: {
          select: { name: true },
        },
      },
      orderBy: [{ studentsCount: "desc" }, { rating: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
    prisma.instructor.findMany({
      include: {
        courses: {
          select: {
            isPublished: true,
            studentsCount: true,
            rating: true,
          },
        },
      },
    }),
  ]);

  const revenueMap = new Map(monthBuckets.map((bucket) => [bucket.key, 0]));
  const enrollmentMap = new Map(monthBuckets.map((bucket) => [bucket.key, 0]));

  for (const order of orders) {
    const key = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`;
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + order.total);
  }

  for (const enrollment of enrollments) {
    const key = `${enrollment.startedAt.getFullYear()}-${enrollment.startedAt.getMonth()}`;
    enrollmentMap.set(key, (enrollmentMap.get(key) ?? 0) + 1);
  }

  const revenueSeries = monthBuckets.map((bucket) => ({
    label: bucket.label,
    value: revenueMap.get(bucket.key) ?? 0,
  }));

  const enrollmentSeries = monthBuckets.map((bucket) => ({
    label: bucket.label,
    value: enrollmentMap.get(bucket.key) ?? 0,
  }));

  const topInstructorCards = instructors
    .map((instructor) => {
      const published = instructor.courses.filter((course) => course.isPublished);
      return {
        id: instructor.id,
        name: instructor.name,
        studentsCount: published.reduce((sum, course) => sum + course.studentsCount, 0),
        publishedCourses: published.length,
        ratingAverage:
          published.length > 0
            ? Number(
                (published.reduce((sum, course) => sum + course.rating, 0) / published.length).toFixed(1),
              )
            : 0,
      };
    })
    .sort((left, right) => right.studentsCount - left.studentsCount || right.publishedCourses - left.publishedCourses)
    .slice(0, 5);

  return {
    summary: {
      totalUsers,
      totalStudents,
      totalAdmins,
      totalSupport,
      totalInstructors,
      totalCategories,
      totalCourses,
      publishedCourses,
      draftCourses: Math.max(totalCourses - publishedCourses, 0),
      totalExams,
      publishedExams,
      totalReviews,
      activeCoupons,
      openTickets,
      waitingPayments,
      approvedRevenue: approvedRevenueAggregate._sum.total ?? 0,
    },
    revenueSeries,
    enrollmentSeries,
    topCourses: topCourses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      studentsCount: course.studentsCount,
      rating: course.rating,
      price: course.discountPrice ?? course.price,
      instructorName: course.instructor.name,
      categoryName: course.category.name,
      isPublished: course.isPublished,
    })),
    topInstructors: topInstructorCards,
  };
}

export async function createAuditLog(input: {
  adminId: string;
  targetUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const log = await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      targetUserId: input.targetUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: toInputJson(input.metadata),
    },
    include: {
      admin: true,
      targetUser: true,
    },
  });

  return mapAuditLog(log);
}

export async function grantCourseAccess(input: {
  adminId: string;
  userId: string;
  courseId: string;
  expiresAt?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },
      update: {
        accessStatus: "active",
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        openedByAdminId: input.adminId,
      },
      create: {
        userId: input.userId,
        courseId: input.courseId,
        accessStatus: "active",
        progress: 0,
        completed: false,
        startedAt: new Date(),
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        openedByAdminId: input.adminId,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "grant_course_access",
        entityType: "Enrollment",
        entityId: enrollment.id,
        metadata: {
          courseId: input.courseId,
          expiresAt: input.expiresAt,
        } as Prisma.InputJsonValue,
      },
    });

    return enrollment;
  });
}

export async function revokeCourseAccess(input: { adminId: string; userId: string; courseId: string }) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },
    });

    if (!existing) {
      return undefined;
    }

    const enrollment = await tx.enrollment.update({
      where: {
        id: existing.id,
      },
      data: {
        accessStatus: "revoked",
        expiresAt: existing.expiresAt ?? new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "revoke_course_access",
        entityType: "Enrollment",
        entityId: enrollment.id,
        metadata: {
          courseId: input.courseId,
        } as Prisma.InputJsonValue,
      },
    });

    return enrollment;
  });
}

export async function updateUserOverrides(input: {
  userId: string;
  canTakeExam: boolean | null;
  canAccessLive: boolean | null;
  canDownloadVideos: boolean | null;
  hideAssignments: boolean | null;
  hideForum: boolean | null;
  customNote?: string;
  updatedByAdminId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const override = await tx.userOverride.upsert({
      where: {
        userId: input.userId,
      },
      update: {
        canTakeExam: input.canTakeExam,
        canAccessLive: input.canAccessLive,
        canDownloadVideos: input.canDownloadVideos,
        hideAssignments: input.hideAssignments,
        hideForum: input.hideForum,
        customNote: input.customNote || null,
        updatedByAdminId: input.updatedByAdminId,
      },
      create: {
        userId: input.userId,
        canTakeExam: input.canTakeExam,
        canAccessLive: input.canAccessLive,
        canDownloadVideos: input.canDownloadVideos,
        hideAssignments: input.hideAssignments,
        hideForum: input.hideForum,
        customNote: input.customNote || null,
        updatedByAdminId: input.updatedByAdminId,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.updatedByAdminId,
        targetUserId: input.userId,
        action: "update_user_override",
        entityType: "UserOverride",
        entityId: override.id,
        metadata: {
          canTakeExam: override.canTakeExam,
          canAccessLive: override.canAccessLive,
          canDownloadVideos: override.canDownloadVideos,
          hideAssignments: override.hideAssignments,
          hideForum: override.hideForum,
        } as Prisma.InputJsonValue,
      },
    });

    return mapOverride(override);
  });
}

export async function blockUser(input: { adminId: string; userId: string }) {
  return prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: { userId: input.userId },
    });

    const user = await tx.user.update({
      where: { id: input.userId },
      data: {
        status: "blocked",
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "block_user",
        entityType: "User",
        entityId: user.id,
        metadata: { status: "blocked" } as Prisma.InputJsonValue,
      },
    });

    return mapUser(user);
  });
}

export async function unblockUser(input: { adminId: string; userId: string }) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: input.userId },
      data: {
        status: "active",
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "unblock_user",
        entityType: "User",
        entityId: user.id,
        metadata: { status: "active" } as Prisma.InputJsonValue,
      },
    });

    return mapUser(user);
  });
}

export async function createSupportTicket(input: {
  adminId: string;
  userId: string;
  title: string;
  issueType: SupportTicket["issueType"];
  description: string;
  assignedToAdminId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        userId: input.userId,
        title: input.title,
        issueType: input.issueType,
        description: input.description,
        status: "open",
        assignedToAdminId: input.assignedToAdminId ?? input.adminId,
      },
      include: {
        user: true,
        assignedToAdmin: true,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "create_support_ticket",
        entityType: "SupportTicket",
        entityId: ticket.id,
        metadata: {
          issueType: input.issueType,
        } as Prisma.InputJsonValue,
      },
    });

    return mapTicket(ticket);
  });
}

export async function updateTicketStatus(input: {
  adminId: string;
  ticketId: string;
  status: SupportTicket["status"];
  resolutionNote?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.update({
      where: {
        id: input.ticketId,
      },
      data: {
        status: input.status,
        resolutionNote: input.resolutionNote || null,
        assignedToAdminId: input.adminId,
      },
      include: {
        user: true,
        assignedToAdmin: true,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: ticket.userId,
        action: "update_ticket_status",
        entityType: "SupportTicket",
        entityId: ticket.id,
        metadata: {
          status: input.status,
        } as Prisma.InputJsonValue,
      },
    });

    return mapTicket(ticket);
  });
}

export async function startImpersonation(input: { adminId: string; targetUserId: string }) {
  return prisma.$transaction(async (tx) => {
    await tx.impersonationSession.updateMany({
      where: {
        adminId: input.adminId,
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    const session = await tx.impersonationSession.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.targetUserId,
        isActive: true,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.targetUserId,
        action: "start_impersonation",
        entityType: "ImpersonationSession",
        entityId: session.id,
        metadata: { isActive: true } as Prisma.InputJsonValue,
      },
    });

    return mapImpersonationSession(session);
  });
}

export async function endImpersonation(input: { adminId: string; targetUserId?: string }) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.impersonationSession.findFirst({
      where: {
        adminId: input.adminId,
        isActive: true,
        ...(input.targetUserId ? { targetUserId: input.targetUserId } : {}),
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    if (!session) {
      return undefined;
    }

    const endedSession = await tx.impersonationSession.update({
      where: {
        id: session.id,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: endedSession.targetUserId,
        action: "end_impersonation",
        entityType: "ImpersonationSession",
        entityId: endedSession.id,
        metadata: { isActive: false } as Prisma.InputJsonValue,
      },
    });

    return mapImpersonationSession(endedSession);
  });
}

export async function resetStudentProgress(input: { adminId: string; userId: string; courseId?: string }) {
  return prisma.$transaction(async (tx) => {
    await tx.enrollment.updateMany({
      where: {
        userId: input.userId,
        ...(input.courseId ? { courseId: input.courseId } : {}),
      },
      data: {
        progress: 0,
        completed: false,
        lastLessonId: null,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "reset_progress",
        entityType: "Enrollment",
        entityId: input.courseId ?? input.userId,
        metadata: {
          courseId: input.courseId ?? "all",
        } as Prisma.InputJsonValue,
      },
    });
  });
}

export async function getCourseAvailability(courseId: string) {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      isPublished: true,
    },
  });

  return Boolean(course?.isPublished);
}

export async function getEffectiveStudentPermissions(
  userId: string,
  courseId?: string,
): Promise<EffectiveStudentPermissions> {
  const userPromise = prisma.user.findUnique({
    where: { id: userId },
    select: {
      status: true,
    },
  });
  const overridePromise = prisma.userOverride.findUnique({
    where: { userId },
  });
  const enrollmentPromise = courseId
    ? prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        select: {
          accessStatus: true,
        },
      })
    : Promise.resolve(null);
  const coursePromise = courseId
    ? prisma.course.findUnique({
        where: { id: courseId },
        select: { isPublished: true },
      })
    : Promise.resolve(null);

  const [user, override, enrollment, course] = await Promise.all([
    userPromise,
    overridePromise,
    enrollmentPromise,
    coursePromise,
  ]);

  const accessStatus = enrollment?.accessStatus ?? "inactive";
  const coursePublished = course?.isPublished ?? true;
  const canAccessPortal = user?.status === "active";
  const canAccessCourse = canAccessPortal && (!courseId || (accessStatus === "active" && coursePublished));

  return {
    canAccessPortal,
    canAccessCourse,
    canTakeExam: override?.canTakeExam ?? globalPermissionDefaults.canTakeExam,
    canAccessLive: override?.canAccessLive ?? globalPermissionDefaults.canAccessLive,
    canDownloadVideos: override?.canDownloadVideos ?? globalPermissionDefaults.canDownloadVideos,
    hideAssignments: override?.hideAssignments ?? globalPermissionDefaults.hideAssignments,
    hideForum: override?.hideForum ?? globalPermissionDefaults.hideForum,
    status: (user?.status ?? "blocked") as UserStatus,
    accessStatus: accessStatus as EffectiveStudentPermissions["accessStatus"],
    coursePublished,
    customNote: override?.customNote ?? undefined,
  };
}
