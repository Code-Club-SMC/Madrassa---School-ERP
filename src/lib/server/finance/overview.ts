import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { feeAdjustments, feeCharges, feePayments } from "@/db/schema/finance";
import { students, studentEnrollments } from "@/db/schema/students";
import { institutions, programs } from "@/db/schema/academic";
import { desc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server/authz";

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

  let activePayments = payments;
  if (!activePayments || activePayments.length === 0) {
    try {
      const pFile = path.join(process.cwd(), "public", "finance-fee-payments.json");
      if (fs.existsSync(pFile)) {
        const raw = fs.readFileSync(pFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activePayments = parsed.map((t: any) => ({
            id: t.id,
            receiptNo: t.voucherNo,
            amountPaisa: t.amount * 100,
            method: t.paymentMethod,
            receivedAt: new Date(t.date),
            status: "posted" as const,
            payerName: t.partyName,
            studentId: t.id,
            studentName: t.partyName,
            studentNameUrdu: t.partyName,
            rollNo: t.reference,
            institutionId: t.system === "madrassa" ? "inst-madrassa" : "inst-school",
            institutionName: t.systemLabel,
            institutionNameUrdu: t.systemLabel,
            programSystem: t.system,
            institutionSystem: t.system,
          }));
        }
      }
    } catch {}
  }

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

    const expensesInMonth = expenseList.filter((e) => {
      const rec = new Date(e.date);
      return rec >= d && rec <= endD;
    });

    const schoolInc = Math.round(
      paymentsInMonth
        .filter((p) => p.programSystem !== "madrassa" && p.institutionSystem !== "madrassa")
        .reduce((sum, p) => sum + p.amountPaisa, 0) / 100,
    );
    const madrassaInc = Math.round(
      paymentsInMonth
        .filter((p) => p.programSystem === "madrassa" || p.institutionSystem === "madrassa")
        .reduce((sum, p) => sum + p.amountPaisa, 0) / 100,
    );

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
  const monthlyIncome = Math.round(thisMonthPayments.reduce((s, p) => s + p.amountPaisa, 0) / 100);
  const schoolMonthlyIncome = Math.round(
    thisMonthPayments
      .filter((p) => p.programSystem !== "madrassa" && p.institutionSystem !== "madrassa")
      .reduce((s, p) => s + p.amountPaisa, 0) / 100,
  );
  const madrassaMonthlyIncome = Math.round(
    thisMonthPayments
      .filter((p) => p.programSystem === "madrassa" || p.institutionSystem === "madrassa")
      .reduce((s, p) => s + p.amountPaisa, 0) / 100,
  );

  const thisYearPayments = activePayments.filter((p) => new Date(p.receivedAt) >= startOfYear);
  const annualIncome = Math.round(thisYearPayments.reduce((s, p) => s + p.amountPaisa, 0) / 100);
  const schoolAnnualIncome = Math.round(
    thisYearPayments
      .filter((p) => p.programSystem !== "madrassa" && p.institutionSystem !== "madrassa")
      .reduce((s, p) => s + p.amountPaisa, 0) / 100,
  );
  const madrassaAnnualIncome = Math.round(
    thisYearPayments
      .filter((p) => p.programSystem === "madrassa" || p.institutionSystem === "madrassa")
      .reduce((s, p) => s + p.amountPaisa, 0) / 100,
  );

  const openCharges = charges.filter((c) => c.status === "open" || c.status === "partial");
  const openArrears = Math.round(openCharges.reduce((s, c) => s + c.amountPaisa, 0) / 100);
  const monthlyTarget = Math.max(monthlyIncome, monthlyIncome + openArrears);
  const recoveryRate = monthlyTarget > 0 ? Math.round((monthlyIncome / monthlyTarget) * 100) : 0;

  // 6. Recent transactions (income + expenses)
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

  const recentTransactions = [...recentIncome, ...recentExpenses].sort((a, b) =>
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

