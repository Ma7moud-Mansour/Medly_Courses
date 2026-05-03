import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getProtectedLocalAssetResponse,
  logMediaAccess,
  verifyProtectedAssetToken,
} from "@/lib/media/access";
import { PLAYER_DEVICE_COOKIE_NAME } from "@/lib/media/constants";
import {
  readCookieValue,
  registerPlaybackDevice,
} from "@/lib/media/security";
import { requireServerSession } from "@/lib/auth/server-session";

export const runtime = "nodejs";

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || undefined;
}

export async function GET(request: Request) {
  let session;

  try {
    session = await requireServerSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || undefined;
  const wantsDownload = searchParams.get("download") === "1";
  const isProbeRequest = searchParams.get("probe") === "1";
  const payload = await verifyProtectedAssetToken(token);
  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || undefined;

  if (!payload || payload.uid !== session.userId) {
    if (payload?.lessonId) {
      await logMediaAccess({
        userId: session.userId,
        lessonId: payload.lessonId,
        enrollmentId: payload.enrollmentId,
        action: "denied",
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json({ error: "Media access token is invalid." }, { status: 403 });
  }

  if (payload.kind === "payment-receipt") {
    const order = await prisma.order.findUnique({
      where: { id: payload.orderId },
      select: {
        id: true,
        userId: true,
        paymentReceiptStorageKey: true,
      },
    });

    if (
      !order ||
      order.paymentReceiptStorageKey !== payload.storageKey ||
      (session.role !== "admin" && session.role !== "support" && order.userId !== session.userId)
    ) {
      return NextResponse.json({ error: "Receipt is not available." }, { status: 403 });
    }

    return getProtectedLocalAssetResponse({
      storageKey: payload.storageKey,
      mimeType: payload.mimeType,
      fileName: payload.fileName,
      allowDownload: false,
    });
  }

  const lesson = payload.lessonId
    ? await prisma.courseLesson.findUnique({
        where: { id: payload.lessonId },
        select: {
          id: true,
          isPublished: true,
          chapter: {
            select: {
              isPublished: true,
              courseId: true,
              course: {
                select: {
                  isPublished: true,
                },
              },
            },
          },
        },
      })
    : null;

  if (!lesson || !lesson.isPublished || !lesson.chapter.isPublished || !lesson.chapter.course.isPublished) {
    if (payload.lessonId) {
      await logMediaAccess({
        userId: session.userId,
        lessonId: payload.lessonId,
        enrollmentId: payload.enrollmentId,
        action: "denied",
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json({ error: "Lesson media is not available." }, { status: 404 });
  }

  if (session.role !== "admin" && session.role !== "support") {
    const deviceId = readCookieValue(request.headers.get("cookie"), PLAYER_DEVICE_COOKIE_NAME);

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device verification is required before protected playback can start." },
        { status: 428 },
      );
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: payload.enrollmentId,
        userId: session.userId,
        courseId: lesson.chapter.courseId,
        accessStatus: "active",
      },
      select: {
        id: true,
      },
    });

    if (!enrollment) {
      await logMediaAccess({
        userId: session.userId,
        lessonId: payload.lessonId,
        enrollmentId: payload.enrollmentId,
        action: "denied",
        ipAddress,
        userAgent,
      });

      return NextResponse.json({ error: "You do not have access to this lesson." }, { status: 403 });
    }

    const deviceGate = await registerPlaybackDevice({
      userId: session.userId,
      deviceId,
      userAgent,
      sessionId: session.sessionId,
      courseId: lesson.chapter.courseId,
      lessonId: payload.lessonId,
      enrollmentId: payload.enrollmentId,
    });

    if (!deviceGate.allowed) {
      await logMediaAccess({
        userId: session.userId,
        lessonId: payload.lessonId,
        enrollmentId: payload.enrollmentId,
        action: "denied",
        ipAddress,
        userAgent,
      });

      return NextResponse.json({ error: deviceGate.reason }, { status: 403 });
    }

    if (payload.kind === "lesson-attachment" && wantsDownload && !payload.allowDownload) {
      await logMediaAccess({
        userId: session.userId,
        lessonId: payload.lessonId,
        enrollmentId: payload.enrollmentId,
        action: "denied",
        ipAddress,
        userAgent,
      });

      return NextResponse.json({ error: "Downloads are disabled for this resource." }, { status: 403 });
    }
  }

  await logMediaAccess({
    userId: session.userId,
    lessonId: payload.lessonId,
    enrollmentId: payload.enrollmentId,
    action: "granted",
    ipAddress,
    userAgent,
  });

  if (isProbeRequest) {
    return NextResponse.json({ ok: true });
  }

  return getProtectedLocalAssetResponse({
    storageKey: payload.storageKey,
    mimeType: payload.mimeType,
    fileName: payload.fileName,
    allowDownload: payload.kind === "lesson-attachment" ? wantsDownload && Boolean(payload.allowDownload) : false,
  });
}
