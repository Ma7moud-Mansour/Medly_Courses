import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/auth/server-session";
import { deleteStoredAsset, getUploadConstraint, isAllowedUploadType, saveUploadedFile } from "@/lib/storage";
import { createVodafoneCashOrder } from "@/lib/payments/repository";
import { checkoutSchema } from "@/lib/validators/schemas";

export const runtime = "nodejs";

function inferMimeType(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".pdf")) return "application/pdf";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function getOptionalFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function getRequiredFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  const session = await requireServerSession();
  const formData = await request.formData();
  const courseIds = formData
    .getAll("courseId")
    .map((value) => String(value))
    .filter(Boolean);

  const parsed = checkoutSchema.safeParse({
    paymentMethod: getRequiredFormText(formData, "paymentMethod"),
    transactionReference: getOptionalFormText(formData, "transactionReference"),
    senderPhone: getOptionalFormText(formData, "senderPhone"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Checkout data is invalid.",
      },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("receipt");

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "Upload a receipt image or PDF." }, { status: 400 });
  }

  const mimeType = fileEntry.type || inferMimeType(fileEntry.name);
  const constraints = getUploadConstraint("receipt");

  if (!isAllowedUploadType("receipt", mimeType)) {
    return NextResponse.json({ error: "Receipt type is not supported." }, { status: 415 });
  }

  if (constraints.maxBytes && fileEntry.size > constraints.maxBytes) {
    return NextResponse.json({ error: "Receipt file is too large." }, { status: 413 });
  }

  let uploadedReceipt:
    | {
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
        storageKey: string;
        url: string;
      }
    | undefined;

  try {
    uploadedReceipt = await saveUploadedFile({
      kind: "receipt",
      file: {
        arrayBuffer: () => fileEntry.arrayBuffer(),
        name: fileEntry.name,
        size: fileEntry.size,
        type: mimeType,
      },
    });

    const order = await createVodafoneCashOrder({
      userId: session.userId,
      courseIds,
      couponCode: getOptionalFormText(formData, "couponCode"),
      transactionReference: parsed.data.transactionReference || undefined,
      senderPhone: parsed.data.senderPhone || undefined,
      receipt: {
        fileName: uploadedReceipt.fileName,
        mimeType: uploadedReceipt.mimeType,
        fileSizeBytes: uploadedReceipt.fileSizeBytes,
        storageKey: uploadedReceipt.storageKey,
        url: uploadedReceipt.url,
      },
    });

    return NextResponse.json({
      data: {
        orderId: order.id,
        status: order.status,
        internalPaymentCode: order.internalPaymentCode,
      },
    });
  } catch (error) {
    if (uploadedReceipt) {
      await deleteStoredAsset({
        storageKey: uploadedReceipt.storageKey,
        url: uploadedReceipt.url,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Checkout could not be completed.",
      },
      { status: 400 },
    );
  }
}
