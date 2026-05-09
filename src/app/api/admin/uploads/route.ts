import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireServerRole } from "@/lib/auth/server-session";
import {
  deleteStoredAsset,
  getUploadConstraint,
  isAllowedUploadType,
  saveUploadedFile,
  saveUploadedStream,
} from "@/lib/storage";
import type { AdminUploadKind, UploadedAsset } from "@/lib/storage/types";
import { adminUploadSchema } from "@/lib/validators/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

const CHUNKED_UPLOAD_PROTOCOL = "medly-chunked-upload";
const CHUNK_UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads", ".tmp");
const CHUNK_UPLOAD_BYTES = 768 * 1024;
const MAX_CHUNK_BYTES = 2 * 1024 * 1024;
const CHUNK_UPLOAD_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type ChunkUploadMeta = {
  uploadId: string;
  kind: AdminUploadKind;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  totalChunks: number;
  createdAt: string;
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getBodyNumber(body: Record<string, unknown>, key: string) {
  const value = body[key];
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeUploadId(uploadId: string | null | undefined) {
  const normalized = uploadId?.trim();

  if (!normalized || !/^[a-f0-9-]{36}$/i.test(normalized)) {
    throw new Error("Invalid chunked upload id.");
  }

  return normalized;
}

function getChunkUploadDirectory(uploadId: string) {
  const target = path.resolve(CHUNK_UPLOAD_ROOT, normalizeUploadId(uploadId));
  const root = path.resolve(CHUNK_UPLOAD_ROOT);

  if (target !== root && target.startsWith(`${root}${path.sep}`)) {
    return target;
  }

  throw new Error("Invalid chunked upload path.");
}

async function cleanupOldChunkUploads() {
  try {
    await mkdir(CHUNK_UPLOAD_ROOT, { recursive: true });
    const entries = await readdir(CHUNK_UPLOAD_ROOT, { withFileTypes: true });
    const cutoff = Date.now() - CHUNK_UPLOAD_MAX_AGE_MS;

    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const directory = path.join(CHUNK_UPLOAD_ROOT, entry.name);
          const details = await stat(directory).catch(() => null);

          if (details && details.mtimeMs < cutoff) {
            await rm(directory, { force: true, recursive: true });
          }
        }),
    );
  } catch {
    // Old temporary chunks should never block a fresh upload.
  }
}

async function readChunkUploadMeta(uploadId: string): Promise<ChunkUploadMeta> {
  const uploadDirectory = getChunkUploadDirectory(uploadId);
  const meta = JSON.parse(await readFile(path.join(uploadDirectory, "meta.json"), "utf8")) as ChunkUploadMeta;

  return {
    uploadId: normalizeUploadId(meta.uploadId),
    kind: meta.kind,
    fileName: meta.fileName,
    mimeType: meta.mimeType,
    fileSizeBytes: meta.fileSizeBytes,
    totalChunks: meta.totalChunks,
    createdAt: meta.createdAt,
  };
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

function uploadedAssetPayload(kind: AdminUploadKind, uploaded: UploadedAsset) {
  return {
    data: {
      kind,
      provider: uploaded.provider,
      fileName: uploaded.fileName,
      mimeType: uploaded.mimeType,
      fileSizeBytes: uploaded.fileSizeBytes,
      storageKey: uploaded.storageKey,
      url: uploaded.url,
    },
  };
}

async function startChunkedUpload(request: Request) {
  await cleanupOldChunkUploads();

  const body = (await request.json().catch(() => null)) as unknown;

  if (!isRecord(body)) {
    return NextResponse.json({ error: "بيانات الرفع غير صحيحة." }, { status: 400 });
  }

  const parsed = adminUploadSchema.safeParse({
    kind: body.kind,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "نوع الرفع غير صحيح." }, { status: 400 });
  }

  const fileName = String(body.fileName ?? "video.mp4").trim() || "video.mp4";
  const fileSizeBytes = getBodyNumber(body, "fileSizeBytes");
  const browserMimeType = String(body.mimeType ?? "");
  const mimeType =
    !browserMimeType || browserMimeType === "application/octet-stream" ? inferMimeType(fileName) : browserMimeType;

  if (!fileSizeBytes || fileSizeBytes <= 0) {
    return NextResponse.json({ error: "حجم الملف غير صحيح." }, { status: 400 });
  }

  const totalChunks = Math.ceil(fileSizeBytes / CHUNK_UPLOAD_BYTES);

  if (!Number.isSafeInteger(totalChunks) || totalChunks < 1) {
    return NextResponse.json({ error: "عدد أجزاء الفيديو غير مناسب لهذا السيرفر." }, { status: 413 });
  }

  const constraintsResponse = validateUploadConstraints({
    kind: parsed.data.kind,
    mimeType,
    fileSizeBytes,
  });

  if (constraintsResponse) {
    return constraintsResponse;
  }

  const uploadId = randomUUID();
  const uploadDirectory = getChunkUploadDirectory(uploadId);
  const meta: ChunkUploadMeta = {
    uploadId,
    kind: parsed.data.kind,
    fileName,
    mimeType,
    fileSizeBytes,
    totalChunks,
    createdAt: new Date().toISOString(),
  };

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, "meta.json"), JSON.stringify(meta), "utf8");

  return NextResponse.json({
    data: {
      uploadId,
      chunkSizeBytes: CHUNK_UPLOAD_BYTES,
      totalChunks,
    },
  });
}

async function saveChunkedUploadPart(request: Request) {
  const uploadId = normalizeUploadId(request.headers.get("x-medly-upload-id"));
  const meta = await readChunkUploadMeta(uploadId);
  const chunkIndex = Number(request.headers.get("x-medly-chunk-index"));

  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= meta.totalChunks) {
    return NextResponse.json({ error: "رقم جزء الفيديو غير صحيح." }, { status: 400 });
  }

  const chunkBuffer = Buffer.from(await request.arrayBuffer());

  if (!chunkBuffer.length || chunkBuffer.length > MAX_CHUNK_BYTES) {
    return NextResponse.json({ error: "حجم جزء الفيديو غير صحيح." }, { status: 413 });
  }

  const uploadDirectory = getChunkUploadDirectory(uploadId);

  await writeFile(path.join(uploadDirectory, `${chunkIndex}.part`), chunkBuffer);

  return NextResponse.json({
    data: {
      uploadId,
      chunkIndex,
      receivedBytes: chunkBuffer.length,
    },
  });
}

async function completeChunkedUpload(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;

  if (!isRecord(body)) {
    return NextResponse.json({ error: "بيانات إنهاء الرفع غير صحيحة." }, { status: 400 });
  }

  const uploadId = normalizeUploadId(String(body.uploadId ?? ""));
  const meta = await readChunkUploadMeta(uploadId);
  const uploadDirectory = getChunkUploadDirectory(uploadId);
  const chunkPaths: string[] = [];
  let receivedBytes = 0;

  for (let index = 0; index < meta.totalChunks; index += 1) {
    const chunkPath = path.join(uploadDirectory, `${index}.part`);
    const chunkStat = await stat(chunkPath).catch(() => null);

    if (!chunkStat || !chunkStat.isFile()) {
      return NextResponse.json({ error: "لم تصل كل أجزاء الفيديو. حاول رفعه مرة أخرى." }, { status: 400 });
    }

    chunkPaths.push(chunkPath);
    receivedBytes += chunkStat.size;
  }

  if (receivedBytes !== meta.fileSizeBytes) {
    return NextResponse.json({ error: "حجم الفيديو بعد الرفع غير مطابق للملف الأصلي." }, { status: 400 });
  }

  const constraintsResponse = validateUploadConstraints({
    kind: meta.kind,
    mimeType: meta.mimeType,
    fileSizeBytes: meta.fileSizeBytes,
  });

  if (constraintsResponse) {
    return constraintsResponse;
  }

  async function* chunkStream() {
    for (const chunkPath of chunkPaths) {
      for await (const chunk of createReadStream(chunkPath)) {
        yield chunk as Buffer;
      }
    }
  }

  const uploaded = await saveUploadedStream({
    stream: chunkStream(),
    file: {
      name: meta.fileName,
      size: meta.fileSizeBytes,
      type: meta.mimeType,
    },
    kind: meta.kind,
  });

  await rm(uploadDirectory, { force: true, recursive: true });

  return NextResponse.json(uploadedAssetPayload(meta.kind, uploaded));
}

async function handleChunkedUpload(request: Request) {
  const phase = request.headers.get("x-medly-upload-phase");

  if (phase === "start") {
    return startChunkedUpload(request);
  }

  if (phase === "chunk") {
    return saveChunkedUploadPart(request);
  }

  if (phase === "complete") {
    return completeChunkedUpload(request);
  }

  return NextResponse.json({ error: "مرحلة رفع الفيديو غير صحيحة." }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    await requireServerRole(["admin"]);

    if (request.headers.get("x-medly-upload-protocol") === CHUNKED_UPLOAD_PROTOCOL) {
      return handleChunkedUpload(request);
    }

    const formData = await request.formData();
    const parsed = adminUploadSchema.safeParse({
      kind: formData.get("kind"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
    }

    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "No valid file was provided." }, { status: 400 });
    }

    const browserMimeType = fileEntry.type || "";
    const inferredMimeType = inferMimeType(fileEntry.name);
    const mimeType =
      !browserMimeType || browserMimeType === "application/octet-stream" ? inferredMimeType : browserMimeType;

    const constraintsResponse = validateUploadConstraints({
      kind: parsed.data.kind,
      mimeType,
      fileSizeBytes: fileEntry.size,
    });

    if (constraintsResponse) {
      return constraintsResponse;
    }

    const uploaded = await saveUploadedFile({
      file: {
        arrayBuffer: () => fileEntry.arrayBuffer(),
        name: fileEntry.name,
        size: fileEntry.size,
        type: mimeType,
      },
      kind: parsed.data.kind,
    });

    return NextResponse.json(uploadedAssetPayload(parsed.data.kind, uploaded));
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "";
    const status = message.toLowerCase().includes("body") || message.toLowerCase().includes("size") ? 413 : 500;

    return NextResponse.json(
      {
        error:
          status === 413
            ? "حجم الملف أكبر من إعدادات السيرفر الحالية. ارفع الفيديو مرة أخرى وسيتم تقسيمه تلقائيًا إلى أجزاء صغيرة."
            : "The upload could not be completed right now.",
      },
      { status },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireServerRole(["admin"]);
    const payload = (await request.json()) as { storageKey?: string; url?: string };

    await deleteStoredAsset({
      storageKey: payload.storageKey,
      url: payload.url,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: "You are not allowed to perform this action." }, { status: 401 });
    }

    return NextResponse.json({ error: "The file could not be deleted right now." }, { status: 500 });
  }
}
