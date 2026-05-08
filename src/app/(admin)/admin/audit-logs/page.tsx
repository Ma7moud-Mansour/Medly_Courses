import Link from "next/link";
import { getAdminAuditLogsPageData } from "@/lib/admin/actions";
import { StatusBadge } from "@/components/admin/status-badge";

export const dynamic = "force-dynamic";

function getRoleLabel(role?: "admin" | "support" | "student" | "instructor") {
  if (role === "support") return "دعم";
  if (role === "student") return "طالب";
  if (role === "instructor") return "دكتور";
  return "أدمن";
}

export default async function AdminAuditLogsPage() {
  const logs = await getAdminAuditLogsPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h1 className="text-3xl font-black">سجل التدقيق</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          كل إجراء إداري مهم يظهر هنا: فتح كورس، سحب وصول، تعديل صلاحيات فردية، مراجعة مدفوعات، أو الرد على الدعم.
        </p>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[760px] text-right text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-4">الإجراء</th>
              <th className="p-4">المنفذ</th>
              <th className="p-4">المستهدف</th>
              <th className="p-4">الكيان</th>
              <th className="p-4">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-border align-top">
                  <td className="p-4">
                    <div className="grid gap-2">
                      <p className="font-black">{log.action}</p>
                      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        {JSON.stringify(log.metadata ?? {}, null, 2)}
                      </pre>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="grid gap-2">
                      <p className="font-black">{log.admin?.name ?? "غير معروف"}</p>
                      <StatusBadge
                        label={getRoleLabel(log.admin?.role)}
                        tone={(log.admin?.role ?? "admin") as "admin" | "support" | "student" | "instructor"}
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    {log.targetUser ? (
                      <Link className="font-black text-primary" href={`/admin/students/${log.targetUser.id}`}>
                        {log.targetUser.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {log.entityType}
                    <div className="text-xs">{log.entityId}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("ar-EG")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-8 text-center font-bold text-muted-foreground" colSpan={5}>
                  لا توجد سجلات تدقيق حتى الآن.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
