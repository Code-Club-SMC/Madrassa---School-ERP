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
    .innerJoin(students, eq(students.id, feePayments.studentId))
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, feePayments.enrollmentId))
    .innerJoin(institutions, eq(institutions.id, feePayments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .where(eq(feePayments.status, "posted"))
    .orderBy(desc(feePayments.receivedAt));

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
    .innerJoin(programs, eq(programs.id, feeCharges.programId))
    .catch(() => []);

  // 3. Daily mapping for current month
  const daySchoolMap = new Map<number, number>();
  const dayMadrassaMap = new Map<number, number>();

  payments.forEach((p) => {
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

  const dailyHistory = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const schoolIncome = daySchoolMap.get(day) ?? 0;
    const madrassaIncome = dayMadrassaMap.get(day) ?? 0;
    return {
      day: `${day}`,
      fullLabel: `${monthName} ${day}`,
      income: schoolIncome + madrassaIncome,
      expense: 0,
      schoolIncome,
      madrassaIncome,
      schoolExpense: 0,
      madrassaExpense: 0,
    };
  });

  // 4. Monthly history for last 12 months
  const monthlyHistory = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const endD = new Date(curYear, curMonth - i + 1, 0, 23, 59, 59, 999);
    const mIndex = d.getMonth();
    const paymentsInMonth = payments.filter((p) => {
      const rec = new Date(p.receivedAt);
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

    monthlyHistory.push({
      month: MONTH_NAMES_EN[mIndex],
      monthUr: MONTH_NAMES_UR[mIndex],
      income: schoolInc + madrassaInc,
      expense: 0,
      schoolIncome: schoolInc,
      madrassaIncome: madrassaInc,
      schoolExpense: 0,
      madrassaExpense: 0,
    });
  }

  // 5. KPIs
  const thisMonthPayments = payments.filter(
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

  const thisYearPayments = payments.filter((p) => new Date(p.receivedAt) >= startOfYear);
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

  // 6. Recent transactions
  const recentTransactions = payments.map((p) => {
    const isMadrassa = p.programSystem === "madrassa" || p.institutionSystem === "madrassa";
    const displayName = p.studentNameUrdu || p.studentName;
    return {
      id: p.id,
      date: p.receivedAt instanceof Date ? p.receivedAt.toISOString().slice(0, 10) : String(p.receivedAt).slice(0, 10),
      type: "income" as const,
      category: "fees" as const,
      categoryUrdu: "فیس طلباء",
      description: `فیس وصولی: رسید #${p.receiptNo} · ${displayName}${p.rollNo ? ` (${p.rollNo})` : ""}`,
      amount: Math.round(p.amountPaisa / 100),
      source: p.method === "cash" ? "Cash · نقد" : p.method === "bank" ? "Bank · بینک" : "Online · آن لائن",
      system: (isMadrassa ? "madrassa" : "school") as "school" | "madrassa" | "both",
    };
  });

  return {
    kpis: {
      monthlyIncome,
      schoolMonthlyIncome,
      madrassaMonthlyIncome,
      annualIncome,
      schoolAnnualIncome,
      madrassaAnnualIncome,
      openArrears,
      recoveryRate,
    },
    dailyHistory,
    monthlyHistory,
    recentTransactions,
  };
}

