import { timingSafeEqual } from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user, account } from "@/db/schema/auth";
import { getSessionUser } from "@/lib/auth-helpers.server";
import { hashPassword } from "@/lib/server/password";

const tokenHeaderByKind = {
  setup: "x-setup-token",
  recovery: "x-recovery-token",
} as const;

const tokenEnvByKind = {
  setup: "SUPER_ADMIN_SETUP_TOKEN",
  recovery: "SUPER_ADMIN_RECOVERY_TOKEN",
} as const;

export const bootstrapSuperAdminSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8),
  nameUrdu: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  cnic: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  designation: z.string().trim().min(1).optional(),
  mustChangePassword: z.boolean().optional(),
});

export const recoverSuperAdminSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  newPassword: z.string().min(8),
});

export const updateSuperAdminSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    email: z.string().email().transform((email) => email.toLowerCase()).optional(),
    nameUrdu: z.string().trim().min(1).nullable().optional(),
    phone: z.string().trim().min(1).nullable().optional(),
    cnic: z.string().trim().min(1).nullable().optional(),
    department: z.string().trim().min(1).nullable().optional(),
    designation: z.string().trim().min(1).nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export type JsonBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<JsonBodyResult<T>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { ok: false, response: json({ error: "Invalid JSON body" }, 400) };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      response: json(
        {
          error: "Invalid request body",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        400,
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

export function requireSetupToken(request: Request, kind: keyof typeof tokenHeaderByKind) {
  const expected = process.env[tokenEnvByKind[kind]];
  const actual = request.headers.get(tokenHeaderByKind[kind]);

  if (!expected || expected.startsWith("replace-with-")) {
    return json({ error: `${tokenEnvByKind[kind]} is not configured` }, 500);
  }

  if (!actual || !constantTimeTokenEqual(actual, expected)) {
    return json({ error: "Invalid setup token" }, 401);
  }

  return null;
}

export async function listSuperAdmins() {
  return db.select().from(user).where(eq(user.role, "super_admin")).limit(2);
}

export async function getOnlySuperAdmin() {
  const rows = await listSuperAdmins();
  if (rows.length === 0) {
    return { ok: false as const, response: json({ error: "No super admin exists" }, 404) };
  }
  if (rows.length > 1) {
    return {
      ok: false as const,
      response: json({ error: "Multiple super admins exist; manual database repair is required" }, 409),
    };
  }
  return { ok: true as const, superAdmin: rows[0] };
}

export async function createFirstSuperAdmin(input: z.infer<typeof bootstrapSuperAdminSchema>) {
  const existing = await listSuperAdmins();
  if (existing.length > 0) {
    return json({ error: "Super admin already exists" }, 409);
  }

  const hashedPassword = await hashPassword(input.password);
  const [created] = await db.insert(user).values({
    name: input.name,
    email: input.email,
    username: input.email,
    role: "super_admin",
    status: "active",
    createdBy: input.email,
    createdAt: new Date().toISOString(),
    nameUrdu: input.nameUrdu,
    phone: input.phone,
    cnic: input.cnic,
    department: input.department,
    designation: input.designation,
    systemAccess: "both",
    mustChangePassword: input.mustChangePassword ?? true,
  } as any).returning();

  await db.insert(account).values({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: hashedPassword,
  } as any);

  return json({ user: publicSuperAdmin(created), mustChangePassword: input.mustChangePassword ?? true }, 201);
}

export async function recoverSuperAdminPassword(input: z.infer<typeof recoverSuperAdminSchema>) {
  const current = await getOnlySuperAdmin();
  if (!current.ok) return current.response;

  if (current.superAdmin.email.toLowerCase() !== input.email) {
    return json({ error: "Email does not match the existing super admin" }, 403);
  }

  const hashedPassword = await hashPassword(input.newPassword);
  await db.update(account).set({ password: hashedPassword }).where(eq(account.userId, current.superAdmin.id));
  await db.update(user).set({ mustChangePassword: true, updatedAt: new Date() }).where(eq(user.id, current.superAdmin.id));

  return json({ status: true, userId: current.superAdmin.id, mustChangePassword: true });
}

export async function updateCurrentSuperAdmin(request: Request, input: z.infer<typeof updateSuperAdminSchema>) {
  const session = await getSessionUser();
  if (!session || session.role !== "super_admin") {
    return json({ error: "Super admin session required" }, 403);
  }

  const current = await getOnlySuperAdmin();
  if (!current.ok) return current.response;
  if (current.superAdmin.id !== session.id) {
    return json({ error: "Only the existing super admin can update this profile" }, 403);
  }

  if (input.email) {
    const [emailOwner] = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.email, input.email), ne(user.id, current.superAdmin.id)))
      .limit(1);

    if (emailOwner) {
      return json({ error: "Email is already used by another account" }, 409);
    }
  }

  const [updated] = await db
    .update(user)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(user.id, current.superAdmin.id))
    .returning();

  return json({ user: publicSuperAdmin(updated) });
}

type PublicSuperAdminSource = Pick<typeof user.$inferSelect, "id" | "name" | "email"> &
  Partial<
    Pick<
      typeof user.$inferSelect,
      "role" | "nameUrdu" | "phone" | "cnic" | "department" | "designation" | "mustChangePassword"
    >
  >;

function publicSuperAdmin(value: PublicSuperAdminSource) {
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: value.role,
    nameUrdu: value.nameUrdu,
    phone: value.phone,
    cnic: value.cnic,
    department: value.department,
    designation: value.designation,
    mustChangePassword: value.mustChangePassword,
  };
}

function constantTimeTokenEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
