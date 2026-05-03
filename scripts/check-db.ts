import { prisma } from "../src/lib/db";

async function main() {
  const instructors = await prisma.instructor.findMany();
  console.log("Instructors:", instructors.map(i => ({ id: i.id, name: i.name, nameEn: i.nameEn })));

  const courses = await prisma.course.findMany();
  console.log("Courses:", courses.map(c => ({ id: c.id, title: c.title, titleEn: c.titleEn })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
