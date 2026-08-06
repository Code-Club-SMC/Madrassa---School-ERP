import { relations } from "drizzle-orm";
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

export type ExamSystem = "school" | "madrassa";
export type ExamStatus = "draft" | "active" | "locked" | "published";
export type ExamType =
  | "monthly"
  | "quarterly"
  | "halfyearly"
  | "annual"
  | "sahmahi"
  | "nisfussana"
  | "salanah";
export type ExamMarkStatus = "draft" | "locked";
export type ExamAttendanceStatus = "present" | "absent" | "leave";
export type ExamResultStatus = "pass" | "fail";
export type SeatingPlanStatus = "draft" | "locked";

export const examSubjects = pgTable(
  "exam_subjects",
  {
    id: text("id").primaryKey(),
    system: text("system").$type<ExamSystem>().notNull(),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, {
      onDelete: "restrict",
    }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    group: text("group").default("general").notNull(),
    totalMarks: integer("total_marks").notNull(),
    passingMarks: integer("passing_marks").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("exam_subjects_system_code_scope_idx").on(
      table.system,
      table.code,
      table.schoolClassId,
      table.madrassaSubcategoryId,
    ),
    index("exam_subjects_system_idx").on(table.system),
    index("exam_subjects_school_class_idx").on(table.schoolClassId),
    index("exam_subjects_madrassa_subcategory_idx").on(table.madrassaSubcategoryId),
    index("exam_subjects_active_idx").on(table.active),
  ],
);

export const examSessions = pgTable(
  "exam_sessions",
  {
    id: text("id").primaryKey(),
    system: text("system").$type<ExamSystem>().notNull(),
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
    academicYear: text("academic_year").notNull(),
    type: text("type").$type<ExamType>().notNull(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    status: text("status").$type<ExamStatus>().default("draft").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at"),
    publishedByUserId: text("published_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("exam_sessions_system_idx").on(table.system),
    index("exam_sessions_institution_idx").on(table.institutionId),
    index("exam_sessions_program_idx").on(table.programId),
    index("exam_sessions_school_class_idx").on(table.schoolClassId),
    index("exam_sessions_school_section_idx").on(table.schoolSectionId),
    index("exam_sessions_madrassa_category_idx").on(table.madrassaCategoryId),
    index("exam_sessions_madrassa_subcategory_idx").on(table.madrassaSubcategoryId),
    index("exam_sessions_academic_year_idx").on(table.academicYear),
    index("exam_sessions_status_idx").on(table.status),
  ],
);

export const examSessionSubjects = pgTable(
  "exam_session_subjects",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => examSessions.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => examSubjects.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    totalMarks: integer("total_marks").notNull(),
    passingMarks: integer("passing_marks").notNull(),
    examDate: date("exam_date", { mode: "string" }),
    startTime: text("start_time"),
    endTime: text("end_time"),
    displayOrder: integer("display_order").default(0).notNull(),
    locked: boolean("locked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("exam_session_subjects_exam_subject_idx").on(table.examId, table.subjectId),
    index("exam_session_subjects_exam_idx").on(table.examId),
    index("exam_session_subjects_subject_idx").on(table.subjectId),
    index("exam_session_subjects_exam_date_idx").on(table.examDate),
  ],
);

export const examMarks = pgTable(
  "exam_marks",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => examSessions.id, { onDelete: "cascade" }),
    examSubjectId: text("exam_subject_id")
      .notNull()
      .references(() => examSessionSubjects.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => studentEnrollments.id, { onDelete: "restrict" }),
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
    attendanceStatus: text("attendance_status").$type<ExamAttendanceStatus>().default("present").notNull(),
    obtainedMarks: integer("obtained_marks"),
    status: text("status").$type<ExamMarkStatus>().default("draft").notNull(),
    notes: text("notes"),
    enteredByUserId: text("entered_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("exam_marks_subject_student_idx").on(table.examSubjectId, table.studentId, table.enrollmentId),
    index("exam_marks_exam_idx").on(table.examId),
    index("exam_marks_student_idx").on(table.studentId),
    index("exam_marks_enrollment_idx").on(table.enrollmentId),
    index("exam_marks_status_idx").on(table.status),
  ],
);

export const examResults = pgTable(
  "exam_results",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => examSessions.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => studentEnrollments.id, { onDelete: "restrict" }),
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
    obtainedMarks: integer("obtained_marks").notNull(),
    totalMarks: integer("total_marks").notNull(),
    percentageTimes100: integer("percentage_times_100").notNull(),
    grade: text("grade").notNull(),
    status: text("status").$type<ExamResultStatus>().notNull(),
    position: integer("position"),
    failedSubjects: jsonb("failed_subjects")
      .$type<Array<{ code: string; name: string; nameUrdu: string }>>()
      .default([])
      .notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    publishedAt: timestamp("published_at"),
    dmcGeneratedAt: timestamp("dmc_generated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("exam_results_exam_student_idx").on(table.examId, table.studentId, table.enrollmentId),
    index("exam_results_exam_idx").on(table.examId),
    index("exam_results_student_idx").on(table.studentId),
    index("exam_results_enrollment_idx").on(table.enrollmentId),
    index("exam_results_status_idx").on(table.status),
    index("exam_results_position_idx").on(table.position),
  ],
);

export const examHalls = pgTable(
  "exam_halls",
  {
    id: text("id").primaryKey(),
    system: text("system").$type<ExamSystem>().notNull(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu"),
    rows: integer("rows").notNull(),
    cols: integer("cols").notNull(),
    aisleEveryRow: integer("aisle_every_row").default(0).notNull(),
    aisleEveryCol: integer("aisle_every_col").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("exam_halls_system_idx").on(table.system),
    index("exam_halls_active_idx").on(table.active),
  ],
);

export const examSeatingPlans = pgTable(
  "exam_seating_plans",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => examSessions.id, { onDelete: "cascade" }),
    version: integer("version").default(1).notNull(),
    gap: integer("gap").default(1).notNull(),
    seed: text("seed").notNull(),
    status: text("status").$type<SeatingPlanStatus>().default("draft").notNull(),
    unseatedStudents: jsonb("unseated_students")
      .$type<Array<{ studentId: string; enrollmentId: string; rollNo: string }>>()
      .default([])
      .notNull(),
    violationCount: integer("violation_count").default(0).notNull(),
    generatedByUserId: text("generated_by_user_id").references(() => user.id, { onDelete: "set null" }),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
    lockedAt: timestamp("locked_at"),
    lockedByUserId: text("locked_by_user_id").references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [
    uniqueIndex("exam_seating_plans_exam_version_idx").on(table.examId, table.version),
    index("exam_seating_plans_exam_idx").on(table.examId),
    index("exam_seating_plans_status_idx").on(table.status),
  ],
);

export const examSeatAssignments = pgTable(
  "exam_seat_assignments",
  {
    id: text("id").primaryKey(),
    seatingPlanId: text("seating_plan_id")
      .notNull()
      .references(() => examSeatingPlans.id, { onDelete: "cascade" }),
    examId: text("exam_id")
      .notNull()
      .references(() => examSessions.id, { onDelete: "cascade" }),
    hallId: text("hall_id")
      .notNull()
      .references(() => examHalls.id, { onDelete: "restrict" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => studentEnrollments.id, { onDelete: "restrict" }),
    rowNo: integer("row_no").notNull(),
    colNo: integer("col_no").notNull(),
    seatLabel: text("seat_label").notNull(),
    placementLabel: text("placement_label").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("exam_seat_assignments_plan_hall_seat_idx").on(
      table.seatingPlanId,
      table.hallId,
      table.rowNo,
      table.colNo,
    ),
    uniqueIndex("exam_seat_assignments_plan_student_idx").on(
      table.seatingPlanId,
      table.studentId,
      table.enrollmentId,
    ),
    index("exam_seat_assignments_exam_idx").on(table.examId),
    index("exam_seat_assignments_hall_idx").on(table.hallId),
    index("exam_seat_assignments_student_idx").on(table.studentId),
  ],
);

export const examSubjectRelations = relations(examSubjects, ({ one, many }) => ({
  schoolClass: one(schoolClasses, { fields: [examSubjects.schoolClassId], references: [schoolClasses.id] }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [examSubjects.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  sessionSubjects: many(examSessionSubjects),
}));

export const examSessionRelations = relations(examSessions, ({ one, many }) => ({
  institution: one(institutions, { fields: [examSessions.institutionId], references: [institutions.id] }),
  program: one(programs, { fields: [examSessions.programId], references: [programs.id] }),
  schoolClass: one(schoolClasses, { fields: [examSessions.schoolClassId], references: [schoolClasses.id] }),
  schoolSection: one(schoolClassSections, {
    fields: [examSessions.schoolSectionId],
    references: [schoolClassSections.id],
  }),
  madrassaCategory: one(madrassaCategories, {
    fields: [examSessions.madrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [examSessions.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  createdBy: one(user, { fields: [examSessions.createdByUserId], references: [user.id] }),
  publishedBy: one(user, { fields: [examSessions.publishedByUserId], references: [user.id] }),
  subjects: many(examSessionSubjects),
  marks: many(examMarks),
  results: many(examResults),
  seatingPlans: many(examSeatingPlans),
}));

export const examSessionSubjectRelations = relations(examSessionSubjects, ({ one, many }) => ({
  exam: one(examSessions, { fields: [examSessionSubjects.examId], references: [examSessions.id] }),
  subject: one(examSubjects, { fields: [examSessionSubjects.subjectId], references: [examSubjects.id] }),
  marks: many(examMarks),
}));

export const examMarkRelations = relations(examMarks, ({ one }) => ({
  exam: one(examSessions, { fields: [examMarks.examId], references: [examSessions.id] }),
  examSubject: one(examSessionSubjects, {
    fields: [examMarks.examSubjectId],
    references: [examSessionSubjects.id],
  }),
  student: one(students, { fields: [examMarks.studentId], references: [students.id] }),
  enrollment: one(studentEnrollments, { fields: [examMarks.enrollmentId], references: [studentEnrollments.id] }),
  institution: one(institutions, { fields: [examMarks.institutionId], references: [institutions.id] }),
  program: one(programs, { fields: [examMarks.programId], references: [programs.id] }),
  schoolClass: one(schoolClasses, { fields: [examMarks.schoolClassId], references: [schoolClasses.id] }),
  schoolSection: one(schoolClassSections, {
    fields: [examMarks.schoolSectionId],
    references: [schoolClassSections.id],
  }),
  madrassaCategory: one(madrassaCategories, {
    fields: [examMarks.madrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [examMarks.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  enteredBy: one(user, { fields: [examMarks.enteredByUserId], references: [user.id] }),
}));

export const examResultRelations = relations(examResults, ({ one }) => ({
  exam: one(examSessions, { fields: [examResults.examId], references: [examSessions.id] }),
  student: one(students, { fields: [examResults.studentId], references: [students.id] }),
  enrollment: one(studentEnrollments, { fields: [examResults.enrollmentId], references: [studentEnrollments.id] }),
  institution: one(institutions, { fields: [examResults.institutionId], references: [institutions.id] }),
  program: one(programs, { fields: [examResults.programId], references: [programs.id] }),
  schoolClass: one(schoolClasses, { fields: [examResults.schoolClassId], references: [schoolClasses.id] }),
  schoolSection: one(schoolClassSections, {
    fields: [examResults.schoolSectionId],
    references: [schoolClassSections.id],
  }),
  madrassaCategory: one(madrassaCategories, {
    fields: [examResults.madrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [examResults.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
}));

export const examHallRelations = relations(examHalls, ({ many }) => ({
  assignments: many(examSeatAssignments),
}));

export const examSeatingPlanRelations = relations(examSeatingPlans, ({ one, many }) => ({
  exam: one(examSessions, { fields: [examSeatingPlans.examId], references: [examSessions.id] }),
  generatedBy: one(user, { fields: [examSeatingPlans.generatedByUserId], references: [user.id] }),
  lockedBy: one(user, { fields: [examSeatingPlans.lockedByUserId], references: [user.id] }),
  assignments: many(examSeatAssignments),
}));

export const examSeatAssignmentRelations = relations(examSeatAssignments, ({ one }) => ({
  seatingPlan: one(examSeatingPlans, {
    fields: [examSeatAssignments.seatingPlanId],
    references: [examSeatingPlans.id],
  }),
  exam: one(examSessions, { fields: [examSeatAssignments.examId], references: [examSessions.id] }),
  hall: one(examHalls, { fields: [examSeatAssignments.hallId], references: [examHalls.id] }),
  student: one(students, { fields: [examSeatAssignments.studentId], references: [students.id] }),
  enrollment: one(studentEnrollments, {
    fields: [examSeatAssignments.enrollmentId],
    references: [studentEnrollments.id],
  }),
}));
