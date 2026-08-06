import { auth } from "@/lib/auth";
import { toAppUser } from "@/lib/auth-session";
import type { ModuleKey, PermissionAction, UserPermissions } from "@/lib/permissions/module-registry";
import { getSuperAdminPermissions, ROLE_DEFAULTS, type DefaultableRole } from "@/lib/permissions/role-defaults";
import { can } from "@/lib/permissions/utils";
import type { User } from "@/types";
import { HttpError } from "./http";

export async function getRequestUser(request: Request): Promise<User | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ? toAppUser(session.user) : null;
}

export async function requirePermission(request: Request, module: ModuleKey, action: PermissionAction) {
  const user = await getRequestUser(request);
  if (!user) throw new HttpError("Authentication required", 401);

  const permissions = effectivePermissions(user);
  if (!can(permissions, module, action)) {
    throw new HttpError("You do not have permission for this action", 403);
  }

  return user;
}

function effectivePermissions(user: User): UserPermissions {
  if (user.role === "super_admin") return getSuperAdminPermissions();
  if (user.permissions) return user.permissions;
  return ROLE_DEFAULTS[user.role as DefaultableRole] ?? {};
}
