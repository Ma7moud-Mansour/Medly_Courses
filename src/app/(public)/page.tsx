import { FaqPreview } from "@/components/home/faq-preview";
import { CoursesSection } from "@/components/home/courses-section";
import { FinalCta } from "@/components/home/final-cta";
import { HeroSection } from "@/components/home/hero-section";
import { InstructorsShowcase } from "@/components/home/instructors-showcase";
import { SearchFilter } from "@/components/home/search-filter";
import { WhyMedly } from "@/components/home/why-medly";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { discoverPublicCourses } from "@/lib/course/repository";

function toViewerContext(session: Awaited<ReturnType<typeof getServerSessionUser>>) {
  if (!session.isAuthenticated || !session.userId || !session.role) {
    return { isAuthenticated: false } as const;
  }

  return {
    isAuthenticated: true as const,
    userId: session.userId,
    role: session.role,
  };
}

export default async function HomePage() {
  const session = await getServerSessionUser();
  const latestCourses = await discoverPublicCourses(
    {
      sort: "newest",
      page: 1,
      pageSize: 4,
    },
    toViewerContext(session),
  );

  return (
    <>
      <HeroSection />
      <SearchFilter />
      <CoursesSection courses={latestCourses.courses} />
      <WhyMedly />
      <InstructorsShowcase />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
