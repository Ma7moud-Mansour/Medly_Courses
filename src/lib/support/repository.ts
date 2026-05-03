import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SupportTicket, SupportTicketIssueType, SupportTicketMessage, SupportTicketStatus, UserRole } from "@/types";

type TicketWithRelations = Prisma.SupportTicketGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    assignedToAdmin: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    messages: {
      include: {
        sender: {
          select: {
            id: true;
            name: true;
            role: true;
          };
        };
      };
      orderBy: {
        createdAt: "asc";
      };
    };
  };
}>;

export type SupportTicketConversation = SupportTicket & {
  userName: string;
  userEmail: string;
  assignedToAdminName?: string;
  messages: SupportTicketMessage[];
};

export type SupportTicketListItem = SupportTicket & {
  userName: string;
  userEmail: string;
  assignedToAdminName?: string;
  latestMessagePreview?: string;
  messagesCount: number;
};

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function mapMessage(
  message: TicketWithRelations["messages"][number],
): SupportTicketMessage {
  return {
    id: message.id,
    ticketId: message.ticketId,
    senderId: message.senderId ?? undefined,
    senderName: message.sender?.name ?? message.senderName ?? "رسالة زائر",
    senderEmail: message.senderEmail ?? undefined,
    senderRole: message.sender?.role ? (message.sender.role as UserRole) : message.senderRole ? (message.senderRole as UserRole) : "guest",
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

function mapTicketBase(ticket: TicketWithRelations): SupportTicket {
  return {
    id: ticket.id,
    userId: ticket.userId ?? undefined,
    guestName: ticket.guestName ?? undefined,
    guestEmail: ticket.guestEmail ?? undefined,
    title: ticket.title,
    issueType: ticket.issueType as SupportTicketIssueType,
    description: ticket.description,
    status: ticket.status as SupportTicketStatus,
    assignedToAdminId: ticket.assignedToAdminId ?? undefined,
    resolutionNote: ticket.resolutionNote ?? undefined,
    unreadForAdmin: ticket.unreadForAdmin,
    unreadForStudent: ticket.unreadForStudent,
    lastMessageAt: toIso(ticket.lastMessageAt),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

function mapTicketListItem(ticket: TicketWithRelations): SupportTicketListItem {
  const latestMessage = ticket.messages[ticket.messages.length - 1];

  return {
    ...mapTicketBase(ticket),
    userName: ticket.user?.name ?? ticket.guestName ?? "رسالة زائر",
    userEmail: ticket.user?.email ?? ticket.guestEmail ?? "لا يوجد بريد محفوظ",
    assignedToAdminName: ticket.assignedToAdmin?.name ?? undefined,
    latestMessagePreview: latestMessage?.body?.slice(0, 120),
    messagesCount: ticket.messages.length,
  };
}

function mapConversation(ticket: TicketWithRelations): SupportTicketConversation {
  return {
    ...mapTicketBase(ticket),
    userName: ticket.user?.name ?? ticket.guestName ?? "رسالة زائر",
    userEmail: ticket.user?.email ?? ticket.guestEmail ?? "لا يوجد بريد محفوظ",
    assignedToAdminName: ticket.assignedToAdmin?.name ?? undefined,
    messages: ticket.messages.map(mapMessage),
  };
}

async function createSupportAuditLog(input: {
  adminId: string;
  targetUserId?: string | null;
  action: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      targetUserId: input.targetUserId,
      action: input.action,
      entityType: "SupportTicket",
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listStudentSupportTickets(userId: string) {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: [{ unreadForStudent: "desc" }, { lastMessageAt: "desc" }],
  });

  return tickets.map(mapTicketListItem);
}

export async function getStudentSupportTicket(userId: string, ticketId: string) {
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!ticket) {
    return undefined;
  }

  if (ticket.unreadForStudent) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        unreadForStudent: false,
      },
    });
  }

  return mapConversation(ticket);
}

export async function createStudentSupportTicket(input: {
  userId: string;
  title: string;
  issueType: SupportTicketIssueType;
  message: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      status: true,
    },
  });

  if (!user || user.status !== "active") {
    throw new Error("This account cannot create support tickets right now.");
  }

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        userId: input.userId,
        title: input.title.trim(),
        issueType: input.issueType,
        description: input.message.trim(),
        status: "open",
        unreadForAdmin: true,
        unreadForStudent: false,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: input.userId,
            body: input.message.trim(),
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedToAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return mapConversation(ticket);
  });
}

function mapContactTopicToIssueType(topic: string): SupportTicketIssueType {
  const normalized = topic.trim().toLowerCase();

  if (["billing", "payment", "checkout"].includes(normalized)) {
    return "payment";
  }

  if (["course", "access", "course_access"].includes(normalized)) {
    return "course_access";
  }

  if (["technical", "support"].includes(normalized)) {
    return "technical";
  }

  if (["permissions"].includes(normalized)) {
    return "permissions";
  }

  return "general";
}

function getContactTopicLabel(topic: string) {
  const labels: Record<string, string> = {
    support: "دعم فني",
    billing: "الدفع والفواتير",
    content: "اقتراح محتوى",
    course_access: "الوصول للكورس",
    general: "استفسار عام",
  };

  return labels[topic] ?? topic;
}

export async function createContactSupportTicket(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
  userId?: string;
}) {
  const trimmedName = input.name.trim();
  const trimmedEmail = input.email.trim().toLowerCase();
  const trimmedMessage = input.message.trim();
  const issueType = mapContactTopicToIssueType(input.topic);
  const topicLabel = getContactTopicLabel(input.topic);

  const user = input.userId
    ? await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      })
    : undefined;

  if (input.userId && (!user || user.status !== "active")) {
    throw new Error("This account cannot create support tickets right now.");
  }

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        userId: user?.id,
        guestName: user ? null : trimmedName,
        guestEmail: user ? null : trimmedEmail,
        title: `رسالة تواصل: ${topicLabel}`,
        issueType,
        description: trimmedMessage,
        status: "open",
        unreadForAdmin: true,
        unreadForStudent: false,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: user?.id,
            senderName: user ? user.name : trimmedName,
            senderEmail: user ? user.email : trimmedEmail,
            senderRole: user?.role,
            body: trimmedMessage,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedToAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return mapConversation(ticket);
  });
}

export async function replyToStudentSupportTicket(input: {
  userId: string;
  ticketId: string;
  message: string;
}) {
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: input.ticketId,
      userId: input.userId,
    },
  });

  if (!ticket) {
    throw new Error("Support ticket was not found.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: input.userId,
        body: input.message.trim(),
      },
    });

    const updatedTicket = await tx.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: ticket.status === "closed" ? "open" : ticket.status,
        unreadForAdmin: true,
        unreadForStudent: false,
        lastMessageAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedToAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return mapConversation(updatedTicket);
  });
}

export async function listAdminSupportTickets(input?: {
  status?: SupportTicketStatus | "all";
}) {
  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(input?.status && input.status !== "all" ? { status: input.status } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: [{ unreadForAdmin: "desc" }, { lastMessageAt: "desc" }],
  });

  return tickets.map(mapTicketListItem);
}

export async function getAdminSupportTicket(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!ticket) {
    return undefined;
  }

  if (ticket.unreadForAdmin) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        unreadForAdmin: false,
      },
    });
  }

  return mapConversation(ticket);
}

export async function replyToSupportTicketAsAdmin(input: {
  adminId: string;
  ticketId: string;
  message: string;
  status?: SupportTicketStatus;
}) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({
      where: { id: input.ticketId },
    });

    if (!ticket) {
      throw new Error("Support ticket was not found.");
    }

    await tx.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: input.adminId,
        body: input.message.trim(),
      },
    });

    const nextStatus =
      input.status ??
      (ticket.status === "open" ? "in_progress" : ticket.status);

    const updatedTicket = await tx.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: nextStatus,
        assignedToAdminId: input.adminId,
        unreadForAdmin: false,
        unreadForStudent: Boolean(ticket.userId),
        lastMessageAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedToAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (updatedTicket.userId) {
      await tx.notification.create({
        data: {
          userId: updatedTicket.userId,
          title: "Support reply received",
          body: "A new reply was added to your Medly support ticket.",
          type: "reminder",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        targetUserId: updatedTicket.userId,
        action: "reply_support_ticket",
        entityType: "SupportTicket",
        entityId: updatedTicket.id,
        metadata: {
          status: nextStatus,
        } as Prisma.InputJsonValue,
      },
    });

    return mapConversation(updatedTicket);
  });
}

export async function updateSupportTicketStatus(input: {
  adminId: string;
  ticketId: string;
  status: SupportTicketStatus;
  resolutionNote?: string;
}) {
  const existingTicket = await prisma.supportTicket.findUnique({
    where: { id: input.ticketId },
    select: { userId: true },
  });

  const ticket = await prisma.supportTicket.update({
    where: { id: input.ticketId },
    data: {
      status: input.status,
      resolutionNote: input.resolutionNote?.trim() || null,
      assignedToAdminId: input.adminId,
      unreadForStudent: Boolean(existingTicket?.userId),
    },
  });

  await createSupportAuditLog({
    adminId: input.adminId,
    targetUserId: ticket.userId,
    action: "update_support_ticket_status",
    entityId: ticket.id,
    metadata: {
      status: input.status,
    },
  });

  if (ticket.userId) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: "Support ticket updated",
        body: `Your support ticket is now marked as ${input.status}.`,
        type: "reminder",
      },
    });
  }

  return ticket;
}
