import Link from "next/link";
import { Search, UserRoundSearch } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminStudentsPageData } from "@/lib/admin/actions";
import type { UserStatus } from "@/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusOptions: Array<{ value: UserStatus | "all"; label: string }> = [
  { value: "all", label: "كل الحالات" },
  { value: "active", label: "نشط" },
  { value: "blocked", label: "محظور" },
  { value: "suspended", label: "موقوف" },
];

function getStatusLabel(status?: UserStatus) {
  if (status === "blocked") return "محظور";
  if (status === "suspended") return "موقوف";
  return "نشط";
}

export default async function AdminStudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = first(params.query) ?? "";
  const status = (first(params.status) as UserStatus | "all" | undefined) ?? "all";
  const students = await getAdminStudentsPageData(query, status);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-primary">
              <UserRoundSearch className="h-4 w-4" />
              إدارة ملفات الطلاب
            </p>
            <h1 className="mt-2 text-3xl font-black">الطلاب</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ابحث باسم الطالب أو بريده، ثم افتح ملفه لتعديل الوصول، الصلاحيات الفردية، ومتابعة الدعم.
            </p>
          </div>

          <form className="grid gap-3 sm:grid-cols-[minmax(280px,1fr)_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="form-input pr-10"
                defaultValue={query}
                name="query"
                placeholder="ابحث بالاسم أو البريد الإلكتروني أو الهاتف"
              />
            </div>
            <select className="form-input" defaultValue={status} name="status">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-black text-white" type="submit">
              بحث
            </button>
          </form>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[760px] text-right text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-4">الطالب</th>
              <th className="p-4">البريد</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">آخر دخول</th>
              <th className="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {students.length ? (
              students.map((student) => (
                <tr key={student.id} className="border-t border-border">
                  <td className="p-4">
                    <p className="font-black">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.phone ?? "لا يوجد رقم هاتف"}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">{student.email}</td>
                  <td className="p-4">
                    <StatusBadge label={getStatusLabel(student.status)} tone={student.status ?? "active"} />
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleDateString("ar-EG") : "—"}
                  </td>
                  <td className="p-4">
                    <Link className="font-black text-primary" href={`/admin/students/${student.id}`}>
                      فتح الملف
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-8 text-center font-bold text-muted-foreground" colSpan={5}>
                  لا توجد نتائج مطابقة لبحثك الحالي.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
