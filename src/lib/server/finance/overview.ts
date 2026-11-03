import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { feeAdjustments, feeCharges, feePayments } from "@/db/schema/finance";
import { students, studentEnrollments } from "@/db/schema/students";
import { institutions, programs } from "@/db/schema/academic";
import { desc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server/authz";
import { listDonations, ensureDonationsLoaded } from "@/lib/server/finance/donations-service";

const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_UR = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];

export async function getFinanceOverview(request: Request) {
  await requirePermission(request, "finance", "view");

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed
  const startOfMonth = new Date(curYear, curMonth, 1);
  const endOfMonth = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999);
  const startOfYear = new Date(curYear, 0, 1);
  const daysInMonth = endOfMonth.getDate();
  const monthName = now.toLocaleString("en-US", { month: "short" });

  // 1. Fetch real fee payments joined with student & academic info
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
          status: "posted" as const,
          payerName: t.partyName,
          studentId: t.id,
          studentName: t.partyName,
          studentNameUrdu: t.partyName,
          rollNo: t.reference || "",
          institutionId: t.system === "madrassa" ? "inst-madrassa" : "inst-school",
          institutionName: t.systemLabel || (t.system === "madrassa" ? "Jamia Qasimia" : "Al-Qasim Academy"),
          institutionNameUrdu: t.systemLabel || (t.system === "madrassa" ? "جامعہ قاسمیہ" : "القاسم اکیڈمی"),
          programSystem: t.system || "school",
          institutionSystem: t.system || "school",
        }));
      }
    }
  } catch {}

  const paymentMap = new Map<string, any>();
  // 1. Add file payments
  for (const fp of filePaymentsMapped) {
    paymentMap.set(fp.receiptNo, fp);
    paymentMap.set(fp.id, fp);
  }
  // 2. Add or enrich with DB payments
  for (const dp of payments || []) {
    paymentMap.set(dp.receiptNo, dp);
    paymentMap.set(dp.id, dp);
  }
  const activePayments = Array.from(new Set(paymentMap.values()));

  // Load real institutional expenses (including purchased inventory)
  const expenseList: Array<{ date: string; amount: number; system: string }> = [];
  try {
    const expFile = path.join(process.cwd(), "public", "finance-expenses.json");
    if (fs.existsSync(expFile)) {
      const expRaw = fs.readFileSync(expFile, "utf-8");
      const parsedExp = JSON.parse(expRaw);
      if (Array.isArray(parsedExp)) {
        expenseList.push(...parsedExp);
      }
    }
    const invFile = path.join(process.cwd(), "public", "inventory-items.json");
    if (fs.existsSync(invFile)) {
      const invRaw = fs.readFileSync(invFile, "utf-8");
      const parsedInv = JSON.parse(invRaw);
      if (Array.isArray(parsedInv)) {
        parsedInv
          .filter((it: any) => it.type === "purchased" && (it.value || 0) > 0)
          .forEach((it: any) => {
            expenseList.push({
              date: it.lastRestocked || `${curYear}-${String(curMonth + 1).padStart(2, "0")}-15`,
              amount: it.value || 0,
              system: "both",
            });
          });
      }
    }
  } catch {}

  // Load real donations (Zakat, Sadqa, Fitrana, General)
  await ensureDonationsLoaded().catch(() => {});
  const donationList = listDonations();

  // 3. Daily mapping for current month
  const daySchoolMap = new Map<number, number>();
  const dayMadrassaMap = new Map<number, number>();
  const daySchoolExpenseMap = new Map<number, number>();
  const dayMadrassaExpenseMap = new Map<number, number>();

  activePayments.forEach((p) => {
    const d = new Date(p.receivedAt);
    if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
      const day = d.getDate();
      const rupees = Math.round(p.amountPaisa / 100);
      const isMadrassa = p.programSystem === "madrassa" || p.institutionSystem === "madrassa";
      if (isMadrassa) {
        dayMadrassaMap.set(day, (dayMadrassaMap.get(day) ?? 0) + rupees);
      } else {
        daySchoolMap.set(day, (daySchoolMap.get(day) ?? 0) + rupees);
      }
    }
  });

  donationList.forEach((don) => {
    const d = new Date(don.date);
    if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
      const day = d.getDate();
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
    const d = new Date(e.date);
    if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
      const day = d.getDate();
      const amt = e.amount;
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

  // 4. Monthly history for last 12 months
  const monthlyHistory = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const endD = new Date(curYear, curMonth - i + 1, 0, 23, 59, 59, 999);
    const mIndex = d.getMonth();
    const paymentsInMonth = activePayments.filter((p) => {
      const rec = new Date(p.receivedAt);
      return rec >= d && rec <= endD;
    });

    const donationsInMonth = donationList.filter((don) => {
      const rec = new Date(don.date);
      return rec >= d && rec <= endD;
    });

    const expensesInMonth = expenseList.filter((e) => {
      const rec = new Date(e.date);
      return rec >= d && rec <= endD;
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

  // 5. KPIs
  const thisMonthExpenses = expenseList.filter(
    (e) => new Date(e.date) >= startOfMonth && new Date(e.date) <= endOfMonth,
  );
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

  const thisYearExpenses = expenseList.filter((e) => new Date(e.date) >= startOfYear);
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
  const thisMonthPayments = activePayments.filter(
    (p) => new Date(p.receivedAt) >= startOfMonth && new Date(p.receivedAt) <= endOfMonth,
  );
  const thisMonthDonations = donationList.filter(
    (don) => new Date(don.date) >= startOfMonth && new Date(don.date) <= endOfMonth,
  );
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

  const thisYearPayments = activePayments.filter((p) => new Date(p.receivedAt) >= startOfYear);
  const thisYearDonations = donationList.filter((don) => new Date(don.date) >= startOfYear);

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

  // 6. Recent transactions (fee collections + donations + expenses)
  const recentIncome = activePayments.map((p) => {
    const isMadrassa = p.programSystem === "madrassa" || p.institutionSystem === "madrassa";
    const studentEn = p.studentName || p.studentNameUrdu;
    const studentUr = p.studentNameUrdu || p.studentName;
    const rollPart = p.rollNo ? ` (${p.rollNo})` : "";
    return {
      id: p.id,
      date: p.receivedAt instanceof Date ? p.receivedAt.toISOString().slice(0, 10) : String(p.receivedAt).slice(0, 10),
      type: "income" as const,
      category: "fees" as const,
      categoryUrdu: "فیس طلباء",
      description: `Fee Collection: Receipt #${p.receiptNo} · ${studentEn}${rollPart}`,
      descriptionUrdu: `فیس وصولی: رسید #${p.receiptNo} · ${studentUr}${rollPart}`,
      amount: Math.round(p.amountPaisa / 100),
      source: p.method === "cash" ? "Cash" : p.method === "bank" ? "Bank" : "Online",
      sourceUrdu: p.method === "cash" ? "نقد" : p.method === "bank" ? "بینک" : "آن لائن",
      system: (isMadrassa ? "madrassa" : "school") as "school" | "madrassa" | "both",
    };
  });

  const recentDonations = donationList.slice(0, 40).map((don) => {
    const pLower = (don.purpose || "").toLowerCase();
    const isSchool = pLower.includes("school") || pLower.includes("اکیڈمی");
    const typeLabelEn = don.type === "zakat" ? "Zakat Fund" : don.type === "sadqa" ? "Sadqa" : don.type === "fitra" ? "Fitrana" : don.type === "khairat" ? "Khairat" : "General Donation";
    const typeLabelUr = don.type === "zakat" ? "زکوٰۃ فنڈ" : don.type === "sadqa" ? "صدقہ و خیرات" : don.type === "fitra" ? "فطرانہ" : don.type === "khairat" ? "خیرات" : "عام عطیات";

    return {
      id: `don-${don.id}`,
      date: don.date,
      type: "income" as const,
      category: don.type === "zakat" ? ("zakat" as const) : don.type === "sadqa" || don.type === "khairat" ? ("sadqa" as const) : ("donations" as const),
      categoryUrdu: typeLabelUr,
      description: `Donation: Receipt #${don.receiptNo} · ${don.donor} (${don.purpose || typeLabelEn})`,
      descriptionUrdu: `عطیہ رسید #${don.receiptNo} · ${don.donorUrdu || don.donor} (${don.purpose || typeLabelUr})`,
      amount: Math.round(don.amountPaisa / 100),
      source: don.method === "cash" ? "Cash" : don.method === "bank" ? "Bank" : "Online",
      sourceUrdu: don.method === "cash" ? "نقد" : don.method === "bank" ? "بینک" : "آن لائن",
      system: (isSchool ? "school" : "madrassa") as "school" | "madrassa" | "both",
    };
  });

  const recentExpenses = expenseList.slice(0, 40).map((e: any, idx) => {
    const cat = e.category || "";
    const isSalary = cat.includes("salary");
    const isUtil = cat.includes("util");
    const isMess = cat.includes("mess");
    const categoryKey = isSalary ? "salary" : isUtil ? "utilities" : isMess ? "misc" : "inventory";
    const categoryUrdu = isSalary ? "تنخواہیں" : isUtil ? "یوٹیلیٹیز" : isMess ? "طعام و راشن" : "سامان و اسٹاک";
    return {
      id: e.id || `exp-${idx}-${e.date}`,
      date: e.date,
      type: "expense" as const,
      category: categoryKey as any,
      categoryUrdu,
      description: e.description || `Disbursement: ${e.categoryLabel || "Operational Expense"}`,
      descriptionUrdu: e.description || `اخراجات: ${e.categoryLabelUrdu || "شعبہ جاتی مدات"}`,
      amount: e.amount,
      source: e.paymentMethod === "online" ? "Online" : e.paymentMethod === "bank" ? "Bank" : "Cash",
      sourceUrdu: e.paymentMethod === "online" ? "آن لائن" : e.paymentMethod === "bank" ? "بینک" : "نقد",
      system: (e.system || "both") as "school" | "madrassa" | "both",
    };
  });

  const recentTransactions = [...recentIncome, ...recentDonations, ...recentExpenses].sort((a, b) =>
    b.date > a.date ? 1 : b.date < a.date ? -1 : 0,
  );

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
    },
    dailyHistory,
    monthlyHistory,
    recentTransactions,
  };
}

