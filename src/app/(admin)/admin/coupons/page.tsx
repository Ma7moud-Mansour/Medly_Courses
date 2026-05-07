import { TicketPercent, Trash2 } from "lucide-react";
import { ActionFeedbackBanner } from "@/components/admin/action-feedback-banner";
import { StatusBadge } from "@/components/admin/status-badge";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import {
  createAdminCouponAction,
  deleteAdminCouponAction,
  updateAdminCouponAction,
} from "@/lib/admin/content-actions";
import { getAdminCouponsPageData } from "@/lib/admin/actions";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export default async function AdminCouponsPage({ searchParams }: { searchParams: SearchParams }) {
  const [coupons, params] = await Promise.all([getAdminCouponsPageData(), searchParams]);
  const flash = first(params.flash);
  const error = first(params.error);

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
              إضافة وتعديل وحذف كوبونات الخصم من قاعدة البيانات مباشرة.
            </p>
          </div>
        </div>
      </section>

      {flash ? <ActionFeedbackBanner kind="success" message={flash} /> : null}
      {error ? <ActionFeedbackBanner kind="error" message={error} /> : null}

      <form action={createAdminCouponAction} className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black">إضافة كوبون جديد</h2>
          <p className="mt-1 text-sm text-muted-foreground">الكوبون الجديد يظهر فورًا في السلة والـ checkout.</p>
        </div>

        <CouponFields />

        <PendingSubmitButton className="w-full sm:w-auto" label="إنشاء الكوبون" pendingLabel="جاري الحفظ..." />
      </form>

      {coupons.length ? (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <article key={coupon.id} className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{coupon.code}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {coupon.type === "percent" ? `${coupon.value}%` : formatCurrency(coupon.value)} - استخدم{" "}
                    {coupon.usagesCount.toLocaleString("ar-EG")}
                    {coupon.maxUsage ? ` / ${coupon.maxUsage.toLocaleString("ar-EG")}` : ""}
                  </p>
                </div>
                <StatusBadge label={coupon.active ? "مفعّل" : "متوقف"} tone={coupon.active ? "active" : "suspended"} />
              </div>

              <form action={updateAdminCouponAction} className="grid gap-4">
                <input name="couponId" type="hidden" value={coupon.id} />
                <CouponFields
                  active={coupon.active}
                  code={coupon.code}
                  expiresAt={toDateInput(coupon.expiresAt)}
                  maxUsage={coupon.maxUsage}
                  minOrderAmount={coupon.minOrderAmount}
                  type={coupon.type}
                  value={coupon.value}
                />
                <PendingSubmitButton className="w-full sm:w-auto" label="حفظ التعديل" pendingLabel="جاري الحفظ..." />
              </form>

              <form action={deleteAdminCouponAction} className="flex justify-end border-t border-border pt-4">
                <input name="couponId" type="hidden" value={coupon.id} />
                <PendingSubmitButton
                  className="border-danger/40 text-danger hover:bg-danger/5"
                  label="حذف الكوبون"
                  pendingLabel="جاري الحذف..."
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                </PendingSubmitButton>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm font-bold text-muted-foreground shadow-sm">
          لا توجد كوبونات محفوظة في قاعدة البيانات.
        </div>
      )}
    </div>
  );
}

function CouponFields({
  code,
  type = "percent",
  value,
  minOrderAmount,
  maxUsage,
  expiresAt,
  active = true,
}: {
  code?: string;
  type?: "percent" | "fixed";
  value?: number;
  minOrderAmount?: number;
  maxUsage?: number;
  expiresAt?: string;
  active?: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-bold">
          الكود
          <input className="form-input" defaultValue={code} name="code" placeholder="SAVE20" required />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          النوع
          <select className="form-input" defaultValue={type} name="type">
            <option value="percent">نسبة مئوية</option>
            <option value="fixed">خصم ثابت</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          القيمة
          <input className="form-input" defaultValue={value ?? 10} min="1" name="value" required type="number" />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          أقل طلب
          <input className="form-input" defaultValue={minOrderAmount ?? ""} min="0" name="minOrderAmount" type="number" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold">
          حد الاستخدام
          <input className="form-input" defaultValue={maxUsage ?? ""} min="1" name="maxUsage" type="number" />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          تاريخ الانتهاء
          <input className="form-input" defaultValue={expiresAt ?? ""} name="expiresAt" type="date" />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-bold">
          <input defaultChecked={active} name="active" type="checkbox" />
          مفعّل
        </label>
      </div>
    </>
  );
}
