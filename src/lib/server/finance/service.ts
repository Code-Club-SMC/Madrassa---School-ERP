import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, ilike, inArray, isNull, lte, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { user as authUser } from "@/db/schema/auth";
import {
  feeAdjustments,
  feeCharges,
  feePaymentAllocations,
  feePayments,
  type FeeChargeStatus,
  type FeeChargeType,
  type FeePaymentMethod,
  type FeePaymentStatus,
} from "@/db/schema/finance";
import { guardians, studentEnrollments, studentGuardians, students } from "@/db/schema/students";
import type { ModuleKey } from "@/lib/permissions/module-registry";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import { insertStudentEvent } from "@/lib/server/students/events";
import {
  buildChargeLedger,
  summarizeStudentLedger,
  type ChargeLedgerRow,
  type StudentLedgerSummary,
} from "./ledger";
import { nextFinanceNumber } from "./numbering";

const paymentMethods = ["cash", "bank", "online", "cheque", "other"] as const;
const chargeTypes = ["monthly", "admission", "exam", "transport", "custom"] as const;
const systems = ["school", "madrassa"] as const;

export const feeStudentListQuerySchema = z.object({
  system: z.enum(systems),
  q: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "graduated", "dropout", "transferred"]).optional(),
  institutionId: z.string().trim().optional(),
  programId: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  subcategoryId: z.string().trim().optional(),
});

export const studentLedgerQuerySchema = z.object({
  system: z.enum(systems),
});

export const createFeeChargeSchema = z.object({
  studentId: z.string().trim().min(1),
  type: z.enum(chargeTypes),
  label: z.string().trim().min(1),
  amountPaisa: z.number().int().positive(),
  dueDate: z.string().trim().optional(),
  period: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const collectFeePaymentSchema = z.object({
  studentId: z.string().trim().min(1),
  allocations: z
    .array(
      z.object({ chargeId: z.string().trim().min(1), amountPaisa: z.number().int().positive() }),
    )
    .min(1),
  method: z.enum(paymentMethods),
  receivedAt: z.string().trim().optional(),
  payerName: z.string().trim().optional(),
  payerPhone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const chargeAndCollectSchema = createFeeChargeSchema.extend({
  method: z.enum(paymentMethods),
  receivedAt: z.string().trim().optional(),
  payerName: z.string().trim().optional(),
  payerPhone: z.string().trim().optional(),
});

export const reverseChargeSchema = z.object({
  reason: z.string().trim().min(3),
});

export const reversePaymentSchema = z.object({
  reason: z.string().trim().min(3),
});

export const refundPaymentSchema = z.object({
  amountPaisa: z.number().int().positive(),
  method: z.enum(paymentMethods),
  reason: z.string().trim().min(3),
});

export const reportQuerySchema = z.object({
  system: z.enum(["both", "school", "madrassa"]).default("both"),
  institutionId: z.string().trim().optional(),
  programId: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  method: z.enum(paymentMethods).optional(),
  userId: z.string().trim().optional(),
  q: z.string().trim().optional(),
});

type FeeSystem = "school" | "madrassa";
type ReportSystem = FeeSystem | "both";
type FeeTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type FeeExecutor = typeof db | FeeTx;
type FeeCharge = typeof feeCharges.$inferSelect;
type FeePayment = typeof feePayments.$inferSelect;
type FeePaymentAllocation = typeof feePaymentAllocations.$inferSelect;
type FeeAdjustment = typeof feeAdjustments.$inferSelect;
type ReportQuery = z.infer<typeof reportQuerySchema>;

type ActiveEnrollmentContext = {
  studentId: string;
  studentName: string;
  studentNameUrdu: string;
  fatherName: string;
  enrollmentId: string;
  rollNo: string;
  admissionNo: string;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  programSystem: string;
  schoolClassId: string | null;
  schoolClassName: string | null;
  schoolClassNameUrdu: string | null;
  schoolSectionId: string | null;
  schoolSectionName: string | null;
  madrassaSubcategoryId: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  system: FeeSystem;
};

type LedgerData = {
  charges: FeeCharge[];
  payments: FeePayment[];
  allocations: FeePaymentAllocation[];
  adjustments: FeeAdjustment[];
};

type ChargeContextRow = {
  chargeId: string;
  studentId: string;
  enrollmentId: string;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programSystem: string;
  schoolClassName: string | null;
  madrassaSubcategoryName: string | null;
  rollNo: string;
  admissionNo: string;
  studentName: string;
  studentNameUrdu: string;
  fatherName: string;
  label: string;
  type: FeeChargeType;
  amountPaisa: number;
  dueDate: Date | null;
  createdAt: Date;
};

export type OpeningBalanceInput = {
  studentId: string;
  enrollmentId: string;
  institutionId: string;
  programId: string;
  amountPaisa: number;
  sourceEnrollmentId: string;
  academicYearName: string;
  actorUserId: string;
  schoolClassId?: string | null;
  schoolSectionId?: string | null;
  madrassaSubcategoryId?: string | null;
};

const emptySummary: StudentLedgerSummary = {
  totalChargedPaisa: 0,
  totalConcessionPaisa: 0,
  totalPaidPaisa: 0,
  totalRefundedPaisa: 0,
  totalReversedPaisa: 0,
  outstandingPaisa: 0,
};

function feeModuleForSystem(system: FeeSystem): ModuleKey {
  return system === "madrassa" ? "madrassa_fees" : "school_fees";
}

async function requireFinanceReportPermission(request: Request) {
  return requirePermission(request, "finance", "view");
}

async function getActiveEnrollmentContext(studentId: string): Promise<ActiveEnrollmentContext> {
  const [row] = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      enrollmentId: studentEnrollments.id,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      institutionId: studentEnrollments.institutionId,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programId: studentEnrollments.programId,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      programSystem: programs.system,
      schoolClassId: studentEnrollments.schoolClassId,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      schoolSectionId: studentEnrollments.schoolSectionId,
      schoolSectionName: schoolClassSections.name,
      madrassaSubcategoryId: studentEnrollments.madrassaSubcategoryId,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      guardianName: guardians.name,
      guardianPhone: guardians.phone,
    })
    .from(students)
    .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
    )
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .leftJoin(
      studentGuardians,
      and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true)),
    )
    .leftJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
    .where(
      and(
        eq(students.id, studentId),
        isNull(studentEnrollments.endedAt),
        eq(studentEnrollments.status, "active"),
      ),
    )
    .orderBy(desc(studentEnrollments.startedAt))
    .limit(1);

  if (!row) throw new HttpError("Active student enrollment not found", 404);

  const system: FeeSystem = row.programSystem === "madrassa" ? "madrassa" : "school";
  return { ...row, system };
}

function assertSystemMatches(expected: FeeSystem, actual: FeeSystem) {
  if (expected !== actual) {
    throw new HttpError("Student does not belong to this fee system", 400);
  }
}

function parseOptionalDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new HttpError("Invalid date", 400);
  return date;
}

export async function createFeeCharge(
  request: Request,
  input: z.infer<typeof createFeeChargeSchema>,
) {
  const context = await getActiveEnrollmentContext(input.studentId);
  const actor = await requirePermission(request, feeModuleForSystem(context.system), "create");

  return db.transaction(async (tx) => {
    const [charge] = await tx
      .insert(feeCharges)
      .values({
        id: randomUUID(),
        studentId: context.studentId,
        enrollmentId: context.enrollmentId,
        institutionId: context.institutionId,
        programId: context.programId,
        schoolClassId: context.schoolClassId,
        schoolSectionId: context.schoolSectionId,
        madrassaSubcategoryId: context.madrassaSubcategoryId,
        type: input.type as FeeChargeType,
        label: input.label,
        period: input.period || null,
        amountPaisa: input.amountPaisa,
        dueDate: parseOptionalDate(input.dueDate),
        status: "open",
        notes: input.notes || null,
        createdByUserId: actor.id,
      })
      .returning();

    await insertStudentEvent(tx, {
      studentId: context.studentId,
      enrollmentId: context.enrollmentId,
      type: "fee_charge_created",
      message: `Fee charge created: ${input.label}`,
      metadata: { chargeId: charge.id, amountPaisa: charge.amountPaisa, type: charge.type },
      actorUserId: actor.id,
    });

    return { charge: serializeCharge(charge) };
  });
}

export async function collectFeePayment(
  request: Request,
  input: z.infer<typeof collectFeePaymentSchema>,
) {
  const context = await getActiveEnrollmentContext(input.studentId);
  const actor = await requirePermission(request, feeModuleForSystem(context.system), "create");

  return db.transaction(async (tx) => {
    const chargeIds = uniqueStrings(input.allocations.map((item) => item.chargeId));
    if (chargeIds.length !== input.allocations.length) {
      throw new HttpError("A charge can only be allocated once per payment", 400);
    }

    const ledgerData = await loadLedgerDataForChargeIds(tx, chargeIds);
    if (ledgerData.charges.length !== chargeIds.length)
      throw new HttpError("One or more charges were not found", 404);
    if (ledgerData.charges.some((charge) => charge.studentId !== context.studentId)) {
      throw new HttpError("All charges must belong to the selected student", 400);
    }
    if (ledgerData.charges.some((charge) => charge.status === "reversed")) {
      throw new HttpError("Cannot collect payment against reversed charges", 400);
    }

    const ledgerRows = buildChargeLedger(ledgerData);
    const balanceByCharge = new Map(ledgerRows.map((row) => [row.chargeId, row.balancePaisa]));

    for (const allocation of input.allocations) {
      const balance = balanceByCharge.get(allocation.chargeId) ?? 0;
      if (allocation.amountPaisa > balance)
        throw new HttpError("Payment cannot exceed outstanding charge balance", 400);
    }

    const amountPaisa = input.allocations.reduce(
      (sum, allocation) => sum + allocation.amountPaisa,
      0,
    );
    const receiptNo = await nextFinanceNumber(tx, {
      type: "fee_receipt",
      institutionId: context.institutionId,
      prefix: "FR",
    });
    const [payment] = await tx
      .insert(feePayments)
      .values({
        id: randomUUID(),
        receiptNo,
        studentId: context.studentId,
        enrollmentId: context.enrollmentId,
        institutionId: context.institutionId,
        amountPaisa,
        method: input.method as FeePaymentMethod,
        receivedAt: parseReceivedAt(input.receivedAt),
        receivedByUserId: actor.id,
        payerName: input.payerName || null,
        payerPhone: input.payerPhone || null,
        notes: input.notes || null,
      })
      .returning();

    const allocations = input.allocations.map((allocation) => ({
      id: randomUUID(),
      paymentId: payment.id,
      chargeId: allocation.chargeId,
      amountPaisa: allocation.amountPaisa,
      createdAt: new Date(),
    }));

    await tx.insert(feePaymentAllocations).values(allocations);
    await refreshChargeStatuses(tx, chargeIds);

    await insertStudentEvent(tx, {
      studentId: context.studentId,
      enrollmentId: context.enrollmentId,
      type: "fee_payment_recorded",
      message: `Fee payment received: ${receiptNo}`,
      metadata: { paymentId: payment.id, receiptNo, amountPaisa, method: payment.method },
      actorUserId: actor.id,
    });

    return { payment: serializePayment(payment, allocations) };
  });
}

export async function chargeAndCollect(
  request: Request,
  input: z.infer<typeof chargeAndCollectSchema>,
) {
  const context = await getActiveEnrollmentContext(input.studentId);
  const actor = await requirePermission(request, feeModuleForSystem(context.system), "create");

  return db.transaction(async (tx) => {
    const [charge] = await tx
      .insert(feeCharges)
      .values({
        id: randomUUID(),
        studentId: context.studentId,
        enrollmentId: context.enrollmentId,
        institutionId: context.institutionId,
        programId: context.programId,
        schoolClassId: context.schoolClassId,
        schoolSectionId: context.schoolSectionId,
        madrassaSubcategoryId: context.madrassaSubcategoryId,
        type: input.type as FeeChargeType,
        label: input.label,
        period: input.period || null,
        amountPaisa: input.amountPaisa,
        dueDate: parseOptionalDate(input.dueDate),
        status: "paid",
        notes: input.notes || null,
        createdByUserId: actor.id,
      })
      .returning();

    const receiptNo = await nextFinanceNumber(tx, {
      type: "fee_receipt",
      institutionId: context.institutionId,
      prefix: "FR",
    });
    const [payment] = await tx
      .insert(feePayments)
      .values({
        id: randomUUID(),
        receiptNo,
        studentId: context.studentId,
        enrollmentId: context.enrollmentId,
        institutionId: context.institutionId,
        amountPaisa: input.amountPaisa,
        method: input.method as FeePaymentMethod,
        receivedAt: parseReceivedAt(input.receivedAt),
        receivedByUserId: actor.id,
        payerName: input.payerName || null,
        payerPhone: input.payerPhone || null,
        notes: input.notes || null,
      })
      .returning();

    const allocation = {
      id: randomUUID(),
      paymentId: payment.id,
      chargeId: charge.id,
      amountPaisa: input.amountPaisa,
      createdAt: new Date(),
    };
    await tx.insert(feePaymentAllocations).values(allocation);

    await insertStudentEvent(tx, {
      studentId: context.studentId,
      enrollmentId: context.enrollmentId,
      type: "fee_charge_created",
      message: `Fee charge created: ${input.label}`,
      metadata: { chargeId: charge.id, amountPaisa: charge.amountPaisa, type: charge.type },
      actorUserId: actor.id,
    });
    await insertStudentEvent(tx, {
      studentId: context.studentId,
      enrollmentId: context.enrollmentId,
      type: "fee_payment_recorded",
      message: `Fee payment received: ${receiptNo}`,
      metadata: {
        paymentId: payment.id,
        receiptNo,
        amountPaisa: payment.amountPaisa,
        method: payment.method,
      },
      actorUserId: actor.id,
    });

    return {
      charge: serializeCharge(charge),
      payment: serializePayment(payment, [allocation]),
    };
  });
}

export async function getOutstandingBalanceByStudentIds(
  executor: FeeExecutor,
  studentIds: string[],
) {
  const ledgerData = await loadLedgerDataForStudentIds(executor, studentIds);
  const balances = new Map<string, number>();

  for (const studentId of uniqueStrings(studentIds)) {
    const summary = summarizeStudentLedger({
      charges: ledgerData.charges.filter((charge) => charge.studentId === studentId),
      payments: ledgerData.payments.filter((payment) => payment.studentId === studentId),
      allocations: ledgerData.allocations.filter((allocation) => {
        const payment = ledgerData.payments.find((item) => item.id === allocation.paymentId);
        const charge = ledgerData.charges.find((item) => item.id === allocation.chargeId);
        return payment?.studentId === studentId || charge?.studentId === studentId;
      }),
      adjustments: ledgerData.adjustments.filter(
        (adjustment) => adjustment.studentId === studentId,
      ),
    });
    balances.set(studentId, summary.outstandingPaisa);
  }

  return balances;
}

export async function createOpeningBalanceCharge(tx: FeeTx, input: OpeningBalanceInput) {
  if (input.amountPaisa <= 0) return null;

  const [charge] = await tx
    .insert(feeCharges)
    .values({
      id: randomUUID(),
      studentId: input.studentId,
      enrollmentId: input.enrollmentId,
      institutionId: input.institutionId,
      programId: input.programId,
      schoolClassId: input.schoolClassId ?? null,
      schoolSectionId: input.schoolSectionId ?? null,
      madrassaSubcategoryId: input.madrassaSubcategoryId ?? null,
      type: "custom",
      label: `Opening balance from ${input.academicYearName}`,
      period: input.academicYearName,
      amountPaisa: input.amountPaisa,
      dueDate: null,
      status: "open",
      notes: "Automatically carried forward during academic year rollover.",
      metadata: {
        source: "promotion_carry_forward",
        sourceEnrollmentId: input.sourceEnrollmentId,
        academicYearName: input.academicYearName,
      },
      createdByUserId: input.actorUserId,
    })
    .returning();

  await insertStudentEvent(tx, {
    studentId: input.studentId,
    enrollmentId: input.enrollmentId,
    type: "fee_charge_created",
    message: `Opening balance carried forward from ${input.academicYearName}`,
    metadata: {
      chargeId: charge.id,
      amountPaisa: charge.amountPaisa,
      type: charge.type,
      sourceEnrollmentId: input.sourceEnrollmentId,
    },
    actorUserId: input.actorUserId,
  });

  return charge;
}

export async function listFeeStudents(
  request: Request,
  query: z.infer<typeof feeStudentListQuerySchema>,
) {
  await requirePermission(request, feeModuleForSystem(query.system), "view");

  const clauses = compactSql([
    systemCondition(query.system),
    isNull(studentEnrollments.endedAt),
    eq(studentEnrollments.status, "active"),
    query.status ? eq(students.status, query.status) : undefined,
    query.institutionId ? eq(studentEnrollments.institutionId, query.institutionId) : undefined,
    query.programId ? eq(studentEnrollments.programId, query.programId) : undefined,
    query.classId ? eq(studentEnrollments.schoolClassId, query.classId) : undefined,
    query.subcategoryId
      ? eq(studentEnrollments.madrassaSubcategoryId, query.subcategoryId)
      : undefined,
    query.q
      ? or(
          ilike(students.name, `%${query.q}%`),
          ilike(students.nameUrdu, `%${query.q}%`),
          ilike(students.fatherName, `%${query.q}%`),
          ilike(studentEnrollments.rollNo, `%${query.q}%`),
          ilike(studentEnrollments.admissionNo, `%${query.q}%`),
          ilike(guardians.phone, `%${query.q}%`),
        )
      : undefined,
  ]);

  const rows = await db
    .select(studentSearchSelection())
    .from(students)
    .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
    )
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .leftJoin(
      studentGuardians,
      and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true)),
    )
    .leftJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
    .where(and(...clauses))
    .orderBy(desc(studentEnrollments.startedAt), desc(students.createdAt))
    .limit(50);

  const summaries = await summarizeByStudentIds(rows.map((row) => row.studentId));

  return {
    students: rows.map((row) => ({
      id: row.studentId,
      name: row.studentName,
      nameUrdu: row.studentNameUrdu,
      fatherName: row.fatherName,
      rollNo: row.rollNo,
      admissionNo: row.admissionNo,
      system: row.programSystem === "madrassa" ? "madrassa" : "school",
      institutionName: row.institutionName,
      institutionNameUrdu: row.institutionNameUrdu,
      groupLabel: groupLabelForRow(row),
      guardianName: row.guardianName,
      guardianPhone: row.guardianPhone,
      summary: summaries.get(row.studentId) ?? emptySummary,
    })),
  };
}

export async function getStudentFeeLedger(
  request: Request,
  studentId: string,
  query: z.infer<typeof studentLedgerQuerySchema>,
) {
  const context = await getActiveEnrollmentContext(studentId);
  assertSystemMatches(query.system, context.system);
  await requirePermission(request, feeModuleForSystem(query.system), "view");

  const ledgerData = await loadLedgerDataForStudentIds(db, [studentId]);
  const ledgerRows = buildChargeLedger(ledgerData);
  const ledgerByCharge = new Map(ledgerRows.map((row) => [row.chargeId, row]));
  const summary = summarizeStudentLedger(ledgerData);
  const allocationsByPayment = groupAllocationsByPayment(ledgerData.allocations);

  return {
    student: {
      id: context.studentId,
      name: context.studentName,
      nameUrdu: context.studentNameUrdu,
      fatherName: context.fatherName,
      rollNo: context.rollNo,
      admissionNo: context.admissionNo,
      system: context.system,
      institutionName: context.institutionName,
      institutionNameUrdu: context.institutionNameUrdu,
      groupLabel: groupLabelForRow(context),
      guardianName: context.guardianName,
      guardianPhone: context.guardianPhone,
      summary,
    },
    charges: ledgerData.charges
      .slice()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((charge) => ({
        ...serializeCharge(charge),
        ledger: ledgerByCharge.get(charge.id) ?? emptyChargeLedger(charge),
      })),
    payments: ledgerData.payments
      .slice()
      .sort((left, right) => right.receivedAt.getTime() - left.receivedAt.getTime())
      .map((payment) => serializePayment(payment, allocationsByPayment.get(payment.id) ?? [])),
    adjustments: ledgerData.adjustments
      .slice()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map(serializeAdjustment),
    summary,
  };
}

export async function reverseFeeCharge(
  request: Request,
  chargeId: string,
  input: z.infer<typeof reverseChargeSchema>,
) {
  return db.transaction(async (tx) => {
    const chargeContext = await getChargePermissionContext(tx, chargeId);
    const actor = await requirePermission(
      request,
      feeModuleForSystem(chargeContext.system),
      "edit",
    );

    if (chargeContext.charge.status === "reversed")
      throw new HttpError("Fee charge is already reversed", 400);

    const ledgerData = await loadLedgerDataForChargeIds(tx, [chargeId]);
    const [ledger] = buildChargeLedger(ledgerData);
    if (!ledger) throw new HttpError("Fee charge not found", 404);
    if (ledger.paidPaisa !== 0) {
      throw new HttpError("Cannot reverse a charge with posted payments", 400);
    }

    const [adjustment] = await tx
      .insert(feeAdjustments)
      .values({
        id: randomUUID(),
        studentId: chargeContext.charge.studentId,
        enrollmentId: chargeContext.charge.enrollmentId,
        chargeId: chargeContext.charge.id,
        type: "charge_reversal",
        amountPaisa: chargeContext.charge.amountPaisa,
        reason: input.reason,
        actorUserId: actor.id,
        metadata: { chargeLabel: chargeContext.charge.label },
      })
      .returning();

    const [charge] = await tx
      .update(feeCharges)
      .set({
        status: "reversed",
        reversedAt: new Date(),
        reversedByUserId: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(feeCharges.id, chargeId))
      .returning();

    await insertStudentEvent(tx, {
      studentId: charge.studentId,
      enrollmentId: charge.enrollmentId,
      type: "fee_charge_reversed",
      message: `Fee charge reversed: ${charge.label}`,
      metadata: {
        chargeId,
        adjustmentId: adjustment.id,
        amountPaisa: adjustment.amountPaisa,
        reason: input.reason,
      },
      actorUserId: actor.id,
    });

    return { charge: serializeCharge(charge), adjustment: serializeAdjustment(adjustment) };
  });
}

export async function reverseFeePayment(
  request: Request,
  paymentId: string,
  input: z.infer<typeof reversePaymentSchema>,
) {
  return db.transaction(async (tx) => {
    const paymentContext = await getPaymentPermissionContext(tx, paymentId);
    const actor = await requirePermission(
      request,
      feeModuleForSystem(paymentContext.system),
      "edit",
    );

    if (!["posted", "partially_refunded"].includes(paymentContext.payment.status)) {
      throw new HttpError("Only posted or partially refunded payments can be reversed", 400);
    }

    const previousRefunds = await sumPaymentAdjustments(tx, paymentId, "refund");
    const reversalAmountPaisa = Math.max(0, paymentContext.payment.amountPaisa - previousRefunds);

    const [adjustment] = await tx
      .insert(feeAdjustments)
      .values({
        id: randomUUID(),
        studentId: paymentContext.payment.studentId,
        enrollmentId: paymentContext.payment.enrollmentId,
        paymentId: paymentContext.payment.id,
        type: "payment_reversal",
        amountPaisa: reversalAmountPaisa,
        reason: input.reason,
        actorUserId: actor.id,
        metadata: { receiptNo: paymentContext.payment.receiptNo },
      })
      .returning();

    const [payment] = await tx
      .update(feePayments)
      .set({
        status: "reversed",
        reversedAt: new Date(),
        reversedByUserId: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(feePayments.id, paymentId))
      .returning();

    const allocations = await tx
      .select()
      .from(feePaymentAllocations)
      .where(eq(feePaymentAllocations.paymentId, paymentId));
    await refreshChargeStatuses(
      tx,
      allocations.map((allocation) => allocation.chargeId),
    );

    await insertStudentEvent(tx, {
      studentId: payment.studentId,
      enrollmentId: payment.enrollmentId,
      type: "fee_payment_reversed",
      message: `Fee payment reversed: ${payment.receiptNo}`,
      metadata: {
        paymentId,
        receiptNo: payment.receiptNo,
        adjustmentId: adjustment.id,
        amountPaisa: reversalAmountPaisa,
        reason: input.reason,
      },
      actorUserId: actor.id,
    });

    return {
      payment: serializePayment(payment, allocations),
      adjustment: serializeAdjustment(adjustment),
    };
  });
}

export async function refundFeePayment(
  request: Request,
  paymentId: string,
  input: z.infer<typeof refundPaymentSchema>,
) {
  return db.transaction(async (tx) => {
    const paymentContext = await getPaymentPermissionContext(tx, paymentId);
    const actor = await requirePermission(
      request,
      feeModuleForSystem(paymentContext.system),
      "edit",
    );

    if (paymentContext.payment.status === "reversed") {
      throw new HttpError("Cannot refund a reversed payment", 400);
    }

    const previousRefunds = await sumPaymentAdjustments(tx, paymentId, "refund");
    const refundablePaisa = paymentContext.payment.amountPaisa - previousRefunds;
    if (input.amountPaisa > refundablePaisa) {
      throw new HttpError("Refund cannot exceed remaining payment amount", 400);
    }

    const refundNo = await nextFinanceNumber(tx, {
      type: "refund_receipt",
      institutionId: paymentContext.payment.institutionId,
      prefix: "RF",
    });
    const refundedPaisa = previousRefunds + input.amountPaisa;
    const nextStatus: FeePaymentStatus =
      refundedPaisa >= paymentContext.payment.amountPaisa ? "refunded" : "partially_refunded";

    const [adjustment] = await tx
      .insert(feeAdjustments)
      .values({
        id: randomUUID(),
        studentId: paymentContext.payment.studentId,
        enrollmentId: paymentContext.payment.enrollmentId,
        paymentId: paymentContext.payment.id,
        type: "refund",
        amountPaisa: input.amountPaisa,
        method: input.method as FeePaymentMethod,
        reason: input.reason,
        actorUserId: actor.id,
        metadata: { receiptNo: paymentContext.payment.receiptNo, refundNo },
      })
      .returning();

    const [payment] = await tx
      .update(feePayments)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(feePayments.id, paymentId))
      .returning();

    const allocations = await tx
      .select()
      .from(feePaymentAllocations)
      .where(eq(feePaymentAllocations.paymentId, paymentId));
    await refreshChargeStatuses(
      tx,
      allocations.map((allocation) => allocation.chargeId),
    );

    await insertStudentEvent(tx, {
      studentId: payment.studentId,
      enrollmentId: payment.enrollmentId,
      type: "fee_refund_recorded",
      message: `Fee refund recorded: ${refundNo}`,
      metadata: {
        paymentId,
        receiptNo: payment.receiptNo,
        refundNo,
        adjustmentId: adjustment.id,
        amountPaisa: input.amountPaisa,
        method: input.method,
        reason: input.reason,
      },
      actorUserId: actor.id,
    });

    return {
      payment: serializePayment(payment, allocations),
      adjustment: serializeAdjustment(adjustment),
    };
  });
}

export async function getDailyCollectionReport(request: Request, query: ReportQuery) {
  await requireFinanceReportPermission(request);

  const payments = await fetchPaymentReportRows(query);
  const adjustments = await fetchAdjustmentReportRows(query, ["payment_reversal", "refund"]);
  const refundByPayment = sumReportAdjustmentsByPayment(adjustments, "refund");
  const reversalByPayment = sumReportAdjustmentsByPayment(adjustments, "payment_reversal");

  const rows = payments.map((payment) => {
    const refundedPaisa = refundByPayment.get(payment.id) ?? 0;
    const reversedPaisa = reversalByPayment.get(payment.id) ?? 0;
    return {
      receiptNo: payment.receiptNo,
      date: payment.receivedAt.toISOString(),
      studentId: payment.studentId,
      studentName: payment.studentName,
      studentNameUrdu: payment.studentNameUrdu,
      rollNo: payment.rollNo,
      institutionName: payment.institutionName,
      method: payment.method,
      status: payment.status,
      grossAmountPaisa: payment.amountPaisa,
      refundedPaisa,
      reversedPaisa,
      netAmountPaisa: payment.amountPaisa - refundedPaisa - reversedPaisa,
      receivedByName: payment.receivedByName,
    };
  });

  const grossCollectedPaisa = rows.reduce((sum, row) => sum + row.grossAmountPaisa, 0);
  const refundPaisa = adjustments
    .filter((adjustment) => adjustment.type === "refund")
    .reduce((sum, adjustment) => sum + adjustment.amountPaisa, 0);
  const reversalPaisa = adjustments
    .filter((adjustment) => adjustment.type === "payment_reversal")
    .reduce((sum, adjustment) => sum + adjustment.amountPaisa, 0);

  return {
    summary: {
      grossCollectedPaisa,
      reversalPaisa,
      refundPaisa,
      netCollectedPaisa: grossCollectedPaisa - reversalPaisa - refundPaisa,
      receiptCount: rows.length,
    },
    rows,
  };
}

export async function getOutstandingDuesReport(request: Request, query: ReportQuery) {
  await requireFinanceReportPermission(request);

  const asOf = parseReportEndDate(query.dateTo) ?? new Date();
  const chargeRows = await fetchChargeContextRows(query, { includeChargeDateRange: false });
  const ledgerData = await loadLedgerDataForChargeIds(
    db,
    chargeRows.map((row) => row.chargeId),
    asOf,
  );
  const ledgerByCharge = new Map(
    buildChargeLedger({ ...ledgerData, asOf }).map((row) => [row.chargeId, row]),
  );
  const rowsByStudent = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      studentNameUrdu: string;
      rollNo: string;
      admissionNo: string;
      institutionName: string;
      institutionNameUrdu: string;
      groupLabel: string | null;
      currentPaisa: number;
      bucket30Paisa: number;
      bucket60Paisa: number;
      bucket90Paisa: number;
      totalOutstandingPaisa: number;
    }
  >();

  for (const charge of chargeRows) {
    const ledger = ledgerByCharge.get(charge.chargeId);
    if (!ledger || ledger.balancePaisa <= 0) continue;

    const row = rowsByStudent.get(charge.studentId) ?? {
      studentId: charge.studentId,
      studentName: charge.studentName,
      studentNameUrdu: charge.studentNameUrdu,
      rollNo: charge.rollNo,
      admissionNo: charge.admissionNo,
      institutionName: charge.institutionName,
      institutionNameUrdu: charge.institutionNameUrdu,
      groupLabel: groupLabelForRow(charge),
      currentPaisa: 0,
      bucket30Paisa: 0,
      bucket60Paisa: 0,
      bucket90Paisa: 0,
      totalOutstandingPaisa: 0,
    };

    if (ledger.agingBucket === "90") row.bucket90Paisa += ledger.balancePaisa;
    else if (ledger.agingBucket === "60") row.bucket60Paisa += ledger.balancePaisa;
    else if (ledger.agingBucket === "30") row.bucket30Paisa += ledger.balancePaisa;
    else row.currentPaisa += ledger.balancePaisa;
    row.totalOutstandingPaisa += ledger.balancePaisa;
    rowsByStudent.set(charge.studentId, row);
  }

  const rows = Array.from(rowsByStudent.values()).sort(
    (left, right) => right.totalOutstandingPaisa - left.totalOutstandingPaisa,
  );

  return {
    asOf: asOf.toISOString(),
    summary: {
      currentPaisa: rows.reduce((sum, row) => sum + row.currentPaisa, 0),
      bucket30Paisa: rows.reduce((sum, row) => sum + row.bucket30Paisa, 0),
      bucket60Paisa: rows.reduce((sum, row) => sum + row.bucket60Paisa, 0),
      bucket90Paisa: rows.reduce((sum, row) => sum + row.bucket90Paisa, 0),
      totalOutstandingPaisa: rows.reduce((sum, row) => sum + row.totalOutstandingPaisa, 0),
      studentCount: rows.length,
    },
    rows,
  };
}

export async function getStudentLedgerReport(request: Request, query: ReportQuery) {
  await requireFinanceReportPermission(request);

  const chargeRows = await fetchChargeContextRows(query, { includeChargeDateRange: true });
  const ledgerData = await loadLedgerDataForChargeIds(
    db,
    chargeRows.map((row) => row.chargeId),
  );
  const ledgerByCharge = new Map(buildChargeLedger(ledgerData).map((row) => [row.chargeId, row]));
  const rows = chargeRows.map((charge) => {
    const ledger =
      ledgerByCharge.get(charge.chargeId) ??
      emptyChargeLedger({
        id: charge.chargeId,
        amountPaisa: charge.amountPaisa,
        dueDate: charge.dueDate,
        status: "open",
      });

    return {
      studentId: charge.studentId,
      studentName: charge.studentName,
      studentNameUrdu: charge.studentNameUrdu,
      rollNo: charge.rollNo,
      admissionNo: charge.admissionNo,
      institutionName: charge.institutionName,
      groupLabel: groupLabelForRow(charge),
      chargeId: charge.chargeId,
      chargeLabel: charge.label,
      chargeType: charge.type,
      chargeDate: charge.createdAt.toISOString(),
      dueDate: charge.dueDate?.toISOString() ?? null,
      chargedPaisa: charge.amountPaisa,
      paidPaisa: ledger.paidPaisa,
      refundedPaisa: ledger.refundedPaisa,
      concessionPaisa: ledger.concessionPaisa,
      reversedPaisa: ledger.reversedPaisa,
      outstandingPaisa: ledger.balancePaisa,
      status: ledger.status,
      agingBucket: ledger.agingBucket,
    };
  });

  return {
    summary: {
      chargedPaisa: rows.reduce((sum, row) => sum + row.chargedPaisa, 0),
      paidPaisa: rows.reduce((sum, row) => sum + row.paidPaisa, 0),
      refundedPaisa: rows.reduce((sum, row) => sum + row.refundedPaisa, 0),
      concessionPaisa: rows.reduce((sum, row) => sum + row.concessionPaisa, 0),
      reversedPaisa: rows.reduce((sum, row) => sum + row.reversedPaisa, 0),
      outstandingPaisa: rows.reduce((sum, row) => sum + row.outstandingPaisa, 0),
      rowCount: rows.length,
    },
    rows,
  };
}

export async function getInstitutionSummaryReport(request: Request, query: ReportQuery) {
  await requireFinanceReportPermission(request);

  const chargeRows = await fetchChargeContextRows(query, { includeChargeDateRange: true });
  const outstandingRows = await fetchChargeContextRows(query, { includeChargeDateRange: false });
  const payments = await fetchPaymentReportRows(query);
  const adjustments = await fetchAdjustmentReportRows(query, [
    "charge_reversal",
    "payment_reversal",
    "refund",
  ]);
  const outstandingLedger = await loadLedgerDataForChargeIds(
    db,
    outstandingRows.map((row) => row.chargeId),
  );
  const ledgerByCharge = new Map(
    buildChargeLedger(outstandingLedger).map((row) => [row.chargeId, row]),
  );
  const byInstitution = new Map<
    string,
    {
      institutionId: string;
      institutionName: string;
      institutionNameUrdu: string;
      chargedPaisa: number;
      collectedPaisa: number;
      reversedPaisa: number;
      refundedPaisa: number;
      outstandingPaisa: number;
    }
  >();

  for (const charge of [...chargeRows, ...outstandingRows]) {
    ensureInstitutionSummaryRow(byInstitution, charge);
  }

  for (const charge of chargeRows) {
    const row = ensureInstitutionSummaryRow(byInstitution, charge);
    row.chargedPaisa += charge.amountPaisa;
  }

  for (const charge of outstandingRows) {
    const row = ensureInstitutionSummaryRow(byInstitution, charge);
    const ledger = ledgerByCharge.get(charge.chargeId);
    if (ledger) row.outstandingPaisa += ledger.balancePaisa;
  }

  for (const payment of payments) {
    const row = ensureInstitutionSummaryRow(byInstitution, payment);
    row.collectedPaisa += payment.amountPaisa;
  }

  for (const adjustment of adjustments) {
    const row = ensureInstitutionSummaryRow(byInstitution, adjustment);
    if (adjustment.type === "refund") row.refundedPaisa += adjustment.amountPaisa;
    else row.reversedPaisa += adjustment.amountPaisa;
  }

  return {
    rows: Array.from(byInstitution.values()).sort((left, right) =>
      left.institutionName.localeCompare(right.institutionName),
    ),
  };
}

export async function getReversalRefundAuditReport(request: Request, query: ReportQuery) {
  await requireFinanceReportPermission(request);

  const rows = await fetchAdjustmentReportRows(query, [
    "charge_reversal",
    "payment_reversal",
    "refund",
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      date: row.createdAt.toISOString(),
      actorUserId: row.actorUserId,
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      type: row.type,
      studentId: row.studentId,
      studentName: row.studentName,
      studentNameUrdu: row.studentNameUrdu,
      institutionName: row.institutionName,
      originalReference: row.receiptNo ?? row.chargeLabel ?? metadataReference(row.metadata),
      amountPaisa: row.amountPaisa,
      method: row.method,
      reason: row.reason,
      metadata: row.metadata,
    })),
  };
}

function studentSearchSelection() {
  return {
    studentId: students.id,
    studentName: students.name,
    studentNameUrdu: students.nameUrdu,
    fatherName: students.fatherName,
    enrollmentId: studentEnrollments.id,
    rollNo: studentEnrollments.rollNo,
    admissionNo: studentEnrollments.admissionNo,
    institutionId: studentEnrollments.institutionId,
    institutionName: institutions.name,
    institutionNameUrdu: institutions.nameUrdu,
    programId: studentEnrollments.programId,
    programName: programs.name,
    programNameUrdu: programs.nameUrdu,
    programSystem: programs.system,
    schoolClassName: schoolClasses.name,
    schoolClassNameUrdu: schoolClasses.nameUrdu,
    schoolSectionName: schoolClassSections.name,
    madrassaSubcategoryName: madrassaSubcategories.name,
    madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
    madrassaCategoryName: madrassaCategories.name,
    guardianName: guardians.name,
    guardianPhone: guardians.phone,
  };
}

async function getChargePermissionContext(executor: FeeExecutor, chargeId: string) {
  const [row] = await executor
    .select({
      charge: feeCharges,
      programSystem: programs.system,
    })
    .from(feeCharges)
    .innerJoin(programs, eq(programs.id, feeCharges.programId))
    .where(eq(feeCharges.id, chargeId))
    .limit(1);

  if (!row) throw new HttpError("Fee charge not found", 404);
  return {
    charge: row.charge,
    system: row.programSystem === "madrassa" ? ("madrassa" as const) : ("school" as const),
  };
}

async function getPaymentPermissionContext(executor: FeeExecutor, paymentId: string) {
  const [row] = await executor
    .select({
      payment: feePayments,
      programSystem: programs.system,
    })
    .from(feePayments)
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, feePayments.enrollmentId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .where(eq(feePayments.id, paymentId))
    .limit(1);

  if (!row) throw new HttpError("Fee payment not found", 404);
  return {
    payment: row.payment,
    system: row.programSystem === "madrassa" ? ("madrassa" as const) : ("school" as const),
  };
}

async function loadLedgerDataForStudentIds(
  executor: FeeExecutor,
  studentIds: string[],
): Promise<LedgerData> {
  const ids = uniqueStrings(studentIds);
  if (ids.length === 0) return { charges: [], payments: [], allocations: [], adjustments: [] };

  const [charges, payments, adjustments] = await Promise.all([
    executor.select().from(feeCharges).where(inArray(feeCharges.studentId, ids)),
    executor.select().from(feePayments).where(inArray(feePayments.studentId, ids)),
    executor.select().from(feeAdjustments).where(inArray(feeAdjustments.studentId, ids)),
  ]);

  const chargeIds = charges.map((charge) => charge.id);
  const paymentIds = payments.map((payment) => payment.id);
  const allocations = await loadAllocations(executor, chargeIds, paymentIds);

  return { charges, payments, allocations, adjustments };
}

async function loadLedgerDataForChargeIds(
  executor: FeeExecutor,
  chargeIds: string[],
  asOf?: Date,
): Promise<LedgerData> {
  const ids = uniqueStrings(chargeIds);
  if (ids.length === 0) return { charges: [], payments: [], allocations: [], adjustments: [] };

  const charges = await executor.select().from(feeCharges).where(inArray(feeCharges.id, ids));
  const allocationRows = await executor
    .select({
      allocation: feePaymentAllocations,
      payment: feePayments,
    })
    .from(feePaymentAllocations)
    .innerJoin(feePayments, eq(feePayments.id, feePaymentAllocations.paymentId))
    .where(inArray(feePaymentAllocations.chargeId, ids));

  const allocations = allocationRows.map((row) => row.allocation);
  const payments = uniqueById(allocationRows.map((row) => row.payment));
  const paymentIds = payments.map((payment) => payment.id);
  const adjustments = await loadAdjustmentsForChargeOrPaymentIds(executor, ids, paymentIds);

  return {
    charges: asOf ? charges.map((charge) => ({ ...charge })) : charges,
    payments,
    allocations,
    adjustments,
  };
}

async function loadAllocations(executor: FeeExecutor, chargeIds: string[], paymentIds: string[]) {
  const clauses = compactSql([
    chargeIds.length > 0
      ? inArray(feePaymentAllocations.chargeId, uniqueStrings(chargeIds))
      : undefined,
    paymentIds.length > 0
      ? inArray(feePaymentAllocations.paymentId, uniqueStrings(paymentIds))
      : undefined,
  ]);
  if (clauses.length === 0) return [];

  return executor
    .select()
    .from(feePaymentAllocations)
    .where(or(...clauses));
}

async function loadAdjustmentsForChargeOrPaymentIds(
  executor: FeeExecutor,
  chargeIds: string[],
  paymentIds: string[],
) {
  const clauses = compactSql([
    chargeIds.length > 0 ? inArray(feeAdjustments.chargeId, uniqueStrings(chargeIds)) : undefined,
    paymentIds.length > 0
      ? inArray(feeAdjustments.paymentId, uniqueStrings(paymentIds))
      : undefined,
  ]);
  if (clauses.length === 0) return [];

  return executor
    .select()
    .from(feeAdjustments)
    .where(or(...clauses));
}

async function summarizeByStudentIds(studentIds: string[]) {
  const ledgerData = await loadLedgerDataForStudentIds(db, studentIds);
  const summaries = new Map<string, StudentLedgerSummary>();

  for (const studentId of uniqueStrings(studentIds)) {
    summaries.set(
      studentId,
      summarizeStudentLedger({
        charges: ledgerData.charges.filter((charge) => charge.studentId === studentId),
        payments: ledgerData.payments.filter((payment) => payment.studentId === studentId),
        allocations: ledgerData.allocations.filter((allocation) => {
          const payment = ledgerData.payments.find((item) => item.id === allocation.paymentId);
          const charge = ledgerData.charges.find((item) => item.id === allocation.chargeId);
          return payment?.studentId === studentId || charge?.studentId === studentId;
        }),
        adjustments: ledgerData.adjustments.filter(
          (adjustment) => adjustment.studentId === studentId,
        ),
      }),
    );
  }

  return summaries;
}

async function refreshChargeStatuses(tx: FeeTx, chargeIds: string[]) {
  const ids = uniqueStrings(chargeIds);
  if (ids.length === 0) return;

  const ledgerData = await loadLedgerDataForChargeIds(tx, ids);
  const rows = buildChargeLedger(ledgerData);

  await Promise.all(
    rows.map((row) =>
      tx
        .update(feeCharges)
        .set({ status: feeChargeStatusFromLedger(row.status), updatedAt: new Date() })
        .where(eq(feeCharges.id, row.chargeId)),
    ),
  );
}

async function sumPaymentAdjustments(
  tx: FeeTx,
  paymentId: string,
  type: "refund" | "payment_reversal",
) {
  const rows = await tx
    .select({ amountPaisa: feeAdjustments.amountPaisa })
    .from(feeAdjustments)
    .where(and(eq(feeAdjustments.paymentId, paymentId), eq(feeAdjustments.type, type)));

  return rows.reduce((sum, row) => sum + row.amountPaisa, 0);
}

async function fetchPaymentReportRows(query: ReportQuery) {
  const clauses = compactSql([
    reportSystemCondition(query.system),
    query.institutionId ? eq(feePayments.institutionId, query.institutionId) : undefined,
    query.programId ? eq(studentEnrollments.programId, query.programId) : undefined,
    query.method ? eq(feePayments.method, query.method) : undefined,
    query.userId ? eq(feePayments.receivedByUserId, query.userId) : undefined,
    parseReportStartDate(query.dateFrom)
      ? gte(feePayments.receivedAt, parseReportStartDate(query.dateFrom) as Date)
      : undefined,
    parseReportEndDate(query.dateTo)
      ? lte(feePayments.receivedAt, parseReportEndDate(query.dateTo) as Date)
      : undefined,
    query.q
      ? or(
          ilike(feePayments.receiptNo, `%${query.q}%`),
          ilike(students.name, `%${query.q}%`),
          ilike(students.nameUrdu, `%${query.q}%`),
          ilike(studentEnrollments.rollNo, `%${query.q}%`),
          ilike(authUser.name, `%${query.q}%`),
          ilike(authUser.email, `%${query.q}%`),
        )
      : undefined,
  ]);

  return db
    .select({
      id: feePayments.id,
      receiptNo: feePayments.receiptNo,
      studentId: feePayments.studentId,
      enrollmentId: feePayments.enrollmentId,
      institutionId: feePayments.institutionId,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programId: studentEnrollments.programId,
      programSystem: programs.system,
      rollNo: studentEnrollments.rollNo,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      amountPaisa: feePayments.amountPaisa,
      method: feePayments.method,
      status: feePayments.status,
      receivedAt: feePayments.receivedAt,
      receivedByUserId: feePayments.receivedByUserId,
      receivedByName: authUser.name,
    })
    .from(feePayments)
    .innerJoin(students, eq(students.id, feePayments.studentId))
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, feePayments.enrollmentId))
    .innerJoin(institutions, eq(institutions.id, feePayments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(authUser, eq(authUser.id, feePayments.receivedByUserId))
    .where(and(...clauses))
    .orderBy(desc(feePayments.receivedAt), desc(feePayments.createdAt));
}

async function fetchAdjustmentReportRows(
  query: ReportQuery,
  types: Array<"charge_reversal" | "payment_reversal" | "refund">,
) {
  const clauses = compactSql([
    inArray(feeAdjustments.type, types),
    reportSystemCondition(query.system),
    query.institutionId ? eq(studentEnrollments.institutionId, query.institutionId) : undefined,
    query.programId ? eq(studentEnrollments.programId, query.programId) : undefined,
    query.method
      ? or(eq(feeAdjustments.method, query.method), eq(feePayments.method, query.method))
      : undefined,
    query.userId ? eq(feeAdjustments.actorUserId, query.userId) : undefined,
    parseReportStartDate(query.dateFrom)
      ? gte(feeAdjustments.createdAt, parseReportStartDate(query.dateFrom) as Date)
      : undefined,
    parseReportEndDate(query.dateTo)
      ? lte(feeAdjustments.createdAt, parseReportEndDate(query.dateTo) as Date)
      : undefined,
    query.q
      ? or(
          ilike(students.name, `%${query.q}%`),
          ilike(students.nameUrdu, `%${query.q}%`),
          ilike(studentEnrollments.rollNo, `%${query.q}%`),
          ilike(feePayments.receiptNo, `%${query.q}%`),
          ilike(feeCharges.label, `%${query.q}%`),
          ilike(feeAdjustments.reason, `%${query.q}%`),
          ilike(authUser.name, `%${query.q}%`),
          ilike(authUser.email, `%${query.q}%`),
        )
      : undefined,
  ]);

  return db
    .select({
      id: feeAdjustments.id,
      studentId: feeAdjustments.studentId,
      enrollmentId: feeAdjustments.enrollmentId,
      chargeId: feeAdjustments.chargeId,
      paymentId: feeAdjustments.paymentId,
      type: feeAdjustments.type,
      amountPaisa: feeAdjustments.amountPaisa,
      method: feeAdjustments.method,
      reason: feeAdjustments.reason,
      actorUserId: feeAdjustments.actorUserId,
      metadata: feeAdjustments.metadata,
      createdAt: feeAdjustments.createdAt,
      institutionId: studentEnrollments.institutionId,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programId: studentEnrollments.programId,
      programSystem: programs.system,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      rollNo: studentEnrollments.rollNo,
      receiptNo: feePayments.receiptNo,
      chargeLabel: feeCharges.label,
      actorName: authUser.name,
      actorEmail: authUser.email,
    })
    .from(feeAdjustments)
    .innerJoin(students, eq(students.id, feeAdjustments.studentId))
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, feeAdjustments.enrollmentId))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(feeCharges, eq(feeCharges.id, feeAdjustments.chargeId))
    .leftJoin(feePayments, eq(feePayments.id, feeAdjustments.paymentId))
    .leftJoin(authUser, eq(authUser.id, feeAdjustments.actorUserId))
    .where(and(...clauses))
    .orderBy(desc(feeAdjustments.createdAt));
}

async function fetchChargeContextRows(
  query: ReportQuery,
  options: { includeChargeDateRange: boolean },
): Promise<ChargeContextRow[]> {
  const clauses = compactSql([
    reportSystemCondition(query.system),
    query.institutionId ? eq(feeCharges.institutionId, query.institutionId) : undefined,
    query.programId ? eq(feeCharges.programId, query.programId) : undefined,
    options.includeChargeDateRange && parseReportStartDate(query.dateFrom)
      ? gte(feeCharges.createdAt, parseReportStartDate(query.dateFrom) as Date)
      : undefined,
    options.includeChargeDateRange && parseReportEndDate(query.dateTo)
      ? lte(feeCharges.createdAt, parseReportEndDate(query.dateTo) as Date)
      : undefined,
    query.q
      ? or(
          ilike(students.name, `%${query.q}%`),
          ilike(students.nameUrdu, `%${query.q}%`),
          ilike(students.fatherName, `%${query.q}%`),
          ilike(studentEnrollments.rollNo, `%${query.q}%`),
          ilike(studentEnrollments.admissionNo, `%${query.q}%`),
          ilike(feeCharges.label, `%${query.q}%`),
        )
      : undefined,
  ]);

  return db
    .select({
      chargeId: feeCharges.id,
      studentId: feeCharges.studentId,
      enrollmentId: feeCharges.enrollmentId,
      institutionId: feeCharges.institutionId,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programId: feeCharges.programId,
      programName: programs.name,
      programSystem: programs.system,
      schoolClassName: schoolClasses.name,
      madrassaSubcategoryName: madrassaSubcategories.name,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      label: feeCharges.label,
      type: feeCharges.type,
      amountPaisa: feeCharges.amountPaisa,
      dueDate: feeCharges.dueDate,
      createdAt: feeCharges.createdAt,
    })
    .from(feeCharges)
    .innerJoin(students, eq(students.id, feeCharges.studentId))
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, feeCharges.enrollmentId))
    .innerJoin(institutions, eq(institutions.id, feeCharges.institutionId))
    .innerJoin(programs, eq(programs.id, feeCharges.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, feeCharges.schoolClassId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, feeCharges.madrassaSubcategoryId))
    .where(and(...clauses))
    .orderBy(desc(feeCharges.createdAt));
}

function ensureInstitutionSummaryRow(
  map: Map<
    string,
    {
      institutionId: string;
      institutionName: string;
      institutionNameUrdu: string;
      chargedPaisa: number;
      collectedPaisa: number;
      reversedPaisa: number;
      refundedPaisa: number;
      outstandingPaisa: number;
    }
  >,
  source: { institutionId: string; institutionName: string; institutionNameUrdu: string },
) {
  const row = map.get(source.institutionId) ?? {
    institutionId: source.institutionId,
    institutionName: source.institutionName,
    institutionNameUrdu: source.institutionNameUrdu,
    chargedPaisa: 0,
    collectedPaisa: 0,
    reversedPaisa: 0,
    refundedPaisa: 0,
    outstandingPaisa: 0,
  };
  map.set(source.institutionId, row);
  return row;
}

function sumReportAdjustmentsByPayment(
  adjustments: Awaited<ReturnType<typeof fetchAdjustmentReportRows>>,
  type: "payment_reversal" | "refund",
) {
  const map = new Map<string, number>();
  for (const adjustment of adjustments) {
    if (adjustment.type !== type || !adjustment.paymentId) continue;
    map.set(adjustment.paymentId, (map.get(adjustment.paymentId) ?? 0) + adjustment.amountPaisa);
  }
  return map;
}

function systemCondition(system: FeeSystem) {
  return system === "madrassa"
    ? eq(programs.system, "madrassa")
    : or(eq(programs.system, "school"), eq(programs.system, "school_support"));
}

function reportSystemCondition(system: ReportSystem) {
  if (system === "both") return undefined;
  return systemCondition(system);
}

function compactSql(items: Array<SQL | undefined>): SQL[] {
  return items.filter((item): item is SQL => Boolean(item));
}

function parseReceivedAt(value: string | undefined) {
  if (!value) return new Date();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError("Invalid received date", 400);
  return date;
}

function parseReportStartDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new HttpError("Invalid start date", 400);
  return date;
}

function parseReportEndDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime())) throw new HttpError("Invalid end date", 400);
  return date;
}

function groupLabelForRow(row: {
  schoolClassName?: string | null;
  madrassaSubcategoryName?: string | null;
  programName?: string | null;
}) {
  return row.schoolClassName ?? row.madrassaSubcategoryName ?? row.programName ?? null;
}

function groupAllocationsByPayment(allocations: FeePaymentAllocation[]) {
  const map = new Map<string, FeePaymentAllocation[]>();
  for (const allocation of allocations) {
    const items = map.get(allocation.paymentId) ?? [];
    items.push(allocation);
    map.set(allocation.paymentId, items);
  }
  return map;
}

function feeChargeStatusFromLedger(status: ChargeLedgerRow["status"]): FeeChargeStatus {
  if (status === "unpaid") return "open";
  if (status === "partial") return "partial";
  if (status === "paid") return "paid";
  if (status === "waived") return "waived";
  return "reversed";
}

function emptyChargeLedger(
  charge: Pick<FeeCharge, "id" | "amountPaisa" | "dueDate" | "status">,
): ChargeLedgerRow {
  return {
    chargeId: charge.id,
    originalAmountPaisa: charge.amountPaisa,
    concessionPaisa: 0,
    paidPaisa: 0,
    refundedPaisa: 0,
    reversedPaisa: charge.status === "reversed" ? charge.amountPaisa : 0,
    balancePaisa: charge.status === "reversed" ? 0 : charge.amountPaisa,
    status: charge.status === "reversed" ? "reversed" : "unpaid",
    agingBucket: "current",
  };
}

function serializeCharge(charge: FeeCharge) {
  return {
    ...charge,
    dueDate: charge.dueDate?.toISOString() ?? null,
    reversedAt: charge.reversedAt?.toISOString() ?? null,
    createdAt: charge.createdAt.toISOString(),
    updatedAt: charge.updatedAt.toISOString(),
  };
}

function serializePayment(payment: FeePayment, allocations: FeePaymentAllocation[] = []) {
  return {
    ...payment,
    receivedAt: payment.receivedAt.toISOString(),
    reversedAt: payment.reversedAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    allocations: allocations.map((allocation) => ({
      ...allocation,
      createdAt: allocation.createdAt.toISOString(),
    })),
  };
}

function serializeAdjustment(adjustment: FeeAdjustment) {
  return {
    ...adjustment,
    createdAt: adjustment.createdAt.toISOString(),
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return Array.from(map.values());
}

function metadataReference(metadata: Record<string, unknown>) {
  const refundNo = metadata.refundNo;
  const receiptNo = metadata.receiptNo;
  if (typeof refundNo === "string") return refundNo;
  if (typeof receiptNo === "string") return receiptNo;
  return null;
}
