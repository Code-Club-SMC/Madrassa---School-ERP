import { getCookie } from "@tanstack/react-start/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import type { User } from "@/types";

const SESSION_COOKIE = "msmis_session";

type SessionPayload = {
  userId: string;
  email: string;
  role: string;
  name: string;
  nameUrdu?: string;
  phone?: string;
  cnic?: string;
  systemAccess?: string;
  mustChangePassword?: boolean;
  department?: string;
  designation?: string;
};

export async function getSessionUser(): Promise<{
  id: string;
  name: string;
  nameUrdu?: string;
  email: string;
  username: string;
  role: string;
  status: string;
  createdBy: string;
  createdAt: string;
  phone?: string;
  cnic?: string;
  systemAccess?: string;
  mustChangePassword?: boolean;
  department?: string;
  designation?: string;
} | null> {
  const sessionCookie = getCookie(SESSION_COOKIE);
  if (!sessionCookie) return null;

  try {
    const payload = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf-8")) as SessionPayload;
    const [foundUser] = await db.select().from(user).where(eq(user.id, payload.userId)).limit(1);
    if (!foundUser) return null;

    return {
      id: foundUser.id,
      name: foundUser.name,
      nameUrdu: foundUser.nameUrdu ?? undefined,
      email: foundUser.email,
      username: foundUser.email,
      role: foundUser.role ?? "teacher",
      status: (foundUser.status ?? "active") as User["status"],
      createdBy: foundUser.id,
      createdAt: new Date().toISOString(),
      phone: foundUser.phone ?? undefined,
      cnic: foundUser.cnic ?? undefined,
      systemAccess: foundUser.systemAccess as any,
      mustChangePassword: foundUser.mustChangePassword ?? undefined,
      department: foundUser.department ?? undefined,
      designation: foundUser.designation ?? undefined,
    };
  } catch {
    return null;
  }
}
