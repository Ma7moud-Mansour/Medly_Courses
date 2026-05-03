import Image from "next/image";
import { cn } from "@/lib/utils";
import { resolveInstructorAvatar } from "@/lib/instructors/avatar";

type InstructorAvatarProps = {
  avatar?: string;
  slug?: string;
  name: string;
  className?: string;
  priority?: boolean;
};

export function InstructorAvatar({
  avatar,
  slug,
  name,
  className,
  priority,
}: InstructorAvatarProps) {
  const src = resolveInstructorAvatar(avatar, slug, name);

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-[#eef8f5]", className)}>
      <Image
        fill
        alt={name}
        className="object-cover"
        priority={priority}
        sizes="(max-width: 768px) 96px, 160px"
        src={src}
      />
    </div>
  );
}
