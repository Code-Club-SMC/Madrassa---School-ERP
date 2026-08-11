import { randomUUID } from "node:crypto";
import { and, asc, count, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { programs } from "@/db/schema/academic";
import {
  academicYears,
  type AcademicYearCalendarType,
  type AcademicYearStatus,
  type AcademicYearSystem,
} from "@/db/schema/academic-years";
import { studentEnrollments } from "@/db/schema/students";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import {
  assertAcademicYearCalendar,
  assertAcademicYearEditable,
  assertActiveAcademicYear,
  assertNoAcademicYearOverlap,
  assertValidAcademicYearDates,
  defaultCalendarTypeForSystem,
} from "@/lib/server/academic-years/domain";

const academicYearSystemSchema = z.enum(["school", "madrassa"]);
const academicYearCalendarTypeSchema = z.enum(["gregorian", "hijri"]);
const academicYearDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ 2026-06-17 جیسے فارمیٹ میں ہونی چاہیے");

export const academicYearInputSchema = z.object({
  name: z.string().trim().min(1, "سال کا عنوان لازمی ہے"),
  hijriName: z.string().trim().min(1, "ہجری سال لازمی ہے").nullable().optional(),
  system: academicYearSystemSchema.default("school"),
  calendarType: academicYearCalendarTypeSchema.optional(),
  startDate: academicYearDateSchema,
  endDate: academicYearDateSchema,
  carryForwardEnabled: z.boolean().default(true),
});

export const academicYearUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "سال کا عنوان لازمی ہے").optional(),
    hijriName: z.string().trim().min(1, "ہجری سال لازمی ہے").nullable().optional(),
    startDate: academicYearDateSchema.optional(),
    endDate: academicYearDateSchema.optional(),
    carryForwardEnabled: z.boolean().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "کم از کم ایک فیلڈ لازمی ہے",
  });

export const academicYearBackfillSchema = z.object({
  academicYearId: z.string().trim().min(1).optional(),
  system: academicYearSystemSchema.default("school"),
});

export async function listAcademicYears(request: Request) {
  await requirePermission(request, "settings_academic_year", "view");

  const [years, missingYearRows] = await Promise.all([
    db.select().from(academicYears).orderBy(asc(academicYears.startDate)),
    db
      .select({ system: programs.system, count: count() })
      .from(studentEnrollments)
      .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
      .where(and(isNull(studentEnrollments.endedAt), isNull(studentEnrollments.academicYearId)))
      .groupBy(programs.system),
  ]);
  const backfillBySystem = {
    school: Number(missingYearRows.find((row) => row.system === "school")?.count ?? 0),
    madrassa: Number(missingYearRows.find((row) => row.system === "madrassa")?.count ?? 0),
  };

  return {
    years,
    summary: {
      activeEnrollmentBackfillRequired: backfillBySystem.school + backfillBySystem.madrassa,
      activeEnrollmentBackfillRequiredBySystem: backfillBySystem,
    },
  };
}

export async function createAcademicYear(
  request: Request,
  input: z.infer<typeof academicYearInputSchema>,
) {
  await requirePermission(request, "settings_academic_year", "manage");
  assertValidAcademicYearDates(input.startDate, input.endDate);
  await assertNoAcademicYearOverlap(input.system, input.startDate, input.endDate);
  const calendarType = normalizeAcademicYearCalendar(input.system, input.calendarType);

  const [row] = await db
    .insert(academicYears)
    .values({
      id: randomUUID(),
      name: input.name,
      hijriName: input.hijriName ?? null,
      system: input.system,
      calendarType,
      startDate: input.startDate,
      endDate: input.endDate,
      carryForwardEnabled: input.carryForwardEnabled,
    })
    .returning();

  return row;
}

export async function updateAcademicYear(
  request: Request,
  academicYearId: string,
  input: z.infer<typeof academicYearUpdateSchema>,
) {
  await requirePermission(request, "settings_academic_year", "manage");
  const year = await getAcademicYearOrThrow(academicYearId);
  assertAcademicYearEditable(year.status);

  const startDate = input.startDate ?? year.startDate;
  const endDate = input.endDate ?? year.endDate;
  assertValidAcademicYearDates(startDate, endDate);
  await assertNoAcademicYearOverlap(year.system, startDate, endDate, academicYearId);

  const [row] = await db
    .update(academicYears)
    .set({
      name: input.name ?? year.name,
      hijriName: input.hijriName === undefined ? year.hijriName : input.hijriName,
      startDate,
      endDate,
      carryForwardEnabled: input.carryForwardEnabled ?? year.carryForwardEnabled,
      updatedAt: new Date(),
    })
    .where(eq(academicYears.id, academicYearId))
    .returning();

  return row;
}

export async function activateAcademicYear(request: Request, academicYearId: string) {
  await requirePermission(request, "settings_academic_year", "manage");

  return db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, academicYearId))
      .limit(1);
    if (!target) throw new HttpError("تعلیمی سال نہیں ملا", 404);
    if (target.status === "locked")
      throw new HttpError("مقفل تعلیمی سال فعال نہیں کیا جا سکتا", 409);
    if (target.status === "active") return target;

    await tx
      .update(academicYears)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(academicYears.status, "active"), eq(academicYears.system, target.system)));

    const [activated] = await tx
      .update(academicYears)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(academicYears.id, academicYearId))
      .returning();

    return activated;
  });
}

export async function lockAcademicYear(request: Request, academicYearId: string) {
  const actor = await requirePermission(request, "settings_academic_year", "manage");
  const year = await getAcademicYearOrThrow(academicYearId);
  if (year.status === "archived")
    throw new HttpError("محفوظ شدہ تعلیمی سال مقفل نہیں کیا جا سکتا", 409);

  const [row] = await db
    .update(academicYears)
    .set({
      status: "locked",
      lockedAt: new Date(),
      lockedByUserId: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(academicYears.id, academicYearId))
    .returning();

  return row;
}

export async function archiveAcademicYear(request: Request, academicYearId: string) {
  await requirePermission(request, "settings_academic_year", "manage");
  const year = await getAcademicYearOrThrow(academicYearId);
  if (year.status === "active")
    throw new HttpError("اس فعال سال کو محفوظ کرنے سے پہلے دوسرا سال فعال کریں", 409);

  const [row] = await db
    .update(academicYears)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(academicYears.id, academicYearId))
    .returning();

  return row;
}

export async function backfillActiveEnrollments(
  request: Request,
  input: z.infer<typeof academicYearBackfillSchema> = { system: "school" },
) {
  await requirePermission(request, "settings_academic_year", "manage");
  const targetYear = input.academicYearId
    ? await getAcademicYearOrThrow(input.academicYearId)
    : await getActiveAcademicYear(input.system);
  assertAcademicYearEditable(targetYear.status);

  const missingRows = await db
    .select({ id: studentEnrollments.id })
    .from(studentEnrollments)
    .innerJoin(programs, eq(programs.id, studentEnrollments.programId))
    .where(
      and(
        isNull(studentEnrollments.endedAt),
        isNull(studentEnrollments.academicYearId),
        eq(programs.system, targetYear.system),
      ),
    );

  if (missingRows.length === 0) {
    return {
      academicYear: targetYear,
      updatedCount: 0,
    };
  }

  const rows = await db
    .update(studentEnrollments)
    .set({ academicYearId: targetYear.id, updatedAt: new Date() })
    .where(
      inArray(
        studentEnrollments.id,
        missingRows.map((row) => row.id),
      ),
    )
    .returning({ id: studentEnrollments.id });

  return {
    academicYear: targetYear,
    updatedCount: rows.length,
  };
}

export async function getActiveAcademicYear(system: AcademicYearSystem) {
  const [row] = await db
    .select()
    .from(academicYears)
    .where(and(eq(academicYears.status, "active"), eq(academicYears.system, system)))
    .limit(1);
  return assertActiveAcademicYear(row, system);
}

export async function requireEditableAcademicYearId(academicYearId: string | null | undefined) {
  if (!academicYearId) throw new HttpError("تعلیمی سال لازمی ہے", 409);
  const year = await getAcademicYearOrThrow(academicYearId);
  assertAcademicYearEditable(year.status);
  return year;
}

export async function requireEditableAcademicYearName(name: string, system?: AcademicYearSystem) {
  const [year] = await db
    .select()
    .from(academicYears)
    .where(
      system
        ? and(eq(academicYears.name, name), eq(academicYears.system, system))
        : eq(academicYears.name, name),
    )
    .limit(1);
  if (!year) return null;
  assertAcademicYearEditable(year.status);
  return year;
}

async function getAcademicYearOrThrow(id: string) {
  const [row] = await db.select().from(academicYears).where(eq(academicYears.id, id)).limit(1);
  if (!row) throw new HttpError("تعلیمی سال نہیں ملا", 404);
  return row;
}

export async function assertNoOtherActiveAcademicYear(id: string) {
  const target = await getAcademicYearOrThrow(id);
  const [row] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(and(eq(academicYears.status, "active"), eq(academicYears.system, target.system)))
    .limit(1);
  if (row && row.id !== id)
    throw new HttpError("اس نظام کا ایک اور تعلیمی سال پہلے سے فعال ہے", 409);
}

export function academicYearStatusLabel(status: AcademicYearStatus) {
  if (status === "active") return "فعال";
  if (status === "locked") return "مقفل";
  if (status === "archived") return "محفوظ شدہ";
  return "آنے والا";
}

function normalizeAcademicYearCalendar(
  system: AcademicYearSystem,
  calendarType: AcademicYearCalendarType | undefined,
) {
  const resolved = calendarType ?? defaultCalendarTypeForSystem(system);
  assertAcademicYearCalendar(system, resolved);
  return resolved;
}
