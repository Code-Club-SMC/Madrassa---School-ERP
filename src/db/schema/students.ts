import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { academicYears } from "@/db/schema/academic-years";
import {
  institutions,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";

export const students = pgTable(
  "students",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    fatherName: text("father_name").notNull(),
    fatherNameUrdu: text("father_name_urdu"),
    gender: text("gender").notNull(),
    dob: timestamp("dob"),
    cnicBForm: text("cnic_b_form"),
    status: text("status").default("active").notNull(),
    photoPath: text("photo_path"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("students_name_idx").on(table.name),
    index("students_name_urdu_idx").on(table.nameUrdu),
    index("students_father_name_idx").on(table.fatherName),
    index("students_status_idx").on(table.status),
    index("students_cnic_b_form_idx").on(table.cnicBForm),
  ],
);

export const guardians = pgTable(
  "guardians",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu"),
    cnic: text("cnic"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("guardians_cnic_unique_idx").on(table.cnic),
    index("guardians_phone_idx").on(table.phone),
    index("guardians_email_idx").on(table.email),
    index("guardians_user_idx").on(table.userId),
  ],
);

export const studentEnrollments = pgTable(
  "student_enrollments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id").references(() => academicYears.id, {
      onDelete: "restrict",
    }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, {
      onDelete: "restrict",
    }),
    schoolSectionId: text("school_section_id").references(() => schoolClassSections.id, {
      onDelete: "restrict",
    }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(
      () => madrassaSubcategories.id,
      {
        onDelete: "restrict",
      },
    ),
    darja: text("darja"),
    admissionNo: text("admission_no").notNull(),
    rollNo: text("roll_no").notNull(),
    status: text("status").default("active").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("student_enrollments_admission_no_idx").on(table.admissionNo),
    uniqueIndex("student_enrollments_roll_no_idx").on(table.rollNo),
    index("student_enrollments_student_idx").on(table.studentId),
    index("student_enrollments_institution_idx").on(table.institutionId),
    index("student_enrollments_program_idx").on(table.programId),
    index("student_enrollments_academic_year_idx").on(table.academicYearId),
    index("student_enrollments_student_academic_year_idx").on(
      table.studentId,
      table.academicYearId,
    ),
    index("student_enrollments_status_idx").on(table.status),
  ],
);

export const studentGuardians = pgTable(
  "student_guardians",
  {
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "cascade" }),
    relation: text("relation").notNull(),
    isPrimary: boolean("is_primary").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.studentId, table.guardianId] }),
    index("student_guardians_guardian_idx").on(table.guardianId),
  ],
);

export const studentSiblings = pgTable(
  "student_siblings",
  {
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    siblingId: text("sibling_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    confirmedBy: text("confirmed_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.studentId, table.siblingId] }),
    index("student_siblings_sibling_idx").on(table.siblingId),
  ],
);

export const studentEvents = pgTable(
  "student_events",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    enrollmentId: text("enrollment_id").references(() => studentEnrollments.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    message: text("message"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("student_events_student_idx").on(table.studentId),
    index("student_events_enrollment_idx").on(table.enrollmentId),
    index("student_events_type_idx").on(table.type),
    index("student_events_created_idx").on(table.createdAt),
  ],
);

export const studentRelations = relations(students, ({ many }) => ({
  enrollments: many(studentEnrollments),
  guardians: many(studentGuardians),
  siblingLinks: many(studentSiblings, { relationName: "studentSiblingLinks" }),
  linkedAsSibling: many(studentSiblings, { relationName: "linkedAsSibling" }),
  events: many(studentEvents),
}));

export const guardianRelations = relations(guardians, ({ one, many }) => ({
  user: one(user, {
    fields: [guardians.userId],
    references: [user.id],
  }),
  students: many(studentGuardians),
}));

export const studentEnrollmentRelations = relations(studentEnrollments, ({ one }) => ({
  student: one(students, {
    fields: [studentEnrollments.studentId],
    references: [students.id],
  }),
  institution: one(institutions, {
    fields: [studentEnrollments.institutionId],
    references: [institutions.id],
  }),
  program: one(programs, {
    fields: [studentEnrollments.programId],
    references: [programs.id],
  }),
  academicYear: one(academicYears, {
    fields: [studentEnrollments.academicYearId],
    references: [academicYears.id],
  }),
  schoolClass: one(schoolClasses, {
    fields: [studentEnrollments.schoolClassId],
    references: [schoolClasses.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [studentEnrollments.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
}));

export const studentGuardianRelations = relations(studentGuardians, ({ one }) => ({
  student: one(students, {
    fields: [studentGuardians.studentId],
    references: [students.id],
  }),
  guardian: one(guardians, {
    fields: [studentGuardians.guardianId],
    references: [guardians.id],
  }),
}));

export const studentSiblingRelations = relations(studentSiblings, ({ one }) => ({
  student: one(students, {
    fields: [studentSiblings.studentId],
    references: [students.id],
    relationName: "studentSiblingLinks",
  }),
  sibling: one(students, {
    fields: [studentSiblings.siblingId],
    references: [students.id],
    relationName: "linkedAsSibling",
  }),
}));

export const studentEventRelations = relations(studentEvents, ({ one }) => ({
  student: one(students, {
    fields: [studentEvents.studentId],
    references: [students.id],
  }),
  enrollment: one(studentEnrollments, {
    fields: [studentEvents.enrollmentId],
    references: [studentEnrollments.id],
  }),
  actor: one(user, {
    fields: [studentEvents.actorUserId],
    references: [user.id],
  }),
}));
