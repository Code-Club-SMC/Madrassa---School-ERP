import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { eq, desc, sql } from "drizzle-orm";
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

import { KNOWN_URDU_NAMES } from "@/lib/user-names";
import { ensureUserColumns } from "@/lib/auth-helpers.server";
import { errorResponse } from "@/lib/server/http";

export const Route = createFileRoute("/api/users/")({
  server: {
    handlers: {
      GET: async () => {
        await ensureUserColumns();
        try {
          const rows = await db.select().from(user).orderBy(desc(user.createdAt));
          const enriched = rows.map((r) => ({
            ...r,
            id: r.id,
            name: r.name || "User",
            email: r.email || "",
            username: r.username || r.email || r.id,
            role: r.role || "teacher",
            status: r.status || "active",
            systemAccess: r.systemAccess || "both",
            createdAt: r.createdAt ? (typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString()) : new Date().toISOString(),
            lastLoginAt: (r as any).lastLoginAt ? String((r as any).lastLoginAt) : undefined,
            nameUrdu: r.nameUrdu || (r.name ? KNOWN_URDU_NAMES[r.name] : null) || null,
          }));
          return new Response(JSON.stringify({ users: enriched }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err: any) {
          console.error("Failed to load users with full schema, trying safe fallback:", err);
          try {
            const raw = await db.execute(sql`SELECT * FROM "user" ORDER BY created_at DESC`);
            const enriched = (raw.rows || []).map((r: any) => ({
              id: r.id,
              name: r.name || "User",
              email: r.email || "",
              username: r.username || r.email || r.id,
              role: r.role || "teacher",
              status: r.status || "active",
              systemAccess: r.system_access || r.systemAccess || "both",
              createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
              nameUrdu: r.name_urdu || r.nameUrdu || (r.name ? KNOWN_URDU_NAMES[r.name] : null) || null,
              phone: r.phone || null,
              cnic: r.cnic || null,
              department: r.department || null,
              designation: r.designation || null,
            }));
            return new Response(JSON.stringify({ users: enriched }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          } catch (fallbackErr: any) {
            console.error("Both primary and fallback user queries failed:", fallbackErr);
            return errorResponse(fallbackErr, "صارفین کی فہرست لوڈ نہیں ہو سکی · Could not load users");
          }
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
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

          await ensureUserColumns().catch(() => {});
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
        } catch (err: any) {
          console.error("Failed to create user:", err);
          return errorResponse(err, "نیا صارف بنانے میں خرابی پیش آئی · Failed to create user");
        }
      },
    },
  },
});
