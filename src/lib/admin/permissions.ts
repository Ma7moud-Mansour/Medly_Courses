import {
  getEffectiveStudentPermissions,
  globalStudentPermissionDefaults as globalPermissionDefaults,
} from "@/lib/student/repository";

export { getEffectiveStudentPermissions, globalPermissionDefaults };

export async function canStudentAccessCourse(userId: string, courseId: string) {
  const permissions = await getEffectiveStudentPermissions(userId, courseId);
  return permissions.canAccessCourse;
}
