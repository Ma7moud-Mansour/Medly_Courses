import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireServerRole } from "@/lib/auth/server-session";
import { getUploadConstraint, isAllowedUploadType } from "@/lib/storage";
import type { AdminUploadKind } from "@/lib/storage/types";
import { adminUploadSchema } from "@/lib/validators/schemas";

export const runtime = "nodejs";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

function inferMimeType(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".pdf")) return "application/pdf";
  if (normalized.endsWith(".mp4")) return "video/mp4";
  if (normalized.endsWith(".webm")) return "video/webm";
  if (normalized.endsWith(".mov")) return "video/quicktime";
  if (normalized.endsWith(".m4v")) return "video/x-m4v";
  if (normalized.endsWith(".mkv")) return "video/x-matroska";
  if (normalized.endsWith(".avi")) return "video/x-msvideo";
  if (normalized.endsWith(".mpeg") || normalized.endsWith(".mpg")) return "video/mpeg";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".zip")) return "application/zip";
  if (normalized.endsWith(".doc")) return "application/msword";
  if (normalized.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (normalized.endsWith(".xls")) return "application/vnd.ms-excel";
  if (normalized.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (normalized.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (normalized.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (normalized.endsWith(".txt")) return "text/plain";

  return "application/octet-stream";
}

function validateUploadConstraints(input: { kind: AdminUploadKind; mimeType: string; fileSizeBytes: number }) {
  const constraints = getUploadConstraint(input.kind);

  if (!isAllowedUploadType(input.kind, input.mimeType)) {
    return NextResponse.json(
      {
        error: "نوع الملف غير مسموح لهذا الحقل.",
        receivedMimeType: input.mimeType,
        allowedMimeTypes: constraints.allowedMimeTypes,
      },
      { status: 415 },
    );
  }

  if (constraints.maxBytes && input.fileSizeBytes > constraints.maxBytes) {
    return NextResponse.json(
      {
        error: `حجم الملف أكبر من الحد المسموح (${Math.round(constraints.maxBytes / (1024 * 1024))}MB).`,
        fileSizeBytes: input.fileSizeBytes,
        maxBytes: constraints.maxBytes,
      },
      { status: 413 },
    );
  }

  return null;
}

function sanitizeBaseName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");

  return (
    withoutExt
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || "asset"
  );
}

function normalizeExtension(fileName: string, mimeType: string) {
  const directExtension = path.extname(fileName).toLowerCase();

  if (directExtension) {
    return directExtension;
  }

  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed") return ".zip";
  if (mimeType === "video/mp4") return ".mp4";
  if (mimeType === "video/webm") return ".webm";
  if (mimeType === "video/quicktime") return ".mov";
  if (mimeType === "video/x-m4v") return ".m4v";
  if (mimeType === "video/x-matroska") return ".mkv";
  if (mimeType === "video/x-msvideo") return ".avi";
  if (mimeType === "video/mpeg") return ".mpeg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/jpeg") return ".jpg";

  return "";
}

export async function POST(request: Request) {
  try {
    await requireServerRole(["admin"]);

    const body = (await request.json().catch(() => null)) as Record<string, unknown>;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "بيانات غير صحيحة." }, { status: 400 });
    }

    const parsed = adminUploadSchema.safeParse({ kind: body.kind });

    if (!parsed.success) {
      return NextResponse.json({ error: "نوع الرفع غير صحيح." }, { status: 400 });
    }

    const kind = parsed.data.kind as AdminUploadKind;
    const fileName = String(body.fileName ?? "video.mp4").trim() || "video.mp4";
    const fileSizeBytes = Number(body.fileSizeBytes);
    const browserMimeType = String(body.mimeType ?? "");
    const mimeType =
      !browserMimeType || browserMimeType === "application/octet-stream" ? inferMimeType(fileName) : browserMimeType;

    if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
      return NextResponse.json({ error: "حجم الملف غير صحيح." }, { status: 400 });
    }

    const constraintsResponse = validateUploadConstraints({ kind, mimeType, fileSizeBytes });
    if (constraintsResponse) return constraintsResponse;

    const config = getUploadConstraint(kind);
    const timestamp = new Date();
    const relativeDirectory = path.posix.join(
      config.directory,
      String(timestamp.getFullYear()),
      String(timestamp.getMonth() + 1).padStart(2, "0"),
    );

    const extension = normalizeExtension(fileName, mimeType);
    const safeFileName = `${sanitizeBaseName(fileName)}-${randomUUID().slice(0, 8)}${extension}`;
    const visibilityPrefix = config.visibility === "public" ? "public" : "private";
    const storageKey = path.posix.join(visibilityPrefix, relativeDirectory, safeFileName);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "",
      Key: storageKey,
      ContentType: mimeType,
      ContentLength: fileSizeBytes,
    });

    // Generate presigned URL valid for 2 hours
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 7200 });

    const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    const finalUrl =
      config.visibility === "public"
        ? publicUrlBase 
          ? `${publicUrlBase}/${storageKey}`
          : `https://${process.env.R2_BUCKET_NAME}.r2.cloudflarestorage.com/${storageKey}`
        : `medly-protected://${storageKey}`;

    return NextResponse.json({
      data: {
        presignedUrl,
        provider: "custom",
        url: finalUrl,
        storageKey,
        fileName,
        mimeType,
        fileSizeBytes,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    }
    return NextResponse.json({ error: "The upload could not be started right now." }, { status: 500 });
  }
}
