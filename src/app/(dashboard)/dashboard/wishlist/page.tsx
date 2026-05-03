import Link from "next/link";
import { CourseGrid } from "@/components/course/course-grid";
import { buttonVariants } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server-session";
import { listWishlistCourses } from "@/lib/course/repository";

export default async function WishlistPage() {
  const session = await requireServerSession();
  const wishlist = await listWishlistCourses(session.userId);

  return (
    <div>
      <h1 className="text-3xl font-black">المفضلة</h1>
      <p className="mt-2 text-muted-foreground">
        هنا تظهر الكورسات التي أضفتها للمفضلة من حسابك الحقيقي فقط، مع حالة التسجيل والوصول الحالية.
      </p>

      <div className="mt-6">
        {wishlist.length ? (
          <CourseGrid courses={wishlist} />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
            لا توجد كورسات في المفضلة الآن.
            <div className="mt-4">
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/courses">
                تصفح الكورسات
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
