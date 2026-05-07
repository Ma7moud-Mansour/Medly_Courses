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
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@medly.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
const SUPPORT_EMAIL = process.env.SEED_SUPPORT_EMAIL ?? "support@medly.com";
const SUPPORT_PASSWORD = process.env.SEED_SUPPORT_PASSWORD ?? "Support@123456";

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

async function clearDemoCourses() {
  await prisma.$transaction([
    prisma.examAnswer.deleteMany({}),
    prisma.examOption.deleteMany({}),
    prisma.examQuestion.deleteMany({}),
    prisma.examAttempt.deleteMany({}),
    prisma.exam.deleteMany({}),
    prisma.lessonProgress.deleteMany({}),
    prisma.mediaAccessLog.deleteMany({}),
    prisma.antiPiracyEvent.deleteMany({}),
    prisma.lessonAttachment.deleteMany({}),
    prisma.lessonVideoAsset.deleteMany({}),
    prisma.courseLesson.deleteMany({}),
    prisma.courseChapter.deleteMany({}),
    prisma.review.deleteMany({}),
    prisma.wishlist.deleteMany({}),
    prisma.cartItem.deleteMany({}),
    prisma.orderItem.deleteMany({}),
    prisma.enrollment.deleteMany({}),
    prisma.course.deleteMany({}),
  ]);
}

async function main() {
  const [adminPasswordHash, supportPasswordHash] = await Promise.all([
    buildPasswordHash(ADMIN_PASSWORD),
    buildPasswordHash(SUPPORT_PASSWORD),
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

  await clearDemoCourses();

  const defaultCategories = [
    {
      name: "التشريح",
      slug: "anatomy",
      description: "تصنيف يمكن استخدامه عند إضافة كورسات التشريح من لوحة الأدمن.",
      icon: "brain",
    },
    {
      name: "الأشعة",
      slug: "radiology",
      description: "تصنيف مخصص لكورسات الأشعة والتشخيص الطبي.",
      icon: "scan",
    },
    {
      name: "عام",
      slug: "uncategorized",
      description: "تصنيف احتياطي للكورسات الجديدة.",
      icon: "folder",
    },
  ];

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  await prisma.instructor.updateMany({
    where: {
      OR: [
        { name: { contains: "يوسف عبد الرحمن" } },
        { name: { contains: "يوسف زياده" } },
      ],
    },
    data: {
      name: "يوسف زيادة",
    },
  });

  await prisma.instructor.upsert({
    where: { slug: "dr-youssef-ziadeh" },
    update: {
      name: "يوسف زيادة",
      title: "محاضر أشعة وتشخيص طبي",
      bio: "يشرح الصور الطبية وربطها بالحالة السريرية بخطوات هادئة وواضحة.",
      specialization: "Medical Imaging",
      vodafoneCashNumber: "01214874744",
      avatar: "/images/instructors/avatar-youssef.svg",
    },
    create: {
      name: "يوسف زيادة",
      slug: "dr-youssef-ziadeh",
      title: "محاضر أشعة وتشخيص طبي",
      bio: "يشرح الصور الطبية وربطها بالحالة السريرية بخطوات هادئة وواضحة.",
      specialization: "Medical Imaging",
      vodafoneCashNumber: "01214874744",
      avatar: "/images/instructors/avatar-youssef.svg",
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "seed_clean_catalog",
      entityType: "Seed",
      entityId: admin.id,
      metadata: { coursesCleared: true },
    },
  });

  console.log(`Seed completed without demo courses. Default admin login: ${ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
