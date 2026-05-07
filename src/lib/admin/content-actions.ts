"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildFeedbackPath, getActionErrorMessage } from "@/lib/actions/server-action-feedback";
import { requireServerRole } from "@/lib/auth/server-session";
import {
  createAdminCourse,
  createAdminCategory,
  createCourseLesson,
  createCourseSection,
  createLessonAttachment,
  deleteLessonAttachment,
  deleteAdminCategory,
  createAdminInstructor,
  deleteAdminInstructor,
  updateAdminInstructor,
  deleteAdminCourse,
  deleteCourseLesson,
  deleteCourseSection,
  updateAdminCategory,
  updateAdminCourse,
  updateLessonAttachment,
  updateCourseLesson,
  updateCourseSection,
} from "@/lib/content/repository";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  deleteAdminReview,
  updateAdminCoupon,
} from "@/lib/admin/repository";
import {
  adminAttachmentSchema,
  adminCategorySchema,
  adminCouponSchema,
  adminCourseSchema,
  adminInstructorSchema,
  adminLessonSchema,
  adminSectionSchema,
} from "@/lib/validators/schemas";
import { slugifyArabic } from "@/lib/utils";

const CONTENT_ADMIN_ROLES = ["admin"] as const;

function getCheckedValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function getOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function getOptionalNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCourseSlug(slug: string | undefined, title: string) {
  const manualSlug = slug?.trim();
  const base = slugifyArabic(manualSlug || title) || "course";

  return manualSlug ? base : `${base}-${Date.now().toString(36)}`;
}

// Keep validation, role checks, and cache revalidation at the server boundary
// so admin content mutations stay predictable and secure.
async function requireContentAdmin() {
  return requireServerRole([...CONTENT_ADMIN_ROLES]);
}

export async function createAdminCourseAction(formData: FormData) {
  const actor = await requireContentAdmin();
  let destination = "/admin/courses/new";

  try {
    const parsed = adminCourseSchema.parse({
      title: formData.get("title"),
      slug: formData.get("slug"),
      subtitle: formData.get("subtitle") ?? "",
      description: formData.get("description"),
      thumbnail: formData.get("thumbnail"),
      price: formData.get("price"),
      discountPrice: formData.get("discountPrice") || undefined,
      categoryId: formData.get("categoryId"),
      instructorId: formData.get("instructorId"),
      level: formData.get("level") ?? "beginner",
      language: formData.get("language"),
      isPublished: getCheckedValue(formData.get("isPublished")),
      featured: getCheckedValue(formData.get("featured")),
      bestseller: getCheckedValue(formData.get("bestseller")),
      examPrep: getCheckedValue(formData.get("examPrep")),
    });
    const courseSlug = buildCourseSlug(parsed.slug, parsed.title);

    const course = await createAdminCourse({
      adminId: actor.userId,
      title: parsed.title,
      slug: courseSlug,
      subtitle: parsed.subtitle || undefined,
      description: parsed.description,
      thumbnail: parsed.thumbnail,
      price: parsed.price,
      discountPrice: parsed.discountPrice,
      categoryId: parsed.categoryId,
      instructorId: parsed.instructorId,
      level: parsed.level,
      language: parsed.language || undefined,
      isPublished: parsed.isPublished,
      featured: parsed.featured,
      bestseller: parsed.bestseller,
      examPrep: parsed.examPrep,
    });

    revalidatePath("/admin/courses");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath("/categories");
    revalidatePath("/instructors");
    destination = buildFeedbackPath(`/admin/courses/${course.id}/edit`, {
      flash: "course-created",
    });
  } catch (error) {
    destination = buildFeedbackPath("/admin/courses/new", {
      error: getActionErrorMessage(error, "Unable to create the course right now."),
    });
  }

  redirect(destination);
}

export async function updateAdminCourseAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminCourseSchema.parse({
      title: formData.get("title"),
      slug: formData.get("slug"),
      subtitle: formData.get("subtitle") ?? "",
      description: formData.get("description"),
      thumbnail: formData.get("thumbnail"),
      price: formData.get("price"),
      discountPrice: formData.get("discountPrice") || undefined,
      categoryId: formData.get("categoryId"),
      instructorId: formData.get("instructorId"),
      level: formData.get("level") ?? "beginner",
      language: formData.get("language"),
      isPublished: getCheckedValue(formData.get("isPublished")),
      featured: getCheckedValue(formData.get("featured")),
      bestseller: getCheckedValue(formData.get("bestseller")),
      examPrep: getCheckedValue(formData.get("examPrep")),
    });
    const courseSlug = buildCourseSlug(parsed.slug, parsed.title);

    await updateAdminCourse({
      adminId: actor.userId,
      courseId,
      title: parsed.title,
      slug: courseSlug,
      subtitle: parsed.subtitle || undefined,
      description: parsed.description,
      thumbnail: parsed.thumbnail,
      price: parsed.price,
      discountPrice: parsed.discountPrice,
      categoryId: parsed.categoryId,
      instructorId: parsed.instructorId,
      level: parsed.level,
      language: parsed.language || undefined,
      isPublished: parsed.isPublished,
      featured: parsed.featured,
      bestseller: parsed.bestseller,
      examPrep: parsed.examPrep,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath("/categories");
    revalidatePath("/instructors");
    destination = buildFeedbackPath(editPath, { flash: "course-updated" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to save the course changes."),
    });
  }

  redirect(destination);
}

export async function createCourseSectionAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminSectionSchema.parse({
      courseId,
      title: formData.get("title"),
      description: formData.get("description"),
      order: formData.get("order"),
      isPublished: getCheckedValue(formData.get("isPublished")),
    });

    await createCourseSection({
      adminId: actor.userId,
      courseId,
      title: parsed.title,
      description: parsed.description || undefined,
      order: parsed.order,
      isPublished: parsed.isPublished,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "section-created" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to create the section."),
    });
  }

  redirect(destination);
}

export async function updateCourseSectionAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminSectionSchema.parse({
      sectionId,
      title: formData.get("title"),
      description: formData.get("description"),
      order: formData.get("order"),
      isPublished: getCheckedValue(formData.get("isPublished")),
    });

    await updateCourseSection({
      adminId: actor.userId,
      sectionId,
      title: parsed.title,
      description: parsed.description || undefined,
      order: parsed.order,
      isPublished: parsed.isPublished,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "section-updated" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to save the section changes."),
    });
  }

  redirect(destination);
}

export async function deleteCourseSectionAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    await deleteCourseSection({
      adminId: actor.userId,
      sectionId,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/categories");
    revalidatePath("/instructors");
    destination = buildFeedbackPath(editPath, { flash: "section-deleted" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to delete the section."),
    });
  }

  redirect(destination);
}

function readLessonVideo(formData: FormData) {
  const manualPlaybackUrl = getOptionalText(formData.get("manualVideoPlaybackUrl"));
  const uploadPlaybackUrl = getOptionalText(formData.get("videoPlaybackUrl"));
  const playbackUrl = manualPlaybackUrl ?? uploadPlaybackUrl;
  const usesManualVideo = Boolean(manualPlaybackUrl);

  if (!playbackUrl) {
    return undefined;
  }

  return {
    provider: String(formData.get(usesManualVideo ? "manualVideoProvider" : "videoProvider") ?? "custom") as
      | "local"
      | "cloudinary"
      | "uploadthing"
      | "youtube"
      | "vimeo"
      | "bunny"
      | "custom",
    providerAssetId: getOptionalText(formData.get("videoProviderAssetId")),
    fileName: usesManualVideo ? undefined : getOptionalText(formData.get("videoFileName")),
    mimeType: usesManualVideo ? undefined : getOptionalText(formData.get("videoMimeType")),
    fileSizeBytes: usesManualVideo ? undefined : getOptionalNumber(formData.get("videoFileSizeBytes")),
    playbackUrl,
    thumbnailUrl: getOptionalText(formData.get("videoThumbnailUrl")),
    durationSeconds: usesManualVideo ? undefined : getOptionalNumber(formData.get("videoDurationSeconds")),
    storageKey: usesManualVideo ? undefined : getOptionalText(formData.get("videoStorageKey")),
    visibilityStatus: String(formData.get("videoVisibilityStatus") ?? "ready") as
      | "draft"
      | "processing"
      | "ready"
      | "hidden",
  };
}

export async function createCourseLessonAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminLessonSchema.parse({
      chapterId,
      title: formData.get("title"),
      slug: formData.get("slug"),
      order: formData.get("order"),
      lessonType: formData.get("lessonType"),
      summary: formData.get("summary"),
      contentBody: formData.get("contentBody"),
      durationMinutes: formData.get("durationMinutes"),
      isPublished: getCheckedValue(formData.get("isPublished")),
      isPreview: getCheckedValue(formData.get("isPreview")),
      quizRequired: getCheckedValue(formData.get("quizRequired")),
      video: readLessonVideo(formData),
    });

    await createCourseLesson({
      adminId: actor.userId,
      chapterId,
      title: parsed.title,
      slug: parsed.slug,
      order: parsed.order,
      lessonType: parsed.lessonType,
      summary: parsed.summary || undefined,
      contentBody: parsed.contentBody || undefined,
      durationMinutes: parsed.durationMinutes,
      isPublished: parsed.isPublished,
      isPreview: parsed.isPreview,
      quizRequired: parsed.quizRequired,
      video: parsed.video
        ? {
            provider: parsed.video.provider,
            providerAssetId: parsed.video.providerAssetId || undefined,
            fileName: parsed.video.fileName || undefined,
            mimeType: parsed.video.mimeType || undefined,
            fileSizeBytes: parsed.video.fileSizeBytes,
            playbackUrl: parsed.video.playbackUrl || "",
            thumbnailUrl: parsed.video.thumbnailUrl || undefined,
            durationSeconds: parsed.video.durationSeconds,
            storageKey: parsed.video.storageKey || undefined,
            visibilityStatus: parsed.video.visibilityStatus,
          }
        : undefined,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "lesson-created" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to create the lesson."),
    });
  }

  redirect(destination);
}

export async function updateCourseLessonAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminLessonSchema.parse({
      lessonId,
      chapterId,
      title: formData.get("title"),
      slug: formData.get("slug"),
      order: formData.get("order"),
      lessonType: formData.get("lessonType"),
      summary: formData.get("summary"),
      contentBody: formData.get("contentBody"),
      durationMinutes: formData.get("durationMinutes"),
      isPublished: getCheckedValue(formData.get("isPublished")),
      isPreview: getCheckedValue(formData.get("isPreview")),
      quizRequired: getCheckedValue(formData.get("quizRequired")),
      video: readLessonVideo(formData),
    });

    await updateCourseLesson({
      adminId: actor.userId,
      lessonId,
      title: parsed.title,
      slug: parsed.slug,
      order: parsed.order,
      lessonType: parsed.lessonType,
      summary: parsed.summary || undefined,
      contentBody: parsed.contentBody || undefined,
      durationMinutes: parsed.durationMinutes,
      isPublished: parsed.isPublished,
      isPreview: parsed.isPreview,
      quizRequired: parsed.quizRequired,
      video: parsed.video
        ? {
            provider: parsed.video.provider,
            providerAssetId: parsed.video.providerAssetId || undefined,
            fileName: parsed.video.fileName || undefined,
            mimeType: parsed.video.mimeType || undefined,
            fileSizeBytes: parsed.video.fileSizeBytes,
            playbackUrl: parsed.video.playbackUrl || "",
            thumbnailUrl: parsed.video.thumbnailUrl || undefined,
            durationSeconds: parsed.video.durationSeconds,
            storageKey: parsed.video.storageKey || undefined,
            visibilityStatus: parsed.video.visibilityStatus,
          }
        : undefined,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "lesson-updated" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to save the lesson changes."),
    });
  }

  redirect(destination);
}

export async function deleteCourseLessonAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    await deleteCourseLesson({
      adminId: actor.userId,
      lessonId,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/categories");
    revalidatePath("/instructors");
    destination = buildFeedbackPath(editPath, { flash: "lesson-deleted" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to delete the lesson."),
    });
  }

  redirect(destination);
}

export async function createLessonAttachmentAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminAttachmentSchema.parse({
      lessonId,
      title: formData.get("title"),
      fileName: formData.get("fileName"),
      fileUrl: formData.get("fileUrl"),
      storageKey: formData.get("storageKey"),
      provider: formData.get("provider"),
      mimeType: formData.get("mimeType"),
      fileSizeBytes: formData.get("fileSizeBytes"),
      order: formData.get("order"),
      isPublished: getCheckedValue(formData.get("isPublished")),
      allowDownload: getCheckedValue(formData.get("allowDownload")),
      visibilityStatus: formData.get("visibilityStatus"),
    });

    await createLessonAttachment({
      adminId: actor.userId,
      lessonId,
      title: parsed.title || undefined,
      fileName: parsed.fileName,
      fileUrl: parsed.fileUrl,
      storageKey: parsed.storageKey || undefined,
      provider: parsed.provider,
      mimeType: parsed.mimeType,
      fileSizeBytes: parsed.fileSizeBytes,
      order: parsed.order,
      isPublished: parsed.isPublished,
      allowDownload: parsed.allowDownload,
      visibilityStatus: parsed.visibilityStatus,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "attachment-created" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to create the attachment."),
    });
  }

  redirect(destination);
}

export async function updateLessonAttachmentAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminAttachmentSchema.parse({
      attachmentId,
      lessonId,
      title: formData.get("title"),
      fileName: formData.get("fileName"),
      fileUrl: formData.get("fileUrl"),
      storageKey: formData.get("storageKey"),
      provider: formData.get("provider"),
      mimeType: formData.get("mimeType"),
      fileSizeBytes: formData.get("fileSizeBytes"),
      order: formData.get("order"),
      isPublished: getCheckedValue(formData.get("isPublished")),
      allowDownload: getCheckedValue(formData.get("allowDownload")),
      visibilityStatus: formData.get("visibilityStatus"),
    });

    await updateLessonAttachment({
      adminId: actor.userId,
      attachmentId,
      title: parsed.title || undefined,
      fileName: parsed.fileName,
      fileUrl: parsed.fileUrl,
      storageKey: parsed.storageKey || undefined,
      provider: parsed.provider,
      mimeType: parsed.mimeType,
      fileSizeBytes: parsed.fileSizeBytes,
      order: parsed.order,
      isPublished: parsed.isPublished,
      allowDownload: parsed.allowDownload,
      visibilityStatus: parsed.visibilityStatus,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "attachment-updated" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to save the attachment changes."),
    });
  }

  redirect(destination);
}

export async function deleteLessonAttachmentAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const editPath = `/admin/courses/${courseId}/edit`;
  let destination = editPath;

  try {
    await deleteLessonAttachment({
      adminId: actor.userId,
      attachmentId,
    });

    revalidatePath("/admin/courses");
    revalidatePath(editPath);
    destination = buildFeedbackPath(editPath, { flash: "attachment-deleted" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to delete the attachment."),
    });
  }

  redirect(destination);
}

export async function createAdminInstructorAction(formData: FormData) {
  const actor = await requireContentAdmin();
  let destination = "/admin/instructors";

  try {
    const parsed = adminInstructorSchema.parse({
      name: formData.get("name"),
      nameEn: formData.get("nameEn"),
      slug: formData.get("slug"),
      title: formData.get("title"),
      titleEn: formData.get("titleEn"),
      avatar: formData.get("avatar"),
      bio: formData.get("bio"),
      bioEn: formData.get("bioEn"),
      specialization: formData.get("specialization"),
      specializationEn: formData.get("specializationEn"),
      vodafoneCashNumber: formData.get("vodafoneCashNumber"),
    });

    await createAdminInstructor({
      adminId: actor.userId,
      ...parsed,
    });

    revalidatePath("/admin/instructors");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/instructors");
    destination = buildFeedbackPath("/admin/instructors", { flash: "instructor-created" });
  } catch (error) {
    destination = buildFeedbackPath("/admin/instructors/new", {
      error: getActionErrorMessage(error, "Unable to create instructor."),
    });
  }

  redirect(destination);
}

export async function updateAdminInstructorAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const instructorId = String(formData.get("instructorId") ?? "");
  const editPath = `/admin/instructors/${instructorId}/edit`;
  let destination = editPath;

  try {
    const parsed = adminInstructorSchema.parse({
      name: formData.get("name"),
      nameEn: formData.get("nameEn"),
      slug: formData.get("slug"),
      title: formData.get("title"),
      titleEn: formData.get("titleEn"),
      avatar: formData.get("avatar"),
      bio: formData.get("bio"),
      bioEn: formData.get("bioEn"),
      specialization: formData.get("specialization"),
      specializationEn: formData.get("specializationEn"),
      vodafoneCashNumber: formData.get("vodafoneCashNumber"),
    });

    await updateAdminInstructor({
      adminId: actor.userId,
      instructorId,
      ...parsed,
    });

    revalidatePath("/admin/instructors");
    revalidatePath(editPath);
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/instructors");
    revalidatePath(`/instructors/${parsed.slug}`);
    destination = buildFeedbackPath(editPath, { flash: "instructor-updated" });
  } catch (error) {
    destination = buildFeedbackPath(editPath, {
      error: getActionErrorMessage(error, "Unable to save instructor changes."),
    });
  }

  redirect(destination);
}

export async function deleteAdminInstructorAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const instructorId = String(formData.get("instructorId") ?? "");
  let destination = "/admin/instructors";

  try {
    await deleteAdminInstructor({
      adminId: actor.userId,
      instructorId,
    });

    revalidatePath("/admin/instructors");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/instructors");
    destination = buildFeedbackPath("/admin/instructors", { flash: "instructor-deleted" });
  } catch (error) {
    destination = buildFeedbackPath(`/admin/instructors/${instructorId}/edit`, {
      error: getActionErrorMessage(error, "Cannot delete this instructor while courses are assigned."),
    });
  }

  redirect(destination);
}

export async function deleteAdminCourseAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  let destination = "/admin/courses";

  try {
    await deleteAdminCourse({
      adminId: actor.userId,
      courseId,
    });

    revalidatePath("/admin/courses");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/categories");
    revalidatePath("/instructors");
    destination = buildFeedbackPath("/admin/courses", { flash: "course-deleted" });
  } catch (error) {
    destination = buildFeedbackPath(`/admin/courses/${courseId}/edit`, {
      error: getActionErrorMessage(error, "Unable to delete course."),
    });
  }

  redirect(destination);
}

export async function createAdminCategoryAction(formData: FormData) {
  const actor = await requireContentAdmin();
  let destination = "/admin/categories";

  try {
    const parsed = adminCategorySchema.parse({
      name: formData.get("name"),
      nameEn: formData.get("nameEn"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      descriptionEn: formData.get("descriptionEn"),
      icon: formData.get("icon"),
    });

    await createAdminCategory({
      adminId: actor.userId,
      name: parsed.name,
      nameEn: parsed.nameEn || undefined,
      slug: parsed.slug,
      description: parsed.description || undefined,
      descriptionEn: parsed.descriptionEn || undefined,
      icon: parsed.icon || undefined,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/categories");
    revalidatePath(`/categories/${parsed.slug}`);
    destination = buildFeedbackPath("/admin/categories", { flash: "category-created" });
  } catch (error) {
    destination = buildFeedbackPath("/admin/categories", {
      error: getActionErrorMessage(error, "Unable to create category."),
    });
  }

  redirect(destination);
}

export async function updateAdminCategoryAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const categoryId = String(formData.get("categoryId") ?? "");
  let destination = "/admin/categories";

  try {
    const parsed = adminCategorySchema.parse({
      name: formData.get("name"),
      nameEn: formData.get("nameEn"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      descriptionEn: formData.get("descriptionEn"),
      icon: formData.get("icon"),
    });

    await updateAdminCategory({
      adminId: actor.userId,
      categoryId,
      name: parsed.name,
      nameEn: parsed.nameEn || undefined,
      slug: parsed.slug,
      description: parsed.description || undefined,
      descriptionEn: parsed.descriptionEn || undefined,
      icon: parsed.icon || undefined,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/categories");
    revalidatePath(`/categories/${parsed.slug}`);
    destination = buildFeedbackPath("/admin/categories", { flash: "category-updated" });
  } catch (error) {
    destination = buildFeedbackPath("/admin/categories", {
      error: getActionErrorMessage(error, "Unable to update category."),
    });
  }

  redirect(destination);
}

export async function deleteAdminCategoryAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const categoryId = String(formData.get("categoryId") ?? "");
  let destination = "/admin/categories";

  try {
    await deleteAdminCategory({
      adminId: actor.userId,
      categoryId,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/categories");
    destination = buildFeedbackPath("/admin/categories", { flash: "category-deleted" });
  } catch (error) {
    destination = buildFeedbackPath("/admin/categories", {
      error: getActionErrorMessage(error, "Cannot delete this category while it has assigned courses."),
    });
  }

  redirect(destination);
}

export async function createAdminCouponAction(formData: FormData) {
  const actor = await requireContentAdmin();
  let destination = "/admin/coupons";

  try {
    const parsed = adminCouponSchema.parse({
      code: formData.get("code"),
      type: formData.get("type"),
      value: formData.get("value"),
      minOrderAmount: getOptionalNumber(formData.get("minOrderAmount")),
      maxUsage: getOptionalNumber(formData.get("maxUsage")),
      expiresAt: formData.get("expiresAt"),
      active: getCheckedValue(formData.get("active")),
    });

    await createAdminCoupon({
      adminId: actor.userId,
      code: parsed.code,
      type: parsed.type,
      value: parsed.value,
      minOrderAmount: parsed.minOrderAmount,
      maxUsage: parsed.maxUsage,
      expiresAt: parsed.expiresAt || undefined,
      active: parsed.active,
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    destination = buildFeedbackPath("/admin/coupons", { flash: "coupon-created" });
  } catch (error) {
    destination = buildFeedbackPath("/admin/coupons", {
      error: getActionErrorMessage(error, "Unable to create coupon."),
    });
  }

  redirect(destination);
}

export async function updateAdminCouponAction(formData: FormData) {
  const actor = await requireContentAdmin();
  let destination = "/admin/coupons";

  try {
    const parsed = adminCouponSchema.parse({
      couponId: formData.get("couponId"),
      code: formData.get("code"),
      type: formData.get("type"),
      value: formData.get("value"),
      minOrderAmount: getOptionalNumber(formData.get("minOrderAmount")),
      maxUsage: getOptionalNumber(formData.get("maxUsage")),
      expiresAt: formData.get("expiresAt"),
      active: getCheckedValue(formData.get("active")),
    });

    await updateAdminCoupon({
      adminId: actor.userId,
      couponId: parsed.couponId ?? "",
      code: parsed.code,
      type: parsed.type,
      value: parsed.value,
      minOrderAmount: parsed.minOrderAmount,
      maxUsage: parsed.maxUsage,
      expiresAt: parsed.expiresAt || undefined,
      active: parsed.active,
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    destination = buildFeedbackPath("/admin/coupons", { flash: "coupon-updated" });
  } catch (error) {
    destination = buildFeedbackPath("/admin/coupons", {
      error: getActionErrorMessage(error, "Unable to update coupon."),
    });
  }

  redirect(destination);
}

export async function deleteAdminCouponAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const couponId = String(formData.get("couponId") ?? "");
  let destination = "/admin/coupons";

  try {
    await deleteAdminCoupon({
      adminId: actor.userId,
      couponId,
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    destination = buildFeedbackPath("/admin/coupons", { flash: "coupon-deleted" });
  } catch (error) {
    destination = buildFeedbackPath("/admin/coupons", {
      error: getActionErrorMessage(error, "Unable to delete coupon."),
    });
  }

  redirect(destination);
}

export async function deleteAdminReviewAction(formData: FormData) {
  const actor = await requireContentAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");
  let destination = "/admin/reviews";

  try {
    await deleteAdminReview({
      adminId: actor.userId,
      reviewId,
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/");
    revalidatePath("/courses");
    destination = buildFeedbackPath("/admin/reviews", { flash: "review-deleted" });
  } catch (error) {
    destination = buildFeedbackPath("/admin/reviews", {
      error: getActionErrorMessage(error, "Unable to delete review."),
    });
  }

  redirect(destination);
}
