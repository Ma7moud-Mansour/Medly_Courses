import { prisma } from "@/lib/db";
import { getAuthorizedLearningCourse } from "@/lib/content/repository";
import { listStudentOrders } from "@/lib/payments/repository";
import type { EffectiveStudentPermissions, Notification } from "@/types";

export const globalStudentPermissionDefaults = {
  canTakeExam: true,
  canAccessLive: true,
  canDownloadVideos: false,
  hideAssignments: false,
  hideForum: false,
} as const;

export type StudentProfileView = {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  university?: string;
  academicYear?: string;
  createdAt: string;
};

export type StudentCourseAccessState = "active" | "revoked" | "expired";

export type StudentCourseCard = {
  enrollmentId: string;
  courseId: string;
  courseSlug: string;
  title: string;
  subtitle?: string;
  thumbnail: string;
  description: string;
  price: number;
  discountPrice?: number;
  durationHours: number;
  lessonsCount: number;
  categoryName: string;
  instructorName: string;
  accessStatus: StudentCourseAccessState;
  expiresAt?: string;
  startedAt: string;
  progress: number;
  completed: boolean;
  totalLessons: number;
  completedLessons: number;
  lastLessonId?: string;
  lastLessonSlug?: string;
  lastLessonTitle?: string;
  learningHref?: string;
  lastActivityAt?: string;
  permissions: EffectiveStudentPermissions;
  isAccessible: boolean;
  disabledReason?: string;
};

export type StudentDashboardStats = {
  enrolledCourses: number;
  activeCourses: number;
  completedLessons: number;
  supportTickets: number;
};

export type StudentBillingRecord = {
  id: string;
  createdAt: string;
  total: number;
  subtotal: number;
  discount: number;
  status: string;
  itemsCount: number;
  courseTitles: string[];
  paymentMethod?: string;
  internalPaymentCode?: string;
  paymentReference?: string;
  senderPhone?: string;
  paymentRecipientNumber?: string;
  paymentRecipientInstructorName?: string;
  rejectionReason?: string;
  receiptPreviewUrl?: string;
};

export type StudentDashboardOverview = {
  profile: StudentProfileView;
  stats: StudentDashboardStats;
  continueLearning?: StudentCourseCard;
  activeCourses: StudentCourseCard[];
  unavailableCourses: StudentCourseCard[];
  notifications: Notification[];
  recommendedCourses: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle?: string;
    thumbnail: string;
    price: number;
    discountPrice?: number;
    categoryName: string;
    instructorName: string;
  }>;
};

type StudentUserRecord = {
  id: string;
  name: string;
  email: string;
  status: "active" | "blocked" | "suspended";
  phone: string | null;
  createdAt: Date;
  studentProfile: {
    phone: string | null;
    university: string | null;
    academicYear: string | null;
  } | null;
  userOverride: {
    canTakeExam: boolean | null;
    canAccessLive: boolean | null;
    canDownloadVideos: boolean | null;
    hideAssignments: boolean | null;
    hideForum: boolean | null;
    customNote: string | null;
  } | null;
};

type CourseLessonRecord = {
  id: string;
  title: string;
  slug: string;
  order: number;
  durationMinutes: number;
  quizRequired: boolean;
};

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail: string;
  description: string;
  isPublished: boolean;
  price: number;
  discountPrice: number | null;
  durationHours: number;
  lessonsCount: number;
  category: { name: string };
  instructor: { name: string };
  chapters: Array<{
    id: string;
    order: number;
    title: string;
    lessons: CourseLessonRecord[];
  }>;
};

type EnrollmentRecord = {
  id: string;
  userId: string;
  courseId: string;
  accessStatus: StudentCourseAccessState;
  progress: number;
  completed: boolean;
  lastLessonId: string | null;
  startedAt: Date;
  expiresAt: Date | null;
  course: CourseRecord;
};

type LessonProgressRecord = {
  lessonId: string;
  completed: boolean;
  positionSeconds: number;
  updatedAt: Date;
  lesson: {
    id: string;
    title: string;
    slug: string;
    chapter: {
      courseId: string;
    };
  };
};

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function mapProfile(user: StudentUserRecord): StudentProfileView {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.studentProfile?.phone ?? user.phone ?? undefined,
    university: user.studentProfile?.university ?? undefined,
    academicYear: user.studentProfile?.academicYear ?? undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

function flattenLessons(course: CourseRecord) {
  return course.chapters
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((chapter) => chapter.lessons.slice().sort((a, b) => a.order - b.order));
}

function buildPermissions(input: {
  userStatus: StudentUserRecord["status"];
  override: StudentUserRecord["userOverride"];
  accessStatus: StudentCourseAccessState | "inactive";
  coursePublished: boolean;
}): EffectiveStudentPermissions {
  const canAccessPortal = input.userStatus === "active";
  const canAccessCourse = canAccessPortal && input.coursePublished && input.accessStatus === "active";

  return {
    canAccessPortal,
    canAccessCourse,
    canTakeExam: input.override?.canTakeExam ?? globalStudentPermissionDefaults.canTakeExam,
    canAccessLive: input.override?.canAccessLive ?? globalStudentPermissionDefaults.canAccessLive,
    canDownloadVideos:
      input.override?.canDownloadVideos ?? globalStudentPermissionDefaults.canDownloadVideos,
    hideAssignments: input.override?.hideAssignments ?? globalStudentPermissionDefaults.hideAssignments,
    hideForum: input.override?.hideForum ?? globalStudentPermissionDefaults.hideForum,
    status: input.userStatus,
    accessStatus: input.accessStatus,
    coursePublished: input.coursePublished,
    customNote: input.override?.customNote ?? undefined,
  };
}

function getDisabledReason(item: {
  accessStatus: StudentCourseAccessState;
  coursePublished: boolean;
  canAccessPortal: boolean;
  expiresAt?: string;
}) {
  if (!item.canAccessPortal) {
    return "هذا الحساب غير نشط حاليًا.";
  }

  if (!item.coursePublished) {
    return "هذا الكورس غير متاح الآن.";
  }

  if (item.accessStatus === "revoked") {
    return "تم إيقاف الوصول لهذا الكورس من الحساب.";
  }

  if (item.accessStatus === "expired") {
    return item.expiresAt
      ? `انتهت مدة الوصول لهذا الكورس في ${new Date(item.expiresAt).toLocaleDateString("ar-EG")}.`
      : "انتهت مدة الوصول لهذا الكورس.";
  }

  return undefined;
}

function groupProgressByCourse(progressRows: LessonProgressRecord[]) {
  const grouped = new Map<
    string,
    {
      completedLessonIds: Set<string>;
      byLessonId: Map<string, LessonProgressRecord>;
      latest?: LessonProgressRecord;
    }
  >();

  for (const row of progressRows) {
    const courseId = row.lesson.chapter.courseId;
    const current =
      grouped.get(courseId) ??
      {
        completedLessonIds: new Set<string>(),
        byLessonId: new Map<string, LessonProgressRecord>(),
      };

    current.byLessonId.set(row.lessonId, row);

    if (row.completed) {
      current.completedLessonIds.add(row.lessonId);
    }

    if (!current.latest || current.latest.updatedAt < row.updatedAt) {
      current.latest = row;
    }

    grouped.set(courseId, current);
  }

  return grouped;
}

function mapCourseCard(
  enrollment: EnrollmentRecord,
  user: StudentUserRecord,
  progressByCourse: ReturnType<typeof groupProgressByCourse>,
): StudentCourseCard {
  const allLessons = flattenLessons(enrollment.course);
  const lessonCount = allLessons.length || enrollment.course.lessonsCount;
  const groupedProgress = progressByCourse.get(enrollment.courseId);
  const completedLessons = allLessons.length
    ? groupedProgress?.completedLessonIds.size ?? 0
    : enrollment.completed
      ? lessonCount
      : Math.round((enrollment.progress / 100) * lessonCount);
  const progress = lessonCount
    ? Math.round((completedLessons / lessonCount) * 100)
    : enrollment.progress;
  const effectiveProgress = Math.max(progress, enrollment.progress);
  const completed = lessonCount ? completedLessons >= lessonCount && lessonCount > 0 : enrollment.completed;
  const fallbackLesson = allLessons[0];
  const lastProgressLesson = groupedProgress?.latest?.lesson;
  const lastLesson =
    allLessons.find((lesson) => lesson.id === enrollment.lastLessonId) ??
    allLessons.find((lesson) => lesson.id === lastProgressLesson?.id) ??
    fallbackLesson;
  const permissions = buildPermissions({
    userStatus: user.status,
    override: user.userOverride,
    accessStatus: enrollment.accessStatus,
    coursePublished: enrollment.course.isPublished,
  });
  const disabledReason = getDisabledReason({
    accessStatus: enrollment.accessStatus,
    coursePublished: enrollment.course.isPublished,
    canAccessPortal: permissions.canAccessPortal,
    expiresAt: toIso(enrollment.expiresAt),
  });

  return {
    enrollmentId: enrollment.id,
    courseId: enrollment.courseId,
    courseSlug: enrollment.course.slug,
    title: enrollment.course.title,
    subtitle: enrollment.course.subtitle ?? undefined,
    thumbnail: enrollment.course.thumbnail,
    description: enrollment.course.description,
    price: enrollment.course.price,
    discountPrice: enrollment.course.discountPrice ?? undefined,
    durationHours: enrollment.course.durationHours,
    lessonsCount: enrollment.course.lessonsCount || lessonCount,
    categoryName: enrollment.course.category.name,
    instructorName: enrollment.course.instructor.name,
    accessStatus: enrollment.accessStatus,
    expiresAt: toIso(enrollment.expiresAt),
    startedAt: enrollment.startedAt.toISOString(),
    progress: effectiveProgress,
    completed,
    totalLessons: lessonCount,
    completedLessons,
    lastLessonId: lastLesson?.id,
    lastLessonSlug: lastLesson?.slug,
    lastLessonTitle: lastLesson?.title,
    learningHref: lastLesson ? `/learn/${enrollment.course.slug}/${lastLesson.slug}` : undefined,
    lastActivityAt: toIso(groupedProgress?.latest?.updatedAt) ?? enrollment.startedAt.toISOString(),
    permissions,
    isAccessible: permissions.canAccessCourse && enrollment.accessStatus === "active",
    disabledReason,
  };
}

async function getStudentUserContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      phone: true,
      createdAt: true,
      studentProfile: {
        select: {
          phone: true,
          university: true,
          academicYear: true,
        },
      },
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
  });

  return user as StudentUserRecord | null;
}

async function listStudentEnrollmentsInternal(userId: string) {
  const user = await getStudentUserContext(userId);

  if (!user) {
    return undefined;
  }

  const enrollments = (await prisma.enrollment.findMany({
    where: {
      userId,
    },
    include: {
      course: {
        include: {
          category: {
            select: { name: true },
          },
          instructor: {
            select: { name: true },
          },
          chapters: {
            where: {
              isPublished: true,
            },
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: {
                  isPublished: true,
                },
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  order: true,
                  durationMinutes: true,
                  quizRequired: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ startedAt: "desc" }],
  })) as EnrollmentRecord[];

  const courseIds = enrollments.map((enrollment) => enrollment.courseId);
  const lessonProgressRows = courseIds.length
    ? ((await prisma.lessonProgress.findMany({
        where: {
          userId,
          lesson: {
            chapter: {
              courseId: {
                in: courseIds,
              },
            },
          },
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              slug: true,
              chapter: {
                select: {
                  courseId: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      })) as LessonProgressRecord[])
    : [];

  const progressByCourse = groupProgressByCourse(lessonProgressRows);
  const courseItems = enrollments.map((enrollment) => mapCourseCard(enrollment, user, progressByCourse));

  return {
    user,
    courseItems,
    completedLessonsCount: lessonProgressRows.filter((row) => row.completed).length,
  };
}

// Student dashboard data is always derived from the authenticated user id on the server.
// Client code never chooses which student record to read.
export async function listStudentCourses(userId: string) {
  const data = await listStudentEnrollmentsInternal(userId);

  if (!data) {
    return undefined;
  }

  return {
    profile: mapProfile(data.user),
    activeCourses: data.courseItems.filter((item) => item.isAccessible),
    unavailableCourses: data.courseItems.filter((item) => !item.isAccessible),
    completedLessonsCount: data.completedLessonsCount,
  };
}

export async function getEffectiveStudentPermissions(userId: string, courseId?: string) {
  const user = await getStudentUserContext(userId);

  if (!user) {
    return buildPermissions({
      userStatus: "blocked",
      override: null,
      accessStatus: "inactive",
      coursePublished: false,
    });
  }

  if (!courseId) {
    return buildPermissions({
      userStatus: user.status,
      override: user.userOverride,
      accessStatus: "inactive",
      coursePublished: true,
    });
  }

  const [enrollment, course] = await Promise.all([
    prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        accessStatus: true,
      },
    }),
    prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        isPublished: true,
      },
    }),
  ]);

  return buildPermissions({
    userStatus: user.status,
    override: user.userOverride,
    accessStatus: enrollment?.accessStatus ?? "inactive",
    coursePublished: course?.isPublished ?? false,
  });
}

export async function canStudentAccessCourse(userId: string, courseId: string) {
  const permissions = await getEffectiveStudentPermissions(userId, courseId);
  return permissions.canAccessCourse;
}

export async function getStudentDashboardOverview(userId: string): Promise<StudentDashboardOverview | undefined> {
  const [courseData, notifications, supportTickets, recommendedCourses] = await Promise.all([
    listStudentCourses(userId),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.supportTicket.count({
      where: { userId },
    }),
    prisma.course.findMany({
      where: {
        isPublished: true,
        enrollments: {
          none: {
            userId,
          },
        },
      },
      include: {
        category: {
          select: { name: true },
        },
        instructor: {
          select: { name: true },
        },
      },
      orderBy: [{ featured: "desc" }, { studentsCount: "desc" }, { updatedAt: "desc" }],
      take: 3,
    }),
  ]);

  if (!courseData) {
    return undefined;
  }

  const stats: StudentDashboardStats = {
    enrolledCourses: courseData.activeCourses.length + courseData.unavailableCourses.length,
    activeCourses: courseData.activeCourses.length,
    completedLessons: courseData.completedLessonsCount,
    supportTickets,
  };

  const continueLearning = courseData.activeCourses
    .filter((item) => !item.completed)
    .sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""))[0];

  return {
    profile: courseData.profile,
    stats,
    continueLearning,
    activeCourses: courseData.activeCourses,
    unavailableCourses: courseData.unavailableCourses,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type as Notification["type"],
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    })),
    recommendedCourses: recommendedCourses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle ?? undefined,
      thumbnail: course.thumbnail,
      price: course.price,
      discountPrice: course.discountPrice ?? undefined,
      categoryName: course.category.name,
      instructorName: course.instructor.name,
    })),
  };
}

export async function getStudentProfile(userId: string) {
  const user = await getStudentUserContext(userId);

  if (!user) {
    return undefined;
  }

  return mapProfile(user);
}

export async function updateStudentProfile(
  userId: string,
  input: {
    name: string;
    phone?: string;
    university?: string;
    academicYear?: string;
  },
) {
  const updated = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      studentProfile: {
        upsert: {
          update: {
            phone: input.phone?.trim() || null,
            university: input.university?.trim() || null,
            academicYear: input.academicYear?.trim() || null,
          },
          create: {
            phone: input.phone?.trim() || null,
            university: input.university?.trim() || null,
            academicYear: input.academicYear?.trim() || null,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      phone: true,
      createdAt: true,
      studentProfile: {
        select: {
          phone: true,
          university: true,
          academicYear: true,
        },
      },
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
  });

  return mapProfile(updated as StudentUserRecord);
}

export async function listStudentNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type as Notification["type"],
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  }));
}

export async function listStudentBilling(userId: string): Promise<StudentBillingRecord[]> {
  const orders = await listStudentOrders(userId);

  return orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    total: order.total,
    subtotal: order.subtotal,
    discount: order.discount,
    status: order.status,
    itemsCount: order.itemsCount,
    courseTitles: order.courseTitles,
    paymentMethod: order.paymentMethod,
    internalPaymentCode: order.internalPaymentCode,
    paymentReference: order.paymentReference,
    senderPhone: order.senderPhone,
    paymentRecipientNumber: order.paymentRecipientNumber,
    paymentRecipientInstructorName: order.paymentRecipientInstructorName,
    rejectionReason: order.rejectionReason,
    receiptPreviewUrl: order.receiptPreviewUrl,
  }));
}

export async function getStudentCourseProgress(userId: string, courseId: string) {
  const courseData = await listStudentCourses(userId);

  if (!courseData) {
    return undefined;
  }

  return (
    courseData.activeCourses.find((course) => course.courseId === courseId) ??
    courseData.unavailableCourses.find((course) => course.courseId === courseId)
  );
}

async function getAccessibleEnrollmentForLesson(userId: string, lessonId: string) {
  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        select: {
          courseId: true,
          isPublished: true,
        },
      },
    },
  });

  if (!lesson || !lesson.isPublished || !lesson.chapter.isPublished) {
    return undefined;
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: lesson.chapter.courseId,
      },
    },
    include: {
      course: {
        select: {
          isPublished: true,
          chapters: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                select: { id: true, slug: true, title: true, order: true, durationMinutes: true, quizRequired: true },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment || enrollment.accessStatus !== "active" || !enrollment.course.isPublished) {
    return undefined;
  }

  return {
    lesson,
    enrollment,
  };
}

async function syncEnrollmentProgress(userId: string, courseId: string, preferredLastLessonId?: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    include: {
      course: {
        select: {
          chapters: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                select: { id: true, slug: true, title: true, order: true, durationMinutes: true, quizRequired: true },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    return undefined;
  }

  const lessons = enrollment.course.chapters.flatMap((chapter) => chapter.lessons);

  if (!lessons.length) {
    return enrollment;
  }

  const progressRows = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: {
        in: lessons.map((lesson) => lesson.id),
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const completedCount = progressRows.filter((row) => row.completed).length;
  const progress = Math.round((completedCount / lessons.length) * 100);
  const latestLessonId = preferredLastLessonId ?? progressRows[0]?.lessonId ?? enrollment.lastLessonId;
  const completed = completedCount >= lessons.length;

  return prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progress,
      completed,
      lastLessonId: latestLessonId,
    },
  });
}

export async function saveLessonPosition(userId: string, lessonId: string, positionSeconds: number) {
  const accessible = await getAccessibleEnrollmentForLesson(userId, lessonId);

  if (!accessible) {
    return undefined;
  }

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      positionSeconds: Math.max(0, Math.round(positionSeconds)),
    },
    create: {
      userId,
      lessonId,
      positionSeconds: Math.max(0, Math.round(positionSeconds)),
      completed: false,
    },
  });

  await prisma.enrollment.update({
    where: { id: accessible.enrollment.id },
    data: {
      lastLessonId: lessonId,
    },
  });

  const progress = await syncEnrollmentProgress(userId, accessible.lesson.chapter.courseId, lessonId);

  return {
    lessonId,
    positionSeconds: Math.max(0, Math.round(positionSeconds)),
    progress: progress?.progress ?? accessible.enrollment.progress,
  };
}

export async function markLessonComplete(userId: string, lessonId: string) {
  const accessible = await getAccessibleEnrollmentForLesson(userId, lessonId);

  if (!accessible) {
    return undefined;
  }

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      completed: true,
    },
    create: {
      userId,
      lessonId,
      completed: true,
    },
  });

  const syncedEnrollment = await syncEnrollmentProgress(userId, accessible.lesson.chapter.courseId, lessonId);
  const lessons = accessible.enrollment.course.chapters.flatMap((chapter) => chapter.lessons);
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : undefined;

  return {
    lessonId,
    completed: true,
    nextLessonUnlocked: Boolean(nextLesson),
    nextLessonSlug: nextLesson?.slug,
    progress: syncedEnrollment?.progress ?? accessible.enrollment.progress,
  };
}

export async function getLearningCourseBySlug(userId: string, courseSlug: string) {
  return getAuthorizedLearningCourse(userId, courseSlug);
/*
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      accessStatus: "active",
      course: {
        slug: courseSlug,
        isPublished: true,
      },
    },
    include: {
      course: {
        include: {
          category: {
            select: { name: true },
          },
          instructor: {
            select: { name: true },
          },
          chapters: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  order: true,
                  durationMinutes: true,
                  videoUrl: true,
                  isPreview: true,
                  quizRequired: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    return undefined;
  }

  const lessonIds = enrollment.course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id));
  const lessonProgress = lessonIds.length
    ? await prisma.lessonProgress.findMany({
        where: {
          userId,
          lessonId: {
            in: lessonIds,
          },
        },
      })
    : [];

  return {
    course: {
      id: enrollment.course.id,
      title: enrollment.course.title,
      slug: enrollment.course.slug,
      subtitle: enrollment.course.subtitle ?? undefined,
      description: enrollment.course.description,
      thumbnail: enrollment.course.thumbnail,
      price: enrollment.course.price,
      discountPrice: enrollment.course.discountPrice ?? undefined,
      rating: 0,
      reviewsCount: 0,
      studentsCount: 0,
      durationHours: enrollment.course.durationHours,
      lessonsCount: enrollment.course.lessonsCount,
      level: "beginner" as const,
      language: "العربية",
      categoryId: "",
      instructorId: "",
      tags: [],
      learningOutcomes: [],
      requirements: [],
    },
    curriculum: enrollment.course.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
      courseId: enrollment.course.id,
      lessons: chapter.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        videoUrl: lesson.videoUrl ?? undefined,
        isPreview: lesson.isPreview,
        chapterId: chapter.id,
        quizRequired: lesson.quizRequired,
      })),
    })),
    enrollment: {
      id: enrollment.id,
      progress: enrollment.progress,
      completed: enrollment.completed,
      lastLessonId: enrollment.lastLessonId ?? undefined,
    },
    lessonProgress: lessonProgress.reduce<Record<string, { completed: boolean; positionSeconds: number }>>(
      (acc, item) => {
        acc[item.lessonId] = {
          completed: item.completed,
          positionSeconds: item.positionSeconds,
        };
        return acc;
      },
      {},
    ),
  };
*/
}
