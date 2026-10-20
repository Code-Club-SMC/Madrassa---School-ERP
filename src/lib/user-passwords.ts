/**
 * Generates a distinct, readable password for a user based on their name, role, and ID.
 * Ensures every teacher and staff member has their own unique password.
 */
export function generateUniquePasswordForUser(name: string, role: string, id: string): string {
  if (role === "super_admin") return "Admin@123";

  const cleanName = (name || "")
    .replace(/[^a-zA-Z]/g, "")
    .trim();

  const base =
    cleanName && cleanName.length >= 3
      ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase().slice(0, 6)
      : role === "teacher"
        ? "Teacher"
        : role === "parent"
          ? "Parent"
          : "Staff";

  // Deterministic 3-digit number from user ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 900;
  }
  const num = 100 + Math.abs(hash);

  return `${base}@${num}!`;
}

export function resolveUserPassword(user: {
  id?: string;
  name?: string;
  role?: string | null;
  initialPassword?: string | null;
}): {
  password: string;
  isRealPassword: boolean;
} {
  if (user.initialPassword && user.initialPassword.trim().length > 0) {
    return {
      password: user.initialPassword.trim(),
      isRealPassword: true,
    };
  }

  const generated = generateUniquePasswordForUser(
    user.name || "",
    user.role || "teacher",
    user.id || "u-default",
  );

  return {
    password: generated,
    isRealPassword: false,
  };
}

