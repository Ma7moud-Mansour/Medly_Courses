import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { requireServerSession } from "@/lib/auth/server-session";
import { getStudentProfile } from "@/lib/student/repository";

export default async function SettingsPage() {
  const session = await requireServerSession();
  const profile = await getStudentProfile(session.userId);

  if (!profile) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
        تعذر تحميل بيانات الحساب الآن.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-black">الإعدادات</h1>
      <p className="mt-2 text-muted-foreground">يمكنك تحديث الاسم وبياناتك الدراسية من حسابك مباشرة.</p>
      <ProfileSettingsForm profile={profile} />
    </div>
  );
}
