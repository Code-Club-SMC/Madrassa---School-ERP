import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { feeAdjustments, feeCharges, feePayments, financeTransactions } from "@/db/schema/finance";
import { students, studentEnrollments } from "@/db/schema/students";
import { institutions, programs } from "@/db/schema/academic";
import { desc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server/authz";
import { listDonations, ensureDonationsLoaded } from "@/lib/server/finance/donations-service";

const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_UR = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];

function parseYMD(dateVal: string | Date | null | undefined): { year: number; month: number; day: number } {
  if (!dateVal) {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }
  if (dateVal instanceof Date) {
    return { year: dateVal.getFullYear(), month: dateVal.getMonth(), day: dateVal.getDate() };
  }
  const s = String(dateVal).slice(0, 10);
  const parts = s.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // 0-based
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { year: y, month: m, day: d };
    }
  }
  const dt = new Date(dateVal);
  return { year: dt.getFullYear(), month: dt.getMonth(), day: dt.getDate() };
}

export async function getFinanceOverview(request: Request) {
  await requirePermission(request, "finance", "view");

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed
  const endOfMonth = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999);
  const daysInMonth = endOfMonth.getDate();
  const monthName = now.toLocaleString("en-US", { month: "short" });

  // 1. Fetch real fee payments joined with student & academic info from DB
  const payments = await db
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
    .orderBy(desc(feePayments.receivedAt))
    .catch(() => []);

  // 2. Fetch all fee charges for dues calculation
  const charges = await db
    .select({
      id: feeCharges.id,
      amountPaisa: feeCharges.amountPaisa,
      status: feeCharges.status,
      type: feeCharges.type,
      dueDate: feeCharges.dueDate,
      createdAt: feeCharges.createdAt,
      programSystem: programs.system,
    })
    .from(feeCharges)
    .leftJoin(programs, eq(programs.id, feeCharges.programId))
    .catch(() => []);

  // 3. Fetch all recorded transactions from PostgreSQL table
  const dbTransactions = await db
    .select()
    .from(financeTransactions)
    .orderBy(desc(financeTransactions.date))
    .catch(() => []);

  const dbExpenses = dbTransactions.filter((t) => t.type === "expense");
  const dbIncomes = dbTransactions.filter((t) => t.type === "income");

  // 4. Merge file payments for offline/seed resilience
  let filePaymentsMapped: any[] = [];
  try {
    const pFile = path.join(process.cwd(), "public", "finance-fee-payments.json");
    if (fs.existsSync(pFile)) {
      const raw = fs.readFileSync(pFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        filePaymentsMapped = parsed.map((t: any) => ({
          id: t.id,
          receiptNo: t.voucherNo || t.id,
          amountPaisa: Math.round(Number(t.amount || 0) * 100),
          method: t.paymentMethod || "cash",
          receivedAt: t.date ? new Date(t.date) : new Date(),
          date: t.date,
          status: "posted" as const,
          payerName: t.partyName,
          studentId: t.id,
          studentName: t.partyName,
          studentNameUrdu: t.partyName,
          rollNo: t.reference || "",
          institutionId: t.institutionId || (t.system === "madrassa" ? "jamia_qasmia_baneen" : "al_qasim_academy"),
          institutionName: t.systemLabel || (t.system === "madrassa" ? "Jamia Qasimia" : "Al-Qasim Academy"),
          institutionNameUrdu: t.systemLabel || (t.system === "madrassa" ? "جامعہ قاسمیہ" : "القاسم اکیڈمی"),
          programSystem: t.system || "school",
          institutionSystem: t.system || "school",
        }));
      }
    }
  } catch {}

  const paymentMap = new Map<string, any>();
  // 4a. Add file payments
  for (const fp of filePaymentsMapped) {
    paymentMap.set(fp.receiptNo, fp);
    paymentMap.set(fp.id, fp);
  }
  // 4b. Add or enrich with DB payments
  for (const dp of payments || []) {
    paymentMap.set(dp.receiptNo, dp);
    paymentMap.set(dp.id, dp);
  }
  // 4c. Add DB income transactions
  for (const inc of dbIncomes) {
    const isMadrassa = inc.system === "madrassa";
    const instId = inc.institutionId || (isMadrassa ? "jamia_qasmia_baneen" : "al_qasim_academy");
    paymentMap.set(inc.id, {
      id: inc.id,
      receiptNo: inc.voucherNo || inc.id,
      amountPaisa: Math.round(Number(inc.amount || 0) * 100),
      method: inc.paymentMethod || "cash",
      receivedAt: inc.date ? new Date(inc.date) : new Date(),
      date: inc.date,
      status: "posted" as const,
      payerName: inc.partyName || "Counter Payer",
      studentId: inc.id,
      studentName: inc.partyName,
      studentNameUrdu: inc.partyName,
      rollNo: inc.reference || "",
      institutionId: instId,
      institutionName: isMadrassa ? "Jamia Qasimia" : "Al-Qasim Academy",
      institutionNameUrdu: isMadrassa ? "جامعہ قاسمیہ" : "القاسم اکیڈمی",
      programSystem: inc.system || "school",
      institutionSystem: inc.system || "school",
    });
  }
  const activePayments = Array.from(new Set(paymentMap.values()));

  // 5. Load institutional expenses: Database first, then file backups & inventory
  const expenseMap = new Map<string, any>();

  // 5a. File expenses backup
  try {
    const expFile = path.join(process.cwd(), "public", "finance-expenses.json");
    if (fs.existsSync(expFile)) {
      const expRaw = fs.readFileSync(expFile, "utf-8");
      const parsedExp = JSON.parse(expRaw);
      if (Array.isArray(parsedExp)) {
        parsedExp.forEach((e: any) => {
          const key = e.id || e.voucherNo;
          expenseMap.set(key, {
            id: e.id || key,
            voucherNo: e.voucherNo || key,
            date: e.date,
            amount: Number(e.amount) || 0,
            system: e.system || "both",
            institutionId: e.institutionId || (e.system === "school" ? "al_qasim_academy" : e.system === "madrassa" ? "jamia_qasmia_baneen" : "al_qasim_integrated"),
            category: e.category || "misc_expense",
            categoryLabel: e.categoryLabel || "Operational Expense",
            categoryLabelUrdu: e.categoryLabelUrdu || "شعبہ جاتی اخراجات",
            description: e.description || "Operational Expense",
            descriptionUrdu: e.descriptionUrdu || e.description || "اخراجات",
            partyName: e.partyName || "Vendor / Supplier",
            paymentMethod: e.paymentMethod || "cash",
          });
        });
      }
    }
  } catch {}

  // 5b. Inventory items purchase expense
  try {
    const invFile = path.join(process.cwd(), "public", "inventory-items.json");
    if (fs.existsSync(invFile)) {
      const invRaw = fs.readFileSync(invFile, "utf-8");
      const parsedInv = JSON.parse(invRaw);
      if (Array.isArray(parsedInv)) {
        parsedInv
          .filter((it: any) => it.type === "purchased" && (it.value || 0) > 0)
          .forEach((it: any) => {
            const invId = `inv-${it.id}`;
            expenseMap.set(invId, {
              id: invId,
              voucherNo: `INV-${it.id.slice(0, 8)}`,
              date: it.lastRestocked || `${curYear}-${String(curMonth + 1).padStart(2, "0")}-15`,
              amount: it.value || 0,
              system: "both",
              institutionId: "al_qasim_integrated",
              category: "inventory",
              categoryLabel: "Inventory Purchase",
              categoryLabelUrdu: "سامان و اسٹاک کی خریداری",
              description: `Inventory stock purchase: ${it.name} (${it.quantity} ${it.unit})`,
              descriptionUrdu: `سامان و اسٹاک کی خریداری: ${it.nameUrdu || it.name}`,
              partyName: it.name,
              paymentMethod: "cash",
            });
          });
      }
    }
  } catch {}

  // 5c. Database expenses (highest authority, overwrites backup copies)
  dbExpenses.forEach((e) => {
    expenseMap.set(e.id, {
      id: e.id,
      voucherNo: e.voucherNo,
      date: e.date,
      amount: Number(e.amount) || 0,
      system: e.system || "both",
      institutionId: e.institutionId || (e.system === "school" ? "al_qasim_academy" : e.system === "madrassa" ? "jamia_qasmia_baneen" : "al_qasim_integrated"),
      category: e.category,
      categoryLabel: e.category,
      categoryLabelUrdu: e.categoryUrdu || e.category,
      description: e.description,
      descriptionUrdu: e.descriptionUrdu || e.description,
      partyName: e.partyName,
      paymentMethod: e.paymentMethod,
    });
  });

  const expenseList = Array.from(expenseMap.values());

  // 6. Load real donations
  await ensureDonationsLoaded().catch(() => {});
  const donationList = listDonations();

  // 7. Daily mapping for current month
  const daySchoolMap = new Map<number, number>();
  const dayMadrassaMap = new Map<number, number>();
  const daySchoolExpenseMap = new Map<number, number>();
  const dayMadrassaExpenseMap = new Map<number, number>();

  activePayments.forEach((p) => {
    const parsed = parseYMD(p.date || p.receivedAt);
    if (parsed.year === curYear && parsed.month === curMonth) {
      const day = parsed.day;
      const rupees = Math.round(p.amountPaisa / 100);
      const isMadrassa = p.programSystem === "madrassa" || p.institutionSystem === "madrassa" || p.institutionId === "jamia_qasmia_baneen" || p.institutionId === "jamia_zainab_banat";
      if (isMadrassa) {
        dayMadrassaMap.set(day, (dayMadrassaMap.get(day) ?? 0) + rupees);
      } else {
        daySchoolMap.set(day, (daySchoolMap.get(day) ?? 0) + rupees);
      }
    }
  });

  donationList.forEach((don) => {
    const parsed = parseYMD(don.date);
    if (parsed.year === curYear && parsed.month === curMonth) {
      const day = parsed.day;
      const rupees = Math.round(don.amountPaisa / 100);
      const pLower = (don.purpose || "").toLowerCase();
      const isSchool = pLower.includes("school") || pLower.includes("اکیڈمی");
      if (isSchool) {
        daySchoolMap.set(day, (daySchoolMap.get(day) ?? 0) + rupees);
      } else {
        dayMadrassaMap.set(day, (dayMadrassaMap.get(day) ?? 0) + rupees);
      }
    }
  });

  expenseList.forEach((e) => {
    const parsed = parseYMD(e.date);
    if (parsed.year === curYear && parsed.month === curMonth) {
      const day = parsed.day;
      const amt = Number(e.amount) || 0;
      if (e.system === "school") {
        daySchoolExpenseMap.set(day, (daySchoolExpenseMap.get(day) ?? 0) + amt);
      } else if (e.system === "madrassa") {
        dayMadrassaExpenseMap.set(day, (dayMadrassaExpenseMap.get(day) ?? 0) + amt);
      } else {
        const half = Math.round(amt / 2);
        daySchoolExpenseMap.set(day, (daySchoolExpenseMap.get(day) ?? 0) + half);
        dayMadrassaExpenseMap.set(day, (dayMadrassaExpenseMap.get(day) ?? 0) + (amt - half));
      }
    }
  });

  const dailyHistory = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const schoolIncome = daySchoolMap.get(day) ?? 0;
    const madrassaIncome = dayMadrassaMap.get(day) ?? 0;
    const schoolExpense = daySchoolExpenseMap.get(day) ?? 0;
    const madrassaExpense = dayMadrassaExpenseMap.get(day) ?? 0;
    return {
      day: `${day}`,
      fullLabel: `${monthName} ${day}`,
      income: schoolIncome + madrassaIncome,
      expense: schoolExpense + madrassaExpense,
      schoolIncome,
      madrassaIncome,
      schoolExpense,
      madrassaExpense,
    };
  });

  // 8. Monthly history for last 12 months
  const monthlyHistory = [];
  for (let i = 11; i >= 0; i--) {
    const targetDate = new Date(curYear, curMonth - i, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth(); // 0-based
    const mIndex = targetMonth;

    const paymentsInMonth = activePayments.filter((p) => {
      const parsed = parseYMD(p.date || p.receivedAt);
      return parsed.year === targetYear && parsed.month === targetMonth;
    });

    const donationsInMonth = donationList.filter((don) => {
      const parsed = parseYMD(don.date);
      return parsed.year === targetYear && parsed.month === targetMonth;
    });

    const expensesInMonth = expenseList.filter((e) => {
      const parsed = parseYMD(e.date);
      return parsed.year === targetYear && parsed.month === targetMonth;
    });

    const feeSchoolInc = Math.round(
      paymentsInMonth
        .filter((p) => p.programSystem !== "madrassa" && p.institutionSystem !== "madrassa")
        .reduce((sum, p) => sum + p.amountPaisa, 0) / 100,
    );
    const donSchoolInc = Math.round(
      donationsInMonth
        .filter((don) => (don.purpose || "").toLowerCase().includes("school") || (don.purpose || "").toLowerCase().includes("اکیڈمی"))
        .reduce((sum, don) => sum + don.amountPaisa, 0) / 100,
    );
    const schoolInc = feeSchoolInc + donSchoolInc;

    const feeMadrassaInc = Math.round(
      paymentsInMonth
        .filter((p) => p.programSystem === "madrassa" || p.institutionSystem === "madrassa")
        .reduce((sum, p) => sum + p.amountPaisa, 0) / 100,
    );
    const donMadrassaInc = Math.round(
      donationsInMonth
        .filter((don) => !(don.purpose || "").toLowerCase().includes("school") && !(don.purpose || "").toLowerCase().includes("اکیڈمی"))
        .reduce((sum, don) => sum + don.amountPaisa, 0) / 100,
    );
    const madrassaInc = feeMadrassaInc + donMadrassaInc;

    const schoolExp = Math.round(
      expensesInMonth
        .filter((e) => e.system === "school")
        .reduce((sum, e) => sum + e.amount, 0) +
        expensesInMonth
          .filter((e) => e.system === "both" || !e.system)
          .reduce((sum, e) => sum + Math.round(e.amount / 2), 0),
    );
    const madrassaExp = Math.round(
      expensesInMonth
        .filter((e) => e.system === "madrassa")
        .reduce((sum, e) => sum + e.amount, 0) +
        expensesInMonth
          .filter((e) => e.system === "both" || !e.system)
          .reduce((sum, e) => sum + (e.amount - Math.round(e.amount / 2)), 0),
    );

    monthlyHistory.push({
      month: MONTH_NAMES_EN[mIndex],
      monthUr: MONTH_NAMES_UR[mIndex],
      income: schoolInc + madrassaInc,
      expense: schoolExp + madrassaExp,
      schoolIncome: schoolInc,
      madrassaIncome: madrassaInc,
      schoolExpense: schoolExp,
      madrassaExpense: madrassaExp,
    });
  }

  // 9. KPIs
  const thisMonthExpenses = expenseList.filter((e) => {
    const parsed = parseYMD(e.date);
    return parsed.year === curYear && parsed.month === curMonth;
  });
  const monthlyExpense = Math.round(thisMonthExpenses.reduce((s, e) => s + e.amount, 0));
  const schoolMonthlyExpense = Math.round(
    thisMonthExpenses
      .filter((e) => e.system === "school")
      .reduce((s, e) => s + e.amount, 0) +
      thisMonthExpenses
        .filter((e) => e.system === "both" || !e.system)
        .reduce((s, e) => s + Math.round(e.amount / 2), 0),
  );
  const madrassaMonthlyExpense = Math.round(
    thisMonthExpenses
      .filter((e) => e.system === "madrassa")
      .reduce((s, e) => s + e.amount, 0) +
      thisMonthExpenses
        .filter((e) => e.system === "both" || !e.system)
        .reduce((s, e) => s + (e.amount - Math.round(e.amount / 2)), 0),
  );

  const thisYearExpenses = expenseList.filter((e) => {
    const parsed = parseYMD(e.date);
    return parsed.year === curYear;
  });
  const annualExpense = Math.round(thisYearExpenses.reduce((s, e) => s + e.amount, 0));
  const schoolAnnualExpense = Math.round(
    thisYearExpenses
      .filter((e) => e.system === "school")
      .reduce((s, e) => s + e.amount, 0) +
      thisYearExpenses
        .filter((e) => e.system === "both" || !e.system)
        .reduce((s, e) => s + Math.round(e.amount / 2), 0),
  );
  const madrassaAnnualExpense = Math.round(
    thisYearExpenses
      .filter((e) => e.system === "madrassa")
      .reduce((s, e) => s + e.amount, 0) +
      thisYearExpenses
        .filter((e) => e.system === "both" || !e.system)
        .reduce((s, e) => s + (e.amount - Math.round(e.amount / 2)), 0),
  );

  const thisMonthPayments = activePayments.filter((p) => {
    const parsed = parseYMD(p.date || p.receivedAt);
    return parsed.year === curYear && parsed.month === curMonth;
  });
  const thisMonthDonations = donationList.filter((don) => {
    const parsed = parseYMD(don.date);
    return parsed.year === curYear && parsed.month === curMonth;
  });
  const feeMonthlyIncome = Math.round(thisMonthPayments.reduce((s, p) => s + p.amountPaisa, 0) / 100);
  const donMonthlyIncome = Math.round(thisMonthDonations.reduce((s, don) => s + don.amountPaisa, 0) / 100);
  const monthlyIncome = feeMonthlyIncome + donMonthlyIncome;

  const feeSchoolMonthlyIncome = Math.round(
    thisMonthPayments
      .filter((p) => p.programSystem !== "madrassa" && p.institutionSystem !== "madrassa")
      .reduce((s, p) => s + p.amountPaisa, 0) / 100,
  );
  const donSchoolMonthlyIncome = Math.round(
    thisMonthDonations
      .filter((don) => (don.purpose || "").toLowerCase().includes("school") || (don.purpose || "").toLowerCase().includes("اکیڈمی"))
      .reduce((s, don) => s + don.amountPaisa, 0) / 100,
  );
  const schoolMonthlyIncome = feeSchoolMonthlyIncome + donSchoolMonthlyIncome;

  const feeMadrassaMonthlyIncome = Math.round(
    thisMonthPayments
      .filter((p) => p.programSystem === "madrassa" || p.institutionSystem === "madrassa")
      .reduce((s, p) => s + p.amountPaisa, 0) / 100,
  );
  const donMadrassaMonthlyIncome = Math.round(
    thisMonthDonations
      .filter((don) => !(don.purpose || "").toLowerCase().includes("school") && !(don.purpose || "").toLowerCase().includes("اکیڈمی"))
      .reduce((s, don) => s + don.amountPaisa, 0) / 100,
  );
  const madrassaMonthlyIncome = feeMadrassaMonthlyIncome + donMadrassaMonthlyIncome;

  const thisYearPayments = activePayments.filter((p) => {
    const parsed = parseYMD(p.date || p.receivedAt);
    return parsed.year === curYear;
  });
  const thisYearDonations = donationList.filter((don) => {
    const parsed = parseYMD(don.date);
    return parsed.year === curYear;
  });

  const feeAnnualIncome = Math.round(thisYearPayments.reduce((s, p) => s + p.amountPaisa, 0) / 100);
  const donAnnualIncome = Math.round(thisYearDonations.reduce((s, don) => s + don.amountPaisa, 0) / 100);
  const annualIncome = feeAnnualIncome + donAnnualIncome;

  const feeSchoolAnnualIncome = Math.round(
    thisYearPayments
      .filter((p) => p.programSystem !== "madrassa" && p.institutionSystem !== "madrassa")
      .reduce((s, p) => s + p.amountPaisa, 0) / 100,
  );
  const donSchoolAnnualIncome = Math.round(
    thisYearDonations
      .filter((don) => (don.purpose || "").toLowerCase().includes("school") || (don.purpose || "").toLowerCase().includes("اکیڈمی"))
      .reduce((s, don) => s + don.amountPaisa, 0) / 100,
  );
  const schoolAnnualIncome = feeSchoolAnnualIncome + donSchoolAnnualIncome;

  const feeMadrassaAnnualIncome = Math.round(
    thisYearPayments
      .filter((p) => p.programSystem === "madrassa" || p.institutionSystem === "madrassa")
      .reduce((s, p) => s + p.amountPaisa, 0) / 100,
  );
  const donMadrassaAnnualIncome = Math.round(
    thisYearDonations
      .filter((don) => !(don.purpose || "").toLowerCase().includes("school") && !(don.purpose || "").toLowerCase().includes("اکیڈمی"))
      .reduce((s, don) => s + don.amountPaisa, 0) / 100,
  );
  const madrassaAnnualIncome = feeMadrassaAnnualIncome + donMadrassaAnnualIncome;

  const openCharges = charges.filter((c) => c.status === "open" || c.status === "partial");
  const openArrears = Math.round(openCharges.reduce((s, c) => s + c.amountPaisa, 0) / 100);
  const monthlyTarget = Math.max(monthlyIncome, monthlyIncome + openArrears);
  const recoveryRate = monthlyTarget > 0 ? Math.round((monthlyIncome / monthlyTarget) * 100) : 0;

  // 10. Recent transactions (fee collections + donations + expenses) with institutional identifiers
  const recentIncome = activePayments.map((p) => {
    const isMadrassa = p.programSystem === "madrassa" || p.institutionSystem === "madrassa";
    const instId = p.institutionId || (isMadrassa ? "jamia_qasmia_baneen" : "al_qasim_academy");
    const studentEn = p.studentName || p.studentNameUrdu;
    const studentUr = p.studentNameUrdu || p.studentName;
    const rollPart = p.rollNo ? ` (${p.rollNo})` : "";
    const dateStr = p.date ? String(p.date).slice(0, 10) : p.receivedAt instanceof Date ? p.receivedAt.toISOString().slice(0, 10) : String(p.receivedAt).slice(0, 10);
    return {
      id: p.id,
      date: dateStr,
      type: "income" as const,
      category: "fees" as const,
      categoryUrdu: "فیس طلباء",
      description: `Fee Collection: Receipt #${p.receiptNo} · ${studentEn}${rollPart}`,
      descriptionUrdu: `فیس وصولی: رسید #${p.receiptNo} · ${studentUr}${rollPart}`,
      amount: Math.round(p.amountPaisa / 100),
      source: p.payerName || (p.method === "cash" ? "Cash" : p.method === "bank" ? "Bank" : "Online"),
      sourceUrdu: p.payerName || (p.method === "cash" ? "نقد" : p.method === "bank" ? "بینک" : "آن لائن"),
      system: (isMadrassa ? "madrassa" : "school") as "school" | "madrassa" | "both",
      institutionId: instId,
    };
  });

  const recentDonations = donationList.slice(0, 50).map((don) => {
    const pLower = (don.purpose || "").toLowerCase();
    const isSchool = pLower.includes("school") || pLower.includes("اکیڈمی");
    const typeLabelEn = don.type === "zakat" ? "Zakat Fund" : don.type === "sadqa" ? "Sadqa" : don.type === "fitra" ? "Fitrana" : don.type === "khairat" ? "Khairat" : "General Donation";
    const typeLabelUr = don.type === "zakat" ? "زکوٰۃ فنڈ" : don.type === "sadqa" ? "صدقہ و خیرات" : don.type === "fitra" ? "فطرانہ" : don.type === "khairat" ? "خیرات" : "عام عطیات";
    const instId = isSchool ? "al_qasim_academy" : "jamia_qasmia_baneen";

    return {
      id: `don-${don.id}`,
      date: don.date,
      type: "income" as const,
      category: don.type === "zakat" ? ("zakat" as const) : don.type === "sadqa" || don.type === "khairat" ? ("sadqa" as const) : ("donations" as const),
      categoryUrdu: typeLabelUr,
      description: `Donation: Receipt #${don.receiptNo} · ${don.donor} (${don.purpose || typeLabelEn})`,
      descriptionUrdu: `عطیہ رسید #${don.receiptNo} · ${don.donorUrdu || don.donor} (${don.purpose || typeLabelUr})`,
      amount: Math.round(don.amountPaisa / 100),
      source: don.donor || (don.method === "cash" ? "Cash" : don.method === "bank" ? "Bank" : "Online"),
      sourceUrdu: don.donorUrdu || don.donor || (don.method === "cash" ? "نقد" : don.method === "bank" ? "بینک" : "آن لائن"),
      system: (isSchool ? "school" : "madrassa") as "school" | "madrassa" | "both",
      institutionId: instId,
    };
  });

  const recentExpenses = expenseList.slice(0, 60).map((e: any, idx) => {
    const cat = e.category || "";
    const isSalary = cat.includes("salary");
    const isUtil = cat.includes("util");
    const isMess = cat.includes("mess");
    const categoryKey = isSalary ? "salary" : isUtil ? "utilities" : isMess ? "misc" : "inventory";
    const categoryUrdu = isSalary ? "تنخواہیں" : isUtil ? "یوٹیلیٹیز" : isMess ? "طعام و راشن" : "سامان و اسٹاک";
    const instId = e.institutionId || (e.system === "school" ? "al_qasim_academy" : e.system === "madrassa" ? "jamia_qasmia_baneen" : "al_qasim_integrated");
    return {
      id: e.id || `exp-${idx}-${e.date}`,
      date: e.date,
      type: "expense" as const,
      category: categoryKey as any,
      categoryUrdu: e.categoryUrdu || categoryUrdu,
      description: e.description || `Disbursement: ${e.categoryLabel || "Operational Expense"}`,
      descriptionUrdu: e.descriptionUrdu || e.description || `اخراجات: ${e.categoryLabelUrdu || "شعبہ جاتی مدات"}`,
      amount: e.amount,
      source: e.partyName || (e.paymentMethod === "online" ? "Online" : e.paymentMethod === "bank" ? "Bank" : "Cash"),
      sourceUrdu: e.partyName || (e.paymentMethod === "online" ? "آن لائن" : e.paymentMethod === "bank" ? "بینک" : "نقد"),
      system: (e.system || "both") as "school" | "madrassa" | "both",
      institutionId: instId,
    };
  });

  const recentTransactions = [...recentIncome, ...recentDonations, ...recentExpenses].sort((a, b) =>
    b.date > a.date ? 1 : b.date < a.date ? -1 : 0,
  );

  const totalDonationsReceived = Math.round(donationList.reduce((s, d) => s + d.amountPaisa, 0) / 100);
  const totalZakat = Math.round(donationList.filter((d) => d.type === "zakat" || d.type === "fitra").reduce((s, d) => s + d.amountPaisa, 0) / 100);
  const totalSadqa = Math.round(donationList.filter((d) => d.type === "sadqa" || d.type === "khairat").reduce((s, d) => s + d.amountPaisa, 0) / 100);
  const totalGeneral = Math.round(donationList.filter((d) => d.type === "general").reduce((s, d) => s + d.amountPaisa, 0) / 100);

  return {
    kpis: {
      monthlyIncome,
      schoolMonthlyIncome,
      madrassaMonthlyIncome,
      annualIncome,
      schoolAnnualIncome,
      madrassaAnnualIncome,
      monthlyExpense,
      schoolMonthlyExpense,
      madrassaMonthlyExpense,
      annualExpense,
      schoolAnnualExpense,
      madrassaAnnualExpense,
      openArrears,
      recoveryRate,
      donationsTotal: totalDonationsReceived,
    },
    donationsSummary: {
      totalReceived: totalDonationsReceived,
      receiptsCount: donationList.length,
      zakat: totalZakat,
      sadqa: totalSadqa,
      general: totalGeneral,
      items: donationList.slice(0, 10),
    },
    dailyHistory,
    monthlyHistory,
    recentTransactions,
  };
}
