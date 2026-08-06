import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

export const authAc = createAccessControl(defaultStatements);

const fullUserPermissions = [
  "create",
  "list",
  "set-role",
  "ban",
  "impersonate",
  "impersonate-admins",
  "delete",
  "set-password",
  "set-email",
  "get",
  "update",
] as const;

const adminUserPermissions = [
  "create",
  "list",
  "set-role",
  "ban",
  "impersonate",
  "delete",
  "set-password",
  "set-email",
  "get",
  "update",
] as const;

const sessionPermissions = ["list", "revoke", "delete"] as const;

const noAdminPermissions = authAc.newRole({
  user: [],
  session: [],
});

const adminPermissions = authAc.newRole({
  user: adminUserPermissions,
  session: sessionPermissions,
});

const superAdminPermissions = authAc.newRole({
  user: fullUserPermissions,
  session: sessionPermissions,
});

export const authRoles = {
  super_admin: superAdminPermissions,
  admin: adminPermissions,
  principal: noAdminPermissions,
  hr_manager: noAdminPermissions,
  accountant: noAdminPermissions,
  librarian: noAdminPermissions,
  receptionist: noAdminPermissions,
  teacher: noAdminPermissions,
  staff: noAdminPermissions,
  parent: noAdminPermissions,
};

export const authAdminRoles = ["super_admin", "admin"] as const;
