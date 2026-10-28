import { and, desc, eq, gte, inArray, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
} from "@/db/schema/academic";
import { studentAttendance } from "@/db/schema/attendance";
import { examSessions } from "@/db/schema/exams";
import { feeCharges, feePayments } from "@/db/schema/finance";
import { studentEnrollments, students } from "@/db/schema/students";
import { teacherAssignments, teacherProfiles } from "@/db/schema/teachers";
import { inventoryItems } from "@/mock";
import { getRequestUser } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";

export type DashboardFilter =
  | "all"
  | "qasimia_madrassa"
  | "qasim_academy"
  | "zainab_madrassa"
  | "zainab_school";

const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_UR = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_UR = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];

function getFilterConditions(filter: DashboardFilter) {
  switch (filter) {
    case "qasimia_madrassa":
      return {
        institutionId: "jamia_qasmia_baneen",
        programSystem: "madrassa",
      };
    case "qasim_academy":
      return {
        institutionId: "al_qasim_academy",
        programSystem: "school",
      };
    case "zainab_madrassa":
      return {
        institutionId: "jamia_zainab_banat",
        programSystem: "madrassa",
        excludeProgramId: "zainab_school_support",
      };
    case "zainab_school":
      return {
        institutionId: "jamia_zainab_banat",
        programSystem: "school",
        programId: "zainab_school_support",
      };
    case "all":
    default:
      return {};
  }
}

export async function getDashboardData(request: Request, filter: DashboardFilter = "all") {
  const user = await getRequestUser(request);
  if (!user) {
    throw new HttpError("Authentication required", 401);
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Fetch all active student enrollments
  const allActiveEnrollments = await db
    .select({
      studentId: studentEnrollments.studentId,
      institutionId: studentEnrollments.institutionId,
      programId: studentEnrollments.programId,
      system: institutions.system,
      programKind: programs.kind,
      enrollmentStatus: studentEnrollments.status,
      studentStatus: students.status,
      createdAt: studentEnrollments.createdAt,
    })
    .from(studentEnrollments)
    .innerJoin(students, and(eq(students.id, studentEnrollments.studentId), eq(students.status, "active")))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .where(eq(studentEnrollments.status, "active"));

  // Calculate institution counts for all filter tabs
  const institutionCounts: Record<DashboardFilter, number> = {
    all: allActiveEnrollments.length,
    qasimia_madrassa: allActiveEnrollments.filter((e) => e.institutionId === "jamia_qasmia_baneen").length,
    qasim_academy: allActiveEnrollments.filter((e) => e.institutionId === "al_qasim_academy").length,
    zainab_madrassa: allActiveEnrollments.filter(
      (e) => e.institutionId === "jamia_zainab_banat" && e.programId !== "zainab_school_support",
    ).length,
    zainab_school: allActiveEnrollments.filter(
      (e) => e.institutionId === "jamia_zainab_banat" && e.programId === "zainab_school_support",
    ).length,
  };

  // Filter enrollments for the active filter
  const filterConf = getFilterConditions(filter);
  const scopedEnrollments = allActiveEnrollments.filter((e) => {
    if (filterConf.institutionId && e.institutionId !== filterConf.institutionId) return false;
    if (filterConf.programId && e.programId !== filterConf.programId) return false;
    if (filterConf.excludeProgramId && e.programId === filterConf.excludeProgramId) return false;
    return true;
  });

  const totalStudents = scopedEnrollments.length;

  // Sublines for students
  let studentsSublineEn = "Madrassa 0 · School 0";
  let studentsSublineUr = "مدرسہ 0 · اسکول 0";
  if (filter === "all") {
    const madrassaCount = scopedEnrollments.filter((e) => e.system === "madrassa").length;
    const schoolCount = scopedEnrollments.filter((e) => e.system === "school" || e.programId === "zainab_school_support").length;
    studentsSublineEn = `Madrassa ${madrassaCount} · School ${schoolCount}`;
    studentsSublineUr = `مدرسہ ${madrassaCount} · اسکول ${schoolCount}`;
  } else if (filter === "qasimia_madrassa") {
    const nizami = scopedEnrollments.filter((e) => e.programKind === "dars_nizami").length;
    const hifz = scopedEnrollments.filter((e) => e.programKind === "hifz").length;
    const nazira = scopedEnrollments.filter((e) => e.programKind === "nazira").length;
    studentsSublineEn = `Nizami ${nizami} · Hifz ${hifz} · Nazira ${nazira}`;
    studentsSublineUr = `درس نظامی ${nizami} · حفظ ${hifz} · ناظرہ ${nazira}`;
  } else if (filter === "qasim_academy") {
    studentsSublineEn = `${totalStudents} Students · School Section`;
    studentsSublineUr = `${totalStudents} طلبہ · شعبہ سکول`;
  } else if (filter === "zainab_madrassa") {
    const nizami = scopedEnrollments.filter((e) => e.programKind === "dars_nizami").length;
    const nazira = scopedEnrollments.filter((e) => e.programKind === "nazira").length;
    studentsSublineEn = `Dars-e-Nizami ${nizami} · Nazira ${nazira}`;
    studentsSublineUr = `درس نظامی ${nizami} · ناظرہ ${nazira}`;
  } else if (filter === "zainab_school") {
    studentsSublineEn = `${totalStudents} Girls · School Section`;
    studentsSublineUr = `${totalStudents} طالبات · شعبہ سکول`;
  }

  // 2. Today's Attendance
  const todayAttendanceQuery = await db
    .select({
      id: studentAttendance.id,
      status: studentAttendance.status,
      institutionId: studentAttendance.institutionId,
      programId: studentAttendance.programId,
    })
    .from(studentAttendance)
    .where(eq(studentAttendance.attendanceDate, todayStr));

  const scopedTodayAttendance = todayAttendanceQuery.filter((a) => {
    if (filterConf.institutionId && a.institutionId !== filterConf.institutionId) return false;
    if (filterConf.programId && a.programId !== filterConf.programId) return false;
    if (filterConf.excludeProgramId && a.programId === filterConf.excludeProgramId) return false;
    return true;
  });

  const presentToday = scopedTodayAttendance.filter((a) => a.status === "present" || a.status === "late").length;
  const absentToday = scopedTodayAttendance.filter((a) => a.status === "absent").length;
  const totalMarkedToday = scopedTodayAttendance.length;
  const attendanceRate = totalMarkedToday > 0 ? `${((presentToday / totalMarkedToday) * 100).toFixed(1)}%` : "0.0%";
  const attendanceSublineEn = `${presentToday} Present · ${absentToday} Absent`;
  const attendanceSublineUr = `${presentToday} حاضر · ${absentToday} غیر حاضر`;

  // 3. Teachers count
  const allTeachers = await db
    .select({
      id: teacherProfiles.id,
      employmentStatus: teacherProfiles.employmentStatus,
      systemScope: teacherProfiles.systemScope,
    })
    .from(teacherProfiles)
    .where(eq(teacherProfiles.employmentStatus, "active"));

  let scopedTeacherCount = 0;
  if (filter === "all") {
    scopedTeacherCount = allTeachers.length;
  } else {
    const assignments = await db
      .select({
        teacherProfileId: teacherAssignments.teacherProfileId,
        institutionId: teacherAssignments.institutionId,
        programId: teacherAssignments.programId,
      })
      .from(teacherAssignments)
      .where(eq(teacherAssignments.active, true));

    const matchingTeacherIds = new Set(
      assignments
        .filter((a) => {
          if (filterConf.institutionId && a.institutionId !== filterConf.institutionId) return false;
          if (filterConf.programId && a.programId !== filterConf.programId) return false;
          if (filterConf.excludeProgramId && a.programId === filterConf.excludeProgramId) return false;
          return true;
        })
        .map((a) => a.teacherProfileId),
    );

    // Fallback: If no explicit subject assignments yet, count by systemScope
    if (matchingTeacherIds.size > 0) {
      scopedTeacherCount = allTeachers.filter((t) => matchingTeacherIds.has(t.id)).length;
    } else {
      scopedTeacherCount = allTeachers.filter((t) => {
        if (filter === "qasimia_madrassa") return t.systemScope === "madrassa" || t.systemScope.includes("qasmia");
        if (filter === "qasim_academy") return t.systemScope === "school" || t.systemScope.includes("qasmia");
        if (filter === "zainab_madrassa") return t.systemScope === "madrassa" || t.systemScope.includes("zainab");
        if (filter === "zainab_school") return t.systemScope === "school" || t.systemScope.includes("zainab");
        return true;
      }).length;
    }
  }

  // 4. Financials (Monthly fee collection & arrears)
  const allPayments = await db
    .select({
      id: feePayments.id,
      amountPaisa: feePayments.amountPaisa,
      institutionId: feePayments.institutionId,
      receivedAt: feePayments.receivedAt,
      status: feePayments.status,
    })
    .from(feePayments)
    .where(eq(feePayments.status, "posted"));

  const scopedPayments = allPayments.filter((p) => {
    if (filterConf.institutionId && p.institutionId !== filterConf.institutionId) return false;
    return true;
  });

  const monthPayments = scopedPayments.filter((p) => new Date(p.receivedAt) >= startOfMonth);
  const monthlyFeeCollected = Math.round(monthPayments.reduce((acc, p) => acc + p.amountPaisa, 0) / 100);

  const todayPayments = scopedPayments.filter((p) => new Date(p.receivedAt) >= startOfToday);
  const todayFeeCollected = Math.round(todayPayments.reduce((acc, p) => acc + p.amountPaisa, 0) / 100);

  // Charges / Arrears
  const allCharges = await db
    .select({
      id: feeCharges.id,
      amountPaisa: feeCharges.amountPaisa,
      institutionId: feeCharges.institutionId,
      status: feeCharges.status,
      type: feeCharges.type,
      dueDate: feeCharges.dueDate,
      createdAt: feeCharges.createdAt,
    })
    .from(feeCharges);

  const scopedCharges = allCharges.filter((c) => {
    if (filterConf.institutionId && c.institutionId !== filterConf.institutionId) return false;
    return true;
  });

  const openCharges = scopedCharges.filter((c) => c.status === "open" || c.status === "partial");
  const pendingArrears = Math.round(openCharges.reduce((acc, c) => acc + c.amountPaisa, 0) / 100);

  // Month target
  const monthCharges = scopedCharges.filter((c) => {
    const d = c.dueDate ? new Date(c.dueDate) : new Date(c.createdAt);
    return d >= startOfMonth;
  });
  const monthlyTarget = Math.max(
    monthlyFeeCollected,
    Math.round(monthCharges.reduce((acc, c) => acc + c.amountPaisa, 0) / 100),
  );
  const recoveryRate = monthlyTarget > 0 ? `${Math.round((monthlyFeeCollected / monthlyTarget) * 100)}%` : "0.0%";

  // Student Payment status
  const clearedCount = scopedEnrollments.length > 0 ? Math.max(0, scopedEnrollments.length - openCharges.length) : 0;
  const partialCount = openCharges.filter((c) => c.status === "partial").length;
  const unpaidCount = openCharges.filter((c) => c.status === "open").length;
  const totalEvaluated = clearedCount + partialCount + unpaidCount || 1;

  // 5. 6-Month History for Fees
  const monthlyHistory = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const mMonth = d.getMonth();
    const pInM = scopedPayments.filter((p) => {
      const rec = new Date(p.receivedAt);
      return rec >= d && rec <= endD;
    });
    const cInM = scopedCharges.filter((c) => {
      const cr = c.dueDate ? new Date(c.dueDate) : new Date(c.createdAt);
      return cr >= d && cr <= endD;
    });
    const coll = Math.round(pInM.reduce((acc, p) => acc + p.amountPaisa, 0) / 100);
    const targ = Math.max(coll, Math.round(cInM.reduce((acc, c) => acc + c.amountPaisa, 0) / 100));
    monthlyHistory.push({
      month: MONTH_NAMES_EN[mMonth],
      monthUr: MONTH_NAMES_UR[mMonth],
      collected: coll,
      target: targ,
    });
  }

  // 6. Last 7 Days Attendance Trend
  const last7DaysRates = [];
  let total7DayRates = 0;
  let daysWithAttendanceCount = 0;
  let bestDayObj = { day: "—", rate: 0 };
  let lowDayObj = { day: "—", rate: 100 };

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayNameEn = WEEKDAYS_EN[d.getDay()];
    const dayNameUr = WEEKDAYS_UR[d.getDay()];

    const records = await db
      .select({
        status: studentAttendance.status,
        institutionId: studentAttendance.institutionId,
        programId: studentAttendance.programId,
      })
      .from(studentAttendance)
      .where(eq(studentAttendance.attendanceDate, dateStr));

    const scopedDayRecords = records.filter((a) => {
      if (filterConf.institutionId && a.institutionId !== filterConf.institutionId) return false;
      if (filterConf.programId && a.programId !== filterConf.programId) return false;
      if (filterConf.excludeProgramId && a.programId === filterConf.excludeProgramId) return false;
      return true;
    });

    const dayTotal = scopedDayRecords.length;
    const dayPresent = scopedDayRecords.filter((a) => a.status === "present" || a.status === "late").length;
    const dayRate = dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0;

    if (dayTotal > 0) {
      total7DayRates += dayRate;
      daysWithAttendanceCount++;
      if (dayRate > bestDayObj.rate) bestDayObj = { day: `${dayNameEn} · ${dayRate}%`, rate: dayRate };
      if (dayRate < lowDayObj.rate) lowDayObj = { day: `${dayNameEn} · ${dayRate}%`, rate: dayRate };
    }

    last7DaysRates.push({
      day: dayNameEn,
      dayUr: dayNameUr,
      rate: dayRate,
    });
  }

  const avg7DayRate = daysWithAttendanceCount > 0 ? `${(total7DayRates / daysWithAttendanceCount).toFixed(1)}%` : "0.0%";

  // 7. Enrollment trend (last 12 months)
  const trendData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const mName = MONTH_NAMES_EN[d.getMonth()];

    if (filter === "all") {
      const qm = allActiveEnrollments.filter((e) => e.institutionId === "jamia_qasmia_baneen" && new Date(e.createdAt) <= endD).length;
      const qa = allActiveEnrollments.filter((e) => e.institutionId === "al_qasim_academy" && new Date(e.createdAt) <= endD).length;
      const zm = allActiveEnrollments.filter(
        (e) => e.institutionId === "jamia_zainab_banat" && e.programId !== "zainab_school_support" && new Date(e.createdAt) <= endD,
      ).length;
      const zs = allActiveEnrollments.filter(
        (e) => e.institutionId === "jamia_zainab_banat" && e.programId === "zainab_school_support" && new Date(e.createdAt) <= endD,
      ).length;
      trendData.push({
        month: mName,
        qasimiaMadrassa: qm,
        qasimAcademy: qa,
        zainabMadrassa: zm,
        zainabSchool: zs,
      });
    } else {
      const enrolledInFilter = scopedEnrollments.filter((e) => new Date(e.createdAt) <= endD);
      if (filter === "qasimia_madrassa") {
        trendData.push({
          month: mName,
          series1: enrolledInFilter.filter((e) => e.programKind === "dars_nizami").length,
          series2: enrolledInFilter.filter((e) => e.programKind === "hifz").length,
          series3: enrolledInFilter.filter((e) => e.programKind === "nazira").length,
        });
      } else if (filter === "qasim_academy") {
        trendData.push({
          month: mName,
          series1: enrolledInFilter.length,
          series2: allActiveEnrollments.filter((e) => e.institutionId === "al_qasim_academy" && new Date(e.createdAt) >= d && new Date(e.createdAt) <= endD).length,
        });
      } else if (filter === "zainab_madrassa") {
        trendData.push({
          month: mName,
          series1: enrolledInFilter.filter((e) => e.programKind === "dars_nizami").length,
          series2: enrolledInFilter.filter((e) => e.programKind === "nazira").length,
        });
      } else {
        trendData.push({
          month: mName,
          series1: enrolledInFilter.length,
          series2: 0,
        });
      }
    }
  }

  // 8. Recent Activities (Real events from DB)
  const activities: Array<{
    id: string;
    type: "admission" | "fee" | "attendance" | "exam";
    title: string;
    titleUrdu: string;
    at: string;
  }> = [];

  // Recent admissions
  const recentStudents = await db
    .select({
      id: students.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
      createdAt: students.createdAt,
    })
    .from(students)
    .orderBy(desc(students.createdAt))
    .limit(4);

  recentStudents.forEach((s) => {
    activities.push({
      id: `adm-${s.id}`,
      type: "admission",
      title: `Student admitted: ${s.name}`,
      titleUrdu: `${s.nameUrdu} کا داخلہ`,
      at: new Date(s.createdAt).toISOString(),
    });
  });

  // Recent fee receipts
  const recentPayments = await db
    .select({
      id: feePayments.id,
      receiptNo: feePayments.receiptNo,
      amountPaisa: feePayments.amountPaisa,
      payerName: feePayments.payerName,
      receivedAt: feePayments.receivedAt,
    })
    .from(feePayments)
    .orderBy(desc(feePayments.receivedAt))
    .limit(4);

  recentPayments.forEach((p) => {
    activities.push({
      id: `fee-${p.id}`,
      type: "fee",
      title: `Fee collected: PKR ${Math.round(p.amountPaisa / 100).toLocaleString()} (Rec: #${p.receiptNo})`,
      titleUrdu: `فیس وصولی: ${Math.round(p.amountPaisa / 100).toLocaleString()} روپے (رسید: #${p.receiptNo})`,
      at: new Date(p.receivedAt).toISOString(),
    });
  });

  // Recent exam sessions
  const recentExams = await db
    .select({
      id: examSessions.id,
      name: examSessions.name,
      nameUrdu: examSessions.nameUrdu,
      createdAt: examSessions.createdAt,
    })
    .from(examSessions)
    .orderBy(desc(examSessions.createdAt))
    .limit(3);

  recentExams.forEach((e) => {
    activities.push({
      id: `exam-${e.id}`,
      type: "exam",
      title: `Exam Session: ${e.name}`,
      titleUrdu: `امتحانی سیشن: ${e.nameUrdu}`,
      at: new Date(e.createdAt).toISOString(),
    });
  });

  // Sort activities by timestamp descending
  activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const finalRecentActivities = activities.slice(0, 5);

  // 9. Inventory Assets Calculation
  const inventoryTotalValue = inventoryItems.reduce((acc, it) => acc + (it.value || 0), 0);
  const inventoryTotalUnits = inventoryItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const inventoryLowStockCount = inventoryItems.filter((it) => it.quantity <= it.lowStockThreshold).length;

  return {
    institutionCounts,
    kpis: {
      totalStudents: totalStudents.toLocaleString(),
      studentsSublineEn,
      studentsSublineUr,
      attendanceRate,
      attendanceSublineEn,
      attendanceSublineUr,
      monthlyFee: monthlyFeeCollected,
      feeSublineEn: monthlyFeeCollected > 0 ? `PKR ${monthlyFeeCollected.toLocaleString()} collected` : "No collections yet",
      feeSublineUr: monthlyFeeCollected > 0 ? `کل وصولی ${monthlyFeeCollected.toLocaleString()} روپے` : "کوئی وصولی نہیں ہوئی",
      arrears: pendingArrears,
      arrearsSublineEn: pendingArrears > 0 ? `PKR ${pendingArrears.toLocaleString()} pending` : "No pending dues",
      arrearsSublineUr: pendingArrears > 0 ? `${pendingArrears.toLocaleString()} روپے واجب الادا` : "کوئی بقایا نہیں",
      teacherCount: scopedTeacherCount,
      teachersSublineEn: `${scopedTeacherCount} Active Teachers`,
      teachersSublineUr: `${scopedTeacherCount} فعال اساتذہ`,
      inventoryValue: inventoryTotalValue,
      inventorySublineEn: `${inventoryTotalUnits} Units · ${inventoryLowStockCount} Low Stock`,
      inventorySublineUr: `${inventoryTotalUnits} سامان اکائیاں · ${inventoryLowStockCount} کم اسٹاک`,
    },
    trendData,
    attendanceSummary: {
      avgRate: avg7DayRate,
      bestDay: bestDayObj.rate > 0 ? bestDayObj.day : "—",
      lowDay: lowDayObj.rate < 100 && daysWithAttendanceCount > 0 ? lowDayObj.day : "—",
      rates: last7DaysRates,
    },
    inventorySummary: {
      totalItems: inventoryItems.length,
      totalUnits: inventoryTotalUnits,
      totalValue: inventoryTotalValue,
      lowStockCount: inventoryLowStockCount,
      items: inventoryItems.map((item) => ({
        id: item.id,
        name: item.name,
        nameUrdu: item.nameUrdu,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        value: item.value,
        lowStock: item.quantity <= item.lowStockThreshold,
      })),
    },
    financialMeta: {
      collected: monthlyFeeCollected,
      pending: pendingArrears,
      target: monthlyTarget,
      recoveryRate,
      studentStatus: {
        cleared: { count: clearedCount, pct: `${Math.round((clearedCount / totalEvaluated) * 100)}%` },
        partial: { count: partialCount, pct: `${Math.round((partialCount / totalEvaluated) * 100)}%` },
        unpaid: { count: unpaidCount, pct: `${Math.round((unpaidCount / totalEvaluated) * 100)}%` },
      },
      monthlyHistory,
    },
    cashflowMeta: {
      monthly: {
        totalIncome: monthlyFeeCollected,
        totalExpenses: 24000,
        incomeSources: [
          { id: "fees", nameEn: "Student Tuition & Fee Receipts", nameUr: "فیس طلباء و وصولیات", amount: monthlyFeeCollected, iconName: "Banknote" as const },
          { id: "donations", nameEn: "General Donations & Atiyaat", nameUr: "عطیات و عمومی امداد", amount: 0, iconName: "HeartHandshake" as const },
          { id: "zakat", nameEn: "Zakat & Sadaqat Fund", nameUr: "زکوٰۃ و صدقات فنڈ", amount: 0, iconName: "ShieldCheck" as const },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Teacher & Staff Salaries", nameUr: "اساتذہ و عملہ کی تنخواہیں", amount: 0, iconName: "Users" as const },
          { id: "utilities", nameEn: "Utilities (Electricity, Gas)", nameUr: "یوٹیلیٹی بلز (بجلی، گیس)", amount: 0, iconName: "Zap" as const },
          { id: "inventory", nameEn: "Inventory & Academic Supplies", nameUr: "سامان، کتب و اسٹاک", amount: 24000, iconName: "Store" as const },
        ],
      },
      daily: {
        totalIncome: todayFeeCollected,
        totalExpenses: 0,
        incomeSources: [
          { id: "fees", nameEn: "Today's Counter Fee Collection", nameUr: "آج کی کاؤنٹر فیس وصولی", amount: todayFeeCollected, iconName: "Banknote" as const },
          { id: "donations", nameEn: "Daily Charity & Donations", nameUr: "روزانہ عطیات و دستی امداد", amount: 0, iconName: "HeartHandshake" as const },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Daily Staff Allowances", nameUr: "یومیہ اجرت و عارضی عملہ", amount: 0, iconName: "Users" as const },
          { id: "inventory", nameEn: "Daily Supplies & Stationery", nameUr: "روزمرہ اسٹیشنری و سامان", amount: 0, iconName: "Store" as const },
        ],
      },
    },
    recentActivities: finalRecentActivities,
  };
}

