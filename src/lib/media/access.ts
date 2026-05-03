import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/db";
import { extractStorageKey, isProtectedStorageKey, resolveStoragePath } from "@/lib/storage";
import type { VideoWatermark } from "@/types";

type ProtectedAssetKind = "lesson-video" | "lesson-attachment" | "payment-receipt";

type MediaTokenPayload = JWTPayload & {
  kind: ProtectedAssetKind;
  uid: string;
  storageKey: string;
  lessonId?: string;
  enrollmentId?: string;
  orderId?: string;
  fileName?: string;
  mimeType?: string;
  allowDownload?: boolean;
};

const MEDIA_TOKEN_AUDIENCE = "medly-media";
const MEDIA_TOKEN_ISSUER = "medly";
const MEDIA_TOKEN_TTL_SECONDS = 60 * 10;

function getMediaSecret() {
  const secret = process.env.MEDIA_ACCESS_SECRET?.trim() || process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "medly-dev-media-secret-change-me";
  }

  throw new Error("MEDIA_ACCESS_SECRET is required in production.");
}

function getSigningKey() {
  return new TextEncoder().encode(getMediaSecret());
}

function normalizeWatermarkName(name?: string | null) {
  const trimmed = name?.trim();

  if (!trimmed) {
    return "Medly Student";
  }

  return trimmed.replace(/\s+/g, " ").slice(0, 32);
}

export function buildVideoWatermark(input: {
  name?: string | null;
}): VideoWatermark {
  return {
    displayName: normalizeWatermarkName(input.name),
  };
}

export async function signProtectedAssetToken(input: {
  userId: string;
  kind: ProtectedAssetKind;
  storageKey: string;
  lessonId?: string;
  enrollmentId?: string;
  orderId?: string;
  fileName?: string;
  mimeType?: string;
  allowDownload?: boolean;
  expiresInSeconds?: number;
}) {
  const expiresInSeconds = input.expiresInSeconds ?? MEDIA_TOKEN_TTL_SECONDS;

  return new SignJWT({
    kind: input.kind,
    uid: input.userId,
    storageKey: input.storageKey,
    lessonId: input.lessonId,
    enrollmentId: input.enrollmentId,
    orderId: input.orderId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    allowDownload: input.allowDownload,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(MEDIA_TOKEN_ISSUER)
    .setAudience(MEDIA_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getSigningKey());
}

export async function verifyProtectedAssetToken(token?: string) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<MediaTokenPayload>(token, getSigningKey(), {
      issuer: MEDIA_TOKEN_ISSUER,
      audience: MEDIA_TOKEN_AUDIENCE,
    });

    if (!payload.uid || !payload.kind || !payload.storageKey) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function buildProtectedAssetUrl(token: string, download = false) {
  const query = new URLSearchParams({ token });

  if (download) {
    query.set("download", "1");
  }

  return `/api/media/asset?${query.toString()}`;
}

export function requiresProtectedAssetUrl(input: { storageKey?: string | null; url?: string | null }) {
  const storageKey = extractStorageKey(input);
  return Boolean(storageKey && isProtectedStorageKey(storageKey));
}

export async function logMediaAccess(input: {
  userId: string;
  lessonId?: string;
  enrollmentId?: string;
  action: "request" | "granted" | "denied";
  ipAddress?: string;
  userAgent?: string;
}) {
  if (!input.lessonId) {
    return;
  }

  await prisma.mediaAccessLog.create({
    data: {
      userId: input.userId,
      lessonId: input.lessonId,
      enrollmentId: input.enrollmentId,
      action: input.action,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

export async function getProtectedLocalAssetResponse(input: {
  storageKey: string;
  mimeType?: string;
  fileName?: string;
  allowDownload?: boolean;
}) {
  const filePath = resolveStoragePath(input.storageKey);
  const fileInfo = await stat(filePath);
  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;
  const headers = new Headers();

  headers.set("Content-Length", String(fileInfo.size));
  headers.set("Cache-Control", "private, max-age=0, must-revalidate");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("Accept-Ranges", "bytes");

  if (input.mimeType) {
    headers.set("Content-Type", input.mimeType);
  }

  if (input.fileName) {
    const disposition = input.allowDownload ? "attachment" : "inline";
    headers.set("Content-Disposition", `${disposition}; filename="${encodeURIComponent(input.fileName)}"`);
  }

  return new Response(webStream, {
    status: 200,
    headers,
  });
}
