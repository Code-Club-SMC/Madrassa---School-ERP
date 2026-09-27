import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/server/password";

export async function createUser({
  name,
  email,
  username,
  password,
  role,
  data,
}: {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  data?: Record<string, unknown>;
}) {
  const hashedPassword = await hashPassword(password);
  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const accountId = `account_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await db.insert(user).values({
    id: userId,
    name,
    email,
    username,
    role,
    emailVerified: true,
    status: "active",
    systemAccess: "both",
    mustChangePassword: true,
    ...data,
  } as any);

  await db.insert(account).values({
    id: accountId,
    accountId: email,
    providerId: "credential",
    userId,
    password: hashedPassword,
  } as any);

  return { id: userId };
}

export async function deleteUser(userId: string) {
  await db.delete(account).where(eq(account.userId, userId));
  await db.delete(user).where(eq(user.id, userId));
}
