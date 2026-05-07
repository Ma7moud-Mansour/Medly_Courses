"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, ImageIcon, Loader2, Paperclip, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminUploadKind } from "@/lib/storage/types";
import type { MediaProvider } from "@/types";

type UploadValue = {
  provider?: MediaProvider;
  url?: string;
  storageKey?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
};

type UploadFieldNames = {
  url: string;
  storageKey?: string;
  provider?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: string;
  durationSeconds?: string;
  thumbnailUrl?: string;
};

const KIND_ICONS = {
  video: Video,
  pdf: FileText,
  thumbnail: ImageIcon,
  attachment: Paperclip,
  receipt: FileText,
} as const;

function formatBytes(bytes?: number) {
  if (!bytes) return "حجم غير معروف";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploadField({
  kind,
  label,
  hint,
  helper,
  accept,
  current,
  fieldNames,
  className,
  required,
  showManualVideoFields = true,
}: {
  kind: AdminUploadKind;
  label: string;
  hint?: string;
  helper?: string;
  accept: string;
  current?: UploadValue;
  fieldNames: UploadFieldNames;
  className?: string;
  required?: boolean;
  showManualVideoFields?: boolean;
}) {
  const resolvedHint = hint ?? helper;
  const [asset, setAsset] = useState<UploadValue>({
    provider: current?.provider,
    url: current?.url,
    storageKey: current?.storageKey,
    fileName: current?.fileName,
    mimeType: current?.mimeType,
    fileSizeBytes: current?.fileSizeBytes,
    durationSeconds: current?.durationSeconds,
    thumbnailUrl: current?.thumbnailUrl,
  });
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const Icon = KIND_ICONS[kind];
  const canPreview = Boolean(asset.url && (asset.url.startsWith("/") || asset.url.startsWith("http")));
  const manualVideoUrl =
    kind === "video" && asset.url && asset.provider !== "local" && !asset.url.startsWith("medly-protected://")
      ? asset.url
      : "";
  const manualVideoProvider =
    kind === "video" && asset.provider && asset.provider !== "local" ? asset.provider : "custom";

  const uploadFile = (file: File) => {
    setError(undefined);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("file", file);

      try {
        const response = await fetch("/api/admin/uploads", {
          method: "POST",
          body: formData,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || `فشل رفع الملف. كود الخطأ: ${response.status}`);
        }

        if (!payload?.data) {
          throw new Error("تم الرفع لكن لم تصل بيانات الملف.");
        }

        setAsset({
          provider: payload.data.provider,
          url: payload.data.url,
          storageKey: payload.data.storageKey,
          fileName: payload.data.fileName,
          mimeType: payload.data.mimeType,
          fileSizeBytes: payload.data.fileSizeBytes,
          durationSeconds: payload.data.durationSeconds,
          thumbnailUrl: payload.data.thumbnailUrl,
        });
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "فشل رفع الملف.");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    });
  };

  return (
    <div className={className}>
      <div className="grid gap-3 rounded-lg border border-border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-sm font-black">
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
            {resolvedHint ? <p className="text-xs leading-6 text-muted-foreground">{resolvedHint}</p> : null}
          </div>

          {asset.url ? (
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-danger/30 px-3 text-sm font-bold text-danger transition hover:bg-danger/5"
              onClick={() =>
                setAsset({
                  provider: undefined,
                  url: "",
                  storageKey: "",
                  fileName: "",
                  mimeType: "",
                  fileSizeBytes: 0,
                  durationSeconds: undefined,
                  thumbnailUrl: "",
                })
              }
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </button>
          ) : null}
        </div>

        <div
          data-upload-has-file={asset.url ? "true" : "false"}
          data-upload-required={required ? "true" : "false"}
          data-upload-state={isPending ? "pending" : "idle"}
        >
          {asset.url ? (
            <div className="rounded-lg border border-border bg-[#fbfcfc] p-3 text-sm">
            <div className="grid gap-1">
              <p className="font-bold">{asset.fileName || "الملف المرفوع"}</p>
              <p className="text-xs text-muted-foreground">
                {(asset.provider || "local").toUpperCase()} • {asset.mimeType || "Unknown type"} •{" "}
                {formatBytes(asset.fileSizeBytes)}
              </p>
              {canPreview ? (
                <a
                  className="text-xs font-bold text-primary underline-offset-4 hover:underline"
                  href={asset.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  معاينة الملف
                </a>
              ) : (
                <span className="text-xs font-bold text-muted-foreground">محفوظ في تخزين محمي</span>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm font-bold text-muted-foreground">
            لم يتم رفع ملف هنا حتى الآن.
          </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            accept={accept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                uploadFile(file);
              }
            }}
            ref={fileInputRef}
            type="file"
          />

          <Button onClick={() => fileInputRef.current?.click()} type="button" variant="outline">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isPending ? "جاري الرفع..." : asset.url ? "تغيير الملف" : "رفع ملف"}
          </Button>

          {asset.fileName ? <span className="text-xs font-bold text-muted-foreground">{asset.fileName}</span> : null}
        </div>

        {required && !asset.url && !isPending ? (
          <p className="text-xs font-bold text-danger">هذا الملف مطلوب قبل الحفظ.</p>
        ) : null}
        {error ? <p className="text-xs font-bold text-danger">{error}</p> : null}

        {kind === "video" && showManualVideoFields ? (
          <div className="grid gap-3 border-t border-border pt-3 md:grid-cols-[1fr_220px]">
            <label className="grid gap-2 text-sm font-bold">
              رابط فيديو خارجي
              <input
                className="form-input"
                defaultValue={manualVideoUrl}
                name="manualVideoPlaybackUrl"
                placeholder="https://..."
                type="url"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              مزود الرابط
              <select className="form-input" defaultValue={manualVideoProvider} name="manualVideoProvider">
                <option value="custom">رابط مباشر</option>
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="bunny">Bunny</option>
              </select>
            </label>
          </div>
        ) : null}
      </div>

      <input name={fieldNames.url} type="hidden" value={asset.url ?? ""} />
      {fieldNames.storageKey ? <input name={fieldNames.storageKey} type="hidden" value={asset.storageKey ?? ""} /> : null}
      {fieldNames.provider ? <input name={fieldNames.provider} type="hidden" value={asset.provider ?? "local"} /> : null}
      {fieldNames.fileName ? <input name={fieldNames.fileName} type="hidden" value={asset.fileName ?? ""} /> : null}
      {fieldNames.mimeType ? <input name={fieldNames.mimeType} type="hidden" value={asset.mimeType ?? ""} /> : null}
      {fieldNames.fileSizeBytes ? (
        <input name={fieldNames.fileSizeBytes} type="hidden" value={String(asset.fileSizeBytes ?? 0)} />
      ) : null}
      {fieldNames.durationSeconds ? (
        <input name={fieldNames.durationSeconds} type="hidden" value={String(asset.durationSeconds ?? "")} />
      ) : null}
      {fieldNames.thumbnailUrl ? <input name={fieldNames.thumbnailUrl} type="hidden" value={asset.thumbnailUrl ?? ""} /> : null}
    </div>
  );
}
