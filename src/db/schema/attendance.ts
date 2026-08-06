import { relations } from "drizzle-orm";
import { date, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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

export type StudentAttendanceStatus = "present" | "absent" | "late" | "leave";

export const studentAttendance = pgTable(
  "student_attendance",
  {
    id: text("id").primaryKey(),
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
    attendanceDate: date("attendance_date", { mode: "string" }).notNull(),
    status: text("status").$type<StudentAttendanceStatus>().notNull(),
    notes: text("notes"),
    markedByUserId: text("marked_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("student_attendance_student_enrollment_date_idx").on(
      table.studentId,
      table.enrollmentId,
      table.attendanceDate,
    ),
    index("student_attendance_student_idx").on(table.studentId),
    index("student_attendance_enrollment_idx").on(table.enrollmentId),
    index("student_attendance_institution_idx").on(table.institutionId),
    index("student_attendance_program_idx").on(table.programId),
    index("student_attendance_school_class_idx").on(table.schoolClassId),
    index("student_attendance_school_section_idx").on(table.schoolSectionId),
    index("student_attendance_madrassa_category_idx").on(table.madrassaCategoryId),
    index("student_attendance_madrassa_subcategory_idx").on(table.madrassaSubcategoryId),
    index("student_attendance_date_idx").on(table.attendanceDate),
    index("student_attendance_status_idx").on(table.status),
  ],
);

export const studentAttendanceRelations = relations(studentAttendance, ({ one }) => ({
  student: one(students, { fields: [studentAttendance.studentId], references: [students.id] }),
  enrollment: one(studentEnrollments, {
    fields: [studentAttendance.enrollmentId],
    references: [studentEnrollments.id],
  }),
  institution: one(institutions, { fields: [studentAttendance.institutionId], references: [institutions.id] }),
  program: one(programs, { fields: [studentAttendance.programId], references: [programs.id] }),
  schoolClass: one(schoolClasses, { fields: [studentAttendance.schoolClassId], references: [schoolClasses.id] }),
  schoolSection: one(schoolClassSections, {
    fields: [studentAttendance.schoolSectionId],
    references: [schoolClassSections.id],
  }),
  madrassaCategory: one(madrassaCategories, {
    fields: [studentAttendance.madrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [studentAttendance.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  markedBy: one(user, { fields: [studentAttendance.markedByUserId], references: [user.id] }),
}));
