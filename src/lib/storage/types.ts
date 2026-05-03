import type { MediaProvider, MediaVisibilityStatus } from "@/types";

export type AdminUploadKind = "video" | "pdf" | "attachment" | "thumbnail" | "receipt";

export type UploadableFile = {
  arrayBuffer(): Promise<ArrayBuffer>;
  name: string;
  size: number;
  type: string;
};

export type StoredVideoMetadata = {
  provider: MediaProvider;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  playbackUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  storageKey?: string;
  providerAssetId?: string;
  visibilityStatus: MediaVisibilityStatus;
};

export type StoredFileMetadata = {
  provider: MediaProvider;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey?: string;
  visibilityStatus: MediaVisibilityStatus;
};

export type UploadedAsset = {
  provider: MediaProvider;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  url: string;
  isPublic?: boolean;
};

export interface StorageAdapter {
  readonly name: MediaProvider | "composite";
  resolvePublicUrl(input: { url?: string | null; storageKey?: string | null }): string | undefined;
  normalizeVideoMetadata(input: StoredVideoMetadata): StoredVideoMetadata;
  normalizeFileMetadata(input: StoredFileMetadata): StoredFileMetadata;
  saveFile(input: { file: UploadableFile; kind: AdminUploadKind }): Promise<UploadedAsset>;
  deleteFile(input: { storageKey?: string | null; url?: string | null }): Promise<void>;
}
