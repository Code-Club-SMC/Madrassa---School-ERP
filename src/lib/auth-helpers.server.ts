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

let userSchemaChecked = false;

export async function ensureUserColumns() {
  if (userSchemaChecked) return;
  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`
      ALTER TABLE "user" 
        ADD COLUMN IF NOT EXISTS "username" text,
        ADD COLUMN IF NOT EXISTS "display_username" text,
        ADD COLUMN IF NOT EXISTS "role" text,
        ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "ban_reason" text,
        ADD COLUMN IF NOT EXISTS "ban_expires" timestamp,
        ADD COLUMN IF NOT EXISTS "name_urdu" text,
        ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS "phone" text,
        ADD COLUMN IF NOT EXISTS "cnic" text,
        ADD COLUMN IF NOT EXISTS "system_access" text DEFAULT 'both',
        ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS "linked_teacher_id" text,
        ADD COLUMN IF NOT EXISTS "linked_student_ids" text[],
        ADD COLUMN IF NOT EXISTS "permissions" jsonb,
        ADD COLUMN IF NOT EXISTS "department" text,
        ADD COLUMN IF NOT EXISTS "designation" text,
        ADD COLUMN IF NOT EXISTS "initial_password" text;
    `);
    userSchemaChecked = true;
  } catch (e) {
    console.warn("[ensureUserColumns] Note on user columns check:", e);
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

  let foundUser: any = null;
  try {
    const [u] = await db.select().from(user).where(eq(user.id, payload.userId)).limit(1);
    foundUser = u;
  } catch {
    try {
      await ensureUserColumns();
      const [u] = await db.select().from(user).where(eq(user.id, payload.userId)).limit(1);
      foundUser = u;
    } catch {
      try {
        const { sql } = await import("drizzle-orm");
        const rows = await db.execute(sql`
          SELECT id, name, email, role, status FROM "user" WHERE id = ${payload.userId} LIMIT 1
        `);
        foundUser = rows.rows?.[0];
      } catch (inner) {
        console.warn("[getSessionUser] User query error, using verified session payload:", inner);
      }
    }
  }

  const effectiveUser = foundUser ?? {
    id: payload.userId,
    name: payload.name,
    nameUrdu: payload.nameUrdu,
    email: payload.email,
    role: payload.role ?? "teacher",
    status: "active",
    phone: payload.phone,
    cnic: payload.cnic,
    systemAccess: payload.systemAccess ?? "both",
    mustChangePassword: payload.mustChangePassword,
    department: payload.department,
    designation: payload.designation,
  };

  return {
    id: effectiveUser.id,
    name: effectiveUser.name,
    nameUrdu: effectiveUser.nameUrdu ?? undefined,
    email: effectiveUser.email,
    username: effectiveUser.email,
    role: effectiveUser.role ?? "teacher",
    status: (effectiveUser.status ?? "active") as User["status"],
    createdBy: effectiveUser.id,
    createdAt: new Date().toISOString(),
    phone: effectiveUser.phone ?? undefined,
    cnic: effectiveUser.cnic ?? undefined,
    systemAccess: effectiveUser.systemAccess as any,
    mustChangePassword: effectiveUser.mustChangePassword ?? undefined,
    department: effectiveUser.department ?? undefined,
    designation: effectiveUser.designation ?? undefined,
    linkedTeacherId: effectiveUser.linkedTeacherId ?? undefined,
    permissions: effectiveUser.permissions ?? undefined,
  };
}
