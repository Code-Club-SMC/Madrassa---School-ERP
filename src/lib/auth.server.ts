import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { verifyPassword } from "@better-auth/utils/password";
import { cookies } from "@tanstack/react-start/server";

const SESSION_COOKIE = "msmis_session";

function createSessionToken(foundUser: typeof user.$inferSelect) {
  const payload = {
    userId: foundUser.id,
    email: foundUser.email,
    role: foundUser.role,
    name: foundUser.name,
    nameUrdu: foundUser.nameUrdu,
    phone: foundUser.phone,
    cnic: foundUser.cnic,
    systemAccess: foundUser.systemAccess,
    mustChangePassword: foundUser.mustChangePassword,
    department: foundUser.department,
    designation: foundUser.designation,
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export const loginServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const [foundUser] = await db.select().from(user).where(eq(user.email, data.email)).limit(1);
    if (!foundUser) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
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
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const token = createSessionToken(foundUser);

    cookies().set(SESSION_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return new Response(
      JSON.stringify({
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
          nameUrdu: foundUser.nameUrdu,
          phone: foundUser.phone,
          cnic: foundUser.cnic,
          systemAccess: foundUser.systemAccess,
          mustChangePassword: foundUser.mustChangePassword,
          department: foundUser.department,
          designation: foundUser.designation,
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  });

export const logoutServer = createServerFn({ method: "POST" }).handler(async () => {
  cookies().delete(SESSION_COOKIE, { path: "/" });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});

export const getUserServer = createServerFn({ method: "GET" }).handler(async () => {
  const sessionCookie = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const payload = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf-8"));
    const [foundUser] = await db.select().from(user).where(eq(user.id, payload.userId)).limit(1);
    if (!foundUser) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
          nameUrdu: foundUser.nameUrdu,
          phone: foundUser.phone,
          cnic: foundUser.cnic,
          systemAccess: foundUser.systemAccess,
          mustChangePassword: foundUser.mustChangePassword,
          department: foundUser.department,
          designation: foundUser.designation,
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
});
