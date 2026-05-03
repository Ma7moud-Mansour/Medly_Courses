"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "ar" | "en";

const dictionary: Record<string, string> = {
  "الكورسات": "Courses",
  "التصنيفات": "Categories",
  "الدكاتره": "Doctors",
  "الأسئلة": "FAQ",
  "ابحث": "Search",
  "دخول": "Login",
  "ابدأ الآن": "Start now",
  "السلة": "Cart",
  "تواصل معنا": "Contact",
  "حساب الطالب": "Student account",
  "الخصوصية": "Privacy",
  "الشروط": "Terms",
  "كل الحقوق محفوظة.": "All rights reserved.",
  "تصفح الكورسات": "Browse courses",
  "كل الكورسات": "All courses",
  "موجود في السلة": "In cart",
  "اشتري الآن": "Buy now",
  "إتمام الشراء": "Checkout",
  "اختار كورس": "Choose a course",
  "ملخص الطلب": "Order summary",
  "عدد العناصر": "Items",
  "الإجمالي الفرعي": "Subtotal",
  "الخصم": "Discount",
  "الإجمالي": "Total",
  "كود الخصم": "Coupon code",
  "تطبيق": "Apply",
  "الدفع": "Payment",
  "Checkout": "Checkout",
  "Vodafone Cash": "Vodafone Cash",
  "وسيلة الدفع الوحيدة المتاحة حاليًا داخل مصر.": "The only available payment method in Egypt.",
  "تأكيد الدفع": "Confirm payment",
  "جاري إنشاء الطلب...": "Creating order...",
  "الاسم": "Name",
  "البريد الإلكتروني": "Email",
  "الهاتف": "Phone",
  "طريقة الدفع": "Payment method",
  "لوحة الطالب": "Student dashboard",
  "نظرة عامة": "Overview",
  "كورساتي": "My Courses",
  "المفضلة": "Wishlist",
  "الفواتير": "Billing",
  "الإعدادات": "Settings",
  "الإشعارات": "Notifications",
  "كمل من حيث توقفت": "Continue where you left off",
  "متابعة": "Continue",
  "لوحة إدارة Medly": "Medly Admin",
  "الرئيسية": "Home",
  "الطلبات": "Orders",
  "الكوبونات": "Coupons",
  "المراجعات": "Reviews",
  "التحليلات": "Analytics",
  "تم الدفع": "Payment successful",
  "فشل الدفع": "Payment failed",
  "العودة لصفحة الكورس": "Back to course page",
  "ملاحظات": "Notes",
  "الموارد": "Resources",
  "اسأل عن الدرس": "Ask about the lesson",
  "اختبار سريع": "Quick quiz",
  "واتساب": "WhatsApp",
  "الدعم": "Support",
  "المنصة": "Platform",
  "قانوني": "Legal",
  "ابحث الآن": "Search now",
  "تعلم طبي وليس متجر كورسات": "Medical learning, not a course store",
  "منصة تعليم طبي": "Medical Learning",
  "مؤسسة تعليم طبي عربية": "Arabic Medical Learning Institution",
  "تعلّم الطب في بيئة أكثر تنظيمًا ووضوحًا": "Learn medicine in a clearer, more organized environment",
  "كورسات طبية منتقاة، شرح منظم، وتجربة تعليمية هادئة تساعدك على التركيز والنتائج.": "Selected medical courses, structured explanations, and a calm learning experience built for focus and results.",
  "استعرض الكورسات": "Explore courses",
  "شراء كورسات بشكل فردي": "Individual course purchases",
  "دفع عبر فودافون كاش": "Vodafone Cash checkout",
  "وصول فوري من حسابك": "Instant access from your account",
  "ابحث عن كورس أو مادة": "Search for a course or subject",
  "بحث": "Search",
  "عربي": "AR",
  "فتح القائمة": "Open menu",
  "البحث": "Search",
  "البحث في المنصة": "Search the platform",
  "مسارات الدراسة": "Study Paths",
  "ابدأ من المادة الأقرب لاحتياجك.": "Start with the subject closest to your needs.",
  "كورسات": "courses",
  "تصفح": "Browse",
  "كورسات مختارة": "Selected Courses",
  "محتوى طبي جاد، بتصميم يساعدك تركز.": "Serious medical content in a design that helps you focus.",
  "اختر الكورس المناسب، ادفع مرة واحدة، وابدأ الدراسة فورًا من حسابك.": "Choose the right course, pay once, and start immediately from your account.",
  "لماذا Medly": "Why Medly",
  "منصة تبدو كبيئة دراسة طبية، لا كسوق كورسات.": "A platform that feels like a medical study environment, not a course marketplace.",
  "نقلل الضوضاء ونترك القرار واضحًا: اختر، ادفع، وابدأ التعلم.": "We reduce noise and keep the next step clear: choose, pay, and start learning.",
  "تنظيم أكاديمي واضح": "Clear Academic Structure",
  "كل كورس مرتب في وحدات قصيرة، موارد مختصرة، وأسئلة تطبيقية بدون حشو.": "Each course is organized into short units, concise resources, and practical questions without filler.",
  "شراء مباشر وشفاف": "Direct Transparent Purchase",
  "كل كورس له سعر مستقل. لا اشتراكات، ولا خطط متكررة، ولا خطوات مربكة.": "Each course has its own price. No subscriptions, recurring plans, or confusing steps.",
  "حساب طالب هادئ": "A Calm Student Account",
  "الكورس يظهر بعد الدفع مباشرة، مع تقدم محفوظ ومتابعة آخر درس.": "Your course appears right after payment, with saved progress and last-lesson tracking.",
  "كل دكتور له صفحة profile، عدد الطلاب، التخصص، والكورسات المرتبطة.": "Each doctor has a profile page, student count, specialization, and related courses.",
  "دكتور غير موجود": "Doctor not found",
  "الدكتور": "Doctor",
  "خبرة طبية واضحة، بأسماء محددة.": "Clear medical expertise, with focused instructors.",
  "منهج Medly يعتمد على شرح منظم ومراجعة عملية من دكاتره متخصصين.": "Medly is built around structured explanations and practical review by specialized doctors.",
  "الملف الشخصي": "Profile",
  "قبل الشراء": "Before Purchase",
  "أسئلة قصيرة، بإجابات مباشرة.": "Short questions, direct answers.",
  "كل شيء حول الدفع، الوصول للكورس، وحساب الطالب بدون تفاصيل مشتتة.": "Everything about payment, course access, and the student account without distracting details.",
  "كل الأسئلة": "All questions",
  "ابدأ بهدوء": "Start Calmly",
  "اختر كورسك الطبي، وابدأ الدراسة من حسابك فورًا.": "Choose your medical course and start studying from your account immediately.",
  "تجربة شراء واضحة، دفع عبر فودافون كاش، ومتابعة تقدمك داخل منصة واحدة.": "A clear purchase flow, Vodafone Cash checkout, and progress tracking in one platform.",
  "منصة عربية لتعلّم الطب بوضوح: كورسات فردية، دفع بسيط، وتجربة دراسة هادئة تناسب الطالب الجاد.": "An Arabic platform for clear medical learning: individual courses, simple payment, and a calm study experience for serious students.",
  "راسلنا الآن": "Message us",
  "اختر رقم واتساب للتواصل مع الدعم.": "Choose a WhatsApp number to contact support.",
  "فتح واتساب": "Open WhatsApp",
  "إغلاق واتساب": "Close WhatsApp",
  "سعر الكورس": "Course price",
  "أضف": "Add",
  "مبتدئ": "Beginner",
  "متوسط": "Intermediate",
  "متقدم": "Advanced",
  "ساعة": "hours",
  "درس": "lessons",
  "الدكتور:": "Doctor:",
  "اسم كورس، دكتور، أو كلمة مفتاحية": "Course name, doctor, or keyword",
  "آخر تحديث": "Last updated",
  "مراجعة": "reviews",
  "طالب": "students",
  "شاهد المعاينة": "Watch preview",
  "الدفع يتم عبر فودافون كاش ثم مراجعة يدوية قبل التفعيل": "Payment is handled through Vodafone Cash with a manual review before activation",
  "أضف للسلة": "Add to cart",
  "وفر": "Save",
  "وصول كامل للكورس": "Full course access",
  "موارد قابلة للتحميل": "Downloadable resources",
  "حفظ آخر موضع": "Saved last position",
  "يظهر في كورساتي بعد اعتماد الدفع": "Appears in My Courses after payment approval",
  "السلة فارغة": "Your cart is empty",
  "حذف": "Remove",
  "وصول كامل، موارد، وحفظ تقدم داخل حسابك.": "Full access, resources, and saved progress in your account.",
  "تم تطبيق الكود.": "Coupon applied.",
  "الكود غير صالح. جرب MEDLY20 أو FIRST100.": "Invalid code. Try MEDLY20 or FIRST100.",
  "يجب تسجيل الدخول قبل الدفع. سيتم تحويلك للدخول مع حفظ السلة.": "You must log in before payment. You will be redirected while your cart stays saved.",
  "اكتشاف الكورسات": "Course Discovery",
  "لا توجد نتائج بنفس الفلاتر": "No results match these filters",
  "عرض كل الكورسات": "Show all courses",
  "اكتب بريد إلكتروني صحيح": "Enter a valid email",
  "كلمة المرور لا تقل عن 8 أحرف": "Password must be at least 8 characters",
  "اكتب الاسم بالكامل": "Enter your full name",
  "اكتب رقم هاتف صحيح": "Enter a valid phone number",
  "أكد كلمة المرور": "Confirm your password",
  "كلمتا المرور غير متطابقتين": "Passwords do not match",
  "اكتب الاسم": "Enter your name",
  "اختار الموضوع": "Choose a topic",
  "اكتب تفاصيل أكثر": "Add more details",
  "اكتب مراجعة مفيدة": "Write a useful review",
  "اكتب كود الخصم": "Enter coupon code",
  "تسجيل الدخول": "Sign In",
  "إنشاء حساب": "Sign Up",
  "هل نسيت كلمة المرور؟": "Forgot password?",
  "تذكرني": "Remember me",
  "تذكرني لمدة 30 يوم": "Remember me for 30 days",
  "أرسل كود التفعيل": "Resend verification code",
  "حساب غير مفعل؟": "Account not verified?",
  "قم بتأكيد بريدك الإلكتروني للوصول إلى حسابك": "Verify your email to access your account",
  "خطأ في تسجيل الدخول": "Login error",
  "كلمة المرور": "Password",
  "تأكيد كلمة المرور": "Confirm Password",
  "الاسم الكامل": "Full Name",
  "ليس لديك حساب؟": "Don't have an account?",
  "لديك حساب بالفعل؟": "Already have an account?",
  "مرحباً بك مجدداً": "Welcome back",
  "أنشئ حسابك الجديد": "Create new account",
  "ماذا ستحصل من الكورس": "What you will get from the course",
  "هذه النقاط مبنية على البيانات الحقيقية للكورس وحالة الوصول داخل حسابك.": "These points are based on real course data and your account access.",
  "محتوى الكورس": "Course Curriculum",
  "بيانات المحاضر وعدد الكورسات والطلاب مأخوذة من قاعدة البيانات مباشرة.": "Instructor data, course counts, and students are fetched directly from the database.",
  "تقييمات الطلاب": "Student Reviews",
  "لا يمكن إرسال التقييم إلا من طالب لديه وصول نشط للكورس.": "Reviews can only be submitted by students with active course access.",
  "كورسات مرتبطة": "Related Courses",
  "اقتراحات حقيقية من نفس الدكتور أو نفس التخصص.": "Real suggestions from the same doctor or specialization.",
  "رسالة زائر": "Guest message",
  "لا يوجد بريد محفوظ": "No saved email",
  "دعم فني": "Technical Support",
  "الدفع والفواتير": "Billing & Payments",
  "اقتراح محتوى": "Content Suggestion",
  "الوصول للكورس": "Course Access",
  "استفسار عام": "General Inquiry",
  "هذا الحساب غير نشط حاليًا.": "This account is currently inactive.",
  "هذا الكورس غير متاح الآن.": "This course is currently unavailable.",
  "تم إيقاف الوصول لهذا الكورس من الحساب.": "Access to this course has been revoked.",
  "انتهت مدة الوصول لهذا الكورس.": "Access duration for this course has expired.",
  "سجّل الدخول بعد شراء الكورس حتى تتمكن من إضافة تقييمك.": "Log in after purchasing to submit your review.",
  "إضافة التقييمات متاحة من حسابات الطلاب فقط.": "Adding reviews is only available for student accounts.",
  "يمكنك إضافة تقييم بعد شراء الكورس وظهوره داخل كورساتي.": "You can add a review after purchasing the course and it appears in My Courses.",
  "يلزم وجود وصول نشط للكورس حتى تتمكن من إضافة تقييم.": "Active course access is required to submit a review.",
  "تم حفظ تقييمك لهذا الكورس بالفعل.": "Your review for this course has already been saved.",
  "طالب نشط": "Active student",
  "درس طبي": "Medical lesson",
  "مراجعة امتحان": "Exam review",
  "تقدم محفوظ": "Saved progress",
  "لحظي": "Instant",
  "+42 ألف": "42K+",
  "+240": "240+",
  "+80": "80+",
  "آراء الطلاب": "Student Feedback",
  "ثقة مبنية على تجربة مذاكرة فعلية": "Trust built on actual study experience",
  "نماذج seed جاهزة لصفحة الهوم وصفحات التسويق.": "Seed templates ready for the home and marketing pages.",
  "ابحث عن كورس، مادة، أو دكتور": "Search for a course, subject, or doctor",
  "رحلة الطالب من أول بحث حتى بدء الدراسة": "The student's journey from first search to starting study",
  "كل خطوة لها state واضح: loading، empty، error، success.": "Every step has a clear state: loading, empty, error, success.",
  "اكتب اسم المادة أو الدكتور وشوف suggestions منظمة.": "Type the subject or doctor name and see organized suggestions.",
  "اختار": "Choose",
  "راجع المنهج، الدكتور، التقييمات، والسعر قبل القرار.": "Review the curriculum, doctor, ratings, and price before deciding.",
  "ادفع": "Pay",
  "سلة واضحة، كوبونات، وخطوات checkout قليلة.": "Clear cart, coupons, and few checkout steps.",
  "كمل": "Continue",
  "Dashboard يرجعك لآخر درس ويحفظ تقدمك تلقائيًا.": "Dashboard returns you to the last lesson and saves your progress automatically.",
  "تجربة شراء واضحة، دفع عبر فوري باي، ومتابعة تقدمك داخل منصة واحدة.": "A clear purchase experience, Fawry Pay checkout, and tracking your progress in one platform.",
  "الشروط والأحكام": "Terms and Conditions",
  "بنود تشغيلية أولية للاستخدام وشراء الكورسات.": "Initial operational terms for use and purchasing courses.",
  "استخدام المنصة مخصص للتعلم والمراجعة ولا يغني عن التدريب العملي أو الرجوع للمراجع الرسمية.": "The platform is for learning and review and does not replace practical training or official references.",
  "الوصول للكورسات يرتبط بشراء كل كورس منفصلًا وحالة الدفع وصلاحية الحساب.": "Course access is linked to individual purchases, payment status, and account validity.",
  "بعد الدفع يظهر الكورس داخل حساب الطالب في صفحة كورساتي.": "After payment, the course appears in the student's account under My Courses.",
  "سياسة الخصوصية": "Privacy Policy",
  "الأسئلة الشائعة": "FAQ",
  "صياغة أولية قابلة للمراجعة القانونية قبل الإطلاق.": "Initial draft subject to legal review before launch.",
  "نحفظ بيانات الحساب والتقدم والفواتير لتحسين تجربة التعلم وتقديم الخدمات المطلوبة.": "We save account, progress, and billing data to improve the learning experience and provide requested services.",
  "لا يتم تخزين بيانات الدفع الحساسة داخل Medly، ويتم تمريرها إلى بوابة دفع آمنة عند الربط الإنتاجي.": "Sensitive payment data is not stored in Medly; it is passed to a secure payment gateway.",
  "يمكن للطالب طلب تصحيح بياناته أو حذف الحساب وفق القواعد التشغيلية والقانونية.": "Students can request to correct their data or delete their account according to operational and legal rules.",
  "إجابات سريعة قبل التسجيل أو الشراء": "Quick answers before registering or purchasing",
  "كل سؤال هنا يمثل state أو flow مهم في رحلة الطالب.": "Each question here represents an important state or flow in the student's journey.",
  "ابحث، فلتر، واختر الكورس المناسب بسرعة": "Search, filter, and choose the right course quickly",
  "النتائج هنا مربوطة مباشرة بقاعدة البيانات، وتعرض فقط الكورسات المنشورة المتاحة للشراء أو المتابعة.": "Results here are linked directly to the database, showing only published courses available for purchase.",
  "كورس متاح": "available courses",
  "الفرز والبحث والفلاتر كلها تعمل من السيرفر مباشرة.": "Sorting, searching, and filtering all work directly from the server.",
  "لا توجد نتائج بهذه الفلاتر": "No results with these filters",
  "جرّب إزالة بعض الفلاتر أو ابحث باسم المادة أو الدكتور فقط، وسنعرض لك الكورسات المنشورة المطابقة.": "Try removing some filters or search by subject or doctor name only.",
  "جارٍ تحميل الكورسات": "Loading courses...",
  "نجهز لك نتائج البحث والفلاتر من قاعدة البيانات.": "Preparing search results and filters from the database.",
  "اسأل عن كورس أو مشكلة في الحساب": "Ask about a course or an account issue",
  "اكتب رسالتك وسيتم فتح تذكرة دعم حقيقية داخل لوحة Medly، أو تواصل مباشرة عبر واتساب.": "Write your message and a real support ticket will be opened in the Medly dashboard, or contact us directly via WhatsApp.",
  "واتساب مباشر": "Direct WhatsApp",
  "اختار الرقم المناسب وسيتم فتح واتساب مباشرة.": "Choose the right number and WhatsApp will open directly.",
  "متابعة الرسائل": "Follow up on messages",
  "لو أنت مسجل دخول، هتظهر ردود الدعم داخل صفحة الدعم في حسابك. رسائل الزوار تظهر للأدمن بنفس البريد المكتوب في النموذج.": "If you are logged in, support replies will appear on the Support page in your account. Visitor messages appear to the admin with the provided email.",
  "تصفح الكورسات والمواد حسب التخصص": "Browse courses and subjects by specialization",
  "التصنيفات المتاحة والأقسام الأكاديمية": "Available categories and academic departments",
  "كل تصنيف يعرض الكورسات المرتبطة به. هذه البيانات حقيقية من قاعدة البيانات.": "Each category displays related courses. This is real data from the database.",
  "نخبة من الأطباء والمتخصصين في الشرح": "A select group of doctors and specialized instructors",
  "تصفح الكورسات حسب كل دكتور، مع إحصائيات حقيقية لعدد الكورسات والطلاب.": "Browse courses by doctor, with real statistics for courses and students.",
  "هل Medly مناسب للمذاكرة من الموبايل؟": "Is Medly suitable for studying on mobile?",
  "نعم، كل الصفحات واللاعب التعليمي مصممين mobile-first مع دروس قصيرة وموارد قابلة للتحميل.": "Yes, all pages and the video player are mobile-first with short lessons and downloadable resources.",
  "هل أقدر أشتري كورس واحد؟": "Can I buy a single course?",
  "نعم، كل كورس له سعر منفصل، وبعد الدفع يظهر مباشرة في My Courses.": "Yes, each course has a separate price, and after payment it appears directly in My Courses.",
  "ما طريقة الدفع المتاحة؟": "What are the available payment methods?",
  "الدفع داخل Medly يتم عبر فودافون كاش، ثم يراجع فريق المنصة التحويل يدويًا قبل تفعيل الكورس.": "Payment in Medly is via Vodafone Cash, then the team manually reviews the transfer before activating the course.",
  "هل يوجد دعم للطلاب؟": "Is there student support?",
  "نعم، يمكنك التواصل عبر واتساب على 01003797694 أو 01214874744.": "Yes, you can contact us via WhatsApp on 01003797694 or 01214874744.",
  "هل الدفع آمن؟": "Is payment secure?",
  "يتم حفظ طلب الدفع وإيصال التحويل داخل حساب الطالب، ولا يتفعّل الكورس إلا بعد مراجعة الإيصال يدويًا.": "The payment request and transfer receipt are saved in the student's account, and the course is only activated after manual review.",
  "هل المحتوى محدث؟": "Is the content updated?",
  "كل كورس يوضح تاريخ آخر تحديث، والتنبيهات تخبرك بأي درس أو ملخص جديد.": "Each course shows the last update date, and notifications inform you of any new lesson or summary.",
};

const context = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({
  language: "ar",
  setLanguage: () => undefined,
});

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();

function translateValue(value: string, language: Language) {
  if (language === "ar") {
    return value;
  }

  const trimmed = value.trim();
  const normalized = trimmed.replace(/\s+/g, " ");
  const translated = dictionary[trimmed] ?? dictionary[normalized];

  if (translated) {
    return value.replace(trimmed, translated);
  }

  let partialTranslation = value;
  let hasChanges = false;
  
  // Sort keys by length descending to match longer phrases first
  const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    if (partialTranslation.includes(key)) {
      partialTranslation = partialTranslation.split(key).join(dictionary[key]);
      hasChanges = true;
    }
  }

  return hasChanges ? partialTranslation : value;
}

function translateDom(language: Language) {
  document.documentElement.lang = language;
  document.documentElement.dir = "rtl";
  document.body.classList.toggle("lang-en", language === "en");

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const parentTag = textNode.parentElement?.tagName;
    const protectedNode = textNode.parentElement?.closest("[data-no-translate]");
    if (!protectedNode && parentTag !== "SCRIPT" && parentTag !== "STYLE" && parentTag !== "TEXTAREA") {
      nodes.push(textNode);
    }
    node = walker.nextNode();
  }

  for (const textNode of nodes) {
    if (!originalText.has(textNode)) {
      originalText.set(textNode, textNode.nodeValue ?? "");
    }

    const original = originalText.get(textNode) ?? "";
    textNode.nodeValue = translateValue(original, language);
  }

  for (const element of Array.from(document.querySelectorAll("[placeholder], [aria-label]"))) {
    if (element.closest("[data-no-translate]")) {
      continue;
    }

    const attrs = originalAttributes.get(element) ?? {};

    for (const attr of ["placeholder", "aria-label"]) {
      const value = element.getAttribute(attr);
      if (!value) {
        continue;
      }

      if (!attrs[attr]) {
        attrs[attr] = value;
      }

      element.setAttribute(attr, translateValue(attrs[attr], language));
    }

    originalAttributes.set(element, attrs);
  }
}

export function LanguageProvider({ children, initialLanguage }: { children: React.ReactNode, initialLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (initialLanguage) return initialLanguage;
    if (typeof window === "undefined") {
      return "ar";
    }

    const saved = window.localStorage.getItem("medly-language");
    return saved === "en" || saved === "ar" ? saved : "ar";
  });

  useEffect(() => {
    translateDom(language);
    localStorage.setItem("medly-language", language);

    const observer = new MutationObserver(() => translateDom(language));
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
    }),
    [language],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
}

export function useLanguage() {
  return useContext(context);
}
