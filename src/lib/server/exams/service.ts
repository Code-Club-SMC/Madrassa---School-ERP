import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, isNull, lte, max, or, type SQL } from "drizzle-orm";
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
import {
  examHalls,
  examMarks,
  examResults,
  examSeatAssignments,
  examSeatingPlans,
  examSessionSubjects,
  examSessions,
  examSubjects,
  type ExamSystem,
} from "@/db/schema/exams";
import { studentEnrollments, students } from "@/db/schema/students";
import type { ModuleKey, PermissionAction } from "@/lib/permissions/module-registry";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import { insertStudentEvent } from "@/lib/server/students/events";
import { buildHallSeating, countViolations, type SeatingStudent } from "@/lib/seating";
import { assignPositions, buildTranscript, calculateExamResult } from "./result-calculations";

const systems = ["school", "madrassa"] as const;
const examStatuses = ["draft", "active", "locked", "published"] as const;
const examTypes = ["monthly", "quarterly", "halfyearly", "annual", "sahmahi", "nisfussana", "salanah"] as const;
const attendanceStatuses = ["present", "absent", "leave"] as const;

export const subjectInputSchema = z.object({
  system: z.enum(systems),
  schoolClassId: z.string().trim().optional(),
  madrassaSubcategoryId: z.string().trim().optional(),
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  nameUrdu: z.string().trim().min(1),
  group: z.string().trim().default("general"),
  totalMarks: z.number().int().positive(),
  passingMarks: z.number().int().nonnegative(),
  displayOrder: z.number().int().default(0),
  active: z.boolean().optional(),
});

export const subjectUpdateSchema = subjectInputSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export const subjectListQuerySchema = z.object({
  system: z.enum(systems),
  schoolClassId: z.string().trim().optional(),
  madrassaSubcategoryId: z.string().trim().optional(),
  active: z.enum(["true", "false"]).optional(),
});

export const examInputSchema = z.object({
  system: z.enum(systems),
  institutionId: z.string().trim().min(1),
  programId: z.string().trim().min(1),
  schoolClassId: z.string().trim().optional(),
  schoolSectionId: z.string().trim().optional(),
  madrassaCategoryId: z.string().trim().optional(),
  madrassaSubcategoryId: z.string().trim().optional(),
  academicYear: z.string().trim().min(1),
  type: z.enum(examTypes),
  name: z.string().trim().min(1),
  nameUrdu: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  subjectIds: z.array(z.string().trim().min(1)).default([]),
});

export const examUpdateSchema = examInputSchema
  .partial()
  .extend({
    status: z.enum(examStatuses).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

export const examListQuerySchema = z.object({
  system: z.enum(systems),
  status: z.enum(examStatuses).optional(),
  academicYear: z.string().trim().optional(),
  institutionId: z.string().trim().optional(),
  schoolClassId: z.string().trim().optional(),
  madrassaSubcategoryId: z.string().trim().optional(),
});

export const marksQuerySchema = z.object({
  examSubjectId: z.string().trim().min(1),
});

export const marksSaveSchema = z.object({
  examSubjectId: z.string().trim().min(1),
  rows: z
    .array(
      z.object({
        studentId: z.string().trim().min(1),
        enrollmentId: z.string().trim().min(1),
        attendanceStatus: z.enum(attendanceStatuses),
        obtainedMarks: z.number().int().nonnegative().nullable(),
        notes: z.string().trim().optional(),
      }),
    )
    .min(1),
});

export const hallInputSchema = z.object({
  system: z.enum(systems),
  name: z.string().trim().min(1),
  nameUrdu: z.string().trim().optional(),
  rows: z.number().int().positive(),
  cols: z.number().int().positive(),
  aisleEveryRow: z.number().int().nonnegative().default(0),
  aisleEveryCol: z.number().int().nonnegative().default(0),
  active: z.boolean().optional(),
});

export const hallUpdateSchema = hallInputSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export const hallListQuerySchema = z.object({
  system: z.enum(systems),
  active: z.enum(["true", "false"]).optional(),
});

export const seatingGenerateSchema = z.object({
  gap: z.number().int().min(1).default(1),
  seed: z.string().trim().optional(),
  allowUnseated: z.boolean().default(false),
});

export const examReportQuerySchema = z.object({
  system: z.enum(["both", "school", "madrassa"]).default("both"),
  examId: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  institutionId: z.string().trim().optional(),
  programId: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
});

type ExamSessionRow = typeof examSessions.$inferSelect;
type ExamSubjectRow = typeof examSubjects.$inferSelect;
type ExamSessionSubjectRow = typeof examSessionSubjects.$inferSelect;
type ExamMarkRow = typeof examMarks.$inferSelect;
type ExamResultRow = typeof examResults.$inferSelect;
type ExamHallRow = typeof examHalls.$inferSelect;
type ExamSeatingPlanRow = typeof examSeatingPlans.$inferSelect;
type ExamSeatAssignmentRow = typeof examSeatAssignments.$inferSelect;
type ExamTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ExamExecutor = typeof db | ExamTx;
type ExamReportSystem = ExamSystem | "both";

type ExamDetailRow = ExamSessionRow & {
  institutionName: string;
  institutionNameUrdu: string;
  programName: string;
  programNameUrdu: string;
  schoolClassName: string | null;
  schoolClassNameUrdu: string | null;
  schoolSectionName: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
};

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

function examModuleForSystem(system: ExamSystem): ModuleKey {
  return system === "madrassa" ? "madrassa_exams_internal" : "school_exams_internal";
}

function compactSql<T extends SQL | undefined>(clauses: T[]) {
  return clauses.filter(Boolean) as SQL[];
}

function parseDateOnly(value: string, label = "date") {
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(`Invalid ${label}`, 400);
  return date;
}

async function requireExamPermission(request: Request, system: ExamSystem, action: PermissionAction) {
  return requirePermission(request, examModuleForSystem(system), action);
}

export async function listExamSubjects(request: Request, query: z.infer<typeof subjectListQuerySchema>) {
  await requireExamPermission(request, query.system, "view");
  const clauses = compactSql([
    eq(examSubjects.system, query.system),
    query.schoolClassId ? eq(examSubjects.schoolClassId, query.schoolClassId) : undefined,
    query.madrassaSubcategoryId ? eq(examSubjects.madrassaSubcategoryId, query.madrassaSubcategoryId) : undefined,
    query.active ? eq(examSubjects.active, query.active === "true") : undefined,
  ]);

  const rows = await db
    .select()
    .from(examSubjects)
    .where(and(...clauses))
    .orderBy(asc(examSubjects.displayOrder), asc(examSubjects.name));

  return { subjects: rows.map(serializeSubject) };
}

export async function createExamSubject(request: Request, input: z.infer<typeof subjectInputSchema>) {
  const actor = await requireExamPermission(request, input.system, "create");
  assertSubjectScope(input.system, input.schoolClassId, input.madrassaSubcategoryId);
  assertPassingMarks(input.totalMarks, input.passingMarks);

  const [created] = await db
    .insert(examSubjects)
    .values({
      id: randomUUID(),
      system: input.system,
      schoolClassId: input.schoolClassId ?? null,
      madrassaSubcategoryId: input.madrassaSubcategoryId ?? null,
      code: input.code.toUpperCase(),
      name: input.name,
      nameUrdu: input.nameUrdu,
      group: input.group,
      totalMarks: input.totalMarks,
      passingMarks: input.passingMarks,
      displayOrder: input.displayOrder,
      active: input.active ?? true,
    })
    .returning();

  return { subject: serializeSubject(created), createdByUserId: actor.id };
}

export async function updateExamSubject(
  request: Request,
  id: string,
  input: z.infer<typeof subjectUpdateSchema>,
) {
  const [current] = await db.select().from(examSubjects).where(eq(examSubjects.id, id)).limit(1);
  if (!current) throw new HttpError("Subject not found", 404);
  await requireExamPermission(request, current.system, "edit");

  const nextSystem = input.system ?? current.system;
  const nextSchoolClassId = input.schoolClassId ?? current.schoolClassId ?? undefined;
  const nextMadrassaSubcategoryId = input.madrassaSubcategoryId ?? current.madrassaSubcategoryId ?? undefined;
  const nextTotalMarks = input.totalMarks ?? current.totalMarks;
  const nextPassingMarks = input.passingMarks ?? current.passingMarks;
  assertSubjectScope(nextSystem, nextSchoolClassId, nextMadrassaSubcategoryId);
  assertPassingMarks(nextTotalMarks, nextPassingMarks);

  const [updated] = await db
    .update(examSubjects)
    .set({
      ...input,
      code: input.code ? input.code.toUpperCase() : undefined,
      schoolClassId: nextSystem === "school" ? nextSchoolClassId : null,
      madrassaSubcategoryId: nextSystem === "madrassa" ? nextMadrassaSubcategoryId : null,
      updatedAt: new Date(),
    })
    .where(eq(examSubjects.id, id))
    .returning();

  return { subject: serializeSubject(updated) };
}

export async function listExamSessions(request: Request, query: z.infer<typeof examListQuerySchema>) {
  await requireExamPermission(request, query.system, "view");
  const clauses = compactSql([
    eq(examSessions.system, query.system),
    query.status ? eq(examSessions.status, query.status) : undefined,
    query.academicYear ? eq(examSessions.academicYear, query.academicYear) : undefined,
    query.institutionId ? eq(examSessions.institutionId, query.institutionId) : undefined,
    query.schoolClassId ? eq(examSessions.schoolClassId, query.schoolClassId) : undefined,
    query.madrassaSubcategoryId ? eq(examSessions.madrassaSubcategoryId, query.madrassaSubcategoryId) : undefined,
  ]);

  const exams = await fetchExamDetails(clauses);
  const subjects = await loadSessionSubjects(exams.map((exam) => exam.id));
  const counts = await Promise.all(exams.map((exam) => loadExamRoster(exam).then((rows) => [exam.id, rows.length] as const)));
  const countMap = new Map(counts);

  return {
    exams: exams.map((exam) => serializeExam(exam, subjects.get(exam.id) ?? [], countMap.get(exam.id) ?? 0)),
  };
}

export async function createExamSession(request: Request, input: z.infer<typeof examInputSchema>) {
  const actor = await requireExamPermission(request, input.system, "create");
  validateExamScope(input.system, input);
  const startDate = parseDateOnly(input.startDate, "startDate");
  const endDate = parseDateOnly(input.endDate, "endDate");
  if (startDate > endDate) throw new HttpError("Start date cannot be after end date", 400);
  await assertProgramScope(input.system, input.institutionId, input.programId);
  const subjects = await loadSubjectsForExam(input.system, input.subjectIds);
  assertSubjectsMatchExamScope(input, subjects);

  const examId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(examSessions).values({
      id: examId,
      system: input.system,
      institutionId: input.institutionId,
      programId: input.programId,
      schoolClassId: input.schoolClassId ?? null,
      schoolSectionId: input.schoolSectionId ?? null,
      madrassaCategoryId: input.madrassaCategoryId ?? null,
      madrassaSubcategoryId: input.madrassaSubcategoryId ?? null,
      academicYear: input.academicYear,
      type: input.type,
      name: input.name,
      nameUrdu: input.nameUrdu,
      startDate,
      endDate,
      status: "draft",
      createdByUserId: actor.id,
    });
    await replaceExamSubjects(tx, examId, subjects);
  });

  return getExamSession(request, examId);
}

export async function getExamSession(request: Request, id: string) {
  const exam = await loadExamDetail(id);
  await requireExamPermission(request, exam.system, "view");
  const subjects = await loadSessionSubjects([id]);
  const roster = await loadExamRoster(exam);
  return { exam: serializeExam(exam, subjects.get(id) ?? [], roster.length) };
}

export async function updateExamSession(
  request: Request,
  id: string,
  input: z.infer<typeof examUpdateSchema>,
) {
  const current = await loadExamDetail(id);
  await requireExamPermission(request, current.system, "edit");
  if (current.status === "published") throw new HttpError("Published exams cannot be edited", 400);

  const nextSystem = input.system ?? current.system;
  validateExamScope(nextSystem, {
    schoolClassId: input.schoolClassId ?? current.schoolClassId ?? undefined,
    schoolSectionId: input.schoolSectionId ?? current.schoolSectionId ?? undefined,
    madrassaCategoryId: input.madrassaCategoryId ?? current.madrassaCategoryId ?? undefined,
    madrassaSubcategoryId: input.madrassaSubcategoryId ?? current.madrassaSubcategoryId ?? undefined,
  });

  if (input.institutionId || input.programId || input.system) {
    await assertProgramScope(nextSystem, input.institutionId ?? current.institutionId, input.programId ?? current.programId);
  }

  const subjects = input.subjectIds ? await loadSubjectsForExam(nextSystem, input.subjectIds) : null;
  if (subjects) {
    assertSubjectsMatchExamScope(
      {
        ...current,
        ...input,
        system: nextSystem,
        schoolClassId: input.schoolClassId ?? current.schoolClassId ?? undefined,
        madrassaSubcategoryId: input.madrassaSubcategoryId ?? current.madrassaSubcategoryId ?? undefined,
      },
      subjects,
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(examSessions)
      .set({
        system: input.system,
        institutionId: input.institutionId,
        programId: input.programId,
        schoolClassId: nextSystem === "school" ? input.schoolClassId ?? current.schoolClassId : null,
        schoolSectionId: nextSystem === "school" ? input.schoolSectionId ?? current.schoolSectionId : null,
        madrassaCategoryId: nextSystem === "madrassa" ? input.madrassaCategoryId ?? current.madrassaCategoryId : null,
        madrassaSubcategoryId:
          nextSystem === "madrassa" ? input.madrassaSubcategoryId ?? current.madrassaSubcategoryId : null,
        academicYear: input.academicYear,
        type: input.type,
        name: input.name,
        nameUrdu: input.nameUrdu,
        startDate: input.startDate ? parseDateOnly(input.startDate, "startDate") : undefined,
        endDate: input.endDate ? parseDateOnly(input.endDate, "endDate") : undefined,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(examSessions.id, id));

    if (subjects) await replaceExamSubjects(tx, id, subjects);
  });

  return getExamSession(request, id);
}

export async function getMarksEntry(request: Request, examId: string, examSubjectId: string) {
  const exam = await loadExamDetail(examId);
  await requireExamPermission(request, exam.system, "view");
  const examSubject = await loadExamSubject(examId, examSubjectId);
  const roster = await loadExamRoster(exam);
  const marks = await loadMarksForSubject(db, examSubjectId, roster.map((row) => row.enrollmentId));
  const marksByEnrollment = new Map(marks.map((mark) => [mark.enrollmentId, mark]));

  return {
    exam: serializeExam(exam, [examSubject], roster.length),
    subject: serializeSessionSubject(examSubject),
    students: roster.map((row) => serializeMarksRosterStudent(row, marksByEnrollment.get(row.enrollmentId))),
  };
}

export async function saveExamMarks(request: Request, examId: string, input: z.infer<typeof marksSaveSchema>) {
  const exam = await loadExamDetail(examId);
  const actor = await requireExamPermission(request, exam.system, "mark_entry");
  if (exam.status === "published") throw new HttpError("Published exam marks cannot be changed", 400);
  const examSubject = await loadExamSubject(examId, input.examSubjectId);
  if (examSubject.locked) throw new HttpError("This subject is locked", 400);

  const roster = await loadExamRoster(exam);
  const rosterByKey = new Map(roster.map((row) => [rosterKey(row), row]));
  const inputKeys = new Set<string>();

  for (const row of input.rows) {
    const key = markInputKey(row);
    if (inputKeys.has(key)) throw new HttpError("A student can only appear once per marks request", 400);
    inputKeys.add(key);
    const rosterRow = rosterByKey.get(key);
    if (!rosterRow) throw new HttpError("One or more marks rows are outside the exam roster", 400);
    if (row.attendanceStatus === "present") {
      if (row.obtainedMarks === null) throw new HttpError("Obtained marks are required for present students", 400);
      if (row.obtainedMarks > examSubject.totalMarks) {
        throw new HttpError("Obtained marks cannot exceed subject total marks", 400);
      }
    }
  }

  await db.transaction(async (tx) => {
    for (const row of input.rows) {
      const rosterRow = rosterByKey.get(markInputKey(row));
      if (!rosterRow) throw new HttpError("One or more marks rows are outside the exam roster", 400);
      await tx
        .insert(examMarks)
        .values({
          id: randomUUID(),
          examId,
          examSubjectId: input.examSubjectId,
          studentId: rosterRow.studentId,
          enrollmentId: rosterRow.enrollmentId,
          institutionId: rosterRow.institutionId,
          programId: rosterRow.programId,
          schoolClassId: rosterRow.schoolClassId,
          schoolSectionId: rosterRow.schoolSectionId,
          madrassaCategoryId: rosterRow.madrassaCategoryId,
          madrassaSubcategoryId: rosterRow.madrassaSubcategoryId,
          attendanceStatus: row.attendanceStatus,
          obtainedMarks: row.attendanceStatus === "present" ? row.obtainedMarks : null,
          status: "draft",
          notes: row.notes?.trim() || null,
          enteredByUserId: actor.id,
        })
        .onConflictDoUpdate({
          target: [examMarks.examSubjectId, examMarks.studentId, examMarks.enrollmentId],
          set: {
            attendanceStatus: row.attendanceStatus,
            obtainedMarks: row.attendanceStatus === "present" ? row.obtainedMarks : null,
            status: "draft",
            notes: row.notes?.trim() || null,
            enteredByUserId: actor.id,
            updatedAt: new Date(),
          },
        });
    }

    await tx.update(examSessions).set({ status: "active", updatedAt: new Date() }).where(eq(examSessions.id, examId));
  });

  return getMarksEntry(request, examId, input.examSubjectId);
}

export async function lockExamSubject(request: Request, examId: string, examSubjectId: string) {
  const exam = await loadExamDetail(examId);
  await requireExamPermission(request, exam.system, "edit");
  if (exam.status === "published") throw new HttpError("Published exam subjects are already locked", 400);
  const subject = await loadExamSubject(examId, examSubjectId);
  const roster = await loadExamRoster(exam);
  const marks = await loadMarksForSubject(db, examSubjectId, roster.map((row) => row.enrollmentId));
  if (marks.length !== roster.length) {
    throw new HttpError(`Cannot lock ${subject.name}; marks are missing for one or more students`, 400);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(examSessionSubjects)
      .set({ locked: true, updatedAt: new Date() })
      .where(and(eq(examSessionSubjects.id, examSubjectId), eq(examSessionSubjects.examId, examId)));
    await tx.update(examMarks).set({ status: "locked", updatedAt: new Date() }).where(eq(examMarks.examSubjectId, examSubjectId));
    await tx.update(examSessions).set({ status: "locked", updatedAt: new Date() }).where(eq(examSessions.id, examId));
  });

  return getExamSession(request, examId);
}

export async function publishExamResults(request: Request, examId: string) {
  const exam = await loadExamDetail(examId);
  const actor = await requireExamPermission(request, exam.system, "edit");
  if (exam.status === "published") throw new HttpError("Exam has already been published", 400);
  const subjects = (await loadSessionSubjects([examId])).get(examId) ?? [];
  if (subjects.length === 0) throw new HttpError("Exam must have at least one subject", 400);
  if (subjects.some((subject) => !subject.locked)) throw new HttpError("All exam subjects must be locked before publishing", 400);

  const roster = await loadExamRoster(exam);
  const marks = await loadMarksForExam(db, examId, roster.map((row) => row.enrollmentId));
  const marksByEnrollment = new Map<string, ExamMarkRow[]>();
  for (const mark of marks) {
    const list = marksByEnrollment.get(mark.enrollmentId) ?? [];
    list.push(mark);
    marksByEnrollment.set(mark.enrollmentId, list);
  }

  for (const row of roster) {
    const rowMarks = marksByEnrollment.get(row.enrollmentId) ?? [];
    if (rowMarks.length !== subjects.length) {
      throw new HttpError("Cannot publish until marks exist for every subject and student", 400);
    }
  }

  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));
  const calculated = roster.map((row) => {
    const rowMarks = marksByEnrollment.get(row.enrollmentId) ?? [];
    return {
      roster: row,
      result: calculateExamResult({
        studentId: row.studentId,
        enrollmentId: row.enrollmentId,
        marks: rowMarks.map((mark) => {
          const subject = subjectsById.get(mark.examSubjectId);
          if (!subject) throw new HttpError("Exam marks reference an unknown subject", 500);
          return {
            code: subject.code,
            name: subject.name,
            nameUrdu: subject.nameUrdu,
            totalMarks: subject.totalMarks,
            passingMarks: subject.passingMarks,
            attendanceStatus: mark.attendanceStatus,
            obtainedMarks: mark.obtainedMarks,
          };
        }),
      }),
    };
  });
  const ranked = assignPositions(calculated.map((item) => item.result));
  const rankedByEnrollment = new Map(ranked.map((result) => [result.enrollmentId, result]));
  const publishedAt = new Date();

  await db.transaction(async (tx) => {
    for (const item of calculated) {
      const result = rankedByEnrollment.get(item.roster.enrollmentId) ?? item.result;
      await tx
        .insert(examResults)
        .values({
          id: randomUUID(),
          examId,
          studentId: item.roster.studentId,
          enrollmentId: item.roster.enrollmentId,
          institutionId: item.roster.institutionId,
          programId: item.roster.programId,
          schoolClassId: item.roster.schoolClassId,
          schoolSectionId: item.roster.schoolSectionId,
          madrassaCategoryId: item.roster.madrassaCategoryId,
          madrassaSubcategoryId: item.roster.madrassaSubcategoryId,
          obtainedMarks: result.obtainedMarks,
          totalMarks: result.totalMarks,
          percentageTimes100: result.percentageTimes100,
          grade: result.grade,
          status: result.status,
          position: result.position,
          failedSubjects: result.failedSubjects,
          metadata: {
            examName: exam.name,
            academicYear: exam.academicYear,
            groupLabel: groupLabelForRow(item.roster),
          },
          publishedAt,
        })
        .onConflictDoUpdate({
          target: [examResults.examId, examResults.studentId, examResults.enrollmentId],
          set: {
            obtainedMarks: result.obtainedMarks,
            totalMarks: result.totalMarks,
            percentageTimes100: result.percentageTimes100,
            grade: result.grade,
            status: result.status,
            position: result.position,
            failedSubjects: result.failedSubjects,
            metadata: {
              examName: exam.name,
              academicYear: exam.academicYear,
              groupLabel: groupLabelForRow(item.roster),
            },
            publishedAt,
            updatedAt: new Date(),
          },
        });

      await insertStudentEvent(tx, {
        studentId: item.roster.studentId,
        enrollmentId: item.roster.enrollmentId,
        type: "exam_result_published",
        message: `Exam result published: ${exam.name}`,
        metadata: {
          examId,
          examName: exam.name,
          academicYear: exam.academicYear,
          grade: result.grade,
          percentage: result.percentage,
          position: result.position,
          status: result.status,
          failedSubjects: result.failedSubjects,
        },
        actorUserId: actor.id,
      });

      if (result.status === "fail") {
        await insertStudentEvent(tx, {
          studentId: item.roster.studentId,
          enrollmentId: item.roster.enrollmentId,
          type: "exam_result_failed",
          message: `Exam result failed: ${exam.name}`,
          metadata: {
            examId,
            examName: exam.name,
            academicYear: exam.academicYear,
            failedSubjects: result.failedSubjects,
          },
          actorUserId: actor.id,
        });
      }
    }

    await tx
      .update(examSessions)
      .set({ status: "published", publishedAt, publishedByUserId: actor.id, updatedAt: new Date() })
      .where(eq(examSessions.id, examId));
  });

  return getExamSession(request, examId);
}

export async function getExamDmc(request: Request, examId: string, studentId: string) {
  const exam = await loadExamDetail(examId);
  const actor = await requireExamPermission(request, exam.system, "print");
  const [result] = await db
    .select()
    .from(examResults)
    .where(and(eq(examResults.examId, examId), eq(examResults.studentId, studentId)))
    .limit(1);
  if (!result) throw new HttpError("Published result not found", 404);

  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
    })
    .from(students)
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, result.enrollmentId))
    .where(eq(students.id, studentId))
    .limit(1);
  if (!student) throw new HttpError("Student not found", 404);

  const subjects = await loadDmcSubjects(examId, result.enrollmentId);
  if (!result.dmcGeneratedAt) {
    await db.transaction(async (tx) => {
      await tx
        .update(examResults)
        .set({ dmcGeneratedAt: new Date(), updatedAt: new Date() })
        .where(eq(examResults.id, result.id));
      await insertStudentEvent(tx, {
        studentId,
        enrollmentId: result.enrollmentId,
        type: "exam_dmc_generated",
        message: `DMC generated: ${exam.name}`,
        metadata: { examId, examName: exam.name, academicYear: exam.academicYear },
        actorUserId: actor.id,
      });
    });
  }

  return {
    exam: serializeExam(exam, (await loadSessionSubjects([examId])).get(examId) ?? [], 0),
    student: {
      ...student,
      groupLabel: groupLabelForResult(result, exam),
    },
    result: {
      obtainedMarks: result.obtainedMarks,
      totalMarks: result.totalMarks,
      percentage: result.percentageTimes100 / 100,
      grade: result.grade,
      status: result.status,
      position: result.position,
    },
    subjects,
  };
}

export async function getStudentAnnualTranscript(request: Request, studentId: string) {
  await requirePermission(request, "reports_results", "view");
  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      nameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  if (!student) throw new HttpError("Student not found", 404);

  const rows = await db
    .select({
      academicYear: examSessions.academicYear,
      classLabel: schoolClasses.name,
      madrassaCategoryName: madrassaCategories.name,
      madrassaSubcategoryName: madrassaSubcategories.name,
      examName: examSessions.name,
      examType: examSessions.type,
      obtainedMarks: examResults.obtainedMarks,
      totalMarks: examResults.totalMarks,
      percentageTimes100: examResults.percentageTimes100,
      grade: examResults.grade,
      status: examResults.status,
    })
    .from(examResults)
    .innerJoin(examSessions, eq(examSessions.id, examResults.examId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, examResults.schoolClassId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, examResults.madrassaSubcategoryId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, examResults.madrassaCategoryId))
    .where(eq(examResults.studentId, studentId))
    .orderBy(asc(examSessions.academicYear), asc(examSessions.startDate));

  return {
    student,
    years: buildTranscript(
      rows.map((row) => ({
        academicYear: row.academicYear,
        classLabel: row.classLabel ?? `${row.madrassaCategoryName ?? "Madrassa"} · ${row.madrassaSubcategoryName ?? "Darja"}`,
        examName: row.examName,
        examType: row.examType,
        obtainedMarks: row.obtainedMarks,
        totalMarks: row.totalMarks,
        percentageTimes100: row.percentageTimes100,
        grade: row.grade,
        status: row.status,
      })),
    ),
  };
}

export async function getExamReport(request: Request, query: z.infer<typeof examReportQuerySchema>) {
  await requirePermission(request, "reports_results", "view");
  const dateFrom = query.dateFrom ? parseDateOnly(query.dateFrom, "dateFrom") : undefined;
  const dateTo = query.dateTo ? parseDateOnly(query.dateTo, "dateTo") : undefined;
  const clauses = compactSql([
    reportSystemCondition(query.system),
    query.examId ? eq(examResults.examId, query.examId) : undefined,
    query.academicYear ? eq(examSessions.academicYear, query.academicYear) : undefined,
    query.institutionId ? eq(examResults.institutionId, query.institutionId) : undefined,
    query.programId ? eq(examResults.programId, query.programId) : undefined,
    dateFrom ? gte(examSessions.startDate, dateFrom) : undefined,
    dateTo ? lte(examSessions.endDate, dateTo) : undefined,
  ]);

  const rows = await db
    .select({
      examId: examSessions.id,
      examName: examSessions.name,
      examNameUrdu: examSessions.nameUrdu,
      system: examSessions.system,
      academicYear: examSessions.academicYear,
      studentId: students.id,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
      obtainedMarks: examResults.obtainedMarks,
      totalMarks: examResults.totalMarks,
      percentageTimes100: examResults.percentageTimes100,
      grade: examResults.grade,
      status: examResults.status,
      position: examResults.position,
      failedSubjects: examResults.failedSubjects,
      schoolClassName: schoolClasses.name,
      schoolSectionName: schoolClassSections.name,
      madrassaCategoryName: madrassaCategories.name,
      madrassaSubcategoryName: madrassaSubcategories.name,
    })
    .from(examResults)
    .innerJoin(examSessions, eq(examSessions.id, examResults.examId))
    .innerJoin(students, eq(students.id, examResults.studentId))
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, examResults.enrollmentId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, examResults.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, examResults.schoolSectionId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, examResults.madrassaCategoryId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, examResults.madrassaSubcategoryId))
    .where(and(...clauses))
    .orderBy(asc(examSessions.academicYear), asc(examResults.position), asc(studentEnrollments.rollNo));

  const total = rows.length;
  const pass = rows.filter((row) => row.status === "pass").length;
  const gradeDistribution = Array.from(
    rows.reduce((map, row) => map.set(row.grade, (map.get(row.grade) ?? 0) + 1), new Map<string, number>()),
  ).map(([grade, count]) => ({ grade, count }));

  return {
    rows: rows.map((row) => ({
      ...row,
      percentage: row.percentageTimes100 / 100,
      groupLabel: groupLabelForReportRow(row),
    })),
    summary: {
      total,
      pass,
      fail: total - pass,
      passRate: total ? Math.round((pass / total) * 100) : 0,
      averagePercentage: total ? Math.round(rows.reduce((sum, row) => sum + row.percentageTimes100, 0) / total / 100) : 0,
    },
    gradeDistribution,
    positions: rows.filter((row) => row.position !== null).slice(0, 10),
    failList: rows.filter((row) => row.status === "fail"),
  };
}

export async function listExamHalls(request: Request, query: z.infer<typeof hallListQuerySchema>) {
  await requireExamPermission(request, query.system, "view");
  const clauses = compactSql([
    eq(examHalls.system, query.system),
    query.active ? eq(examHalls.active, query.active === "true") : undefined,
  ]);
  const halls = await db.select().from(examHalls).where(and(...clauses)).orderBy(asc(examHalls.name));
  return { halls: halls.map(serializeHall) };
}

export async function createExamHall(request: Request, input: z.infer<typeof hallInputSchema>) {
  await requireExamPermission(request, input.system, "create");
  const [created] = await db
    .insert(examHalls)
    .values({
      id: randomUUID(),
      system: input.system,
      name: input.name,
      nameUrdu: input.nameUrdu ?? null,
      rows: input.rows,
      cols: input.cols,
      aisleEveryRow: input.aisleEveryRow,
      aisleEveryCol: input.aisleEveryCol,
      active: input.active ?? true,
    })
    .returning();
  return { hall: serializeHall(created) };
}

export async function updateExamHall(request: Request, hallId: string, input: z.infer<typeof hallUpdateSchema>) {
  const [current] = await db.select().from(examHalls).where(eq(examHalls.id, hallId)).limit(1);
  if (!current) throw new HttpError("Exam hall not found", 404);
  await requireExamPermission(request, input.system ?? current.system, "edit");
  const [updated] = await db
    .update(examHalls)
    .set({ ...input, nameUrdu: input.nameUrdu ?? undefined, updatedAt: new Date() })
    .where(eq(examHalls.id, hallId))
    .returning();
  return { hall: serializeHall(updated) };
}

export async function generateExamSeatingPlan(
  request: Request,
  examId: string,
  input: z.infer<typeof seatingGenerateSchema>,
) {
  const exam = await loadExamDetail(examId);
  const actor = await requireExamPermission(request, exam.system, "edit");
  if (exam.status === "published") throw new HttpError("Cannot regenerate seating for a published exam", 400);
  const roster = await loadExamRoster(exam);
  if (roster.length === 0) throw new HttpError("Exam roster is empty", 400);
  const halls = await db
    .select()
    .from(examHalls)
    .where(and(eq(examHalls.system, exam.system), eq(examHalls.active, true)))
    .orderBy(asc(examHalls.name));
  if (halls.length === 0) throw new HttpError("Create at least one active exam hall first", 400);
  const totalCapacity = halls.reduce((sum, hall) => sum + hall.rows * hall.cols, 0);
  if (roster.length > totalCapacity && !input.allowUnseated) {
    throw new HttpError("Active halls do not have enough capacity for this roster", 400);
  }

  const placementIds = new Map<string, number>();
  const seatingStudents = roster.map((row) => {
    const key = placementKey(row);
    const gradeId = placementIds.get(key) ?? placementIds.size + 1;
    placementIds.set(key, gradeId);
    return {
      id: row.studentId,
      name: row.name,
      rollNo: row.rollNo,
      gradeId,
      gradeLabel: groupLabelForRow(row),
    } satisfies SeatingStudent;
  });
  const rosterByStudentId = new Map(roster.map((row) => [row.studentId, row]));
  const seed = input.seed || `${examId}:${Date.now()}`;
  const [versionRow] = await db
    .select({ version: max(examSeatingPlans.version) })
    .from(examSeatingPlans)
    .where(eq(examSeatingPlans.examId, examId));
  const version = Number(versionRow?.version ?? 0) + 1;
  const planId = randomUUID();
  const unseated = seatingStudents.slice(totalCapacity);
  const seated = seatingStudents.slice(0, totalCapacity);

  await db.transaction(async (tx) => {
    await tx.insert(examSeatingPlans).values({
      id: planId,
      examId,
      version,
      gap: input.gap,
      seed,
      status: "draft",
      unseatedStudents: unseated.map((student) => {
        const rosterRow = rosterByStudentId.get(student.id);
        return {
          studentId: student.id,
          enrollmentId: rosterRow?.enrollmentId ?? "",
          rollNo: student.rollNo,
        };
      }),
      violationCount: 0,
      generatedByUserId: actor.id,
    });

    let cursor = 0;
    let violationCount = 0;
    for (const hall of halls) {
      const capacity = hall.rows * hall.cols;
      const hallStudents = seated.slice(cursor, cursor + capacity);
      cursor += capacity;
      const layout = buildHallSeating(
        hall.id,
        hall.name,
        hall.rows,
        hall.cols,
        hallStudents,
        input.gap,
        `${seed}:${hall.id}`,
      );
      violationCount += countViolations(layout.grid, layout.rows, layout.cols, input.gap);

      for (let rowIndex = 0; rowIndex < layout.rows; rowIndex += 1) {
        for (let colIndex = 0; colIndex < layout.cols; colIndex += 1) {
          const student = layout.grid[rowIndex]?.[colIndex];
          if (!student) continue;
          const rosterRow = rosterByStudentId.get(student.id);
          if (!rosterRow) continue;
          await tx.insert(examSeatAssignments).values({
            id: randomUUID(),
            seatingPlanId: planId,
            examId,
            hallId: hall.id,
            studentId: rosterRow.studentId,
            enrollmentId: rosterRow.enrollmentId,
            rowNo: rowIndex + 1,
            colNo: colIndex + 1,
            seatLabel: `${hall.name}-${rowIndex + 1}-${colIndex + 1}`,
            placementLabel: groupLabelForRow(rosterRow),
          });
        }
      }
    }

    await tx.update(examSeatingPlans).set({ violationCount }).where(eq(examSeatingPlans.id, planId));
  });

  return getExamSeatingPlan(request, examId);
}

export async function getExamSeatingPlan(request: Request, examId: string) {
  const exam = await loadExamDetail(examId);
  await requireExamPermission(request, exam.system, "view");
  const [plan] = await db
    .select()
    .from(examSeatingPlans)
    .where(eq(examSeatingPlans.examId, examId))
    .orderBy(desc(examSeatingPlans.version))
    .limit(1);
  if (!plan) return { exam: serializeExam(exam, (await loadSessionSubjects([examId])).get(examId) ?? [], 0), plan: null };

  const assignments = await db
    .select({
      id: examSeatAssignments.id,
      seatingPlanId: examSeatAssignments.seatingPlanId,
      examId: examSeatAssignments.examId,
      hallId: examSeatAssignments.hallId,
      studentId: examSeatAssignments.studentId,
      enrollmentId: examSeatAssignments.enrollmentId,
      rowNo: examSeatAssignments.rowNo,
      colNo: examSeatAssignments.colNo,
      seatLabel: examSeatAssignments.seatLabel,
      placementLabel: examSeatAssignments.placementLabel,
      createdAt: examSeatAssignments.createdAt,
      hallName: examHalls.name,
      hallRows: examHalls.rows,
      hallCols: examHalls.cols,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      rollNo: studentEnrollments.rollNo,
      admissionNo: studentEnrollments.admissionNo,
    })
    .from(examSeatAssignments)
    .innerJoin(examHalls, eq(examHalls.id, examSeatAssignments.hallId))
    .innerJoin(students, eq(students.id, examSeatAssignments.studentId))
    .innerJoin(studentEnrollments, eq(studentEnrollments.id, examSeatAssignments.enrollmentId))
    .where(eq(examSeatAssignments.seatingPlanId, plan.id))
    .orderBy(asc(examHalls.name), asc(examSeatAssignments.rowNo), asc(examSeatAssignments.colNo));

  return {
    exam: serializeExam(exam, (await loadSessionSubjects([examId])).get(examId) ?? [], assignments.length),
    plan: serializeSeatingPlan(plan, assignments),
  };
}

export async function lockExamSeatingPlan(request: Request, examId: string, planId: string) {
  const exam = await loadExamDetail(examId);
  const actor = await requireExamPermission(request, exam.system, "edit");
  const [updated] = await db
    .update(examSeatingPlans)
    .set({ status: "locked", lockedAt: new Date(), lockedByUserId: actor.id })
    .where(and(eq(examSeatingPlans.id, planId), eq(examSeatingPlans.examId, examId)))
    .returning();
  if (!updated) throw new HttpError("Seating plan not found", 404);
  return getExamSeatingPlan(request, examId);
}

function serializeSubject(row: ExamSubjectRow) {
  return {
    id: row.id,
    system: row.system,
    schoolClassId: row.schoolClassId,
    madrassaSubcategoryId: row.madrassaSubcategoryId,
    code: row.code,
    name: row.name,
    nameUrdu: row.nameUrdu,
    group: row.group,
    totalMarks: row.totalMarks,
    passingMarks: row.passingMarks,
    displayOrder: row.displayOrder,
    active: row.active,
  };
}

function serializeSessionSubject(row: ExamSessionSubjectRow) {
  return {
    id: row.id,
    subjectId: row.subjectId,
    code: row.code,
    name: row.name,
    nameUrdu: row.nameUrdu,
    totalMarks: row.totalMarks,
    passingMarks: row.passingMarks,
    examDate: row.examDate,
    startTime: row.startTime,
    endTime: row.endTime,
    displayOrder: row.displayOrder,
    locked: row.locked,
  };
}

function serializeExam(row: ExamDetailRow, subjects: ExamSessionSubjectRow[], studentCount: number) {
  return {
    id: row.id,
    system: row.system,
    institutionId: row.institutionId,
    institutionName: row.institutionName,
    institutionNameUrdu: row.institutionNameUrdu,
    programId: row.programId,
    programName: row.programName,
    programNameUrdu: row.programNameUrdu,
    schoolClassId: row.schoolClassId,
    schoolSectionId: row.schoolSectionId,
    madrassaCategoryId: row.madrassaCategoryId,
    madrassaSubcategoryId: row.madrassaSubcategoryId,
    academicYear: row.academicYear,
    type: row.type,
    name: row.name,
    nameUrdu: row.nameUrdu,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    groupLabel: groupLabelForExam(row),
    subjects: subjects.map(serializeSessionSubject),
    studentCount,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

function serializeMarksRosterStudent(row: RosterStudent, mark: ExamMarkRow | undefined) {
  return {
    id: row.studentId,
    enrollmentId: row.enrollmentId,
    rollNo: row.rollNo,
    admissionNo: row.admissionNo,
    name: row.name,
    nameUrdu: row.nameUrdu,
    fatherName: row.fatherName,
    groupLabel: groupLabelForRow(row),
    mark: mark
      ? {
          attendanceStatus: mark.attendanceStatus,
          obtainedMarks: mark.obtainedMarks,
          notes: mark.notes,
          status: mark.status,
        }
      : null,
  };
}

function serializeHall(row: ExamHallRow) {
  return {
    id: row.id,
    system: row.system,
    name: row.name,
    nameUrdu: row.nameUrdu,
    rows: row.rows,
    cols: row.cols,
    capacity: row.rows * row.cols,
    aisleEveryRow: row.aisleEveryRow,
    aisleEveryCol: row.aisleEveryCol,
    active: row.active,
  };
}

function serializeSeatingPlan(
  plan: ExamSeatingPlanRow,
  assignments: Array<ExamSeatAssignmentRow & {
    hallName: string;
    hallRows: number;
    hallCols: number;
    studentName: string;
    studentNameUrdu: string;
    rollNo: string;
    admissionNo: string;
  }>,
) {
  const halls = new Map<string, {
    id: string;
    name: string;
    rows: number;
    cols: number;
    assignments: Array<{
      id: string;
      studentId: string;
      enrollmentId: string;
      rowNo: number;
      colNo: number;
      seatLabel: string;
      placementLabel: string;
      studentName: string;
      studentNameUrdu: string;
      rollNo: string;
      admissionNo: string;
    }>;
  }>();

  for (const assignment of assignments) {
    const hall = halls.get(assignment.hallId) ?? {
      id: assignment.hallId,
      name: assignment.hallName,
      rows: assignment.hallRows,
      cols: assignment.hallCols,
      assignments: [],
    };
    hall.assignments.push({
      id: assignment.id,
      studentId: assignment.studentId,
      enrollmentId: assignment.enrollmentId,
      rowNo: assignment.rowNo,
      colNo: assignment.colNo,
      seatLabel: assignment.seatLabel,
      placementLabel: assignment.placementLabel,
      studentName: assignment.studentName,
      studentNameUrdu: assignment.studentNameUrdu,
      rollNo: assignment.rollNo,
      admissionNo: assignment.admissionNo,
    });
    halls.set(assignment.hallId, hall);
  }

  return {
    id: plan.id,
    examId: plan.examId,
    version: plan.version,
    gap: plan.gap,
    seed: plan.seed,
    status: plan.status,
    violationCount: plan.violationCount,
    unseatedStudents: plan.unseatedStudents,
    generatedAt: plan.generatedAt.toISOString(),
    lockedAt: plan.lockedAt?.toISOString() ?? null,
    halls: Array.from(halls.values()),
  };
}

async function loadExamDetail(id: string): Promise<ExamDetailRow> {
  const rows = await fetchExamDetails([eq(examSessions.id, id)]);
  const exam = rows[0];
  if (!exam) throw new HttpError("Exam not found", 404);
  return exam;
}

async function fetchExamDetails(clauses: SQL[]): Promise<ExamDetailRow[]> {
  return db
    .select({
      id: examSessions.id,
      system: examSessions.system,
      institutionId: examSessions.institutionId,
      programId: examSessions.programId,
      schoolClassId: examSessions.schoolClassId,
      schoolSectionId: examSessions.schoolSectionId,
      madrassaCategoryId: examSessions.madrassaCategoryId,
      madrassaSubcategoryId: examSessions.madrassaSubcategoryId,
      academicYear: examSessions.academicYear,
      type: examSessions.type,
      name: examSessions.name,
      nameUrdu: examSessions.nameUrdu,
      startDate: examSessions.startDate,
      endDate: examSessions.endDate,
      status: examSessions.status,
      metadata: examSessions.metadata,
      createdByUserId: examSessions.createdByUserId,
      publishedAt: examSessions.publishedAt,
      publishedByUserId: examSessions.publishedByUserId,
      createdAt: examSessions.createdAt,
      updatedAt: examSessions.updatedAt,
      institutionName: institutions.name,
      institutionNameUrdu: institutions.nameUrdu,
      programName: programs.name,
      programNameUrdu: programs.nameUrdu,
      schoolClassName: schoolClasses.name,
      schoolClassNameUrdu: schoolClasses.nameUrdu,
      schoolSectionName: schoolClassSections.name,
      madrassaCategoryName: madrassaCategories.name,
      madrassaCategoryNameUrdu: madrassaCategories.nameUrdu,
      madrassaSubcategoryName: madrassaSubcategories.name,
      madrassaSubcategoryNameUrdu: madrassaSubcategories.nameUrdu,
    })
    .from(examSessions)
    .innerJoin(institutions, eq(institutions.id, examSessions.institutionId))
    .innerJoin(programs, eq(programs.id, examSessions.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, examSessions.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, examSessions.schoolSectionId))
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, examSessions.madrassaCategoryId))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, examSessions.madrassaSubcategoryId))
    .where(and(...clauses))
    .orderBy(desc(examSessions.startDate), asc(examSessions.name));
}

async function loadSessionSubjects(examIds: string[]) {
  const map = new Map<string, ExamSessionSubjectRow[]>();
  if (examIds.length === 0) return map;
  const rows = await db
    .select()
    .from(examSessionSubjects)
    .where(inArray(examSessionSubjects.examId, examIds))
    .orderBy(asc(examSessionSubjects.displayOrder), asc(examSessionSubjects.name));

  for (const row of rows) {
    const list = map.get(row.examId) ?? [];
    list.push(row);
    map.set(row.examId, list);
  }
  return map;
}

async function loadExamSubject(examId: string, examSubjectId: string) {
  const [subject] = await db
    .select()
    .from(examSessionSubjects)
    .where(and(eq(examSessionSubjects.examId, examId), eq(examSessionSubjects.id, examSubjectId)))
    .limit(1);
  if (!subject) throw new HttpError("Exam subject not found", 404);
  return subject;
}

async function loadSubjectsForExam(system: ExamSystem, subjectIds: string[]) {
  const ids = uniqueStrings(subjectIds);
  if (ids.length === 0) return [];
  const subjects = await db
    .select()
    .from(examSubjects)
    .where(and(inArray(examSubjects.id, ids), eq(examSubjects.system, system), eq(examSubjects.active, true)));
  if (subjects.length !== ids.length) throw new HttpError("One or more subjects were not found or inactive", 400);
  return subjects;
}

async function replaceExamSubjects(tx: ExamTx, examId: string, subjects: ExamSubjectRow[]) {
  await tx.delete(examSessionSubjects).where(eq(examSessionSubjects.examId, examId));
  if (subjects.length === 0) return;
  await tx.insert(examSessionSubjects).values(
    subjects.map((subject) => ({
      id: randomUUID(),
      examId,
      subjectId: subject.id,
      code: subject.code,
      name: subject.name,
      nameUrdu: subject.nameUrdu,
      totalMarks: subject.totalMarks,
      passingMarks: subject.passingMarks,
      displayOrder: subject.displayOrder,
      locked: false,
    })),
  );
}

async function loadExamRoster(exam: Pick<ExamSessionRow, "system" | "institutionId" | "programId" | "schoolClassId" | "schoolSectionId" | "madrassaSubcategoryId">): Promise<RosterStudent[]> {
  const clauses = compactSql([
    eq(students.status, "active"),
    eq(studentEnrollments.status, "active"),
    isNull(studentEnrollments.endedAt),
    eq(studentEnrollments.institutionId, exam.institutionId),
    eq(studentEnrollments.programId, exam.programId),
    exam.system === "school" && exam.schoolClassId ? eq(studentEnrollments.schoolClassId, exam.schoolClassId) : undefined,
    exam.system === "school" && exam.schoolSectionId
      ? eq(studentEnrollments.schoolSectionId, exam.schoolSectionId)
      : undefined,
    exam.system === "madrassa" && exam.madrassaSubcategoryId
      ? eq(studentEnrollments.madrassaSubcategoryId, exam.madrassaSubcategoryId)
      : undefined,
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

async function loadMarksForSubject(executor: ExamExecutor, examSubjectId: string, enrollmentIds: string[]) {
  if (enrollmentIds.length === 0) return [];
  return executor
    .select()
    .from(examMarks)
    .where(and(eq(examMarks.examSubjectId, examSubjectId), inArray(examMarks.enrollmentId, uniqueStrings(enrollmentIds))));
}

async function loadMarksForExam(executor: ExamExecutor, examId: string, enrollmentIds: string[]) {
  if (enrollmentIds.length === 0) return [];
  return executor
    .select()
    .from(examMarks)
    .where(and(eq(examMarks.examId, examId), inArray(examMarks.enrollmentId, uniqueStrings(enrollmentIds))));
}

async function loadDmcSubjects(examId: string, enrollmentId: string) {
  const rows = await db
    .select({
      code: examSessionSubjects.code,
      name: examSessionSubjects.name,
      nameUrdu: examSessionSubjects.nameUrdu,
      totalMarks: examSessionSubjects.totalMarks,
      passingMarks: examSessionSubjects.passingMarks,
      obtainedMarks: examMarks.obtainedMarks,
      attendanceStatus: examMarks.attendanceStatus,
    })
    .from(examSessionSubjects)
    .leftJoin(
      examMarks,
      and(
        eq(examMarks.examSubjectId, examSessionSubjects.id),
        eq(examMarks.examId, examId),
        eq(examMarks.enrollmentId, enrollmentId),
      ),
    )
    .where(eq(examSessionSubjects.examId, examId))
    .orderBy(asc(examSessionSubjects.displayOrder), asc(examSessionSubjects.name));

  return rows.map((row) => ({
    ...row,
    attendanceStatus: row.attendanceStatus ?? "absent",
  }));
}

async function assertProgramScope(system: ExamSystem, institutionId: string, programId: string) {
  const [row] = await db
    .select({ programId: programs.id, system: programs.system, institutionId: programs.institutionId })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.institutionId, institutionId)))
    .limit(1);
  if (!row) throw new HttpError("Program does not belong to the selected institution", 400);
  if (row.system !== system) throw new HttpError("Program system does not match exam system", 400);
}

function assertSubjectScope(system: ExamSystem, schoolClassId?: string, madrassaSubcategoryId?: string) {
  if (system === "school" && !schoolClassId) throw new HttpError("School subjects require a class", 400);
  if (system === "madrassa" && !madrassaSubcategoryId) {
    throw new HttpError("Madrassa subjects require a category/darja", 400);
  }
}

function assertPassingMarks(totalMarks: number, passingMarks: number) {
  if (passingMarks > totalMarks) throw new HttpError("Passing marks cannot exceed total marks", 400);
}

function validateExamScope(
  system: ExamSystem,
  input: {
    schoolClassId?: string | null;
    schoolSectionId?: string | null;
    madrassaCategoryId?: string | null;
    madrassaSubcategoryId?: string | null;
  },
) {
  if (system === "school") {
    if (!input.schoolClassId) throw new HttpError("School exams require a class", 400);
    if (!input.schoolSectionId) throw new HttpError("School exams require a section", 400);
    return;
  }

  if (!input.madrassaCategoryId || !input.madrassaSubcategoryId) {
    throw new HttpError("Madrassa exams require category and subcategory", 400);
  }
}

function assertSubjectsMatchExamScope(
  exam: { system: ExamSystem; schoolClassId?: string | null; madrassaSubcategoryId?: string | null },
  subjects: ExamSubjectRow[],
) {
  for (const subject of subjects) {
    if (subject.system !== exam.system) throw new HttpError("Subject system does not match exam system", 400);
    if (exam.system === "school" && subject.schoolClassId !== exam.schoolClassId) {
      throw new HttpError("School subject class does not match exam class", 400);
    }
    if (exam.system === "madrassa" && subject.madrassaSubcategoryId !== exam.madrassaSubcategoryId) {
      throw new HttpError("Madrassa subject darja does not match exam darja", 400);
    }
  }
}

function reportSystemCondition(system: ExamReportSystem) {
  if (system === "school") return eq(examSessions.system, "school");
  if (system === "madrassa") return eq(examSessions.system, "madrassa");
  return or(eq(examSessions.system, "school"), eq(examSessions.system, "madrassa"));
}

function groupLabelForExam(row: {
  schoolClassName: string | null;
  schoolSectionName: string | null;
  madrassaCategoryName: string | null;
  madrassaSubcategoryName: string | null;
}) {
  if (row.schoolClassName) return `${row.schoolClassName} · ${row.schoolSectionName ?? "No section"}`;
  return `${row.madrassaCategoryName ?? "Madrassa"} · ${row.madrassaSubcategoryName ?? "Darja"}`;
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

function groupLabelForResult(result: ExamResultRow, exam: ExamDetailRow) {
  if (result.schoolClassId) return groupLabelForExam(exam);
  return groupLabelForExam(exam);
}

function groupLabelForReportRow(row: {
  schoolClassName: string | null;
  schoolSectionName: string | null;
  madrassaCategoryName: string | null;
  madrassaSubcategoryName: string | null;
}) {
  if (row.schoolClassName) return `${row.schoolClassName} · ${row.schoolSectionName ?? "No section"}`;
  return `${row.madrassaCategoryName ?? "Madrassa"} · ${row.madrassaSubcategoryName ?? "Darja"}`;
}

function placementKey(row: RosterStudent) {
  return row.schoolClassId ?? row.madrassaSubcategoryId ?? row.programId;
}

function rosterKey(row: Pick<RosterStudent, "studentId" | "enrollmentId">) {
  return `${row.studentId}:${row.enrollmentId}`;
}

function markInputKey(row: { studentId: string; enrollmentId: string }) {
  return `${row.studentId}:${row.enrollmentId}`;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
