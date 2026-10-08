import { eq, like } from "drizzle-orm";
import { db } from "@/db";
import { feeAdjustments, feePayments, financeNumberSequences } from "@/db/schema/finance";

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

  // 1. Gather all existing receipt/refund numbers matching the prefix & year across the database
  const usedNumbers = new Set<string>();
  let maxExistingNumber = 0;

  if (scope.type === "fee_receipt") {
    const existingPayments = await tx
      .select({ receiptNo: feePayments.receiptNo })
      .from(feePayments)
      .where(like(feePayments.receiptNo, `${scope.prefix}-${year}-%`));

    for (const p of existingPayments) {
      if (!p.receiptNo) continue;
      usedNumbers.add(p.receiptNo);
      const match = p.receiptNo.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxExistingNumber) {
          maxExistingNumber = num;
        }
      }
    }
  } else if (scope.type === "refund_receipt") {
    const existingAdjustments = await tx
      .select({ metadata: feeAdjustments.metadata })
      .from(feeAdjustments);

    for (const adj of existingAdjustments) {
      const refNo = (adj.metadata as Record<string, unknown> | undefined)?.refundNo;
      if (typeof refNo === "string" && refNo.startsWith(`${scope.prefix}-${year}-`)) {
        usedNumbers.add(refNo);
        const match = refNo.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxExistingNumber) {
            maxExistingNumber = num;
          }
        }
      }
    }
  }

  // 2. Query the sequence record for this scope
  const [existingSeq] = await tx
    .select({ currentValue: financeNumberSequences.currentValue })
    .from(financeNumberSequences)
    .where(eq(financeNumberSequences.id, id))
    .limit(1);

  // 3. The next sequence value must be strictly higher than both the sequence counter and any existing record in the DB
  let nextValue = Math.max(existingSeq?.currentValue ?? 0, maxExistingNumber) + 1;

  // 4. Double check candidate does not collide with any used number
  let candidate = `${scope.prefix}-${year}-${nextValue.toString().padStart(4, "0")}`;
  while (usedNumbers.has(candidate)) {
    nextValue++;
    candidate = `${scope.prefix}-${year}-${nextValue.toString().padStart(4, "0")}`;
  }

  // 5. Upsert the sequence record with the new current value
  await tx
    .insert(financeNumberSequences)
    .values({
      id,
      year,
      type: scope.type,
      institutionId: scope.institutionId,
      prefix: scope.prefix,
      currentValue: nextValue,
    })
    .onConflictDoUpdate({
      target: financeNumberSequences.id,
      set: {
        currentValue: nextValue,
        updatedAt: new Date(),
      },
    });

  return candidate;
}
