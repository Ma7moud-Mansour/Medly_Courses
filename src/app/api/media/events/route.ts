import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { prisma } from "@/lib/db";
import { antiPiracyEventTypes, logAntiPiracyEvent, sanitizeDeviceId } from "@/lib/media/security";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  let session;

  try {
    session = await requireServerSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const eventType =
    typeof body.eventType === "string" && antiPiracyEventTypes.includes(body.eventType as (typeof antiPiracyEventTypes)[number])
      ? (body.eventType as (typeof antiPiracyEventTypes)[number])
      : undefined;

  if (!eventType) {
    return NextResponse.json({ error: "Invalid anti-piracy event type." }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : undefined;
  const derivedCourseId = lessonId
    ? await prisma.courseLesson
        .findUnique({
          where: { id: lessonId },
          select: {
            chapter: {
              select: {
                courseId: true,
              },
            },
          },
        })
        .then((lesson) => lesson?.chapter.courseId)
    : undefined;

  await logAntiPiracyEvent({
    userId: session.userId,
    courseId: derivedCourseId ?? (typeof body.courseId === "string" ? body.courseId : undefined),
    lessonId,
    enrollmentId: typeof body.enrollmentId === "string" ? body.enrollmentId : undefined,
    sessionId: session.sessionId,
    deviceId: sanitizeDeviceId(typeof body.deviceId === "string" ? body.deviceId : undefined),
    userAgent: request.headers.get("user-agent") || undefined,
    eventType,
    metadata: isRecord(body.metadata) ? body.metadata : undefined,
  });

  return NextResponse.json({ success: true });
}
