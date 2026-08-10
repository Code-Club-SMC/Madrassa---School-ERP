import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";

const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
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

export const Route = createFileRoute("/api/users/$id")({
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
