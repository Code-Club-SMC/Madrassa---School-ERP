import { relations } from "drizzle-orm";
import { boolean, date, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { user } from "@/db/schema/auth";
import { examSubjects } from "@/db/schema/exams";

export type TeacherSystem = "school" | "madrassa";
export type TeacherSystemScope = TeacherSystem | "both" | "all" | "qasmia-both" | "qasmia-madrassa" | "qasmia-school" | "zainab-both" | "zainab-madrassa" | "zainab-school";
export type TeacherEmploymentStatus = "active" | "inactive";
export type TeacherPaymentMethod = "cash" | "bank";

export const teacherProfiles = pgTable(
  "teacher_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    systemScope: text("system_scope").$type<TeacherSystemScope>().default("both").notNull(),
    gender: text("gender"),
    designation: text("designation").notNull(),
    qualification: text("qualification"),
    qualificationUrdu: text("qualification_urdu"),
    address: text("address"),
    joinedAt: date("joined_at", { mode: "string" }).notNull(),
    employmentStatus: text("employment_status").$type<TeacherEmploymentStatus>().default("active").notNull(),
    baseMonthlySalaryPaisa: integer("base_monthly_salary_paisa").default(0).notNull(),
    bankName: text("bank_name"),
    bankAccount: text("bank_account"),
    paymentMethod: text("payment_method").$type<TeacherPaymentMethod>().default("cash").notNull(),
    salaryEffectiveDate: date("salary_effective_date", { mode: "string" }),
    salaryNotes: text("salary_notes"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("teacher_profiles_user_idx").on(table.userId),
    index("teacher_profiles_status_idx").on(table.employmentStatus),
    index("teacher_profiles_system_scope_idx").on(table.systemScope),
  ],
);

export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: text("id").primaryKey(),
    teacherProfileId: text("teacher_profile_id")
      .notNull()
      .references(() => teacherProfiles.id, { onDelete: "cascade" }),
    system: text("system").$type<TeacherSystem>().notNull(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    schoolSectionId: text("school_section_id").references(() => schoolClassSections.id, { onDelete: "restrict" }),
    madrassaCategoryId: text("madrassa_category_id").references(() => madrassaCategories.id, {
      onDelete: "restrict",
    }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, {
      onDelete: "restrict",
    }),
    subjectId: text("subject_id").references(() => examSubjects.id, { onDelete: "restrict" }),
    academicYear: text("academic_year").notNull(),
    effectiveFrom: date("effective_from", { mode: "string" }),
    effectiveTo: date("effective_to", { mode: "string" }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("teacher_assignments_teacher_idx").on(table.teacherProfileId),
    index("teacher_assignments_system_idx").on(table.system),
    index("teacher_assignments_school_idx").on(table.schoolClassId, table.schoolSectionId),
    index("teacher_assignments_madrassa_idx").on(table.madrassaCategoryId, table.madrassaSubcategoryId),
    index("teacher_assignments_subject_idx").on(table.subjectId),
    index("teacher_assignments_active_idx").on(table.active),
  ],
);

export const teacherTimetablePeriods = pgTable(
  "teacher_timetable_periods",
  {
    id: text("id").primaryKey(),
    teacherProfileId: text("teacher_profile_id")
      .notNull()
      .references(() => teacherProfiles.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(() => teacherAssignments.id, { onDelete: "set null" }),
    system: text("system").$type<TeacherSystem>().notNull(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    schoolSectionId: text("school_section_id").references(() => schoolClassSections.id, { onDelete: "restrict" }),
    madrassaCategoryId: text("madrassa_category_id").references(() => madrassaCategories.id, {
      onDelete: "restrict",
    }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, {
      onDelete: "restrict",
    }),
    subjectId: text("subject_id").references(() => examSubjects.id, { onDelete: "restrict" }),
    academicYear: text("academic_year").notNull(),
    weekday: integer("weekday").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    room: text("room"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("teacher_timetable_teacher_idx").on(table.teacherProfileId),
    index("teacher_timetable_assignment_idx").on(table.assignmentId),
    index("teacher_timetable_weekday_idx").on(table.weekday),
    index("teacher_timetable_school_idx").on(table.schoolClassId, table.schoolSectionId),
    index("teacher_timetable_madrassa_idx").on(table.madrassaCategoryId, table.madrassaSubcategoryId),
    index("teacher_timetable_active_idx").on(table.active),
  ],
);

export const teacherProfilesRelations = relations(teacherProfiles, ({ one, many }) => ({
  user: one(user, { fields: [teacherProfiles.userId], references: [user.id] }),
  assignments: many(teacherAssignments),
  timetablePeriods: many(teacherTimetablePeriods),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({ one, many }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [teacherAssignments.teacherProfileId],
    references: [teacherProfiles.id],
  }),
  institution: one(institutions, { fields: [teacherAssignments.institutionId], references: [institutions.id] }),
  program: one(programs, { fields: [teacherAssignments.programId], references: [programs.id] }),
  schoolClass: one(schoolClasses, { fields: [teacherAssignments.schoolClassId], references: [schoolClasses.id] }),
  schoolSection: one(schoolClassSections, {
    fields: [teacherAssignments.schoolSectionId],
    references: [schoolClassSections.id],
  }),
  madrassaCategory: one(madrassaCategories, {
    fields: [teacherAssignments.madrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [teacherAssignments.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  subject: one(examSubjects, { fields: [teacherAssignments.subjectId], references: [examSubjects.id] }),
  timetablePeriods: many(teacherTimetablePeriods),
}));

export const teacherTimetablePeriodsRelations = relations(teacherTimetablePeriods, ({ one }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [teacherTimetablePeriods.teacherProfileId],
    references: [teacherProfiles.id],
  }),
  assignment: one(teacherAssignments, {
    fields: [teacherTimetablePeriods.assignmentId],
    references: [teacherAssignments.id],
  }),
  institution: one(institutions, { fields: [teacherTimetablePeriods.institutionId], references: [institutions.id] }),
  program: one(programs, { fields: [teacherTimetablePeriods.programId], references: [programs.id] }),
  schoolClass: one(schoolClasses, {
    fields: [teacherTimetablePeriods.schoolClassId],
    references: [schoolClasses.id],
  }),
  schoolSection: one(schoolClassSections, {
    fields: [teacherTimetablePeriods.schoolSectionId],
    references: [schoolClassSections.id],
  }),
  madrassaCategory: one(madrassaCategories, {
    fields: [teacherTimetablePeriods.madrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [teacherTimetablePeriods.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  subject: one(examSubjects, { fields: [teacherTimetablePeriods.subjectId], references: [examSubjects.id] }),
}));
