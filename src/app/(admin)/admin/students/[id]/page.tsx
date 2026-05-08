import { notFound } from "next/navigation";
import { BookOpen, ClipboardList, History, ShieldCheck } from "lucide-react";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { StatusBadge } from "@/components/admin/status-badge";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import {
  getCourseOptions,
  getStudentById,
  getStudentPermissions,
  performStudentAdminAction,
} from "@/lib/admin/actions";
import type { UserStatus } from "@/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getUserStatusLabel(status?: UserStatus) {
  if (status === "blocked") return "محظور";
  if (status === "suspended") return "موقوف";
  return "نشط";
}

function getAccessLabel(status?: "active" | "revoked" | "expired") {
  if (status === "revoked") return "مسحوب";
  if (status === "expired") return "منتهي";
  return "نشط";
}

function getTicketStatusLabel(status: "open" | "in_progress" | "resolved" | "closed") {
  if (status === "in_progress") return "قيد المتابعة";
  if (status === "resolved") return "تم الحل";
  if (status === "closed") return "مغلق";
  return "مفتوح";
}

type PermissionFieldName = "canTakeExam" | "canAccessLive" | "canDownloadVideos" | "hideAssignments" | "hideForum";
type PermissionOption = { value: "inherit" | "true" | "false"; label: string };

const allowDenyOptions: PermissionOption[] = [
  { value: "inherit", label: "الافتراضي" },
  { value: "true", label: "مسموح" },
  { value: "false", label: "ممنوع" },
];

const visibilityOptions: PermissionOption[] = [
  { value: "inherit", label: "الافتراضي" },
  { value: "false", label: "إظهار" },
  { value: "true", label: "إخفاء" },
];

const permissionFields: Array<{
  name: PermissionFieldName;
  label: string;
  helper: string;
  options: PermissionOption[];
}> = [
  {
    name: "canTakeExam",
    label: "الامتحانات",
    helper: "مسموح يخلّي الطالب يبدأ الامتحانات المنشورة. ممنوع يقفل الامتحانات للطالب ده فقط.",
    options: allowDenyOptions,
  },
  {
    name: "canAccessLive",
    label: "البث المباشر",
    helper: "تحكم فردي في دخول الطالب للمحاضرات أو البث المباشر بدون التأثير على باقي الطلاب.",
    options: allowDenyOptions,
  },
  {
    name: "canDownloadVideos",
    label: "تحميل الفيديوهات",
    helper: "مسموح يفتح التحميل للطالب. ممنوع يخلي المشاهدة فقط بدون تحميل.",
    options: allowDenyOptions,
  },
  {
    name: "hideAssignments",
    label: "الواجبات",
    helper: "اختار إخفاء لو عايز تخفي الواجبات عن الطالب ده فقط، أو إظهار لو عايز تفرض ظهورها.",
    options: visibilityOptions,
  },
  {
    name: "hideForum",
    label: "المنتدى",
    helper: "اختار إخفاء لو عايز تمنع ظهور المنتدى للطالب ده فقط، أو إظهار لو عايز تفرض ظهوره.",
    options: visibilityOptions,
  },
];

const flashMessages: Record<string, string> = {
  "grant-course": "تم فتح الكورس للطالب بنجاح.",
  "revoke-course": "تم سحب الوصول إلى الكورس.",
  "block-user": "تم حظر الحساب.",
  "unblock-user": "تم فك حظر الحساب.",
  "reset-progress": "تمت إعادة ضبط التقدم.",
  "start-impersonation": "تم فتح وضع معاينة حساب الطالب.",
  "end-impersonation": "تم إنهاء وضع معاينة حساب الطالب.",
  "update-overrides": "تم حفظ الصلاحيات الفردية.",
  "open-support-note": "تم فتح ملاحظة دعم جديدة.",
};

export default async function AdminStudentDetailsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;
  const flash = first(query.flash);
  const error = first(query.error);
  const [details, courseOptions] = await Promise.all([getStudentById(id), getCourseOptions()]);

  if (!details) {
    notFound();
  }

  const availableCourses = courseOptions.filter(
    (course) =>
      course.isPublished &&
      !details.enrollments.some((item) => item.courseId === course.id && item.accessStatus === "active"),
  );
  const portalPermissions = await getStudentPermissions(details.user.id);

  return (
    <div className="space-y-6">
      {flash ? <ActionFeedbackBanner kind="success" message={flashMessages[flash] ?? "تم تنفيذ الإجراء بنجاح."} /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black">{details.user.name}</h1>
              <StatusBadge label={getUserStatusLabel(details.user.status)} tone={details.user.status ?? "active"} />
              <StatusBadge label={details.user.role === "student" ? "طالب" : details.user.role} tone={details.user.role} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{details.user.email}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-muted-foreground">
              <span>الجامعة: {details.profile?.university ?? "غير مضافة"}</span>
              <span>السنة: {details.profile?.academicYear ?? "غير مضافة"}</span>
              <span>
                آخر دخول: {details.user.lastLoginAt ? new Date(details.user.lastLoginAt).toLocaleString("ar-EG") : "—"}
              </span>
            </div>
            {details.activeImpersonation?.isActive ? (
              <p className="mt-3 text-sm font-bold text-[#8a6a2f]">
                وضع معاينة حساب الطالب مفتوح حاليًا وبدأ في{" "}
                {new Date(details.activeImpersonation.startedAt).toLocaleString("ar-EG")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 rounded-lg border border-border bg-muted p-4">
            <p className="text-sm font-black text-primary">حالة البوابة الآن</p>
            <div className="grid gap-2 text-sm font-bold">
              <div className="flex items-center justify-between gap-3">
                <span>دخول المنصة</span>
                <StatusBadge
                  label={portalPermissions.canAccessPortal ? "مسموح" : "موقوف"}
                  tone={portalPermissions.canAccessPortal ? "active" : "blocked"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>الامتحانات</span>
                <StatusBadge
                  label={portalPermissions.canTakeExam ? "مسموح" : "ممنوع"}
                  tone={portalPermissions.canTakeExam ? "active" : "blocked"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>المنتدى</span>
                <StatusBadge
                  label={portalPermissions.hideForum ? "مخفي" : "ظاهر"}
                  tone={portalPermissions.hideForum ? "suspended" : "active"}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">الوصول إلى الكورسات</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            فتح كورس هنا يعمل تسجيل فعلي للطالب، وسحب الوصول يخفي الكورس منه فورًا في حسابه.
          </p>

          <div className="mt-4 grid gap-3">
            {details.enrollments.length ? (
              details.enrollments.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-muted p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="font-black">{item.course?.title ?? item.courseId}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        بدأ في {item.startedAt ? new Date(item.startedAt).toLocaleDateString("ar-EG") : "—"} • التقدم{" "}
                        {item.progress}%
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={getAccessLabel(item.accessStatus)}
                        tone={
                          item.accessStatus === "active"
                            ? "active_access"
                            : item.accessStatus === "revoked"
                              ? "revoked"
                              : "expired"
                        }
                      />
                      <form action={performStudentAdminAction}>
                        <input name="studentId" type="hidden" value={details.user.id} />
                        <input name="courseId" type="hidden" value={item.courseId} />
                        <input name="intent" type="hidden" value="revoke-course" />
                        <PendingSubmitButton
                          className="px-3 py-2 text-xs"
                          pendingLabel="جارٍ سحب الوصول..."
                          size="sm"
                          variant="outline"
                        >
                          سحب الوصول
                        </PendingSubmitButton>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted p-5 text-sm font-bold text-muted-foreground">
                هذا الطالب لا يملك أي كورسات مفعلة حتى الآن.
              </div>
            )}
          </div>

          <form action={performStudentAdminAction} className="mt-5 grid gap-3 rounded-lg border border-border bg-muted p-4">
            <input name="studentId" type="hidden" value={details.user.id} />
            <input name="intent" type="hidden" value="grant-course" />
            <label className="grid gap-2 text-sm font-bold">
              فتح كورس جديد
              <select className="form-input" disabled={!availableCourses.length} name="courseId" required>
                <option value="">{availableCourses.length ? "اختر الكورس" : "لا توجد كورسات متاحة للإضافة"}</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
            <PendingSubmitButton disabled={!availableCourses.length} pendingLabel="جارٍ فتح الكورس...">
              فتح الكورس
            </PendingSubmitButton>
            <p className="text-xs leading-5 text-muted-foreground">
              القائمة تعرض الكورسات المنشورة فقط والتي لا يملك الطالب وصولًا نشطًا لها بالفعل.
            </p>
          </form>
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">الصلاحيات الفردية</h2>
          </div>
          <div className="mt-3 rounded-lg border border-[color:rgba(14,95,92,0.18)] bg-[#eef8f5] p-4 text-sm leading-7 text-[#16524c]">
            <p className="font-black">يعني إيه الافتراضي؟</p>
            <p>
              الافتراضي يسيب الطالب ماشي على إعدادات المنصة العامة. أي اختيار تاني هنا بيكون استثناء للطالب ده فقط.
            </p>
          </div>

          <form action={performStudentAdminAction} className="mt-4 grid gap-3">
            <input name="studentId" type="hidden" value={details.user.id} />
            <input name="intent" type="hidden" value="update-overrides" />

            {permissionFields.map((field) => (
              <label key={field.name} className="grid gap-2 text-sm font-bold">
                {field.label}
                <select
                  className="form-input"
                  defaultValue={String((details.overrides as Partial<Record<PermissionFieldName, boolean | null>> | undefined)?.[field.name] ?? "inherit")}
                  name={field.name}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-medium leading-5 text-muted-foreground">{field.helper}</span>
              </label>
            ))}

            <label className="grid gap-2 text-sm font-bold">
              ملاحظة داخلية
              <textarea
                className="form-input min-h-28 py-3"
                defaultValue={details.overrides?.customNote ?? ""}
                name="customNote"
                placeholder="أي ملاحظة خاصة بهذا الطالب تظهر لفريق الإدارة فقط"
              />
            </label>

            <PendingSubmitButton pendingLabel="جارٍ حفظ الصلاحيات...">حفظ الصلاحيات</PendingSubmitButton>
          </form>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">تذاكر الدعم والملاحظات</h2>
          </div>

          <div className="mt-4 grid gap-3">
            {details.tickets.length ? (
              details.tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-border bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{ticket.title}</p>
                    <StatusBadge label={getTicketStatusLabel(ticket.status)} tone={ticket.status} />
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{ticket.description}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm font-bold text-muted-foreground">
                لا توجد تذاكر أو ملاحظات دعم مرتبطة بهذا الطالب.
              </div>
            )}
          </div>

          <form action={performStudentAdminAction} className="mt-5 grid gap-3 rounded-lg border border-border bg-muted p-4">
            <input name="studentId" type="hidden" value={details.user.id} />
            <input name="intent" type="hidden" value="open-support-note" />

            <label className="grid gap-2 text-sm font-bold">
              عنوان الملاحظة
              <input className="form-input" defaultValue="متابعة من الإدارة" name="ticketTitle" />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              نوع الحالة
              <select className="form-input" defaultValue="general" name="issueType">
                <option value="general">استفسار عام</option>
                <option value="course_access">وصول للكورسات</option>
                <option value="payment">مدفوعات</option>
                <option value="technical">مشكلة تقنية</option>
                <option value="permissions">صلاحيات</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold">
              نص الملاحظة
              <textarea
                className="form-input min-h-28 py-3"
                defaultValue="تم فتح ملاحظة دعم من لوحة الإدارة لمتابعة حالة الطالب."
                name="description"
              />
            </label>

            <PendingSubmitButton pendingLabel="جارٍ إنشاء الملاحظة..." variant="outline">
              فتح ملاحظة دعم
            </PendingSubmitButton>
          </form>
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">إجراءات سريعة وسجل حديث</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            كل زر هنا ينفذ إجراء حقيقي على حساب الطالب، ويتم تسجيله في السجل الموجود أسفل الأزرار.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {details.user.status === "blocked" ? (
              <ActionButton
                helper="يرجع الحساب نشطًا ويسمح للطالب بتسجيل الدخول مرة أخرى."
                intent="unblock-user"
                label="فك الحظر"
                studentId={details.user.id}
              />
            ) : (
              <ActionButton
                helper="يمنع تسجيل الدخول ويحذف جلسات الطالب المفتوحة."
                intent="block-user"
                label="حظر الحساب"
                studentId={details.user.id}
              />
            )}
            <ActionButton
              helper="يمسح تقدمه داخل الكورسات المفتوحة له ويبدأ من جديد."
              intent="reset-progress"
              label="إعادة ضبط التقدم"
              studentId={details.user.id}
            />
            <ActionButton
              helper="يفتح وضع معاينة إداري لحساب الطالب لمراجعة ما يظهر له."
              intent="start-impersonation"
              label="معاينة حساب الطالب"
              studentId={details.user.id}
            />
            <ActionButton
              helper="يقفل وضع المعاينة الإداري لهذا الطالب."
              intent="end-impersonation"
              label="إنهاء المعاينة"
              studentId={details.user.id}
            />
          </div>

          <div className="mt-5 grid gap-3">
            {details.auditLogs.length ? (
              details.auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-border bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{log.action}</p>
                    <p className="text-xs font-bold text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("ar-EG")}
                    </p>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-xs text-muted-foreground">
                    {JSON.stringify(log.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm font-bold text-muted-foreground">
                لا توجد أنشطة مسجلة لهذا الطالب حتى الآن.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function ActionButton({
  helper,
  intent,
  label,
  studentId,
}: {
  helper?: string;
  intent: string;
  label: string;
  studentId: string;
}) {
  return (
    <form action={performStudentAdminAction}>
      <input name="studentId" type="hidden" value={studentId} />
      <input name="intent" type="hidden" value={intent} />
      <PendingSubmitButton className="w-full" pendingLabel="جارٍ الحفظ..." variant="outline">
        <span className="grid gap-1 text-center">
          <span>{label}</span>
          {helper ? <span className="text-xs font-medium leading-5 text-muted-foreground">{helper}</span> : null}
        </span>
      </PendingSubmitButton>
    </form>
  );
}
