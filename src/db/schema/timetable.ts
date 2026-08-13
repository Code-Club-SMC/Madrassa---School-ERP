import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { examSubjects, examSubjectRelations } from "@/db/schema/exams";
import { madrassaSubcategories, madrassaSubcategoryRelations } from "@/db/schema/academic";

export const madrassaTimetablePeriods = pgTable(
  "madrassa_timetable_periods",
  {
    id: text("id").primaryKey(),
    madrassaSubcategoryId: text("madrassa_subcategory_id")
      .notNull()
      .references(() => madrassaSubcategories.id, { onDelete: "cascade" }),
    timeStart: text("time_start").notNull(),
    timeEnd: text("time_end").notNull(),
    label: text("label").notNull(),
    labelUrdu: text("label_urdu").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isBreak: boolean("is_break").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("madrassa_timetable_periods_subcategory_idx").on(table.madrassaSubcategoryId),
    index("madrassa_timetable_periods_display_order_idx").on(table.displayOrder),
  ],
);

export const madrassaTimetableSlots = pgTable(
  "madrassa_timetable_slots",
  {
    id: text("id").primaryKey(),
    periodId: text("period_id")
      .notNull()
      .references(() => madrassaTimetablePeriods.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    subjectId: text("subject_id").references(() => examSubjects.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("madrassa_timetable_slots_period_day_idx").on(table.periodId, table.dayOfWeek),
    index("madrassa_timetable_slots_period_idx").on(table.periodId),
    index("madrassa_timetable_slots_subject_idx").on(table.subjectId),
  ],
);

export const madrassaTimetablePeriodRelations = relations(madrassaTimetablePeriods, ({ one, many }) => ({
  subcategory: one(madrassaSubcategories, {
    fields: [madrassaTimetablePeriods.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  slots: many(madrassaTimetableSlots),
}));

export const madrassaTimetableSlotRelations = relations(madrassaTimetableSlots, ({ one }) => ({
  period: one(madrassaTimetablePeriods, {
    fields: [madrassaTimetableSlots.periodId],
    references: [madrassaTimetablePeriods.id],
  }),
  subject: one(examSubjects, {
    fields: [madrassaTimetableSlots.subjectId],
    references: [examSubjects.id],
  }),
}));
