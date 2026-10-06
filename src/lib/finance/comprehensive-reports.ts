import {
  financeRecords as mockFinance,
  feeRecords as mockFees,
  students as mockStudents,
  type System,
} from "@/mock";
import { staffSeed, payrollProfilesSeed, payslipsSeed, type StaffMember } from "@/lib/mock/hr";

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

// Generates an extensive, highly realistic ledger across the full academic year
function buildUnifiedFinancialLedger(): ComprehensiveTransaction[] {
  const transactions: ComprehensiveTransaction[] = [];
  let seq = 1000;

  const currentYear = 2026;
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Staff & Teacher Payroll from HR store/seed for months 1 through 12
  for (let m = 1; m <= 12; m++) {
    const monthStr = String(m).padStart(2, "0");
    const payDay = `2026-${monthStr}-01`;

    staffSeed.forEach((staff) => {
      seq++;
      const isTeacher = staff.staffType === "teacher";
      const isMadrassa = staff.module === "madrassa";
      const isAdmin = staff.staffType === "administrator" || staff.staffType === "accountant";

      const category: TransactionCategory = isMadrassa
        ? "salary_madrassa"
        : isTeacher
        ? "salary_teaching"
        : isAdmin
        ? "salary_admin"
        : "salary_support";

      const baseAmount = isTeacher ? 65000 : isAdmin ? 85000 : 42000;
      const allowances = 12000;
      const deductions = 2500;
      const netSalary = baseAmount + allowances - deductions;

      transactions.push({
        id: `TX-SAL-${seq}`,
        voucherNo: `VCH-SAL-${currentYear}${monthStr}-${String(seq).slice(-4)}`,
        date: payDay,
        month: m,
        year: currentYear,
        type: "expense",
        category,
        categoryLabel: CATEGORY_META[category].label,
        categoryLabelUrdu: CATEGORY_META[category].labelUrdu,
        description: `Disbursement of Monthly Salary for ${staff.fullName} (${staff.designation})`,
        system: staff.module === "shared" ? "both" : staff.module,
        systemLabel: staff.module === "madrassa" ? "Madrassa" : staff.module === "school" ? "School" : "Both (Shared)",
        partyName: staff.fullName,
        partyRole: isTeacher ? "Teacher" : "Staff",
        paymentMethod: "bank",
        amount: netSalary,
        status: "verified",
        reference: `PAY-${currentYear}-${monthStr}`,
      });
    });

    // 2. Monthly Campus Utilities & Operating Expenses
    const utilityItems: Array<{
      cat: TransactionCategory;
      amount: number;
      desc: string;
      system: "school" | "madrassa" | "both";
      party: string;
      day: number;
    }> = [
      { cat: "utilities_electric", amount: 48500, desc: "WAPDA Commercial Bill — Main Academic Campus", system: "school", party: "WAPDA / LESCO", day: 12 },
      { cat: "utilities_electric", amount: 36200, desc: "WAPDA Commercial Bill — Jamia Qasimia Complex & Hostel", system: "madrassa", party: "WAPDA / LESCO", day: 12 },
      { cat: "utilities_gas_water", amount: 14200, desc: "Sui Northern Gas Bill — Central Kitchen & Water Filtration", system: "both", party: "SNGPL & WASA", day: 15 },
      { cat: "utilities_internet", amount: 8500, desc: "High-speed Fiber Broadband & Surveillance Network", system: "both", party: "PTCL Optical", day: 8 },
      { cat: "mess_kitchen", amount: 82000, desc: "Madrassa Mess Grocery: Wheat flour, Basmati Rice, Ghee & Pulses", system: "madrassa", party: "Madina Grain Traders", day: 5 },
      { cat: "mess_kitchen", amount: 45000, desc: "Fresh Meat, Vegetables & Poultry for Hifz Boarding Students", system: "madrassa", party: "Lahore Wholesale Market", day: 20 },
      { cat: "academic_materials", amount: 32000, desc: "Mid-Term Question Papers Printing & Answer Scripts", system: "school", party: "Al-Noor Press & Stationers", day: 18 },
      { cat: "academic_materials", amount: 18500, desc: "Dars-e-Nizami Curriculum Books & Notebooks", system: "madrassa", party: "Maktaba-e-Qasimia", day: 10 },
      { cat: "campus_maintenance", amount: 24000, desc: "Air Conditioning Service, Electrical Fixtures & Plumbing", system: "both", party: "Rehman Facility Maintenance", day: 22 },
      { cat: "transport_fuel", amount: 56000, desc: "Student Van Diesel Fuel (4 Busses) & Engine Maintenance", system: "school", party: "Shell Filling Station", day: 25 },
      { cat: "misc_expense", amount: 12500, desc: "Official Guest Refreshments, Sanitization & First Aid Supplies", system: "both", party: "City General Stores", day: 28 },
    ];

    utilityItems.forEach((u) => {
      seq++;
      const dayStr = String(u.day).padStart(2, "0");
      transactions.push({
        id: `TX-EXP-${seq}`,
        voucherNo: `VCH-EXP-${currentYear}${monthStr}-${String(seq).slice(-4)}`,
        date: `2026-${monthStr}-${dayStr}`,
        month: m,
        year: currentYear,
        type: "expense",
        category: u.cat,
        categoryLabel: CATEGORY_META[u.cat].label,
        categoryLabelUrdu: CATEGORY_META[u.cat].labelUrdu,
        description: u.desc,
        system: u.system,
        systemLabel: u.system === "madrassa" ? "Madrassa" : u.system === "school" ? "School" : "Both (Shared)",
        partyName: u.party,
        partyRole: u.cat.startsWith("utilities") ? "Utility" : "Vendor",
        paymentMethod: u.amount > 20000 ? "bank" : "cash",
        amount: u.amount,
        status: "verified",
        reference: `INV-${currentYear}-${monthStr}-${u.day}`,
      });
    });

    // 3. Student Fee Collections for each month (School & Madrassa)
    mockStudents.slice(0, 36).forEach((student, idx) => {
      seq++;
      const isSchool = student.system === "school";
      const feeDay = Math.min(28, (idx % 10) + 1);
      const dayStr = String(feeDay).padStart(2, "0");
      const baseFee = isSchool ? (student.monthlyFee || 3500) : (student.monthlyFee || 2000);
      const hasTransport = isSchool && idx % 3 === 0;
      const isAdmissionMonth = m === 4 || m === 8; // April & August admissions
      const admissionFee = isAdmissionMonth && idx % 5 === 0 ? 5000 : 0;

      // Tuition payment
      transactions.push({
        id: `TX-FEE-${seq}`,
        voucherNo: `REC-${isSchool ? "SCH" : "MAD"}-${currentYear}${monthStr}-${String(seq).slice(-4)}`,
        date: `2026-${monthStr}-${dayStr}`,
        month: m,
        year: currentYear,
        type: "income",
        category: "tuition_fee",
        categoryLabel: CATEGORY_META.tuition_fee.label,
        categoryLabelUrdu: CATEGORY_META.tuition_fee.labelUrdu,
        description: `Tuition Fee for Month ${monthStr} — ${student.name} (${student.rollNo})`,
        system: isSchool ? "school" : "madrassa",
        systemLabel: isSchool ? "School" : "Madrassa",
        partyName: student.name,
        partyRole: "Student",
        paymentMethod: idx % 2 === 0 ? "cash" : "online",
        amount: baseFee,
        status: "posted",
        reference: student.rollNo,
      });

      // Transport fee if applicable
      if (hasTransport) {
        seq++;
        transactions.push({
          id: `TX-TRN-${seq}`,
          voucherNo: `REC-TRN-${currentYear}${monthStr}-${String(seq).slice(-4)}`,
          date: `2026-${monthStr}-${dayStr}`,
          month: m,
          year: currentYear,
          type: "income",
          category: "transport_fee",
          categoryLabel: CATEGORY_META.transport_fee.label,
          categoryLabelUrdu: CATEGORY_META.transport_fee.labelUrdu,
          description: `Student Bus Transport Fee — ${student.name}`,
          system: "school",
          systemLabel: "School",
          partyName: student.name,
          partyRole: "Student",
          paymentMethod: "cash",
          amount: 2200,
          status: "posted",
          reference: student.rollNo,
        });
      }

      // Admission fee if new student
      if (admissionFee > 0) {
        seq++;
        transactions.push({
          id: `TX-ADM-${seq}`,
          voucherNo: `REC-ADM-${currentYear}${monthStr}-${String(seq).slice(-4)}`,
          date: `2026-${monthStr}-${dayStr}`,
          month: m,
          year: currentYear,
          type: "income",
          category: "admission_fee",
          categoryLabel: CATEGORY_META.admission_fee.label,
          categoryLabelUrdu: CATEGORY_META.admission_fee.labelUrdu,
          description: `New Admission & Enrollment Fee — ${student.name}`,
          system: isSchool ? "school" : "madrassa",
          systemLabel: isSchool ? "School" : "Madrassa",
          partyName: student.name,
          partyRole: "Student",
          paymentMethod: "bank",
          amount: admissionFee,
          status: "posted",
          reference: student.rollNo,
        });
      }
    });

    // 4. Donations & Charity Receipts for the month
    const monthlyDonations: Array<{
      cat: TransactionCategory;
      amount: number;
      donor: string;
      purpose: string;
      system: "school" | "madrassa" | "both";
      method: "cash" | "bank" | "online";
      day: number;
    }> = [
      { cat: "donation_zakat", amount: 150000 + (m % 3) * 50000, donor: "Haji Abdul Rauf", purpose: "Orphan and Needy Students Education & Welfare", system: "madrassa", method: "bank", day: 7 },
      { cat: "donation_sadqa", amount: 25000 + (m % 4) * 5000, donor: "Mian Tariq Munir", purpose: "Sadqa-e-Jariyah / Water & Cleanliness Fund", system: "both", method: "cash", day: 14 },
      { cat: "donation_general", amount: 75000 + (m % 2) * 25000, donor: "Mrs. Aisha Khan", purpose: "Academic Building Infrastructure Fund", system: "both", method: "online", day: 21 },
      { cat: "donation_fitra", amount: m === 3 || m === 4 ? 65000 : 0, donor: "Community Fitrana Pool", purpose: "Fitrana Disbursement for Boarding Talaba", system: "madrassa", method: "cash", day: 27 },
    ];

    monthlyDonations.filter((d) => d.amount > 0).forEach((d) => {
      seq++;
      const dayStr = String(d.day).padStart(2, "0");
      transactions.push({
        id: `TX-DON-${seq}`,
        voucherNo: `REC-DON-${currentYear}${monthStr}-${String(seq).slice(-4)}`,
        date: `2026-${monthStr}-${dayStr}`,
        month: m,
        year: currentYear,
        type: "income",
        category: d.cat,
        categoryLabel: CATEGORY_META[d.cat].label,
        categoryLabelUrdu: CATEGORY_META[d.cat].labelUrdu,
        description: `${d.purpose} (Donor: ${d.donor})`,
        system: d.system,
        systemLabel: d.system === "madrassa" ? "Madrassa" : d.system === "school" ? "School" : "Both (Shared)",
        partyName: d.donor,
        partyRole: "Donor",
        paymentMethod: d.method,
        amount: d.amount,
        status: "verified",
        reference: `DR-${currentYear}-${monthStr}`,
      });
    });
  }

  // Ensure current date (today) has dedicated live entries for the Daily report
  transactions.push(
    {
      id: `TX-LIVE-1`,
      voucherNo: `REC-SCH-${currentYear}-TODAY-01`,
      date: todayStr,
      month: new Date().getMonth() + 1,
      year: currentYear,
      type: "income",
      category: "tuition_fee",
      categoryLabel: CATEGORY_META.tuition_fee.label,
      categoryLabelUrdu: CATEGORY_META.tuition_fee.labelUrdu,
      description: "Counter Collection: Tuition Fee for Muhammad Abdullah",
      system: "school",
      systemLabel: "School",
      partyName: "Muhammad Abdullah",
      partyRole: "Student",
      paymentMethod: "cash",
      amount: 4500,
      status: "posted",
      reference: "SCH-001",
    },
    {
      id: `TX-LIVE-2`,
      voucherNo: `REC-DON-${currentYear}-TODAY-02`,
      date: todayStr,
      month: new Date().getMonth() + 1,
      year: currentYear,
      type: "income",
      category: "donation_sadqa",
      categoryLabel: CATEGORY_META.donation_sadqa.label,
      categoryLabelUrdu: CATEGORY_META.donation_sadqa.labelUrdu,
      description: "Cash Sadqa Donation received at Main Reception",
      system: "both",
      systemLabel: "Both (Shared)",
      partyName: "Anonymous Donor",
      partyRole: "Donor",
      paymentMethod: "cash",
      amount: 15000,
      status: "verified",
    },
    {
      id: `TX-LIVE-3`,
      voucherNo: `VCH-EXP-${currentYear}-TODAY-03`,
      date: todayStr,
      month: new Date().getMonth() + 1,
      year: currentYear,
      type: "expense",
      category: "mess_kitchen",
      categoryLabel: CATEGORY_META.mess_kitchen.label,
      categoryLabelUrdu: CATEGORY_META.mess_kitchen.labelUrdu,
      description: "Daily Fresh Vegetables & Milk for Madrassa Kitchen",
      system: "madrassa",
      systemLabel: "Madrassa",
      partyName: "Madina Milk & Vegetable Mart",
      partyRole: "Vendor",
      paymentMethod: "cash",
      amount: 6200,
      status: "verified",
    },
  );

  return transactions;
}

// Global cached unified ledger
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
  const students = mockStudents
    .filter((s) => (scope === "both" ? true : s.system === scope))
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q));

  return students.slice(0, 20).map((s, idx) => {
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
