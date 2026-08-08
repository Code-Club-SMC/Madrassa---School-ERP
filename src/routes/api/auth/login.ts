import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;

  return new Promise((resolve, reject) => {
    const { scrypt } = require("node:crypto");
    scrypt(
      password.normalize("NFKC"),
      Buffer.from(salt, "hex"),
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(Buffer.from(derivedKey).toString("hex") === key);
      }
    );
  });
}

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          console.log("[custom-auth] login body:", JSON.stringify(body));
          const { email, password } = loginSchema.parse(body);
          console.log("[custom-auth] login email:", email);

          const [foundUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);
          console.log("[custom-auth] foundUser:", foundUser ? foundUser.id : null);

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
          console.log("[custom-auth] storedPassword length:", storedPassword.length);

          const valid = await verifyPassword(password, storedPassword);
          console.log("[custom-auth] password valid:", valid);

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
              headers: { "content-type": "application/json" },
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
