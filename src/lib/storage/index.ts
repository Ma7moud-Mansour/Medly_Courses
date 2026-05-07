import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  AdminUploadKind,
  StoredFileMetadata,
  StoredVideoMetadata,
  StorageAdapter,
  UploadedAsset,
} from "@/lib/storage/types";

const PUBLIC_UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const PRIVATE_UPLOADS_ROOT = path.join(process.cwd(), "storage", "uploads");
const PROTECTED_URL_SCHEME = "medly-protected://";

const uploadConstraints: Record<
  AdminUploadKind,
  {
    allowedMimeTypes: string[];
    maxBytes: number;
    directory: string;
    visibility: "public" | "private";
  }
> = {
  video: {
    allowedMimeTypes: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-m4v",
      "video/x-matroska",
      "video/x-msvideo",
      "video/mpeg",
    ],
    maxBytes: 1024 * 1024 * 1024,
    directory: "videos",
    visibility: "private",
  },
  pdf: {
    allowedMimeTypes: ["application/pdf"],
    maxBytes: 25 * 1024 * 1024,
    directory: "pdfs",
    visibility: "private",
  },
  attachment: {
    allowedMimeTypes: [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
    ],
    maxBytes: 50 * 1024 * 1024,
    directory: "attachments",
    visibility: "private",
  },
  thumbnail: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 10 * 1024 * 1024,
    directory: "thumbnails",
    visibility: "public",
  },
  receipt: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    maxBytes: 12 * 1024 * 1024,
    directory: "receipts",
    visibility: "private",
  },
};

function trimValue(value?: string | null) {
  return value?.trim() || undefined;
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

function normalizeStorageKey(storageKey: string) {
  return storageKey.replace(/^\/+/, "").replace(/\.\.+/g, "");
}

function asProtectedUrl(storageKey: string) {
  return `${PROTECTED_URL_SCHEME}${normalizeStorageKey(storageKey)}`;
}

export function isProtectedAssetUrl(url?: string | null) {
  return Boolean(url && url.startsWith(PROTECTED_URL_SCHEME));
}

export function extractStorageKey(input: { storageKey?: string | null; url?: string | null }) {
  const directKey = trimValue(input.storageKey);

  if (directKey) {
    return normalizeStorageKey(directKey);
  }

  const directUrl = trimValue(input.url);

  if (!directUrl) {
    return undefined;
  }

  if (directUrl.startsWith("/uploads/")) {
    return normalizeStorageKey(`public/${directUrl.replace(/^\/uploads\//, "")}`);
  }

  if (directUrl.startsWith(PROTECTED_URL_SCHEME)) {
    return normalizeStorageKey(directUrl.replace(PROTECTED_URL_SCHEME, ""));
  }

  return undefined;
}

export function isPublicStorageKey(storageKey?: string | null) {
  const normalized = trimValue(storageKey);

  if (!normalized) {
    return false;
  }

  return normalized.startsWith("public/") || !normalized.startsWith("private/");
}

export function isProtectedStorageKey(storageKey?: string | null) {
  const normalized = trimValue(storageKey);

  if (!normalized) {
    return false;
  }

  return normalized.startsWith("private/");
}

export function resolveStoragePath(storageKey: string) {
  const normalized = normalizeStorageKey(storageKey);

  if (normalized.startsWith("public/")) {
    return path.join(PUBLIC_UPLOADS_ROOT, normalized.replace(/^public\//, ""));
  }

  if (normalized.startsWith("private/")) {
    return path.join(PRIVATE_UPLOADS_ROOT, normalized.replace(/^private\//, ""));
  }

  return path.join(PUBLIC_UPLOADS_ROOT, normalized);
}

function localPublicUrl(input: { url?: string | null; storageKey?: string | null }) {
  const directUrl = trimValue(input.url);

  if (directUrl && !isProtectedAssetUrl(directUrl)) {
    return directUrl;
  }

  const storageKey = extractStorageKey(input);

  if (!storageKey) {
    return undefined;
  }

  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }

  if (isProtectedStorageKey(storageKey)) {
    return undefined;
  }

  return `/uploads/${storageKey.replace(/^public\//, "").replace(/^\/+/, "")}`;
}

async function saveLocalFile(input: {
  file: {
    arrayBuffer(): Promise<ArrayBuffer>;
    name: string;
    size: number;
    type: string;
  };
  kind: AdminUploadKind;
}): Promise<UploadedAsset> {
  const config = uploadConstraints[input.kind];
  const rootDirectory = config.visibility === "public" ? PUBLIC_UPLOADS_ROOT : PRIVATE_UPLOADS_ROOT;
  const timestamp = new Date();
  const relativeDirectory = path.posix.join(
    config.directory,
    String(timestamp.getFullYear()),
    String(timestamp.getMonth() + 1).padStart(2, "0"),
  );
  const targetDirectory = path.join(rootDirectory, ...relativeDirectory.split("/"));

  await mkdir(targetDirectory, { recursive: true });

  const extension = normalizeExtension(input.file.name, input.file.type);
  const fileName = `${sanitizeBaseName(input.file.name)}-${randomUUID().slice(0, 8)}${extension}`;
  const visibilityPrefix = config.visibility === "public" ? "public" : "private";
  const storageKey = path.posix.join(visibilityPrefix, relativeDirectory, fileName);
  const filePath = path.join(targetDirectory, fileName);
  const buffer = Buffer.from(await input.file.arrayBuffer());

  await writeFile(filePath, buffer);

  return {
    provider: "local",
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    fileSizeBytes: input.file.size,
    storageKey,
    url:
      config.visibility === "public"
        ? localPublicUrl({ storageKey }) ?? ""
        : asProtectedUrl(storageKey),
    isPublic: config.visibility === "public",
  };
}

async function deleteLocalFile(input: { storageKey?: string | null; url?: string | null }) {
  const storageKey = extractStorageKey(input);

  if (!storageKey) {
    return;
  }

  await rm(resolveStoragePath(storageKey), {
    force: true,
  });
}

const localStorageAdapter: StorageAdapter = {
  name: "local",
  resolvePublicUrl(input) {
    return localPublicUrl(input);
  },
  normalizeVideoMetadata(input: StoredVideoMetadata) {
    return {
      ...input,
      fileName: trimValue(input.fileName),
      mimeType: trimValue(input.mimeType),
      fileSizeBytes: input.fileSizeBytes,
      playbackUrl: input.playbackUrl.trim(),
      thumbnailUrl: trimValue(input.thumbnailUrl),
      storageKey: trimValue(input.storageKey),
      providerAssetId: trimValue(input.providerAssetId),
    };
  },
  normalizeFileMetadata(input: StoredFileMetadata) {
    return {
      ...input,
      fileUrl: input.fileUrl.trim(),
      fileName: input.fileName.trim(),
      mimeType: input.mimeType.trim(),
      storageKey: trimValue(input.storageKey),
    };
  },
  async saveFile(input) {
    return saveLocalFile(input);
  },
  async deleteFile(input) {
    await deleteLocalFile(input);
  },
};

export function getStorageAdapter(): StorageAdapter {
  return localStorageAdapter;
}

export function normalizeStoredVideoMetadata(input: StoredVideoMetadata) {
  return getStorageAdapter().normalizeVideoMetadata(input);
}

export function normalizeStoredFileMetadata(input: StoredFileMetadata) {
  return getStorageAdapter().normalizeFileMetadata(input);
}

export function resolveStoredAssetUrl(input: { url?: string | null; storageKey?: string | null }) {
  return getStorageAdapter().resolvePublicUrl(input);
}

export async function saveUploadedFile(input: {
  file: {
    arrayBuffer(): Promise<ArrayBuffer>;
    name: string;
    size: number;
    type: string;
  };
  kind: AdminUploadKind;
}) {
  return getStorageAdapter().saveFile(input);
}

export async function deleteStoredAsset(input: { storageKey?: string | null; url?: string | null }) {
  await getStorageAdapter().deleteFile(input);
}

export function getUploadConstraint(kind: AdminUploadKind) {
  return uploadConstraints[kind];
}

export function isAllowedUploadType(kind: AdminUploadKind, mimeType: string) {
  return uploadConstraints[kind].allowedMimeTypes.includes(mimeType);
}
