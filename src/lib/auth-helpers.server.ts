import { getCookie } from "@tanstack/react-start/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import type { User } from "@/types";
import { createHmac } from "node:crypto";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "msmis_erp_fallback_secret_key_2026_super_secure";
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

function parseSessionToken(token: string): SessionPayload | null {
  const [base64, signature] = token.split(".");
  if (!base64 || !signature) return null;
  const expected = createHmac("sha256", SESSION_SECRET).update(base64).digest("base64");
  if (signature !== expected) return null;
  try {
    return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function getSessionUser(request?: Request): Promise<{
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
  let sessionCookie: string | undefined;

  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
      if (match) {
        sessionCookie = decodeURIComponent(match[1]);
      }
    }
  }

  if (!sessionCookie) {
    try {
      sessionCookie = getCookie(SESSION_COOKIE);
    } catch {
      // getCookie may fail if outside event AsyncLocalStorage context
    }
  }

  if (!sessionCookie) return null;

  const payload = parseSessionToken(sessionCookie);
  if (!payload) return null;

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
}
