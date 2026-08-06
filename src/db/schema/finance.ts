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
import { studentEnrollments, students } from "@/db/schema/students";

export type FeeChargeType = "monthly" | "admission" | "exam" | "transport" | "custom";
export type FeeChargeStatus = "open" | "partial" | "paid" | "waived" | "reversed";
export type FeePaymentMethod = "cash" | "bank" | "online" | "cheque" | "other";
export type FeePaymentStatus = "posted" | "partially_refunded" | "refunded" | "reversed";
export type FeeAdjustmentType =
  | "concession"
  | "waiver"
  | "correction"
  | "charge_reversal"
  | "payment_reversal"
  | "refund";

export const feeCharges = pgTable(
  "fee_charges",
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
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, {
      onDelete: "restrict",
    }),
    type: text("type").$type<FeeChargeType>().notNull(),
    label: text("label").notNull(),
    period: text("period"),
    amountPaisa: integer("amount_paisa").notNull(),
    dueDate: timestamp("due_date"),
    status: text("status").$type<FeeChargeStatus>().default("open").notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    reversedAt: timestamp("reversed_at"),
    reversedByUserId: text("reversed_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("fee_charges_student_idx").on(table.studentId),
    index("fee_charges_enrollment_idx").on(table.enrollmentId),
    index("fee_charges_institution_idx").on(table.institutionId),
    index("fee_charges_program_idx").on(table.programId),
    index("fee_charges_status_idx").on(table.status),
    index("fee_charges_due_date_idx").on(table.dueDate),
  ],
);

export const feePayments = pgTable(
  "fee_payments",
  {
    id: text("id").primaryKey(),
    receiptNo: text("receipt_no").notNull().unique(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => studentEnrollments.id, { onDelete: "restrict" }),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    amountPaisa: integer("amount_paisa").notNull(),
    method: text("method").$type<FeePaymentMethod>().notNull(),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    receivedByUserId: text("received_by_user_id").references(() => user.id, { onDelete: "set null" }),
    payerName: text("payer_name"),
    payerPhone: text("payer_phone"),
    status: text("status").$type<FeePaymentStatus>().default("posted").notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    reversedAt: timestamp("reversed_at"),
    reversedByUserId: text("reversed_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("fee_payments_student_idx").on(table.studentId),
    index("fee_payments_enrollment_idx").on(table.enrollmentId),
    index("fee_payments_institution_idx").on(table.institutionId),
    index("fee_payments_received_idx").on(table.receivedAt),
    index("fee_payments_status_idx").on(table.status),
  ],
);

export const feePaymentAllocations = pgTable(
  "fee_payment_allocations",
  {
    id: text("id").primaryKey(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => feePayments.id, { onDelete: "restrict" }),
    chargeId: text("charge_id")
      .notNull()
      .references(() => feeCharges.id, { onDelete: "restrict" }),
    amountPaisa: integer("amount_paisa").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("fee_allocations_payment_idx").on(table.paymentId),
    index("fee_allocations_charge_idx").on(table.chargeId),
    uniqueIndex("fee_allocations_payment_charge_idx").on(table.paymentId, table.chargeId),
  ],
);

export const feeAdjustments = pgTable(
  "fee_adjustments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => studentEnrollments.id, { onDelete: "restrict" }),
    chargeId: text("charge_id").references(() => feeCharges.id, { onDelete: "restrict" }),
    paymentId: text("payment_id").references(() => feePayments.id, { onDelete: "restrict" }),
    type: text("type").$type<FeeAdjustmentType>().notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    method: text("method").$type<FeePaymentMethod>(),
    reason: text("reason").notNull(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("fee_adjustments_student_idx").on(table.studentId),
    index("fee_adjustments_enrollment_idx").on(table.enrollmentId),
    index("fee_adjustments_charge_idx").on(table.chargeId),
    index("fee_adjustments_payment_idx").on(table.paymentId),
    index("fee_adjustments_type_idx").on(table.type),
    index("fee_adjustments_created_idx").on(table.createdAt),
  ],
);

export const financeNumberSequences = pgTable(
  "finance_number_sequences",
  {
    id: text("id").primaryKey(),
    year: integer("year").notNull(),
    type: text("type").notNull(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    prefix: text("prefix").notNull(),
    currentValue: integer("current_value").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("finance_number_sequences_scope_idx").on(table.year, table.type, table.institutionId)],
);

export const feeChargeRelations = relations(feeCharges, ({ one, many }) => ({
  student: one(students, { fields: [feeCharges.studentId], references: [students.id] }),
  enrollment: one(studentEnrollments, { fields: [feeCharges.enrollmentId], references: [studentEnrollments.id] }),
  institution: one(institutions, { fields: [feeCharges.institutionId], references: [institutions.id] }),
  program: one(programs, { fields: [feeCharges.programId], references: [programs.id] }),
  allocations: many(feePaymentAllocations),
  adjustments: many(feeAdjustments),
}));

export const feePaymentRelations = relations(feePayments, ({ one, many }) => ({
  student: one(students, { fields: [feePayments.studentId], references: [students.id] }),
  enrollment: one(studentEnrollments, { fields: [feePayments.enrollmentId], references: [studentEnrollments.id] }),
  institution: one(institutions, { fields: [feePayments.institutionId], references: [institutions.id] }),
  allocations: many(feePaymentAllocations),
  adjustments: many(feeAdjustments),
}));

export const feePaymentAllocationRelations = relations(feePaymentAllocations, ({ one }) => ({
  payment: one(feePayments, { fields: [feePaymentAllocations.paymentId], references: [feePayments.id] }),
  charge: one(feeCharges, { fields: [feePaymentAllocations.chargeId], references: [feeCharges.id] }),
}));

export const feeAdjustmentRelations = relations(feeAdjustments, ({ one }) => ({
  student: one(students, { fields: [feeAdjustments.studentId], references: [students.id] }),
  enrollment: one(studentEnrollments, { fields: [feeAdjustments.enrollmentId], references: [studentEnrollments.id] }),
  charge: one(feeCharges, { fields: [feeAdjustments.chargeId], references: [feeCharges.id] }),
  payment: one(feePayments, { fields: [feeAdjustments.paymentId], references: [feePayments.id] }),
  actor: one(user, { fields: [feeAdjustments.actorUserId], references: [user.id] }),
}));
