-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nameEn" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "subtitleEn" TEXT,
ADD COLUMN     "titleEn" TEXT,
ALTER COLUMN "language" SET DEFAULT 'العربية';

-- AlterTable
ALTER TABLE "CourseChapter" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "CourseLesson" ADD COLUMN     "contentBodyEn" TEXT,
ADD COLUMN     "summaryEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "instructionsEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "ExamOption" ADD COLUMN     "textEn" TEXT;

-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN     "explanationEn" TEXT,
ADD COLUMN     "promptEn" TEXT;

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "bioEn" TEXT,
ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "specializationEn" TEXT,
ADD COLUMN     "titleEn" TEXT;
