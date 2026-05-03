import { TicketPercent } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminCouponsPageData } from "@/lib/admin/actions";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await getAdminCouponsPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef8f5] text-primary">
            <TicketPercent className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black">الكوبونات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              عرض حي للكوبونات الموجودة في قاعدة البيانات مع عدد الاستخدامات وحالة التفعيل.
            </p>
          </div>
        </div>
      </section>

      {coupons.length ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-4">الكود</th>
                <th className="p-4">النوع</th>
                <th className="p-4">القيمة</th>
                <th className="p-4">أقل طلب</th>
                <th className="p-4">الاستخدام</th>
                <th className="p-4">الانتهاء</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-border">
                  <td className="p-4 font-black">{coupon.code}</td>
                  <td className="p-4 text-muted-foreground">
                    {coupon.type === "percent" ? "نسبة مئوية" : "خصم ثابت"}
                  </td>
                  <td className="p-4 font-bold">
                    {coupon.type === "percent" ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : "بدون حد أدنى"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {coupon.usagesCount.toLocaleString("ar-EG")}
                    {coupon.maxUsage ? ` / ${coupon.maxUsage.toLocaleString("ar-EG")}` : ""}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("ar-EG") : "بدون تاريخ"}
                  </td>
                  <td className="p-4">
                    <StatusBadge label={coupon.active ? "مفعّل" : "متوقف"} tone={coupon.active ? "active" : "suspended"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm font-bold text-muted-foreground shadow-sm">
          لا توجد كوبونات محفوظة في قاعدة البيانات.
        </div>
      )}
    </div>
  );
}
