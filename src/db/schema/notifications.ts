import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { guardians, students } from "@/db/schema/students";

export type NotificationAudience = "staff" | "parent";
export type NotificationCategory =
  | "admission"
  | "attendance"
  | "exam"
  | "fee"
  | "guardian"
  | "student"
  | "system";
export type NotificationSource = "system" | "announcement";
export type NotificationChannel = "in_app";
export type NotificationStatus = "recorded" | "published" | "scheduled" | "archived";

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: text("id").primaryKey(),
    audience: text("audience").$type<NotificationAudience>().notNull(),
    category: text("category").$type<NotificationCategory>().notNull(),
    channel: text("channel").$type<NotificationChannel>().default("in_app").notNull(),
    status: text("status").$type<NotificationStatus>().default("recorded").notNull(),
    source: text("source").$type<NotificationSource>().default("system").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    studentId: text("student_id").references(() => students.id, { onDelete: "cascade" }),
    guardianId: text("guardian_id").references(() => guardians.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    publishAt: timestamp("publish_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("notification_events_audience_idx").on(table.audience),
    index("notification_events_category_idx").on(table.category),
    index("notification_events_status_idx").on(table.status),
    index("notification_events_source_idx").on(table.source),
    index("notification_events_student_idx").on(table.studentId),
    index("notification_events_guardian_idx").on(table.guardianId),
    index("notification_events_user_idx").on(table.userId),
    index("notification_events_publish_idx").on(table.publishAt),
    index("notification_events_expires_idx").on(table.expiresAt),
    index("notification_events_created_idx").on(table.createdAt),
  ],
);

export const notificationReads = pgTable(
  "notification_reads",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => notificationEvents.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.userId] }),
    index("notification_reads_user_idx").on(table.userId),
  ],
);

export const notificationEventRelations = relations(notificationEvents, ({ one, many }) => ({
  student: one(students, { fields: [notificationEvents.studentId], references: [students.id] }),
  guardian: one(guardians, { fields: [notificationEvents.guardianId], references: [guardians.id] }),
  user: one(user, { fields: [notificationEvents.userId], references: [user.id] }),
  reads: many(notificationReads),
}));

export const notificationReadRelations = relations(notificationReads, ({ one }) => ({
  event: one(notificationEvents, {
    fields: [notificationReads.eventId],
    references: [notificationEvents.id],
  }),
  user: one(user, {
    fields: [notificationReads.userId],
    references: [user.id],
  }),
}));
