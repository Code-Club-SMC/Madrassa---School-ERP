import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { user } from "@/db/schema/auth";
import { studentEnrollments, students } from "@/db/schema/students";

export type AcademicYearStatus = "upcoming" | "active" | "locked" | "archived";
export type AcademicYearSystem = "school" | "madrassa";
export type AcademicYearCalendarType = "gregorian" | "hijri";
export type PromotionSystem = "school" | "madrassa";
export type PromotionOutcome =
  | "promote"
  | "repeat"
  | "graduate"
  | "dropout"
  | "inactive"
  | "blocked";
export type PromotionRunStatus = "draft" | "previewed" | "applied" | "failed" | "cancelled";
export type PromotionItemStatus =
  | "ready"
  | "warning"
  | "blocked"
  | "applied"
  | "failed"
  | "skipped";

export const academicYears = pgTable(
  "academic_years",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    hijriName: text("hijri_name"),
    system: text("system").$type<AcademicYearSystem>().default("school").notNull(),
    calendarType: text("calendar_type")
      .$type<AcademicYearCalendarType>()
      .default("gregorian")
      .notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    status: text("status").$type<AcademicYearStatus>().default("upcoming").notNull(),
    carryForwardEnabled: boolean("carry_forward_enabled").default(true).notNull(),
    lockedAt: timestamp("locked_at"),
    lockedByUserId: text("locked_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("academic_years_one_active_per_system_idx")
      .on(table.system, table.status)
      .where(sql`${table.status} = 'active'`),
    index("academic_years_system_idx").on(table.system),
    index("academic_years_status_idx").on(table.status),
  ],
);

export const promotionRules = pgTable(
  "promotion_rules",
  {
    id: text("id").primaryKey(),
    system: text("system").$type<PromotionSystem>().notNull(),
    institutionId: text("institution_id").references(() => institutions.id, {
      onDelete: "restrict",
    }),
    programId: text("program_id").references(() => programs.id, { onDelete: "restrict" }),
    sourceSchoolClassId: text("source_school_class_id").references(() => schoolClasses.id, {
      onDelete: "restrict",
    }),
    sourceSchoolSectionId: text("source_school_section_id").references(
      () => schoolClassSections.id,
      {
        onDelete: "restrict",
      },
    ),
    sourceMadrassaCategoryId: text("source_madrassa_category_id").references(
      () => madrassaCategories.id,
      {
        onDelete: "restrict",
      },
    ),
    sourceMadrassaSubcategoryId: text("source_madrassa_subcategory_id").references(
      () => madrassaSubcategories.id,
      {
        onDelete: "restrict",
      },
    ),
    sourceDarja: text("source_darja"),
    targetSchoolClassId: text("target_school_class_id").references(() => schoolClasses.id, {
      onDelete: "restrict",
    }),
    targetSchoolSectionId: text("target_school_section_id").references(
      () => schoolClassSections.id,
      {
        onDelete: "restrict",
      },
    ),
    targetMadrassaCategoryId: text("target_madrassa_category_id").references(
      () => madrassaCategories.id,
      {
        onDelete: "restrict",
      },
    ),
    targetMadrassaSubcategoryId: text("target_madrassa_subcategory_id").references(
      () => madrassaSubcategories.id,
      {
        onDelete: "restrict",
      },
    ),
    targetDarja: text("target_darja"),
    outcome: text("outcome").$type<PromotionOutcome>().default("promote").notNull(),
    active: boolean("active").default(true).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("promotion_rules_system_idx").on(table.system),
    index("promotion_rules_institution_idx").on(table.institutionId),
    index("promotion_rules_program_idx").on(table.programId),
    index("promotion_rules_source_school_idx").on(
      table.sourceSchoolClassId,
      table.sourceSchoolSectionId,
    ),
    index("promotion_rules_source_madrassa_idx").on(
      table.sourceMadrassaCategoryId,
      table.sourceMadrassaSubcategoryId,
      table.sourceDarja,
    ),
    index("promotion_rules_active_idx").on(table.active),
    index("promotion_rules_display_order_idx").on(table.displayOrder),
  ],
);

export const promotionRuns = pgTable(
  "promotion_runs",
  {
    id: text("id").primaryKey(),
    sourceAcademicYearId: text("source_academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    targetAcademicYearId: text("target_academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    system: text("system").$type<PromotionSystem>().notNull(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
    status: text("status").$type<PromotionRunStatus>().default("draft").notNull(),
    carryForwardFees: boolean("carry_forward_fees").default(true).notNull(),
    includeTeacherRollover: boolean("include_teacher_rollover").default(false).notNull(),
    summary: jsonb("summary").$type<Record<string, unknown>>().default({}).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    appliedAt: timestamp("applied_at"),
    appliedByUserId: text("applied_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("promotion_runs_source_year_idx").on(table.sourceAcademicYearId),
    index("promotion_runs_target_year_idx").on(table.targetAcademicYearId),
    index("promotion_runs_system_idx").on(table.system),
    index("promotion_runs_institution_idx").on(table.institutionId),
    index("promotion_runs_program_idx").on(table.programId),
    index("promotion_runs_status_idx").on(table.status),
    index("promotion_runs_created_by_idx").on(table.createdByUserId),
  ],
);

export const promotionRunItems = pgTable(
  "promotion_run_items",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => promotionRuns.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    sourceEnrollmentId: text("source_enrollment_id")
      .notNull()
      .references(() => studentEnrollments.id, { onDelete: "restrict" }),
    targetEnrollmentId: text("target_enrollment_id").references(() => studentEnrollments.id, {
      onDelete: "set null",
    }),
    outcome: text("outcome").$type<PromotionOutcome>().notNull(),
    status: text("status").$type<PromotionItemStatus>().default("ready").notNull(),
    warnings: jsonb("warnings").$type<string[]>().default([]).notNull(),
    blockers: jsonb("blockers").$type<string[]>().default([]).notNull(),
    carryForwardAmountPaisa: integer("carry_forward_amount_paisa").default(0).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("promotion_run_items_run_idx").on(table.runId),
    index("promotion_run_items_student_idx").on(table.studentId),
    index("promotion_run_items_source_enrollment_idx").on(table.sourceEnrollmentId),
    index("promotion_run_items_target_enrollment_idx").on(table.targetEnrollmentId),
    index("promotion_run_items_outcome_idx").on(table.outcome),
    index("promotion_run_items_status_idx").on(table.status),
  ],
);

export const academicYearRelations = relations(academicYears, ({ one, many }) => ({
  lockedBy: one(user, {
    fields: [academicYears.lockedByUserId],
    references: [user.id],
  }),
  sourcePromotionRuns: many(promotionRuns, { relationName: "sourceAcademicYear" }),
  targetPromotionRuns: many(promotionRuns, { relationName: "targetAcademicYear" }),
}));

export const promotionRuleRelations = relations(promotionRules, ({ one }) => ({
  institution: one(institutions, {
    fields: [promotionRules.institutionId],
    references: [institutions.id],
  }),
  program: one(programs, { fields: [promotionRules.programId], references: [programs.id] }),
  sourceSchoolClass: one(schoolClasses, {
    fields: [promotionRules.sourceSchoolClassId],
    references: [schoolClasses.id],
  }),
  sourceSchoolSection: one(schoolClassSections, {
    fields: [promotionRules.sourceSchoolSectionId],
    references: [schoolClassSections.id],
  }),
  sourceMadrassaCategory: one(madrassaCategories, {
    fields: [promotionRules.sourceMadrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  sourceMadrassaSubcategory: one(madrassaSubcategories, {
    fields: [promotionRules.sourceMadrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  targetSchoolClass: one(schoolClasses, {
    fields: [promotionRules.targetSchoolClassId],
    references: [schoolClasses.id],
  }),
  targetSchoolSection: one(schoolClassSections, {
    fields: [promotionRules.targetSchoolSectionId],
    references: [schoolClassSections.id],
  }),
  targetMadrassaCategory: one(madrassaCategories, {
    fields: [promotionRules.targetMadrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  targetMadrassaSubcategory: one(madrassaSubcategories, {
    fields: [promotionRules.targetMadrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
}));

export const promotionRunRelations = relations(promotionRuns, ({ one, many }) => ({
  sourceAcademicYear: one(academicYears, {
    fields: [promotionRuns.sourceAcademicYearId],
    references: [academicYears.id],
    relationName: "sourceAcademicYear",
  }),
  targetAcademicYear: one(academicYears, {
    fields: [promotionRuns.targetAcademicYearId],
    references: [academicYears.id],
    relationName: "targetAcademicYear",
  }),
  institution: one(institutions, {
    fields: [promotionRuns.institutionId],
    references: [institutions.id],
  }),
  program: one(programs, { fields: [promotionRuns.programId], references: [programs.id] }),
  createdBy: one(user, { fields: [promotionRuns.createdByUserId], references: [user.id] }),
  appliedBy: one(user, { fields: [promotionRuns.appliedByUserId], references: [user.id] }),
  items: many(promotionRunItems),
}));

export const promotionRunItemRelations = relations(promotionRunItems, ({ one }) => ({
  run: one(promotionRuns, { fields: [promotionRunItems.runId], references: [promotionRuns.id] }),
  student: one(students, { fields: [promotionRunItems.studentId], references: [students.id] }),
  sourceEnrollment: one(studentEnrollments, {
    fields: [promotionRunItems.sourceEnrollmentId],
    references: [studentEnrollments.id],
    relationName: "sourceEnrollment",
  }),
  targetEnrollment: one(studentEnrollments, {
    fields: [promotionRunItems.targetEnrollmentId],
    references: [studentEnrollments.id],
    relationName: "targetEnrollment",
  }),
}));
