import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
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
  academicYears,
  promotionRules,
  promotionRunItems,
  promotionRuns,
} from "@/db/schema/academic-years";
import type {
  PromotionItemStatus,
  PromotionOutcome,
  PromotionSystem,
} from "@/db/schema/academic-years";
import { studentEnrollments, students } from "@/db/schema/students";
import { nextScopedNumber } from "@/lib/server/admission/numbering";
import { requireEditableAcademicYearId } from "@/lib/server/academic-years/service";
import { requirePermission } from "@/lib/server/authz";
import {
  createOpeningBalanceCharge,
  getOutstandingBalanceByStudentIds,
} from "@/lib/server/finance/service";
import { HttpError } from "@/lib/server/http";
import {
  evaluatePromotionCandidate,
  studentEventTypeForPromotionOutcome,
} from "@/lib/server/promotions/domain";
import { insertStudentEvent } from "@/lib/server/students/events";

const promotionSystems = ["school", "madrassa"] as const;
const promotionOutcomes = ["promote", "repeat", "graduate", "dropout", "inactive"] as const;

type PromotionTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type SourceEnrollmentRow = {
  studentId: string;
  studentName: string;
  studentNameUrdu: string;
  fatherName: string;
  gender: string;
  enrollmentId: string;
  admissionNo: string;
  rollNo: string;
  institutionId: string;
  institutionName: string;
  programId: string;
  programName: string;
  programSystem: string;
  schoolClassId: string | null;
  schoolClassName: string | null;
  schoolSectionId: string | null;
  schoolSectionName: string | null;
  madrassaCategoryId: string | null;
  madrassaCategoryName: string | null;
  madrassaSubcategoryId: string | null;
  madrassaSubcategoryName: string | null;
  darja: string | null;
};

type PromotionItemMetadata = {
  student: {
    name: string;
    nameUrdu: string;
    fatherName: string;
    gender: string;
  };
  source: {
    admissionNo: string;
    rollNo: string;
    institutionId: string;
    institutionName: string;
    programId: string;
    programName: string;
    schoolClassId: string | null;
    schoolClassName: string | null;
    schoolSectionId: string | null;
    schoolSectionName: string | null;
    madrassaCategoryId: string | null;
    madrassaCategoryName: string | null;
    madrassaSubcategoryId: string | null;
    madrassaSubcategoryName: string | null;
    darja: string | null;
  };
  target: {
    schoolClassId: string | null;
    schoolSectionId: string | null;
    madrassaCategoryId: string | null;
    madrassaSubcategoryId: string | null;
    darja: string | null;
  };
  ruleId: string | null;
};

export const promotionRulesQuerySchema = z.object({
  system: z.enum(promotionSystems).optional(),
  institutionId: z.string().trim().optional(),
  programId: z.string().trim().optional(),
});

export const promotionRuleInputSchema = z.object({
  system: z.enum(promotionSystems),
  institutionId: z.string().trim().nullable().optional(),
  programId: z.string().trim().nullable().optional(),
  sourceSchoolClassId: z.string().trim().nullable().optional(),
  sourceSchoolSectionId: z.string().trim().nullable().optional(),
  sourceMadrassaCategoryId: z.string().trim().nullable().optional(),
  sourceMadrassaSubcategoryId: z.string().trim().nullable().optional(),
  sourceDarja: z.string().trim().nullable().optional(),
  targetSchoolClassId: z.string().trim().nullable().optional(),
  targetSchoolSectionId: z.string().trim().nullable().optional(),
  targetMadrassaCategoryId: z.string().trim().nullable().optional(),
  targetMadrassaSubcategoryId: z.string().trim().nullable().optional(),
  targetDarja: z.string().trim().nullable().optional(),
  outcome: z.enum(promotionOutcomes).default("promote"),
  active: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const promotionPreviewSchema = z.object({
  sourceAcademicYearId: z.string().trim().min(1),
  targetAcademicYearId: z.string().trim().min(1),
  system: z.enum(promotionSystems),
  institutionId: z.string().trim().min(1),
  programId: z.string().trim().min(1),
  schoolClassId: z.string().trim().nullable().optional(),
  schoolSectionId: z.string().trim().nullable().optional(),
  madrassaCategoryId: z.string().trim().nullable().optional(),
  madrassaSubcategoryId: z.string().trim().nullable().optional(),
  carryForwardFees: z.boolean().default(true),
  includeTeacherRollover: z.boolean().default(false),
});

export async function listPromotionRules(
  request: Request,
  query: z.infer<typeof promotionRulesQuerySchema>,
) {
  await requirePermission(request, "settings_academic_year", "view");

  const clauses = compactSql([
    query.system ? eq(promotionRules.system, query.system) : undefined,
    query.institutionId ? eq(promotionRules.institutionId, query.institutionId) : undefined,
    query.programId ? eq(promotionRules.programId, query.programId) : undefined,
  ]);

  const rules =
    clauses.length > 0
      ? await db
          .select()
          .from(promotionRules)
          .where(and(...clauses))
          .orderBy(asc(promotionRules.displayOrder), asc(promotionRules.createdAt))
      : await db
          .select()
          .from(promotionRules)
          .orderBy(asc(promotionRules.displayOrder), asc(promotionRules.createdAt));

  return { rules };
}

export async function createPromotionRule(
  request: Request,
  input: z.infer<typeof promotionRuleInputSchema>,
) {
  await requirePermission(request, "settings_academic_year", "manage");
  validatePromotionRuleInput(input);

  const [rule] = await db
    .insert(promotionRules)
    .values({
      id: randomUUID(),
      system: input.system,
      institutionId: input.institutionId ?? null,
      programId: input.programId ?? null,
      sourceSchoolClassId: input.sourceSchoolClassId ?? null,
      sourceSchoolSectionId: input.sourceSchoolSectionId ?? null,
      sourceMadrassaCategoryId: input.sourceMadrassaCategoryId ?? null,
      sourceMadrassaSubcategoryId: input.sourceMadrassaSubcategoryId ?? null,
      sourceDarja: input.sourceDarja ?? null,
      targetSchoolClassId: input.targetSchoolClassId ?? null,
      targetSchoolSectionId: input.targetSchoolSectionId ?? null,
      targetMadrassaCategoryId: input.targetMadrassaCategoryId ?? null,
      targetMadrassaSubcategoryId: input.targetMadrassaSubcategoryId ?? null,
      targetDarja: input.targetDarja ?? null,
      outcome: input.outcome,
      active: input.active,
      displayOrder: input.displayOrder,
    })
    .returning();

  return { rule };
}

export async function createPromotionPreview(
  request: Request,
  input: z.infer<typeof promotionPreviewSchema>,
) {
  const actor = await requirePermission(request, "settings_academic_year", "manage");
  if (input.sourceAcademicYearId === input.targetAcademicYearId) {
    throw new HttpError("Source and target academic years must be different", 400);
  }

  const [sourceYear, targetYear] = await Promise.all([
    getAcademicYearOrThrow(input.sourceAcademicYearId),
    requireEditableAcademicYearId(input.targetAcademicYearId),
  ]);
  if (sourceYear.status === "archived") {
    throw new HttpError("Archived academic years cannot be used as promotion source", 409);
  }

  const [scope] = await db
    .select({
      institutionId: institutions.id,
      institutionSystem: institutions.system,
      programId: programs.id,
      programSystem: programs.system,
    })
    .from(institutions)
    .innerJoin(programs, eq(programs.institutionId, institutions.id))
    .where(and(eq(institutions.id, input.institutionId), eq(programs.id, input.programId)))
    .limit(1);

  if (!scope) throw new HttpError("Promotion institution/program scope was not found", 404);
  assertProgramMatchesSystem(input.system, scope.programSystem);

  const sourceEnrollments = await loadSourceEnrollments(input);
  const rules = await loadPromotionRules(input);
  const balances = input.carryForwardFees
    ? await getOutstandingBalanceByStudentIds(
        db,
        sourceEnrollments.map((row) => row.studentId),
      )
    : new Map<string, number>();

  const previewItems = sourceEnrollments.map((row) => {
    const evaluation = evaluatePromotionCandidate({
      system: input.system,
      enrollment: {
        schoolClassId: row.schoolClassId,
        schoolSectionId: row.schoolSectionId,
        madrassaCategoryId: row.madrassaCategoryId,
        madrassaSubcategoryId: row.madrassaSubcategoryId,
        darja: row.darja,
      },
      rules,
    });
    const carryForwardAmountPaisa = Math.max(0, balances.get(row.studentId) ?? 0);
    const warnings = [...evaluation.warnings];
    if (carryForwardAmountPaisa > 0) {
      warnings.push("Outstanding fee balance will be carried forward");
    }
    const status: PromotionItemStatus =
      evaluation.status === "blocked" ? "blocked" : warnings.length > 0 ? "warning" : "ready";

    return {
      id: randomUUID(),
      studentId: row.studentId,
      sourceEnrollmentId: row.enrollmentId,
      outcome: evaluation.outcome,
      status,
      warnings,
      blockers: evaluation.blockers,
      carryForwardAmountPaisa,
      metadata: buildPreviewMetadata(row, evaluation.target, evaluation.ruleId),
    };
  });
  const summary = summarizePreviewItems(previewItems);

  return db.transaction(async (tx) => {
    const [run] = await tx
      .insert(promotionRuns)
      .values({
        id: randomUUID(),
        sourceAcademicYearId: sourceYear.id,
        targetAcademicYearId: targetYear.id,
        system: input.system,
        institutionId: input.institutionId,
        programId: input.programId,
        status: "previewed",
        carryForwardFees: input.carryForwardFees,
        includeTeacherRollover: input.includeTeacherRollover,
        summary,
        metadata: {
          filters: {
            schoolClassId: input.schoolClassId ?? null,
            schoolSectionId: input.schoolSectionId ?? null,
            madrassaCategoryId: input.madrassaCategoryId ?? null,
            madrassaSubcategoryId: input.madrassaSubcategoryId ?? null,
          },
        },
        createdByUserId: actor.id,
      })
      .returning();

    if (previewItems.length > 0) {
      await tx.insert(promotionRunItems).values(
        previewItems.map((item) => ({
          runId: run.id,
          ...item,
        })),
      );
    }

    return {
      run,
      items: previewItems,
      summary,
    };
  });
}

export async function getPromotionRun(request: Request, runId: string) {
  await requirePermission(request, "settings_academic_year", "view");

  const [run] = await db.select().from(promotionRuns).where(eq(promotionRuns.id, runId)).limit(1);
  if (!run) throw new HttpError("Promotion run not found", 404);

  const items = await db
    .select({
      id: promotionRunItems.id,
      runId: promotionRunItems.runId,
      studentId: promotionRunItems.studentId,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      sourceEnrollmentId: promotionRunItems.sourceEnrollmentId,
      targetEnrollmentId: promotionRunItems.targetEnrollmentId,
      outcome: promotionRunItems.outcome,
      status: promotionRunItems.status,
      warnings: promotionRunItems.warnings,
      blockers: promotionRunItems.blockers,
      carryForwardAmountPaisa: promotionRunItems.carryForwardAmountPaisa,
      metadata: promotionRunItems.metadata,
      createdAt: promotionRunItems.createdAt,
      updatedAt: promotionRunItems.updatedAt,
    })
    .from(promotionRunItems)
    .innerJoin(students, eq(students.id, promotionRunItems.studentId))
    .where(eq(promotionRunItems.runId, runId))
    .orderBy(asc(students.name), asc(promotionRunItems.createdAt));

  return { run, items };
}

export async function applyPromotionRun(request: Request, runId: string) {
  const actor = await requirePermission(request, "settings_academic_year", "manage");

  return db.transaction(async (tx) => {
    const [run] = await tx.select().from(promotionRuns).where(eq(promotionRuns.id, runId)).limit(1);
    if (!run) throw new HttpError("Promotion run not found", 404);
    if (run.status !== "previewed") {
      throw new HttpError("Only previewed promotion runs can be applied", 409);
    }

    const [sourceYear, targetYear] = await Promise.all([
      getAcademicYearOrThrow(run.sourceAcademicYearId, tx),
      getAcademicYearOrThrow(run.targetAcademicYearId, tx),
    ]);
    if (sourceYear.status === "archived") {
      throw new HttpError("Archived academic years cannot be used as promotion source", 409);
    }
    if (targetYear.status === "locked" || targetYear.status === "archived") {
      throw new HttpError("Target academic year is locked", 409);
    }

    const items = await tx
      .select()
      .from(promotionRunItems)
      .where(eq(promotionRunItems.runId, runId))
      .orderBy(asc(promotionRunItems.createdAt));
    const applicableItems = items.filter(
      (item) => item.status === "ready" || item.status === "warning",
    );
    if (applicableItems.length === 0) {
      throw new HttpError("Promotion run has no ready students to apply", 409);
    }

    const now = new Date();
    const appliedItemIds: string[] = [];
    for (const item of applicableItems) {
      const metadata = parsePromotionItemMetadata(item.metadata);
      const sourceEnrollment = await getActiveSourceEnrollment(
        tx,
        item.sourceEnrollmentId,
        item.studentId,
      );

      if (item.outcome === "promote" || item.outcome === "repeat") {
        const target = metadata.target;
        const rollPrefix = await getRollPrefixForTarget(
          tx,
          run.programId,
          target.madrassaSubcategoryId,
        );
        const admissionNo = await nextScopedNumber(tx, {
          type: "admission",
          institutionId: run.institutionId,
          programId: run.programId,
          schoolClassId: target.schoolClassId,
          madrassaSubcategoryId: target.madrassaSubcategoryId,
          prefix: "AD",
        });
        const rollNo = await nextScopedNumber(tx, {
          type: "roll",
          institutionId: run.institutionId,
          programId: run.programId,
          schoolClassId: target.schoolClassId,
          madrassaSubcategoryId: target.madrassaSubcategoryId,
          prefix: rollPrefix,
        });

        await closeEnrollment(
          tx,
          sourceEnrollment.id,
          item.outcome === "repeat" ? "repeated" : "promoted",
          now,
        );
        const [targetEnrollment] = await tx
          .insert(studentEnrollments)
          .values({
            id: randomUUID(),
            studentId: item.studentId,
            institutionId: run.institutionId,
            programId: run.programId,
            academicYearId: run.targetAcademicYearId,
            schoolClassId: target.schoolClassId,
            schoolSectionId: target.schoolSectionId,
            madrassaSubcategoryId: target.madrassaSubcategoryId,
            darja: target.darja,
            admissionNo,
            rollNo,
            status: "active",
            startedAt: now,
          })
          .returning();

        await tx
          .update(students)
          .set({ status: "active", updatedAt: now })
          .where(eq(students.id, item.studentId));

        if (run.carryForwardFees && item.carryForwardAmountPaisa > 0) {
          await createOpeningBalanceCharge(tx, {
            studentId: item.studentId,
            enrollmentId: targetEnrollment.id,
            institutionId: run.institutionId,
            programId: run.programId,
            amountPaisa: item.carryForwardAmountPaisa,
            sourceEnrollmentId: sourceEnrollment.id,
            academicYearName: sourceYear.name,
            actorUserId: actor.id,
            schoolClassId: target.schoolClassId,
            schoolSectionId: target.schoolSectionId,
            madrassaSubcategoryId: target.madrassaSubcategoryId,
          });
        }

        await insertPromotionEvent(tx, {
          studentId: item.studentId,
          enrollmentId: targetEnrollment.id,
          outcome: item.outcome,
          sourceYearName: sourceYear.name,
          targetYearName: targetYear.name,
          sourceEnrollmentId: sourceEnrollment.id,
          targetEnrollmentId: targetEnrollment.id,
          actorUserId: actor.id,
        });

        await tx
          .update(promotionRunItems)
          .set({
            status: "applied",
            targetEnrollmentId: targetEnrollment.id,
            updatedAt: now,
          })
          .where(eq(promotionRunItems.id, item.id));
      } else if (
        item.outcome === "graduate" ||
        item.outcome === "dropout" ||
        item.outcome === "inactive"
      ) {
        await closeEnrollment(tx, sourceEnrollment.id, item.outcome, now);
        await tx
          .update(students)
          .set({ status: studentStatusForTerminalOutcome(item.outcome), updatedAt: now })
          .where(eq(students.id, item.studentId));
        await insertPromotionEvent(tx, {
          studentId: item.studentId,
          enrollmentId: sourceEnrollment.id,
          outcome: item.outcome,
          sourceYearName: sourceYear.name,
          targetYearName: targetYear.name,
          sourceEnrollmentId: sourceEnrollment.id,
          targetEnrollmentId: null,
          actorUserId: actor.id,
        });

        await tx
          .update(promotionRunItems)
          .set({ status: "applied", updatedAt: now })
          .where(eq(promotionRunItems.id, item.id));
      } else {
        throw new HttpError("Blocked promotion item cannot be applied", 409);
      }

      appliedItemIds.push(item.id);
    }

    const blockedItemIds = items.filter((item) => item.status === "blocked").map((item) => item.id);
    if (blockedItemIds.length > 0) {
      await tx
        .update(promotionRunItems)
        .set({ status: "skipped", updatedAt: now })
        .where(inArray(promotionRunItems.id, blockedItemIds));
    }

    const [updatedRun] = await tx
      .update(promotionRuns)
      .set({
        status: "applied",
        appliedAt: now,
        appliedByUserId: actor.id,
        summary: {
          ...(run.summary ?? {}),
          appliedCount: appliedItemIds.length,
          skippedCount: blockedItemIds.length,
        },
        updatedAt: now,
      })
      .where(eq(promotionRuns.id, runId))
      .returning();

    return {
      run: updatedRun,
      appliedCount: appliedItemIds.length,
      skippedCount: blockedItemIds.length,
    };
  });
}

function validatePromotionRuleInput(input: z.infer<typeof promotionRuleInputSchema>) {
  if (input.system === "school" && input.sourceMadrassaSubcategoryId) {
    throw new HttpError("School promotion rules cannot use madrassa source placement", 400);
  }
  if (input.system === "madrassa" && input.sourceSchoolClassId) {
    throw new HttpError("Madrassa promotion rules cannot use school source placement", 400);
  }
  if (input.outcome === "promote" && input.system === "school" && !input.targetSchoolClassId) {
    throw new HttpError("School promotion rules require a target class", 400);
  }
  if (
    input.outcome === "promote" &&
    input.system === "madrassa" &&
    !input.targetMadrassaSubcategoryId
  ) {
    throw new HttpError("Madrassa promotion rules require a target subcategory", 400);
  }
}

async function getAcademicYearOrThrow(id: string, executor: typeof db | PromotionTx = db) {
  const [year] = await executor
    .select()
    .from(academicYears)
    .where(eq(academicYears.id, id))
    .limit(1);
  if (!year) throw new HttpError("Academic year not found", 404);
  return year;
}

async function loadSourceEnrollments(input: z.infer<typeof promotionPreviewSchema>) {
  const clauses = compactSql([
    eq(studentEnrollments.academicYearId, input.sourceAcademicYearId),
    eq(studentEnrollments.institutionId, input.institutionId),
    eq(studentEnrollments.programId, input.programId),
    isNull(studentEnrollments.endedAt),
    eq(studentEnrollments.status, "active"),
    input.system === "madrassa"
      ? eq(programs.system, "madrassa")
      : or(eq(programs.system, "school"), eq(programs.system, "school_support")),
    input.schoolClassId ? eq(studentEnrollments.schoolClassId, input.schoolClassId) : undefined,
    input.schoolSectionId
      ? eq(studentEnrollments.schoolSectionId, input.schoolSectionId)
      : undefined,
    input.madrassaSubcategoryId
      ? eq(studentEnrollments.madrassaSubcategoryId, input.madrassaSubcategoryId)
      : undefined,
    input.madrassaCategoryId ? eq(madrassaCategories.id, input.madrassaCategoryId) : undefined,
  ]);

  return db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentNameUrdu: students.nameUrdu,
      fatherName: students.fatherName,
      gender: students.gender,
      enrollmentId: studentEnrollments.id,
      admissionNo: studentEnrollments.admissionNo,
      rollNo: studentEnrollments.rollNo,
      institutionId: studentEnrollments.institutionId,
      institutionName: institutions.name,
      programId: studentEnrollments.programId,
      programName: programs.name,
      programSystem: programs.system,
      schoolClassId: studentEnrollments.schoolClassId,
      schoolClassName: schoolClasses.name,
      schoolSectionId: studentEnrollments.schoolSectionId,
      schoolSectionName: schoolClassSections.name,
      madrassaCategoryId: madrassaCategories.id,
      madrassaCategoryName: madrassaCategories.name,
      madrassaSubcategoryId: studentEnrollments.madrassaSubcategoryId,
      madrassaSubcategoryName: madrassaSubcategories.name,
      darja: studentEnrollments.darja,
    })
    .from(studentEnrollments)
    .innerJoin(students, eq(students.id, studentEnrollments.studentId))
    .innerJoin(institutions, eq(institutions.id, studentEnrollments.institutionId))
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .leftJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.schoolClassId))
    .leftJoin(schoolClassSections, eq(schoolClassSections.id, studentEnrollments.schoolSectionId))
    .leftJoin(
      madrassaSubcategories,
      eq(madrassaSubcategories.id, studentEnrollments.madrassaSubcategoryId),
    )
    .leftJoin(madrassaCategories, eq(madrassaCategories.id, madrassaSubcategories.categoryId))
    .where(and(...clauses))
    .orderBy(asc(studentEnrollments.rollNo), asc(students.name));
}

async function loadPromotionRules(input: z.infer<typeof promotionPreviewSchema>) {
  return db
    .select()
    .from(promotionRules)
    .where(
      and(
        eq(promotionRules.system, input.system),
        eq(promotionRules.active, true),
        or(
          isNull(promotionRules.institutionId),
          eq(promotionRules.institutionId, input.institutionId),
        ),
        or(isNull(promotionRules.programId), eq(promotionRules.programId, input.programId)),
      ),
    )
    .orderBy(asc(promotionRules.displayOrder), asc(promotionRules.createdAt));
}

function buildPreviewMetadata(
  row: SourceEnrollmentRow,
  target: PromotionItemMetadata["target"],
  ruleId: string | null,
): PromotionItemMetadata {
  return {
    student: {
      name: row.studentName,
      nameUrdu: row.studentNameUrdu,
      fatherName: row.fatherName,
      gender: row.gender,
    },
    source: {
      admissionNo: row.admissionNo,
      rollNo: row.rollNo,
      institutionId: row.institutionId,
      institutionName: row.institutionName,
      programId: row.programId,
      programName: row.programName,
      schoolClassId: row.schoolClassId,
      schoolClassName: row.schoolClassName,
      schoolSectionId: row.schoolSectionId,
      schoolSectionName: row.schoolSectionName,
      madrassaCategoryId: row.madrassaCategoryId,
      madrassaCategoryName: row.madrassaCategoryName,
      madrassaSubcategoryId: row.madrassaSubcategoryId,
      madrassaSubcategoryName: row.madrassaSubcategoryName,
      darja: row.darja,
    },
    target,
    ruleId,
  };
}

function summarizePreviewItems(
  items: Array<{
    status: PromotionItemStatus;
    outcome: PromotionOutcome;
    carryForwardAmountPaisa: number;
  }>,
) {
  return {
    totalCount: items.length,
    readyCount: items.filter((item) => item.status === "ready").length,
    warningCount: items.filter((item) => item.status === "warning").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    promoteCount: items.filter((item) => item.outcome === "promote").length,
    repeatCount: items.filter((item) => item.outcome === "repeat").length,
    graduateCount: items.filter((item) => item.outcome === "graduate").length,
    dropoutCount: items.filter((item) => item.outcome === "dropout").length,
    inactiveCount: items.filter((item) => item.outcome === "inactive").length,
    carryForwardTotalPaisa: items.reduce((sum, item) => sum + item.carryForwardAmountPaisa, 0),
  };
}

async function getActiveSourceEnrollment(tx: PromotionTx, enrollmentId: string, studentId: string) {
  const [enrollment] = await tx
    .select({
      id: studentEnrollments.id,
      studentId: studentEnrollments.studentId,
      endedAt: studentEnrollments.endedAt,
      status: studentEnrollments.status,
    })
    .from(studentEnrollments)
    .where(
      and(eq(studentEnrollments.id, enrollmentId), eq(studentEnrollments.studentId, studentId)),
    )
    .limit(1);
  if (!enrollment) throw new HttpError("Source enrollment not found", 404);
  if (enrollment.endedAt || enrollment.status !== "active") {
    throw new HttpError("Source enrollment is no longer active", 409);
  }
  return enrollment;
}

async function closeEnrollment(
  tx: PromotionTx,
  enrollmentId: string,
  status: string,
  endedAt: Date,
) {
  await tx
    .update(studentEnrollments)
    .set({ status, endedAt, updatedAt: endedAt })
    .where(eq(studentEnrollments.id, enrollmentId));
}

async function getRollPrefixForTarget(
  tx: PromotionTx,
  programId: string,
  madrassaSubcategoryId: string | null,
) {
  if (madrassaSubcategoryId) {
    const [subcategory] = await tx
      .select({ rollPrefix: madrassaSubcategories.rollPrefix })
      .from(madrassaSubcategories)
      .where(eq(madrassaSubcategories.id, madrassaSubcategoryId))
      .limit(1);
    if (subcategory?.rollPrefix) return subcategory.rollPrefix;
  }

  const [program] = await tx
    .select({ rollPrefix: programs.rollPrefix })
    .from(programs)
    .where(eq(programs.id, programId))
    .limit(1);

  return program?.rollPrefix ?? "ADM";
}

function parsePromotionItemMetadata(metadata: Record<string, unknown>): PromotionItemMetadata {
  const target = metadata.target;
  if (!target || typeof target !== "object") {
    throw new HttpError("Promotion item is missing target placement metadata", 409);
  }
  return metadata as PromotionItemMetadata;
}

async function insertPromotionEvent(
  tx: PromotionTx,
  input: {
    studentId: string;
    enrollmentId: string;
    outcome: Exclude<PromotionOutcome, "blocked">;
    sourceYearName: string;
    targetYearName: string;
    sourceEnrollmentId: string;
    targetEnrollmentId: string | null;
    actorUserId: string;
  },
) {
  await insertStudentEvent(tx, {
    studentId: input.studentId,
    enrollmentId: input.enrollmentId,
    type: studentEventTypeForPromotionOutcome(input.outcome),
    message: promotionEventMessage(input.outcome, input.sourceYearName, input.targetYearName),
    metadata: {
      outcome: input.outcome,
      sourceYearName: input.sourceYearName,
      targetYearName: input.targetYearName,
      sourceEnrollmentId: input.sourceEnrollmentId,
      targetEnrollmentId: input.targetEnrollmentId,
    },
    actorUserId: input.actorUserId,
  });
}

function promotionEventMessage(
  outcome: Exclude<PromotionOutcome, "blocked">,
  sourceYearName: string,
  targetYearName: string,
) {
  switch (outcome) {
    case "promote":
      return `Promoted from ${sourceYearName} to ${targetYearName}`;
    case "repeat":
      return `Repeated into ${targetYearName}`;
    case "graduate":
      return `Graduated after ${sourceYearName}`;
    case "dropout":
      return `Marked dropout during rollover from ${sourceYearName}`;
    case "inactive":
      return `Marked inactive during rollover from ${sourceYearName}`;
  }
}

function studentStatusForTerminalOutcome(outcome: "graduate" | "dropout" | "inactive") {
  if (outcome === "graduate") return "graduated";
  return outcome;
}

function assertProgramMatchesSystem(system: PromotionSystem, programSystem: string) {
  if (system === "madrassa" && programSystem !== "madrassa") {
    throw new HttpError("Selected program is not a madrassa program", 400);
  }
  if (system === "school" && programSystem !== "school" && programSystem !== "school_support") {
    throw new HttpError("Selected program is not a school program", 400);
  }
}

function compactSql(items: Array<SQL | undefined>): SQL[] {
  return items.filter((item): item is SQL => Boolean(item));
}
