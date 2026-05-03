import Link from "next/link";
import { CheckCircle2, CirclePlay, FileLock2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Course, CurriculumChapter, Lesson } from "@/types";

export function LessonSidebar({
  course,
  curriculum,
  currentLesson,
  completedLessonIds = [],
}: {
  course: Course;
  curriculum: CurriculumChapter[];
  currentLesson: Lesson;
  completedLessonIds?: string[];
}) {
  const allLessons = curriculum.flatMap((chapter) => chapter.lessons);
  const completedCount = allLessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const progress = allLessons.length ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <aside className="border-l border-border bg-surface lg:h-screen lg:overflow-y-auto">
      <div className="border-b border-border p-4">
        <Link className="text-sm font-bold text-primary" href={`/courses/${course.slug}`}>
          العودة لصفحة الكورس
        </Link>
        <h1 className="mt-2 text-xl font-black">{course.title}</h1>
        <div className="mt-4">
          <ProgressBar value={progress} />
          <p className="mt-2 text-xs font-bold text-muted-foreground">{progress}% من الدروس المكتملة</p>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        {curriculum.map((chapter) => (
          <section key={chapter.id}>
            <h2 className="mb-2 text-sm font-black text-muted-foreground">
              {chapter.order}. {chapter.title}
            </h2>
            <div className="grid gap-1">
              {chapter.lessons.map((lesson) => {
                const active = lesson.id === currentLesson.id;
                const completed = completedLessonIds.includes(lesson.id);
                const locked = lesson.isAccessible === false;

                if (locked) {
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-bold text-muted-foreground"
                    >
                      <FileLock2 className="h-4 w-4" />
                      <div className="grid gap-1">
                        <span>{lesson.title}</span>
                        {lesson.lockedReason ? <span className="text-xs font-normal">{lesson.lockedReason}</span> : null}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={lesson.id}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
                      active ? "bg-primary text-white" : "hover:bg-muted"
                    }`}
                    href={`/learn/${course.slug}/${lesson.slug}`}
                  >
                    {active ? (
                      <CirclePlay className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className={`h-4 w-4 ${completed ? "text-primary" : "text-muted-foreground/50"}`} />
                    )}
                    <span className="flex-1">{lesson.title}</span>
                    <span className={`rounded-lg px-2 py-1 text-[11px] uppercase ${active ? "bg-white/15 text-white" : "bg-muted text-muted-foreground"}`}>
                      {lesson.lessonType ?? "video"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
