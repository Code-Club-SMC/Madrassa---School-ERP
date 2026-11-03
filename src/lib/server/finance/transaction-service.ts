import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import { feePayments } from "@/db/schema/finance";
import { saveDonation, type DonationType } from "@/lib/server/finance/donations-service";
import { recordAuditLog } from "@/lib/server/audit/audit-service";
import { getRequestUser } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import {
  CATEGORY_META,
  type ComprehensiveTransaction,
  type TransactionCategory,
} from "@/lib/finance/comprehensive-reports";

export const transactionInputSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(1),
  categoryUrdu: z.string().trim().optional(),
  amount: z.coerce.number().positive(),
  date: z.string().trim().min(1), // YYYY-MM-DD
  source: z.string().trim().optional(),
  sourceUrdu: z.string().trim().optional(),
  description: z.string().trim().optional(),
  descriptionUrdu: z.string().trim().optional(),
  system: z.enum(["school", "madrassa", "both"]).default("both"),
  paymentMethod: z.enum(["cash", "bank", "online", "cheque"]).default("cash"),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

function getExpensesFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "finance-expenses.json"),
    path.join(process.cwd(), ".output", "public", "finance-expenses.json"),
  ];
}

function getFeePaymentsFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "finance-fee-payments.json"),
    path.join(process.cwd(), ".output", "public", "finance-fee-payments.json"),
  ];
}

function safeReadJsonArray<T>(filePath: string): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function safeWriteJsonArray<T>(filePaths: string[], data: T[]): void {
  for (const filePath of filePaths) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {}
  }
}

/**
 * Appends a fee payment transaction to local JSON backups so it is never lost.
 */
export function syncPaymentToFile(paymentTx: ComprehensiveTransaction): void {
  const current = safeReadJsonArray<ComprehensiveTransaction>(getFeePaymentsFilePaths()[0]);
  const exists = current.some((p) => p.id === paymentTx.id || p.voucherNo === paymentTx.voucherNo);
  const updated = exists
    ? current.map((p) => (p.id === paymentTx.id ? paymentTx : p))
    : [paymentTx, ...current];
  safeWriteJsonArray(getFeePaymentsFilePaths(), updated);
}

/**
 * Appends an expense transaction to local JSON backups.
 */
export function syncExpenseToFile(expenseTx: ComprehensiveTransaction): void {
  const current = safeReadJsonArray<ComprehensiveTransaction>(getExpensesFilePaths()[0]);
  const exists = current.some((e) => e.id === expenseTx.id || e.voucherNo === expenseTx.voucherNo);
  const updated = exists
    ? current.map((e) => (e.id === expenseTx.id ? expenseTx : e))
    : [expenseTx, ...current];
  safeWriteJsonArray(getExpensesFilePaths(), updated);
}

/**
 * Maps raw form category string to a canonical ComprehensiveTransaction category.
 */
function mapToCanonicalCategory(type: "income" | "expense", rawCat: string): TransactionCategory {
  const lower = rawCat.toLowerCase();
  if (type === "income") {
    if (lower.includes("zakat")) return "donation_zakat";
    if (lower.includes("sadqa") || lower.includes("charity") || lower.includes("khairat")) return "donation_sadqa";
    if (lower.includes("fitra")) return "donation_fitra";
    if (lower.includes("donation") || lower.includes("عطیات")) return "donation_general";
    if (lower.includes("admission") || lower.includes("داخلہ")) return "admission_fee";
    if (lower.includes("exam") || lower.includes("امتحان")) return "exam_fee";
    if (lower.includes("transport") || lower.includes("گاڑی")) return "transport_fee";
    return "tuition_fee";
  } else {
    if (lower.includes("teach") || lower.includes("faculty")) return "salary_teaching";
    if (lower.includes("madrassa") && lower.includes("salary")) return "salary_madrassa";
    if (lower.includes("admin") && lower.includes("salary")) return "salary_admin";
    if (lower.includes("salary") || lower.includes("تنخواہ")) return "salary_teaching";
    if (lower.includes("electric") || lower.includes("wapda") || lower.includes("بجلی")) return "utilities_electric";
    if (lower.includes("gas") || lower.includes("water") || lower.includes("گیس") || lower.includes("پانی")) return "utilities_gas_water";
    if (lower.includes("util") || lower.includes("بلات")) return "utilities_electric";
    if (lower.includes("internet") || lower.includes("telecom")) return "utilities_internet";
    if (lower.includes("mess") || lower.includes("kitchen") || lower.includes("food") || lower.includes("راشن") || lower.includes("طعام")) return "mess_kitchen";
    if (lower.includes("maintenance") || lower.includes("repair") || lower.includes("مرمت")) return "campus_maintenance";
    if (lower.includes("inventory") || lower.includes("supplies") || lower.includes("اسٹاک") || lower.includes("کتب")) return "academic_materials";
    if (lower.includes("fuel") || lower.includes("transport")) return "transport_fuel";
    return "misc_expense";
  }
}

/**
 * Creates and records a financial transaction, persisting it across database,
 * dual JSON files (fee-payments / expenses / donations), and the audit log.
 */
export async function recordFinanceTransaction(request: Request, input: TransactionInput) {
  const user = await getRequestUser(request);
  const dateObj = new Date(input.date);
  const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
  const month = isNaN(dateObj.getMonth()) ? new Date().getMonth() + 1 : dateObj.getMonth() + 1;
  const canonicalCat = mapToCanonicalCategory(input.type, input.category);
  const meta = CATEGORY_META[canonicalCat] || {
    label: input.type === "income" ? "General Income" : "Operational Expense",
    labelUrdu: input.type === "income" ? "عام آمدن" : "اخراجات",
  };

  const id = `fin-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const prefix = input.type === "income" ? "INC" : "EXP";
  const voucherNo = `${prefix}-VCH-${year}${String(month).padStart(2, "0")}-${Date.now().toString().slice(-4)}`;

  const systemLabel =
    input.system === "school"
      ? "Al-Qasim Academy (School)"
      : input.system === "madrassa"
      ? "Jamia Qasimia (Madrassa)"
      : "Al-Qasim Integrated Network";

  const partyName = input.source?.trim() || (input.type === "income" ? "Counter Payer" : "Vendor / Supplier");
  const partyRole =
    input.type === "income"
      ? (canonicalCat.startsWith("donation") ? "Donor" : "Student")
      : (canonicalCat.startsWith("salary") ? "Teacher" : "Vendor");

  const transactionRecord: ComprehensiveTransaction = {
    id,
    voucherNo,
    date: input.date,
    month,
    year,
    type: input.type,
    category: canonicalCat,
    categoryLabel: meta.label,
    categoryLabelUrdu: meta.labelUrdu,
    description: input.description?.trim() || `${meta.label} · ${partyName}`,
    system: input.system,
    systemLabel,
    partyName,
    partyRole: partyRole as any,
    paymentMethod: input.paymentMethod || "cash",
    amount: input.amount,
    status: "posted",
    reference: voucherNo,
  };

  // 1. If Income
  if (input.type === "income") {
    // If donation category, also sync to donations service
    if (canonicalCat.startsWith("donation")) {
      let donType: DonationType = "general";
      if (canonicalCat === "donation_zakat") donType = "zakat";
      else if (canonicalCat === "donation_sadqa") donType = "sadqa";
      else if (canonicalCat === "donation_fitra") donType = "fitra";

      const donResult = saveDonation({
        id,
        date: input.date,
        donor: partyName,
        donorUrdu: input.sourceUrdu?.trim() || partyName,
        type: donType,
        purpose: input.description?.trim() || meta.label,
        amountPaisa: Math.round(input.amount * 100),
        method: input.paymentMethod === "bank" ? "bank" : input.paymentMethod === "online" ? "online" : "cash",
      });
      transactionRecord.voucherNo = donResult.receiptNo;
      transactionRecord.reference = donResult.receiptNo;
    }

    // Save to fee payments file
    syncPaymentToFile(transactionRecord);

    // Persist to PostgreSQL if available
    try {
      await db
        .insert(feePayments)
        .values({
          id,
          receiptNo: voucherNo,
          amountPaisa: Math.round(input.amount * 100),
          method: input.paymentMethod === "bank" ? "bank" : input.paymentMethod === "online" ? "online" : "cash",
          receivedAt: new Date(input.date),
          status: "posted",
          payerName: partyName,
          notes: input.description || null,
        })
        .onConflictDoNothing()
        .catch(() => {});
    } catch {
      // Database offline or sandboxed
    }
  } else {
    // 2. If Expense
    syncExpenseToFile(transactionRecord);
  }

  // 3. Record Audit Trail
  await recordAuditLog({
    userId: user?.id || "system",
    userName: user?.name || "Admin",
    action: "create",
    entity: "finance",
    entityId: voucherNo,
    module: "finance",
    message: `Financial Transaction Recorded: ${input.type.toUpperCase()} PKR ${input.amount.toLocaleString()} (${meta.label}) [${voucherNo}]`,
    messageUrdu: `مالیاتی لین دین درج ہوا: ${meta.labelUrdu} ${input.amount.toLocaleString()} روپے (رسید: ${voucherNo})`,
  }).catch(() => {});

  return {
    success: true,
    transaction: transactionRecord,
    record: {
      id,
      date: input.date,
      type: input.type,
      category: input.category,
      categoryUrdu: meta.labelUrdu,
      description: input.description || meta.label,
      descriptionUrdu: input.descriptionUrdu || meta.labelUrdu,
      amount: input.amount,
      source: partyName,
      sourceUrdu: input.sourceUrdu || partyName,
      system: input.system,
    },
  };
}
