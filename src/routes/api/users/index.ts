import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq, ne, desc } from "drizzle-orm";
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
  permissions: z.record(z.any()).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

const updateSchema = createSchema.partial().required({ email: true });

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

export const updateRoute = createFileRoute("/api/users/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const body = await request.json();
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid request body", issues: parsed.error.issues }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const data = parsed.data;
        const updates: Record<string, unknown> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.email !== undefined) updates.email = data.email;
        if (data.role !== undefined) updates.role = data.role;
        if (data.nameUrdu !== undefined) updates.nameUrdu = data.nameUrdu;
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.cnic !== undefined) updates.cnic = data.cnic;
        if (data.systemAccess !== undefined) updates.systemAccess = data.systemAccess;
        if (data.mustChangePassword !== undefined) updates.mustChangePassword = data.mustChangePassword;
        if (data.linkedTeacherId !== undefined) updates.linkedTeacherId = data.linkedTeacherId;
        if (data.linkedStudentIds !== undefined) updates.linkedStudentIds = data.linkedStudentIds;
        if (data.permissions !== undefined) updates.permissions = data.permissions;
        if (data.department !== undefined) updates.department = data.department;
        if (data.designation !== undefined) updates.designation = data.designation;

        await db.update(user).set(updates).where(eq(user.id, params.id));
        const updated = await db.select().from(user).where(eq(user.id, params.id)).limit(1);
        return new Response(JSON.stringify({ user: updated[0] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
      DELETE: async ({ params }: { params: { id: string } }) => {
        await db.delete(user).where(eq(user.id, params.id));
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
