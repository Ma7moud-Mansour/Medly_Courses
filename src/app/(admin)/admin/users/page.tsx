import { Users } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminUsersPageData } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

function getRoleLabel(role: "student" | "admin" | "support" | "instructor") {
  if (role === "admin") return "أدمن";
  if (role === "support") return "دعم";
  if (role === "instructor") return "دكتور";
  return "طالب";
}

function getStatusLabel(status?: "active" | "blocked" | "suspended") {
  if (status === "blocked") return "محظور";
  if (status === "suspended") return "موقوف";
  return "نشط";
}

export default async function AdminUsersPage() {
  const users = await getAdminUsersPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef8f5] text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black">كل المستخدمين</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              عرض مباشر لكل الحسابات مع الدور، التحقق، والحالة الحالية.
            </p>
          </div>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[760px] text-right text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-4">الاسم</th>
              <th className="p-4">البريد</th>
              <th className="p-4">الدور</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">موثق</th>
              <th className="p-4">آخر دخول</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-4">
                  <p className="font-black">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.phone ?? "بدون هاتف"}</p>
                </td>
                <td className="p-4 text-muted-foreground">{user.email}</td>
                <td className="p-4">
                  <StatusBadge label={getRoleLabel(user.role)} tone={user.role} />
                </td>
                <td className="p-4">
                  <StatusBadge label={getStatusLabel(user.status)} tone={user.status ?? "active"} />
                </td>
                <td className="p-4 font-bold">{user.emailVerified ? "نعم" : "لا"}</td>
                <td className="p-4 text-muted-foreground">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("ar-EG") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
