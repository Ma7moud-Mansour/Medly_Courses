import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { enrichedCategories } from "@/data/medly";

export function CategoryGrid() {
  const categories = enrichedCategories.slice(0, 4);

  return (
    <section className="border-b border-[#e8eeec] bg-white py-10">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-sm font-black text-[#8a6a2f]">مسارات الدراسة</p>
            <h2 className="mt-2 text-2xl font-black leading-9 text-[#0f172a]">
              ابدأ من المادة الأقرب لاحتياجك.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                className="group rounded-lg border border-[#e8eeec] bg-[#fbfcfb] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#dceeea] hover:bg-white"
                href={`/categories/${category.slug}`}
              >
                <p className="text-xs font-black text-[#8a6a2f]">{category.coursesCount} كورسات</p>
                <h3 className="mt-2 text-lg font-black text-[#0f172a]">{category.name}</h3>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#0e5f5c]">
                  تصفح
                  <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
