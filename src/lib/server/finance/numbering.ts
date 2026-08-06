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
