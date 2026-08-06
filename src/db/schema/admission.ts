import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import {
  institutions,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { guardians, studentEnrollments, students } from "@/db/schema/students";

export type AdmissionFormData = Record<string, string>;

export const admissionApplications = pgTable(
  "admission_applications",
  {
    id: text("id").primaryKey(),
    refNo: text("ref_no").notNull().unique(),
    source: text("source").notNull(),
    variantKey: text("variant_key").notNull(),
    status: text("status").default("pending").notNull(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu").notNull(),
    fatherName: text("father_name").notNull(),
    fatherNameUrdu: text("father_name_urdu"),
    gender: text("gender").notNull(),
    dob: timestamp("dob"),
    cnicBForm: text("cnic_b_form"),
    guardianName: text("guardian_name").notNull(),
    guardianNameUrdu: text("guardian_name_urdu"),
    guardianPhone: text("guardian_phone"),
    guardianCnic: text("guardian_cnic"),
    guardianEmail: text("guardian_email"),
    guardianRelation: text("guardian_relation").default("father").notNull(),
    address: text("address"),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    schoolSectionId: text("school_section_id").references(() => schoolClassSections.id, { onDelete: "restrict" }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, {
      onDelete: "restrict",
    }),
    darja: text("darja"),
    formData: jsonb("form_data").$type<AdmissionFormData>().notNull(),
    photoPath: text("photo_path"),
    acceptedStudentId: text("accepted_student_id").references(() => students.id, { onDelete: "set null" }),
    acceptedEnrollmentId: text("accepted_enrollment_id").references(() => studentEnrollments.id, {
      onDelete: "set null",
    }),
    matchedGuardianId: text("matched_guardian_id").references(() => guardians.id, { onDelete: "set null" }),
    assignedToUserId: text("assigned_to_user_id").references(() => user.id, { onDelete: "set null" }),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, { onDelete: "set null" }),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("admission_applications_status_idx").on(table.status),
    index("admission_applications_variant_idx").on(table.variantKey),
    index("admission_applications_program_idx").on(table.programId),
    index("admission_applications_guardian_phone_idx").on(table.guardianPhone),
    index("admission_applications_guardian_cnic_idx").on(table.guardianCnic),
    index("admission_applications_submitted_idx").on(table.submittedAt),
  ],
);

export const admissionEvents = pgTable(
  "admission_events",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => admissionApplications.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    message: text("message"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admission_events_application_idx").on(table.applicationId),
    index("admission_events_type_idx").on(table.type),
    index("admission_events_created_idx").on(table.createdAt),
  ],
);

export const numberSequences = pgTable(
  "number_sequences",
  {
    id: text("id").primaryKey(),
    year: integer("year").notNull(),
    type: text("type").notNull(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id").references(() => programs.id, { onDelete: "restrict" }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, {
      onDelete: "restrict",
    }),
    prefix: text("prefix").notNull(),
    currentValue: integer("current_value").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("number_sequences_scope_idx").on(
      table.year,
      table.type,
      table.institutionId,
      table.programId,
      table.schoolClassId,
      table.madrassaSubcategoryId,
    ),
  ],
);

export const admissionApplicationRelations = relations(admissionApplications, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [admissionApplications.institutionId],
    references: [institutions.id],
  }),
  program: one(programs, {
    fields: [admissionApplications.programId],
    references: [programs.id],
  }),
  schoolClass: one(schoolClasses, {
    fields: [admissionApplications.schoolClassId],
    references: [schoolClasses.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [admissionApplications.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  acceptedStudent: one(students, {
    fields: [admissionApplications.acceptedStudentId],
    references: [students.id],
  }),
  acceptedEnrollment: one(studentEnrollments, {
    fields: [admissionApplications.acceptedEnrollmentId],
    references: [studentEnrollments.id],
  }),
  matchedGuardian: one(guardians, {
    fields: [admissionApplications.matchedGuardianId],
    references: [guardians.id],
  }),
  events: many(admissionEvents),
}));

export const admissionEventRelations = relations(admissionEvents, ({ one }) => ({
  application: one(admissionApplications, {
    fields: [admissionEvents.applicationId],
    references: [admissionApplications.id],
  }),
  actor: one(user, {
    fields: [admissionEvents.actorUserId],
    references: [user.id],
  }),
}));
