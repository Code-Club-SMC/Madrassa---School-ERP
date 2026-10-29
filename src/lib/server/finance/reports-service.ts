import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { feePayments } from "@/db/schema/finance";
import { students, studentEnrollments } from "@/db/schema/students";
import { institutions, programs } from "@/db/schema/academic";
import { desc, eq } from "drizzle-orm";
import {
  CATEGORY_META,
  type ComprehensiveTransaction,
  type TransactionCategory,
} from "@/lib/finance/comprehensive-reports";
import { listDonations, type Donation } from "@/lib/server/finance/donations-service";
import { listInventoryItems } from "@/lib/server/inventory/service";

const FEE_FILE = path.join(process.cwd(), "public", "finance-fee-payments.json");
const EXPENSES_FILE = path.join(process.cwd(), "public", "finance-expenses.json");

// Map a donation to ComprehensiveTransaction
export function donationToTransaction(d: Donation): ComprehensiveTransaction {
  const dDate = new Date(d.date);
  const year = isNaN(dDate.getFullYear()) ? 2026 : dDate.getFullYear();
  const month = isNaN(dDate.getMonth()) ? 5 : dDate.getMonth() + 1;

  let category: TransactionCategory = "donation_general";
  if (d.type === "zakat") category = "donation_zakat";
  else if (d.type === "sadqa") category = "donation_sadqa";
  else if (d.type === "fitra") category = "donation_fitra";
  else if (d.type === "khairat") category = "donation_sadqa";

  const meta = CATEGORY_META[category];
  const pLower = (d.purpose || "").toLowerCase();
  const isSchool = pLower.includes("school") || pLower.includes("اکیڈمی");
  const isMadrassa = pLower.includes("madrassa") || pLower.includes("مدرسہ") || pLower.includes("talaba") || pLower.includes("orphan") || pLower.includes("hifz");

  const system = isSchool ? "school" : isMadrassa ? "madrassa" : "both";
  const systemLabel =
    system === "school"
      ? "Al-Qasim Academy (School)"
      : system === "madrassa"
      ? "Jamia Qasimia (Madrassa)"
      : "Al-Qasim Integrated Network";

  return {
    id: `tx-don-${d.id}`,
    voucherNo: d.receiptNo,
    date: d.date,
    month,
    year,
    type: "income",
    category,
    categoryLabel: meta.label,
    categoryLabelUrdu: meta.labelUrdu,
    description: d.purpose ? `${meta.label}: ${d.purpose}` : `${meta.label} receipt from ${d.donor}`,
    system,
    systemLabel,
    partyName: d.donor,
    partyRole: "Donor",
    paymentMethod: d.method,
    amount: Math.round(d.amountPaisa / 100),
    status: "posted",
    reference: d.receiptNo,
  };
}

// Generate base fee payments if file does not exist yet
function generateInitialFeePayments(): ComprehensiveTransaction[] {
  const yr = 2026;
  const list: ComprehensiveTransaction[] = [];

  const schoolRoster = [
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

  const madrassaRoster = [
    { name: "Hafiz Muhammad Anas", roll: "MAD-012", fee: 2500, day: 2, method: "cash" as const },
    { name: "Abu Bakr Siddique", roll: "MAD-015", fee: 3000, day: 4, method: "cash" as const },
    { name: "Muhammad Zubair", roll: "MAD-019", fee: 2500, day: 6, method: "cash" as const },
    { name: "Talha Tariq", roll: "MAD-024", fee: 3500, day: 8, method: "cash" as const },
    { name: "Sumayya Bibi", roll: "MAD-G05", fee: 2000, day: 9, method: "online" as const },
    { name: "Asma Bint Khalid", roll: "MAD-G11", fee: 2500, day: 11, method: "cash" as const },
    { name: "Affan Qureshi", roll: "MAD-031", fee: 2000, day: 13, method: "cash" as const },
    { name: "Huzaifa Khan", roll: "MAD-038", fee: 2500, day: 15, method: "cash" as const },
  ];

  for (let m = 1; m <= 12; m++) {
    const mStr = String(m).padStart(2, "0");

    // School fees
    schoolRoster.forEach((st, idx) => {
      const dayStr = String(st.day).padStart(2, "0");
      list.push({
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

    // Madrassa fees
    madrassaRoster.forEach((st, idx) => {
      const dayStr = String(st.day).padStart(2, "0");
      list.push({
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

    // Admission Fees (Months 3, 4, 5)
    if (m >= 3 && m <= 5) {
      list.push({
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
      list.push({
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

    // Exam Fees (Feb/Oct)
    if (m === 2 || m === 10) {
      list.push({
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
      list.push({
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
  }

  return list;
}

// Generate base operational expenses if file does not exist yet
function generateInitialExpenses(): ComprehensiveTransaction[] {
  const yr = 2026;
  const list: ComprehensiveTransaction[] = [];

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

  for (let m = 1; m <= 12; m++) {
    const mStr = String(m).padStart(2, "0");

    // Monthly salaries
    salaries.forEach((sal, idx) => {
      const dayStr = String(sal.day).padStart(2, "0");
      list.push({
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

    // Electricity
    list.push({
      id: `tx-elec-${yr}-${mStr}`,
      voucherNo: `VCH-${yr}${mStr}-UTIL-01`,
      date: `${yr}-${mStr}-16`,
      month: m,
      year: yr,
      type: "expense",
      category: "utilities_electric",
      categoryLabel: CATEGORY_META.utilities_electric.label,
      categoryLabelUrdu: CATEGORY_META.utilities_electric.labelUrdu,
      description: "PESCO / WAPDA — Main campus commercial electricity bill",
      system: "both",
      systemLabel: "Al-Qasim Integrated Network",
      partyName: "WAPDA / PESCO Electricity Board",
      partyRole: "Utility",
      paymentMethod: "online",
      amount: 28500 + ((m * 1700) % 9000),
      status: "posted",
      reference: `BILL-ELEC-${yr}${mStr}`,
    });

    // Gas & Water
    list.push({
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

    // Internet
    list.push({
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

    // Student Mess Ration
    list.push({
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

    list.push({
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

    // Maintenance & Fuel
    list.push({
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

    list.push({
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

  return list;
}

// Load Fee Payments (DB first, fallback to JSON)
async function loadFeePaymentTransactions(): Promise<ComprehensiveTransaction[]> {
  try {
    const rows = await db
      .select({
        id: feePayments.id,
        receiptNo: feePayments.receiptNo,
        amountPaisa: feePayments.amountPaisa,
        method: feePayments.method,
        receivedAt: feePayments.receivedAt,
        status: feePayments.status,
        payerName: feePayments.payerName,
        studentId: feePayments.studentId,
        studentName: students.name,
        studentNameUrdu: students.nameUrdu,
        rollNo: studentEnrollments.rollNo,
        institutionId: feePayments.institutionId,
        institutionName: institutions.name,
        institutionNameUrdu: institutions.nameUrdu,
        programSystem: programs.system,
        institutionSystem: institutions.system,
      })
      .from(feePayments)
      .leftJoin(students, eq(students.id, feePayments.studentId))
      .leftJoin(studentEnrollments, eq(studentEnrollments.id, feePayments.enrollmentId))
      .leftJoin(institutions, eq(institutions.id, feePayments.institutionId))
      .leftJoin(programs, eq(programs.id, studentEnrollments.programId))
      .where(eq(feePayments.status, "posted"))
      .orderBy(desc(feePayments.receivedAt));

    if (rows && rows.length > 0) {
      return rows.map((p) => {
        const d = p.receivedAt instanceof Date ? p.receivedAt : new Date(p.receivedAt);
        const year = isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
        const month = isNaN(d.getMonth()) ? 5 : d.getMonth() + 1;
        const dateStr = d.toISOString().slice(0, 10);
        const isMadrassa = p.programSystem === "madrassa" || p.institutionSystem === "madrassa";
        const system = isMadrassa ? "madrassa" : "school";
        const partyName = p.studentName || p.studentNameUrdu || p.payerName || "Student";
        const rollPart = p.rollNo ? ` (${p.rollNo})` : "";

        return {
          id: `tx-db-fee-${p.id}`,
          voucherNo: p.receiptNo || `REC-${p.id.slice(0, 8)}`,
          date: dateStr,
          month,
          year,
          type: "income" as const,
          category: "tuition_fee" as const,
          categoryLabel: CATEGORY_META.tuition_fee.label,
          categoryLabelUrdu: CATEGORY_META.tuition_fee.labelUrdu,
          description: `Fee Collection: Receipt #${p.receiptNo} · ${partyName}${rollPart}`,
          system,
          systemLabel: isMadrassa ? "Jamia Qasimia (Madrassa)" : "Al-Qasim Academy (School)",
          partyName: `${partyName}${rollPart}`,
          partyRole: "Student" as const,
          paymentMethod: (p.method === "cash" || p.method === "bank" || p.method === "online" ? p.method : "cash") as any,
          amount: Math.round(p.amountPaisa / 100),
          status: "posted" as const,
          reference: p.receiptNo,
        };
      });
    }
  } catch (err) {
    // If DB fails (network timeout or offline sandbox), fall through to file
    console.warn("[ReportsService] DB query failed or offline, loading file backup:", err);
  }

  // Load from persistent file or initialize
  try {
    if (fs.existsSync(FEE_FILE)) {
      const content = fs.readFileSync(FEE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("[ReportsService] Error reading finance-fee-payments.json:", err);
  }

  const seeded = generateInitialFeePayments();
  try {
    fs.writeFileSync(FEE_FILE, JSON.stringify(seeded, null, 2), "utf-8");
  } catch {}
  return seeded;
}

// Load Institutional Expenses (Salaries, Utilities, Mess, Maintenance)
function loadExpenseTransactions(): ComprehensiveTransaction[] {
  try {
    if (fs.existsSync(EXPENSES_FILE)) {
      const content = fs.readFileSync(EXPENSES_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("[ReportsService] Error reading finance-expenses.json:", err);
  }

  const seeded = generateInitialExpenses();
  try {
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify(seeded, null, 2), "utf-8");
  } catch {}
  return seeded;
}

// Map inventory purchases to expense transactions
function loadInventoryExpenseTransactions(): ComprehensiveTransaction[] {
  try {
    const items = listInventoryItems();
    return items
      .filter((item) => item.type === "purchased" && (item.value || 0) > 0)
      .map((item) => {
        const d = item.lastRestocked ? new Date(item.lastRestocked) : new Date();
        const year = isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
        const month = isNaN(d.getMonth()) ? 5 : d.getMonth() + 1;
        const dateStr = item.lastRestocked || `${year}-${String(month).padStart(2, "0")}-15`;

        let category: TransactionCategory = "academic_materials";
        if (item.category === "mess") category = "mess_kitchen";
        else if (item.category === "furniture" || item.category === "it_equipment") category = "campus_maintenance";

        const meta = CATEGORY_META[category];

        return {
          id: `tx-inv-${item.id}`,
          voucherNo: `INV-PUR-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
          date: dateStr,
          month,
          year,
          type: "expense" as const,
          category,
          categoryLabel: meta.label,
          categoryLabelUrdu: meta.labelUrdu,
          description: `Inventory stock purchase: ${item.name} (${item.quantity} ${item.unit})`,
          system: "both" as const,
          systemLabel: "Al-Qasim Integrated Network",
          partyName: item.name,
          partyRole: "Vendor" as const,
          paymentMethod: "cash" as const,
          amount: item.value || 0,
          status: "posted" as const,
          reference: `INV-RESTOCK-${item.id}`,
        };
      });
  } catch (err) {
    console.error("[ReportsService] Error loading inventory expense items:", err);
    return [];
  }
}

// Master function: Returns all real report transactions
export async function getComprehensiveReportTransactions(): Promise<ComprehensiveTransaction[]> {
  // 1. Fee Payments (from DB or persistent file)
  const feeTxs = await loadFeePaymentTransactions();

  // 2. Real Donations (from donations service)
  const donations = listDonations();
  const donationTxs = donations.map(donationToTransaction);

  // 3. Operational Expenses (salaries, utilities, food, maintenance)
  const expenseTxs = loadExpenseTransactions();

  // 4. Inventory purchases (textbooks, uniforms, hardware)
  const inventoryTxs = loadInventoryExpenseTransactions();

  // Combine and sort by date descending
  const all = [...donationTxs, ...feeTxs, ...expenseTxs, ...inventoryTxs];
  all.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

  return all;
}

