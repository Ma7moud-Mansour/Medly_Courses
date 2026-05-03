import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildProtectedAssetUrl, signProtectedAssetToken } from "@/lib/media/access";
import type { Order, PaymentMethod } from "@/types";

const DEFAULT_PAYMENT_EXPIRY_HOURS = 24;

export type ManualReceiptMetadata = {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  url: string;
};

export type StudentOrderView = Order & {
  courseTitles: string[];
  itemsCount: number;
  receiptPreviewUrl?: string;
};

export type AdminPaymentRequest = StudentOrderView & {
  studentName: string;
  studentEmail: string;
  reviewedByAdminName?: string;
};

export type CheckoutPaymentRecipient = {
  instructorId: string;
  instructorName: string;
  vodafoneCashNumber?: string;
  courseTitles: string[];
  total: number;
};

export type CheckoutPaymentInstructions = {
  canSubmit: boolean;
  message: string;
  generatedCodeLabel: string;
  recipient?: CheckoutPaymentRecipient;
  recipients: CheckoutPaymentRecipient[];
  total: number;
  courseTitles: string[];
};

function effectivePrice(input: { price: number; discountPrice: number | null }) {
  return input.discountPrice ?? input.price;
}

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function getPaymentExpiryDate() {
  const hours = Number(process.env.MANUAL_PAYMENT_EXPIRY_HOURS || DEFAULT_PAYMENT_EXPIRY_HOURS);
  return new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1000);
}

async function ensurePaymentReviewer(userId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      status: true,
    },
  });

  if (!actor || actor.status !== "active" || !["admin", "support"].includes(actor.role)) {
    throw new Error("Only active admins or support agents can review payments.");
  }
}

function generateCandidatePaymentCode() {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const randomPart = randomBytes(3).toString("hex").toUpperCase();

  return `PAY-${datePart}-${randomPart}`;
}

async function generateUniqueInternalPaymentCode(tx: Prisma.TransactionClient) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateCandidatePaymentCode();
    const existing = await tx.order.findUnique({
      where: { internalPaymentCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  return `MED-VC-${randomBytes(5).toString("hex").toUpperCase()}`;
}

async function recalculateCourseStudentCount(tx: Prisma.TransactionClient, courseId: string) {
  const activeCount = await tx.enrollment.count({
    where: {
      courseId,
      accessStatus: "active",
    },
  });

  await tx.course.update({
    where: { id: courseId },
    data: { studentsCount: activeCount },
  });
}

async function expireStaleOrders() {
  await prisma.order.updateMany({
    where: {
      status: {
        in: ["pending_payment", "waiting_review"],
      },
      paymentExpiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: "expired",
    },
  });
}

type StudentOrderRecord = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        course: {
          select: {
            title: true;
          };
        };
      };
    };
  };
}>;

type AdminOrderRecord = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
      };
    };
    reviewedByAdmin: {
      select: {
        name: true;
      };
    };
    items: {
      include: {
        course: {
          select: {
            title: true;
          };
        };
      };
    };
  };
}>;

function mapStudentOrder(
  order: StudentOrderRecord,
  input?: {
    receiptPreviewUrl?: string;
  },
): StudentOrderView {
  const base: StudentOrderView = {
    id: order.id,
    userId: order.userId,
    items: order.items.map((item) => ({
      id: item.id,
      courseId: item.courseId,
      title: item.course.title,
      thumbnail: "",
      price: item.price,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod as PaymentMethod,
    internalPaymentCode: order.internalPaymentCode ?? undefined,
    paymentReference: order.paymentReference ?? undefined,
    senderPhone: order.senderPhone ?? undefined,
    paymentRecipientNumber: order.paymentRecipientNumber ?? undefined,
    paymentRecipientInstructorId: order.paymentRecipientInstructorId ?? undefined,
    paymentRecipientInstructorName: order.paymentRecipientInstructorName ?? undefined,
    paymentReceiptUrl: order.paymentReceiptUrl ?? undefined,
    paymentReceiptStorageKey: order.paymentReceiptStorageKey ?? undefined,
    paymentReceiptMimeType: order.paymentReceiptMimeType ?? undefined,
    paymentReceiptSizeBytes: order.paymentReceiptSizeBytes ?? undefined,
    paymentSubmittedAt: toIso(order.paymentSubmittedAt),
    paymentExpiresAt: toIso(order.paymentExpiresAt),
    reviewedAt: toIso(order.reviewedAt),
    reviewedByAdminId: order.reviewedByAdminId ?? undefined,
    rejectionReason: order.rejectionReason ?? undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    itemsCount: order.items.length,
    courseTitles: order.items.map((item) => item.course.title),
    receiptPreviewUrl: input?.receiptPreviewUrl,
  };

  return base;
}

function mapAdminOrder(
  order: AdminOrderRecord,
  input?: {
    receiptPreviewUrl?: string;
  },
): AdminPaymentRequest {
  const base = mapStudentOrder(order, input);

  return {
    ...base,
    studentName: order.user.name,
    studentEmail: order.user.email,
    reviewedByAdminName: order.reviewedByAdmin?.name ?? undefined,
  };
}

async function buildReceiptPreviewUrl(input: {
  viewerUserId: string;
  orderId: string;
  storageKey?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
}) {
  if (!input.storageKey) {
    return undefined;
  }

  const token = await signProtectedAssetToken({
    userId: input.viewerUserId,
    kind: "payment-receipt",
    storageKey: input.storageKey,
    orderId: input.orderId,
    mimeType: input.mimeType ?? undefined,
    fileName: input.fileName ?? "payment-receipt",
    allowDownload: false,
  });

  return buildProtectedAssetUrl(token);
}

export async function createVodafoneCashOrder(input: {
  userId: string;
  courseIds: string[];
  transactionReference?: string;
  senderPhone?: string;
  receipt: ManualReceiptMetadata;
}) {
  const normalizedCourseIds = Array.from(new Set(input.courseIds.filter(Boolean)));

  if (!normalizedCourseIds.length) {
    throw new Error("No courses were selected for checkout.");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!user || user.status !== "active") {
    throw new Error("This account cannot create a payment request right now.");
  }

  const [courses, activeEnrollments] = await Promise.all([
    prisma.course.findMany({
      where: {
        id: { in: normalizedCourseIds },
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        discountPrice: true,
        instructor: {
          select: {
            id: true,
            name: true,
            vodafoneCashNumber: true,
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      where: {
        userId: input.userId,
        courseId: { in: normalizedCourseIds },
        accessStatus: "active",
      },
      select: { courseId: true },
    }),
  ]);

  const activeCourseIds = new Set(activeEnrollments.map((item) => item.courseId));
  const purchasableCourses = courses.filter((course) => !activeCourseIds.has(course.id));

  if (!purchasableCourses.length) {
    throw new Error("All selected courses are already active in this account.");
  }

  const subtotal = purchasableCourses.reduce((sum, course) => sum + effectivePrice(course), 0);
  const recipientKeys = new Set(
    purchasableCourses.map((course) => `${course.instructor.id}:${course.instructor.vodafoneCashNumber ?? ""}`),
  );

  if (recipientKeys.size !== 1) {
    throw new Error("Checkout currently supports one instructor payment recipient per request. Please checkout courses by instructor.");
  }

  const recipientInstructor = purchasableCourses[0]?.instructor;

  if (!recipientInstructor?.vodafoneCashNumber) {
    throw new Error("This course instructor does not have a Vodafone Cash number configured yet.");
  }

  const order = await prisma.$transaction(async (tx) => {
    const internalPaymentCode = await generateUniqueInternalPaymentCode(tx);
    const createdOrder = await tx.order.create({
      data: {
        userId: input.userId,
        subtotal,
        discount: 0,
        total: subtotal,
        status: "waiting_review",
        paymentMethod: "vodafone_cash",
        internalPaymentCode,
        paymentReference: input.transactionReference?.trim() || null,
        senderPhone: input.senderPhone?.trim() || null,
        paymentRecipientNumber: recipientInstructor.vodafoneCashNumber,
        paymentRecipientInstructorId: recipientInstructor.id,
        paymentRecipientInstructorName: recipientInstructor.name,
        paymentReceiptUrl: input.receipt.url,
        paymentReceiptStorageKey: input.receipt.storageKey,
        paymentReceiptMimeType: input.receipt.mimeType,
        paymentReceiptSizeBytes: input.receipt.fileSizeBytes,
        paymentSubmittedAt: new Date(),
        paymentExpiresAt: getPaymentExpiryDate(),
        items: {
          create: purchasableCourses.map((course) => ({
            courseId: course.id,
            price: effectivePrice(course),
          })),
        },
      },
      include: {
        items: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: input.userId,
        title: "Payment submitted",
        body: `Your Vodafone Cash payment ${internalPaymentCode} is waiting for manual review.`,
        type: "payment",
      },
    });

    return createdOrder;
  });

  return mapStudentOrder(order);
}

export async function listStudentOrders(userId: string) {
  await expireStaleOrders();

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          course: {
            select: { title: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Promise.all(
    orders.map(async (order) =>
      mapStudentOrder(order, {
        receiptPreviewUrl: await buildReceiptPreviewUrl({
          viewerUserId: userId,
          orderId: order.id,
          storageKey: order.paymentReceiptStorageKey,
          mimeType: order.paymentReceiptMimeType,
          fileName: `receipt-${order.id}`,
        }),
      }),
    ),
  );
}

export async function getCheckoutPaymentInstructions(courseIds: string[]): Promise<CheckoutPaymentInstructions> {
  const normalizedCourseIds = Array.from(new Set(courseIds.filter(Boolean)));

  if (!normalizedCourseIds.length) {
    return {
      canSubmit: false,
      message: "Add at least one course to see the correct instructor Vodafone Cash number.",
      generatedCodeLabel: "Generated automatically after submission",
      recipients: [],
      total: 0,
      courseTitles: [],
    };
  }

  const courses = await prisma.course.findMany({
    where: {
      id: { in: normalizedCourseIds },
      isPublished: true,
    },
    select: {
      title: true,
      price: true,
      discountPrice: true,
      instructor: {
        select: {
          id: true,
          name: true,
          vodafoneCashNumber: true,
        },
      },
    },
  });

  if (!courses.length) {
    return {
      canSubmit: false,
      message: "The selected courses are not available for checkout.",
      generatedCodeLabel: "Generated automatically after submission",
      recipients: [],
      total: 0,
      courseTitles: [],
    };
  }

  const grouped = new Map<string, CheckoutPaymentRecipient>();

  for (const course of courses) {
    const key = `${course.instructor.id}:${course.instructor.vodafoneCashNumber ?? ""}`;
    const current = grouped.get(key) ?? {
      instructorId: course.instructor.id,
      instructorName: course.instructor.name,
      vodafoneCashNumber: course.instructor.vodafoneCashNumber ?? undefined,
      courseTitles: [],
      total: 0,
    };

    current.courseTitles.push(course.title);
    current.total += effectivePrice(course);
    grouped.set(key, current);
  }

  const recipients = Array.from(grouped.values());
  const missingRecipient = recipients.find((recipient) => !recipient.vodafoneCashNumber);
  const total = courses.reduce((sum, course) => sum + effectivePrice(course), 0);
  const courseTitles = courses.map((course) => course.title);

  if (missingRecipient) {
    return {
      canSubmit: false,
      message: `${missingRecipient.instructorName} does not have a Vodafone Cash number configured yet.`,
      generatedCodeLabel: "Generated automatically after submission",
      recipients,
      total,
      courseTitles,
    };
  }

  if (recipients.length > 1) {
    return {
      canSubmit: false,
      message: "Your cart includes courses for multiple instructors. Please checkout one instructor's courses at a time.",
      generatedCodeLabel: "Generated automatically after submission",
      recipients,
      total,
      courseTitles,
    };
  }

  return {
    canSubmit: true,
    message: "Send the exact amount to the instructor Vodafone Cash number, then upload the receipt for manual review.",
    generatedCodeLabel: "Generated automatically after submission",
    recipient: recipients[0],
    recipients,
    total,
    courseTitles,
  };
}

export async function listAdminPaymentRequests(input: {
  adminUserId: string;
  status?: Order["status"] | "all";
}): Promise<AdminPaymentRequest[]> {
  await ensurePaymentReviewer(input.adminUserId);
  await expireStaleOrders();

  const orders = await prisma.order.findMany({
    where: {
      ...(input.status && input.status !== "all" ? { status: input.status } : {}),
      paymentMethod: "vodafone_cash",
    },
    include: {
      user: true,
      reviewedByAdmin: {
        select: { name: true },
      },
      items: {
        include: {
          course: {
            select: { title: true },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return Promise.all(
    orders.map(async (order) =>
      mapAdminOrder(order, {
        receiptPreviewUrl: await buildReceiptPreviewUrl({
          viewerUserId: input.adminUserId,
          orderId: order.id,
          storageKey: order.paymentReceiptStorageKey,
          mimeType: order.paymentReceiptMimeType,
          fileName: `receipt-${order.id}`,
        }),
      }),
    ),
  );
}

export async function reviewVodafoneCashOrder(input: {
  adminId: string;
  orderId: string;
  decision: "approve" | "reject";
  rejectionReason?: string;
}) {
  await ensurePaymentReviewer(input.adminId);
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                isPublished: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("Payment request was not found.");
    }

    if (!["pending_payment", "waiting_review"].includes(order.status)) {
      throw new Error("This payment request has already been reviewed.");
    }

    if (input.decision === "reject") {
      const rejectedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "rejected",
          rejectionReason: input.rejectionReason?.trim() || "The payment receipt could not be verified.",
          reviewedAt: new Date(),
          reviewedByAdminId: input.adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: input.adminId,
          targetUserId: order.userId,
          action: "reject_manual_payment",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            internalPaymentCode: order.internalPaymentCode,
            paymentReference: order.paymentReference,
            paymentRecipientNumber: order.paymentRecipientNumber,
            paymentRecipientInstructorName: order.paymentRecipientInstructorName,
          } as Prisma.InputJsonValue,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          title: "Payment rejected",
          body: rejectedOrder.rejectionReason ?? "Your payment request needs another submission.",
          type: "payment",
        },
      });

      return rejectedOrder;
    }

    if (order.user.status !== "active") {
      throw new Error("This student account is not active.");
    }

    const courseIds = order.items.map((item) => item.courseId);

    for (const item of order.items) {
      if (!item.course.isPublished) {
        throw new Error("One of the requested courses is no longer published.");
      }

      await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: order.userId,
            courseId: item.courseId,
          },
        },
        update: {
          accessStatus: "active",
          expiresAt: null,
          openedByAdminId: input.adminId,
        },
        create: {
          userId: order.userId,
          courseId: item.courseId,
          accessStatus: "active",
          progress: 0,
          completed: false,
          openedByAdminId: input.adminId,
        },
      });
    }

    for (const courseId of courseIds) {
      await recalculateCourseStudentCount(tx, courseId);
    }

    const approvedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        reviewedByAdminId: input.adminId,
        rejectionReason: null,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: order.userId,
        action: "approve_manual_payment",
        entityType: "Order",
        entityId: order.id,
        metadata: {
          courseIds,
          internalPaymentCode: order.internalPaymentCode,
          paymentReference: order.paymentReference,
          paymentRecipientNumber: order.paymentRecipientNumber,
          paymentRecipientInstructorName: order.paymentRecipientInstructorName,
        } as Prisma.InputJsonValue,
      },
    });

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Payment approved",
        body: "Your Vodafone Cash payment was approved and your course access is now active.",
        type: "payment",
      },
    });

    return approvedOrder;
  });
}
