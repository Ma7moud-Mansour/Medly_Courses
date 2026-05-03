import { prisma } from "../src/lib/db";

async function main() {
  console.log("Seeding translations for real data...");

  // Instructors
  await prisma.instructor.updateMany({
    where: { name: { contains: "عبد الرحمن" } },
    data: {
      nameEn: "Dr. Abdelrahman Nader",
      titleEn: "Consultant Physician",
      bioEn: "Specialized in clear and structured medical education for students.",
      specializationEn: "General Medicine",
    },
  });

  await prisma.instructor.updateMany({
    where: { name: { contains: "يوسف" } },
    data: {
      nameEn: "Dr. Youssef Ziada",
      titleEn: "Specialist Surgeon",
      bioEn: "Focused on surgical techniques and clinical anatomy.",
      specializationEn: "Surgery",
    },
  });

  // Courses
  const courses = await prisma.course.findMany();
  for (const course of courses) {
    if (course.title.includes("التشريح")) {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          titleEn: "Clinical Anatomy Basics",
          subtitleEn: "Master the structure of the human body for clinical application.",
          descriptionEn: "A comprehensive guide to clinical anatomy designed for medical students.",
        },
      });
    } else if (course.title.includes("الصور")) {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          titleEn: "Basic Medical Imaging",
          subtitleEn: "Learn to read X-rays, CTs, and MRIs confidently.",
          descriptionEn: "An essential course for interpreting common medical imaging results.",
        },
      });
    } else if (course.title.includes("القلب")) {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          titleEn: "Clinical Cardiology Essentials",
          subtitleEn: "Understand ECGs, heart diseases, and management.",
          descriptionEn: "Master the fundamentals of clinical cardiology and patient care.",
        },
      });
    } else {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          titleEn: "Medical Course",
          subtitleEn: "High yield medical content for students.",
          descriptionEn: "Structured medical course.",
        },
      });
    }
  }

  // Categories
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.name.includes("باطنة") || cat.slug.includes("internal")) {
      await prisma.category.update({
        where: { id: cat.id },
        data: {
          nameEn: "Internal Medicine",
          descriptionEn: "Comprehensive internal medicine courses.",
        },
      });
    } else if (cat.name.includes("جراحة") || cat.slug.includes("surgery")) {
      await prisma.category.update({
        where: { id: cat.id },
        data: {
          nameEn: "Surgery",
          descriptionEn: "General surgery and operative techniques.",
        },
      });
    } else if (cat.name.includes("أساسيات") || cat.slug.includes("basic")) {
      await prisma.category.update({
        where: { id: cat.id },
        data: {
          nameEn: "Basic Sciences",
          descriptionEn: "Foundational medical sciences.",
        },
      });
    } else {
      await prisma.category.update({
        where: { id: cat.id },
        data: {
          nameEn: "Medical Speciality",
          descriptionEn: "Specialized medical topics.",
        },
      });
    }
  }

  console.log("Translations seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
