"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Shield,
  TestTube2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  PLAYER_DEVICE_COOKIE_NAME,
  PLAYER_DEVICE_STORAGE_KEY,
} from "@/lib/media/constants";
import type {
  AntiPiracyEventType,
  Course,
  EffectiveStudentPermissions,
  Lesson,
  VideoWatermark,
} from "@/types";

const watermarkPositions = [
  "top-4 left-4",
  "top-4 right-4",
  "bottom-4 left-4",
  "bottom-4 right-4",
] as const;

const PROTECTION_MESSAGE = "Playback paused to protect course content.";

function VideoWatermarkOverlay({ watermark }: { watermark: VideoWatermark }) {
  const [positionIndex, setPositionIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPositionIndex((current) => (current + 1) % watermarkPositions.length);
    }, 15000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={`pointer-events-none absolute z-20 max-w-[45%] truncate rounded-md bg-black/20 px-2.5 py-1 text-[10px] font-bold text-white/70 shadow-sm backdrop-blur-[1px] transition-all duration-700 ${watermarkPositions[positionIndex]}`}
      title={watermark.displayName}
    >
      {watermark.displayName}
    </div>
  );
}

function buildPlayerCookie(deviceId: string) {
  return `${PLAYER_DEVICE_COOKIE_NAME}=${encodeURIComponent(deviceId)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function ensurePlaybackDeviceId() {
  const existingFromStorage = window.localStorage.getItem(PLAYER_DEVICE_STORAGE_KEY)?.trim();

  if (existingFromStorage) {
    document.cookie = buildPlayerCookie(existingFromStorage);
    return existingFromStorage;
  }

  const generated =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `medly-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(PLAYER_DEVICE_STORAGE_KEY, generated);
  document.cookie = buildPlayerCookie(generated);

  return generated;
}

function appendProbeQuery(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}probe=1`;
}

function queueAntiPiracyEvent(input: {
  eventType: AntiPiracyEventType;
  courseId: string;
  lessonId: string;
  enrollmentId?: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = JSON.stringify(input);
  const endpoint = "/api/media/events";

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  });
}

function VideoLessonContent({
  courseId,
  lesson,
  watermark,
  enrollmentId,
}: {
  courseId: string;
  lesson: Lesson;
  watermark: VideoWatermark;
  enrollmentId?: string;
}) {
  const sourceUrl = lesson.videoAsset?.playbackUrl ?? lesson.videoUrl;
  const isHtmlVideo =
    (lesson.videoAsset?.mimeType?.startsWith("video/") ?? false) ||
    sourceUrl?.includes("/api/media/asset");
  const isProtectedPlayback = Boolean(sourceUrl?.includes("/api/media/asset"));
  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const deviceIdRef = useRef<string | undefined>(undefined);
  const hadFullscreenRef = useRef(false);
  const shouldResumePlaybackRef = useRef(false);
  const [sourceReady, setSourceReady] = useState(() => !isProtectedPlayback);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(() =>
    isProtectedPlayback ? "Preparing protected playback..." : null,
  );
  const [protectionVisible, setProtectionVisible] = useState(false);
  const [protectionMessage, setProtectionMessage] = useState(PROTECTION_MESSAGE);

  const reportEvent = useCallback(
    (eventType: AntiPiracyEventType, metadata?: Record<string, unknown>) => {
      queueAntiPiracyEvent({
        eventType,
        courseId,
        lessonId: lesson.id,
        enrollmentId,
        deviceId: deviceIdRef.current,
        metadata,
      });
    },
    [courseId, enrollmentId, lesson.id],
  );

  const pauseProtectedPlayback = useCallback(
    (eventType: AntiPiracyEventType, message = PROTECTION_MESSAGE, metadata?: Record<string, unknown>) => {
      shouldResumePlaybackRef.current = Boolean(videoRef.current && !videoRef.current.paused);

      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }

      setProtectionMessage(message);
      setProtectionVisible(true);
      reportEvent(eventType, metadata);
    },
    [reportEvent],
  );

  const handleResume = useCallback(async () => {
    setProtectionVisible(false);
    setProtectionMessage(PROTECTION_MESSAGE);
    reportEvent("VIDEO_RESUME_AFTER_PROTECTION");

    if (shouldResumePlaybackRef.current && videoRef.current) {
      try {
        await videoRef.current.play();
      } catch {
        // Browsers may still require an additional native interaction to resume.
      }
    }
  }, [reportEvent]);

  useEffect(() => {
    if (!isProtectedPlayback) {
      return;
    }

    let cancelled = false;

    void Promise.resolve()
      .then(async () => {
        const resolvedDeviceId = ensurePlaybackDeviceId();
        deviceIdRef.current = resolvedDeviceId;

        const response = await fetch(appendProbeQuery(sourceUrl!), {
          credentials: "include",
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Protected playback is unavailable on this device.");
        }

        if (!cancelled) {
          setSourceReady(true);
          setLoadingMessage(null);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setSourceReady(false);
          setLoadingMessage(error.message || "Protected playback is unavailable on this device.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isProtectedPlayback, sourceUrl]);

  useEffect(() => {
    if (!sourceReady) {
      return undefined;
    }

    // Browsers cannot fully prevent screenshots or recording, so this layer is a
    // deterrence system: it pauses playback, blacks out the player, and logs the
    // suspicious action for server-side review.
    const handleWindowBlur = () => {
      pauseProtectedPlayback("VIDEO_WINDOW_BLUR");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseProtectedPlayback("VIDEO_TAB_HIDDEN");
      }
    };

    const handleFullscreenChange = () => {
      const activeFullscreenElement = document.fullscreenElement;

      if (activeFullscreenElement === playerRef.current) {
        hadFullscreenRef.current = true;
        return;
      }

      if (hadFullscreenRef.current && !activeFullscreenElement) {
        hadFullscreenRef.current = false;
        pauseProtectedPlayback("VIDEO_FULLSCREEN_EXIT");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toUpperCase();
      const isPrintScreen = event.key === "PrintScreen" || event.code === "PrintScreen";
      const isDevtoolsShortcut =
        event.key === "F12" ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && ["I", "J"].includes(normalizedKey)) ||
        ((event.ctrlKey || event.metaKey) && ["U", "S"].includes(normalizedKey));

      if (isPrintScreen) {
        event.preventDefault();
        pauseProtectedPlayback("VIDEO_PRINTSCREEN_ATTEMPT");
        return;
      }

      if (isDevtoolsShortcut) {
        event.preventDefault();
        pauseProtectedPlayback("VIDEO_DEVTOOLS_SHORTCUT", PROTECTION_MESSAGE, {
          shortcut: event.key,
        });
      }
    };

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      pauseProtectedPlayback("VIDEO_COPY_ATTEMPT");
    };

    const handleCut = (event: ClipboardEvent) => {
      event.preventDefault();
      pauseProtectedPlayback("VIDEO_COPY_ATTEMPT");
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
    };
  }, [pauseProtectedPlayback, sourceReady]);

  const blockedOverlay = useMemo(() => {
    if (loadingMessage && !sourceReady) {
      return (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#02110e]/96 px-6 text-center text-sm font-bold text-white">
          <div className="max-w-md rounded-lg border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
            {loadingMessage}
          </div>
        </div>
      );
    }

    if (protectionVisible) {
      return (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/95 px-6 text-center text-sm font-bold text-white">
          <div className="max-w-md rounded-xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg backdrop-blur-sm">
            <p>{protectionMessage}</p>
            <Button className="mt-4 min-w-32" onClick={handleResume} size="sm">
              Resume
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }, [handleResume, loadingMessage, protectionMessage, protectionVisible, sourceReady]);

  return (
    <div
      ref={playerRef}
      className="relative overflow-hidden rounded-lg bg-black shadow-2xl select-none"
      onContextMenu={(event) => {
        event.preventDefault();
        pauseProtectedPlayback("VIDEO_CONTEXT_MENU");
      }}
      onDragStart={(event) => {
        event.preventDefault();
        pauseProtectedPlayback("VIDEO_DRAG_ATTEMPT");
      }}
    >
      <VideoWatermarkOverlay watermark={watermark} />
      {blockedOverlay}
      {sourceUrl ? (
        isHtmlVideo ? (
          <video
            ref={videoRef}
            className="aspect-video h-full w-full"
            controls
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            playsInline
            preload="metadata"
            src={sourceReady ? sourceUrl : undefined}
            onError={() => {
              if (sourceReady) {
                setProtectionMessage("Protected playback is unavailable on this device right now.");
                setProtectionVisible(true);
              }
            }}
          />
        ) : (
          <iframe
            allow="autoplay; fullscreen"
            className="aspect-video h-full w-full"
            src={sourceUrl}
            title={lesson.title}
          />
        )
      ) : (
        <div className="grid min-h-[420px] place-items-center bg-[#09211d] text-sm font-bold text-white/75">
          No video has been uploaded for this lesson yet.
        </div>
      )}
    </div>
  );
}

function LessonContent({
  courseId,
  lesson,
  watermark,
  enrollmentId,
}: {
  courseId: string;
  lesson: Lesson;
  watermark: VideoWatermark;
  enrollmentId?: string;
}) {
  const primaryAttachment = lesson.attachments?.[0];

  if (lesson.lessonType === "text") {
    return (
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Text lesson</h2>
        <div className="mt-4 whitespace-pre-wrap leading-8 text-foreground/90">
          {lesson.contentBody?.trim() ||
            "No text content was added to this lesson yet."}
        </div>
      </div>
    );
  }

  if (lesson.lessonType === "pdf") {
    if (!primaryAttachment?.fileUrl) {
      return (
        <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-border bg-white p-6 text-sm font-bold text-muted-foreground">
          No PDF is linked to this lesson yet.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <iframe
            className="h-[560px] w-full bg-white"
            src={primaryAttachment.fileUrl}
            title={lesson.title}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            className={buttonVariants({
              variant: primaryAttachment.allowDownload ? "primary" : "outline",
            })}
            download={
              primaryAttachment.allowDownload
                ? primaryAttachment.fileName
                : undefined
            }
            href={primaryAttachment.fileUrl}
            rel="noreferrer"
            target="_blank"
          >
            {primaryAttachment.allowDownload ? (
              <Download className="h-4 w-4" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {primaryAttachment.allowDownload ? "Open or download PDF" : "Open PDF"}
          </a>
        </div>
      </div>
    );
  }

  if (lesson.lessonType === "attachment") {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-border bg-white p-6 text-center">
        <div className="max-w-md">
          <FileText className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-black">Resource lesson</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            This lesson is based on protected resources prepared by the
            instructor.
          </p>
        </div>
      </div>
    );
  }

  if (lesson.lessonType === "quiz") {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-border bg-white p-6 text-center">
        <div className="max-w-md">
          <TestTube2 className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-black">Quiz placeholder</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            This lesson is reserved for quiz delivery and will switch to the
            exam flow once the quiz is attached.
          </p>
        </div>
      </div>
    );
  }

  return (
    <VideoLessonContent
      courseId={courseId}
      enrollmentId={enrollmentId}
      lesson={lesson}
      watermark={watermark}
    />
  );
}

export function CoursePlayer({
  course,
  lesson,
  permissions,
  watermark,
  enrollmentId,
  initialCompleted = false,
}: {
  course: Course;
  lesson: Lesson;
  permissions: EffectiveStudentPermissions;
  watermark: VideoWatermark;
  enrollmentId?: string;
  initialCompleted?: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/progress/lesson-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId: lesson.id }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(payload?.error ?? "Progress could not be updated right now.");
        return;
      }

      setCompleted(true);
      setFeedback(
        payload?.data?.nextLessonUnlocked
          ? "Progress saved and the next lesson is now unlocked."
          : "Progress saved for this lesson.",
      );
    });
  }

  return (
    <div className="min-h-screen bg-[#f6fbf8]">
      <div className="bg-[#0f2f2a] p-4 text-white lg:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/75">
            <span className="rounded-lg bg-white/10 px-3 py-1">
              {lesson.lessonType ?? "video"}
            </span>
            {lesson.videoAsset?.provider ? (
              <span className="rounded-lg bg-white/10 px-3 py-1">
                {lesson.videoAsset.provider}
              </span>
            ) : null}
            {lesson.videoAsset?.durationSeconds ? (
              <span className="rounded-lg bg-white/10 px-3 py-1">
                {Math.ceil(lesson.videoAsset.durationSeconds / 60)} min
              </span>
            ) : null}
            {!permissions.canDownloadVideos ? (
              <span className="rounded-lg bg-white/10 px-3 py-1">
                Streaming only
              </span>
            ) : null}
            <span className="rounded-lg bg-[#f4b942]/20 px-3 py-1 text-[#f7d88d]">
              <Shield className="mr-1 inline h-3.5 w-3.5" />
              Watermarked playback
            </span>
          </div>

          <div className="mt-4">
            <LessonContent
              courseId={course.id}
              enrollmentId={enrollmentId}
              lesson={lesson}
              watermark={watermark}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black text-primary">{course.title}</p>
            <h1 className="mt-1 text-3xl font-black">{lesson.title}</h1>
            <p className="mt-2 leading-7 text-muted-foreground">
              {lesson.summary ||
                "This lesson is tracked against your real Medly enrollment and progress record."}
            </p>
            {feedback ? (
              <p className="mt-3 text-sm font-bold text-primary">{feedback}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isPending}
              onClick={handleComplete}
              variant={completed ? "outline" : "primary"}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending ? "Saving..." : completed ? "Completed" : "Mark complete"}
            </Button>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/courses/${course.slug}`}
            >
              Back to course
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
