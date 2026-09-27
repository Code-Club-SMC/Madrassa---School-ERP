import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { verifyPassword } from "@/lib/server/password";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createHmac } from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET;
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

function createSessionToken(foundUser: typeof user.$inferSelect) {
  const payload: SessionPayload = {
    userId: foundUser.id,
    email: foundUser.email,
    role: foundUser.role ?? "teacher",
    name: foundUser.name,
    nameUrdu: foundUser.nameUrdu ?? undefined,
    phone: foundUser.phone ?? undefined,
    cnic: foundUser.cnic ?? undefined,
    systemAccess: foundUser.systemAccess ?? undefined,
    mustChangePassword: foundUser.mustChangePassword ?? undefined,
    department: foundUser.department ?? undefined,
    designation: foundUser.designation ?? undefined,
  };

  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", SESSION_SECRET!).update(base64).digest("base64");
  return `${base64}.${signature}`;
}

function parseSessionToken(token: string): SessionPayload | null {
  const [base64, signature] = token.split(".");
  if (!base64 || !signature) return null;
  const expected = createHmac("sha256", SESSION_SECRET!).update(base64).digest("base64");
  if (signature !== expected) return null;
  try {
    return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

function userResponse(foundUser: typeof user.$inferSelect) {
  return {
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.role ?? "teacher",
    nameUrdu: foundUser.nameUrdu ?? undefined,
    phone: foundUser.phone ?? undefined,
    cnic: foundUser.cnic ?? undefined,
    systemAccess: foundUser.systemAccess ?? undefined,
    mustChangePassword: foundUser.mustChangePassword ?? undefined,
    department: foundUser.department ?? undefined,
    designation: foundUser.designation ?? undefined,
  };
}

export const loginServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      identifier: z.string().min(1),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const trimmed = data.identifier.trim();
    const [foundUser] = await db.select().from(user).where(or(eq(user.email, trimmed), eq(user.username, trimmed))).limit(1);
    if (!foundUser) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const [foundAccount] = await db
      .select()
      .from(account)
      .where(eq(account.userId, foundUser.id))
      .limit(1);

    const storedPassword = foundAccount?.password ?? "";
    const valid = await verifyPassword(storedPassword, data.password);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const token = createSessionToken(foundUser);

    setCookie(SESSION_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return new Response(JSON.stringify({ user: userResponse(foundUser) }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

export const logoutServer = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});

export const getUserServer = createServerFn({ method: "GET" }).handler(async () => {
  const sessionCookie = getCookie(SESSION_COOKIE);
  if (!sessionCookie) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const payload = parseSessionToken(sessionCookie);
  if (!payload) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const [foundUser] = await db.select().from(user).where(eq(user.id, payload.userId)).limit(1);
  if (!foundUser) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ user: userResponse(foundUser) }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
