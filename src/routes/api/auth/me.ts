import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ user: null }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        const token = authHeader.slice(7);
        try {
          const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
          if (decoded.exp && Date.now() > decoded.exp) {
            return new Response(JSON.stringify({ user: null }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }

          const [foundUser] = await db.select().from(user).where(eq(user.id, decoded.userId)).limit(1);
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
            }
          );
        } catch {
          return new Response(JSON.stringify({ user: null }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
