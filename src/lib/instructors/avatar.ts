const ILLUSTRATED_AVATARS: Array<{
  match: (slug?: string, name?: string) => boolean;
  src: string;
}> = [
  {
    match: (slug, name) =>
      slug === "dr-abdelrahman-nader" ||
      name?.includes("عبد الرحمن") === true ||
      name?.toLowerCase().includes("abdelrahman") === true,
    src: "/images/instructors/avatar-abdelrahman.svg",
  },
  {
    match: (slug, name) =>
      slug === "dr-youssef-ziadeh" ||
      name?.includes("يوسف") === true ||
      name?.toLowerCase().includes("youssef") === true,
    src: "/images/instructors/avatar-youssef.svg",
  },
];

export function resolveInstructorAvatar(avatar?: string, slug?: string, name?: string) {
  const illustrated = ILLUSTRATED_AVATARS.find((entry) => entry.match(slug, name));

  if (illustrated) {
    return illustrated.src;
  }

  if (avatar?.startsWith("/images/instructors/")) {
    return avatar;
  }

  return "/images/instructors/avatar-default.svg";
}
