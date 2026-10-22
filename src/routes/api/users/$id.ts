import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { errorResponse } from "@/lib/server/http";
import { ensureUserColumns } from "@/lib/auth-helpers.server";
import { hashPassword } from "@/lib/server/password";

const updateSchema = z.object({
  email: z.string().optional(),
  password: z.string().min(6).optional(),
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
        try {
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
          // Do not mutate user's email login identifier when updating user account
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

          await ensureUserColumns().catch(() => {});

          if (data.password && data.password.trim().length >= 6) {
            const hashedPassword = await hashPassword(data.password.trim());
            updates.initialPassword = data.password.trim();

            const existingAccount = await db.select().from(account).where(eq(account.userId, params.id)).limit(1);
            if (existingAccount[0]) {
              await db
                .update(account)
                .set({ password: hashedPassword, updatedAt: new Date() })
                .where(eq(account.id, existingAccount[0].id));
            } else {
              const [u] = await db.select().from(user).where(eq(user.id, params.id)).limit(1);
              await db.insert(account).values({
                id: `a${Date.now()}`,
                userId: params.id,
                accountId: u?.email || params.id,
                providerId: "credential",
                password: hashedPassword,
              });
            }
          }

          if (Object.keys(updates).length > 0) {
            await db.update(user).set(updates).where(eq(user.id, params.id));
          }
          const updated = await db.select().from(user).where(eq(user.id, params.id)).limit(1);
          return new Response(JSON.stringify({ user: updated[0] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          return errorResponse(error, "صارف کی معلومات اپ ڈیٹ نہیں ہو سکیں · Could not update user");
        }
      },
      DELETE: async ({ params }: { params: { id: string } }) => {
        try {
          await db.delete(user).where(eq(user.id, params.id));
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          return errorResponse(error, "صارف حذف نہیں ہو سکا · Could not delete user");
        }
      },
    },
  },
});
