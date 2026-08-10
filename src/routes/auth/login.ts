import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { verifyPassword } from "@better-auth/utils/password";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const Route = createFileRoute("/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { email, password } = loginSchema.parse(body);

          const [foundUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);
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
          const valid = await verifyPassword(storedPassword, password);
          if (!valid) {
            return new Response(JSON.stringify({ error: "Invalid email or password" }), {
              status: 401,
              headers: { "content-type": "application/json" },
            });
          }

          const token = Buffer.from(
            JSON.stringify({
              userId: foundUser.id,
              email: foundUser.email,
              role: foundUser.role,
              exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
            })
          ).toString("base64");

          return new Response(
            JSON.stringify({
              token,
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
              headers: {
                "content-type": "application/json",
                "set-cookie": `msmis_auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
              },
            }
          );
        } catch (error) {
          console.error("Login error:", error);
          return new Response(JSON.stringify({ error: "Login failed" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
