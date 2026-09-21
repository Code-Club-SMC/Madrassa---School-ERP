import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import {
  schoolTimetablePeriods,
  schoolTimetableSlots,
  schoolTimetablePeriodRelations,
} from "@/db/schema/timetable";
import { examSubjects } from "@/db/schema/exams";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";

export const schoolTimetablePeriodInputSchema = z.object({
  schoolClassId: z.string().trim().min(1),
  timeStart: z.string().trim().min(1),
  timeEnd: z.string().trim().min(1),
  label: z.string().trim().min(1),
  labelUrdu: z.string().trim().min(1),
  isBreak: z.boolean().optional().default(false),
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(5),
      subjectId: z.string().trim().nullable().optional(),
    }),
  ).length(6),
});

export const schoolTimetablePeriodUpdateSchema = schoolTimetablePeriodInputSchema.partial().refine(hasAnyKey, {
  message: "At least one field is required",
});

function hasAnyKey(value: Record<string, unknown>) {
  return Object.values(value).some((item) => item !== undefined);
}

export async function listSchoolTimetablePeriods(request: Request, schoolClassId: string) {
  await requirePermission(request, "school_timetable", "view");

  return db.query.schoolTimetablePeriods.findMany({
    where: eq(schoolTimetablePeriods.schoolClassId, schoolClassId),
    orderBy: asc(schoolTimetablePeriods.displayOrder),
    with: {
      slots: {
        with: {
          subject: true,
        },
        orderBy: asc(schoolTimetableSlots.dayOfWeek),
      },
    },
  });
}

export async function listSchoolTimetableStatus(request: Request, schoolClassIds: string[]) {
  await requirePermission(request, "school_timetable", "view");

  const rows = await db
    .select({
      schoolClassId: schoolTimetablePeriods.schoolClassId,
      periodCount: count(),
    })
    .from(schoolTimetablePeriods)
    .where(inArray(schoolTimetablePeriods.schoolClassId, schoolClassIds))
    .groupBy(schoolTimetablePeriods.schoolClassId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.schoolClassId, Number(row.periodCount));
  }
  return map;
}

export async function createSchoolTimetablePeriod(
  request: Request,
  input: z.infer<typeof schoolTimetablePeriodInputSchema>,
) {
  await requirePermission(request, "school_timetable", "edit");

  const id = `tt-${randomUUID().slice(0, 8)}`;
  const displayOrder = await nextSchoolTimetablePeriodOrder(input.schoolClassId);

  const validSubjectIds = input.slots
    .map((s) => s.subjectId)
    .filter((id): id is string => id !== null && id !== undefined);

  if (validSubjectIds.length > 0) {
    const subjects = await db.select().from(examSubjects).where(inArray(examSubjects.id, validSubjectIds));
    const validSet = new Set(subjects.map((s) => s.id));
    for (const slot of input.slots) {
      if (slot.subjectId && !validSet.has(slot.subjectId)) {
        throw new HttpError(`Invalid subject ID: ${slot.subjectId}`, 400);
      }
    }
  }

  await db.transaction(async (tx) => {
    const [period] = await tx
      .insert(schoolTimetablePeriods)
      .values({
        id,
        schoolClassId: input.schoolClassId,
        timeStart: input.timeStart,
        timeEnd: input.timeEnd,
        label: input.label,
        labelUrdu: input.labelUrdu,
        displayOrder,
        isBreak: input.isBreak ?? false,
      })
      .returning();

    await tx.insert(schoolTimetableSlots).values(
      input.slots.map((slot) => ({
        id: `tts-${randomUUID().slice(0, 8)}`,
        periodId: period.id,
        dayOfWeek: slot.dayOfWeek,
        subjectId: slot.subjectId ?? null,
      })),
    );
  });

  return { id };
}

export async function updateSchoolTimetablePeriod(
  request: Request,
  periodId: string,
  input: Partial<z.infer<typeof schoolTimetablePeriodInputSchema>>,
) {
  await requirePermission(request, "school_timetable", "edit");

  const existing = await db
    .select()
    .from(schoolTimetablePeriods)
    .where(eq(schoolTimetablePeriods.id, periodId))
    .limit(1);

  if (existing.length === 0) {
    throw new HttpError("Timetable period not found", 404);
  }

  const updateData: Record<string, unknown> = { ...input, updatedAt: new Date() };
  const slots = input.slots;
  if (slots) {
    const validSubjectIds = slots
      .map((s) => s.subjectId)
      .filter((id): id is string => id !== null && id !== undefined);

    if (validSubjectIds.length > 0) {
      const subjects = await db.select().from(examSubjects).where(inArray(examSubjects.id, validSubjectIds));
      const validSet = new Set(subjects.map((s) => s.id));
      for (const slot of slots) {
        if (slot.subjectId && !validSet.has(slot.subjectId)) {
          throw new HttpError(`Invalid subject ID: ${slot.subjectId}`, 400);
        }
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(schoolTimetableSlots).where(eq(schoolTimetableSlots.periodId, periodId));
      await tx.insert(schoolTimetableSlots).values(
        slots.map((slot) => ({
          id: `tts-${randomUUID().slice(0, 8)}`,
          periodId,
          dayOfWeek: slot.dayOfWeek,
          subjectId: slot.subjectId ?? null,
        })),
      );
    });
    delete updateData.slots;
  }

  const [updated] = await db
    .update(schoolTimetablePeriods)
    .set(updateData)
    .where(eq(schoolTimetablePeriods.id, periodId))
    .returning();

  return updated;
}

export async function deleteSchoolTimetablePeriod(request: Request, periodId: string) {
  await requirePermission(request, "school_timetable", "delete");

  await db.delete(schoolTimetablePeriods).where(eq(schoolTimetablePeriods.id, periodId));
}

async function nextSchoolTimetablePeriodOrder(schoolClassId: string) {
  const [row] = await db
    .select({ max: sql<number>`COALESCE(MAX(${schoolTimetablePeriods.displayOrder}), 0)` })
    .from(schoolTimetablePeriods)
    .where(eq(schoolTimetablePeriods.schoolClassId, schoolClassId))
    .limit(1);

  return Number(row?.max ?? 0) + 1;
}
