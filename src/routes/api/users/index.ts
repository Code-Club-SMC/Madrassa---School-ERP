import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.string().min(1),
  nameUrdu: z.string().optional(),
  phone: z.string().optional(),
  cnic: z.string().optional(),
  systemAccess: z.string().optional(),
  mustChangePassword: z.boolean().optional(),
  linkedTeacherId: z.string().optional(),
  linkedStudentIds: z.array(z.string()).optional(),
  permissions: z.record(z.string(), z.any()).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export const Route = createFileRoute("/api/users/")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await db.select().from(user).orderBy(desc(user.createdAt));
        return new Response(JSON.stringify({ users: rows }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
      POST: async ({ request }: { request: Request }) => {
        const body = await request.json();
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid request body", issues: parsed.error.issues }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const data = parsed.data;
        const id = `u${Date.now()}`;
        const hashedPassword = await bcrypt.hash(data.password, 10);

        await db.insert(user).values({
          id,
          name: data.name,
          email: data.email,
          role: data.role,
          nameUrdu: data.nameUrdu ?? null,
          phone: data.phone ?? null,
          cnic: data.cnic ?? null,
          systemAccess: data.systemAccess ?? "both",
          mustChangePassword: data.mustChangePassword ?? true,
          linkedTeacherId: data.linkedTeacherId ?? null,
          linkedStudentIds: data.linkedStudentIds ?? [],
          permissions: data.permissions ?? {},
          department: data.department ?? null,
          designation: data.designation ?? null,
        });

        await db.insert(account).values({
          id: `a${Date.now()}`,
          userId: id,
          accountId: data.email,
          providerId: "credential",
          password: hashedPassword,
        });

        const created = await db.select().from(user).where(eq(user.id, id)).limit(1);
        return new Response(JSON.stringify({ user: created[0] }), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
