import { useMemo } from "react";
import { currentUser } from "@/mock";
import { users as mockUsers } from "@/mock/users";
import { can, canView, getAccessibleModules } from "@/lib/permissions/utils";
import { getSuperAdminPermissions, ROLE_DEFAULTS } from "@/lib/permissions/role-defaults";
import type { ModuleKey, PermissionAction, UserPermissions } from "@/lib/permissions/module-registry";
import type { UserRole } from "@/types";

function resolvePermissions(role: UserRole, stored: UserPermissions | undefined): UserPermissions {
  if (role === "super_admin") return getSuperAdminPermissions();
  if (stored && Object.keys(stored).length > 0) return stored;
  if (role === "admin") return ROLE_DEFAULTS.admin;
  if (role === "teacher") return ROLE_DEFAULTS.teacher;
  return {};
}

export function usePermissions() {
  const role = currentUser.role as UserRole;
  // The active user might have stored permissions in mockUsers list
  const stored = mockUsers.find((u) => u.id === currentUser.id)?.permissions;
  const permissions = useMemo(() => resolvePermissions(role, stored), [role, stored]);
  const accessibleModules = useMemo(() => getAccessibleModules(permissions), [permissions]);

  return {
    permissions,
    can: (module: ModuleKey, action: PermissionAction) => can(permissions, module, action),
    canView: (module: ModuleKey) => canView(permissions, module),
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin",
    isTeacher: role === "teacher",
    isParent: role === "parent",
    role,
    accessibleModules,
  };
}