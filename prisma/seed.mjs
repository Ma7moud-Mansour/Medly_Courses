import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Algorithm, hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/medly";

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString,
    }),
  ),
}).$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        if (args?.where) {
          args.where = decodeDeep(args.where);
        }

        if (args?.data) {
          args.data = decodeDeep(args.data);
        }

        if (args?.create) {
          args.create = decodeDeep(args.create);
        }

        if (args?.update) {
          args.update = decodeDeep(args.update);
        }

        return query(args);
      },
    },
  },
});

function looksMojibake(value) {
  return typeof value === "string" && /[ØÙâ]/.test(value);
}

function decodeMojibake(value) {
  if (!looksMojibake(value)) {
    return value;
  }

  return Buffer.from(value, "latin1").toString("utf8");
}

function decodeDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => decodeDeep(item));
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, decodeDeep(nestedValue)]),
    );
  }

  return decodeMojibake(value);
}

async function repairTextTable(delegate, fields) {
  const rows = await delegate.findMany({
    select: {
      id: true,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    },
  });

  let repaired = 0;

  for (const row of rows) {
    const data = {};

    for (const field of fields) {
      const currentValue = row[field];

      if (typeof currentValue !== "string" || !looksMojibake(currentValue)) {
        continue;
      }

      const decodedValue = decodeMojibake(currentValue);

      if (decodedValue !== currentValue) {
        data[field] = decodedValue;
      }
    }

    if (Object.keys(data).length) {
      await delegate.update({
        where: { id: row.id },
        data,
      });
      repaired += 1;
    }
  }

  return repaired;
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@medly.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
const SUPPORT_EMAIL = process.env.SEED_SUPPORT_EMAIL ?? "support@medly.com";
const SUPPORT_PASSWORD = process.env.SEED_SUPPORT_PASSWORD ?? "Support@123456";
const STUDENT_EMAIL = process.env.SEED_STUDENT_EMAIL ?? "salma@student.medly.app";
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD ?? "Student@123456";
const REVIEWER_ONE_EMAIL = "mariam@student.medly.app";
const REVIEWER_TWO_EMAIL = "omar@student.medly.app";

const PASSWORD_HASH_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

async function buildPasswordHash(password) {
  return hash(password, PASSWORD_HASH_OPTIONS);
}

async function main() {
  const [adminPasswordHash, supportPasswordHash, studentPasswordHash] = await Promise.all([
    buildPasswordHash(ADMIN_PASSWORD),
    buildPasswordHash(SUPPORT_PASSWORD),
    buildPasswordHash(STUDENT_PASSWORD),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "مدير المنصة",
      role: "admin",
      status: "active",
      passwordHash: adminPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(),
    },
    create: {
      name: "مدير المنصة",
      email: ADMIN_EMAIL,
      role: "admin",
      status: "active",
      passwordHash: adminPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: SUPPORT_EMAIL },
    update: {
      name: "فريق الدعم",
      role: "support",
      status: "active",
      passwordHash: supportPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(),
    },
    create: {
      name: "فريق الدعم",
      email: SUPPORT_EMAIL,
      role: "support",
      status: "active",
      passwordHash: supportPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const student = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {
      name: "سلمى عادل",
      role: "student",
      status: "active",
      passwordHash: studentPasswordHash,
      phone: "01003797694",
      emailVerified: true,
      lastLoginAt: new Date(),
    },
    create: {
      name: "سلمى عادل",
      email: STUDENT_EMAIL,
      role: "student",
      status: "active",
      passwordHash: studentPasswordHash,
      phone: "01003797694",
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const reviewerOne = await prisma.user.upsert({
    where: { email: REVIEWER_ONE_EMAIL },
    update: {
      name: "مريم خالد",
      role: "student",
      status: "active",
      passwordHash: studentPasswordHash,
      phone: "01095787735",
      emailVerified: true,
    },
    create: {
      name: "مريم خالد",
      email: REVIEWER_ONE_EMAIL,
      role: "student",
      status: "active",
      passwordHash: studentPasswordHash,
      phone: "01095787735",
      emailVerified: true,
    },
  });

  const reviewerTwo = await prisma.user.upsert({
    where: { email: REVIEWER_TWO_EMAIL },
    update: {
      name: "عمر أحمد",
      role: "student",
      status: "active",
      passwordHash: studentPasswordHash,
      emailVerified: true,
    },
    create: {
      name: "عمر أحمد",
      email: REVIEWER_TWO_EMAIL,
      role: "student",
      status: "active",
      passwordHash: studentPasswordHash,
      emailVerified: true,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      phone: "01003797694",
      university: "جامعة القاهرة",
      academicYear: "السنة الثالثة",
    },
    create: {
      userId: student.id,
      phone: "01003797694",
      university: "جامعة القاهرة",
      academicYear: "السنة الثالثة",
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: "anatomy" },
    update: {
      name: "التشريح",
      description: "مسار تشريح منظم للمراجعة الطبية.",
    },
    create: {
      name: "التشريح",
      slug: "anatomy",
      description: "مسار تشريح منظم للمراجعة الطبية.",
      icon: "brain",
    },
  });

  const instructor = await prisma.instructor.upsert({
    where: { slug: "dr-abdelrahman-nader" },
    update: {
      name: "د. عبد الرحمن نادر",
      title: "محاضر طب إكلينيكي ومراجعات امتحانات",
      bio: "يربط المفاهيم الطبية بالحالات والأسئلة ويحوّل الدرس إلى خطوات مذاكرة واضحة.",
      specialization: "Clinical Medicine",
      vodafoneCashNumber: "01003797694",
      avatar: "/images/instructors/avatar-abdelrahman.svg",
    },
    create: {
      name: "د. عبد الرحمن نادر",
      slug: "dr-abdelrahman-nader",
      title: "محاضر طب إكلينيكي ومراجعات امتحانات",
      bio: "يربط المفاهيم الطبية بالحالات والأسئلة ويحوّل الدرس إلى خطوات مذاكرة واضحة.",
      specialization: "Clinical Medicine",
      vodafoneCashNumber: "01003797694",
      avatar: "/images/instructors/avatar-abdelrahman.svg",
    },
  });

  const youssefInstructor = await prisma.instructor.upsert({
    where: { slug: "dr-youssef-ziadeh" },
    update: {
      name: "د. يوسف زياده",
      title: "محاضر أشعة وتشخيص طبي",
      bio: "يشرح الصور الطبية وربطها بالحالة السريرية بخطوات هادئة وواضحة.",
      specialization: "Medical Imaging",
      vodafoneCashNumber: "01214874744",
      avatar: "/images/instructors/avatar-youssef.svg",
    },
    create: {
      name: "د. يوسف زياده",
      slug: "dr-youssef-ziadeh",
      title: "محاضر أشعة وتشخيص طبي",
      bio: "يشرح الصور الطبية وربطها بالحالة السريرية بخطوات هادئة وواضحة.",
      specialization: "Medical Imaging",
      vodafoneCashNumber: "01214874744",
      avatar: "/images/instructors/avatar-youssef.svg",
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "clinical-anatomy-essentials" },
    update: {
      title: "أساسيات التشريح السريري",
      subtitle: "خريطة واضحة للتشريح مع ربط سريع بالحالات والأسئلة.",
      description: "كورس طبي منظم للمذاكرة الهادئة والتطبيق السريري.",
      thumbnail:
        "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=82",
      isPublished: true,
      price: 890,
      discountPrice: 720,
      rating: 4.8,
      reviewsCount: 214,
      studentsCount: 1700,
      durationHours: 14,
      lessonsCount: 6,
      level: "beginner",
      categoryId: category.id,
      instructorId: instructor.id,
    },
    create: {
      title: "أساسيات التشريح السريري",
      slug: "clinical-anatomy-essentials",
      subtitle: "خريطة واضحة للتشريح مع ربط سريع بالحالات والأسئلة.",
      description: "كورس طبي منظم للمذاكرة الهادئة والتطبيق السريري.",
      thumbnail:
        "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=82",
      isPublished: true,
      price: 890,
      discountPrice: 720,
      rating: 4.8,
      reviewsCount: 214,
      studentsCount: 1700,
      durationHours: 14,
      lessonsCount: 6,
      level: "beginner",
      categoryId: category.id,
      instructorId: instructor.id,
    },
  });

  const relatedCourseOne = await prisma.course.upsert({
    where: { slug: "clinical-cardiology-basics" },
    update: {
      title: "أساسيات القلب الإكلينيكية",
      subtitle: "ملخص عملي يربط التشريح والفسيولوجيا بالأسئلة السريرية.",
      description: "كورس مبسط ومنظم للطلاب الذين يريدون مراجعة أمراض القلب الأساسية وخطوات التفكير السريري.",
      thumbnail:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=82",
      isPublished: true,
      price: 760,
      discountPrice: 640,
      rating: 0,
      reviewsCount: 0,
      studentsCount: 0,
      durationHours: 10,
      lessonsCount: 4,
      level: "intermediate",
      categoryId: category.id,
      instructorId: youssefInstructor.id,
    },
    create: {
      title: "أساسيات القلب الإكلينيكية",
      slug: "clinical-cardiology-basics",
      subtitle: "ملخص عملي يربط التشريح والفسيولوجيا بالأسئلة السريرية.",
      description: "كورس مبسط ومنظم للطلاب الذين يريدون مراجعة أمراض القلب الأساسية وخطوات التفكير السريري.",
      thumbnail:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=82",
      isPublished: true,
      price: 760,
      discountPrice: 640,
      rating: 0,
      reviewsCount: 0,
      studentsCount: 0,
      durationHours: 10,
      lessonsCount: 4,
      level: "intermediate",
      categoryId: category.id,
      instructorId: youssefInstructor.id,
    },
  });

  const relatedCourseTwo = await prisma.course.upsert({
    where: { slug: "clinical-imaging-essentials" },
    update: {
      title: "قراءة الصور الطبية الأساسية",
      subtitle: "مدخل هادئ وواضح لصور الأشعة وربطها بالمعلومة السريرية.",
      description: "كورس منظم يشرح كيف تقرأ الصور الطبية الأساسية وتربطها بالحالة المرضية بدون تشتيت.",
      thumbnail:
        "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=82",
      isPublished: true,
      price: 690,
      discountPrice: 590,
      rating: 0,
      reviewsCount: 0,
      studentsCount: 0,
      durationHours: 8,
      lessonsCount: 4,
      level: "beginner",
      categoryId: category.id,
      instructorId: instructor.id,
    },
    create: {
      title: "قراءة الصور الطبية الأساسية",
      slug: "clinical-imaging-essentials",
      subtitle: "مدخل هادئ وواضح لصور الأشعة وربطها بالمعلومة السريرية.",
      description: "كورس منظم يشرح كيف تقرأ الصور الطبية الأساسية وتربطها بالحالة المرضية بدون تشتيت.",
      thumbnail:
        "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=82",
      isPublished: true,
      price: 690,
      discountPrice: 590,
      rating: 0,
      reviewsCount: 0,
      studentsCount: 0,
      durationHours: 8,
      lessonsCount: 4,
      level: "beginner",
      categoryId: category.id,
      instructorId: instructor.id,
    },
  });

  const existingChapters = await prisma.courseChapter.findMany({
    where: {
      courseId: course.id,
    },
    select: {
      id: true,
    },
  });

  if (existingChapters.length) {
    await prisma.lessonProgress.deleteMany({
      where: {
        lesson: {
          chapterId: {
            in: existingChapters.map((chapter) => chapter.id),
          },
        },
      },
    });

    await prisma.courseChapter.deleteMany({
      where: {
        courseId: course.id,
      },
    });
  }

  const chapterBlueprints = [
    {
      title: "مدخل منظم للتشريح السريري",
      description: "تهيئة سريعة للمادة وطريقة الاستفادة من الكورس قبل الدخول في التفاصيل.",
      order: 1,
      lessons: [
        {
          title: "مقدمة الكورس وخطة المذاكرة",
          slug: "course-intro",
          order: 1,
          lessonType: "video",
          summary: "خريطة سريعة للكورس، وترتيب المشاهدة، وطريقة ربط الدروس بالمراجعة.",
          durationMinutes: 16,
          isPreview: true,
          video: {
            provider: "youtube",
            playbackUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
            thumbnailUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
            durationSeconds: 960,
            visibilityStatus: "ready",
          },
        },
        {
          title: "تشريح القلب والأوعية",
          slug: "heart-anatomy",
          order: 2,
          lessonType: "text",
          summary: "شرح نصي منظم مع نقاط الحفظ السريع والعلاقات التشريحية الأساسية.",
          durationMinutes: 24,
          contentBody:
            "القلب يقع داخل المنصف الأوسط ويُغذَّى عبر الشرايين التاجية.\n\nفي هذه الوحدة نركز على:\n- الحجرات الأربع\n- الصمامات الرئيسية\n- التروية الدموية\n- أهم العلاقات السريرية السريعة التي يحتاجها الطالب في المراجعة.",
          quizRequired: true,
        },
        {
          title: "تشريح الجهاز التنفسي",
          slug: "respiratory-anatomy",
          order: 3,
          lessonType: "video",
          summary: "فيديو منظم يربط بين تشريح الرئة والـ bronchi والنقاط الامتحانية الشائعة.",
          durationMinutes: 20,
          video: {
            provider: "youtube",
            playbackUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
            thumbnailUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
            durationSeconds: 1200,
            visibilityStatus: "ready",
          },
          attachments: [
            {
              title: "ورقة مراجعة الجهاز التنفسي",
              fileName: "respiratory-review-sheet.pdf",
              fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              provider: "custom",
              mimeType: "application/pdf",
              fileSizeBytes: 182400,
              order: 1,
              allowDownload: true,
              visibilityStatus: "ready",
            },
          ],
        },
      ],
    },
    {
      title: "ربط سريري وأسئلة تطبيقية",
      description: "ربط المحتوى التشريحي بحالات وصور وملفات مراجعة تساعد الطالب في الاستذكار النهائي.",
      order: 2,
      lessons: [
        {
          title: "حالات سريرية على تشريح القلب",
          slug: "heart-clinical-cases",
          order: 1,
          lessonType: "video",
          summary: "عرض سريع لحالتين سريريتين وكيف نربط بين العرض السريري والبنية التشريحية.",
          durationMinutes: 22,
          video: {
            provider: "youtube",
            playbackUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
            thumbnailUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
            durationSeconds: 1320,
            visibilityStatus: "ready",
          },
        },
        {
          title: "الصور التشخيصية الأساسية",
          slug: "diagnostic-images",
          order: 2,
          lessonType: "pdf",
          summary: "ملف PDF مرتب يوضح أهم الصور التشخيصية التي يحتاج الطالب قراءتها بسرعة.",
          durationMinutes: 18,
          attachments: [
            {
              title: "Diagnostic images pack",
              fileName: "diagnostic-images-pack.pdf",
              fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              provider: "custom",
              mimeType: "application/pdf",
              fileSizeBytes: 248120,
              order: 1,
              allowDownload: true,
              visibilityStatus: "ready",
            },
          ],
        },
        {
          title: "مراجعة نهائية واختبار قصير",
          slug: "final-review",
          order: 3,
          lessonType: "quiz",
          summary: "Checklist نهائي ومكان مخصص لربط اختبارات قصيرة في المرحلة التالية.",
          durationMinutes: 15,
          contentBody:
            "راجع هذا الدرس بعد إنهاء الوحدات السابقة.\n\n- أعد قراءة النقاط التشريحية الكبرى\n- راجع الصور الأساسية\n- افتح ملف الـ checklist قبل الاختبار",
          quizRequired: true,
          attachments: [
            {
              title: "Final review checklist",
              fileName: "final-review-checklist.pdf",
              fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              provider: "custom",
              mimeType: "application/pdf",
              fileSizeBytes: 96320,
              order: 1,
              allowDownload: true,
              visibilityStatus: "ready",
            },
          ],
        },
      ],
    },
  ];

  const seededCurriculum = [];

  for (const chapter of chapterBlueprints) {
    const createdChapter = await prisma.courseChapter.create({
      data: {
        title: chapter.title,
        description: chapter.description,
        order: chapter.order,
        isPublished: true,
        courseId: course.id,
        lessons: {
          create: chapter.lessons.map((lesson) => ({
            title: lesson.title,
            slug: lesson.slug,
            order: lesson.order,
            lessonType: lesson.lessonType,
            summary: lesson.summary ?? null,
            contentBody: lesson.contentBody ?? null,
            durationMinutes: lesson.durationMinutes,
            quizRequired: lesson.quizRequired ?? false,
            isPreview: lesson.isPreview ?? false,
            isPublished: true,
            videoAsset: lesson.video
              ? {
                  create: {
                    provider: lesson.video.provider,
                    playbackUrl: lesson.video.playbackUrl,
                    thumbnailUrl: lesson.video.thumbnailUrl ?? null,
                    durationSeconds: lesson.video.durationSeconds ?? null,
                    visibilityStatus: lesson.video.visibilityStatus ?? "ready",
                  },
                }
              : undefined,
            attachments: lesson.attachments?.length
              ? {
                  create: lesson.attachments.map((attachment) => ({
                    title: attachment.title ?? null,
                    fileName: attachment.fileName,
                    fileUrl: attachment.fileUrl,
                    provider: attachment.provider ?? "custom",
                    mimeType: attachment.mimeType,
                    fileSizeBytes: attachment.fileSizeBytes,
                    order: attachment.order,
                    allowDownload: attachment.allowDownload ?? true,
                    isPublished: true,
                    visibilityStatus: attachment.visibilityStatus ?? "ready",
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        lessons: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    seededCurriculum.push(createdChapter);
  }

  for (const seededCourse of [relatedCourseOne, relatedCourseTwo]) {
    const chaptersCount = await prisma.courseChapter.count({
      where: { courseId: seededCourse.id },
    });

    if (!chaptersCount) {
      await prisma.courseChapter.create({
        data: {
          title: "المحتوى الأساسي",
          description: "وحدة قصيرة مبدئية لباقي الكورسات المرتبطة.",
          order: 1,
          isPublished: true,
          courseId: seededCourse.id,
          lessons: {
            create: [
              {
                title: "مقدمة الكورس",
                slug: "intro",
                order: 1,
                lessonType: "video",
                durationMinutes: 12,
                isPublished: true,
                isPreview: true,
                videoAsset: {
                  create: {
                    provider: "youtube",
                    playbackUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
                    visibilityStatus: "ready",
                  },
                },
              },
              {
                title: "الشرح الأساسي",
                slug: "core-topic",
                order: 2,
                lessonType: "text",
                durationMinutes: 18,
                isPublished: true,
                contentBody: "ملخص مكتوب قصير يوضح الفكرة الأساسية لهذا الدرس.",
              },
              {
                title: "حالة تطبيقية",
                slug: "clinical-case",
                order: 3,
                lessonType: "video",
                durationMinutes: 14,
                isPublished: true,
                videoAsset: {
                  create: {
                    provider: "youtube",
                    playbackUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
                    visibilityStatus: "ready",
                  },
                },
              },
              {
                title: "مراجعة واختبار سريع",
                slug: "quick-review",
                order: 4,
                lessonType: "quiz",
                durationMinutes: 10,
                isPublished: true,
                contentBody: "قائمة مراجعة سريعة ونقاط اختبار قصيرة.",
                quizRequired: true,
              },
            ],
          },
        },
      });
    }
  }

  const standaloneExam = await prisma.exam.upsert({
    where: { slug: "medical-basics-placement" },
    update: {
      title: "اختبار تحديد مستوى أساسيات الطب",
      description: "اختبار مستقل يساعد الطالب يعرف مستوى المراجعة المناسب قبل اختيار الكورس.",
      instructions: "اقرأ كل سؤال بهدوء. هذا الاختبار مستقل ولا يحتاج شراء كورس.",
      durationMinutes: 20,
      passingScore: 3,
      isPublished: true,
      allowRetakes: true,
      showResults: true,
      courseId: null,
    },
    create: {
      title: "اختبار تحديد مستوى أساسيات الطب",
      slug: "medical-basics-placement",
      description: "اختبار مستقل يساعد الطالب يعرف مستوى المراجعة المناسب قبل اختيار الكورس.",
      instructions: "اقرأ كل سؤال بهدوء. هذا الاختبار مستقل ولا يحتاج شراء كورس.",
      durationMinutes: 20,
      passingScore: 3,
      isPublished: true,
      allowRetakes: true,
      showResults: true,
    },
  });

  const courseExam = await prisma.exam.upsert({
    where: { slug: "clinical-anatomy-checkpoint" },
    update: {
      title: "اختبار مراجعة التشريح السريري",
      description: "اختبار مرتبط بكورس أساسيات التشريح السريري ويظهر فقط للطلاب أصحاب الوصول النشط.",
      instructions: "راجع الدروس الأساسية قبل البدء. المحاولة محسوبة داخل حسابك.",
      durationMinutes: 25,
      passingScore: 4,
      isPublished: true,
      allowRetakes: false,
      showResults: true,
      courseId: course.id,
    },
    create: {
      title: "اختبار مراجعة التشريح السريري",
      slug: "clinical-anatomy-checkpoint",
      description: "اختبار مرتبط بكورس أساسيات التشريح السريري ويظهر فقط للطلاب أصحاب الوصول النشط.",
      instructions: "راجع الدروس الأساسية قبل البدء. المحاولة محسوبة داخل حسابك.",
      durationMinutes: 25,
      passingScore: 4,
      isPublished: true,
      allowRetakes: false,
      showResults: true,
      courseId: course.id,
    },
  });

  await prisma.examQuestion.deleteMany({
    where: {
      examId: {
        in: [standaloneExam.id, courseExam.id],
      },
    },
  });

  await prisma.examQuestion.create({
    data: {
      examId: standaloneExam.id,
      type: "multiple_choice",
      order: 1,
      prompt: "أي مصطلح يصف دراسة وظائف أعضاء الجسم؟",
      marks: 1,
      options: {
        create: [
          { order: 1, text: "الفسيولوجيا", isCorrect: true },
          { order: 2, text: "التشريح", isCorrect: false },
          { order: 3, text: "الأشعة", isCorrect: false },
        ],
      },
    },
  });

  await prisma.examQuestion.create({
    data: {
      examId: standaloneExam.id,
      type: "true_false",
      order: 2,
      prompt: "القلب يحتوي على أربع حجرات رئيسية.",
      marks: 1,
      options: {
        create: [
          { order: 1, text: "True", isCorrect: true },
          { order: 2, text: "False", isCorrect: false },
        ],
      },
    },
  });

  await prisma.examQuestion.create({
    data: {
      examId: courseExam.id,
      type: "multiple_choice",
      order: 1,
      prompt: "أي جزء يفصل بين الأذين الأيمن والبطين الأيمن؟",
      explanation: "الصمام ثلاثي الشرفات يقع بين الأذين الأيمن والبطين الأيمن.",
      marks: 2,
      options: {
        create: [
          { order: 1, text: "الصمام ثلاثي الشرفات", isCorrect: true },
          { order: 2, text: "الصمام المترالي", isCorrect: false },
          { order: 3, text: "الصمام الأورطي", isCorrect: false },
        ],
      },
    },
  });

  await prisma.examQuestion.create({
    data: {
      examId: courseExam.id,
      type: "multiple_choice",
      order: 2,
      prompt: "الشرايين التاجية مسؤولة بشكل أساسي عن:",
      marks: 2,
      options: {
        create: [
          { order: 1, text: "تغذية عضلة القلب", isCorrect: true },
          { order: 2, text: "نقل الهواء للرئة", isCorrect: false },
          { order: 3, text: "تصريف البول", isCorrect: false },
        ],
      },
    },
  });

  const seededExamTotals = [
    { examId: standaloneExam.id, totalMarks: 2 },
    { examId: courseExam.id, totalMarks: 4 },
  ];

  for (const examTotal of seededExamTotals) {
    await prisma.exam.update({
      where: { id: examTotal.examId },
      data: { totalMarks: examTotal.totalMarks },
    });
  }

  const seededLessons = seededCurriculum.flatMap((chapter) => chapter.lessons);
  const introLesson = seededLessons[0];
  const heartLesson = seededLessons[1];

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
    update: {
      accessStatus: "active",
      progress: 33,
      completed: false,
      openedByAdminId: admin.id,
      startedAt: new Date(),
      lastLessonId: heartLesson?.id ?? null,
    },
    create: {
      userId: student.id,
      courseId: course.id,
      accessStatus: "active",
      progress: 33,
      completed: false,
      openedByAdminId: admin.id,
      startedAt: new Date(),
      lastLessonId: heartLesson?.id ?? null,
    },
  });

  for (const reviewer of [reviewerOne, reviewerTwo]) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: reviewer.id,
          courseId: course.id,
        },
      },
      update: {
        accessStatus: "active",
        progress: 100,
        completed: true,
        openedByAdminId: admin.id,
      },
      create: {
        userId: reviewer.id,
        courseId: course.id,
        accessStatus: "active",
        progress: 100,
        completed: true,
        openedByAdminId: admin.id,
      },
    });
  }

  if (introLesson) {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: student.id,
          lessonId: introLesson.id,
        },
      },
      update: {
        completed: true,
        positionSeconds: introLesson.durationMinutes * 60,
      },
      create: {
        userId: student.id,
        lessonId: introLesson.id,
        completed: true,
        positionSeconds: introLesson.durationMinutes * 60,
      },
    });
  }

  if (heartLesson) {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: student.id,
          lessonId: heartLesson.id,
        },
      },
      update: {
        completed: true,
        positionSeconds: heartLesson.durationMinutes * 60,
      },
      create: {
        userId: student.id,
        lessonId: heartLesson.id,
        completed: true,
        positionSeconds: heartLesson.durationMinutes * 60,
      },
    });
  }

  await prisma.userOverride.upsert({
    where: { userId: student.id },
    update: {
      canTakeExam: true,
      canAccessLive: true,
      canDownloadVideos: false,
      hideAssignments: false,
      hideForum: true,
      customNote: "إعدادات فردية للتجربة الأولى.",
      updatedByAdminId: admin.id,
    },
    create: {
      userId: student.id,
      canTakeExam: true,
      canAccessLive: true,
      canDownloadVideos: false,
      hideAssignments: false,
      hideForum: true,
      customNote: "إعدادات فردية للتجربة الأولى.",
      updatedByAdminId: admin.id,
    },
  });

  await prisma.wishlist.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: relatedCourseOne.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: relatedCourseOne.id,
    },
  });

  await prisma.wishlist.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: relatedCourseTwo.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: relatedCourseTwo.id,
    },
  });

  await prisma.review.upsert({
    where: {
      userId_courseId: {
        userId: reviewerOne.id,
        courseId: course.id,
      },
    },
    update: {
      rating: 5,
      comment: "الشرح منظم جدًا وساعدني أربط التشريح بالحالات والأسئلة بشكل واضح.",
    },
    create: {
      userId: reviewerOne.id,
      courseId: course.id,
      rating: 5,
      comment: "الشرح منظم جدًا وساعدني أربط التشريح بالحالات والأسئلة بشكل واضح.",
    },
  });

  await prisma.review.upsert({
    where: {
      userId_courseId: {
        userId: reviewerTwo.id,
        courseId: course.id,
      },
    },
    update: {
      rating: 4,
      comment: "المحتوى هادئ ومباشر، وكان مناسب جدًا للمراجعة قبل الامتحان.",
    },
    create: {
      userId: reviewerTwo.id,
      courseId: course.id,
      rating: 4,
      comment: "المحتوى هادئ ومباشر، وكان مناسب جدًا للمراجعة قبل الامتحان.",
    },
  });

  const existingTicket = await prisma.supportTicket.findFirst({
    where: {
      userId: student.id,
      title: "الكورس لا يظهر داخل حسابي",
    },
  });

  const supportTicket =
    existingTicket ??
    (await prisma.supportTicket.create({
      data: {
        userId: student.id,
        title: "الكورس لا يظهر داخل حسابي",
        issueType: "course_access",
        description: "تم الدفع لكن الكورس لم يظهر في صفحة كورساتي.",
        status: "in_progress",
        assignedToAdminId: admin.id,
        unreadForAdmin: false,
        unreadForStudent: false,
        lastMessageAt: new Date(),
      },
    }));

  const existingTicketMessages = await prisma.supportTicketMessage.count({
    where: { ticketId: supportTicket.id },
  });

  if (!existingTicketMessages) {
    await prisma.supportTicketMessage.createMany({
      data: [
        {
          ticketId: supportTicket.id,
          senderId: student.id,
          body: "تم إرسال تحويل فودافون كاش لكن الكورس لم يظهر داخل حسابي بعد.",
        },
        {
          ticketId: supportTicket.id,
          senderId: admin.id,
          body: "راجعنا الطلب وجارٍ تأكيد الدفع يدويًا. سنفعّل الوصول بمجرد اكتمال المراجعة.",
        },
      ],
    });

    await prisma.supportTicket.update({
      where: { id: supportTicket.id },
      data: {
        unreadForAdmin: false,
        unreadForStudent: true,
        lastMessageAt: new Date(),
      },
    });
  }

  const existingApprovedOrder =
    (await prisma.order.findUnique({
      where: {
        internalPaymentCode: "PAY-20260423-SEED01",
      },
      include: {
        items: true,
      },
    })) ??
    (await prisma.order.findFirst({
      where: {
        userId: student.id,
        status: "approved",
      },
      include: {
        items: true,
      },
    }));

  if (!existingApprovedOrder) {
    await prisma.order.create({
      data: {
        userId: student.id,
        subtotal: 890,
        discount: 170,
        total: 720,
        status: "approved",
        paymentMethod: "vodafone_cash",
        internalPaymentCode: "PAY-20260423-SEED01",
        paymentReference: "VC-APPROVED-1001",
        senderPhone: "01003797694",
        paymentRecipientNumber: "01003797694",
        paymentRecipientInstructorId: instructor.id,
        paymentRecipientInstructorName: instructor.name,
        paymentSubmittedAt: new Date(),
        reviewedAt: new Date(),
        reviewedByAdminId: admin.id,
        items: {
          create: [
            {
              courseId: course.id,
              price: 720,
            },
          ],
        },
      },
    });
  } else {
    await prisma.order.update({
      where: { id: existingApprovedOrder.id },
      data: {
        internalPaymentCode: existingApprovedOrder.internalPaymentCode ?? "PAY-20260423-SEED01",
        paymentRecipientNumber: "01003797694",
        paymentRecipientInstructorId: instructor.id,
        paymentRecipientInstructorName: instructor.name,
      },
    });
  }

  const existingWaitingReviewOrder =
    (await prisma.order.findUnique({
      where: {
        internalPaymentCode: "PAY-20260423-SEED02",
      },
    })) ??
    (await prisma.order.findFirst({
      where: {
        userId: reviewerOne.id,
        status: "waiting_review",
      },
    }));

  if (!existingWaitingReviewOrder) {
    await prisma.order.create({
      data: {
        userId: reviewerOne.id,
        subtotal: 640,
        discount: 0,
        total: 640,
        status: "waiting_review",
        paymentMethod: "vodafone_cash",
        internalPaymentCode: "PAY-20260423-SEED02",
        paymentReference: "VC-PENDING-2001",
        senderPhone: "01095787735",
        paymentRecipientNumber: "01214874744",
        paymentRecipientInstructorId: youssefInstructor.id,
        paymentRecipientInstructorName: youssefInstructor.name,
        paymentSubmittedAt: new Date(),
        paymentExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              courseId: relatedCourseOne.id,
              price: 640,
            },
          ],
        },
      },
    });
  } else {
    await prisma.orderItem.deleteMany({
      where: { orderId: existingWaitingReviewOrder.id },
    });

    await prisma.order.update({
      where: { id: existingWaitingReviewOrder.id },
      data: {
        subtotal: 640,
        discount: 0,
        total: 640,
        internalPaymentCode: existingWaitingReviewOrder.internalPaymentCode ?? "PAY-20260423-SEED02",
        paymentRecipientNumber: "01214874744",
        paymentRecipientInstructorId: youssefInstructor.id,
        paymentRecipientInstructorName: youssefInstructor.name,
        items: {
          create: [
            {
              courseId: relatedCourseOne.id,
              price: 640,
            },
          ],
        },
      },
    });
  }

  const seededNotifications = [
    {
      title: "تم تفعيل الكورس بنجاح",
      body: "أصبح كورس أساسيات التشريح السريري متاحًا الآن داخل كورساتي.",
      type: "enrollment",
      read: false,
    },
    {
      title: "تم تأكيد الدفع",
      body: "تم تسجيل عملية الدفع الخاصة بك عبر فودافون كاش واعتمادها بنجاح.",
      type: "payment",
      read: true,
    },
  ];

  for (const notification of seededNotifications) {
    const exists = await prisma.notification.findFirst({
      where: {
        userId: student.id,
        title: notification.title,
      },
    });

    if (!exists) {
      await prisma.notification.create({
        data: {
          userId: student.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          read: notification.read,
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      targetUserId: student.id,
      action: "seed_admin_setup",
      entityType: "Seed",
      entityId: student.id,
      metadata: { seeded: true },
    },
  });

  await Promise.all([
    repairTextTable(prisma.user, ["name"]),
    repairTextTable(prisma.studentProfile, ["phone", "university", "academicYear"]),
    repairTextTable(prisma.category, ["name", "description"]),
    repairTextTable(prisma.instructor, ["name", "title", "bio", "specialization", "vodafoneCashNumber"]),
    repairTextTable(prisma.course, ["title", "subtitle", "description", "language"]),
    repairTextTable(prisma.courseChapter, ["title", "description"]),
    repairTextTable(prisma.courseLesson, ["title", "summary", "contentBody"]),
    repairTextTable(prisma.lessonAttachment, ["fileName", "mimeType"]),
    repairTextTable(prisma.exam, ["title", "slug", "description", "instructions"]),
    repairTextTable(prisma.examQuestion, ["prompt", "explanation"]),
    repairTextTable(prisma.examOption, ["text"]),
    repairTextTable(prisma.userOverride, ["customNote"]),
    repairTextTable(prisma.supportTicket, ["title", "issueType", "description", "resolutionNote"]),
    repairTextTable(prisma.review, ["comment"]),
    repairTextTable(prisma.notification, ["title", "body", "type"]),
  ]);

  console.log(`Seed completed. Default admin login: ${ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
