export type UserRole = "student" | "admin" | "instructor" | "support";
export type UserStatus = "active" | "blocked" | "suspended";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export type Category = {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  coursesCount?: number;
  color?: string;
};

export type Instructor = {
  id: string;
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
  studentsCount?: number;
  coursesCount?: number;
};

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type LessonType = "video" | "text" | "pdf" | "attachment" | "quiz";
export type MediaProvider = "local" | "cloudinary" | "uploadthing" | "youtube" | "vimeo" | "bunny" | "custom";
export type MediaVisibilityStatus = "draft" | "processing" | "ready" | "hidden";

export type Course = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  thumbnail: string;
  isPublished?: boolean;
  previewVideo?: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  durationHours: number;
  lessonsCount: number;
  level: CourseLevel;
  language: string;
  lastUpdated?: string;
  featured?: boolean;
  bestseller?: boolean;
  examPrep?: boolean;
  categoryId: string;
  instructorId: string;
  year?: string;
  tags: string[];
  learningOutcomes: string[];
  requirements: string[];
};

export type Chapter = {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPublished?: boolean;
  courseId: string;
};

export type LessonVideoAsset = {
  id: string;
  lessonId: string;
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

export type LessonAttachment = {
  id: string;
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
};

export type Lesson = {
  id: string;
  title: string;
  slug: string;
  order: number;
  lessonType?: LessonType;
  summary?: string;
  contentBody?: string;
  durationMinutes: number;
  videoUrl?: string;
  videoAsset?: LessonVideoAsset;
  isPreview: boolean;
  isPublished?: boolean;
  chapterId: string;
  resources?: string[];
  attachments?: LessonAttachment[];
  quizRequired?: boolean;
  isAccessible?: boolean;
  lockedReason?: string;
};

export type CurriculumChapter = Chapter & {
  lessons: Lesson[];
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  courseId: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type CartItem = {
  id: string;
  courseId: string;
  slug?: string;
  title: string;
  thumbnail: string;
  price: number;
  discountPrice?: number;
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completed: boolean;
  lastLessonId?: string;
  accessStatus?: EnrollmentAccessStatus;
  startedAt?: string;
  expiresAt?: string;
  openedByAdminId?: string;
};

export type OrderStatus =
  | "pending_payment"
  | "waiting_review"
  | "approved"
  | "rejected"
  | "expired"
  | "refunded";

export type PaymentMethod = "vodafone_cash";

export type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  internalPaymentCode?: string;
  paymentReference?: string;
  senderPhone?: string;
  paymentRecipientNumber?: string;
  paymentRecipientInstructorId?: string;
  paymentRecipientInstructorName?: string;
  paymentReceiptUrl?: string;
  paymentReceiptStorageKey?: string;
  paymentReceiptMimeType?: string;
  paymentReceiptSizeBytes?: number;
  paymentSubmittedAt?: string;
  paymentExpiresAt?: string;
  reviewedAt?: string;
  reviewedByAdminId?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUsage?: number;
  expiresAt?: string;
  active: boolean;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  quote: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  type:
    | "enrollment"
    | "payment"
    | "course_update"
    | "reminder"
    | "discount";
  read: boolean;
  createdAt: string;
};

export type SearchResultGroup = {
  courses: Course[];
  categories: Category[];
  instructors: Instructor[];
};

export type EnrollmentAccessStatus = "active" | "revoked" | "expired";

export type StudentProfile = {
  id: string;
  userId: string;
  phone?: string;
  university?: string;
  academicYear?: string;
};

export type UserOverride = {
  id: string;
  userId: string;
  canTakeExam: boolean | null;
  canAccessLive: boolean | null;
  canDownloadVideos: boolean | null;
  hideAssignments: boolean | null;
  hideForum: boolean | null;
  customNote?: string;
  updatedByAdminId: string;
  updatedAt: string;
};

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportTicketIssueType =
  | "course_access"
  | "payment"
  | "technical"
  | "permissions"
  | "general";

export type SupportTicket = {
  id: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  title: string;
  issueType: SupportTicketIssueType;
  description: string;
  status: SupportTicketStatus;
  assignedToAdminId?: string;
  resolutionNote?: string;
  unreadForAdmin?: boolean;
  unreadForStudent?: boolean;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketMessage = {
  id: string;
  ticketId: string;
  senderId?: string;
  senderName?: string;
  senderEmail?: string;
  senderRole?: UserRole | "guest";
  body: string;
  createdAt: string;
};

export type MediaAccessAction = "request" | "granted" | "denied";
export type AntiPiracyEventType =
  | "VIDEO_WINDOW_BLUR"
  | "VIDEO_TAB_HIDDEN"
  | "VIDEO_CONTEXT_MENU"
  | "VIDEO_PRINTSCREEN_ATTEMPT"
  | "VIDEO_DEVTOOLS_SHORTCUT"
  | "VIDEO_COPY_ATTEMPT"
  | "VIDEO_FULLSCREEN_EXIT"
  | "VIDEO_DRAG_ATTEMPT"
  | "VIDEO_DEVICE_REGISTERED"
  | "VIDEO_DEVICE_LIMIT_EXCEEDED"
  | "VIDEO_SUSPICIOUS_DEVICE_CHANGE"
  | "VIDEO_RESUME_AFTER_PROTECTION";

export type ExamQuestionType = "multiple_choice" | "true_false" | "short_answer";
export type ExamAttemptStatus = "in_progress" | "submitted" | "graded" | "expired";

export type Exam = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passingScore: number;
  isPublished: boolean;
  allowRetakes: boolean;
  showResults: boolean;
  startsAt?: string;
  endsAt?: string;
  courseId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExamQuestion = {
  id: string;
  examId: string;
  type: ExamQuestionType;
  order: number;
  prompt: string;
  explanation?: string;
  marks: number;
};

export type ExamOption = {
  id: string;
  questionId: string;
  order: number;
  text: string;
  isCorrect?: boolean;
};

export type ExamAttempt = {
  id: string;
  examId: string;
  userId: string;
  status: ExamAttemptStatus;
  startedAt: string;
  submittedAt?: string;
  score: number;
  totalMarks: number;
  passed?: boolean;
};

export type ExamAnswer = {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
  isCorrect?: boolean;
  marksAwarded: number;
};

export type VideoWatermark = {
  displayName: string;
};

export type AntiPiracyEvent = {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  enrollmentId?: string;
  sessionId?: string;
  deviceId?: string;
  eventType: AntiPiracyEventType;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  adminId: string;
  targetUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type ImpersonationSession = {
  id: string;
  adminId: string;
  targetUserId: string;
  startedAt: string;
  endedAt?: string;
  isActive: boolean;
};

export type EffectiveStudentPermissions = {
  canAccessPortal: boolean;
  canAccessCourse: boolean;
  canTakeExam: boolean;
  canAccessLive: boolean;
  canDownloadVideos: boolean;
  hideAssignments: boolean;
  hideForum: boolean;
  status: UserStatus;
  accessStatus: EnrollmentAccessStatus | "inactive";
  coursePublished: boolean;
  customNote?: string;
};
