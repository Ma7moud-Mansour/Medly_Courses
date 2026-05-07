import type {
  CartItem,
  Category,
  Chapter,
  Course,
  CurriculumChapter,
  Enrollment,
  FaqItem,
  Instructor,
  Lesson,
  Notification,
  Review,
  Testimonial,
  User,
} from "@/types";

const imageParams = "auto=format&fit=crop&w=1200&q=82";

export const contactNumbers = ["01003797694", "01214874744"];

export function whatsappUrl(phone: string, message = "مرحبًا، أريد الاستفسار عن كورسات Medly") {
  return `https://wa.me/2${phone}?text=${encodeURIComponent(message)}`;
}

export const users: User[] = [
  {
    id: "user-1",
    name: "سلمى عادل",
    email: "salma@student.medly.app",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    role: "student",
    phone: "01003797694",
    emailVerified: true,
    createdAt: "2026-01-08T12:00:00.000Z",
  },
  {
    id: "admin-1",
    name: "فريق Medly",
    email: "admin@medly.app",
    role: "admin",
    emailVerified: true,
    createdAt: "2025-10-12T12:00:00.000Z",
  },
];

export const categories: Category[] = [
  {
    id: "cat-anatomy",
    name: "التشريح",
    slug: "anatomy",
    description: "تشريح سريري، خرائط ذهنية، وربط مباشر بأسئلة الامتحان.",
    icon: "brain",
    color: "teal",
  },
  {
    id: "cat-physiology",
    name: "الفسيولوجيا",
    slug: "physiology",
    description: "شرح الأنظمة الحيوية بمنطق واضح ورسومات سهلة التذكر.",
    icon: "activity",
    color: "emerald",
  },
  {
    id: "cat-pharmacology",
    name: "الأدوية",
    slug: "pharmacology",
    description: "آليات عمل، استخدامات، تحذيرات، وتدريب MCQ.",
    icon: "pill",
    color: "rose",
  },
  {
    id: "cat-pathology",
    name: "الباثولوجي",
    slug: "pathology",
    description: "فهم المرض من الخلية حتى العلامات الإكلينيكية.",
    icon: "microscope",
    color: "amber",
  },
  {
    id: "cat-emergency",
    name: "الطوارئ",
    slug: "emergency",
    description: "تقييم سريع، بروتوكولات، وسيناريوهات إنقاذ عملية.",
    icon: "siren",
    color: "red",
  },
  {
    id: "cat-exams",
    name: "تحضير الامتحانات",
    slug: "medical-exams",
    description: "خطط مراجعة، بنوك أسئلة، وتحليل أخطاء للامتحانات الطبية.",
    icon: "graduation-cap",
    color: "indigo",
  },
  {
    id: "cat-clinical",
    name: "المهارات الإكلينيكية",
    slug: "clinical-skills",
    description: "History taking، examination، وOSCE station practice.",
    icon: "stethoscope",
    color: "lime",
  },
];

export const instructors: Instructor[] = [
  {
    id: "inst-1",
    name: "د. عبد الرحمن نادر",
    slug: "dr-abdelrahman-nader",
    title: "محاضر طب إكلينيكي ومراجعات امتحانات",
    specialization: "Clinical Medicine and Exam Prep",
    bio: "يربط المفاهيم الطبية بالحالات والأسئلة، ويحوّل الدرس إلى خطوات مذاكرة واضحة.",
    avatar: "/images/instructors/avatar-abdelrahman.svg",
    studentsCount: 28600,
    coursesCount: 10,
  },
  {
    id: "inst-2",
    name: "يوسف زيادة",
    slug: "dr-youssef-ziadeh",
    title: "مدرب أساسيات طبية وOSCE",
    specialization: "Foundational Medicine and OSCE",
    bio: "يشرح المادة كخريطة منظمة، مع ملخصات ذكية وتطبيقات سريرية قصيرة بعد كل وحدة.",
    avatar: "/images/instructors/avatar-youssef.svg",
    studentsCount: 24100,
    coursesCount: 10,
  },
];

type CourseSeed = {
  title: string;
  slug: string;
  categoryId: string;
  instructorId: string;
  year: string;
  level: Course["level"];
  featured?: boolean;
  bestseller?: boolean;
  examPrep?: boolean;
  image: string;
};

const courseSeeds: CourseSeed[] = [];

export const courses: Course[] = courseSeeds.map((seed, index) => {
  const price = 690 + (index % 5) * 210;
  const discountPrice = index % 3 === 0 ? price - 170 : undefined;

  return {
    id: `course-${index + 1}`,
    title: seed.title,
    slug: seed.slug,
    subtitle: "شرح طبي منظم، أسئلة بعد كل وحدة، وخطة مذاكرة قابلة للتنفيذ.",
    description:
      "كورس طبي مبني على الفهم والتطبيق، يبدأ من المفاهيم الأساسية ثم ينتقل للحالات السريرية والأسئلة المتوقعة. كل درس قصير ومصمم للمذاكرة من الهاتف بدون تشتيت.",
    thumbnail: `https://images.unsplash.com/${seed.image}?${imageParams}`,
    previewVideo: "https://player.vimeo.com/video/76979871",
    price,
    discountPrice,
    rating: Number((4.7 + (index % 3) * 0.07).toFixed(1)),
    reviewsCount: 180 + index * 19,
    studentsCount: 1200 + index * 390,
    durationHours: 8 + (index % 7) * 3,
    lessonsCount: 18 + (index % 5) * 6,
    level: seed.level,
    language: "العربية",
    lastUpdated: "أبريل 2026",
    featured: Boolean(seed.featured),
    bestseller: Boolean(seed.bestseller),
    examPrep: Boolean(seed.examPrep),
    categoryId: seed.categoryId,
    instructorId: seed.instructorId,
    year: seed.year,
    tags: ["medical", seed.year, seed.level, seed.categoryId.replace("cat-", "")],
    learningOutcomes: [
      "تفهم المفاهيم الأساسية وتربطها بحالات سريرية حقيقية.",
      "تراجع أهم نقاط الامتحان بدون فقدان الصورة الكبيرة.",
      "تتدرب على أسئلة MCQ وOSCE مع تحليل الإجابات.",
      "تبني خطة مذاكرة أسبوعية وتتابع تقدمك داخل المنصة.",
    ],
    requirements: [
      "دفتر ملاحظات أو تطبيق notes.",
      "معرفة أولية بالمصطلحات الطبية الأساسية.",
      "رغبة في مذاكرة قصيرة منتظمة بدل المذاكرة المتراكمة.",
    ],
  };
});

export const enrichedCategories = categories.map((category) => ({
  ...category,
  coursesCount: courses.filter((course) => course.categoryId === category.id).length,
}));

export const enrichedInstructors = instructors.map((instructor) => ({
  ...instructor,
  coursesCount: courses.filter((course) => course.instructorId === instructor.id).length,
}));

export const chapters: Chapter[] = courses.flatMap((course) =>
  ["الأساسيات المنظمة", "التطبيق السريري", "المراجعة والاختبار"].map((title, index) => ({
    id: `${course.id}-chapter-${index + 1}`,
    title,
    order: index + 1,
    courseId: course.id,
  })),
);

export const lessons: Lesson[] = chapters.flatMap((chapter) =>
  Array.from({ length: 4 }, (_, index) => {
    const baseSlug =
      index === 0
        ? "unit-map"
        : index === 1
          ? "core-explanation"
          : index === 2
            ? "clinical-case"
            : "quiz-review";

    return {
      id: `${chapter.id}-lesson-${index + 1}`,
      title:
        index === 0
          ? "خريطة الوحدة وأهداف التعلم"
          : index === 1
            ? "شرح المفهوم خطوة بخطوة"
            : index === 2
              ? "حالة سريرية محلولة"
              : "اختبار قصير وتحليل الإجابات",
      slug: `chapter-${chapter.order}-${baseSlug}`,
      order: index + 1,
      durationMinutes: 9 + index * 6,
      videoUrl: "https://player.vimeo.com/video/76979871",
      isPreview: chapter.order === 1 && index < 2,
      chapterId: chapter.id,
      quizRequired: index === 3,
      resources: ["ملخص PDF", "خريطة ذهنية", "أسئلة تدريبية"],
    };
  }),
);

export function getCourseBySlug(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function getCourseById(id: string) {
  return courses.find((course) => course.id === id);
}

export function getCategoryBySlug(slug: string) {
  return enrichedCategories.find((category) => category.slug === slug);
}

export function getInstructorBySlug(slug: string) {
  return enrichedInstructors.find((instructor) => instructor.slug === slug);
}

export function getInstructorById(id: string) {
  return enrichedInstructors.find((instructor) => instructor.id === id);
}

export function getCategoryById(id: string) {
  return enrichedCategories.find((category) => category.id === id);
}

export function getCurriculum(courseId: string): CurriculumChapter[] {
  return chapters
    .filter((chapter) => chapter.courseId === courseId)
    .map((chapter) => ({
      ...chapter,
      lessons: lessons.filter((lesson) => lesson.chapterId === chapter.id),
    }));
}

export function getCourseReviews(courseId: string) {
  return reviews.filter((review) => review.courseId === courseId);
}

export function getRelatedCourses(course: Course, limit = 4) {
  return courses
    .filter(
      (candidate) =>
        candidate.id !== course.id &&
        (candidate.categoryId === course.categoryId ||
          candidate.instructorId === course.instructorId ||
          candidate.examPrep === course.examPrep),
    )
    .slice(0, limit);
}

const reviewAuthors = ["حبيبة محمود", "محمد رامي", "ملك ياسر", "أحمد خالد", "نورهان أشرف"];

export const reviews: Review[] = courses.flatMap((course, courseIndex) =>
  reviewAuthors.map((name, index) => ({
    id: `${course.id}-review-${index + 1}`,
    userId: `review-user-${index + 1}`,
    userName: name,
    userAvatar: `https://i.pravatar.cc/160?img=${courseIndex + index + 11}`,
    courseId: course.id,
    rating: index === 4 ? 4 : 5,
    comment:
      index % 2 === 0
        ? "طريقة الشرح مرتبة جدًا، خصوصًا ربط النقاط بالأسئلة والحالات السريرية."
        : "خلصت وحدات كتير من الموبايل، والاختبارات بعد الدروس فرقت في المراجعة.",
    createdAt: `2026-0${(index % 4) + 1}-1${index}T09:00:00.000Z`,
  })),
);

export const testimonials: Testimonial[] = [
  {
    id: "test-1",
    name: "منة يحيى",
    role: "طالبة طب سنة ثالثة",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    quote: "أول مرة أحس إن المراجعة مش سباق حفظ. الدروس قصيرة والأسئلة بتكشف ضعفي بسرعة.",
  },
  {
    id: "test-2",
    name: "علي حسن",
    role: "امتياز",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    quote: "الـ OSCE stations خلتني أدخل الامتحان وأنا عارف أبدأ منين وأنهي إزاي.",
  },
  {
    id: "test-3",
    name: "فريدة أنور",
    role: "تحضير امتحانات",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80",
    quote: "خطط المذاكرة وبنك الأسئلة خلو المجهود واضح ومقاس بالأرقام.",
  },
  {
    id: "test-4",
    name: "كريم وائل",
    role: "طالب طب سنة ثانية",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    quote: "الداشبورد بيرجعني لآخر درس فورًا، وده وفر عليا وقت كتير في الزحمة.",
  },
  {
    id: "test-5",
    name: "سارة مصطفى",
    role: "طالبة طب",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    quote: "الكروت، الملخصات، والـ quizzes بعد كل chapter خلوا التثبيت أسهل.",
  },
  {
    id: "test-6",
    name: "حسام إيهاب",
    role: "طالب طب سنة رابعة",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
    quote: "صفحة تفاصيل الكورس بتوضح المنهج والدكتور والتقييمات قبل ما أدفع.",
  },
];

export const faqs: FaqItem[] = [
  {
    id: "faq-1",
    question: "هل Medly مناسب للمذاكرة من الموبايل؟",
    answer: "نعم، كل الصفحات واللاعب التعليمي مصممين mobile-first مع دروس قصيرة وموارد قابلة للتحميل.",
  },
  {
    id: "faq-2",
    question: "هل أقدر أشتري كورس واحد؟",
    answer: "نعم، كل كورس له سعر منفصل، وبعد الدفع يظهر مباشرة في My Courses.",
  },
  {
    id: "faq-3",
    question: "ما طريقة الدفع المتاحة؟",
    answer: "الدفع داخل Medly يتم عبر فودافون كاش، ثم يراجع فريق المنصة التحويل يدويًا قبل تفعيل الكورس.",
  },
  {
    id: "faq-4",
    question: "هل يوجد دعم للطلاب؟",
    answer: "نعم، يمكنك التواصل عبر واتساب على 01003797694 أو 01214874744.",
  },
  {
    id: "faq-5",
    question: "هل الدفع آمن؟",
    answer: "يتم حفظ طلب الدفع وإيصال التحويل داخل حساب الطالب، ولا يتفعّل الكورس إلا بعد مراجعة الإيصال يدويًا.",
  },
  {
    id: "faq-6",
    question: "هل المحتوى محدث؟",
    answer: "كل كورس يوضح تاريخ آخر تحديث، والتنبيهات تخبرك بأي درس أو ملخص جديد.",
  },
];

export const enrollments: Enrollment[] = [
  {
    id: "enroll-1",
    userId: "user-1",
    courseId: "course-1",
    progress: 68,
    completed: false,
    lastLessonId: "course-1-chapter-2-lesson-3",
  },
  {
    id: "enroll-2",
    userId: "user-1",
    courseId: "course-2",
    progress: 42,
    completed: false,
    lastLessonId: "course-2-chapter-1-lesson-4",
  },
  {
    id: "enroll-3",
    userId: "user-1",
    courseId: "course-7",
    progress: 100,
    completed: true,
    lastLessonId: "course-7-chapter-3-lesson-4",
  },
];

export const notifications: Notification[] = [
  {
    id: "notif-1",
    title: "تم تأكيد الدفع",
    body: "تم اعتماد تحويل فودافون كاش وظهر الكورس الجديد داخل كورساتي ويمكنك بدء الدراسة الآن.",
    type: "payment",
    read: false,
    createdAt: "2026-04-18T11:00:00.000Z",
  },
  {
    id: "notif-2",
    title: "درس جديد في فسيولوجيا القلب",
    body: "تمت إضافة حالة سريرية محلولة عن heart failure.",
    type: "course_update",
    read: false,
    createdAt: "2026-04-17T09:00:00.000Z",
  },
  {
    id: "notif-3",
    title: "كمل آخر درس",
    body: "فاضل لك 18 دقيقة وتنهي Chapter التطبيق السريري.",
    type: "reminder",
    read: true,
    createdAt: "2026-04-16T19:00:00.000Z",
  },
];

export const sampleCartItems: CartItem[] = courses.slice(0, 2).map((course) => ({
  id: `cart-${course.id}`,
  courseId: course.id,
  title: course.title,
  thumbnail: course.thumbnail,
  price: course.price,
  discountPrice: course.discountPrice,
}));
