import { and, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { studentAttendance } from "@/db/schema/attendance";
import { user as authUser } from "@/db/schema/auth";
import { examResults, examSessions } from "@/db/schema/exams";
import {
  feeAdjustments,
  feeCharges,
  feePaymentAllocations,
  feePayments,
} from "@/db/schema/finance";
import {
  guardians,
  studentEnrollments,
  studentEvents,
  studentGuardians,
  students,
} from "@/db/schema/students";
import { summarizeStudentLedger } from "@/lib/server/finance/ledger";
import { getRequestUser, requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import { listNotifications } from "@/lib/server/notifications/service";

export const guardianAccountListQuerySchema = z.object({
  status: z.enum(["linked", "unlinked", "all"]).default("all"),
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

type StudentDashboardRow = {
  studentId: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  gender: string;
  status: string;
  enrollmentId: string;
  rollNo: string;
  admissionNo: string;
  enrollmentStatus: string;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  programSystem: string;
  schoolClassName: string | null;
  schoolSectionName: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  darja: string | null;
  guardianId: string;
  guardianName: string;
  guardianNameUrdu: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  relation: string;
  isPrimary: boolean;
};

export async function getMyGuardianDashboard(request: Request) {
  const actor = await getRequestUser(request);
  if (!actor) throw new HttpError("Authentication required", 401);
  if (actor.role !== "parent") throw new HttpError("Parent account required", 403);

  const guardianRows = await db
    .select({
      id: guardians.id,
      name: guardians.name,
      nameUrdu: guardians.nameUrdu,
      phone: guardians.phone,
      email: guardians.email,
      cnic: guardians.cnic,
      address: guardians.address,
      status: guardians.status,
    })
    .from(guardians)
    .where(eq(guardians.userId, actor.id))
    .orderBy(desc(guardians.createdAt));

  if (guardianRows.length === 0) {
    const notifications = await listNotifications(request, { limit: 20, audience: "parent", read: undefined });
    return {
      guardians: [],
      students: [],
      notifications: notifications.notifications,
      summary: emptyGuardianSummary(notifications.unreadCount),
    };
  }

  const guardianIds = guardianRows.map((guardian) => guardian.id);
  const studentRows = await loadGuardianStudents(guardianIds);
  const studentIds = uniqueStrings(studentRows.map((row) => row.studentId));
  const [feeSummaries, attendanceSummaries, examResultsByStudent, eventsByStudent, notifications] = await Promise.all([
    loadFeeSummaries(studentIds),
    loadAttendanceSummaries(studentIds),
    loadLatestExamResults(studentIds),
    loadStudentEvents(studentIds),
    listNotifications(request, { limit: 20, audience: "parent", read: undefined }),
  ]);

  const studentsPayload = studentRows.map((row) => ({
    id: row.studentId,
    name: row.name,
    nameUrdu: row.nameUrdu,
    fatherName: row.fatherName,
    gender: row.gender,
    status: row.status,
    guardian: {
      id: row.guardianId,
      name: row.guardianName,
      nameUrdu: row.guardianNameUrdu,
      phone: row.guardianPhone,
      email: row.guardianEmail,
      relation: row.relation,
      isPrimary: row.isPrimary,
    },
    enrollment: {
      id: row.enrollmentId,
      rollNo: row.rollNo,
      admissionNo: row.admissionNo,
      status: row.enrollmentStatus,
      institutionId: row.institutionId,
      institutionName: row.institutionName,
      institutionNameUrdu: row.institutionNameUrdu,
      programId: row.programId,
      programName: row.programName,
      programNameUrdu: row.programNameUrdu,
      system: row.programSystem === "madrassa" ? "madrassa" : "school",
      groupLabel: groupLabel(row),
      darja: row.darja,
    },
    fees: feeSummaries.get(row.studentId) ?? emptyFeeSummary,
    attendance: attendanceSummaries.get(row.studentId) ?? emptyAttendanceSummary(),
    latestResult: examResultsByStudent.get(row.studentId) ?? null,
    timeline: eventsByStudent.get(row.studentId) ?? [],
  }));

  const totalOutstandingPaisa = studentsPayload.reduce(
    (sum, student) => sum + student.fees.outstandingPaisa,
    0,
  );
  const attendanceRates = studentsPayload
    .map((student) => student.attendance.attendanceRate)
    .filter((rate) => rate !== null);

  return {
    guardians: guardianRows,
    students: studentsPayload,
    notifications: notifications.notifications,
    summary: {
      studentCount: studentsPayload.length,
      totalOutstandingPaisa,
      unreadNotifications: notifications.unreadCount,
      averageAttendanceRate:
        attendanceRates.length > 0
          ? Math.round(attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length)
          : null,
    },
  };
}

export async function listGuardianAccounts(
  request: Request,
  query: z.infer<typeof guardianAccountListQuerySchema>,
) {
  await requirePermission(request, "admission_queue", "view");

  const clauses = compactSql([
    query.status === "linked" ? isNotNull(guardians.userId) : undefined,
    query.status === "unlinked" ? isNull(guardians.userId) : undefined,
    query.q
      ? or(
          ilike(guardians.name, `%${query.q}%`),
          ilike(guardians.nameUrdu, `%${query.q}%`),
          ilike(guardians.phone, `%${query.q}%`),
          ilike(guardians.email, `%${query.q}%`),
          ilike(authUser.username, `%${query.q}%`),
          ilike(students.name, `%${query.q}%`),
          ilike(students.nameUrdu, `%${query.q}%`),
          ilike(studentEnrollments.rollNo, `%${query.q}%`),
        )
      : undefined,
  ]);

  const rows = await db
    .select({
      guardianId: guardians.id,
      guardianName: guardians.name,
      guardianNameUrdu: guardians.nameUrdu,
      guardianPhone: guardians.phone,
      guardianEmail: guardians.email,
      guardianStatus: guardians.status,
      userId: guardians.userId,
      parentUserEmail: authUser.email,
      parentUserUsername: authUser.username,
      studentId: students.id,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      rollNo: studentEnrollments.rollNo,
      relation: studentGuardians.relation,
      isPrimary: studentGuardians.isPrimary,
    })
    .from(guardians)
    .leftJoin(authUser, eq(authUser.id, guardians.userId))
    .leftJoin(studentGuardians, eq(studentGuardians.guardianId, guardians.id))
    .leftJoin(students, eq(students.id, studentGuardians.studentId))
    .leftJoin(studentEnrollments, and(eq(studentEnrollments.studentId, students.id), isNull(studentEnrollments.endedAt)))
    .where(clauses.length > 0 ? and(...clauses) : undefined)
    .orderBy(desc(guardians.createdAt))
    .limit(query.limit);

  const byGuardian = new Map<string, {
    id: string;
    name: string;
    nameUrdu: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    userId: string | null;
    parentUserEmail: string | null;
    parentUserUsername: string | null;
    students: Array<{
      id: string;
      name: string;
      nameUrdu: string;
      rollNo: string | null;
      relation: string | null;
      isPrimary: boolean | null;
    }>;
  }>();

  for (const row of rows) {
    const guardian = byGuardian.get(row.guardianId) ?? {
      id: row.guardianId,
      name: row.guardianName,
      nameUrdu: row.guardianNameUrdu,
      phone: row.guardianPhone,
      email: row.guardianEmail,
      status: row.guardianStatus,
      userId: row.userId,
      parentUserEmail: row.parentUserEmail,
      parentUserUsername: row.parentUserUsername,
      students: [],
    };
    if (row.studentId) {
      guardian.students.push({
        id: row.studentId,
        name: row.studentName ?? "Student",
        nameUrdu: row.studentNameUrdu ?? row.studentName ?? "Student",
        rollNo: row.rollNo,
        relation: row.relation,
        isPrimary: row.isPrimary,
      });
    }
    byGuardian.set(row.guardianId, guardian);
  }

  const guardiansList = Array.from(byGuardian.values());
  return {
    guardians: guardiansList,
    summary: {
      total: guardiansList.length,
      linked: guardiansList.filter((guardian) => Boolean(guardian.userId)).length,
      unlinked: guardiansList.filter((guardian) => !guardian.userId).length,
    },
  };
}

async function loadGuardianStudents(guardianIds: string[]) {
  if (guardianIds.length === 0) return [];

  return db
    .select({
      studentId: students.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      gender: students.gender,
      status: students.status,
      enrollmentId: studentEnrollments.id,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      enrollmentStatus: studentEnrollments.status,
      institutionId: institutions.id,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programId: programs.id,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      programSystem: programs.system,
      schoolClassName: schoolClasses.name,
      schoolSectionName: schoolClassSections.name,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      darja: studentEnrollments.darja,
      guardianId: guardians.id,
      guardianName: guardians.name,
      guardianNameUrdu: guardians.nameUrdu,
      guardianPhone: guardians.phone,
      guardianEmail: guardians.email,
      relation: studentGuardians.relation,
      isPrimary: studentGuardians.isPrimary,
    })
    .from(studentGuardians)
    .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
    .innerJoin(students, eq(students.id, studentGuardians.studentId))
    .innerJoin(studentEnrollments, and(eq(studentEnrollments.studentId, students.id), isNull(studentEnrollments.endedAt)))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .where(inArray(studentGuardians.guardianId, guardianIds))
    .orderBy(desc(studentEnrollments.startedAt));
}

async function loadFeeSummaries(studentIds: string[]) {
  const summaries = new Map<string, typeof emptyFeeSummary>();
  if (studentIds.length === 0) return summaries;

  const [charges, payments, adjustments] = await Promise.all([
    db.select().from(feeCharges).where(inArray(feeCharges.studentId, studentIds)),
    db.select().from(feePayments).where(inArray(feePayments.studentId, studentIds)),
    db.select().from(feeAdjustments).where(inArray(feeAdjustments.studentId, studentIds)),
  ]);
  const chargeIds = charges.map((charge) => charge.id);
  const allocations =
    chargeIds.length > 0
      ? await db
          .select()
          .from(feePaymentAllocations)
          .where(inArray(feePaymentAllocations.chargeId, chargeIds))
      : [];

  for (const studentId of studentIds) {
    const studentCharges = charges.filter((charge) => charge.studentId === studentId);
    const studentChargeIds = new Set(studentCharges.map((charge) => charge.id));
    const studentPayments = payments.filter((payment) => payment.studentId === studentId);
    const studentPaymentIds = new Set(studentPayments.map((payment) => payment.id));
    const summary = summarizeStudentLedger({
      charges: studentCharges,
      payments: studentPayments,
      allocations: allocations.filter(
        (allocation) => studentChargeIds.has(allocation.chargeId) && studentPaymentIds.has(allocation.paymentId),
      ),
      adjustments: adjustments.filter((adjustment) => adjustment.studentId === studentId),
    });
    summaries.set(studentId, summary);
  }

  return summaries;
}

async function loadAttendanceSummaries(studentIds: string[]) {
  const summaries = new Map<string, ReturnType<typeof emptyAttendanceSummary>>();
  if (studentIds.length === 0) return summaries;

  const range = currentMonthRange();
  const rows = await db
    .select({
      studentId: studentAttendance.studentId,
      status: studentAttendance.status,
    })
    .from(studentAttendance)
    .where(
      and(
        inArray(studentAttendance.studentId, studentIds),
        gte(studentAttendance.attendanceDate, range.start),
        lte(studentAttendance.attendanceDate, range.end),
      ),
    );

  for (const studentId of studentIds) summaries.set(studentId, emptyAttendanceSummary());
  for (const row of rows) {
    const summary = summaries.get(row.studentId) ?? emptyAttendanceSummary();
    summary.marked += 1;
    if (row.status === "present") summary.present += 1;
    if (row.status === "late") summary.late += 1;
    if (row.status === "absent") summary.absent += 1;
    if (row.status === "leave") summary.leave += 1;
    const denominator = summary.present + summary.late + summary.absent;
    summary.attendanceRate = denominator > 0 ? Math.round(((summary.present + summary.late) / denominator) * 100) : null;
    summaries.set(row.studentId, summary);
  }

  return summaries;
}

async function loadLatestExamResults(studentIds: string[]) {
  const results = new Map<string, {
    examId: string;
    examName: string;
    examNameUrdu: string;
    academicYear: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    status: string;
    position: number | null;
    publishedAt: string | null;
  }>();
  if (studentIds.length === 0) return results;

  const rows = await db
    .select({
      studentId: examResults.studentId,
      examId: examResults.examId,
      examName: examSessions.name,
      examNameUrdu: examSessions.nameUrdu,
      academicYear: examSessions.academicYear,
      obtainedMarks: examResults.obtainedMarks,
      totalMarks: examResults.totalMarks,
      percentageTimes100: examResults.percentageTimes100,
      grade: examResults.grade,
      status: examResults.status,
      position: examResults.position,
      publishedAt: examResults.publishedAt,
    })
    .from(examResults)
    .innerJoin(examSessions, eq(examSessions.id, examResults.examId))
    .where(and(inArray(examResults.studentId, studentIds), eq(examSessions.status, "published")))
    .orderBy(desc(examResults.publishedAt), desc(examSessions.endDate));

  for (const row of rows) {
    if (results.has(row.studentId)) continue;
    results.set(row.studentId, {
      examId: row.examId,
      examName: row.examName,
      examNameUrdu: row.examNameUrdu,
      academicYear: row.academicYear,
      obtainedMarks: row.obtainedMarks,
      totalMarks: row.totalMarks,
      percentage: row.percentageTimes100 / 100,
      grade: row.grade,
      status: row.status,
      position: row.position,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    });
  }

  return results;
}

async function loadStudentEvents(studentIds: string[]) {
  const events = new Map<string, Array<{
    id: string;
    type: string;
    message: string | null;
    metadata: Record<string, unknown> | null;
    actorName: string | null;
    createdAt: string;
  }>>();
  if (studentIds.length === 0) return events;

  const rows = await db
    .select({
      id: studentEvents.id,
      studentId: studentEvents.studentId,
      type: studentEvents.type,
      message: studentEvents.message,
      metadata: studentEvents.metadata,
      actorName: authUser.name,
      createdAt: studentEvents.createdAt,
    })
    .from(studentEvents)
    .leftJoin(authUser, eq(authUser.id, studentEvents.actorUserId))
    .where(inArray(studentEvents.studentId, studentIds))
    .orderBy(desc(studentEvents.createdAt))
    .limit(100);

  for (const row of rows) {
    const list = events.get(row.studentId) ?? [];
    if (list.length < 8) {
      list.push({
        id: row.id,
        type: row.type,
        message: row.message,
        metadata: row.metadata,
        actorName: row.actorName,
        createdAt: row.createdAt.toISOString(),
      });
      events.set(row.studentId, list);
    }
  }

  return events;
}

function groupLabel(row: Pick<
  StudentDashboardRow,
  | "schoolClassName"
  | "schoolSectionName"
  | "madrassaCategoryName"
  | "madrassaSubcategoryName"
  | "programName"
>) {
  if (row.schoolClassName) return [row.schoolClassName, row.schoolSectionName].filter(Boolean).join(" · ");
  if (row.madrassaSubcategoryName) {
    return [row.madrassaCategoryName, row.madrassaSubcategoryName].filter(Boolean).join(" · ");
  }
  return row.programName;
}

function emptyGuardianSummary(unreadNotifications: number) {
  return {
    studentCount: 0,
    totalOutstandingPaisa: 0,
    unreadNotifications,
    averageAttendanceRate: null,
  };
}

const emptyFeeSummary = {
  totalChargedPaisa: 0,
  totalConcessionPaisa: 0,
  totalPaidPaisa: 0,
  totalRefundedPaisa: 0,
  totalReversedPaisa: 0,
  outstandingPaisa: 0,
};

function emptyAttendanceSummary() {
  return {
    marked: 0,
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    attendanceRate: null as number | null,
  };
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function compactSql(items: Array<SQL | undefined>) {
  return items.filter((item): item is SQL => Boolean(item));
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
