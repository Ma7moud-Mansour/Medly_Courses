import { NextResponse } from "next/server";
import { requireServerRole } from "@/lib/auth/server-session";
import { deleteStoredAsset, getUploadConstraint, isAllowedUploadType, saveUploadedFile } from "@/lib/storage";
import { adminUploadSchema } from "@/lib/validators/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

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

export async function POST(request: Request) {
  try {
    await requireServerRole(["admin"]);

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
    const constraints = getUploadConstraint(parsed.data.kind);

    if (!isAllowedUploadType(parsed.data.kind, mimeType)) {
      return NextResponse.json(
        {
          error: "This file type is not allowed for the selected field.",
          receivedMimeType: mimeType,
          allowedMimeTypes: constraints.allowedMimeTypes,
        },
        { status: 415 },
      );
    }

    if (fileEntry.size > constraints.maxBytes) {
      return NextResponse.json(
        {
          error: "The uploaded file exceeds the allowed size limit.",
          fileSizeBytes: fileEntry.size,
          maxBytes: constraints.maxBytes,
        },
        { status: 413 },
      );
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

    return NextResponse.json({
      data: {
        kind: parsed.data.kind,
        provider: uploaded.provider,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        fileSizeBytes: uploaded.fileSizeBytes,
        storageKey: uploaded.storageKey,
        url: uploaded.url,
      },
    });
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
            ? "The uploaded file is too large for this server. Use an external video URL for large lessons."
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
