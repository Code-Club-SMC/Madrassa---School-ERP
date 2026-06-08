import { ROLE_DEFAULTS, getSuperAdminPermissions } from "@/lib/permissions/role-defaults";
import type { UserPermissions } from "@/lib/permissions/module-registry";
import type { User } from "@/types";

export function resolveDisplayPerms(user: User): UserPermissions {
  if (user.role === "super_admin") return getSuperAdminPermissions();
  if (user.permissions && Object.keys(user.permissions).length > 0) return user.permissions;
  if (user.role === "admin") return ROLE_DEFAULTS.admin;
  if (user.role === "teacher") return ROLE_DEFAULTS.teacher;
  return {};
}