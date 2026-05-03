"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminCourseAction } from "@/lib/admin/content-actions";
import { Button } from "@/components/ui/button";

export function DeleteCourseButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm(`هل أنت متأكد من حذف كورس "${courseTitle}" بالكامل؟ هذا الإجراء لا يمكن التراجع عنه!`)) {
      startTransition(() => {
        const formData = new FormData();
        formData.append("courseId", courseId);
        deleteAdminCourseAction(formData);
      });
    }
  }

  return (
    <Button
      variant="danger"
      size="sm"
      className="gap-2"
      disabled={isPending}
      onClick={handleDelete}
      type="button"
    >
      <Trash2 className="h-4 w-4" />
      {isPending ? "جاري الحذف..." : "حذف الكورس"}
    </Button>
  );
}
