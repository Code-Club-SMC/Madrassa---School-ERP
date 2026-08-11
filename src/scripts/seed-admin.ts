import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";

const DEFAULT_ADMIN = {
  name: "Super Admin",
  email: "admin@example.com",
  password: "admin123",
  role: "super_admin" as const,
};

async function seedAdmin() {
  const [existing] = await db.select().from(user).where(eq(user.email, DEFAULT_ADMIN.email)).limit(1);
  if (existing) {
    console.log("Admin already exists:", existing.email);
    return;
  }

  const [existingSuperAdmin] = await db.select().from(user).where(eq(user.role, "super_admin")).limit(1);
  if (existingSuperAdmin) {
    console.log("Removing existing super admin:", existingSuperAdmin.email);
    await db.delete(account).where(eq(account.userId, existingSuperAdmin.id));
    await db.delete(user).where(eq(user.id, existingSuperAdmin.id));
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const accountId = `account_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const hashedPassword = await hashPassword(DEFAULT_ADMIN.password);

  await db.insert(user).values({
    id: userId,
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
    role: DEFAULT_ADMIN.role,
    emailVerified: true,
    status: "active",
    systemAccess: "both",
    mustChangePassword: true,
  });

  await db.insert(account).values({
    id: accountId,
    accountId: DEFAULT_ADMIN.email,
    providerId: "credential",
    userId,
    password: hashedPassword,
  });

  console.log("Created super admin:");
  console.log("  Email:    ", DEFAULT_ADMIN.email);
  console.log("  Password: ", DEFAULT_ADMIN.password);
  console.log("  User ID:  ", userId);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  });
