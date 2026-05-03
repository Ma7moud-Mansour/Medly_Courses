import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_MAX_ACTIVE_PLAYBACK_DEVICES = 2;

export const antiPiracyEventTypes = [
  "VIDEO_WINDOW_BLUR",
  "VIDEO_TAB_HIDDEN",
  "VIDEO_CONTEXT_MENU",
  "VIDEO_PRINTSCREEN_ATTEMPT",
  "VIDEO_DEVTOOLS_SHORTCUT",
  "VIDEO_COPY_ATTEMPT",
  "VIDEO_FULLSCREEN_EXIT",
  "VIDEO_DRAG_ATTEMPT",
  "VIDEO_DEVICE_REGISTERED",
  "VIDEO_DEVICE_LIMIT_EXCEEDED",
  "VIDEO_SUSPICIOUS_DEVICE_CHANGE",
  "VIDEO_RESUME_AFTER_PROTECTION",
] as const;

export type AntiPiracyEventType = (typeof antiPiracyEventTypes)[number];

function toJsonValue(value?: Record<string, unknown>) {
  return value as Prisma.InputJsonValue | undefined;
}

export function getMaxActivePlaybackDevices() {
  const configured = Number(process.env.MAX_ACTIVE_PLAYBACK_DEVICES ?? "");

  if (Number.isInteger(configured) && configured > 0) {
    return configured;
  }

  return DEFAULT_MAX_ACTIVE_PLAYBACK_DEVICES;
}

export function sanitizeDeviceId(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120) || undefined;
}

export function readCookieValue(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) {
    return undefined;
  }

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return undefined;
  }

  const [, rawValue] = cookie.split("=");
  return sanitizeDeviceId(decodeURIComponent(rawValue ?? ""));
}

export async function logAntiPiracyEvent(input: {
  userId: string;
  eventType: AntiPiracyEventType;
  courseId?: string;
  lessonId?: string;
  enrollmentId?: string;
  sessionId?: string;
  deviceId?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.antiPiracyEvent.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      enrollmentId: input.enrollmentId,
      sessionId: input.sessionId,
      deviceId: sanitizeDeviceId(input.deviceId),
      eventType: input.eventType,
      userAgent: input.userAgent,
      metadata: toJsonValue(input.metadata),
    },
  });
}

export async function registerPlaybackDevice(input: {
  userId: string;
  deviceId: string;
  userAgent?: string;
  sessionId?: string;
  courseId?: string;
  lessonId?: string;
  enrollmentId?: string;
}) {
  const deviceId = sanitizeDeviceId(input.deviceId);

  if (!deviceId) {
    return {
      allowed: false as const,
      reason: "Device verification failed. Reload the lesson and try again.",
    };
  }

  const maxDevices = getMaxActivePlaybackDevices();
  const now = new Date();
  const existing = await prisma.playbackDevice.findUnique({
    where: {
      userId_deviceId: {
        userId: input.userId,
        deviceId,
      },
    },
  });

  if (existing) {
    await prisma.playbackDevice.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: now,
        userAgent: input.userAgent,
        lastSessionId: input.sessionId,
      },
    });

    return {
      allowed: true as const,
      deviceStatus: "known" as const,
      maxDevices,
    };
  }

  const knownDevices = await prisma.playbackDevice.findMany({
    where: {
      userId: input.userId,
    },
    orderBy: {
      lastSeenAt: "desc",
    },
  });

  if (knownDevices.length >= maxDevices) {
    await logAntiPiracyEvent({
      userId: input.userId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      enrollmentId: input.enrollmentId,
      sessionId: input.sessionId,
      deviceId,
      userAgent: input.userAgent,
      eventType: "VIDEO_DEVICE_LIMIT_EXCEEDED",
      metadata: {
        maxDevices,
        knownDeviceCount: knownDevices.length,
      },
    });

    return {
      allowed: false as const,
      reason: `Playback is limited to ${maxDevices} active devices for this account.`,
      maxDevices,
    };
  }

  await prisma.playbackDevice.create({
    data: {
      userId: input.userId,
      deviceId,
      userAgent: input.userAgent,
      lastSessionId: input.sessionId,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });

  await logAntiPiracyEvent({
    userId: input.userId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    enrollmentId: input.enrollmentId,
    sessionId: input.sessionId,
    deviceId,
    userAgent: input.userAgent,
    eventType: "VIDEO_DEVICE_REGISTERED",
    metadata: {
      maxDevices,
    },
  });

  if (knownDevices.length > 0) {
    await logAntiPiracyEvent({
      userId: input.userId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      enrollmentId: input.enrollmentId,
      sessionId: input.sessionId,
      deviceId,
      userAgent: input.userAgent,
      eventType: "VIDEO_SUSPICIOUS_DEVICE_CHANGE",
      metadata: {
        knownDeviceCount: knownDevices.length,
        maxDevices,
      },
    });
  }

  return {
    allowed: true as const,
    deviceStatus: "registered" as const,
    maxDevices,
  };
}
