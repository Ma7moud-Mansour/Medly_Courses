import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  deleteStoredAsset,
  normalizeStoredFileMetadata,
  normalizeStoredVideoMetadata,
  resolveStoredAssetUrl,
} from "@/lib/storage";
import {
  buildProtectedAssetUrl,
  buildVideoWatermark,
  requiresProtectedAssetUrl,
  signProtectedAssetToken,
} from "@/lib/media/access";
import type {
  Course,
  CurriculumChapter,
  EffectiveStudentPermissions,
  Lesson,
  LessonAttachment,
  LessonType,
  LessonVideoAsset,
  MediaProvider,
  MediaVisibilityStatus,
  VideoWatermark,
} from "@/types";

const adminCourseEditorInclude = Prisma.validator<Prisma.CourseInclude>()({
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  instructor: {
    select: {
      id: true,
      name: true,
      slug: true,
      title: true,
      avatar: true,
      bio: true,
      specialization: true,
    },
  },
  chapters: {
    orderBy: {
      order: "asc",
    },
    include: {
      lessons: {
        orderBy: {
          order: "asc",
        },
        include: {
          videoAsset: true,
          attachments: {
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  },
});

const learningCourseInclude = Prisma.validator<Prisma.CourseInclude>()({
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  instructor: {
    select: {
      id: true,
      name: true,
      slug: true,
      title: true,
      avatar: true,
      bio: true,
      specialization: true,
    },
  },
  chapters: {
    where: {
      isPublished: true,
    },
    orderBy: {
      order: "asc",
    },
    include: {
      lessons: {
        where: {
          isPublished: true,
        },
        orderBy: {
          order: "asc",
        },
        include: {
          videoAsset: true,
          attachments: {
            where: {
              isPublished: true,
              visibilityStatus: {
                not: "hidden",
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  },
});

type AdminCourseRecord = Prisma.CourseGetPayload<{
  include: typeof adminCourseEditorInclude;
}>;

// This repository keeps curriculum editing and student delivery aligned against
// the same Prisma-backed source of truth.
type EnrollmentWithCourseRecord = Prisma.EnrollmentGetPayload<{
  include: {
    course: {
      include: typeof learningCourseInclude;
    };
  };
}>;

export type AdminCourseOption = {
  id: string;
  name: string;
  slug: string;
};

export type AdminCourseEditorLesson = Omit<Lesson, "attachments" | "videoAsset"> & {
  videoAsset?: LessonVideoAsset;
  attachments?: LessonAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type AdminCourseEditorSection = Omit<CurriculumChapter, "lessons"> & {
  createdAt: string;
  updatedAt: string;
  lessons: AdminCourseEditorLesson[];
};

export type AdminCourseEditorData = {
  course: Course & {
    categoryName: string;
    instructorName: string;
  };
  categories: AdminCourseOption[];
  instructors: AdminCourseOption[];
  sections: AdminCourseEditorSection[];
};

export type LearningCourseView = {
  course: Course & {
    categoryName: string;
    categorySlug: string;
    instructorName: string;
    instructorSlug: string;
  };
  curriculum: Array<
    CurriculumChapter & {
      lessons: Lesson[];
    }
  >;
  enrollment: {
    id: string;
    progress: number;
    completed: boolean;
    lastLessonId?: string;
    accessStatus: "active" | "revoked" | "expired";
    expiresAt?: string;
  };
  lessonProgress: Record<string, { completed: boolean; positionSeconds: number }>;
  permissions: EffectiveStudentPermissions;
  watermark: VideoWatermark;
};

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function toCourse(course: Pick<
  AdminCourseRecord,
  | "id"
  | "title"
  | "slug"
  | "subtitle"
  | "description"
  | "thumbnail"
  | "isPublished"
  | "previewVideo"
  | "price"
  | "discountPrice"
  | "rating"
  | "reviewsCount"
  | "studentsCount"
  | "durationHours"
  | "lessonsCount"
  | "level"
  | "language"
  | "lastUpdated"
  | "featured"
  | "bestseller"
  | "examPrep"
  | "categoryId"
  | "instructorId"
>): Course {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle ?? undefined,
    description: course.description,
    thumbnail: resolveStoredAssetUrl({ url: course.thumbnail }) ?? course.thumbnail,
    isPublished: course.isPublished,
    previewVideo: course.previewVideo ?? undefined,
    price: course.price,
    discountPrice: course.discountPrice ?? undefined,
    rating: course.rating,
    reviewsCount: course.reviewsCount,
    studentsCount: course.studentsCount,
    durationHours: course.durationHours,
    lessonsCount: course.lessonsCount,
    level: course.level as Course["level"],
    language: course.language,
    lastUpdated: toIso(course.lastUpdated),
    featured: course.featured,
    bestseller: course.bestseller,
    examPrep: course.examPrep,
    categoryId: course.categoryId,
    instructorId: course.instructorId,
    tags: [],
    learningOutcomes: [],
    requirements: [],
  };
}

function mapVideoAsset(
  asset?: {
    id: string;
    lessonId: string;
    provider: MediaProvider;
    providerAssetId: string | null;
    fileName: string | null;
    mimeType: string | null;
    fileSizeBytes: number | null;
    playbackUrl: string;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    storageKey: string | null;
    visibilityStatus: MediaVisibilityStatus;
  } | null,
): LessonVideoAsset | undefined {
  if (!asset) {
    return undefined;
  }

  return {
    id: asset.id,
    lessonId: asset.lessonId,
    provider: asset.provider,
    providerAssetId: asset.providerAssetId ?? undefined,
    fileName: asset.fileName ?? undefined,
    mimeType: asset.mimeType ?? undefined,
    fileSizeBytes: asset.fileSizeBytes ?? undefined,
    playbackUrl: resolveStoredAssetUrl({ url: asset.playbackUrl, storageKey: asset.storageKey }) ?? asset.playbackUrl,
    thumbnailUrl:
      resolveStoredAssetUrl({ url: asset.thumbnailUrl, storageKey: asset.storageKey }) ?? asset.thumbnailUrl ?? undefined,
    durationSeconds: asset.durationSeconds ?? undefined,
    storageKey: asset.storageKey ?? undefined,
    visibilityStatus: asset.visibilityStatus,
  };
}

function mapAttachment(
  attachment: {
    id: string;
    lessonId: string;
    title: string | null;
    fileName: string;
    fileUrl: string;
    storageKey: string | null;
    provider: MediaProvider;
    mimeType: string;
    fileSizeBytes: number;
    order: number;
    isPublished: boolean;
    allowDownload: boolean;
    visibilityStatus: MediaVisibilityStatus;
  },
): LessonAttachment {
  return {
    id: attachment.id,
    lessonId: attachment.lessonId,
    title: attachment.title ?? undefined,
    fileName: attachment.fileName,
    fileUrl: resolveStoredAssetUrl({ url: attachment.fileUrl, storageKey: attachment.storageKey }) ?? attachment.fileUrl,
    storageKey: attachment.storageKey ?? undefined,
    provider: attachment.provider,
    mimeType: attachment.mimeType,
    fileSizeBytes: attachment.fileSizeBytes,
    order: attachment.order,
    isPublished: attachment.isPublished,
    allowDownload: attachment.allowDownload,
    visibilityStatus: attachment.visibilityStatus,
  };
}

function mapLesson(
  lesson: AdminCourseRecord["chapters"][number]["lessons"][number],
  options?: {
    isAccessible?: boolean;
    lockedReason?: string;
    allowDownload?: boolean;
  },
): Lesson {
  const videoAsset = mapVideoAsset(lesson.videoAsset);
  const attachments = lesson.attachments.map(mapAttachment);

  return {
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    order: lesson.order,
    lessonType: lesson.lessonType as LessonType,
    summary: lesson.summary ?? undefined,
    contentBody: lesson.contentBody ?? undefined,
    durationMinutes: lesson.durationMinutes,
    videoUrl: videoAsset?.playbackUrl,
    videoAsset,
    isPreview: lesson.isPreview,
    isPublished: lesson.isPublished,
    chapterId: lesson.chapterId,
    quizRequired: lesson.quizRequired,
    resources: attachments.map((attachment) => attachment.title || attachment.fileName),
    attachments: attachments.map((attachment) => ({
      ...attachment,
      allowDownload: options?.allowDownload ? attachment.allowDownload : false,
    })),
    isAccessible: options?.isAccessible ?? lesson.isPublished,
    lockedReason: options?.lockedReason,
  };
}

async function signLessonVideoUrl(input: {
  viewerUserId: string;
  lessonId: string;
  enrollmentId: string;
  fileName?: string;
  mimeType?: string;
  storageKey?: string;
  fallbackUrl?: string;
}) {
  if (!input.storageKey || !requiresProtectedAssetUrl({ storageKey: input.storageKey, url: input.fallbackUrl })) {
    return input.fallbackUrl;
  }

  const token = await signProtectedAssetToken({
    userId: input.viewerUserId,
    kind: "lesson-video",
    storageKey: input.storageKey,
    lessonId: input.lessonId,
    enrollmentId: input.enrollmentId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    allowDownload: false,
  });

  return buildProtectedAssetUrl(token);
}

async function signLessonAttachmentUrl(input: {
  viewerUserId: string;
  lessonId: string;
  enrollmentId: string;
  fileName: string;
  mimeType: string;
  storageKey?: string;
  fallbackUrl?: string;
  allowDownload: boolean;
}) {
  if (!input.storageKey || !requiresProtectedAssetUrl({ storageKey: input.storageKey, url: input.fallbackUrl })) {
    return input.fallbackUrl;
  }

  const token = await signProtectedAssetToken({
    userId: input.viewerUserId,
    kind: "lesson-attachment",
    storageKey: input.storageKey,
    lessonId: input.lessonId,
    enrollmentId: input.enrollmentId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    allowDownload: input.allowDownload,
  });

  return buildProtectedAssetUrl(token, input.allowDownload);
}

async function signLessonForViewer(input: {
  lesson: Lesson;
  viewerUserId: string;
  enrollmentId: string;
}) {
  const signedVideoUrl = input.lesson.videoAsset
    ? await signLessonVideoUrl({
        viewerUserId: input.viewerUserId,
        lessonId: input.lesson.id,
        enrollmentId: input.enrollmentId,
        fileName: input.lesson.videoAsset.fileName,
        mimeType: input.lesson.videoAsset.mimeType,
        storageKey: input.lesson.videoAsset.storageKey,
        fallbackUrl: input.lesson.videoAsset.playbackUrl,
      })
    : input.lesson.videoUrl;

  const signedAttachments = await Promise.all(
    (input.lesson.attachments ?? []).map(async (attachment) => ({
      ...attachment,
      fileUrl:
        (await signLessonAttachmentUrl({
          viewerUserId: input.viewerUserId,
          lessonId: input.lesson.id,
          enrollmentId: input.enrollmentId,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          storageKey: attachment.storageKey,
          fallbackUrl: attachment.fileUrl,
          allowDownload: attachment.allowDownload,
        })) ?? attachment.fileUrl,
    })),
  );

  return {
    ...input.lesson,
    videoUrl: signedVideoUrl,
    videoAsset: input.lesson.videoAsset
      ? {
          ...input.lesson.videoAsset,
          playbackUrl: signedVideoUrl ?? input.lesson.videoAsset.playbackUrl,
        }
      : undefined,
    attachments: signedAttachments,
  };
}

function mapSection(
  chapter: AdminCourseRecord["chapters"][number],
  lessonOptions?: Parameters<typeof mapLesson>[1],
): AdminCourseEditorSection {
  return {
    id: chapter.id,
    title: chapter.title,
    description: chapter.description ?? undefined,
    order: chapter.order,
    isPublished: chapter.isPublished,
    courseId: chapter.courseId,
    createdAt: chapter.createdAt.toISOString(),
    updatedAt: chapter.updatedAt.toISOString(),
    lessons: chapter.lessons.map((lesson) => ({
      ...mapLesson(lesson, lessonOptions),
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    })),
  };
}

async function refreshCourseDerivedFields(
  tx: Prisma.TransactionClient,
  courseId: string,
) {
  const chapters = await tx.courseChapter.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    include: {
      lessons: {
        where: {
          isPublished: true,
        },
        select: {
          id: true,
          durationMinutes: true,
        },
      },
    },
  });

  const totalMinutes = chapters.flatMap((chapter) => chapter.lessons).reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
  const lessonsCount = chapters.flatMap((chapter) => chapter.lessons).length;

  await tx.course.update({
    where: { id: courseId },
    data: {
      durationHours: totalMinutes ? Math.max(1, Math.ceil(totalMinutes / 60)) : 0,
      lessonsCount,
      lastUpdated: new Date(),
    },
  });
}

async function createContentAuditLog(
  tx: Prisma.TransactionClient,
  input: {
    adminId: string;
    courseId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await tx.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

function buildPermissions(input: {
  userStatus: "active" | "blocked" | "suspended";
  accessStatus: "active" | "revoked" | "expired" | "inactive";
  coursePublished: boolean;
  canTakeExam?: boolean | null;
  canAccessLive?: boolean | null;
  canDownloadVideos?: boolean | null;
  hideAssignments?: boolean | null;
  hideForum?: boolean | null;
  customNote?: string | null;
}): EffectiveStudentPermissions {
  const canAccessPortal = input.userStatus === "active";
  const canAccessCourse = canAccessPortal && input.coursePublished && input.accessStatus === "active";

  return {
    canAccessPortal,
    canAccessCourse,
    canTakeExam: input.canTakeExam ?? true,
    canAccessLive: input.canAccessLive ?? true,
    canDownloadVideos: input.canDownloadVideos ?? false,
    hideAssignments: input.hideAssignments ?? false,
    hideForum: input.hideForum ?? false,
    status: input.userStatus,
    accessStatus: input.accessStatus,
    coursePublished: input.coursePublished,
    customNote: input.customNote ?? undefined,
  };
}

export async function listAdminCourseFormOptions() {
  const [categories, instructors] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.instructor.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return {
    categories: categories as AdminCourseOption[],
    instructors: instructors as AdminCourseOption[],
  };
}

export async function getAdminCourseEditorData(courseId: string): Promise<AdminCourseEditorData | undefined> {
  const [course, options] = await Promise.all([
    prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: adminCourseEditorInclude,
    }),
    listAdminCourseFormOptions(),
  ]);

  if (!course) {
    return undefined;
  }

  return {
    course: {
      ...toCourse(course),
      categoryName: course.category.name,
      instructorName: course.instructor.name,
    },
    categories: options.categories,
    instructors: options.instructors,
    sections: course.chapters.map((chapter) => mapSection(chapter)),
  };
}

export async function createAdminCourse(input: {
  adminId: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  thumbnail: string;
  price: number;
  discountPrice?: number;
  categoryId: string;
  instructorId: string;
  level: Course["level"];
  language?: string;
  isPublished?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  examPrep?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title: input.title.trim(),
        slug: input.slug.trim(),
        subtitle: input.subtitle?.trim() || null,
        description: input.description.trim(),
        thumbnail: input.thumbnail.trim(),
        price: input.price,
        discountPrice: input.discountPrice ?? null,
        categoryId: input.categoryId,
        instructorId: input.instructorId,
        level: input.level,
        language: input.language?.trim() || "العربية",
        isPublished: input.isPublished ?? false,
        featured: input.featured ?? false,
        bestseller: input.bestseller ?? false,
        examPrep: input.examPrep ?? false,
      },
    });

    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: course.id,
      action: "create_course_content_shell",
      entityType: "Course",
      entityId: course.id,
      metadata: {
        slug: course.slug,
      },
    });

    return course;
  });
}

export async function updateAdminCourse(input: {
  adminId: string;
  courseId: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  thumbnail: string;
  price: number;
  discountPrice?: number;
  categoryId: string;
  instructorId: string;
  level: Course["level"];
  language?: string;
  isPublished?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  examPrep?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const course = await tx.course.update({
      where: {
        id: input.courseId,
      },
      data: {
        title: input.title.trim(),
        slug: input.slug.trim(),
        subtitle: input.subtitle?.trim() || null,
        description: input.description.trim(),
        thumbnail: input.thumbnail.trim(),
        price: input.price,
        discountPrice: input.discountPrice ?? null,
        categoryId: input.categoryId,
        instructorId: input.instructorId,
        level: input.level,
        language: input.language?.trim() || "العربية",
        isPublished: input.isPublished ?? false,
        featured: input.featured ?? false,
        bestseller: input.bestseller ?? false,
        examPrep: input.examPrep ?? false,
        lastUpdated: new Date(),
      },
    });

    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: course.id,
      action: "update_course_metadata",
      entityType: "Course",
      entityId: course.id,
      metadata: {
        slug: course.slug,
      },
    });

    return course;
  });
}

export async function createCourseSection(input: {
  adminId: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const section = await tx.courseChapter.create({
      data: {
        courseId: input.courseId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        order: input.order,
        isPublished: input.isPublished,
      },
    });

    await refreshCourseDerivedFields(tx, input.courseId);
    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: input.courseId,
      action: "create_course_section",
      entityType: "CourseChapter",
      entityId: section.id,
      metadata: {
        title: section.title,
        order: section.order,
      },
    });

    return section;
  });
}

export async function updateCourseSection(input: {
  adminId: string;
  sectionId: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const section = await tx.courseChapter.update({
      where: {
        id: input.sectionId,
      },
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        order: input.order,
        isPublished: input.isPublished,
      },
    });

    await refreshCourseDerivedFields(tx, section.courseId);
    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: section.courseId,
      action: "update_course_section",
      entityType: "CourseChapter",
      entityId: section.id,
      metadata: {
        title: section.title,
        order: section.order,
        isPublished: section.isPublished,
      },
    });

    return section;
  });
}

export async function deleteCourseSection(input: {
  adminId: string;
  sectionId: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const section = await tx.courseChapter.delete({
      where: {
        id: input.sectionId,
      },
      include: {
        lessons: {
          include: {
            videoAsset: true,
            attachments: true,
          },
        },
      },
    });

    await refreshCourseDerivedFields(tx, section.courseId);
    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: section.courseId,
      action: "delete_course_section",
      entityType: "CourseChapter",
      entityId: section.id,
      metadata: {
        title: section.title,
        lessonsCount: section.lessons.length,
      },
    });

    return {
      sectionId: section.id,
      removedAssets: section.lessons.flatMap((lesson) => [
        ...(lesson.videoAsset
          ? [
              {
                storageKey: lesson.videoAsset.storageKey,
                url: lesson.videoAsset.playbackUrl,
              },
            ]
          : []),
        ...lesson.attachments.map((attachment) => ({
          storageKey: attachment.storageKey,
          url: attachment.fileUrl,
        })),
      ]),
    };
  });

  await Promise.all(result.removedAssets.map((asset) => deleteStoredAsset(asset)));

  return result.sectionId;
}

async function syncLessonVideoAsset(
  tx: Prisma.TransactionClient,
  lessonId: string,
  input?:
    | {
        provider: MediaProvider;
        providerAssetId?: string;
        fileName?: string;
        mimeType?: string;
        fileSizeBytes?: number;
        playbackUrl: string;
        thumbnailUrl?: string;
        durationSeconds?: number;
        storageKey?: string;
        visibilityStatus: MediaVisibilityStatus;
      }
    | undefined,
) {
  const existingAsset = await tx.lessonVideoAsset.findUnique({
    where: { lessonId },
    select: {
      id: true,
      storageKey: true,
      playbackUrl: true,
    },
  });

  if (!input?.playbackUrl?.trim()) {
    await tx.lessonVideoAsset.deleteMany({
      where: { lessonId },
    });
    return {
      asset: undefined,
      removedAsset:
        existingAsset?.storageKey || existingAsset?.playbackUrl
          ? {
              storageKey: existingAsset?.storageKey,
              url: existingAsset?.playbackUrl,
            }
          : undefined,
    };
  }

  const normalized = normalizeStoredVideoMetadata({
    provider: input.provider,
    providerAssetId: input.providerAssetId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    playbackUrl: input.playbackUrl,
    thumbnailUrl: input.thumbnailUrl,
    durationSeconds: input.durationSeconds,
    storageKey: input.storageKey,
    visibilityStatus: input.visibilityStatus,
  });

  const asset = await tx.lessonVideoAsset.upsert({
    where: {
      lessonId,
    },
    update: normalized,
    create: {
      lessonId,
      ...normalized,
    },
  });

  const removedAsset =
    existingAsset &&
    (existingAsset.storageKey !== normalized.storageKey || existingAsset.playbackUrl !== normalized.playbackUrl)
      ? {
          storageKey: existingAsset.storageKey,
          url: existingAsset.playbackUrl,
        }
      : undefined;

  return {
    asset,
    removedAsset,
  };
}

export async function createCourseLesson(input: {
  adminId: string;
  chapterId: string;
  title: string;
  slug: string;
  order: number;
  lessonType: LessonType;
  summary?: string;
  contentBody?: string;
  durationMinutes: number;
  isPublished: boolean;
  isPreview: boolean;
  quizRequired: boolean;
  video?: {
    provider: MediaProvider;
    providerAssetId?: string;
    fileName?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    playbackUrl: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    storageKey?: string;
    visibilityStatus: MediaVisibilityStatus;
  };
}) {
  return prisma.$transaction(async (tx) => {
    const lesson = await tx.courseLesson.create({
      data: {
        chapterId: input.chapterId,
        title: input.title.trim(),
        slug: input.slug.trim(),
        order: input.order,
        lessonType: input.lessonType,
        summary: input.summary?.trim() || null,
        contentBody: input.contentBody?.trim() || null,
        durationMinutes: input.durationMinutes,
        isPublished: input.isPublished,
        isPreview: input.isPreview,
        quizRequired: input.quizRequired,
      },
    });

    const videoSync = await syncLessonVideoAsset(tx, lesson.id, input.video);

    const section = await tx.courseChapter.findUniqueOrThrow({
      where: {
        id: input.chapterId,
      },
      select: {
        courseId: true,
      },
    });

    await refreshCourseDerivedFields(tx, section.courseId);
    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: section.courseId,
      action: "create_course_lesson",
      entityType: "CourseLesson",
      entityId: lesson.id,
      metadata: {
        title: lesson.title,
        lessonType: lesson.lessonType,
        order: lesson.order,
      },
    });

    return {
      lesson,
      removedVideoAsset: videoSync.removedAsset,
    };
  });
}

export async function updateCourseLesson(input: {
  adminId: string;
  lessonId: string;
  title: string;
  slug: string;
  order: number;
  lessonType: LessonType;
  summary?: string;
  contentBody?: string;
  durationMinutes: number;
  isPublished: boolean;
  isPreview: boolean;
  quizRequired: boolean;
  video?: {
    provider: MediaProvider;
    providerAssetId?: string;
    fileName?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    playbackUrl: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    storageKey?: string;
    visibilityStatus: MediaVisibilityStatus;
  };
}) {
  const result = await prisma.$transaction(async (tx) => {
    const lesson = await tx.courseLesson.update({
      where: {
        id: input.lessonId,
      },
      data: {
        title: input.title.trim(),
        slug: input.slug.trim(),
        order: input.order,
        lessonType: input.lessonType,
        summary: input.summary?.trim() || null,
        contentBody: input.contentBody?.trim() || null,
        durationMinutes: input.durationMinutes,
        isPublished: input.isPublished,
        isPreview: input.isPreview,
        quizRequired: input.quizRequired,
      },
      include: {
        chapter: {
          select: {
            courseId: true,
          },
        },
      },
    });

    const videoSync = await syncLessonVideoAsset(tx, lesson.id, input.video);
    await refreshCourseDerivedFields(tx, lesson.chapter.courseId);
    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: lesson.chapter.courseId,
      action: "update_course_lesson",
      entityType: "CourseLesson",
      entityId: lesson.id,
      metadata: {
        title: lesson.title,
        lessonType: lesson.lessonType,
        order: lesson.order,
        isPublished: lesson.isPublished,
      },
    });

    return {
      lesson,
      removedVideoAsset: videoSync.removedAsset,
    };
  });

  if (result.removedVideoAsset) {
    await deleteStoredAsset(result.removedVideoAsset);
  }

  return result.lesson;
}

export async function deleteCourseLesson(input: {
  adminId: string;
  lessonId: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const lesson = await tx.courseLesson.delete({
      where: {
        id: input.lessonId,
      },
      include: {
        chapter: {
          select: {
            courseId: true,
          },
        },
        videoAsset: true,
        attachments: true,
      },
    });

    await refreshCourseDerivedFields(tx, lesson.chapter.courseId);
    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: lesson.chapter.courseId,
      action: "delete_course_lesson",
      entityType: "CourseLesson",
      entityId: lesson.id,
      metadata: {
        title: lesson.title,
        lessonType: lesson.lessonType,
      },
    });

    return {
      lessonId: lesson.id,
      removedAssets: [
        ...(lesson.videoAsset
          ? [
              {
                storageKey: lesson.videoAsset.storageKey,
                url: lesson.videoAsset.playbackUrl,
              },
            ]
          : []),
        ...lesson.attachments.map((attachment) => ({
          storageKey: attachment.storageKey,
          url: attachment.fileUrl,
        })),
      ],
    };
  });

  await Promise.all(result.removedAssets.map((asset) => deleteStoredAsset(asset)));

  return result.lessonId;
}

export async function createLessonAttachment(input: {
  adminId: string;
  lessonId: string;
  title?: string;
  fileName: string;
  fileUrl: string;
  storageKey?: string;
  provider: MediaProvider;
  mimeType: string;
  fileSizeBytes: number;
  order: number;
  isPublished: boolean;
  allowDownload: boolean;
  visibilityStatus: MediaVisibilityStatus;
}) {
  return prisma.$transaction(async (tx) => {
    const normalized = normalizeStoredFileMetadata({
      provider: input.provider,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      storageKey: input.storageKey,
      visibilityStatus: input.visibilityStatus,
    });

    const attachment = await tx.lessonAttachment.create({
      data: {
        lessonId: input.lessonId,
        title: input.title?.trim() || null,
        order: input.order,
        isPublished: input.isPublished,
        allowDownload: input.allowDownload,
        ...normalized,
      },
      include: {
        lesson: {
          include: {
            chapter: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: attachment.lesson.chapter.courseId,
      action: "create_lesson_attachment",
      entityType: "LessonAttachment",
      entityId: attachment.id,
      metadata: {
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
      },
    });

    return mapAttachment(attachment);
  });
}

export async function updateLessonAttachment(input: {
  adminId: string;
  attachmentId: string;
  title?: string;
  fileName: string;
  fileUrl: string;
  storageKey?: string;
  provider: MediaProvider;
  mimeType: string;
  fileSizeBytes: number;
  order: number;
  isPublished: boolean;
  allowDownload: boolean;
  visibilityStatus: MediaVisibilityStatus;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.lessonAttachment.findUniqueOrThrow({
      where: {
        id: input.attachmentId,
      },
      select: {
        id: true,
        storageKey: true,
        fileUrl: true,
      },
    });

    const normalized = normalizeStoredFileMetadata({
      provider: input.provider,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      storageKey: input.storageKey,
      visibilityStatus: input.visibilityStatus,
    });

    const attachment = await tx.lessonAttachment.update({
      where: {
        id: input.attachmentId,
      },
      data: {
        title: input.title?.trim() || null,
        order: input.order,
        isPublished: input.isPublished,
        allowDownload: input.allowDownload,
        ...normalized,
      },
      include: {
        lesson: {
          include: {
            chapter: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: attachment.lesson.chapter.courseId,
      action: "update_lesson_attachment",
      entityType: "LessonAttachment",
      entityId: attachment.id,
      metadata: {
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
      },
    });

    return {
      attachment: mapAttachment(attachment),
      removedAsset:
        existing.storageKey !== normalized.storageKey || existing.fileUrl !== normalized.fileUrl
          ? {
              storageKey: existing.storageKey,
              url: existing.fileUrl,
            }
          : undefined,
    };
  });

  if (result.removedAsset) {
    await deleteStoredAsset(result.removedAsset);
  }

  return result.attachment;
}

export async function deleteLessonAttachment(input: {
  adminId: string;
  attachmentId: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const attachment = await tx.lessonAttachment.delete({
      where: {
        id: input.attachmentId,
      },
      include: {
        lesson: {
          include: {
            chapter: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    await createContentAuditLog(tx, {
      adminId: input.adminId,
      courseId: attachment.lesson.chapter.courseId,
      action: "delete_lesson_attachment",
      entityType: "LessonAttachment",
      entityId: attachment.id,
      metadata: {
        fileName: attachment.fileName,
      },
    });

    return {
      attachmentId: attachment.id,
      removedAsset: {
        storageKey: attachment.storageKey,
        url: attachment.fileUrl,
      },
    };
  });

  await deleteStoredAsset(result.removedAsset);

  return result.attachmentId;
}

export async function getAuthorizedLearningCourse(userId: string, courseSlug: string): Promise<LearningCourseView | undefined> {
  const enrollment = (await prisma.enrollment.findFirst({
    where: {
      userId,
      accessStatus: "active",
      course: {
        slug: courseSlug,
        isPublished: true,
      },
      user: {
        status: "active",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          userOverride: {
            select: {
              canTakeExam: true,
              canAccessLive: true,
              canDownloadVideos: true,
              hideAssignments: true,
              hideForum: true,
              customNote: true,
            },
          },
        },
      },
      course: {
        include: learningCourseInclude,
      },
    },
  })) as (EnrollmentWithCourseRecord & {
    user: {
      id: string;
      name: string;
      email: string;
      status: "active" | "blocked" | "suspended";
      userOverride: {
        canTakeExam: boolean | null;
        canAccessLive: boolean | null;
        canDownloadVideos: boolean | null;
        hideAssignments: boolean | null;
        hideForum: boolean | null;
        customNote: string | null;
      } | null;
    };
  }) | null;

  if (!enrollment) {
    return undefined;
  }

  const lessonIds = enrollment.course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id));
  const lessonProgressRows = lessonIds.length
    ? await prisma.lessonProgress.findMany({
        where: {
          userId,
          lessonId: {
            in: lessonIds,
          },
        },
      })
    : [];

  const permissions = buildPermissions({
    userStatus: enrollment.user.status,
    accessStatus: enrollment.accessStatus,
    coursePublished: enrollment.course.isPublished,
    ...enrollment.user.userOverride,
  });

  const curriculum = await Promise.all(
    enrollment.course.chapters.map(async (chapter) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description ?? undefined,
      order: chapter.order,
      isPublished: chapter.isPublished,
      courseId: enrollment.course.id,
      lessons: await Promise.all(
        chapter.lessons.map((lesson) =>
          signLessonForViewer({
            viewerUserId: userId,
            enrollmentId: enrollment.id,
            lesson: mapLesson(lesson, {
              isAccessible: permissions.canAccessCourse,
              lockedReason: permissions.canAccessCourse ? undefined : "This lesson is locked for the current account.",
              allowDownload: permissions.canDownloadVideos,
            }),
          }),
        ),
      ),
    })),
  );

  return {
    course: {
      ...toCourse(enrollment.course),
      categoryName: enrollment.course.category.name,
      categorySlug: enrollment.course.category.slug,
      instructorName: enrollment.course.instructor.name,
      instructorSlug: enrollment.course.instructor.slug,
    },
    curriculum,
    enrollment: {
      id: enrollment.id,
      progress: enrollment.progress,
      completed: enrollment.completed,
      lastLessonId: enrollment.lastLessonId ?? undefined,
      accessStatus: enrollment.accessStatus,
      expiresAt: toIso(enrollment.expiresAt),
    },
    lessonProgress: lessonProgressRows.reduce<Record<string, { completed: boolean; positionSeconds: number }>>((acc, row) => {
      acc[row.lessonId] = {
        completed: row.completed,
        positionSeconds: row.positionSeconds,
      };
      return acc;
    }, {}),
    permissions,
    watermark: buildVideoWatermark({
      name: enrollment.user.name,
    }),
  };
}

export async function getAuthorizedLessonContent(userId: string, courseSlug: string, lessonSlug: string) {
  const course = await getAuthorizedLearningCourse(userId, courseSlug);

  if (!course) {
    return undefined;
  }

  const lesson = course.curriculum.flatMap((chapter) => chapter.lessons).find((item) => item.slug === lessonSlug);

  if (!lesson || !lesson.isAccessible) {
    return undefined;
  }

  return {
    ...course,
    currentLesson: lesson,
  };
}

export async function createAdminInstructor(input: {
  adminId: string;
  name: string;
  nameEn?: string;
  slug: string;
  title?: string;
  titleEn?: string;
  avatar?: string;
  bio?: string;
  bioEn?: string;
  specialization?: string;
  specializationEn?: string;
  vodafoneCashNumber?: string;
}) {
  const result = await prisma.instructor.create({
    data: {
      name: input.name,
      nameEn: input.nameEn,
      slug: input.slug,
      title: input.title,
      titleEn: input.titleEn,
      avatar: input.avatar,
      bio: input.bio,
      bioEn: input.bioEn,
      specialization: input.specialization,
      specializationEn: input.specializationEn,
      vodafoneCashNumber: input.vodafoneCashNumber,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "instructor.created",
      entityType: "instructor",
      entityId: result.id,
    },
  });

  return result;
}

export async function updateAdminInstructor(input: {
  adminId: string;
  instructorId: string;
  name: string;
  nameEn?: string;
  slug: string;
  title?: string;
  titleEn?: string;
  avatar?: string;
  bio?: string;
  bioEn?: string;
  specialization?: string;
  specializationEn?: string;
  vodafoneCashNumber?: string;
}) {
  const result = await prisma.instructor.update({
    where: { id: input.instructorId },
    data: {
      name: input.name,
      nameEn: input.nameEn,
      slug: input.slug,
      title: input.title,
      titleEn: input.titleEn,
      avatar: input.avatar,
      bio: input.bio,
      bioEn: input.bioEn,
      specialization: input.specialization,
      specializationEn: input.specializationEn,
      vodafoneCashNumber: input.vodafoneCashNumber,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "instructor.updated",
      entityType: "instructor",
      entityId: result.id,
    },
  });

  return result;
}

export async function deleteAdminInstructor(input: { adminId: string; instructorId: string }) {
  const coursesCount = await prisma.course.count({
    where: {
      instructorId: input.instructorId,
    },
  });

  if (coursesCount > 0) {
    throw new Error("Cannot delete an instructor while courses are assigned to them.");
  }

  await prisma.instructor.delete({
    where: {
      id: input.instructorId,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "instructor.deleted",
      entityType: "instructor",
      entityId: input.instructorId,
    },
  });
}

export async function deleteAdminCourse(input: { adminId: string; courseId: string }) {
  await prisma.course.delete({
    where: { id: input.courseId },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "course.deleted",
      entityType: "course",
      entityId: input.courseId,
    },
  });
}

export async function createAdminCategory(input: {
  adminId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}) {
  const category = await prisma.category.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() || null,
      icon: input.icon?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "category.created",
      entityType: "category",
      entityId: category.id,
    },
  });

  return category;
}

export async function updateAdminCategory(input: {
  adminId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}) {
  const category = await prisma.category.update({
    where: { id: input.categoryId },
    data: {
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() || null,
      icon: input.icon?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "category.updated",
      entityType: "category",
      entityId: category.id,
    },
  });

  return category;
}

export async function deleteAdminCategory(input: { adminId: string; categoryId: string }) {
  const coursesCount = await prisma.course.count({
    where: { categoryId: input.categoryId },
  });

  if (coursesCount > 0) {
    throw new Error("Cannot delete a category while courses are assigned to it.");
  }

  await prisma.category.delete({
    where: { id: input.categoryId },
  });

  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: "category.deleted",
      entityType: "category",
      entityId: input.categoryId,
    },
  });
}


