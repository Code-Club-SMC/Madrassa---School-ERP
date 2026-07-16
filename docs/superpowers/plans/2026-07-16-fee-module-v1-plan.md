# Fee Module V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an on-demand student fee ledger with charges, partial payments, receipts, reversals, refunds, reports, and student timeline events.

**Architecture:** Add a dedicated Drizzle finance schema and server-side ledger service, then expose narrow TanStack Start API routes used by the existing school, madrassa, and finance pages. Keep ledger arithmetic in pure helpers with tests, and make all financial write operations transactional. UI pages call the same backend APIs and render system-specific views through shared fee components.

**Tech Stack:** TanStack Start file routes, React, TypeScript 7, Vite 8, Drizzle ORM, PostgreSQL, Zod, shadcn/Radix UI, Sonner, existing permission modules, existing student timeline.

## Global Constraints

- Build a production-ready on-demand fee ledger.
- Support manual charge creation for active students.
- Support full and partial payments with printable receipts.
- Track outstanding balances without auto-generating monthly fees.
- Support reversals and refunds without deleting financial history.
- Add detailed finance reports for collection, outstanding dues, student ledgers, institution summaries, and reversal/refund audits.
- Write student timeline events for meaningful fee actions.
- No automatic monthly bulk generation in V1.
- No parent online payment portal in V1.
- No bank reconciliation workflow in V1.
- No hard deletion of charges, payments, receipts, reversals, or refunds.
- No generalized accounting suite beyond student fee operations and required reports.
- Amounts are stored as integer paisa.
- Overpayment is not allowed in V1.
- Reversal and refund actions require confirmation dialogs and mandatory reason text.
- Financial write operations should be transactional.
- Do not start the dev server unless explicitly requested.

---

## File Structure

- Create `src/db/schema/finance.ts`: fee ledger tables, relations, indexes, and sequence table.
- Modify `src/db/index.ts`: include `financeSchema` in the Drizzle schema bundle.
- Modify `src/lib/server/students/events.ts`: add fee event types.
- Create `src/lib/server/finance/numbering.ts`: sequential receipt/refund number generator.
- Create `src/lib/server/finance/ledger.ts`: pure ledger arithmetic and report summary helpers.
- Create `src/lib/server/finance/ledger.test.ts`: Bun tests for partial payments, reversals, refunds, and outstanding balances.
- Create `src/lib/server/finance/service.ts`: Zod schemas, permission checks, transactions, queries, mutations, and reports.
- Create API routes under `src/routes/api/fees/**`: student search, student ledger, charges, payments, reversals, refunds, and reports.
- Create `src/components/fees/fee-types.ts`: frontend DTO types shared by fee pages.
- Create `src/components/fees/fee-api.ts`: fetch helpers for fee pages and reports.
- Create `src/components/fees/fee-workspace.tsx`: shared fee operations UI for school and madrassa.
- Create `src/components/fees/fee-dialogs.tsx`: charge, collect, reverse, refund, and receipt dialogs.
- Modify `src/routes/_authenticated/school/fees.tsx`: replace mock state with `FeeWorkspace system="school"`.
- Modify `src/routes/_authenticated/madrassa/fees.tsx`: replace mock state with `FeeWorkspace system="madrassa"`.
- Create `src/routes/_authenticated/finance/reports.tsx`: detailed finance report UI.
- Modify `src/lib/nav-config.ts`: add Finance Reports nav/title entry.
- Modify `src/components/students/student-timeline.tsx`: add finance filter, icon, and fee event categories.

---

### Task 1: Finance Schema, Receipt Numbering, and Student Event Types

**Files:**
- Create: `src/db/schema/finance.ts`
- Create: `src/lib/server/finance/numbering.ts`
- Modify: `src/db/index.ts`
- Modify: `src/lib/server/students/events.ts`

**Interfaces:**
- Produces: Drizzle tables `feeCharges`, `feePayments`, `feePaymentAllocations`, `feeAdjustments`, `financeNumberSequences`.
- Produces: `nextFinanceNumber(tx, scope)` returning receipt-like numbers such as `FR-2026-0001` and `RF-2026-0001`.
- Produces: student event types consumed by the fee service and timeline.

- [ ] **Step 1: Create the finance schema**

Create `src/db/schema/finance.ts` with this table layout:

```ts
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
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id").notNull().references(() => studentEnrollments.id, { onDelete: "restrict" }),
    institutionId: text("institution_id").notNull().references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    schoolSectionId: text("school_section_id").references(() => schoolClassSections.id, { onDelete: "restrict" }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, { onDelete: "restrict" }),
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
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
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
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id").notNull().references(() => studentEnrollments.id, { onDelete: "restrict" }),
    institutionId: text("institution_id").notNull().references(() => institutions.id, { onDelete: "restrict" }),
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
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
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
    paymentId: text("payment_id").notNull().references(() => feePayments.id, { onDelete: "restrict" }),
    chargeId: text("charge_id").notNull().references(() => feeCharges.id, { onDelete: "restrict" }),
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
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id").notNull().references(() => studentEnrollments.id, { onDelete: "restrict" }),
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
    institutionId: text("institution_id").notNull().references(() => institutions.id, { onDelete: "restrict" }),
    prefix: text("prefix").notNull(),
    currentValue: integer("current_value").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
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
```

- [ ] **Step 2: Register finance schema with Drizzle**

Modify `src/db/index.ts`:

```ts
import * as financeSchema from "@/db/schema/finance";
```

and add `...financeSchema` inside the `schema` object passed to `drizzle`.

- [ ] **Step 3: Add finance event types**

Modify `src/lib/server/students/events.ts` and append these values to `studentEventTypes`:

```ts
"fee_charge_created",
"fee_payment_recorded",
"fee_charge_reversed",
"fee_payment_reversed",
"fee_refund_recorded",
"fee_adjustment_recorded",
```

- [ ] **Step 4: Create finance number generator**

Create `src/lib/server/finance/numbering.ts`:

```ts
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { financeNumberSequences } from "@/db/schema/finance";

type FinanceTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type FinanceNumberScope = {
  year?: number;
  type: "fee_receipt" | "refund_receipt";
  institutionId: string;
  prefix: "FR" | "RF";
};

export async function nextFinanceNumber(tx: FinanceTx, scope: FinanceNumberScope) {
  const year = scope.year ?? new Date().getFullYear();
  const id = [year, scope.type, scope.institutionId].join(":");

  const [row] = await tx
    .insert(financeNumberSequences)
    .values({
      id,
      year,
      type: scope.type,
      institutionId: scope.institutionId,
      prefix: scope.prefix,
      currentValue: 1,
    })
    .onConflictDoUpdate({
      target: financeNumberSequences.id,
      set: {
        currentValue: sql`${financeNumberSequences.currentValue} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ value: financeNumberSequences.currentValue });

  const value = row?.value ?? 1;
  return `${scope.prefix}-${year}-${value.toString().padStart(4, "0")}`;
}
```

- [ ] **Step 5: Generate migration**

Run:

```bash
bun run db:generate
```

Expected: Drizzle creates a new migration in `drizzle/` for the finance tables.

- [ ] **Step 6: Verify Task 1**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors.

---

### Task 2: Pure Ledger Arithmetic and Tests

**Files:**
- Create: `src/lib/server/finance/ledger.ts`
- Create: `src/lib/server/finance/ledger.test.ts`

**Interfaces:**
- Consumes: plain charge, allocation, payment, and adjustment inputs.
- Produces: `buildChargeLedger(input)`, `summarizeStudentLedger(input)`, and `buildAgingBucket(dueDate, asOf)`.
- Later service code uses these helpers to avoid duplicating ledger math in API routes or UI pages.

- [ ] **Step 1: Add ledger helper implementation**

Create `src/lib/server/finance/ledger.ts`:

```ts
export type LedgerChargeInput = {
  id: string;
  amountPaisa: number;
  dueDate: Date | string | null;
  status: string;
};

export type LedgerPaymentInput = {
  id: string;
  amountPaisa: number;
  status: "posted" | "partially_refunded" | "refunded" | "reversed";
};

export type LedgerAllocationInput = {
  chargeId: string;
  paymentId: string;
  amountPaisa: number;
};

export type LedgerAdjustmentInput = {
  type: "concession" | "waiver" | "correction" | "charge_reversal" | "payment_reversal" | "refund";
  chargeId?: string | null;
  paymentId?: string | null;
  amountPaisa: number;
};

export type ChargeLedgerRow = {
  chargeId: string;
  originalAmountPaisa: number;
  concessionPaisa: number;
  paidPaisa: number;
  refundedPaisa: number;
  reversedPaisa: number;
  balancePaisa: number;
  status: "unpaid" | "partial" | "paid" | "waived" | "reversed";
  agingBucket: "current" | "30" | "60" | "90";
};

export function buildChargeLedger(input: {
  charges: LedgerChargeInput[];
  payments: LedgerPaymentInput[];
  allocations: LedgerAllocationInput[];
  adjustments: LedgerAdjustmentInput[];
  asOf?: Date;
}): ChargeLedgerRow[] {
  const paymentStatus = new Map(input.payments.map((payment) => [payment.id, payment.status]));
  const refundByPayment = sumAdjustments(input.adjustments.filter((item) => item.type === "refund"), "paymentId");
  const concessionByCharge = sumAdjustments(
    input.adjustments.filter((item) => item.type === "concession" || item.type === "waiver" || item.type === "correction"),
    "chargeId",
  );
  const reversalByCharge = sumAdjustments(input.adjustments.filter((item) => item.type === "charge_reversal"), "chargeId");

  return input.charges.map((charge) => {
    const activeAllocations = input.allocations.filter((allocation) => {
      const status = paymentStatus.get(allocation.paymentId);
      return allocation.chargeId === charge.id && status !== "reversed";
    });
    const allocatedPaisa = activeAllocations.reduce((sum, allocation) => sum + allocation.amountPaisa, 0);
    const refundedPaisa = activeAllocations.reduce((sum, allocation) => {
      const paymentRefunded = refundByPayment.get(allocation.paymentId) ?? 0;
      const paymentTotal = input.allocations
        .filter((item) => item.paymentId === allocation.paymentId)
        .reduce((paymentSum, item) => paymentSum + item.amountPaisa, 0);
      if (paymentTotal <= 0) return sum;
      return sum + Math.round((allocation.amountPaisa / paymentTotal) * paymentRefunded);
    }, 0);
    const concessionPaisa = concessionByCharge.get(charge.id) ?? 0;
    const reversedPaisa = reversalByCharge.get(charge.id) ?? 0;
    const paidPaisa = Math.max(0, allocatedPaisa - refundedPaisa);
    const payablePaisa = Math.max(0, charge.amountPaisa - concessionPaisa - reversedPaisa);
    const balancePaisa = Math.max(0, payablePaisa - paidPaisa);

    return {
      chargeId: charge.id,
      originalAmountPaisa: charge.amountPaisa,
      concessionPaisa,
      paidPaisa,
      refundedPaisa,
      reversedPaisa,
      balancePaisa,
      status: deriveChargeStatus({ payablePaisa, paidPaisa, reversedPaisa, originalAmountPaisa: charge.amountPaisa }),
      agingBucket: buildAgingBucket(charge.dueDate, input.asOf ?? new Date()),
    };
  });
}

export function summarizeStudentLedger(input: Parameters<typeof buildChargeLedger>[0]) {
  const rows = buildChargeLedger(input);
  return {
    totalChargedPaisa: rows.reduce((sum, row) => sum + row.originalAmountPaisa, 0),
    totalConcessionPaisa: rows.reduce((sum, row) => sum + row.concessionPaisa, 0),
    totalPaidPaisa: rows.reduce((sum, row) => sum + row.paidPaisa, 0),
    totalRefundedPaisa: rows.reduce((sum, row) => sum + row.refundedPaisa, 0),
    totalReversedPaisa: rows.reduce((sum, row) => sum + row.reversedPaisa, 0),
    outstandingPaisa: rows.reduce((sum, row) => sum + row.balancePaisa, 0),
  };
}

export function buildAgingBucket(dueDate: Date | string | null, asOf: Date): "current" | "30" | "60" | "90" {
  if (!dueDate) return "current";
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const diffDays = Math.floor((asOf.getTime() - date.getTime()) / 86_400_000);
  if (diffDays >= 90) return "90";
  if (diffDays >= 60) return "60";
  if (diffDays >= 30) return "30";
  return "current";
}

function deriveChargeStatus(input: {
  payablePaisa: number;
  paidPaisa: number;
  reversedPaisa: number;
  originalAmountPaisa: number;
}): ChargeLedgerRow["status"] {
  if (input.reversedPaisa >= input.originalAmountPaisa) return "reversed";
  if (input.payablePaisa === 0) return "waived";
  if (input.paidPaisa >= input.payablePaisa) return "paid";
  if (input.paidPaisa > 0) return "partial";
  return "unpaid";
}

function sumAdjustments(items: LedgerAdjustmentInput[], key: "chargeId" | "paymentId") {
  const map = new Map<string, number>();
  for (const item of items) {
    const id = item[key];
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + item.amountPaisa);
  }
  return map;
}
```

- [ ] **Step 2: Add ledger tests**

Create `src/lib/server/finance/ledger.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { buildAgingBucket, buildChargeLedger, summarizeStudentLedger } from "./ledger";

describe("fee ledger arithmetic", () => {
  test("marks a partially paid charge as partial with remaining balance", () => {
    const rows = buildChargeLedger({
      charges: [{ id: "c1", amountPaisa: 10_000, dueDate: "2026-07-01", status: "open" }],
      payments: [{ id: "p1", amountPaisa: 4_000, status: "posted" }],
      allocations: [{ chargeId: "c1", paymentId: "p1", amountPaisa: 4_000 }],
      adjustments: [],
      asOf: new Date("2026-07-16T00:00:00Z"),
    });

    expect(rows[0]).toMatchObject({
      status: "partial",
      paidPaisa: 4_000,
      balancePaisa: 6_000,
    });
  });

  test("excludes reversed payments from paid amount", () => {
    const rows = buildChargeLedger({
      charges: [{ id: "c1", amountPaisa: 10_000, dueDate: null, status: "open" }],
      payments: [{ id: "p1", amountPaisa: 10_000, status: "reversed" }],
      allocations: [{ chargeId: "c1", paymentId: "p1", amountPaisa: 10_000 }],
      adjustments: [{ type: "payment_reversal", paymentId: "p1", amountPaisa: 10_000 }],
    });

    expect(rows[0]).toMatchObject({
      status: "unpaid",
      paidPaisa: 0,
      balancePaisa: 10_000,
    });
  });

  test("refund reduces effective paid amount", () => {
    const rows = buildChargeLedger({
      charges: [{ id: "c1", amountPaisa: 10_000, dueDate: null, status: "open" }],
      payments: [{ id: "p1", amountPaisa: 10_000, status: "partially_refunded" }],
      allocations: [{ chargeId: "c1", paymentId: "p1", amountPaisa: 10_000 }],
      adjustments: [{ type: "refund", paymentId: "p1", amountPaisa: 3_000 }],
    });

    expect(rows[0]).toMatchObject({
      status: "partial",
      paidPaisa: 7_000,
      refundedPaisa: 3_000,
      balancePaisa: 3_000,
    });
  });

  test("charge reversal closes an unpaid mistaken charge", () => {
    const rows = buildChargeLedger({
      charges: [{ id: "c1", amountPaisa: 10_000, dueDate: null, status: "reversed" }],
      payments: [],
      allocations: [],
      adjustments: [{ type: "charge_reversal", chargeId: "c1", amountPaisa: 10_000 }],
    });

    expect(rows[0]).toMatchObject({
      status: "reversed",
      reversedPaisa: 10_000,
      balancePaisa: 0,
    });
  });

  test("summarizes outstanding, refunded, and reversed balances", () => {
    const summary = summarizeStudentLedger({
      charges: [
        { id: "c1", amountPaisa: 10_000, dueDate: null, status: "open" },
        { id: "c2", amountPaisa: 5_000, dueDate: null, status: "reversed" },
      ],
      payments: [{ id: "p1", amountPaisa: 10_000, status: "partially_refunded" }],
      allocations: [{ chargeId: "c1", paymentId: "p1", amountPaisa: 10_000 }],
      adjustments: [
        { type: "refund", paymentId: "p1", amountPaisa: 2_000 },
        { type: "charge_reversal", chargeId: "c2", amountPaisa: 5_000 },
      ],
    });

    expect(summary).toMatchObject({
      totalChargedPaisa: 15_000,
      totalPaidPaisa: 8_000,
      totalRefundedPaisa: 2_000,
      totalReversedPaisa: 5_000,
      outstandingPaisa: 2_000,
    });
  });

  test("builds aging buckets", () => {
    const asOf = new Date("2026-07-16T00:00:00Z");
    expect(buildAgingBucket("2026-07-10", asOf)).toBe("current");
    expect(buildAgingBucket("2026-06-01", asOf)).toBe("30");
    expect(buildAgingBucket("2026-05-01", asOf)).toBe("60");
    expect(buildAgingBucket("2026-03-01", asOf)).toBe("90");
  });
});
```

- [ ] **Step 3: Run ledger tests**

Run:

```bash
bun test src/lib/server/finance/ledger.test.ts
```

Expected: all six tests pass.

---

### Task 3: Fee Service and API Routes

**Files:**
- Create: `src/lib/server/finance/service.ts`
- Create: `src/routes/api/fees/students.ts`
- Create: `src/routes/api/fees/students/$id/ledger.ts`
- Create: `src/routes/api/fees/charges.ts`
- Create: `src/routes/api/fees/charge-and-collect.ts`
- Create: `src/routes/api/fees/payments.ts`
- Create: `src/routes/api/fees/charges/$id/reverse.ts`
- Create: `src/routes/api/fees/payments/$id/reverse.ts`
- Create: `src/routes/api/fees/payments/$id/refund.ts`
- Create: `src/routes/api/fees/reports/daily-collection.ts`
- Create: `src/routes/api/fees/reports/outstanding-dues.ts`
- Create: `src/routes/api/fees/reports/student-ledger.ts`
- Create: `src/routes/api/fees/reports/institution-summary.ts`
- Create: `src/routes/api/fees/reports/reversal-refund-audit.ts`

**Interfaces:**
- Consumes: finance schema, ledger helpers, receipt numbering, permissions, and student event helper.
- Produces: backend API contract used by fee pages and reports.

- [ ] **Step 1: Define Zod schemas and service exports**

Create `src/lib/server/finance/service.ts` with exported schemas and function names:

```ts
import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  feeAdjustments,
  feeCharges,
  feePaymentAllocations,
  feePayments,
  type FeeChargeType,
  type FeePaymentMethod,
} from "@/db/schema/finance";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { guardians, studentEnrollments, studentGuardians, students } from "@/db/schema/students";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import { insertStudentEvent } from "@/lib/server/students/events";
import type { ModuleKey } from "@/lib/permissions/module-registry";
import { buildChargeLedger, summarizeStudentLedger } from "./ledger";
import { nextFinanceNumber } from "./numbering";

const paymentMethods = ["cash", "bank", "online", "cheque", "other"] as const;
const chargeTypes = ["monthly", "admission", "exam", "transport", "custom"] as const;
const systems = ["school", "madrassa"] as const;

export const feeStudentListQuerySchema = z.object({
  system: z.enum(systems),
  q: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "graduated", "left"]).optional(),
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
  allocations: z.array(z.object({ chargeId: z.string().trim().min(1), amountPaisa: z.number().int().positive() })).min(1),
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
});
```

Do not add throwing service stubs. Add each exported function in the step that implements its behavior.

- [ ] **Step 2: Implement permission and active enrollment helpers**

In `src/lib/server/finance/service.ts`, add helpers below the schemas:

```ts
type FeeSystem = "school" | "madrassa";
type FeeTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function feeModuleForSystem(system: FeeSystem): ModuleKey {
  return system === "madrassa" ? "madrassa_fees" : "school_fees";
}

async function requireFinanceReportPermission(request: Request) {
  return requirePermission(request, "finance", "view");
}

async function getActiveEnrollmentContext(studentId: string) {
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
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .leftJoin(studentGuardians, and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true)))
    .leftJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
    .where(and(eq(students.id, studentId), isNull(studentEnrollments.endedAt), eq(studentEnrollments.status, "active")))
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
  return value ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : null;
}
```

- [ ] **Step 3: Add charge and payment mutations**

Add `createFeeCharge`, `collectFeePayment`, and `chargeAndCollect` with transactional implementations:

```ts
export async function createFeeCharge(request: Request, input: z.infer<typeof createFeeChargeSchema>) {
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

    return { charge };
  });
}

export async function collectFeePayment(request: Request, input: z.infer<typeof collectFeePaymentSchema>) {
  const context = await getActiveEnrollmentContext(input.studentId);
  const actor = await requirePermission(request, feeModuleForSystem(context.system), "create");

  return db.transaction(async (tx) => {
    const chargeIds = input.allocations.map((item) => item.chargeId);
    const charges = await tx.select().from(feeCharges).where(inArray(feeCharges.id, chargeIds));
    if (charges.length !== chargeIds.length) throw new HttpError("One or more charges were not found", 404);
    if (charges.some((charge) => charge.studentId !== context.studentId)) {
      throw new HttpError("All charges must belong to the selected student", 400);
    }
    if (charges.some((charge) => charge.status === "reversed")) {
      throw new HttpError("Cannot collect payment against reversed charges", 400);
    }

    const existingAllocations = await tx
      .select()
      .from(feePaymentAllocations)
      .innerJoin(feePayments, eq(feePayments.id, feePaymentAllocations.paymentId))
      .where(inArray(feePaymentAllocations.chargeId, chargeIds));
    const adjustments = await tx.select().from(feeAdjustments).where(inArray(feeAdjustments.chargeId, chargeIds));
    const rows = buildChargeLedger({
      charges,
      payments: existingAllocations.map((row) => row.fee_payments),
      allocations: existingAllocations.map((row) => row.fee_payment_allocations),
      adjustments,
    });
    const balanceByCharge = new Map(rows.map((row) => [row.chargeId, row.balancePaisa]));

    for (const allocation of input.allocations) {
      const balance = balanceByCharge.get(allocation.chargeId) ?? 0;
      if (allocation.amountPaisa > balance) throw new HttpError("Payment cannot exceed outstanding charge balance", 400);
    }

    const amountPaisa = input.allocations.reduce((sum, allocation) => sum + allocation.amountPaisa, 0);
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
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
        receivedByUserId: actor.id,
        payerName: input.payerName || null,
        payerPhone: input.payerPhone || null,
        notes: input.notes || null,
      })
      .returning();

    await tx.insert(feePaymentAllocations).values(
      input.allocations.map((allocation) => ({
        id: randomUUID(),
        paymentId: payment.id,
        chargeId: allocation.chargeId,
        amountPaisa: allocation.amountPaisa,
      })),
    );

    await insertStudentEvent(tx, {
      studentId: context.studentId,
      enrollmentId: context.enrollmentId,
      type: "fee_payment_recorded",
      message: `Fee payment received: ${receiptNo}`,
      metadata: { paymentId: payment.id, receiptNo, amountPaisa, method: payment.method },
      actorUserId: actor.id,
    });

    return { payment };
  });
}

export async function chargeAndCollect(request: Request, input: z.infer<typeof chargeAndCollectSchema>) {
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
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
        receivedByUserId: actor.id,
        payerName: input.payerName || null,
        payerPhone: input.payerPhone || null,
        notes: input.notes || null,
      })
      .returning();

    await tx.insert(feePaymentAllocations).values({
      id: randomUUID(),
      paymentId: payment.id,
      chargeId: charge.id,
      amountPaisa: input.amountPaisa,
    });

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
      metadata: { paymentId: payment.id, receiptNo, amountPaisa: payment.amountPaisa, method: payment.method },
      actorUserId: actor.id,
    });

    return { charge, payment };
  });
}
```

After this step, run `bunx tsc --noEmit --pretty false`. Fix compile errors before continuing.

- [ ] **Step 4: Implement ledger query and student search**

Implement `listFeeStudents` and `getStudentFeeLedger` using the same joins as `getActiveEnrollmentContext`. `listFeeStudents` must respect `system`, `q`, `institutionId`, `programId`, `classId`, and `subcategoryId`, then attach `summary` from `summarizeStudentLedger`. `getStudentFeeLedger` must return:

```ts
{
  student: {
    id: string;
    name: string;
    nameUrdu: string;
    fatherName: string;
    rollNo: string;
    admissionNo: string;
    system: "school" | "madrassa";
    institutionName: string;
    institutionNameUrdu: string;
    groupLabel: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
  };
  charges: Array<typeof feeCharges.$inferSelect & { ledger: ChargeLedgerRow }>;
  payments: Array<typeof feePayments.$inferSelect & { allocations: Array<typeof feePaymentAllocations.$inferSelect> }>;
  adjustments: Array<typeof feeAdjustments.$inferSelect>;
  summary: ReturnType<typeof summarizeStudentLedger>;
}
```

Use `requirePermission(request, feeModuleForSystem(system), "view")` for both functions.

- [ ] **Step 5: Implement reversal and refund mutations**

Implement these rules:

- `reverseFeeCharge`: allowed only when the target charge has `paidPaisa === 0`. Insert `feeAdjustments` with `type: "charge_reversal"`, set `feeCharges.status = "reversed"`, set `reversedAt`, set `reversedByUserId`, and write `fee_charge_reversed` event.
- `reverseFeePayment`: allowed only for `posted` or `partially_refunded` payment. Set `feePayments.status = "reversed"`, insert `feeAdjustments` with `type: "payment_reversal"`, and write `fee_payment_reversed` event.
- `refundFeePayment`: allowed only for non-reversed payment. Refund total for a payment cannot exceed `payment.amountPaisa` minus previous refund adjustments. Insert `feeAdjustments` with `type: "refund"`, update payment status to `partially_refunded` or `refunded`, generate `RF` number in adjustment metadata, and write `fee_refund_recorded` event.

After this step, run `bunx tsc --noEmit --pretty false`. Fix compile errors before continuing.

- [ ] **Step 6: Implement report functions**

Implement report functions from ledger tables:

- `getDailyCollectionReport`: payments by date range, method, user, gross collected, reversals, refunds, net collected, receipt rows.
- `getOutstandingDuesReport`: student rows with current, 30+, 60+, 90+ buckets and total outstanding.
- `getInstitutionSummaryReport`: institution-level totals for charges, collected, reversed, refunded, outstanding.
- `getReversalRefundAuditReport`: adjustment rows where type is `charge_reversal`, `payment_reversal`, or `refund`.

All report functions must call `requireFinanceReportPermission(request)`.

- [ ] **Step 7: Create API route files**

Each route follows this pattern:

```ts
import { createFileRoute } from "@tanstack/react-router";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";
import { createFeeCharge, createFeeChargeSchema } from "@/lib/server/finance/service";

export const Route = createFileRoute("/api/fees/charges")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, createFeeChargeSchema);
        if (!body.ok) return body.response;

        try {
          return json(await createFeeCharge(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create fee charge");
        }
      },
    },
  },
});
```

Create the route files listed in this task and wire each file to the corresponding service function. GET routes parse query params with `safeParse(Object.fromEntries(url.searchParams))` and return `json({ error: "Invalid query", issues }, 400)` on invalid query.

- [ ] **Step 8: Verify Task 3**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors.

---

### Task 4: Shared Fee UI Components

**Files:**
- Create: `src/components/fees/fee-types.ts`
- Create: `src/components/fees/fee-api.ts`
- Create: `src/components/fees/fee-dialogs.tsx`
- Create: `src/components/fees/fee-workspace.tsx`

**Interfaces:**
- Consumes: API routes from Task 3.
- Produces: reusable fee UI for `/school/fees` and `/madrassa/fees`.

- [ ] **Step 1: Add frontend DTO types**

Create `src/components/fees/fee-types.ts`:

```ts
export type FeeSystem = "school" | "madrassa";
export type FeeChargeType = "monthly" | "admission" | "exam" | "transport" | "custom";
export type FeePaymentMethod = "cash" | "bank" | "online" | "cheque" | "other";

export type FeeStudentSummary = {
  totalChargedPaisa: number;
  totalConcessionPaisa: number;
  totalPaidPaisa: number;
  totalRefundedPaisa: number;
  totalReversedPaisa: number;
  outstandingPaisa: number;
};

export type FeeStudent = {
  id: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  rollNo: string;
  admissionNo: string;
  system: FeeSystem;
  institutionName: string;
  institutionNameUrdu: string;
  groupLabel: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  summary: FeeStudentSummary;
};

export type FeeCharge = {
  id: string;
  type: FeeChargeType;
  label: string;
  period: string | null;
  amountPaisa: number;
  dueDate: string | null;
  status: string;
  notes: string | null;
  ledger: {
    paidPaisa: number;
    refundedPaisa: number;
    concessionPaisa: number;
    reversedPaisa: number;
    balancePaisa: number;
    status: string;
    agingBucket: "current" | "30" | "60" | "90";
  };
};

export type FeePayment = {
  id: string;
  receiptNo: string;
  amountPaisa: number;
  method: FeePaymentMethod;
  status: string;
  receivedAt: string;
  payerName: string | null;
  payerPhone: string | null;
  notes: string | null;
  allocations: Array<{ id: string; chargeId: string; amountPaisa: number }>;
};

export type FeeAdjustment = {
  id: string;
  type: string;
  amountPaisa: number;
  reason: string;
  method: FeePaymentMethod | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type FeeLedgerPayload = {
  student: FeeStudent;
  charges: FeeCharge[];
  payments: FeePayment[];
  adjustments: FeeAdjustment[];
  summary: FeeStudentSummary;
};
```

- [ ] **Step 2: Add fetch helpers**

Create `src/components/fees/fee-api.ts` with helpers:

```ts
import type { FeeLedgerPayload, FeePaymentMethod, FeeStudent, FeeSystem, FeeChargeType } from "./fee-types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload as T;
}

export function listFeeStudents(system: FeeSystem, q: string) {
  const params = new URLSearchParams({ system });
  if (q.trim()) params.set("q", q.trim());
  return requestJson<{ students: FeeStudent[] }>(`/api/fees/students?${params}`);
}

export function getFeeLedger(system: FeeSystem, studentId: string) {
  return requestJson<FeeLedgerPayload>(`/api/fees/students/${studentId}/ledger?system=${system}`);
}

export function createCharge(input: {
  studentId: string;
  type: FeeChargeType;
  label: string;
  amountPaisa: number;
  dueDate?: string;
  period?: string;
  notes?: string;
}) {
  return requestJson("/api/fees/charges", { method: "POST", body: JSON.stringify(input) });
}

export function chargeAndCollect(input: Parameters<typeof createCharge>[0] & {
  method: FeePaymentMethod;
  receivedAt?: string;
  payerName?: string;
  payerPhone?: string;
}) {
  return requestJson("/api/fees/charge-and-collect", { method: "POST", body: JSON.stringify(input) });
}

export function collectPayment(input: {
  studentId: string;
  allocations: Array<{ chargeId: string; amountPaisa: number }>;
  method: FeePaymentMethod;
  receivedAt?: string;
  payerName?: string;
  payerPhone?: string;
  notes?: string;
}) {
  return requestJson("/api/fees/payments", { method: "POST", body: JSON.stringify(input) });
}

export function reverseCharge(chargeId: string, reason: string) {
  return requestJson(`/api/fees/charges/${chargeId}/reverse`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function reversePayment(paymentId: string, reason: string) {
  return requestJson(`/api/fees/payments/${paymentId}/reverse`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function refundPayment(paymentId: string, input: { amountPaisa: number; method: FeePaymentMethod; reason: string }) {
  return requestJson(`/api/fees/payments/${paymentId}/refund`, { method: "POST", body: JSON.stringify(input) });
}
```

- [ ] **Step 3: Add dialogs**

Create `src/components/fees/fee-dialogs.tsx` exporting:

- `ChargeDialog`
- `CollectPaymentDialog`
- `ReverseDialog`
- `RefundDialog`
- `FeeReceiptDialog`

Use `ResponsiveDialog` for charge, collect, and receipt. Use `AlertDialog` for reverse/refund confirmations. All destructive financial actions require a non-empty reason field before the confirmation action button is enabled.

Dialog props:

```ts
type BaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};
```

`ChargeDialog` consumes `student: FeeStudent | null`. `CollectPaymentDialog` consumes `ledger: FeeLedgerPayload | null`. `FeeReceiptDialog` consumes `payment: FeePayment | null` and `ledger: FeeLedgerPayload | null`. `ReverseDialog` consumes `target: { kind: "charge" | "payment"; id: string; label: string } | null`. `RefundDialog` consumes `payment: FeePayment | null`.

- [ ] **Step 4: Add shared workspace**

Create `src/components/fees/fee-workspace.tsx` exporting:

```tsx
export function FeeWorkspace({ system }: { system: "school" | "madrassa" }) {
  // load students with listFeeStudents(system, q)
  // select first student by default
  // load selected ledger with getFeeLedger(system, selected.id)
  // render KPI cards, search, student list, outstanding charges, receipts, and actions
}
```

Required UI behavior:

- KPI cards: total charged, collected, refunded, outstanding.
- Search by roll/name/guardian phone.
- Student list includes roll number, Urdu name, group label, guardian phone, outstanding balance.
- Outstanding table includes label, type, due date, paid, balance, status, actions.
- Receipt history includes receipt number, date, method, amount, status, actions.
- Actions: `Create Charge`, `Charge + Collect Now`, `Collect Payment`, `Print Receipt`, `Reverse`, `Refund`.
- Use `formatPKR` from `src/lib/formatters.ts` for paisa values.

- [ ] **Step 5: Verify Task 4**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors.

---

### Task 5: Replace School and Madrassa Fee Pages

**Files:**
- Modify: `src/routes/_authenticated/school/fees.tsx`
- Modify: `src/routes/_authenticated/madrassa/fees.tsx`

**Interfaces:**
- Consumes: `FeeWorkspace` from Task 4.
- Produces: backend-backed fee pages for school and madrassa.

- [ ] **Step 1: Replace school fees page**

Replace mock-driven contents of `src/routes/_authenticated/school/fees.tsx` with:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { FeeWorkspace } from "@/components/fees/fee-workspace";

export const Route = createFileRoute("/_authenticated/school/fees")({
  component: SchoolFeesPage,
});

function SchoolFeesPage() {
  return <FeeWorkspace system="school" />;
}
```

- [ ] **Step 2: Replace madrassa fees page**

Replace mock-driven contents of `src/routes/_authenticated/madrassa/fees.tsx` with:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { FeeWorkspace } from "@/components/fees/fee-workspace";

export const Route = createFileRoute("/_authenticated/madrassa/fees")({
  component: MadrassaFeesPage,
});

function MadrassaFeesPage() {
  return <FeeWorkspace system="madrassa" />;
}
```

- [ ] **Step 3: Verify Task 5**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors.

---

### Task 6: Detailed Finance Reports UI

**Files:**
- Create: `src/routes/_authenticated/finance/reports.tsx`
- Modify: `src/lib/nav-config.ts`

**Interfaces:**
- Consumes: report API routes from Task 3.
- Produces: report page with five V1 reports.

- [ ] **Step 1: Add nav item and title**

Modify `src/lib/nav-config.ts`:

```ts
{ group: "shared", url: "/finance/reports", icon: BarChart3, en: "Finance Reports", ur: "مالی رپورٹس", roles: ADMINS },
```

Add page title:

```ts
"/finance/reports": { en: "Finance Reports", ur: "مالی رپورٹس" },
```

- [ ] **Step 2: Create reports route**

Create `src/routes/_authenticated/finance/reports.tsx` with:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, Download, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPKR } from "@/lib/formatters";

export const Route = createFileRoute("/_authenticated/finance/reports")({
  component: FinanceReportsPage,
});

type ReportKey = "daily" | "dues" | "student" | "institution" | "audit";

function FinanceReportsPage() {
  const [report, setReport] = useState<ReportKey>("daily");
  const [system, setSystem] = useState("both");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState("");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpointByReport: Record<ReportKey, string> = {
        daily: "/api/fees/reports/daily-collection",
        dues: "/api/fees/reports/outstanding-dues",
        student: "/api/fees/reports/student-ledger",
        institution: "/api/fees/reports/institution-summary",
        audit: "/api/fees/reports/reversal-refund-audit",
      };
      const params = new URLSearchParams({ system, dateFrom, dateTo });
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch(`${endpointByReport[report]}?${params}`, { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load report");
      setData(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, q, report, system]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Finance Reports"
        titleUrdu="مالی رپورٹس"
        description="Collection, dues, student ledger, institution summary, and reversal/refund audit reports."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        }
      />
      <Card className="mb-4 p-3">
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search student, receipt, or actor..." className="pe-9" />
          </div>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Tabs value={report} onValueChange={(value) => setReport(value as ReportKey)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="dues">Dues</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="institution">Institution</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={system} onValueChange={setSystem}>
            <TabsList>
              <TabsTrigger value="both">Both</TabsTrigger>
              <TabsTrigger value="school">School</TabsTrigger>
              <TabsTrigger value="madrassa">Madrassa</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>
      <ReportContent report={report} data={data} loading={loading} />
    </div>
  );
}
```

Add `ReportContent` in the same file and render the report-specific columns described in the next step. Use `formatPKR` for all paisa values and show an empty table row when a report returns no rows.

- [ ] **Step 3: Report UI requirements**

The final reports route must render:

- Daily Collection: receipt number, date, student, method, gross amount, refunded amount, net amount.
- Outstanding Dues: student, institution, group, current, 30+, 60+, 90+, total.
- Student Ledger: search field and ledger rows for a selected student.
- Institution Summary: institution, charges, collected, reversed, refunded, outstanding.
- Reversal/Refund Audit: date, actor, type, original reference, amount, reason.

- [ ] **Step 4: Verify Task 6**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors.

---

### Task 7: Student Timeline Finance Events

**Files:**
- Modify: `src/components/students/student-timeline.tsx`

**Interfaces:**
- Consumes: fee event types from Task 1 and fee service event metadata from Task 3.
- Produces: finance timeline filtering and icons.

- [ ] **Step 1: Add finance category**

Modify `TimelineCategory`:

```ts
type TimelineCategory = "all" | "admission" | "academic" | "guardian" | "sibling" | "account" | "status" | "finance";
```

Import `Banknote` from `lucide-react`.

- [ ] **Step 2: Map fee events to finance**

Add to `eventCategories`:

```ts
fee_charge_created: "finance",
fee_payment_recorded: "finance",
fee_charge_reversed: "finance",
fee_payment_reversed: "finance",
fee_refund_recorded: "finance",
fee_adjustment_recorded: "finance",
```

Add filter:

```ts
{ value: "finance", label: "Finance" },
```

Add icon:

```ts
finance: Banknote,
```

Update `countByCategory` initial object with `finance: 0`.

- [ ] **Step 3: Verify Task 7**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors.

---

### Task 8: Final Verification

**Files:**
- Modify only files from Tasks 1-7 if verification reveals issues.

**Interfaces:**
- Consumes: completed schema, service, APIs, UI, reports, and timeline integration.
- Produces: verified Fee Module V1 implementation.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
bun test src/lib/server/finance/ledger.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Check whitespace**

Run:

```bash
git diff --check -- src/db src/lib/server/finance src/routes/api/fees src/components/fees src/routes/_authenticated/school/fees.tsx src/routes/_authenticated/madrassa/fees.tsx src/routes/_authenticated/finance/reports.tsx src/components/students/student-timeline.tsx src/lib/nav-config.ts
```

Expected: no whitespace errors.

- [ ] **Step 3: Run TypeScript**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: command exits successfully.

- [ ] **Step 4: Run lint**

Run:

```bash
bun run lint
```

Expected: command exits successfully.

- [ ] **Step 5: Run production build**

Run:

```bash
bun run build
```

Expected: command exits successfully. The existing Vite `vite-tsconfig-paths` warning may appear and is not part of this task.

- [ ] **Step 6: Migration check**

Run:

```bash
bun run db:generate
```

Expected: no uncommitted schema drift after the migration generated in Task 1. If Drizzle creates a second migration, inspect schema differences and fold the missing change into Task 1.

- [ ] **Step 7: Manual API smoke checks with a running Postgres**

With Postgres reachable and migrations applied, use authenticated browser/API session to verify:

- Create charge for a school student.
- Collect partial payment.
- Collect remaining payment.
- Print receipt.
- Reverse an unpaid mistaken charge.
- Reverse a mistaken payment.
- Refund part of a payment.
- Load each finance report.
- Open student profile and confirm finance events appear under the Finance timeline filter.
