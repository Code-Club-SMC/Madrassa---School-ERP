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

// Generate a realistic, rich canonical dataset covering all 12 months for 2026
function generateCanonicalTransactions(): ComprehensiveTransaction[] {
  const txs: ComprehensiveTransaction[] = [];
  const yr = 2026;

  for (let m = 1; m <= 12; m++) {
    const mStr = String(m).padStart(2, "0");

    // 1. School Student Tuition Fees
    const schoolStudents = [
      { name: "Abdullah Khan", roll: "SCH-101", fee: 4000, day: 2, method: "cash" as const },
      { name: "Muhammad Bilal", roll: "SCH-104", fee: 3800, day: 3, method: "cash" as const },
      { name: "Fatima Zahra", roll: "SCH-108", fee: 3500, day: 4, method: "online" as const },
      { name: "Zainab Bibi", roll: "SCH-112", fee: 3500, day: 5, method: "cash" as const },
      { name: "Hamza Farooq", roll: "SCH-115", fee: 4500, day: 6, method: "bank" as const },
      { name: "Maryam Tariq", roll: "SCH-120", fee: 3800, day: 7, method: "online" as const },
      { name: "Usman Ghani", roll: "SCH-124", fee: 4500, day: 8, method: "cash" as const },
      { name: "Ayesha Noor", roll: "SCH-128", fee: 3200, day: 9, method: "cash" as const },
      { name: "Ibrahim Shah", roll: "SCH-133", fee: 3500, day: 10, method: "cash" as const },
      { name: "Hassan Ali", roll: "SCH-139", fee: 4000, day: 11, method: "bank" as const },
      { name: "Saad Rafiq", roll: "SCH-144", fee: 3800, day: 12, method: "cash" as const },
      { name: "Huzaifa Afridi", roll: "SCH-149", fee: 4500, day: 14, method: "online" as const },
      { name: "Tayyab Rehman", roll: "SCH-152", fee: 3800, day: 15, method: "cash" as const },
    ];

    schoolStudents.forEach((st, idx) => {
      const dayStr = String(st.day).padStart(2, "0");
      txs.push({
        id: `tx-sch-tf-${yr}-${mStr}-${idx + 1}`,
        voucherNo: `VCH-${yr}${mStr}-SCH-${100 + idx}`,
        date: `${yr}-${mStr}-${dayStr}`,
        month: m,
        year: yr,
        type: "income",
        category: "tuition_fee",
        categoryLabel: CATEGORY_META.tuition_fee.label,
        categoryLabelUrdu: CATEGORY_META.tuition_fee.labelUrdu,
        description: `Monthly tuition fee receipt for ${st.name} (${st.roll})`,
        system: "school",
        systemLabel: "Al-Qasim Academy (School)",
        partyName: st.name,
        partyRole: "Student",
        paymentMethod: st.method,
        amount: st.fee,
        status: "posted",
        reference: `REC-${st.roll}-${yr}${mStr}`,
      });
    });

    // 2. Madrassa Student Monthly / Hifz Fees
    const madrassaStudents = [
      { name: "Hafiz Muhammad Anas", roll: "MAD-012", fee: 2500, day: 2, method: "cash" as const },
      { name: "Abu Bakr Siddique", roll: "MAD-015", fee: 3000, day: 4, method: "cash" as const },
      { name: "Muhammad Zubair", roll: "MAD-019", fee: 2500, day: 6, method: "cash" as const },
      { name: "Talha Tariq", roll: "MAD-024", fee: 3500, day: 8, method: "cash" as const },
      { name: "Sumayya Bibi", roll: "MAD-G05", fee: 2000, day: 9, method: "online" as const },
      { name: "Asma Bint Khalid", roll: "MAD-G11", fee: 2500, day: 11, method: "cash" as const },
      { name: "Affan Qureshi", roll: "MAD-031", fee: 2000, day: 13, method: "cash" as const },
      { name: "Huzaifa Khan", roll: "MAD-038", fee: 2500, day: 15, method: "cash" as const },
    ];

    madrassaStudents.forEach((st, idx) => {
      const dayStr = String(st.day).padStart(2, "0");
      txs.push({
        id: `tx-mad-tf-${yr}-${mStr}-${idx + 1}`,
        voucherNo: `VCH-${yr}${mStr}-MAD-${100 + idx}`,
        date: `${yr}-${mStr}-${dayStr}`,
        month: m,
        year: yr,
        type: "income",
        category: "tuition_fee",
        categoryLabel: CATEGORY_META.tuition_fee.label,
        categoryLabelUrdu: CATEGORY_META.tuition_fee.labelUrdu,
        description: `Hifz & Dars-e-Nizami fee deposit for ${st.name} (${st.roll})`,
        system: "madrassa",
        systemLabel: "Jamia Qasimia (Madrassa)",
        partyName: st.name,
        partyRole: "Student",
        paymentMethod: st.method,
        amount: st.fee,
        status: "posted",
        reference: `REC-${st.roll}-${yr}${mStr}`,
      });
    });

    // 3. Admissions (Spring Admissions in Months 3, 4, 5)
    if (m >= 3 && m <= 5) {
      txs.push({
        id: `tx-adm-sch-${yr}-${mStr}`,
        voucherNo: `VCH-${yr}${mStr}-ADM-01`,
        date: `${yr}-${mStr}-15`,
        month: m,
        year: yr,
        type: "income",
        category: "admission_fee",
        categoryLabel: CATEGORY_META.admission_fee.label,
        categoryLabelUrdu: CATEGORY_META.admission_fee.labelUrdu,
        description: `New school admission batch enrollment charges (Class 1-9)`,
        system: "school",
        systemLabel: "Al-Qasim Academy (School)",
        partyName: "New Admission Candidates",
        partyRole: "Student",
        paymentMethod: "cash",
        amount: 45000 + m * 5000,
        status: "posted",
        reference: `ADM-BATCH-${yr}${mStr}`,
      });
      txs.push({
        id: `tx-adm-mad-${yr}-${mStr}`,
        voucherNo: `VCH-${yr}${mStr}-ADM-02`,
        date: `${yr}-${mStr}-20`,
        month: m,
        year: yr,
        type: "income",
        category: "admission_fee",
        categoryLabel: CATEGORY_META.admission_fee.label,
        categoryLabelUrdu: CATEGORY_META.admission_fee.labelUrdu,
        description: `New Madrassa dakhila enrollment — Hifz & Darse Nizami`,
        system: "madrassa",
        systemLabel: "Jamia Qasimia (Madrassa)",
        partyName: "Dakhila Candidates",
        partyRole: "Student",
        paymentMethod: "cash",
        amount: 25000 + m * 3000,
        status: "posted",
        reference: `MAD-DAKHILA-${yr}${mStr}`,
      });
    }

    // 4. Exam Fees (Feb/Oct)
    if (m === 2 || m === 10) {
      txs.push({
        id: `tx-exam-sch-${yr}-${mStr}`,
        voucherNo: `VCH-${yr}${mStr}-EXAM-01`,
        date: `${yr}-${mStr}-10`,
        month: m,
        year: yr,
        type: "income",
        category: "exam_fee",
        categoryLabel: CATEGORY_META.exam_fee.label,
        categoryLabelUrdu: CATEGORY_META.exam_fee.labelUrdu,
        description: m === 2 ? "Annual Board & School Examination Fee" : "Midterm Examination Fee",
        system: "school",
        systemLabel: "Al-Qasim Academy (School)",
        partyName: "School Examination Committee",
        partyRole: "Student",
        paymentMethod: "cash",
        amount: 42000,
        status: "posted",
        reference: `EXAM-${yr}${mStr}`,
      });
      txs.push({
        id: `tx-exam-mad-${yr}-${mStr}`,
        voucherNo: `VCH-${yr}${mStr}-EXAM-02`,
        date: `${yr}-${mStr}-12`,
        month: m,
        year: yr,
        type: "income",
        category: "exam_fee",
        categoryLabel: CATEGORY_META.exam_fee.label,
        categoryLabelUrdu: CATEGORY_META.exam_fee.labelUrdu,
        description: "Wafaq-ul-Madaris Al-Arabia Imtehanat Dues",
        system: "madrassa",
        systemLabel: "Jamia Qasimia (Madrassa)",
        partyName: "Madrassa Imtehan Committee",
        partyRole: "Student",
        paymentMethod: "cash",
        amount: 28000,
        status: "posted",
        reference: `WAFAQ-${yr}${mStr}`,
      });
    }

    // 5. Philanthropic Donations & Zakat
    if (m === 3 || m === 4) {
      // Ramadan Season
      txs.push({
        id: `tx-zakat-1-${yr}-${mStr}`,
        voucherNo: `VCH-${yr}${mStr}-ZKT-01`,
        date: `${yr}-${mStr}-10`,
        month: m,
        year: yr,
        type: "income",
        category: "donation_zakat",
        categoryLabel: CATEGORY_META.donation_zakat.label,
        categoryLabelUrdu: CATEGORY_META.donation_zakat.labelUrdu,
        description: "Annual Ramadan Zakat Contribution for Orphan & Deserving Students",
        system: "madrassa",
        systemLabel: "Jamia Qasimia (Madrassa)",
        partyName: "Haji Abdul Rauf (Industrialist)",
        partyRole: "Donor",
        paymentMethod: "bank",
        amount: 250000,
        status: "posted",
        reference: "BANK-ZKT-4412",
      });
      txs.push({
        id: `tx-zakat-2-${yr}-${mStr}`,
        voucherNo: `VCH-${yr}${mStr}-ZKT-02`,
        date: `${yr}-${mStr}-18`,
        month: m,
        year: yr,
        type: "income",
        category: "donation_zakat",
        categoryLabel: CATEGORY_META.donation_zakat.label,
        categoryLabelUrdu: CATEGORY_META.donation_zakat.labelUrdu,
        description: "Overseas Pakistani Philanthropists Zakat Wire",
        system: "madrassa",
        systemLabel: "Jamia Qasimia (Madrassa)",
        partyName: "Dubai Welfare Trust Philanthropists",
        partyRole: "Donor",
        paymentMethod: "bank",
        amount: 180000,
        status: "posted",
        reference: "TT-DXB-9981",
      });
      if (m === 4) {
        txs.push({
          id: `tx-fitra-${yr}-${mStr}`,
          voucherNo: `VCH-${yr}${mStr}-FITRA-01`,
          date: `${yr}-${mStr}-08`,
          month: m,
          year: yr,
          type: "income",
          category: "donation_fitra",
          categoryLabel: CATEGORY_META.donation_fitra.label,
          categoryLabelUrdu: CATEGORY_META.donation_fitra.labelUrdu,
          description: "Eid-ul-Fitr Fitrana collections deposited into Talaba Fund",
          system: "madrassa",
          systemLabel: "Jamia Qasimia (Madrassa)",
          partyName: "Eid Fitrana Collections — Masjid & Jamia",
          partyRole: "Donor",
          paymentMethod: "cash",
          amount: 65000,
          status: "posted",
          reference: "CASH-FITRA-01",
        });
      }
    } else {
      // Regular Months
      txs.push({
        id: `tx-zakat-reg-${yr}-${mStr}`,
        voucherNo: `VCH-${yr}${mStr}-ZKT-01`,
        date: `${yr}-${mStr}-12`,
        month: m,
        year: yr,
        type: "income",
        category: "donation_zakat",
        categoryLabel: CATEGORY_META.donation_zakat.label,
        categoryLabelUrdu: CATEGORY_META.donation_zakat.labelUrdu,
        description: "Monthly Zakat & Talaba Kafalat sponsorship",
        system: "madrassa",
        systemLabel: "Jamia Qasimia (Madrassa)",
        partyName: "Ansar-ul-Muslimeen Zakat Account",
        partyRole: "Donor",
        paymentMethod: "bank",
        amount: 45000,
        status: "posted",
        reference: `ZKT-REG-${yr}${mStr}`,
      });
    }

    // Monthly Sadqa & General Donations
    txs.push({
      id: `tx-sadqa-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-SDQ-01`,
      date: `${yr}-${mStr}-05`,
      month: m,
      year: yr,
      type: "income",
      category: "donation_sadqa",
      categoryLabel: CATEGORY_META.donation_sadqa.label,
      categoryLabelUrdu: CATEGORY_META.donation_sadqa.labelUrdu,
      description: "Sadqa-e-Jariya & Atiyaat for student welfare",
      system: "both",
      systemLabel: "Al-Qasim Integrated Network",
      partyName: "Anonymous Well-Wisher",
      partyRole: "Donor",
      paymentMethod: "cash",
      amount: 25000,
      status: "posted",
      reference: `SDQ-${yr}${mStr}`,
    });

    txs.push({
      id: `tx-gen-don-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-GEN-01`,
      date: `${yr}-${mStr}-14`,
      month: m,
      year: yr,
      type: "income",
      category: "donation_general",
      categoryLabel: CATEGORY_META.donation_general.label,
      categoryLabelUrdu: CATEGORY_META.donation_general.labelUrdu,
      description: "General campus improvement and library fund",
      system: "both",
      systemLabel: "Al-Qasim Integrated Network",
      partyName: "Mrs. Aisha Khan",
      partyRole: "Donor",
      paymentMethod: "online",
      amount: 40000,
      status: "posted",
      reference: `GEN-DON-${yr}${mStr}`,
    });

    // 6. EXPENSES: Faculty & Staff Salaries (Paid on 3rd - 5th of every month)
    const salaries = [
      { name: "Tariq Mehmood (Senior Science & Math)", role: "Teacher" as const, cat: "salary_teaching" as const, sys: "school" as const, sysLabel: "Al-Qasim Academy (School)", amt: 42000, day: 3 },
      { name: "Qari Abdul Wahid (Islamic Studies & Arabic)", role: "Teacher" as const, cat: "salary_teaching" as const, sys: "school" as const, sysLabel: "Al-Qasim Academy (School)", amt: 38000, day: 3 },
      { name: "Sajid Ali (English & Computer)", role: "Teacher" as const, cat: "salary_teaching" as const, sys: "school" as const, sysLabel: "Al-Qasim Academy (School)", amt: 36000, day: 3 },
      { name: "Farzana Bibi (Primary Section Incharge)", role: "Teacher" as const, cat: "salary_teaching" as const, sys: "school" as const, sysLabel: "Al-Qasim Academy (School)", amt: 35000, day: 3 },
      { name: "Maulana Noor-ul-Haq (Sheikh-ul-Hadith)", role: "Teacher" as const, cat: "salary_madrassa" as const, sys: "madrassa" as const, sysLabel: "Jamia Qasimia (Madrassa)", amt: 45000, day: 4 },
      { name: "Mufti Muhammad Zubair (Fiqh & Tafseer)", role: "Teacher" as const, cat: "salary_madrassa" as const, sys: "madrassa" as const, sysLabel: "Jamia Qasimia (Madrassa)", amt: 38000, day: 4 },
      { name: "Qari Ismail (Chief Hifz Ustadh)", role: "Teacher" as const, cat: "salary_madrassa" as const, sys: "madrassa" as const, sysLabel: "Jamia Qasimia (Madrassa)", amt: 34000, day: 4 },
      { name: "Imran Hassan Qureshi (Senior Accountant)", role: "Staff" as const, cat: "salary_admin" as const, sys: "both" as const, sysLabel: "Al-Qasim Integrated Network", amt: 40000, day: 5 },
      { name: "Sher Muhammad (Security & Gatekeeper)", role: "Staff" as const, cat: "salary_support" as const, sys: "both" as const, sysLabel: "Al-Qasim Integrated Network", amt: 24000, day: 5 },
    ];

    salaries.forEach((sal, idx) => {
      const dayStr = String(sal.day).padStart(2, "0");
      txs.push({
        id: `tx-sal-${yr}-${mStr}-${idx + 1}`,
        voucherNo: `VCH-${yr}${mStr}-SAL-${200 + idx}`,
        date: `${yr}-${mStr}-${dayStr}`,
        month: m,
        year: yr,
        type: "expense",
        category: sal.cat,
        categoryLabel: CATEGORY_META[sal.cat].label,
        categoryLabelUrdu: CATEGORY_META[sal.cat].labelUrdu,
        description: `Monthly salary disbursement for ${sal.name}`,
        system: sal.sys,
        systemLabel: sal.sysLabel,
        partyName: sal.name,
        partyRole: sal.role,
        paymentMethod: "bank",
        amount: sal.amt,
        status: "posted",
        reference: `SAL-PAYROLL-${yr}${mStr}`,
      });
    });

    // 7. EXPENSES: Utilities
    txs.push({
      id: `tx-elec-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-UTIL-01`,
      date: `${yr}-${mStr}-16`,
      month: m,
      year: yr,
      type: "expense",
      category: "utilities_electric",
      categoryLabel: CATEGORY_META.utilities_electric.label,
      categoryLabelUrdu: CATEGORY_META.utilities_electric.labelUrdu,
      description: "PESCO / WAPDA — Main campus 3-phase electricity commercial bill",
      system: "both",
      systemLabel: "Al-Qasim Integrated Network",
      partyName: "WAPDA / PESCO Electricity Board",
      partyRole: "Utility",
      paymentMethod: "online",
      amount: 28500 + ((m * 1700) % 9000),
      status: "posted",
      reference: `BILL-ELEC-${yr}${mStr}`,
    });

    txs.push({
      id: `tx-gas-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-UTIL-02`,
      date: `${yr}-${mStr}-14`,
      month: m,
      year: yr,
      type: "expense",
      category: "utilities_gas_water",
      categoryLabel: CATEGORY_META.utilities_gas_water.label,
      categoryLabelUrdu: CATEGORY_META.utilities_gas_water.labelUrdu,
      description: "Sui Gas & campus clean drinking water filtration maintenance",
      system: "both",
      systemLabel: "Al-Qasim Integrated Network",
      partyName: "SNGPL & Aqua Pure Water",
      partyRole: "Utility",
      paymentMethod: "online",
      amount: 8400,
      status: "posted",
      reference: `BILL-GAS-${yr}${mStr}`,
    });

    txs.push({
      id: `tx-net-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-UTIL-03`,
      date: `${yr}-${mStr}-10`,
      month: m,
      year: yr,
      type: "expense",
      category: "utilities_internet",
      categoryLabel: CATEGORY_META.utilities_internet.label,
      categoryLabelUrdu: CATEGORY_META.utilities_internet.labelUrdu,
      description: "Fiber optic high-speed internet & campus communication line",
      system: "both",
      systemLabel: "Al-Qasim Integrated Network",
      partyName: "Nayatel Fiber Broadband",
      partyRole: "Utility",
      paymentMethod: "online",
      amount: 4800,
      status: "posted",
      reference: `BILL-NET-${yr}${mStr}`,
    });

    // 8. EXPENSES: Student Mess & Kitchen Food Ration
    txs.push({
      id: `tx-mess-1-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-MESS-01`,
      date: `${yr}-${mStr}-05`,
      month: m,
      year: yr,
      type: "expense",
      category: "mess_kitchen",
      categoryLabel: CATEGORY_META.mess_kitchen.label,
      categoryLabelUrdu: CATEGORY_META.mess_kitchen.labelUrdu,
      description: "Fortnight 1 — Flour bags, Basmati rice, pulses, and ghee for student mess",
      system: "madrassa",
      systemLabel: "Jamia Qasimia (Madrassa)",
      partyName: "Madina Wholesale Grain Market",
      partyRole: "Vendor",
      paymentMethod: "cash",
      amount: 48000,
      status: "posted",
      reference: `MESS-F1-${yr}${mStr}`,
    });

    txs.push({
      id: `tx-mess-2-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-MESS-02`,
      date: `${yr}-${mStr}-19`,
      month: m,
      year: yr,
      type: "expense",
      category: "mess_kitchen",
      categoryLabel: CATEGORY_META.mess_kitchen.label,
      categoryLabelUrdu: CATEGORY_META.mess_kitchen.labelUrdu,
      description: "Fortnight 2 — Fresh poultry, spices, sugar, cooking oil, and dairy",
      system: "madrassa",
      systemLabel: "Jamia Qasimia (Madrassa)",
      partyName: "Khyber Poultry & Grocery Wholesale",
      partyRole: "Vendor",
      paymentMethod: "cash",
      amount: 42000,
      status: "posted",
      reference: `MESS-F2-${yr}${mStr}`,
    });

    // 9. EXPENSES: Academic Materials, Textbooks & Printing
    txs.push({
      id: `tx-acad-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-ACAD-01`,
      date: `${yr}-${mStr}-12`,
      month: m,
      year: yr,
      type: "expense",
      category: "academic_materials",
      categoryLabel: CATEGORY_META.academic_materials.label,
      categoryLabelUrdu: CATEGORY_META.academic_materials.labelUrdu,
      description: "Dars-e-Nizami books, textbooks, teacher diaries & whiteboard supplies",
      system: "both",
      systemLabel: "Al-Qasim Integrated Network",
      partyName: "Maktaba Rahmania Kutub Khana",
      partyRole: "Vendor",
      paymentMethod: "cash",
      amount: 18500,
      status: "posted",
      reference: `BOOK-${yr}${mStr}`,
    });

    // 10. EXPENSES: Maintenance & Transport
    txs.push({
      id: `tx-maint-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-MAINT-01`,
      date: `${yr}-${mStr}-15`,
      month: m,
      year: yr,
      type: "expense",
      category: "campus_maintenance",
      categoryLabel: CATEGORY_META.campus_maintenance.label,
      categoryLabelUrdu: CATEGORY_META.campus_maintenance.labelUrdu,
      description: "Mosque & campus plumbing repair, LED replacements, and solar servicing",
      system: "both",
      systemLabel: "Al-Qasim Integrated Network",
      partyName: "Al-Madina Hardware & Solar Services",
      partyRole: "Vendor",
      paymentMethod: "cash",
      amount: 14500,
      status: "posted",
      reference: `MAINT-${yr}${mStr}`,
    });

    txs.push({
      id: `tx-trans-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-TRNS-01`,
      date: `${yr}-${mStr}-22`,
      month: m,
      year: yr,
      type: "expense",
      category: "transport_fuel",
      categoryLabel: CATEGORY_META.transport_fuel.label,
      categoryLabelUrdu: CATEGORY_META.transport_fuel.labelUrdu,
      description: "Student van diesel fuel vouchers and vehicle routine maintenance",
      system: "school",
      systemLabel: "Al-Qasim Academy (School)",
      partyName: "PSO Fueling Station — Ring Road",
      partyRole: "Vendor",
      paymentMethod: "online",
      amount: 22000,
      status: "posted",
      reference: `FUEL-${yr}${mStr}`,
    });
  }

  return txs;
}

// Unified financial ledger sourced from real transactions, database and persistent records
export function buildUnifiedFinancialLedger(serverTransactions?: ComprehensiveTransaction[]): ComprehensiveTransaction[] {
  const baseTransactions =
    serverTransactions && serverTransactions.length > 0
      ? serverTransactions
      : generateCanonicalTransactions();

  if (typeof window !== "undefined") {
    try {
      // 1. Persisted custom financial records
      const raw = localStorage.getItem("msmis_financial_transactions");
      let custom: ComprehensiveTransaction[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          custom = [...parsed];
        }
      }

      // 2. Also merge newly created donations from localStorage if not already present
      const rawDonations = localStorage.getItem("msmis_donations");
      if (rawDonations) {
        const parsedDonations = JSON.parse(rawDonations);
        if (Array.isArray(parsedDonations)) {
          const existingVouchers = new Set([
            ...baseTransactions.map((t) => t.voucherNo),
            ...custom.map((t) => t.voucherNo),
          ]);
          for (const d of parsedDonations) {
            if (d && d.receiptNo && !existingVouchers.has(d.receiptNo)) {
              const dDate = new Date(d.date || new Date().toISOString().slice(0, 10));
              const year = isNaN(dDate.getFullYear()) ? 2026 : dDate.getFullYear();
              const month = isNaN(dDate.getMonth()) ? 5 : dDate.getMonth() + 1;
              let category: TransactionCategory = "donation_general";
              if (d.type === "zakat") category = "donation_zakat";
              else if (d.type === "sadqa") category = "donation_sadqa";
              else if (d.type === "fitra") category = "donation_fitra";
              const meta = CATEGORY_META[category];
              custom.push({
                id: `tx-loc-don-${d.id || d.receiptNo}`,
                voucherNo: d.receiptNo,
                date: d.date || `${year}-${String(month).padStart(2, "0")}-15`,
                month,
                year,
                type: "income",
                category,
                categoryLabel: meta.label,
                categoryLabelUrdu: meta.labelUrdu,
                description: d.purpose ? `${meta.label}: ${d.purpose}` : `${meta.label} receipt from ${d.donor}`,
                system: "both",
                systemLabel: "Al-Qasim Integrated Network",
                partyName: d.donor,
                partyRole: "Donor",
                paymentMethod: d.method || "cash",
                amount: Math.round((d.amountPaisa || 0) / 100),
                status: "posted",
                reference: d.receiptNo,
              });
              existingVouchers.add(d.receiptNo);
            }
          }
        }
      }

      if (custom.length > 0) {
        const customIds = new Set(custom.map((c) => c.id));
        return [...custom, ...baseTransactions.filter((c) => !customIds.has(c.id))];
      }
    } catch {}
  }

  return baseTransactions;
}

export const allTransactions: ComprehensiveTransaction[] = buildUnifiedFinancialLedger();

// Helper to filter transactions
export function filterTransactions({
  transactions,
  type,
  scope = "both",
  period = "annually",
  year = 2026,
  month = new Date().getMonth() + 1,
  dateFrom,
  dateTo,
  query = "",
}: {
  transactions?: ComprehensiveTransaction[];
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
  const source = transactions ?? (typeof window !== "undefined" ? buildUnifiedFinancialLedger() : allTransactions);

  return source.filter((tx) => {
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
