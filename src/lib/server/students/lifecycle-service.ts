import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
} from "@/db/schema/academic";
import { academicYears } from "@/db/schema/academic-years";
import { admissionApplications } from "@/db/schema/admission";
import { studentAttendance } from "@/db/schema/attendance";
import { user as authUser } from "@/db/schema/auth";
import {
  examMarks,
  examResults,
  examSessions,
  examSessionSubjects,
  examSubjects,
} from "@/db/schema/exams";
import { feeCharges, feePayments } from "@/db/schema/finance";
import {
  guardians,
  studentEnrollments,
  studentEvents,
  studentGuardians,
  studentSiblings,
  students,
} from "@/db/schema/students";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";

export type StudentLifecycleArchive = Awaited<ReturnType<typeof getStudentLifecycleArchive>>;

function calculateDuration(from: Date, to: Date) {
  const diffTime = Math.max(0, to.getTime() - from.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);
  days = Math.max(0, days);

  const partsEn: string[] = [];
  if (years > 0) partsEn.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) partsEn.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (days > 0 || partsEn.length === 0) partsEn.push(`${days} ${days === 1 ? "day" : "days"}`);

  const partsUr: string[] = [];
  if (years > 0) partsUr.push(`${years} سال`);
  if (months > 0) partsUr.push(`${months} ماہ`);
  if (days > 0 || partsUr.length === 0) partsUr.push(`${days} دن`);

  return {
    totalDays,
    years,
    months,
    days,
    formattedEn: partsEn.join(", "),
    formattedUr: partsUr.join("، "),
  };
}

export async function searchStudentsForLifecycle(
  request: Request,
  query: { q?: string; system?: string; status?: string; limit?: number },
) {
  await requirePermission(request, "students", "view");

  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
  const search = query.q?.trim()?.toLowerCase();

  const baseQuery = db
    .select({
      id: students.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      fatherNameUrdu: students.fatherNameUrdu,
      gender: students.gender,
      dob: students.dob,
      cnicBForm: students.cnicBForm,
      status: students.status,
      photoPath: students.photoPath,
      enrollmentId: studentEnrollments.id,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      enrollmentStatus: studentEnrollments.status,
      startedAt: studentEnrollments.startedAt,
      endedAt: studentEnrollments.endedAt,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programSystem: programs.system,
      programName: programs.name,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      darja: studentEnrollments.darja,
    })
    .from(students)
    .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
    )
    .orderBy(desc(studentEnrollments.startedAt));

  const rows = await baseQuery;

  // Group by student ID so each student has their primary/latest enrollment
  const studentMap = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!studentMap.has(row.id)) {
      studentMap.set(row.id, row);
    }
  }

  let results = Array.from(studentMap.values());

  if (query.status) {
    results = results.filter((s) => s.status === query.status);
  }

  if (query.system && (query.system === "school" || query.system === "madrassa")) {
    results = results.filter((s) => s.programSystem === query.system);
  }

  if (search) {
    results = results.filter((s) => {
      const matchName = s.name.toLowerCase().includes(search);
      const matchUrdu = s.nameUrdu.includes(search);
      const matchFather = s.fatherName.toLowerCase().includes(search);
      const matchRoll = s.rollNo.toLowerCase().includes(search);
      const matchAdm = s.admissionNo.toLowerCase().includes(search);
      const matchCnic = s.cnicBForm ? s.cnicBForm.includes(search) : false;
      return matchName || matchUrdu || matchFather || matchRoll || matchAdm || matchCnic;
    });
  }

  return results.slice(0, limit);
}

export async function getStudentLifecycleArchive(request: Request, studentId: string) {
  await requirePermission(request, "students", "view");

  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      fatherNameUrdu: students.fatherNameUrdu,
      gender: students.gender,
      dob: students.dob,
      cnicBForm: students.cnicBForm,
      status: students.status,
      photoPath: students.photoPath,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) {
    throw new HttpError("Student not found", 404);
  }

  // 1. Fetch All Enrollments in Chronological Order
  const enrollments = await db
    .select({
      id: studentEnrollments.id,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      status: studentEnrollments.status,
      darja: studentEnrollments.darja,
      startedAt: studentEnrollments.startedAt,
      endedAt: studentEnrollments.endedAt,
      academicYearId: studentEnrollments.academicYearId,
      academicYearName: academicYears.name,
      institutionId: institutions.id,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      institutionGender: institutions.gender,
      programId: programs.id,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      programSystem: programs.system,
      schoolClassId: schoolClasses.id,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      schoolClassFee: schoolClasses.tuitionFeePaisa,
      madrassaSubcategoryId: madrassaSubcategories.id,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      madrassaSubcategoryFee: madrassaSubcategories.tuitionFeePaisa,
      madrassaCategoryId: madrassaCategories.id,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
    })
    .from(studentEnrollments)
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(academicYears, eq(academicYears.id, studentEnrollments.academicYearId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
    )
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .where(eq(studentEnrollments.studentId, studentId))
    .orderBy(asc(studentEnrollments.startedAt));

  // 2. Fetch Admission Application if exists
  const [admission] = await db
    .select({
      id: admissionApplications.id,
      refNo: admissionApplications.refNo,
      source: admissionApplications.source,
      variantKey: admissionApplications.variantKey,
      status: admissionApplications.status,
      submittedAt: admissionApplications.submittedAt,
      decidedAt: admissionApplications.decidedAt,
    })
    .from(admissionApplications)
    .where(eq(admissionApplications.acceptedStudentId, studentId))
    .orderBy(desc(admissionApplications.decidedAt))
    .limit(1);

  // 3. Lifecycle Date & Duration Analysis
  const firstEnrollment = enrollments[0];
  const lastEnrollment = enrollments[enrollments.length - 1];

  const startDate =
    admission?.decidedAt ??
    firstEnrollment?.startedAt ??
    student.createdAt;

  const isOngoing =
    student.status === "active" ||
    (lastEnrollment && !lastEnrollment.endedAt && lastEnrollment.status === "active");

  const endDate = isOngoing
    ? null
    : (lastEnrollment?.endedAt ?? student.updatedAt ?? new Date());

  const duration = calculateDuration(startDate, endDate ?? new Date());

  // 4. Guardians & Parent Logins
  const guardianRows = await db
    .select({
      guardianId: guardians.id,
      name: guardians.name,
      nameUrdu: guardians.nameUrdu,
      relation: studentGuardians.relation,
      isPrimary: studentGuardians.isPrimary,
      phone: guardians.phone,
      cnic: guardians.cnic,
      email: guardians.email,
      address: guardians.address,
      parentUserEmail: authUser.email,
      parentUserUsername: authUser.username,
    })
    .from(studentGuardians)
    .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
    .leftJoin(authUser, eq(authUser.id, guardians.userId))
    .where(eq(studentGuardians.studentId, studentId));

  // 5. Siblings Network
  const siblingLinks = await db
    .select({
      siblingStudentId: studentSiblings.siblingStudentId,
      relationship: studentSiblings.relationship,
    })
    .from(studentSiblings)
    .where(eq(studentSiblings.studentId, studentId));

  let siblings: Array<{
    id: string;
    name: string;
    nameUrdu: string;
    fatherName: string;
    status: string;
    rollNo: string;
    className: string;
    relationship: string;
  }> = [];

  if (siblingLinks.length > 0) {
    const siblingIds = siblingLinks.map((s) => s.siblingStudentId);
    const siblingDetails = await db
      .select({
        id: students.id,
        name: students.name,
        nameUrdu: students.nameUrdu,
        fatherName: students.fatherName,
        status: students.status,
        rollNo: studentEnrollments.rollNo,
        schoolClassName: schoolClasses.name,
        madrassaSubcategoryName: madrassaSubcategories.name,
      })
      .from(students)
      .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
      .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
      .leftJoin(
        madrassaSubcategories,
        eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
      )
      .where(inArray(students.id, siblingIds))
      .orderBy(desc(studentEnrollments.startedAt));

    const map = new Map<string, (typeof siblingDetails)[number]>();
    for (const s of siblingDetails) {
      if (!map.has(s.id)) map.set(s.id, s);
    }

    siblings = siblingLinks
      .map((link) => {
        const row = map.get(link.siblingStudentId);
        if (!row) return null;
        return {
          id: row.id,
          name: row.name,
          nameUrdu: row.nameUrdu,
          fatherName: row.fatherName,
          status: row.status,
          rollNo: row.rollNo,
          className: row.schoolClassName ?? row.madrassaSubcategoryName ?? "—",
          relationship: link.relationship,
        };
      })
      .filter(Boolean) as typeof siblings;
  }

  // 6. Complete Examination & Academic Records
  const examResultRows = await db
    .select({
      id: examResults.id,
      examId: examSessions.id,
      examName: examSessions.name,
      examNameUrdu: examSessions.nameUrdu,
      academicYear: examSessions.academicYear,
      examType: examSessions.type,
      system: examSessions.system,
      startDate: examSessions.startDate,
      endDate: examSessions.endDate,
      obtainedMarks: examResults.obtainedMarks,
      totalMarks: examResults.totalMarks,
      percentageTimes100: examResults.percentageTimes100,
      grade: examResults.grade,
      status: examResults.status,
      position: examResults.position,
      failedSubjects: examResults.failedSubjects,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
    })
    .from(examResults)
    .innerJoin(examSessions, eq(examSessions.id, examResults.examId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, examResults.schoolClassId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, examResults.madrassaSubcategoryId),
    )
    .where(eq(examResults.studentId, studentId))
    .orderBy(asc(examSessions.startDate));

  // Also fetch subject marks breakdown for all exams
  const examMarkRows = await db
    .select({
      examId: examMarks.examId,
      obtainedMarks: examMarks.obtainedMarks,
      attendanceStatus: examMarks.attendanceStatus,
      status: examMarks.status,
      subjectCode: examSubjects.code,
      subjectName: examSubjects.name,
      subjectNameUrdu: examSubjects.nameUrdu,
      totalMarks: examSubjects.totalMarks,
      passingMarks: examSubjects.passingMarks,
    })
    .from(examMarks)
    .innerJoin(examSessionSubjects, eq(examSessionSubjects.id, examMarks.examSubjectId))
    .innerJoin(examSubjects, eq(examSubjects.id, examSessionSubjects.subjectId))
    .where(eq(examMarks.studentId, studentId))
    .orderBy(asc(examSubjects.displayOrder));

  const marksByExamId = new Map<string, typeof examMarkRows>();
  for (const mark of examMarkRows) {
    const list = marksByExamId.get(mark.examId) ?? [];
    list.push(mark);
    marksByExamId.set(mark.examId, list);
  }

  const examSessionsData = examResultRows.map((res) => {
    const subMarks = (marksByExamId.get(res.examId) ?? []).map((m) => {
      const pass = (m.obtainedMarks ?? 0) >= m.passingMarks;
      const pct = m.totalMarks > 0 ? ((m.obtainedMarks ?? 0) / m.totalMarks) * 100 : 0;
      let grade = "F";
      if (pct >= 85) grade = "A+";
      else if (pct >= 75) grade = "A";
      else if (pct >= 60) grade = "B";
      else if (pct >= 50) grade = "C";
      else if (pct >= 40) grade = "D";

      return {
        code: m.subjectCode,
        name: m.subjectName,
        nameUrdu: m.subjectNameUrdu,
        totalMarks: m.totalMarks,
        passingMarks: m.passingMarks,
        obtainedMarks: m.obtainedMarks,
        attendanceStatus: m.attendanceStatus,
        grade,
        passed: pass,
      };
    });

    return {
      ...res,
      subjects: subMarks,
    };
  });

  const totalExams = examSessionsData.length;
  const passedExams = examSessionsData.filter((e) => e.status === "pass").length;
  const avgPercentage =
    totalExams > 0
      ? examSessionsData.reduce((acc, curr) => acc + curr.percentageTimes100 / 100, 0) /
        totalExams
      : 0;
  const bestExam =
    totalExams > 0
      ? examSessionsData.reduce(
          (prev, current) =>
            prev.percentageTimes100 > current.percentageTimes100 ? prev : current,
          examSessionsData[0],
        )
      : null;

  // 7. Complete Attendance Life Records
  const attendanceLogs = await db
    .select({
      id: studentAttendance.id,
      attendanceDate: studentAttendance.attendanceDate,
      status: studentAttendance.status,
      notes: studentAttendance.notes,
    })
    .from(studentAttendance)
    .where(eq(studentAttendance.studentId, studentId))
    .orderBy(desc(studentAttendance.attendanceDate));

  const totalAttendanceDays = attendanceLogs.length;
  const presentDays = attendanceLogs.filter((a) => a.status === "present").length;
  const absentDays = attendanceLogs.filter((a) => a.status === "absent").length;
  const leaveDays = attendanceLogs.filter((a) => a.status === "leave").length;
  const lateDays = attendanceLogs.filter((a) => a.status === "late").length;
  const lifetimeAttendanceRate =
    totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 100;

  // Group attendance by calendar year
  const attendanceByYearMap = new Map<
    string,
    { year: string; total: number; present: number; absent: number; leave: number; late: number }
  >();

  for (const log of attendanceLogs) {
    const yr = log.attendanceDate.slice(0, 4);
    const entry = attendanceByYearMap.get(yr) ?? {
      year: yr,
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
    };
    entry.total += 1;
    if (log.status === "present") entry.present += 1;
    else if (log.status === "absent") entry.absent += 1;
    else if (log.status === "leave") entry.leave += 1;
    else if (log.status === "late") entry.late += 1;
    attendanceByYearMap.set(yr, entry);
  }

  const attendanceByYear = Array.from(attendanceByYearMap.values()).map((row) => ({
    ...row,
    rate: row.total > 0 ? Math.round((row.present / row.total) * 100) : 100,
  }));

  // 8. Fee Lifecycle Records
  const charges = await db
    .select({
      id: feeCharges.id,
      type: feeCharges.type,
      label: feeCharges.label,
      period: feeCharges.period,
      amountPaisa: feeCharges.amountPaisa,
      dueDate: feeCharges.dueDate,
      status: feeCharges.status,
      createdAt: feeCharges.createdAt,
    })
    .from(feeCharges)
    .where(eq(feeCharges.studentId, studentId))
    .orderBy(desc(feeCharges.createdAt));

  const payments = await db
    .select({
      id: feePayments.id,
      receiptNo: feePayments.receiptNo,
      paymentDate: feePayments.paymentDate,
      amountPaisa: feePayments.amountPaisa,
      method: feePayments.method,
      status: feePayments.status,
    })
    .from(feePayments)
    .where(eq(feePayments.studentId, studentId))
    .orderBy(desc(feePayments.paymentDate));

  const totalBilledPaisa = charges
    .filter((c) => c.status !== "reversed")
    .reduce((sum, c) => sum + c.amountPaisa, 0);

  const totalPaidPaisa = payments
    .filter((p) => p.status === "posted")
    .reduce((sum, p) => sum + p.amountPaisa, 0);

  const totalWaivedPaisa = charges
    .filter((c) => c.status === "waived")
    .reduce((sum, c) => sum + c.amountPaisa, 0);

  const balancePaisa = Math.max(0, totalBilledPaisa - totalPaidPaisa - totalWaivedPaisa);

  // 9. Institutional Milestones & Student Events
  const events = await db
    .select({
      id: studentEvents.id,
      type: studentEvents.type,
      message: studentEvents.message,
      metadata: studentEvents.metadata,
      createdAt: studentEvents.createdAt,
      actorName: authUser.name,
    })
    .from(studentEvents)
    .leftJoin(authUser, eq(authUser.id, studentEvents.actorUserId))
    .where(eq(studentEvents.studentId, studentId))
    .orderBy(desc(studentEvents.createdAt));

  return {
    student,
    admission,
    lifecycle: {
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      isOngoing,
      duration,
      currentEnrollment: lastEnrollment ?? null,
      firstEnrollment: firstEnrollment ?? null,
    },
    enrollments: enrollments.map((e) => ({
      ...e,
      startedAt: e.startedAt.toISOString(),
      endedAt: e.endedAt ? e.endedAt.toISOString() : null,
    })),
    guardians: guardianRows,
    siblings,
    exams: {
      sessions: examSessionsData,
      summary: {
        totalExams,
        passedExams,
        failedExams: totalExams - passedExams,
        avgPercentage: Number(avgPercentage.toFixed(1)),
        bestPercentage: bestExam ? Number((bestExam.percentageTimes100 / 100).toFixed(1)) : 0,
        bestExamName: bestExam ? bestExam.examName : null,
      },
    },
    attendance: {
      summary: {
        totalDays: totalAttendanceDays,
        presentDays,
        absentDays,
        leaveDays,
        lateDays,
        rate: lifetimeAttendanceRate,
      },
      byYear: attendanceByYear,
      recent: attendanceLogs.slice(0, 30),
    },
    finance: {
      summary: {
        totalBilledPaisa,
        totalPaidPaisa,
        totalWaivedPaisa,
        balancePaisa,
      },
      charges: charges.map((c) => ({
        ...c,
        dueDate: c.dueDate ? c.dueDate.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
      })),
      payments: payments.map((p) => ({
        ...p,
        paymentDate: p.paymentDate.toISOString(),
      })),
    },
    events: events.map((ev) => ({
      ...ev,
      createdAt: ev.createdAt.toISOString(),
    })),
  };
}

