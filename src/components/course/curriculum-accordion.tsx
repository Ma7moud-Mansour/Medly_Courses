import { Clock, FileText, Lock, PlayCircle, ScrollText, TestTube2 } from "lucide-react";
import type { CurriculumChapter } from "@/types";

function lessonIcon(type?: string, isPreview?: boolean) {
  if (isPreview) {
    return <PlayCircle className="h-4 w-4 text-primary" />;
  }

  if (type === "text") {
    return <ScrollText className="h-4 w-4 text-primary" />;
  }

  if (type === "pdf" || type === "attachment") {
    return <FileText className="h-4 w-4 text-primary" />;
  }

  if (type === "quiz") {
    return <TestTube2 className="h-4 w-4 text-primary" />;
  }

  return <Lock className="h-4 w-4 text-muted-foreground" />;
}

export function CurriculumAccordion({ curriculum }: { curriculum: CurriculumChapter[] }) {
  return (
    <div className="grid gap-3">
      {curriculum.map((chapter, index) => (
        <details
          key={chapter.id}
          className="rounded-lg border border-border bg-surface p-4"
          open={index === 0}
        >
          <summary className="cursor-pointer text-lg font-black">
            {chapter.order}. {chapter.title}
          </summary>
          {chapter.description ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{chapter.description}</p> : null}
          <div className="mt-4 grid gap-2">
            {chapter.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-3 text-sm"
              >
                <span className="flex items-center gap-2 font-bold">
                  {lessonIcon(lesson.lessonType, lesson.isPreview)}
                  {lesson.title}
                </span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="rounded-lg bg-white px-2 py-1 text-[11px] uppercase">{lesson.lessonType ?? "video"}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {lesson.durationMinutes} د
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
