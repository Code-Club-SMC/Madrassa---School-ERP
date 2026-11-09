/**
 * File-backed fee engine.
 *
 * Every fee operation in `service.ts` tries PostgreSQL first. When the database is
 * unreachable (or the student only exists in the local store), the operation is
 * executed here against `public/finance-student-ledgers.json` so that charges,
 * collections, reversals and refunds are never lost on refresh and immediately
 * show up on the Finance Dashboard, Main Dashboard and Finance Reports.
 */
import { randomUUID } from "node:crypto";
import type { FeeChargeStatus, FeeChargeType, FeePaymentMethod, FeePaymentStatus } from "@/db/schema/finance";
import { HttpError } from "@/lib/server/http";
import { buildChargeLedger, summarizeStudentLedger, type ChargeLedgerRow } from "./ledger";
import { syncPaymentToFile } from "./transaction-service";
import {
  getInstitutionDisplayInfo,
  loadFeeStore,
  saveFeeStore,
  updateFeePaymentStatusInFile,
  type FeeStoreData,
  type StoredFeeAdjustment,
  type StoredFeeCharge,
  type StoredFeePayment,
  type StoredFeeStudent,
} from "./fee-store";

export type FeeSystem = "school" | "madrassa";

export type FeeContext = {
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
  madrassaSubcategoryId: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianCnic: string | null;
  academicYearId: string | null;
  schoolClassFee: number | null;
  madrassaSubcategoryFee: number | null;
  system: FeeSystem;
};

type Actor = { id: string; name?: string | null };

export function isOfflineEligibleError(error: unknown) {
  return !(error instanceof HttpError);
}

const emptySummary = {
  totalChargedPaisa: 0,
  totalConcessionPaisa: 0,
  totalPaidPaisa: 0,
  totalRefundedPaisa: 0,
  totalReversedPaisa: 0,
  outstandingPaisa: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/[^0-9]/g, "");
}

function studentLedgerSlice(store: FeeStoreData, studentIds: string[]) {
  const ids = new Set(studentIds);
  const charges = store.charges.filter((c) => ids.has(c.studentId));
  const payments = store.payments.filter((p) => ids.has(p.studentId));
  const chargeIds = new Set(charges.map((c) => c.id));
  const paymentIds = new Set(payments.map((p) => p.id));
  const allocations = store.allocations.filter((a) => chargeIds.has(a.chargeId) || paymentIds.has(a.paymentId));
  const adjustments = store.adjustments.filter((a) => ids.has(a.studentId));
  return { charges, payments, allocations, adjustments };
}

function summaryFor(store: FeeStoreData, studentId: string) {
  return summarizeStudentLedger(studentLedgerSlice(store, [studentId]));
}

function chargeStatusFromLedger(status: ChargeLedgerRow["status"]): FeeChargeStatus {
  if (status === "unpaid") return "open";
  if (status === "partial") return "partial";
  if (status === "paid") return "paid";
  if (status === "waived") return "waived";
  return "reversed";
}

function refreshStoreChargeStatuses(store: FeeStoreData, chargeIds: string[]) {
  const ids = new Set(chargeIds);
  const studentIds = Array.from(
    new Set(store.charges.filter((c) => ids.has(c.id)).map((c) => c.studentId)),
  );
  const ledger = buildChargeLedger(studentLedgerSlice(store, studentIds));
  const byCharge = new Map(ledger.map((row) => [row.chargeId, row]));
  store.charges = store.charges.map((charge) => {
    if (!ids.has(charge.id)) return charge;
    const row = byCharge.get(charge.id);
    if (!row || charge.status === "reversed") return charge;
    return { ...charge, status: chargeStatusFromLedger(row.status), updatedAt: nowIso() };
  });
}

function nextStoreNumber(store: FeeStoreData, prefix: string) {
  const year = new Date().getFullYear();
  const used = new Set([
    ...store.payments.map((p) => p.receiptNo),
    ...store.adjustments.map((a) => String((a.metadata as { refundNo?: string } | null)?.refundNo ?? "")),
  ]);
  let seq = store.payments.length + store.adjustments.length + 5001;
  let candidate = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
  while (used.has(candidate)) {
    seq += 1;
    candidate = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
  }
  return candidate;
}

function groupLabel(student: Pick<StoredFeeStudent, "schoolClassName" | "madrassaSubcategoryName" | "programName">) {
  return student.schoolClassName ?? student.madrassaSubcategoryName ?? student.programName ?? null;
}

export function ensureStoreStudent(store: FeeStoreData, context: FeeContext) {
  if (store.students.some((s) => s.studentId === context.studentId)) return;
  store.students.push({
    studentId: context.studentId,
    studentName: context.studentName,
    studentNameUrdu: context.studentNameUrdu,
    fatherName: context.fatherName,
    gender: "male",
    dob: "",
    status: "active",
    enrollmentId: context.enrollmentId,
    rollNo: context.rollNo,
    admissionNo: context.admissionNo,
    institutionId: context.institutionId,
    institutionName: context.institutionName,
    institutionNameUrdu: context.institutionNameUrdu,
    programId: context.programId,
    programName: context.programName,
    programNameUrdu: context.programNameUrdu,
    programSystem: (context.programSystem as StoredFeeStudent["programSystem"]) ?? context.system,
    schoolClassId: context.schoolClassId,
    schoolClassName: context.schoolClassName,
    schoolClassNameUrdu: context.schoolClassNameUrdu,
    schoolClassFee: context.schoolClassFee,
    madrassaSubcategoryId: context.madrassaSubcategoryId,
    madrassaSubcategoryName: context.madrassaSubcategoryName,
    madrassaSubcategoryNameUrdu: context.madrassaSubcategoryNameUrdu,
    madrassaSubcategoryFee: context.madrassaSubcategoryFee,
    madrassaCategoryId: null,
    madrassaCategoryName: context.madrassaCategoryName,
    madrassaCategoryNameUrdu: context.madrassaCategoryNameUrdu,
    guardianId: `grd-${context.studentId}`,
    guardianName: context.guardianName ?? "",
    guardianNameUrdu: context.guardianName ?? "",
    guardianPhone: context.guardianPhone ?? "",
    guardianCnic: context.guardianCnic ?? "",
    academicYearId: context.academicYearId,
    system: context.system,
  });
}

/**
 * Mirrors a posted fee payment into `finance-fee-payments.json`, tagging the correct
 * institution (all 4 campuses) so dashboards and reports can attribute it properly.
 */
export function mirrorFeePaymentToFinance(
  context: Pick<FeeContext, "studentName" | "rollNo" | "institutionId" | "programId" | "system">,
  payment: { id: string; receiptNo: string; amountPaisa: number; method: string; receivedAt: Date | string; payerName?: string | null },
  description: string,
) {
  const info = getInstitutionDisplayInfo(context.institutionId, context.programId, context.system);
  const recAt = new Date(payment.receivedAt);
  const safeDate = Number.isNaN(recAt.getTime()) ? new Date() : recAt;
  const method = ["cash", "bank", "online", "cheque"].includes(payment.method) ? payment.method : "cash";
  syncPaymentToFile({
    id: payment.id,
    voucherNo: payment.receiptNo,
    date: safeDate.toISOString().slice(0, 10),
    month: safeDate.getMonth() + 1,
    year: safeDate.getFullYear(),
    type: "income",
    category: "tuition_fee",
    categoryLabel: "Tuition Fee",
    categoryLabelUrdu: "ماہانہ تعلیمی فیس",
    description,
    system: info.system,
    systemLabel: info.systemLabel,
    institutionId: context.institutionId,
    institutionKey: info.institutionKey,
    partyName: payment.payerName || context.studentName || "Student",
    partyRole: "Student",
    paymentMethod: method as "cash" | "bank" | "online" | "cheque",
    amount: Math.round(payment.amountPaisa / 100),
    status: "posted",
    reference: payment.receiptNo,
  });
}

function serializeStorePayment(payment: StoredFeePayment, store: FeeStoreData) {
  return {
    ...payment,
    allocations: store.allocations.filter((a) => a.paymentId === payment.id),
  };
}

function emptyChargeLedgerRow(charge: StoredFeeCharge): ChargeLedgerRow {
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

function monthlyFeePaisaFor(student: Pick<StoredFeeStudent, "system" | "schoolClassFee" | "madrassaSubcategoryFee">) {
  return student.system === "madrassa"
    ? (student.madrassaSubcategoryFee ?? 0) * 100
    : (student.schoolClassFee ?? 0) * 100;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type StoreStudentQuery = {
  system: FeeSystem;
  q?: string;
  status?: string;
  institutionId?: string;
  programId?: string;
  classId?: string;
  subcategoryId?: string;
  categoryId?: string;
};

function isAll(value?: string) {
  return !value || value === "all";
}

export function storeListFeeStudents(query: StoreStudentQuery) {
  const store = loadFeeStore();
  const q = query.q?.trim().toLowerCase();

  const filtered = store.students.filter((s) => {
    if (s.system !== query.system) return false;
    if (s.status !== (query.status ?? "active") && query.status) return false;
    if (!isAll(query.institutionId) && s.institutionId !== query.institutionId) return false;
    if (!isAll(query.programId) && s.programId !== query.programId) return false;
    if (!isAll(query.classId) && s.schoolClassId !== query.classId) return false;
    if (!isAll(query.subcategoryId) && s.madrassaSubcategoryId !== query.subcategoryId) return false;
    if (!isAll(query.categoryId) && s.madrassaCategoryId !== query.categoryId) return false;
    if (q) {
      const hay = [s.studentName, s.studentNameUrdu, s.fatherName, s.rollNo, s.admissionNo, s.guardianPhone]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return {
    students: filtered.map((s) => {
      const clean = digits(s.guardianCnic);
      const siblingCount = clean.length >= 5
        ? store.students.filter((o) => o.studentId !== s.studentId && digits(o.guardianCnic) === clean).length
        : 0;
      const monthlyFeePaisa = monthlyFeePaisaFor(s);
      return {
        id: s.studentId,
        name: s.studentName,
        nameUrdu: s.studentNameUrdu,
        fatherName: s.fatherName,
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        system: s.system,
        institutionId: s.institutionId,
        institutionName: s.institutionName,
        institutionNameUrdu: s.institutionNameUrdu,
        programId: s.programId,
        classId: s.schoolClassId ?? undefined,
        subcategoryId: s.madrassaSubcategoryId ?? undefined,
        categoryId: s.madrassaCategoryId ?? undefined,
        categoryName: s.madrassaCategoryName ?? undefined,
        groupLabel: groupLabel(s),
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        guardianCnic: s.guardianCnic || null,
        siblingCount,
        monthlyFee: Math.round(monthlyFeePaisa / 100),
        monthlyFeePaisa,
        summary: summaryFor(store, s.studentId),
      };
    }),
    offline: true,
  };
}

export function storeGetStudentFeeLedger(
  studentId: string,
  advanceMonthsFn: (charges: Array<{ period?: string | null; status: string }>, monthlyFeePaisa: number) => unknown[],
) {
  const store = loadFeeStore();
  const student = store.students.find((s) => s.studentId === studentId);
  if (!student) throw new HttpError("Active student enrollment not found", 404);

  const clean = digits(student.guardianCnic);
  const siblings = clean.length >= 5
    ? store.students.filter((o) => o.studentId !== studentId && digits(o.guardianCnic) === clean && o.status === "active")
    : [];

  const slice = studentLedgerSlice(store, [studentId, ...siblings.map((s) => s.studentId)]);
  const ledgerRows = buildChargeLedger(slice);
  const ledgerByCharge = new Map(ledgerRows.map((row) => [row.chargeId, row]));

  const chargesFor = (id: string) =>
    slice.charges
      .filter((c) => c.studentId === id)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((charge) => ({ ...charge, ledger: ledgerByCharge.get(charge.id) ?? emptyChargeLedgerRow(charge) }));

  const studentCharges = chargesFor(studentId);
  const monthlyFeePaisa = monthlyFeePaisaFor(student);
  const summary = summaryFor(store, studentId);

  const siblingDetails = siblings.map((sib) => {
    const sibCharges = chargesFor(sib.studentId);
    const sibMonthly = monthlyFeePaisaFor(sib);
    return {
      id: sib.studentId,
      name: sib.studentName,
      nameUrdu: sib.studentNameUrdu,
      fatherName: sib.fatherName,
      rollNo: sib.rollNo,
      admissionNo: sib.admissionNo,
      system: sib.system,
      institutionId: sib.institutionId,
      institutionName: sib.institutionName,
      institutionNameUrdu: sib.institutionNameUrdu,
      groupLabel: groupLabel(sib),
      monthlyFee: Math.round(sibMonthly / 100),
      monthlyFeePaisa: sibMonthly,
      summary: summaryFor(store, sib.studentId),
      outstandingCharges: sibCharges.filter((c) => c.ledger.balancePaisa > 0 && c.status !== "reversed"),
      advanceMonths: advanceMonthsFn(sibCharges, sibMonthly),
    };
  });

  return {
    student: {
      id: student.studentId,
      name: student.studentName,
      nameUrdu: student.studentNameUrdu,
      fatherName: student.fatherName,
      rollNo: student.rollNo,
      admissionNo: student.admissionNo,
      system: student.system,
      institutionId: student.institutionId,
      institutionName: student.institutionName,
      institutionNameUrdu: student.institutionNameUrdu,
      programId: student.programId,
      classId: student.schoolClassId ?? undefined,
      subcategoryId: student.madrassaSubcategoryId ?? undefined,
      groupLabel: groupLabel(student),
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianCnic: student.guardianCnic,
      siblingCount: siblingDetails.length,
      monthlyFee: Math.round(monthlyFeePaisa / 100),
      monthlyFeePaisa,
      summary,
    },
    charges: studentCharges,
    payments: slice.payments
      .filter((p) => p.studentId === studentId)
      .slice()
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .map((p) => serializeStorePayment(p, store)),
    adjustments: slice.adjustments
      .filter((a) => a.studentId === studentId)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    summary,
    advanceMonths: advanceMonthsFn(studentCharges, monthlyFeePaisa),
    siblings: siblingDetails,
    guardianCnic: student.guardianCnic,
    offline: true,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

type ChargeInput = {
  type: string;
  label: string;
  amountPaisa: number;
  dueDate?: string;
  period?: string;
  notes?: string;
};

function buildStoreCharge(context: FeeContext, input: ChargeInput, actor: Actor, status: FeeChargeStatus): StoredFeeCharge {
  const ts = nowIso();
  return {
    id: randomUUID(),
    studentId: context.studentId,
    enrollmentId: context.enrollmentId,
    institutionId: context.institutionId,
    programId: context.programId,
    schoolClassId: context.schoolClassId,
    madrassaSubcategoryId: context.madrassaSubcategoryId,
    type: input.type as FeeChargeType,
    label: input.label,
    period: input.period || null,
    amountPaisa: input.amountPaisa,
    dueDate: input.dueDate ? `${input.dueDate.slice(0, 10)}T00:00:00.000Z` : null,
    status,
    notes: input.notes || null,
    metadata: { offline: true },
    createdByUserId: actor.id,
    reversedAt: null,
    reversedByUserId: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function storeCreateFeeCharge(context: FeeContext, input: ChargeInput, actor: Actor) {
  const store = loadFeeStore();
  ensureStoreStudent(store, context);
  const charge = buildStoreCharge(context, input, actor, "open");
  store.charges.push(charge);
  saveFeeStore(store);
  return { charge };
}

type PaymentInput = {
  allocations: Array<{ chargeId: string; amountPaisa: number }>;
  method: string;
  receivedAt?: string;
  payerName?: string;
  payerPhone?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  descriptionSuffix?: string;
};

function postStorePayment(store: FeeStoreData, context: FeeContext, input: PaymentInput, actor: Actor) {
  const chargeIds = input.allocations.map((a) => a.chargeId);
  if (new Set(chargeIds).size !== chargeIds.length) {
    throw new HttpError("A charge can only be allocated once per payment", 400);
  }
  const charges = store.charges.filter((c) => chargeIds.includes(c.id));
  if (charges.length !== chargeIds.length) throw new HttpError("One or more charges were not found", 404);
  if (charges.some((c) => c.studentId !== context.studentId)) {
    throw new HttpError("All charges must belong to the selected student", 400);
  }
  if (charges.some((c) => c.status === "reversed")) {
    throw new HttpError("Cannot collect payment against reversed charges", 400);
  }

  const ledger = buildChargeLedger(studentLedgerSlice(store, [context.studentId]));
  const balanceByCharge = new Map(ledger.map((row) => [row.chargeId, row.balancePaisa]));
  for (const allocation of input.allocations) {
    if (allocation.amountPaisa > (balanceByCharge.get(allocation.chargeId) ?? 0)) {
      throw new HttpError("Payment cannot exceed outstanding charge balance", 400);
    }
  }

  const amountPaisa = input.allocations.reduce((sum, a) => sum + a.amountPaisa, 0);
  if (amountPaisa <= 0) throw new HttpError("Payment amount must be greater than zero", 400);

  const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();
  const receivedIso = Number.isNaN(receivedAt.getTime()) ? nowIso() : receivedAt.toISOString();
  const ts = nowIso();
  const payment: StoredFeePayment = {
    id: randomUUID(),
    receiptNo: nextStoreNumber(store, "FR"),
    studentId: context.studentId,
    enrollmentId: context.enrollmentId,
    institutionId: context.institutionId,
    amountPaisa,
    method: (input.method || "cash") as FeePaymentMethod,
    status: "posted",
    receivedAt: receivedIso,
    receivedByUserId: actor.id,
    payerName: input.payerName || null,
    payerPhone: input.payerPhone || null,
    notes: input.notes || null,
    metadata: { ...(input.metadata ?? {}), institutionId: context.institutionId, programId: context.programId, offline: true },
    reversedAt: null,
    reversedByUserId: null,
    createdAt: ts,
    updatedAt: ts,
  };
  store.payments.push(payment);
  const allocations = input.allocations.map((a) => ({
    id: randomUUID(),
    paymentId: payment.id,
    chargeId: a.chargeId,
    amountPaisa: a.amountPaisa,
    createdAt: ts,
  }));
  store.allocations.push(...allocations);
  refreshStoreChargeStatuses(store, chargeIds);

  const rollPart = context.rollNo ? ` (${context.rollNo})` : "";
  mirrorFeePaymentToFinance(
    context,
    payment,
    `Fee Payment: ${payment.receiptNo} · ${context.studentName}${rollPart}${input.descriptionSuffix ?? ""}`,
  );

  return { payment, allocations };
}

export function storeCollectFeePayment(context: FeeContext, input: PaymentInput, actor: Actor) {
  const store = loadFeeStore();
  ensureStoreStudent(store, context);
  const { payment, allocations } = postStorePayment(store, context, input, actor);
  saveFeeStore(store);
  return { payment: { ...payment, allocations } };
}

export function storeChargeAndCollect(
  context: FeeContext,
  input: ChargeInput & Omit<PaymentInput, "allocations">,
  actor: Actor,
) {
  const store = loadFeeStore();
  ensureStoreStudent(store, context);
  const charge = buildStoreCharge(context, input, actor, "open");
  store.charges.push(charge);
  const { payment, allocations } = postStorePayment(
    store,
    context,
    { ...input, allocations: [{ chargeId: charge.id, amountPaisa: input.amountPaisa }], descriptionSuffix: ` (${input.label})` },
    actor,
  );
  saveFeeStore(store);
  const finalCharge = store.charges.find((c) => c.id === charge.id) ?? charge;
  return { charge: finalCharge, payment: { ...payment, allocations } };
}

export async function storeCollectCollectiveFeePayment(
  input: {
    method: string;
    receivedAt?: string;
    payerName?: string;
    payerPhone?: string;
    notes?: string;
    students: Array<{
      studentId: string;
      allocations: Array<{ chargeId: string; amountPaisa: number }>;
      advanceMonths: Array<{ period: string; label: string; amountPaisa: number }>;
    }>;
  },
  actor: Actor,
  resolveContext: (studentId: string) => Promise<FeeContext>,
) {
  const store = loadFeeStore();
  const results: Array<{
    studentId: string;
    studentName: string;
    studentNameUrdu: string;
    rollNo: string;
    receiptNo: string;
    paymentId: string;
    amountPaisa: number;
  }> = [];
  let total = 0;
  const receiptNos: string[] = [];

  for (const entry of input.students) {
    const context = await resolveContext(entry.studentId);
    ensureStoreStudent(store, context);
    const allocations = [...entry.allocations];
    for (const adv of entry.advanceMonths) {
      const charge = buildStoreCharge(
        context,
        { type: "monthly", label: adv.label, period: adv.period, amountPaisa: adv.amountPaisa, dueDate: `${adv.period}-10`, notes: "Advance payment collected" },
        actor,
        "open",
      );
      store.charges.push(charge);
      allocations.push({ chargeId: charge.id, amountPaisa: adv.amountPaisa });
    }
    if (allocations.length === 0) continue;
    const amount = allocations.reduce((sum, a) => sum + a.amountPaisa, 0);
    if (amount <= 0) continue;

    const { payment } = postStorePayment(
      store,
      context,
      {
        allocations,
        method: input.method,
        receivedAt: input.receivedAt,
        payerName: input.payerName,
        payerPhone: input.payerPhone,
        notes: input.notes,
        metadata: { isCollective: input.students.length > 1, totalStudents: input.students.length },
      },
      actor,
    );
    total += amount;
    receiptNos.push(payment.receiptNo);
    results.push({
      studentId: context.studentId,
      studentName: context.studentName,
      studentNameUrdu: context.studentNameUrdu,
      rollNo: context.rollNo,
      receiptNo: payment.receiptNo,
      paymentId: payment.id,
      amountPaisa: amount,
    });
  }

  if (total <= 0) throw new HttpError("No payment amounts were specified", 400);
  saveFeeStore(store);

  return {
    success: true,
    totalAmountPaisa: total,
    receiptNos,
    primaryReceiptNo: receiptNos[0] ?? "",
    results,
  };
}

export function storeReverseFeeCharge(chargeId: string, reason: string, actor: Actor) {
  const store = loadFeeStore();
  const charge = store.charges.find((c) => c.id === chargeId);
  if (!charge) throw new HttpError("Fee charge not found", 404);
  if (charge.status === "reversed") throw new HttpError("Fee charge is already reversed", 400);
  const ledger = buildChargeLedger(studentLedgerSlice(store, [charge.studentId])).find((r) => r.chargeId === chargeId);
  if (ledger && ledger.paidPaisa !== 0) throw new HttpError("Cannot reverse a charge with posted payments", 400);

  const adjustment: StoredFeeAdjustment = {
    id: randomUUID(),
    studentId: charge.studentId,
    enrollmentId: charge.enrollmentId,
    chargeId,
    paymentId: null,
    type: "charge_reversal",
    amountPaisa: charge.amountPaisa,
    method: null,
    reason,
    actorUserId: actor.id,
    metadata: { chargeLabel: charge.label },
    createdAt: nowIso(),
  };
  store.adjustments.push(adjustment);
  const updated: StoredFeeCharge = {
    ...charge,
    status: "reversed",
    reversedAt: nowIso(),
    reversedByUserId: actor.id,
    updatedAt: nowIso(),
  };
  store.charges = store.charges.map((c) => (c.id === chargeId ? updated : c));
  saveFeeStore(store);
  return { charge: updated, adjustment };
}

export function storeGetPaymentSystem(paymentId: string): FeeSystem | null {
  const store = loadFeeStore();
  const payment = store.payments.find((p) => p.id === paymentId);
  if (!payment) return null;
  const student = store.students.find((s) => s.studentId === payment.studentId);
  return student?.system ?? null;
}

export function storeGetChargeSystem(chargeId: string): FeeSystem | null {
  const store = loadFeeStore();
  const charge = store.charges.find((c) => c.id === chargeId);
  if (!charge) return null;
  const student = store.students.find((s) => s.studentId === charge.studentId);
  return student?.system ?? null;
}

function sumStorePaymentAdjustments(store: FeeStoreData, paymentId: string, type: "refund" | "payment_reversal") {
  return store.adjustments
    .filter((a) => a.paymentId === paymentId && a.type === type)
    .reduce((sum, a) => sum + a.amountPaisa, 0);
}

export function storeReverseFeePayment(paymentId: string, reason: string, actor: Actor) {
  const store = loadFeeStore();
  const payment = store.payments.find((p) => p.id === paymentId);
  if (!payment) throw new HttpError("Fee payment not found", 404);
  if (!["posted", "partially_refunded"].includes(payment.status)) {
    throw new HttpError("Only posted or partially refunded payments can be reversed", 400);
  }
  const reversalAmount = Math.max(0, payment.amountPaisa - sumStorePaymentAdjustments(store, paymentId, "refund"));
  const adjustment: StoredFeeAdjustment = {
    id: randomUUID(),
    studentId: payment.studentId,
    enrollmentId: payment.enrollmentId,
    chargeId: null,
    paymentId,
    type: "payment_reversal",
    amountPaisa: reversalAmount,
    method: null,
    reason,
    actorUserId: actor.id,
    metadata: { receiptNo: payment.receiptNo },
    createdAt: nowIso(),
  };
  store.adjustments.push(adjustment);
  const updated: StoredFeePayment = {
    ...payment,
    status: "reversed",
    reversedAt: nowIso(),
    reversedByUserId: actor.id,
    updatedAt: nowIso(),
  };
  store.payments = store.payments.map((p) => (p.id === paymentId ? updated : p));
  const chargeIds = store.allocations.filter((a) => a.paymentId === paymentId).map((a) => a.chargeId);
  refreshStoreChargeStatuses(store, chargeIds);
  saveFeeStore(store);
  updateFeePaymentStatusInFile(paymentId, payment.receiptNo, "reversed");
  return { payment: serializeStorePayment(updated, store), adjustment };
}

export function storeRefundFeePayment(
  paymentId: string,
  input: { amountPaisa: number; method: string; reason: string },
  actor: Actor,
) {
  const store = loadFeeStore();
  const payment = store.payments.find((p) => p.id === paymentId);
  if (!payment) throw new HttpError("Fee payment not found", 404);
  if (payment.status === "reversed") throw new HttpError("Cannot refund a reversed payment", 400);
  const previous = sumStorePaymentAdjustments(store, paymentId, "refund");
  if (input.amountPaisa > payment.amountPaisa - previous) {
    throw new HttpError("Refund cannot exceed remaining payment amount", 400);
  }
  const refundNo = nextStoreNumber(store, "RF");
  const nextStatus: FeePaymentStatus =
    previous + input.amountPaisa >= payment.amountPaisa ? "refunded" : "partially_refunded";
  const adjustment: StoredFeeAdjustment = {
    id: randomUUID(),
    studentId: payment.studentId,
    enrollmentId: payment.enrollmentId,
    chargeId: null,
    paymentId,
    type: "refund",
    amountPaisa: input.amountPaisa,
    method: input.method as FeePaymentMethod,
    reason: input.reason,
    actorUserId: actor.id,
    metadata: { receiptNo: payment.receiptNo, refundNo },
    createdAt: nowIso(),
  };
  store.adjustments.push(adjustment);
  const updated: StoredFeePayment = { ...payment, status: nextStatus, updatedAt: nowIso() };
  store.payments = store.payments.map((p) => (p.id === paymentId ? updated : p));
  const chargeIds = store.allocations.filter((a) => a.paymentId === paymentId).map((a) => a.chargeId);
  refreshStoreChargeStatuses(store, chargeIds);
  saveFeeStore(store);
  updateFeePaymentStatusInFile(paymentId, payment.receiptNo, nextStatus, input.amountPaisa);
  return { payment: serializeStorePayment(updated, store), adjustment };
}

// ---------------------------------------------------------------------------
// Reports (offline)
// ---------------------------------------------------------------------------

export type StoreReportQuery = {
  system: "both" | "school" | "madrassa";
  institutionId?: string;
  programId?: string;
  dateFrom?: string;
  dateTo?: string;
  method?: string;
  q?: string;
};

function studentMatchesReport(student: StoredFeeStudent | undefined, query: StoreReportQuery) {
  if (!student) return false;
  if (query.system !== "both" && student.system !== query.system) return false;
  if (query.institutionId && student.institutionId !== query.institutionId) return false;
  if (query.programId && student.programId !== query.programId) return false;
  if (query.q) {
    const q = query.q.toLowerCase();
    const hay = [student.studentName, student.studentNameUrdu, student.rollNo, student.admissionNo].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function inDateRange(iso: string, query: StoreReportQuery) {
  const day = iso.slice(0, 10);
  if (query.dateFrom && day < query.dateFrom.slice(0, 10)) return false;
  if (query.dateTo && day > query.dateTo.slice(0, 10)) return false;
  return true;
}

export function storeDailyCollectionReport(query: StoreReportQuery) {
  const store = loadFeeStore();
  const studentsById = new Map(store.students.map((s) => [s.studentId, s]));
  const payments = store.payments.filter(
    (p) =>
      studentMatchesReport(studentsById.get(p.studentId), query) &&
      inDateRange(p.receivedAt, query) &&
      (!query.method || p.method === query.method),
  );
  const rows = payments
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .map((p) => {
      const student = studentsById.get(p.studentId)!;
      const refundedPaisa = sumStorePaymentAdjustments(store, p.id, "refund");
      const reversedPaisa = sumStorePaymentAdjustments(store, p.id, "payment_reversal");
      return {
        receiptNo: p.receiptNo,
        date: p.receivedAt,
        studentId: p.studentId,
        studentName: student.studentName,
        studentNameUrdu: student.studentNameUrdu,
        rollNo: student.rollNo,
        institutionName: student.institutionName,
        method: p.method,
        status: p.status,
        grossAmountPaisa: p.amountPaisa,
        refundedPaisa,
        reversedPaisa,
        netAmountPaisa: p.amountPaisa - refundedPaisa - reversedPaisa,
        receivedByName: null as string | null,
      };
    });
  const gross = rows.reduce((s, r) => s + r.grossAmountPaisa, 0);
  const refund = rows.reduce((s, r) => s + r.refundedPaisa, 0);
  const reversal = rows.reduce((s, r) => s + r.reversedPaisa, 0);
  return {
    summary: {
      grossCollectedPaisa: gross,
      reversalPaisa: reversal,
      refundPaisa: refund,
      netCollectedPaisa: gross - reversal - refund,
      receiptCount: rows.length,
    },
    rows,
  };
}

export function storeOutstandingDuesReport(query: StoreReportQuery) {
  const store = loadFeeStore();
  const students = store.students.filter((s) => studentMatchesReport(s, query));
  const rows = students
    .map((s) => {
      const ledger = buildChargeLedger(studentLedgerSlice(store, [s.studentId]));
      const row = {
        studentId: s.studentId,
        studentName: s.studentName,
        studentNameUrdu: s.studentNameUrdu,
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        institutionName: s.institutionName,
        institutionNameUrdu: s.institutionNameUrdu,
        groupLabel: groupLabel(s),
        currentPaisa: 0,
        bucket30Paisa: 0,
        bucket60Paisa: 0,
        bucket90Paisa: 0,
        totalOutstandingPaisa: 0,
      };
      for (const l of ledger) {
        if (l.balancePaisa <= 0) continue;
        if (l.agingBucket === "90") row.bucket90Paisa += l.balancePaisa;
        else if (l.agingBucket === "60") row.bucket60Paisa += l.balancePaisa;
        else if (l.agingBucket === "30") row.bucket30Paisa += l.balancePaisa;
        else row.currentPaisa += l.balancePaisa;
        row.totalOutstandingPaisa += l.balancePaisa;
      }
      return row;
    })
    .filter((r) => r.totalOutstandingPaisa > 0)
    .sort((a, b) => b.totalOutstandingPaisa - a.totalOutstandingPaisa);

  return {
    asOf: nowIso(),
    summary: {
      currentPaisa: rows.reduce((s, r) => s + r.currentPaisa, 0),
      bucket30Paisa: rows.reduce((s, r) => s + r.bucket30Paisa, 0),
      bucket60Paisa: rows.reduce((s, r) => s + r.bucket60Paisa, 0),
      bucket90Paisa: rows.reduce((s, r) => s + r.bucket90Paisa, 0),
      totalOutstandingPaisa: rows.reduce((s, r) => s + r.totalOutstandingPaisa, 0),
      studentCount: rows.length,
    },
    rows,
  };
}

export function storeStudentLedgerReport(query: StoreReportQuery) {
  const store = loadFeeStore();
  const studentsById = new Map(store.students.map((s) => [s.studentId, s]));
  const charges = store.charges.filter(
    (c) => studentMatchesReport(studentsById.get(c.studentId), query) && inDateRange(c.createdAt, query),
  );
  const ledger = buildChargeLedger(studentLedgerSlice(store, Array.from(new Set(charges.map((c) => c.studentId)))));
  const byCharge = new Map(ledger.map((r) => [r.chargeId, r]));
  const rows = charges.map((c) => {
    const s = studentsById.get(c.studentId)!;
    const l = byCharge.get(c.id) ?? emptyChargeLedgerRow(c);
    return {
      studentId: c.studentId,
      studentName: s.studentName,
      studentNameUrdu: s.studentNameUrdu,
      rollNo: s.rollNo,
      admissionNo: s.admissionNo,
      institutionName: s.institutionName,
      groupLabel: groupLabel(s),
      chargeId: c.id,
      chargeLabel: c.label,
      chargeType: c.type,
      chargeDate: c.createdAt,
      dueDate: c.dueDate,
      chargedPaisa: c.amountPaisa,
      paidPaisa: l.paidPaisa,
      refundedPaisa: l.refundedPaisa,
      concessionPaisa: l.concessionPaisa,
      reversedPaisa: l.reversedPaisa,
      outstandingPaisa: l.balancePaisa,
      status: l.status,
      agingBucket: l.agingBucket,
    };
  });
  return {
    summary: {
      chargedPaisa: rows.reduce((s, r) => s + r.chargedPaisa, 0),
      paidPaisa: rows.reduce((s, r) => s + r.paidPaisa, 0),
      refundedPaisa: rows.reduce((s, r) => s + r.refundedPaisa, 0),
      concessionPaisa: rows.reduce((s, r) => s + r.concessionPaisa, 0),
      reversedPaisa: rows.reduce((s, r) => s + r.reversedPaisa, 0),
      outstandingPaisa: rows.reduce((s, r) => s + r.outstandingPaisa, 0),
      rowCount: rows.length,
    },
    rows,
  };
}

/** Institution summary broken down across all 4 campuses (Zainab Madrassa and Zainab School are separated). */
export function storeInstitutionSummaryReport(query: StoreReportQuery) {
  const store = loadFeeStore();
  const byKey = new Map<string, {
    institutionId: string;
    institutionName: string;
    institutionNameUrdu: string;
    chargedPaisa: number;
    collectedPaisa: number;
    reversedPaisa: number;
    refundedPaisa: number;
    outstandingPaisa: number;
  }>();
  for (const s of store.students.filter((st) => studentMatchesReport(st, query))) {
    const info = getInstitutionDisplayInfo(s.institutionId, s.programId, s.system);
    const row = byKey.get(info.institutionKey) ?? {
      institutionId: info.institutionKey,
      institutionName: info.institutionName,
      institutionNameUrdu: info.institutionNameUrdu,
      chargedPaisa: 0,
      collectedPaisa: 0,
      reversedPaisa: 0,
      refundedPaisa: 0,
      outstandingPaisa: 0,
    };
    const summary = summaryFor(store, s.studentId);
    row.chargedPaisa += store.charges
      .filter((c) => c.studentId === s.studentId && inDateRange(c.createdAt, query))
      .reduce((sum, c) => sum + c.amountPaisa, 0);
    row.collectedPaisa += store.payments
      .filter((p) => p.studentId === s.studentId && inDateRange(p.receivedAt, query))
      .reduce((sum, p) => sum + p.amountPaisa, 0);
    row.refundedPaisa += store.adjustments
      .filter((a) => a.studentId === s.studentId && a.type === "refund" && inDateRange(a.createdAt, query))
      .reduce((sum, a) => sum + a.amountPaisa, 0);
    row.reversedPaisa += store.adjustments
      .filter((a) => a.studentId === s.studentId && (a.type === "charge_reversal" || a.type === "payment_reversal") && inDateRange(a.createdAt, query))
      .reduce((sum, a) => sum + a.amountPaisa, 0);
    row.outstandingPaisa += summary.outstandingPaisa;
    byKey.set(info.institutionKey, row);
  }
  return {
    rows: Array.from(byKey.values()).sort((a, b) => a.institutionName.localeCompare(b.institutionName)),
  };
}

export function storeReversalRefundAuditReport(query: StoreReportQuery) {
  const store = loadFeeStore();
  const studentsById = new Map(store.students.map((s) => [s.studentId, s]));
  return {
    rows: store.adjustments
      .filter(
        (a) =>
          ["charge_reversal", "payment_reversal", "refund"].includes(a.type) &&
          studentMatchesReport(studentsById.get(a.studentId), query) &&
          inDateRange(a.createdAt, query),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => {
        const s = studentsById.get(a.studentId)!;
        const meta = (a.metadata ?? {}) as Record<string, unknown>;
        return {
          id: a.id,
          date: a.createdAt,
          actorUserId: a.actorUserId,
          actorName: null as string | null,
          actorEmail: null as string | null,
          type: a.type,
          studentId: a.studentId,
          studentName: s.studentName,
          studentNameUrdu: s.studentNameUrdu,
          institutionName: s.institutionName,
          originalReference:
            (typeof meta.refundNo === "string" && meta.refundNo) ||
            (typeof meta.receiptNo === "string" && meta.receiptNo) ||
            (typeof meta.chargeLabel === "string" && meta.chargeLabel) ||
            null,
          amountPaisa: a.amountPaisa,
          method: a.method,
          reason: a.reason,
          metadata: a.metadata,
        };
      }),
  };
}

export { emptySummary as storeEmptySummary };
