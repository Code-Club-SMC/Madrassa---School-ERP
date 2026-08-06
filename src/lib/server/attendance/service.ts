import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, inArray, isNull, lte, or, type SQL } from "drizzle-orm";
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
import { studentAttendance, type StudentAttendanceStatus } from "@/db/schema/attendance";
import { studentEnrollments, students } from "@/db/schema/students";
import type { ModuleKey } from "@/lib/permissions/module-registry";
import { attendanceTimelineEvent, summarizeAttendance } from "@/lib/server/attendance/calculations";
import { getRequestUser, requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import { insertStudentEvent } from "@/lib/server/students/events";
import { assertTeacherCanAccessAttendancePlacement } from "@/lib/server/teachers/service";

const attendanceStatuses = ["present", "absent", "late", "leave"] as const;

export const schoolAttendanceRosterQuerySchema = z.object({
  date: z.string().trim().min(1),
  classId: z.string().trim().min(1),
  sectionId: z.string().trim().min(1),
});

export const madrassaAttendanceRosterQuerySchema = z.object({
  date: z.string().trim().min(1),
  institutionId: z.string().trim().min(1),
  subcategoryId: z.string().trim().min(1),
});

const markRowSchema = z.object({
  studentId: z.string().trim().min(1),
  enrollmentId: z.string().trim().min(1),
  status: z.enum(attendanceStatuses),
  notes: z.string().trim().optional(),
});

export const markSchoolAttendanceSchema = schoolAttendanceRosterQuerySchema.extend({
  rows: z.array(markRowSchema).min(1),
});

export const markMadrassaAttendanceSchema = madrassaAttendanceRosterQuerySchema.extend({
  rows: z.array(markRowSchema).min(1),
});

export const attendanceDailySummaryQuerySchema = z.object({
  system: z.enum(["both", "school", "madrassa"]).default("both"),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  institutionId: z.string().trim().optional(),
  programId: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  sectionId: z.string().trim().optional(),
  subcategoryId: z.string().trim().optional(),
});

export const attendanceStudentHistoryQuerySchema = z.object({
  studentId: z.string().trim().min(1),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
});

type AttendanceSystem = "school" | "madrassa";
type AttendanceReportSystem = AttendanceSystem | "both";
type AttendanceTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type AttendanceExecutor = typeof db | AttendanceTx;
type MarkRow = z.infer<typeof markRowSchema>;
type DailySummaryQuery = z.infer<typeof attendanceDailySummaryQuerySchema>;

type RosterStudent = {
  studentId: string;
  enrollmentId: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  rollNo: string;
  admissionNo: string;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  schoolClassId: string | null;
  schoolClassName: string | null;
  schoolClassNameUrdu: string | null;
  schoolSectionId: string | null;
  schoolSectionName: string | null;
  madrassaCategoryId: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu: string | null;
  madrassaSubcategoryId: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  darja: string | null;
};

type AttendanceRow = typeof studentAttendance.$inferSelect;

type AttendanceReportRow = AttendanceRow & {
  studentName: string;
  studentNameUrdu: string;
  fatherName: string;
  rollNo: string;
  admissionNo: string;
  institutionName: string;
  institutionNameUrdu: string;
  programName: string;
  programNameUrdu: string;
  programSystem: string;
  schoolClassName: string | null;
  schoolSectionName: string | null;
  madrassaCategoryName: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  darja: string | null;
};

function attendanceModuleForSystem(system: AttendanceSystem): ModuleKey {
  return system === "madrassa" ? "madrassa_attendance" : "school_attendance";
}

function parseAttendanceDate(value: string, label = "date") {
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(`Invalid ${label}`, 400);
  return date;
}

function parseOptionalAttendanceDate(value: string | undefined, label: string) {
  return value ? parseAttendanceDate(value, label) : undefined;
}

function compactSql<T extends SQL | undefined>(clauses: T[]) {
  return clauses.filter(Boolean) as SQL[];
}

function serializeAttendanceRow(row: AttendanceRow | undefined) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    date: row.attendanceDate,
    status: row.status,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSchoolAttendanceRoster(
  request: Request,
  query: z.infer<typeof schoolAttendanceRosterQuerySchema>,
) {
  await requirePermission(request, "school_attendance", "view");
  await assertTeacherAttendanceAccess(request, "school", {
    classId: query.classId,
    sectionId: query.sectionId,
  });

  const date = parseAttendanceDate(query.date);
  const roster = await loadRoster("school", {
    classId: query.classId,
    sectionId: query.sectionId,
  });
  const existing = await loadExistingAttendance(db, date, roster.map((row) => row.enrollmentId));
  const existingByEnrollment = new Map(existing.map((row) => [row.enrollmentId, row]));

  return {
    date,
    students: roster.map((row) => serializeRosterStudent(row, existingByEnrollment.get(row.enrollmentId))),
    summary: summarizeAttendance(existing, roster.length),
  };
}

export async function getMadrassaAttendanceRoster(
  request: Request,
  query: z.infer<typeof madrassaAttendanceRosterQuerySchema>,
) {
  await requirePermission(request, "madrassa_attendance", "view");
  await assertTeacherAttendanceAccess(request, "madrassa", {
    institutionId: query.institutionId,
    subcategoryId: query.subcategoryId,
  });

  const date = parseAttendanceDate(query.date);
  const roster = await loadRoster("madrassa", {
    institutionId: query.institutionId,
    subcategoryId: query.subcategoryId,
  });
  const existing = await loadExistingAttendance(db, date, roster.map((row) => row.enrollmentId));
  const existingByEnrollment = new Map(existing.map((row) => [row.enrollmentId, row]));

  return {
    date,
    students: roster.map((row) => serializeRosterStudent(row, existingByEnrollment.get(row.enrollmentId))),
    summary: summarizeAttendance(existing, roster.length),
  };
}

export async function markSchoolAttendance(request: Request, input: z.infer<typeof markSchoolAttendanceSchema>) {
  return markAttendance(request, "school", input);
}

export async function markMadrassaAttendance(request: Request, input: z.infer<typeof markMadrassaAttendanceSchema>) {
  return markAttendance(request, "madrassa", input);
}

export async function getAttendanceDailySummaryReport(request: Request, query: DailySummaryQuery) {
  await requirePermission(request, "reports_attendance", "view");

  const rows = await fetchAttendanceReportRows(query);
  const byPlacement = new Map<string, {
    date: string;
    system: AttendanceSystem;
    institutionId: string;
    institutionName: string;
    institutionNameUrdu: string;
    programId: string;
    programName: string;
    programNameUrdu: string;
    schoolClassId: string | null;
    schoolSectionId: string | null;
    madrassaSubcategoryId: string | null;
    placementLabel: string;
    statuses: Array<{ status: StudentAttendanceStatus }>;
  }>();

  for (const row of rows) {
    const system = systemFromProgram(row.programSystem);
    const placementLabel = groupLabelForRow(row);
    const key = [
      row.attendanceDate,
      system,
      row.institutionId,
      row.programId,
      row.schoolClassId ?? "",
      row.schoolSectionId ?? "",
      row.madrassaSubcategoryId ?? "",
    ].join(":");
    const summaryRow = byPlacement.get(key) ?? {
      date: row.attendanceDate,
      system,
      institutionId: row.institutionId,
      institutionName: row.institutionName,
      institutionNameUrdu: row.institutionNameUrdu,
      programId: row.programId,
      programName: row.programName,
      programNameUrdu: row.programNameUrdu,
      schoolClassId: row.schoolClassId,
      schoolSectionId: row.schoolSectionId,
      madrassaSubcategoryId: row.madrassaSubcategoryId,
      placementLabel,
      statuses: [],
    };
    summaryRow.statuses.push({ status: row.status });
    byPlacement.set(key, summaryRow);
  }

  const reportRows = Array.from(byPlacement.values()).map((row) => ({
    date: row.date,
    system: row.system,
    institutionId: row.institutionId,
    institutionName: row.institutionName,
    institutionNameUrdu: row.institutionNameUrdu,
    programId: row.programId,
    programName: row.programName,
    programNameUrdu: row.programNameUrdu,
    schoolClassId: row.schoolClassId,
    schoolSectionId: row.schoolSectionId,
    madrassaSubcategoryId: row.madrassaSubcategoryId,
    placementLabel: row.placementLabel,
    summary: summarizeAttendance(row.statuses),
  }));

  return {
    rows: reportRows,
    totals: summarizeAttendance(rows),
  };
}

export async function getAttendanceStudentHistoryReport(
  request: Request,
  query: z.infer<typeof attendanceStudentHistoryQuerySchema>,
) {
  await requirePermission(request, "reports_attendance", "view");

  const rows = await fetchAttendanceReportRows({
    system: "both",
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  }, query.studentId);
  const student = await loadStudentForHistory(query.studentId, rows[0]);
  if (!student) throw new HttpError("Student not found", 404);

  return {
    student,
    rows: rows.map((row) => ({
      id: row.id,
      date: row.attendanceDate,
      status: row.status,
      notes: row.notes,
      enrollmentId: row.enrollmentId,
      system: systemFromProgram(row.programSystem),
      institutionName: row.institutionName,
      institutionNameUrdu: row.institutionNameUrdu,
      programName: row.programName,
      programNameUrdu: row.programNameUrdu,
      groupLabel: groupLabelForRow(row),
      markedByUserId: row.markedByUserId,
      updatedAt: row.updatedAt.toISOString(),
    })),
    summary: summarizeAttendance(rows),
  };
}

async function markAttendance(
  request: Request,
  system: AttendanceSystem,
  input: z.infer<typeof markSchoolAttendanceSchema> | z.infer<typeof markMadrassaAttendanceSchema>,
) {
  const date = parseAttendanceDate(input.date);
  await assertTeacherAttendanceAccess(
    request,
    system,
    system === "school"
      ? {
          classId: (input as z.infer<typeof markSchoolAttendanceSchema>).classId,
          sectionId: (input as z.infer<typeof markSchoolAttendanceSchema>).sectionId,
        }
      : {
          institutionId: (input as z.infer<typeof markMadrassaAttendanceSchema>).institutionId,
          subcategoryId: (input as z.infer<typeof markMadrassaAttendanceSchema>).subcategoryId,
        },
  );
  const roster = await loadRoster(system, input);
  const rosterByKey = new Map(roster.map((row) => [rosterKey(row), row]));
  const inputKeys = new Set<string>();

  for (const row of input.rows) {
    const key = markRowKey(row);
    if (inputKeys.has(key)) throw new HttpError("A student can only be marked once per request", 400);
    inputKeys.add(key);
    if (!rosterByKey.has(key)) throw new HttpError("One or more attendance rows are outside the selected roster", 400);
  }

  const existing = await loadExistingAttendance(db, date, roster.map((row) => row.enrollmentId));
  const existingByKey = new Map(existing.map((row) => [attendanceRowKey(row), row]));
  const hasChangedExistingRow = input.rows.some((row) => {
    const previous = existingByKey.get(markRowKey(row));
    return Boolean(previous && (previous.status !== row.status || normalizeNotes(previous.notes) !== normalizeNotes(row.notes)));
  });
  const actor = await requirePermission(
    request,
    attendanceModuleForSystem(system),
    hasChangedExistingRow ? "edit" : "create",
  );

  return db.transaction(async (tx) => {
    const upserted: AttendanceRow[] = [];

    for (const row of input.rows) {
      const rosterRow = rosterByKey.get(markRowKey(row));
      if (!rosterRow) throw new HttpError("One or more attendance rows are outside the selected roster", 400);

      const previous = existingByKey.get(markRowKey(row));
      const [attendance] = await tx
        .insert(studentAttendance)
        .values({
          id: previous?.id ?? randomUUID(),
          studentId: rosterRow.studentId,
          enrollmentId: rosterRow.enrollmentId,
          institutionId: rosterRow.institutionId,
          programId: rosterRow.programId,
          schoolClassId: rosterRow.schoolClassId,
          schoolSectionId: rosterRow.schoolSectionId,
          madrassaCategoryId: rosterRow.madrassaCategoryId,
          madrassaSubcategoryId: rosterRow.madrassaSubcategoryId,
          attendanceDate: date,
          status: row.status,
          notes: normalizeNotes(row.notes),
          markedByUserId: actor.id,
        })
        .onConflictDoUpdate({
          target: [studentAttendance.studentId, studentAttendance.enrollmentId, studentAttendance.attendanceDate],
          set: {
            status: row.status,
            notes: normalizeNotes(row.notes),
            markedByUserId: actor.id,
            updatedAt: new Date(),
          },
        })
        .returning();

      const eventType = attendanceTimelineEvent(previous?.status, row.status);
      if (eventType) {
        await insertStudentEvent(tx, {
          studentId: rosterRow.studentId,
          enrollmentId: rosterRow.enrollmentId,
          type: eventType,
          message: attendanceEventMessage(eventType, row.status, date),
          metadata: {
            date,
            previousStatus: previous?.status ?? null,
            nextStatus: row.status,
            notes: normalizeNotes(row.notes),
            institutionName: rosterRow.institutionName,
            programName: rosterRow.programName,
            className: rosterRow.schoolClassName,
            sectionName: rosterRow.schoolSectionName,
            madrassaCategoryName: rosterRow.madrassaCategoryName,
            madrassaSubcategoryName: rosterRow.madrassaSubcategoryName,
            darja: rosterRow.darja,
          },
          actorUserId: actor.id,
        });
      }

      upserted.push(attendance);
    }

    const refreshed = await loadExistingAttendance(tx, date, roster.map((row) => row.enrollmentId));

    return {
      date,
      students: roster.map((row) =>
        serializeRosterStudent(row, refreshed.find((attendance) => attendance.enrollmentId === row.enrollmentId)),
      ),
      summary: summarizeAttendance(refreshed, roster.length),
      saved: upserted.map(serializeAttendanceRow),
    };
  });
}

async function assertTeacherAttendanceAccess(
  request: Request,
  system: AttendanceSystem,
  filters: { classId?: string; sectionId?: string; institutionId?: string; subcategoryId?: string },
) {
  const actor = await getRequestUser(request);
  if (actor?.role !== "teacher") return;
  await assertTeacherCanAccessAttendancePlacement(actor.id, system, filters);
}

async function loadRoster(
  system: AttendanceSystem,
  filters:
    | Pick<z.infer<typeof schoolAttendanceRosterQuerySchema>, "classId" | "sectionId">
    | Pick<z.infer<typeof madrassaAttendanceRosterQuerySchema>, "institutionId" | "subcategoryId">,
): Promise<RosterStudent[]> {
  const schoolFilters = system === "school" ? filters as { classId: string; sectionId: string } : null;
  const madrassaFilters = system === "madrassa" ? filters as { institutionId: string; subcategoryId: string } : null;
  const clauses = compactSql([
    eq(students.status, "active"),
    eq(studentEnrollments.status, "active"),
    isNull(studentEnrollments.endedAt),
    eq(programs.system, system),
    schoolFilters ? eq(studentEnrollments.schoolClassId, schoolFilters.classId) : undefined,
    schoolFilters ? eq(studentEnrollments.schoolSectionId, schoolFilters.sectionId) : undefined,
    madrassaFilters ? eq(studentEnrollments.institutionId, madrassaFilters.institutionId) : undefined,
    madrassaFilters ? eq(studentEnrollments.madrassaSubcategoryId, madrassaFilters.subcategoryId) : undefined,
  ]);

  return db
    .select({
      studentId: students.id,
      enrollmentId: studentEnrollments.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      institutionId: studentEnrollments.institutionId,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programId: studentEnrollments.programId,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      schoolClassId: studentEnrollments.schoolClassId,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      schoolSectionId: studentEnrollments.schoolSectionId,
      schoolSectionName: schoolClassSections.name,
      madrassaCategoryId: madrassaCategories.id,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSubcategoryId: studentEnrollments.madrassaSubcategoryId,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      darja: studentEnrollments.darja,
    })
    .from(students)
    .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .where(and(...clauses))
    .orderBy(asc(studentEnrollments.rollNo), asc(students.name));
}

async function loadExistingAttendance(executor: AttendanceExecutor, date: string, enrollmentIds: string[]) {
  const ids = uniqueStrings(enrollmentIds);
  if (ids.length === 0) return [];

  return executor
    .select()
    .from(studentAttendance)
    .where(and(eq(studentAttendance.attendanceDate, date), inArray(studentAttendance.enrollmentId, ids)));
}

async function fetchAttendanceReportRows(
  query: DailySummaryQuery,
  studentId?: string,
): Promise<AttendanceReportRow[]> {
  const dateFrom = parseOptionalAttendanceDate(query.dateFrom, "dateFrom");
  const dateTo = parseOptionalAttendanceDate(query.dateTo, "dateTo");
  const clauses = compactSql([
    studentId ? eq(studentAttendance.studentId, studentId) : undefined,
    reportSystemCondition(query.system),
    dateFrom ? gte(studentAttendance.attendanceDate, dateFrom) : undefined,
    dateTo ? lte(studentAttendance.attendanceDate, dateTo) : undefined,
    query.institutionId ? eq(studentAttendance.institutionId, query.institutionId) : undefined,
    query.programId ? eq(studentAttendance.programId, query.programId) : undefined,
    query.classId ? eq(studentAttendance.schoolClassId, query.classId) : undefined,
    query.sectionId ? eq(studentAttendance.schoolSectionId, query.sectionId) : undefined,
    query.subcategoryId ? eq(studentAttendance.madrassaSubcategoryId, query.subcategoryId) : undefined,
  ]);

  return db
    .select({
      id: studentAttendance.id,
      studentId: studentAttendance.studentId,
      enrollmentId: studentAttendance.enrollmentId,
      institutionId: studentAttendance.institutionId,
      programId: studentAttendance.programId,
      schoolClassId: studentAttendance.schoolClassId,
      schoolSectionId: studentAttendance.schoolSectionId,
      madrassaCategoryId: studentAttendance.madrassaCategoryId,
      madrassaSubcategoryId: studentAttendance.madrassaSubcategoryId,
      attendanceDate: studentAttendance.attendanceDate,
      status: studentAttendance.status,
      notes: studentAttendance.notes,
      markedByUserId: studentAttendance.markedByUserId,
      createdAt: studentAttendance.createdAt,
      updatedAt: studentAttendance.updatedAt,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      programSystem: programs.system,
      schoolClassName: schoolClasses.name,
      schoolSectionName: schoolClassSections.name,
      madrassaCategoryName: madrassaCategories.name,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
      darja: studentEnrollments.darja,
    })
    .from(studentAttendance)
    .innerJoin(students, eq(students.id, studentAttendance.studentId))
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, studentAttendance.enrollmentId))
    .innerJoin(institutions, eq(institutions.id, studentAttendance.institutionId))
    .innerJoin(programs, eq(programs.id, studentAttendance.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentAttendance.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentAttendance.schoolSectionId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, studentAttendance.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, studentAttendance.madrassaCategoryId))
    .where(and(...clauses))
    .orderBy(asc(studentAttendance.attendanceDate), asc(studentEnrollments.rollNo), asc(students.name));
}

async function loadStudentForHistory(studentId: string, firstAttendanceRow?: AttendanceReportRow) {
  if (firstAttendanceRow) {
    return {
      id: firstAttendanceRow.studentId,
      name: firstAttendanceRow.studentName,
      nameUrdu: firstAttendanceRow.studentNameUrdu,
      fatherName: firstAttendanceRow.fatherName,
      rollNo: firstAttendanceRow.rollNo,
      admissionNo: firstAttendanceRow.admissionNo,
      system: systemFromProgram(firstAttendanceRow.programSystem),
      institutionName: firstAttendanceRow.institutionName,
      institutionNameUrdu: firstAttendanceRow.institutionNameUrdu,
      programName: firstAttendanceRow.programName,
      programNameUrdu: firstAttendanceRow.programNameUrdu,
      groupLabel: groupLabelForRow(firstAttendanceRow),
    };
  }

  const [row] = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      programSystem: programs.system,
      schoolClassName: schoolClasses.name,
      schoolSectionName: schoolClassSections.name,
      madrassaCategoryName: madrassaCategories.name,
      madrassaSubcategoryName: madrassaSubcategories.name,
      darja: studentEnrollments.darja,
    })
    .from(students)
    .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .where(eq(students.id, studentId))
    .orderBy(asc(studentEnrollments.endedAt), asc(studentEnrollments.startedAt))
    .limit(1);

  if (!row) return null;
  return {
    id: row.studentId,
    name: row.studentName,
    nameUrdu: row.studentNameUrdu,
    fatherName: row.fatherName,
    rollNo: row.rollNo,
    admissionNo: row.admissionNo,
    system: systemFromProgram(row.programSystem),
    institutionName: row.institutionName,
    institutionNameUrdu: row.institutionNameUrdu,
    programName: row.programName,
    programNameUrdu: row.programNameUrdu,
    groupLabel: groupLabelForRow(row),
  };
}

function reportSystemCondition(system: AttendanceReportSystem) {
  if (system === "school") return eq(programs.system, "school");
  if (system === "madrassa") return eq(programs.system, "madrassa");
  return or(eq(programs.system, "school"), eq(programs.system, "madrassa"));
}

function serializeRosterStudent(row: RosterStudent, attendance: AttendanceRow | undefined) {
  return {
    id: row.studentId,
    enrollmentId: row.enrollmentId,
    name: row.name,
    nameUrdu: row.nameUrdu,
    fatherName: row.fatherName,
    rollNo: row.rollNo,
    admissionNo: row.admissionNo,
    institutionName: row.institutionName,
    institutionNameUrdu: row.institutionNameUrdu,
    groupLabel: groupLabelForRow(row),
    attendance: serializeAttendanceRow(attendance),
  };
}

function groupLabelForRow(row: {
  schoolClassName: string | null;
  schoolSectionName: string | null;
  madrassaCategoryName: string | null;
  madrassaSubcategoryName: string | null;
  darja?: string | null;
}) {
  if (row.schoolClassName) return `${row.schoolClassName} · ${row.schoolSectionName ?? "No section"}`;
  const darjaSuffix = row.darja ? ` (${row.darja})` : "";
  return `${row.madrassaCategoryName ?? "Madrassa"} · ${row.madrassaSubcategoryName ?? "Darja"}${darjaSuffix}`;
}

function attendanceEventMessage(
  eventType: NonNullable<ReturnType<typeof attendanceTimelineEvent>>,
  nextStatus: StudentAttendanceStatus,
  date: string,
) {
  if (eventType === "attendance_corrected") return `Attendance corrected for ${date}`;
  if (nextStatus === "absent") return `Marked absent for ${date}`;
  if (nextStatus === "late") return `Marked late for ${date}`;
  return `Marked on leave for ${date}`;
}

function systemFromProgram(programSystem: string): AttendanceSystem {
  return programSystem === "madrassa" ? "madrassa" : "school";
}

function rosterKey(row: Pick<RosterStudent, "studentId" | "enrollmentId">) {
  return `${row.studentId}:${row.enrollmentId}`;
}

function markRowKey(row: Pick<MarkRow, "studentId" | "enrollmentId">) {
  return `${row.studentId}:${row.enrollmentId}`;
}

function attendanceRowKey(row: Pick<AttendanceRow, "studentId" | "enrollmentId">) {
  return `${row.studentId}:${row.enrollmentId}`;
}

function normalizeNotes(value: string | null | undefined) {
  return value?.trim() || null;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
