import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import {
  madrassaTimetablePeriods,
  madrassaTimetableSlots,
  madrassaTimetablePeriodRelations,
} from "@/db/schema/timetable";
import { examSubjects } from "@/db/schema/exams";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";

export const timetablePeriodInputSchema = z.object({
  madrassaSubcategoryId: z.string().trim().min(1),
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

export const timetablePeriodUpdateSchema = timetablePeriodInputSchema.partial().refine(hasAnyKey, {
  message: "At least one field is required",
});

function hasAnyKey(value: Record<string, unknown>) {
  return Object.values(value).some((item) => item !== undefined);
}

export async function listTimetablePeriods(request: Request, subcategoryId: string) {
  await requirePermission(request, "madrassa_timetable", "view");

  return db.query.madrassaTimetablePeriods.findMany({
    where: eq(madrassaTimetablePeriods.madrassaSubcategoryId, subcategoryId),
    orderBy: asc(madrassaTimetablePeriods.displayOrder),
    with: {
      slots: {
        with: {
          subject: true,
        },
        orderBy: asc(madrassaTimetableSlots.dayOfWeek),
      },
    },
  });
}

export async function listTimetableStatus(request: Request, subcategoryIds: string[]) {
  await requirePermission(request, "madrassa_timetable", "view");

  const rows = await db
    .select({
      madrassaSubcategoryId: madrassaTimetablePeriods.madrassaSubcategoryId,
      periodCount: count(),
    })
    .from(madrassaTimetablePeriods)
    .where(inArray(madrassaTimetablePeriods.madrassaSubcategoryId, subcategoryIds))
    .groupBy(madrassaTimetablePeriods.madrassaSubcategoryId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.madrassaSubcategoryId, Number(row.periodCount));
  }
  return map;
}

export async function createTimetablePeriod(
  request: Request,
  input: z.infer<typeof timetablePeriodInputSchema>,
) {
  await requirePermission(request, "madrassa_timetable", "create");

  const id = `tt-${randomUUID().slice(0, 8)}`;
  const displayOrder = await nextTimetablePeriodOrder(input.madrassaSubcategoryId);

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
      .insert(madrassaTimetablePeriods)
      .values({
        id,
        madrassaSubcategoryId: input.madrassaSubcategoryId,
        timeStart: input.timeStart,
        timeEnd: input.timeEnd,
        label: input.label,
        labelUrdu: input.labelUrdu,
        displayOrder,
        isBreak: input.isBreak ?? false,
      })
      .returning();

    await tx.insert(madrassaTimetableSlots).values(
      input.slots.map((slot) => ({
        id: `tts-${randomUUID().slice(0, 8)}`,
        periodId: period.id,
        dayOfWeek: slot.dayOfWeek,
        subjectId: slot.subjectId ?? null,
      })),
    );
  });

  return db.query.madrassaTimetablePeriods.findFirst({
    where: eq(madrassaTimetablePeriods.id, id),
    with: {
      slots: {
        with: {
          subject: true,
        },
        orderBy: asc(madrassaTimetableSlots.dayOfWeek),
      },
    },
  });
}

export async function updateTimetablePeriod(
  request: Request,
  id: string,
  input: z.infer<typeof timetablePeriodUpdateSchema>,
) {
  await requirePermission(request, "madrassa_timetable", "edit");

  const [existing] = await db
    .select()
    .from(madrassaTimetablePeriods)
    .where(eq(madrassaTimetablePeriods.id, id))
    .limit(1);

  if (!existing) throw new HttpError("Timetable period not found", 404);

  if (input.madrassaSubcategoryId && input.madrassaSubcategoryId !== existing.madrassaSubcategoryId) {
    throw new HttpError("Cannot move a period to another class", 400);
  }

  const validSubjectIds = input.slots
    ?.map((s) => s.subjectId)
    .filter((id): id is string => id !== null && id !== undefined);

  if (validSubjectIds && validSubjectIds.length > 0) {
    const subjects = await db.select().from(examSubjects).where(inArray(examSubjects.id, validSubjectIds));
    const validSet = new Set(subjects.map((s) => s.id));
    for (const slot of input.slots ?? []) {
      if (slot.subjectId && !validSet.has(slot.subjectId)) {
        throw new HttpError(`Invalid subject ID: ${slot.subjectId}`, 400);
      }
    }
  }

  await db.transaction(async (tx) => {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.timeStart !== undefined) updateData.timeStart = input.timeStart;
    if (input.timeEnd !== undefined) updateData.timeEnd = input.timeEnd;
    if (input.label !== undefined) updateData.label = input.label;
    if (input.labelUrdu !== undefined) updateData.labelUrdu = input.labelUrdu;
    if (input.isBreak !== undefined) updateData.isBreak = input.isBreak;

    if (Object.keys(updateData).length > 1) {
      await tx.update(madrassaTimetablePeriods).set(updateData).where(eq(madrassaTimetablePeriods.id, id));
    }

    if (input.slots && input.slots.length === 6) {
      await tx.delete(madrassaTimetableSlots).where(eq(madrassaTimetableSlots.periodId, id));

      await tx.insert(madrassaTimetableSlots).values(
        input.slots.map((slot) => ({
          id: `tts-${randomUUID().slice(0, 8)}`,
          periodId: id,
          dayOfWeek: slot.dayOfWeek,
          subjectId: slot.subjectId ?? null,
        })),
      );
    }
  });

  return db.query.madrassaTimetablePeriods.findFirst({
    where: eq(madrassaTimetablePeriods.id, id),
    with: {
      slots: {
        with: {
          subject: true,
        },
        orderBy: asc(madrassaTimetableSlots.dayOfWeek),
      },
    },
  });
}

export async function deleteTimetablePeriod(request: Request, id: string) {
  await requirePermission(request, "madrassa_timetable", "delete");

  const [existing] = await db
    .select()
    .from(madrassaTimetablePeriods)
    .where(eq(madrassaTimetablePeriods.id, id))
    .limit(1);

  if (!existing) throw new HttpError("Timetable period not found", 404);

  await db.delete(madrassaTimetablePeriods).where(eq(madrassaTimetablePeriods.id, id));

  return { success: true } as const;
}

async function nextTimetablePeriodOrder(subcategoryId: string) {
  const [row] = await db
    .select({ value: sql<number>`COALESCE(MAX(${madrassaTimetablePeriods.displayOrder}), 0)` })
    .from(madrassaTimetablePeriods)
    .where(eq(madrassaTimetablePeriods.madrassaSubcategoryId, subcategoryId));

  return Number(row?.value ?? 0) + 1;
}
