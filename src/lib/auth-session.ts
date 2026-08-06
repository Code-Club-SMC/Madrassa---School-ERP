import type { User, UserRole, UserStatus } from "@/types";
import type { UserPermissions } from "@/lib/permissions/module-registry";

export const userRoles = [
  "super_admin",
  "admin",
  "principal",
  "hr_manager",
  "accountant",
  "librarian",
  "receptionist",
  "teacher",
  "staff",
  "parent",
] as const satisfies readonly UserRole[];

export const staffRoles = [
  "super_admin",
  "admin",
  "principal",
  "hr_manager",
  "accountant",
  "librarian",
  "receptionist",
  "teacher",
  "staff",
] as const satisfies readonly UserRole[];

export type RawAuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: unknown;
  username?: unknown;
  role?: unknown;
  status?: unknown;
  banned?: unknown;
  nameUrdu?: unknown;
  phone?: unknown;
  cnic?: unknown;
  systemAccess?: unknown;
  mustChangePassword?: unknown;
  linkedTeacherId?: unknown;
  linkedStudentIds?: unknown;
  permissions?: unknown;
  department?: unknown;
  designation?: unknown;
} & Record<string, unknown>;

function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function normalizeRole(value: unknown): UserRole {
  if (Array.isArray(value)) {
    const firstKnown = value.find(isRole);
    return firstKnown ?? "teacher";
  }
  if (typeof value === "string" && value.includes(",")) {
    const firstKnown = value.split(",").map((item) => item.trim()).find(isRole);
    return firstKnown ?? "teacher";
  }
  return isRole(value) ? value : "teacher";
}

function normalizeStatus(value: unknown): UserStatus {
  return value === "inactive" ? "inactive" : "active";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

function permissionsValue(value: unknown): UserPermissions | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UserPermissions) : undefined;
}

export function toAppUser(user: RawAuthUser): User {
  const email = user.email;
  const username = stringValue(user.username) ?? email.split("@")[0] ?? email;

  return {
    id: user.id,
    name: user.name,
    nameUrdu: stringValue(user.nameUrdu),
    email,
    username,
    role: normalizeRole(user.role),
    status: user.banned === true ? "inactive" : normalizeStatus(user.status),
    linkedStudentIds: stringArray(user.linkedStudentIds),
    linkedTeacherId: stringValue(user.linkedTeacherId),
    createdBy: "better-auth",
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : stringValue(user.createdAt) ?? new Date().toISOString(),
    phone: stringValue(user.phone),
    cnic: stringValue(user.cnic),
    systemAccess:
      user.systemAccess === "madrassa" || user.systemAccess === "school" || user.systemAccess === "both"
        ? user.systemAccess
        : "both",
    mustChangePassword: typeof user.mustChangePassword === "boolean" ? user.mustChangePassword : false,
    permissions: permissionsValue(user.permissions),
    department: stringValue(user.department),
    designation: stringValue(user.designation),
  };
}

export function hasAnyRole(user: User | null | undefined, roles: readonly UserRole[]) {
  return Boolean(user && roles.includes(user.role));
}
