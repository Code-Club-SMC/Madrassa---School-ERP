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

export type ChargeLedgerInput = {
  charges: LedgerChargeInput[];
  payments: LedgerPaymentInput[];
  allocations: LedgerAllocationInput[];
  adjustments: LedgerAdjustmentInput[];
  asOf?: Date;
};

export type StudentLedgerSummary = {
  totalChargedPaisa: number;
  totalConcessionPaisa: number;
  totalPaidPaisa: number;
  totalRefundedPaisa: number;
  totalReversedPaisa: number;
  outstandingPaisa: number;
};

type AllocationWithOrder = LedgerAllocationInput & {
  order: number;
};

export function buildChargeLedger(input: ChargeLedgerInput): ChargeLedgerRow[] {
  validateLedgerInput(input);

  const asOf = input.asOf ?? new Date();
  const paymentStatus = new Map(input.payments.map((payment) => [payment.id, payment.status]));
  const reversedPaymentIds = new Set(
    input.adjustments
      .filter((adjustment) => adjustment.type === "payment_reversal" && adjustment.paymentId)
      .map((adjustment) => adjustment.paymentId as string),
  );
  const activeAllocations = input.allocations
    .map((allocation, order) => ({ ...allocation, order }))
    .filter((allocation) => paymentStatus.get(allocation.paymentId) !== "reversed")
    .filter((allocation) => !reversedPaymentIds.has(allocation.paymentId));

  const allocatedByCharge = sumAmounts(activeAllocations, "chargeId");
  const refundByPayment = sumAdjustments(
    input.adjustments.filter((adjustment) => adjustment.type === "refund"),
    "paymentId",
  );
  const refundedByCharge = distributeRefundsByCharge(activeAllocations, refundByPayment);
  const concessionByCharge = sumAdjustments(
    input.adjustments.filter(
      (adjustment) =>
        adjustment.type === "concession" ||
        adjustment.type === "waiver" ||
        adjustment.type === "correction",
    ),
    "chargeId",
  );
  const reversalByCharge = sumAdjustments(
    input.adjustments.filter((adjustment) => adjustment.type === "charge_reversal"),
    "chargeId",
  );

  return input.charges.map((charge) => {
    const allocatedPaisa = allocatedByCharge.get(charge.id) ?? 0;
    const refundedPaisa = refundedByCharge.get(charge.id) ?? 0;
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
      status: deriveChargeStatus({
        originalAmountPaisa: charge.amountPaisa,
        paidPaisa,
        payablePaisa,
        reversedPaisa,
      }),
      agingBucket: buildAgingBucket(charge.dueDate, asOf),
    };
  });
}

export function summarizeStudentLedger(input: ChargeLedgerInput): StudentLedgerSummary {
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

export function buildAgingBucket(
  dueDate: Date | string | null,
  asOf: Date,
): ChargeLedgerRow["agingBucket"] {
  if (!dueDate) return "current";

  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const diffDays = Math.floor((asOf.getTime() - date.getTime()) / 86_400_000);

  if (diffDays >= 90) return "90";
  if (diffDays >= 60) return "60";
  if (diffDays >= 30) return "30";
  return "current";
}

function deriveChargeStatus(input: {
  originalAmountPaisa: number;
  paidPaisa: number;
  payablePaisa: number;
  reversedPaisa: number;
}): ChargeLedgerRow["status"] {
  if (input.originalAmountPaisa > 0 && input.reversedPaisa >= input.originalAmountPaisa)
    return "reversed";
  if (input.payablePaisa === 0) return "waived";
  if (input.paidPaisa >= input.payablePaisa) return "paid";
  if (input.paidPaisa > 0) return "partial";
  return "unpaid";
}

function distributeRefundsByCharge(
  allocations: AllocationWithOrder[],
  refundByPayment: Map<string, number>,
): Map<string, number> {
  const refundedByCharge = new Map<string, number>();
  const allocationsByPayment = groupAllocationsByPayment(allocations);

  for (const [paymentId, paymentAllocations] of allocationsByPayment) {
    const refundPaisa = refundByPayment.get(paymentId) ?? 0;
    if (refundPaisa <= 0) continue;

    const allocationTotalPaisa = paymentAllocations.reduce(
      (sum, allocation) => sum + allocation.amountPaisa,
      0,
    );
    if (allocationTotalPaisa <= 0) continue;

    const boundedRefundPaisa = Math.min(refundPaisa, allocationTotalPaisa);
    const shares = paymentAllocations.map((allocation) => {
      const numerator = BigInt(allocation.amountPaisa) * BigInt(boundedRefundPaisa);
      const denominator = BigInt(allocationTotalPaisa);

      return {
        chargeId: allocation.chargeId,
        order: allocation.order,
        refundedPaisa: Number(numerator / denominator),
        remainder: numerator % denominator,
      };
    });
    const distributedPaisa = shares.reduce((sum, share) => sum + share.refundedPaisa, 0);
    let remainingPaisa = boundedRefundPaisa - distributedPaisa;

    for (const share of shares) {
      incrementMap(refundedByCharge, share.chargeId, share.refundedPaisa);
    }

    // Largest-remainder distribution keeps prorated refunds exact without floating point math.
    shares.sort((left, right) => {
      if (left.remainder === right.remainder) return left.order - right.order;
      return left.remainder > right.remainder ? -1 : 1;
    });

    for (const share of shares) {
      if (remainingPaisa <= 0) break;
      incrementMap(refundedByCharge, share.chargeId, 1);
      remainingPaisa -= 1;
    }
  }

  return refundedByCharge;
}

function groupAllocationsByPayment(allocations: AllocationWithOrder[]) {
  const map = new Map<string, AllocationWithOrder[]>();

  for (const allocation of allocations) {
    const paymentAllocations = map.get(allocation.paymentId) ?? [];
    paymentAllocations.push(allocation);
    map.set(allocation.paymentId, paymentAllocations);
  }

  return map;
}

function sumAdjustments(items: LedgerAdjustmentInput[], key: "chargeId" | "paymentId") {
  const map = new Map<string, number>();

  for (const item of items) {
    const id = item[key];
    if (!id) continue;
    incrementMap(map, id, item.amountPaisa);
  }

  return map;
}

function sumAmounts<T extends { amountPaisa: number }>(
  items: T[],
  key: keyof T,
): Map<Extract<T[keyof T], string>, number> {
  const map = new Map<Extract<T[keyof T], string>, number>();

  for (const item of items) {
    const id = item[key];
    if (typeof id !== "string") continue;
    map.set(
      id as Extract<T[keyof T], string>,
      (map.get(id as Extract<T[keyof T], string>) ?? 0) + item.amountPaisa,
    );
  }

  return map;
}

function incrementMap(map: Map<string, number>, key: string, amountPaisa: number) {
  map.set(key, (map.get(key) ?? 0) + amountPaisa);
}

function validateLedgerInput(input: ChargeLedgerInput) {
  for (const charge of input.charges) {
    assertPaisaAmount(charge.amountPaisa, `charge ${charge.id}`);
  }

  for (const payment of input.payments) {
    assertPaisaAmount(payment.amountPaisa, `payment ${payment.id}`);
  }

  for (const allocation of input.allocations) {
    assertPaisaAmount(
      allocation.amountPaisa,
      `allocation ${allocation.paymentId}:${allocation.chargeId}`,
    );
  }

  for (const adjustment of input.adjustments) {
    assertPaisaAmount(adjustment.amountPaisa, `adjustment ${adjustment.type}`);
  }
}

function assertPaisaAmount(amountPaisa: number, label: string) {
  if (!Number.isSafeInteger(amountPaisa) || amountPaisa < 0) {
    throw new TypeError(`${label} amountPaisa must be a non-negative safe integer`);
  }
}
