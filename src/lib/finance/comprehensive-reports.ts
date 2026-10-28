import { students as mockStudents, type Student } from "@/mock";

export type System = "madrassa" | "school" | "both";

export type FinanceScope = "both" | "school" | "madrassa";
export type FinancePeriod = "daily" | "monthly" | "annually";
export type FinanceReportType =
  | "income"
  | "expenses"
  | "daily"
  | "dues"
  | "student"
  | "institution"
  | "audit";

export type TransactionCategory =
  // Income
  | "tuition_fee"
  | "admission_fee"
  | "exam_fee"
  | "transport_fee"
  | "donation_zakat"
  | "donation_sadqa"
  | "donation_fitra"
  | "donation_general"
  // Expenses
  | "salary_teaching"
  | "salary_madrassa"
  | "salary_admin"
  | "salary_support"
  | "utilities_electric"
  | "utilities_gas_water"
  | "utilities_internet"
  | "campus_maintenance"
  | "academic_materials"
  | "mess_kitchen"
  | "transport_fuel"
  | "misc_expense";

export interface ComprehensiveTransaction {
  id: string;
  voucherNo: string;
  date: string; // YYYY-MM-DD
  month: number; // 1-12
  year: number; // 2026
  type: "income" | "expense";
  category: TransactionCategory;
  categoryLabel: string;
  categoryLabelUrdu: string;
  description: string;
  system: "school" | "madrassa" | "both";
  systemLabel: string;
  partyName: string;
  partyRole: "Student" | "Donor" | "Teacher" | "Staff" | "Vendor" | "Utility";
  paymentMethod: "cash" | "bank" | "online" | "cheque";
  amount: number; // in PKR
  status: "verified" | "completed" | "posted";
  reference?: string;
}

export const CATEGORY_META: Record<
  TransactionCategory,
  { label: string; labelUrdu: string; type: "income" | "expense"; tone: string }
> = {
  tuition_fee: { label: "Tuition Fee", labelUrdu: "ماہانہ تعلیمی فیس", type: "income", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  admission_fee: { label: "Admission Fee", labelUrdu: "داخلہ فیس", type: "income", tone: "bg-teal-500/15 text-teal-700 dark:text-teal-300" },
  exam_fee: { label: "Examination Fee", labelUrdu: "امتحانی فیس", type: "income", tone: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300" },
  transport_fee: { label: "Transport Fee", labelUrdu: "گاڑی فیس", type: "income", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  donation_zakat: { label: "Zakat Fund", labelUrdu: "زکوٰۃ فنڈ", type: "income", tone: "bg-green-600/15 text-green-700 dark:text-green-300" },
  donation_sadqa: { label: "Sadqa & Khairat", labelUrdu: "صدقات و خیرات", type: "income", tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  donation_fitra: { label: "Fitrana", labelUrdu: "فطرانہ", type: "income", tone: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  donation_general: { label: "General Donation", labelUrdu: "عام عطیات و فنڈ", type: "income", tone: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },

  salary_teaching: { label: "School Faculty Salary", labelUrdu: "اساتذہ اسکول کی تنخواہ", type: "expense", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  salary_madrassa: { label: "Madrassa Asatidha Salary", labelUrdu: "اساتذہ مدرسہ کی تنخواہ", type: "expense", tone: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  salary_admin: { label: "Admin Staff Salary", labelUrdu: "انتظامی عملہ کی تنخواہ", type: "expense", tone: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
  salary_support: { label: "Support Staff Salary", labelUrdu: "معاون ملازمین کی تنخواہ", type: "expense", tone: "bg-stone-500/15 text-stone-700 dark:text-stone-300" },
  utilities_electric: { label: "WAPDA / Electricity", labelUrdu: "بجلی کے بلات", type: "expense", tone: "bg-red-500/15 text-red-700 dark:text-red-300" },
  utilities_gas_water: { label: "Gas & Water", labelUrdu: "سوئی گیس و پانی", type: "expense", tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
  utilities_internet: { label: "Internet & Telecom", labelUrdu: "انٹرنیٹ و رابطہ", type: "expense", tone: "bg-pink-500/15 text-pink-700 dark:text-pink-300" },
  campus_maintenance: { label: "Campus Maintenance", labelUrdu: "عمارت و مرمت", type: "expense", tone: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  academic_materials: { label: "Academic Materials", labelUrdu: "کتب، اسٹیشنری و کاغذات", type: "expense", tone: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  mess_kitchen: { label: "Mess / Kitchen Food", labelUrdu: "طلباء کا راشن و طعام", type: "expense", tone: "bg-amber-600/15 text-amber-700 dark:text-amber-300" },
  transport_fuel: { label: "Transport Fuel & Maintenance", labelUrdu: "گاڑیوں کا ایندھن و مرمت", type: "expense", tone: "bg-blue-600/15 text-blue-700 dark:text-blue-300" },
  misc_expense: { label: "Miscellaneous Operational", labelUrdu: "متفرق اخراجات", type: "expense", tone: "bg-muted text-muted-foreground" },
};

// Unified financial ledger sourced from persisted storage or live transactions
function buildUnifiedFinancialLedger(): ComprehensiveTransaction[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("msmis_financial_transactions");
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return [];
}

export const allTransactions: ComprehensiveTransaction[] = buildUnifiedFinancialLedger();

// Helper to filter transactions
export function filterTransactions({
  type,
  scope = "both",
  period = "annually",
  year = 2026,
  month = new Date().getMonth() + 1,
  dateFrom,
  dateTo,
  query = "",
}: {
  type?: "income" | "expense";
  scope?: FinanceScope;
  period?: FinancePeriod;
  year?: number;
  month?: number;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
}): ComprehensiveTransaction[] {
  const q = query.trim().toLowerCase();

  return allTransactions.filter((tx) => {
    // 1. Transaction Type filter (income vs expense)
    if (type && tx.type !== type) return false;

    // 2. Institutional Scope filter
    if (scope !== "both") {
      if (tx.system !== "both" && tx.system !== scope) return false;
    }

    // 3. Time Period filter
    if (period === "annually") {
      if (tx.year !== year) return false;
    } else if (period === "monthly") {
      if (tx.year !== year || tx.month !== month) return false;
    } else if (period === "daily") {
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
    }

    // 4. Search Query filter
    if (q) {
      const match =
        tx.voucherNo.toLowerCase().includes(q) ||
        tx.partyName.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.categoryLabel.toLowerCase().includes(q) ||
        tx.categoryLabelUrdu.includes(q) ||
        (tx.reference && tx.reference.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });
}

// Group transactions by category with subtotal, count, percentage
export function aggregateByCategory(transactions: ComprehensiveTransaction[]) {
  const total = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const byCategory = new Map<
    TransactionCategory,
    { category: TransactionCategory; label: string; labelUrdu: string; total: number; count: number; tone: string }
  >();

  transactions.forEach((tx) => {
    const existing = byCategory.get(tx.category) ?? {
      category: tx.category,
      label: tx.categoryLabel,
      labelUrdu: tx.categoryLabelUrdu,
      total: 0,
      count: 0,
      tone: CATEGORY_META[tx.category]?.tone ?? "bg-muted text-muted-foreground",
    };
    existing.total += tx.amount;
    existing.count += 1;
    byCategory.set(tx.category, existing);
  });

  return Array.from(byCategory.values())
    .map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// Group transactions by month (1 to 12)
export function aggregateByMonth(transactions: ComprehensiveTransaction[]) {
  const months = [
    { m: 1, name: "January", urdu: "جنوری" },
    { m: 2, name: "February", urdu: "فروری" },
    { m: 3, name: "March", urdu: "مارچ" },
    { m: 4, name: "April", urdu: "اپریل" },
    { m: 5, name: "May", urdu: "مئی" },
    { m: 6, name: "June", urdu: "جون" },
    { m: 7, name: "July", urdu: "جولائی" },
    { m: 8, name: "August", urdu: "اگست" },
    { m: 9, name: "September", urdu: "ستمبر" },
    { m: 10, name: "October", urdu: "اکتوبر" },
    { m: 11, name: "November", urdu: "نومبر" },
    { m: 12, name: "December", urdu: "دسمبر" },
  ];

  return months.map(({ m, name, urdu }) => {
    const txs = transactions.filter((t) => t.month === m);
    const total = txs.reduce((sum, t) => sum + t.amount, 0);
    return {
      monthNumber: m,
      monthName: name,
      monthNameUrdu: urdu,
      total,
      count: txs.length,
    };
  });
}

// Fallbacks for the fee-specific tabs when API response is empty or offline
export function getDailyCollectionFallback(scope: FinanceScope, dateFrom?: string, dateTo?: string, query?: string) {
  const filtered = filterTransactions({
    type: "income",
    scope,
    period: "daily",
    dateFrom: dateFrom || "2026-01-01",
    dateTo: dateTo || "2026-12-31",
    query,
  }).filter((tx) => tx.partyRole === "Student");

  return filtered.map((tx) => ({
    receiptNo: tx.voucherNo,
    date: tx.date,
    studentName: tx.partyName,
    method: tx.paymentMethod.toUpperCase(),
    grossPaisa: tx.amount * 100,
    refundedPaisa: 0,
    netPaisa: tx.amount * 100,
  }));
}

export function getOutstandingDuesFallback(scope: FinanceScope, query?: string) {
  const q = (query || "").trim().toLowerCase();
  const studentList = mockStudents
    .filter((s: Student) => (scope === "both" ? true : s.system === scope))
    .filter((s: Student) => !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q));

  return studentList.slice(0, 20).map((s: Student, idx: number) => {
    const isMadrassa = s.system === "madrassa";
    const inst = isMadrassa ? "Jamia Qasimia Lil-Baneen" : "Al-Qasim Academy (School)";
    const group = s.classId ? `Class ${s.classId}` : s.subcategoryId ? s.subcategoryId : "Standard";
    const baseFee = s.monthlyFee || 3500;
    const hasDues = idx % 2 === 0;
    const current = hasDues ? baseFee : 0;
    const thirty = idx % 3 === 0 ? baseFee : 0;
    const sixty = idx % 5 === 0 ? baseFee : 0;
    const ninety = idx % 7 === 0 ? baseFee : 0;
    const total = current + thirty + sixty + ninety;

    return {
      studentName: `${s.name} (${s.rollNo})`,
      institutionName: inst,
      groupLabel: group,
      currentPaisa: current * 100,
      thirtyPaisa: thirty * 100,
      sixtyPaisa: sixty * 100,
      ninetyPaisa: ninety * 100,
      totalOutstandingPaisa: total * 100,
    };
  });
}

export function getStudentLedgerFallback(scope: FinanceScope, query?: string) {
  const q = (query || "").trim().toLowerCase();
  const students = mockStudents
    .filter((s) => (scope === "both" ? true : s.system === scope))
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q));

  const rows: Array<{
    studentName: string;
    reference: string;
    date: string;
    type: string;
    debitPaisa: number;
    creditPaisa: number;
    balancePaisa: number;
  }> = [];

  students.slice(0, 15).forEach((s) => {
    const fee = s.monthlyFee || 3500;
    // Charge row
    rows.push({
      studentName: `${s.name} (${s.rollNo})`,
      reference: `CHG-2026-${s.id}`,
      date: "2026-05-01",
      type: "Monthly Charge",
      debitPaisa: fee * 100,
      creditPaisa: 0,
      balancePaisa: fee * 100,
    });
    // Payment row
    rows.push({
      studentName: `${s.name} (${s.rollNo})`,
      reference: `REC-2026-${s.id}`,
      date: "2026-05-05",
      type: "Payment (Cash)",
      debitPaisa: 0,
      creditPaisa: fee * 100,
      balancePaisa: 0,
    });
  });

  return rows;
}

export function getInstitutionSummaryFallback() {
  return [
    {
      institutionName: "Al-Qasim Academy (School Campus)",
      chargedPaisa: 2_450_000_00,
      collectedPaisa: 2_180_000_00,
      reversedPaisa: 15_000_00,
      refundedPaisa: 5_000_00,
      outstandingPaisa: 250_000_00,
    },
    {
      institutionName: "Jamia Qasimia Lil-Baneen (Madrassa Boys)",
      chargedPaisa: 1_650_000_00,
      collectedPaisa: 1_520_000_00,
      reversedPaisa: 10_000_00,
      refundedPaisa: 0,
      outstandingPaisa: 120_000_00,
    },
    {
      institutionName: "Jamia Zainab Lil-Banat (Madrassa Girls)",
      chargedPaisa: 980_000_00,
      collectedPaisa: 910_000_00,
      reversedPaisa: 5_000_00,
      refundedPaisa: 0,
      outstandingPaisa: 65_000_00,
    },
  ];
}

export function getAuditReportFallback(scope: FinanceScope, dateFrom?: string, dateTo?: string, query?: string) {
  const auditEntries = [
    {
      createdAt: "2026-05-20",
      actorName: "Imran Hassan Qureshi (Senior Accountant)",
      type: "Fee Waiver",
      reference: "CHG-2026-SCH-014",
      amountPaisa: 3500_00,
      reason: "Orphan student 100% financial concession approved by Principal",
    },
    {
      createdAt: "2026-05-18",
      actorName: "Khalid Mahmood (Principal)",
      type: "Payment Refund",
      reference: "REC-SCH-2026-089",
      amountPaisa: 2200_00,
      reason: "Duplicate transport fee deposit refund to guardian",
    },
    {
      createdAt: "2026-05-12",
      actorName: "Zarina Bibi (Accountant)",
      type: "Charge Reversal",
      reference: "CHG-2026-MAD-032",
      amountPaisa: 1500_00,
      reason: "Correction of incorrect exam fee ledger billing",
    },
    {
      createdAt: "2026-05-04",
      actorName: "Imran Hassan Qureshi (Senior Accountant)",
      type: "Concession",
      reference: "CHG-2026-SCH-045",
      amountPaisa: 1750_00,
      reason: "Sibling discount policy adjustment (50% fee off)",
    },
  ];

  const q = (query || "").trim().toLowerCase();
  return auditEntries.filter((e) => !q || e.actorName.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q));
}
