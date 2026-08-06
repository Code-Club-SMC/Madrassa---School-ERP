import { buildAgingBucket, buildChargeLedger, summarizeStudentLedger } from "./ledger";

// Keep Bun's runtime test module out of project-wide tsc resolution; tsconfig does not include Bun types.
const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

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

  test("distributes payment refunds with integer paisa remainders", () => {
    const rows = buildChargeLedger({
      charges: [
        { id: "c1", amountPaisa: 1, dueDate: null, status: "open" },
        { id: "c2", amountPaisa: 2, dueDate: null, status: "open" },
        { id: "c3", amountPaisa: 2, dueDate: null, status: "open" },
      ],
      payments: [{ id: "p1", amountPaisa: 5, status: "partially_refunded" }],
      allocations: [
        { chargeId: "c1", paymentId: "p1", amountPaisa: 1 },
        { chargeId: "c2", paymentId: "p1", amountPaisa: 2 },
        { chargeId: "c3", paymentId: "p1", amountPaisa: 2 },
      ],
      adjustments: [{ type: "refund", paymentId: "p1", amountPaisa: 3 }],
    });

    expect(rows.map((row) => row.refundedPaisa)).toEqual([1, 1, 1]);
    expect(rows.map((row) => row.paidPaisa)).toEqual([0, 1, 1]);
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

  test("summarizes outstanding, refunded, reversed, and concession balances", () => {
    const summary = summarizeStudentLedger({
      charges: [
        { id: "c1", amountPaisa: 10_000, dueDate: null, status: "open" },
        { id: "c2", amountPaisa: 5_000, dueDate: null, status: "reversed" },
        { id: "c3", amountPaisa: 6_000, dueDate: null, status: "open" },
      ],
      payments: [{ id: "p1", amountPaisa: 10_000, status: "partially_refunded" }],
      allocations: [{ chargeId: "c1", paymentId: "p1", amountPaisa: 10_000 }],
      adjustments: [
        { type: "refund", paymentId: "p1", amountPaisa: 2_000 },
        { type: "charge_reversal", chargeId: "c2", amountPaisa: 5_000 },
        { type: "concession", chargeId: "c3", amountPaisa: 1_000 },
      ],
    });

    expect(summary).toEqual({
      totalChargedPaisa: 21_000,
      totalConcessionPaisa: 1_000,
      totalPaidPaisa: 8_000,
      totalRefundedPaisa: 2_000,
      totalReversedPaisa: 5_000,
      outstandingPaisa: 7_000,
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
