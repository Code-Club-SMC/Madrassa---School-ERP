import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNotNull, isNull, lte, ne, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  notificationEvents,
  notificationReads,
  type NotificationAudience,
  type NotificationStatus,
} from "@/db/schema/notifications";
import { guardians } from "@/db/schema/students";
import { requirePermission, getRequestUser } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import {
  canReadNotificationEvent,
  isNotificationVisibleNow,
  notificationAudiences,
  notificationCategories,
  notificationReadPatchSchema,
  notificationSources,
  notificationStatuses,
} from "@/lib/server/notifications/domain";
import type { UserRole } from "@/types";

export { notificationReadPatchSchema };

export const listNotificationsQuerySchema = z.object({
  audience: z.enum(notificationAudiences).optional(),
  category: z.enum(notificationCategories).optional(),
  source: z.enum(notificationSources).optional(),
  status: z.enum(notificationStatuses).optional(),
  read: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

type NotificationQuery = z.infer<typeof listNotificationsQuerySchema>;

const announcementDateSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: "Use a valid date and time",
  });

export const createAnnouncementSchema = z
  .object({
    audience: z.enum(["staff", "parent"]),
    category: z.enum(notificationCategories).default("system"),
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(1_000),
    publishAt: announcementDateSchema,
    expiresAt: announcementDateSchema,
  })
  .superRefine((data, ctx) => {
    const publishAt = parseOptionalDate(data.publishAt);
    const expiresAt = parseOptionalDate(data.expiresAt);
    const activeFrom = publishAt ?? new Date();

    if (expiresAt && expiresAt <= activeFrom) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expiry must be after the publish time",
      });
    }
  });

export async function listNotifications(request: Request, query: NotificationQuery) {
  const actor = await getAuthenticatedUser(request);
  const guardianIds = actor.role === "parent" ? await getGuardianIdsForUser(actor.id) : [];
  if (actor.role !== "parent") {
    await requirePermission(request, "dashboard", "view");
  }

  const now = new Date();
  const whereClauses = compactSql([
    query.audience ? eq(notificationEvents.audience, query.audience) : undefined,
    query.category ? eq(notificationEvents.category, query.category) : undefined,
    query.source ? eq(notificationEvents.source, query.source) : undefined,
    query.status ? eq(notificationEvents.status, query.status) : undefined,
    query.status === "archived" ? undefined : ne(notificationEvents.status, "archived"),
    or(isNull(notificationEvents.publishAt), lte(notificationEvents.publishAt, now)),
    or(isNull(notificationEvents.expiresAt), gt(notificationEvents.expiresAt, now)),
    query.read === true ? isNotNull(notificationReads.readAt) : undefined,
    query.read === false ? isNull(notificationReads.readAt) : undefined,
    visibilityCondition(actor.id, actor.role === "parent" ? "parent" : "staff", guardianIds),
  ]);

  const rows = await db
    .select({
      id: notificationEvents.id,
      audience: notificationEvents.audience,
      category: notificationEvents.category,
      channel: notificationEvents.channel,
      status: notificationEvents.status,
      source: notificationEvents.source,
      title: notificationEvents.title,
      body: notificationEvents.body,
      studentId: notificationEvents.studentId,
      guardianId: notificationEvents.guardianId,
      userId: notificationEvents.userId,
      metadata: notificationEvents.metadata,
      publishAt: notificationEvents.publishAt,
      expiresAt: notificationEvents.expiresAt,
      createdAt: notificationEvents.createdAt,
      readAt: notificationReads.readAt,
    })
    .from(notificationEvents)
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.eventId, notificationEvents.id),
        eq(notificationReads.userId, actor.id),
      ),
    )
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
    .orderBy(desc(notificationEvents.createdAt))
    .limit(query.limit);

  return {
    notifications: rows.map((row) => ({
      ...row,
      read: Boolean(row.readAt),
      readAt: row.readAt?.toISOString() ?? null,
      publishAt: row.publishAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    unreadCount: rows.filter((row) => !row.readAt).length,
  };
}

export async function createLocalAnnouncement(
  request: Request,
  input: z.infer<typeof createAnnouncementSchema>,
) {
  const actor = await getAuthenticatedUser(request);
  await requireLocalAnnouncementWrite(request, actor.role);

  const now = new Date();
  const publishAt = parseOptionalDate(input.publishAt);
  const expiresAt = parseOptionalDate(input.expiresAt);
  const status: NotificationStatus = publishAt && publishAt > now ? "scheduled" : "published";

  const [row] = await db
    .insert(notificationEvents)
    .values({
      id: randomUUID(),
      audience: input.audience,
      category: input.category,
      channel: "in_app",
      status,
      source: "announcement",
      title: input.title,
      body: input.body,
      metadata: {
        createdByUserId: actor.id,
        createdByRole: actor.role,
      },
      publishAt,
      expiresAt,
    })
    .returning();

  return {
    notification: {
      ...row,
      read: false,
      readAt: null,
      publishAt: row.publishAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export async function markNotificationRead(
  request: Request,
  notificationId: string,
  input: z.infer<typeof notificationReadPatchSchema>,
) {
  const actor = await getAuthenticatedUser(request);
  const guardianIds = actor.role === "parent" ? await getGuardianIdsForUser(actor.id) : [];
  const [event] = await db
    .select({
      id: notificationEvents.id,
      audience: notificationEvents.audience,
      userId: notificationEvents.userId,
      guardianId: notificationEvents.guardianId,
      status: notificationEvents.status,
      publishAt: notificationEvents.publishAt,
      expiresAt: notificationEvents.expiresAt,
    })
    .from(notificationEvents)
    .where(eq(notificationEvents.id, notificationId))
    .limit(1);

  if (!event) throw new HttpError("Notification not found", 404);
  if (!canReadNotificationEvent({ userId: actor.id, role: actor.role, guardianIds }, event)) {
    throw new HttpError("Notification not found", 404);
  }
  if (!isNotificationVisibleNow(event)) {
    throw new HttpError("Notification not found", 404);
  }

  if (input.read) {
    const [row] = await db
      .insert(notificationReads)
      .values({ eventId: notificationId, userId: actor.id, readAt: new Date() })
      .onConflictDoUpdate({
        target: [notificationReads.eventId, notificationReads.userId],
        set: { readAt: new Date() },
      })
      .returning();
    return { read: true, readAt: row.readAt.toISOString() };
  }

  await db
    .delete(notificationReads)
    .where(
      and(eq(notificationReads.eventId, notificationId), eq(notificationReads.userId, actor.id)),
    );
  return { read: false, readAt: null };
}

async function getAuthenticatedUser(request: Request) {
  const actor = await getRequestUser(request);
  if (!actor) throw new HttpError("Authentication required", 401);
  return actor;
}

export async function getGuardianIdsForUser(userId: string) {
  const rows = await db
    .select({ id: guardians.id })
    .from(guardians)
    .where(eq(guardians.userId, userId));
  return rows.map((row) => row.id);
}

function visibilityCondition(
  userId: string,
  audience: NotificationAudience,
  guardianIds: string[],
) {
  if (audience === "staff") return undefined;
  const clauses: SQL[] = [
    eq(notificationEvents.userId, userId),
    and(isNull(notificationEvents.userId), isNull(notificationEvents.guardianId))!,
  ];
  if (guardianIds.length > 0) clauses.push(inArray(notificationEvents.guardianId, guardianIds));
  return and(eq(notificationEvents.audience, "parent"), or(...clauses));
}

async function requireLocalAnnouncementWrite(request: Request, role: UserRole) {
  if (role === "parent") throw new HttpError("You do not have permission for this action", 403);
  if (role === "super_admin" || role === "admin" || role === "principal") return;
  await requirePermission(request, "settings_website", "edit");
}

function parseOptionalDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function compactSql(items: Array<SQL | undefined>) {
  return items.filter((item): item is SQL => Boolean(item));
}
