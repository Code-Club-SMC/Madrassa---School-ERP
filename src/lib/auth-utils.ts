import type { User, UserRole } from "@/types";

export const staffRoles: readonly UserRole[] = [
  "super_admin",
  "admin",
  "principal",
  "hr_manager",
  "accountant",
  "librarian",
  "receptionist",
  "teacher",
  "staff",
];

export function toAppUser(authUser: {
  id: string;
  name: string;
  email: string;
  role: string;
  nameUrdu?: string;
  phone?: string;
  cnic?: string;
  systemAccess?: string;
  mustChangePassword?: boolean;
  department?: string;
  designation?: string;
}): User {
  return {
    id: authUser.id,
    name: authUser.name,
    nameUrdu: authUser.nameUrdu,
    email: authUser.email,
    username: authUser.email,
    role: authUser.role as UserRole,
    status: "active",
    createdBy: authUser.id,
    createdAt: new Date().toISOString(),
    phone: authUser.phone,
    cnic: authUser.cnic,
    systemAccess: authUser.systemAccess as "madrassa" | "school" | "both" | undefined,
    mustChangePassword: authUser.mustChangePassword,
    department: authUser.department,
    designation: authUser.designation,
  };
}

export function hasAnyRole(user: User, roles: readonly UserRole[]): boolean {
  return roles.includes(user.role);
}
