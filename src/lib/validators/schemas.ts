import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(8, "Enter a valid phone number").optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const verifyEmailCodeSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  code: z
    .string()
    .trim()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
  purpose: z.enum(["login", "register"]),
});

export const resendEmailCodeSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  purpose: z.enum(["login", "register"]),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    code: z
      .string()
      .trim()
      .length(6, "Enter the 6-digit code")
      .regex(/^\d{6}$/, "Enter the 6-digit code"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email address"),
  topic: z.enum(["support", "billing", "content", "course_access", "general"], {
    error: "Choose a topic",
  }),
  message: z.string().trim().min(1, "Message is required"),
});

export const checkoutSchema = z.object({
  paymentMethod: z.literal("vodafone_cash"),
  transactionReference: z.string().trim().max(120).optional().or(z.literal("")),
  senderPhone: z.string().trim().min(8, "Enter a valid sender phone number").optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(1, "Review comment is required").max(600),
});

export const publicCourseDiscoverySchema = z.object({
  query: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.string().trim().max(120).optional().or(z.literal("")).or(z.literal("all")),
  price: z.enum(["all", "free", "paid"]).optional(),
  instructor: z.string().trim().max(120).optional().or(z.literal("")).or(z.literal("all")),
  rating: z.enum(["all", "4", "4.5"]).optional(),
  sort: z.enum(["popular", "newest", "rating", "price-low", "price-high"]).optional(),
  page: z.coerce.number().int().min(1).max(999).optional(),
  pageSize: z.coerce.number().int().min(1).max(24).optional(),
});

export const publicCategoryListingSchema = z.object({
  query: z.string().trim().max(120).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).max(999).optional(),
  pageSize: z.coerce.number().int().min(1).max(24).optional(),
});

export const publicInstructorListingSchema = z.object({
  query: z.string().trim().max(120).optional().or(z.literal("")),
  sort: z.enum(["popular", "rating", "courses", "name"]).optional(),
  page: z.coerce.number().int().min(1).max(999).optional(),
  pageSize: z.coerce.number().int().min(1).max(24).optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Enter a coupon code").max(40),
  subtotal: z.coerce.number().int().min(0).optional(),
});

export const adminCouponSchema = z
  .object({
    couponId: z.string().min(1).optional(),
    code: z.string().trim().min(3, "Enter a coupon code").max(40),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().int().min(1),
    minOrderAmount: z.coerce.number().int().min(0).optional(),
    maxUsage: z.coerce.number().int().min(1).optional(),
    expiresAt: z.string().trim().optional().or(z.literal("")),
    active: z.boolean().default(false),
  })
  .superRefine((coupon, ctx) => {
    if (coupon.type === "percent" && coupon.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percent coupons cannot be more than 100%.",
        path: ["value"],
      });
    }
  });

export const adminCourseSchema = z.object({
  title: z.string().min(4, "Course title is required"),
  titleEn: z.string().max(240).optional().or(z.literal("")),
  slug: z.string().min(3, "Slug is required"),
  subtitle: z.string().max(180).optional().or(z.literal("")),
  subtitleEn: z.string().max(180).optional().or(z.literal("")),
  description: z.string().trim().min(1, "Course description is required"),
  descriptionEn: z.string().optional().or(z.literal("")),
  thumbnail: z.string().min(6, "Add a thumbnail URL"),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional(),
  categoryId: z.string().min(1),
  instructorId: z.string().min(1),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string().max(40).optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  examPrep: z.boolean().optional(),
});

export const adminSectionSchema = z.object({
  courseId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  title: z.string().trim().min(2, "Enter a section title"),
  titleEn: z.string().trim().max(240).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(500).optional().or(z.literal("")),
  order: z.coerce.number().int().min(1).max(999),
  isPublished: z.boolean(),
});

export const adminLessonVideoSchema = z
  .object({
    provider: z.enum(["local", "cloudinary", "uploadthing", "youtube", "vimeo", "bunny", "custom"]),
    providerAssetId: z.string().trim().max(180).optional().or(z.literal("")),
    fileName: z.string().trim().max(240).optional().or(z.literal("")),
    mimeType: z.string().trim().max(180).optional().or(z.literal("")),
    fileSizeBytes: z.coerce.number().int().min(0).optional(),
    playbackUrl: z.string().trim().max(1000).optional().or(z.literal("")),
    thumbnailUrl: z.string().trim().max(1000).optional().or(z.literal("")),
    durationSeconds: z.coerce.number().int().min(0).optional(),
    storageKey: z.string().trim().max(240).optional().or(z.literal("")),
    visibilityStatus: z.enum(["draft", "processing", "ready", "hidden"]),
  })
  .optional();

export const adminUploadSchema = z.object({
  kind: z.enum(["video", "pdf", "attachment", "thumbnail", "receipt"]),
});

export const adminLessonSchema = z.object({
  lessonId: z.string().min(1).optional(),
  chapterId: z.string().min(1),
  title: z.string().trim().min(2, "Enter a lesson title"),
  titleEn: z.string().trim().max(240).optional().or(z.literal("")),
  slug: z.string().trim().min(2, "Enter a valid slug"),
  order: z.coerce.number().int().min(1).max(999),
  lessonType: z.enum(["video", "text", "pdf", "attachment", "quiz"]),
  summary: z.string().trim().max(280).optional().or(z.literal("")),
  summaryEn: z.string().trim().max(280).optional().or(z.literal("")),
  contentBody: z.string().trim().optional().or(z.literal("")),
  contentBodyEn: z.string().trim().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(0).max(1200),
  isPublished: z.boolean(),
  isPreview: z.boolean(),
  quizRequired: z.boolean(),
  video: adminLessonVideoSchema,
});

export const adminAttachmentSchema = z.object({
  attachmentId: z.string().min(1).optional(),
  lessonId: z.string().min(1),
  title: z.string().trim().max(180).optional().or(z.literal("")),
  fileName: z.string().trim().min(2, "Enter a file name"),
  fileUrl: z.string().trim().min(6, "Add a file URL"),
  storageKey: z.string().trim().max(240).optional().or(z.literal("")),
  provider: z.enum(["local", "cloudinary", "uploadthing", "youtube", "vimeo", "bunny", "custom"]),
  mimeType: z.string().trim().min(3, "Add a valid mime type"),
  fileSizeBytes: z.coerce.number().int().min(0),
  order: z.coerce.number().int().min(1).max(999),
  isPublished: z.boolean(),
  allowDownload: z.boolean(),
  visibilityStatus: z.enum(["draft", "processing", "ready", "hidden"]),
});

export const adminExamSchema = z.object({
  title: z.string().trim().min(3, "Enter an exam title"),
  titleEn: z.string().trim().max(240).optional().or(z.literal("")),
  slug: z.string().trim().min(3, "Enter a URL slug").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only"),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(800).optional().or(z.literal("")),
  instructions: z.string().trim().max(1600).optional().or(z.literal("")),
  instructionsEn: z.string().trim().max(1600).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  passingScore: z.coerce.number().int().min(0).max(100000),
  courseId: z.string().trim().optional().or(z.literal("")),
  startsAt: z.string().trim().optional().or(z.literal("")),
  endsAt: z.string().trim().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
  allowRetakes: z.boolean().default(false),
  showResults: z.boolean().default(true),
});

export const adminExamQuestionSchema = z.object({
  examId: z.string().min(1),
  questionId: z.string().optional(),
  type: z.enum(["multiple_choice", "true_false", "short_answer"]),
  order: z.coerce.number().int().min(1).max(500),
  prompt: z.string().trim().min(3, "Enter the question prompt"),
  promptEn: z.string().trim().max(1000).optional().or(z.literal("")),
  explanation: z.string().trim().max(1000).optional().or(z.literal("")),
  explanationEn: z.string().trim().max(1000).optional().or(z.literal("")),
  marks: z.coerce.number().int().min(1).max(1000),
  optionsText: z.string().trim().optional().or(z.literal("")),
  correctOptionOrders: z.string().trim().optional().or(z.literal("")),
});

export const examSubmissionSchema = z.object({
  examId: z.string().min(1),
  attemptId: z.string().min(1),
});

export const adminCategorySchema = z.object({
  name: z.string().min(2),
  nameEn: z.string().max(240).optional().or(z.literal("")),
  slug: z.string().min(2),
  description: z.string().optional(),
  descriptionEn: z.string().optional().or(z.literal("")),
  icon: z.string().optional(),
});

export const adminInstructorSchema = z.object({
  name: z.string().min(2),
  nameEn: z.string().max(240).optional().or(z.literal("")),
  slug: z.string().min(2),
  title: z.string().optional().or(z.literal("")),
  titleEn: z.string().max(240).optional().or(z.literal("")),
  avatar: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  bioEn: z.string().optional().or(z.literal("")),
  specialization: z.string().optional().or(z.literal("")),
  specializationEn: z.string().max(240).optional().or(z.literal("")),
  vodafoneCashNumber: z.string().optional().or(z.literal("")),
});

export const studentProfileSettingsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  phone: z.string().trim().min(8, "Enter a valid phone number").optional().or(z.literal("")),
  university: z.string().trim().max(120).optional().or(z.literal("")),
  academicYear: z.string().trim().max(80).optional().or(z.literal("")),
});

export const adminPaymentReviewSchema = z.object({
  orderId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  rejectionReason: z.string().trim().max(500).optional().nullable().or(z.literal("")),
});

export const supportTicketCreateSchema = z.object({
  title: z.string().trim().min(3, "Enter a clear ticket title"),
  issueType: z.enum(["course_access", "payment", "technical", "permissions", "general"]),
  message: z.string().trim().min(1, "Message is required"),
});

export const supportTicketReplySchema = z.object({
  ticketId: z.string().min(1),
  message: z.string().trim().min(2, "Reply cannot be empty"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>;
export type ResendEmailCodeInput = z.infer<typeof resendEmailCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type StudentProfileSettingsInput = z.infer<typeof studentProfileSettingsSchema>;
export type AdminPaymentReviewInput = z.infer<typeof adminPaymentReviewSchema>;
export type SupportTicketCreateInput = z.infer<typeof supportTicketCreateSchema>;
export type SupportTicketReplyInput = z.infer<typeof supportTicketReplySchema>;
export type PublicCourseDiscoveryInput = z.infer<typeof publicCourseDiscoverySchema>;
export type PublicCategoryListingInput = z.infer<typeof publicCategoryListingSchema>;
export type PublicInstructorListingInput = z.infer<typeof publicInstructorListingSchema>;
export type AdminCourseInput = z.infer<typeof adminCourseSchema>;
export type AdminSectionInput = z.infer<typeof adminSectionSchema>;
export type AdminLessonInput = z.infer<typeof adminLessonSchema>;
export type AdminAttachmentInput = z.infer<typeof adminAttachmentSchema>;
export type AdminExamInput = z.infer<typeof adminExamSchema>;
export type AdminExamQuestionInput = z.infer<typeof adminExamQuestionSchema>;
