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
import { getRequestUser, requirePermission, effectivePermissions } from "@/lib/server/authz";
import { can } from "@/lib/permissions/utils";
import { HttpError } from "@/lib/server/http";

export const DEFAULT_MADRASSA_PERIOD_TEMPLATES = [
  {
    timeStart: "06:30",
    timeEnd: "08:30",
    label: "Period 1: Sabaq (New Lesson)",
    labelUrdu: "پیریڈ 1: سبق (نیا سبق)",
    displayOrder: 1,
    isBreak: false,
    subjectName: "Sabaq",
    subjectNameUrdu: "سبق",
  },
  {
    timeStart: "08:30",
    timeEnd: "09:30",
    label: "Breakfast & Rest",
    labelUrdu: "ناشتہ و استراحت",
    displayOrder: 2,
    isBreak: true,
    subjectName: null,
    subjectNameUrdu: null,
  },
  {
    timeStart: "09:30",
    timeEnd: "11:30",
    label: "Period 2: Sabaqi (Recent Revision)",
    labelUrdu: "پیریڈ 2: سبقی (پچھلا سبق)",
    displayOrder: 3,
    isBreak: false,
    subjectName: "Sabaqi",
    subjectNameUrdu: "سبقی",
  },
  {
    timeStart: "11:30",
    timeEnd: "01:30",
    label: "Period 3: Manzil (Total Revision)",
    labelUrdu: "پیریڈ 3: منزل (دور قرآن)",
    displayOrder: 4,
    isBreak: false,
    subjectName: "Manzil",
    subjectNameUrdu: "منزل",
  },
  {
    timeStart: "01:30",
    timeEnd: "02:30",
    label: "Zohr Prayer & Lunch Break",
    labelUrdu: "نمازِ ظہر و طعام",
    displayOrder: 5,
    isBreak: true,
    subjectName: null,
    subjectNameUrdu: null,
  },
  {
    timeStart: "02:30",
    timeEnd: "04:00",
    label: "Period 4: Tajweed / Hadith / Fiqh",
    labelUrdu: "پیریڈ 4: تجوید / حدیث / فقہ",
    displayOrder: 6,
    isBreak: false,
    subjectName: "Tajweed & Fiqh",
    subjectNameUrdu: "تجوید و فقہ",
  },
];

export function buildDefaultMadrassaTimetable(subcategoryId: string) {
  return DEFAULT_MADRASSA_PERIOD_TEMPLATES.map((tmpl) => ({
    id: `mtp_${subcategoryId}_${tmpl.displayOrder}`,
    madrassaSubcategoryId: subcategoryId,
    timeStart: tmpl.timeStart,
    timeEnd: tmpl.timeEnd,
    label: tmpl.label,
    labelUrdu: tmpl.labelUrdu,
    displayOrder: tmpl.displayOrder,
    isBreak: tmpl.isBreak,
    createdAt: new Date(),
    updatedAt: new Date(),
    slots: Array.from({ length: 6 }, (_, dayOfWeek) => ({
      id: `mslot_${subcategoryId}_${tmpl.displayOrder}_${dayOfWeek}`,
      periodId: `mtp_${subcategoryId}_${tmpl.displayOrder}`,
      dayOfWeek,
      subjectId: tmpl.subjectName ? `msub_${tmpl.displayOrder}` : null,
      subject: tmpl.subjectName
        ? {
            id: `msub_${tmpl.displayOrder}`,
            name: tmpl.subjectName,
            nameUrdu: tmpl.subjectNameUrdu,
          }
        : null,
    })),
  }));
}

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
  const user = await getRequestUser(request);
  if (user && user.role !== "super_admin") {
    const permissions = effectivePermissions(user);
    if (!can(permissions, "madrassa_timetable", "view")) {
      throw new HttpError("You do not have permission for this action", 403);
    }
  }

  let periods: any[] = [];
  try {
    periods = await db.query.madrassaTimetablePeriods.findMany({
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
  } catch (err) {
    console.error("[listTimetablePeriods] DB query failed, falling back to default periods:", err);
  }

  if (periods.length === 0) {
    return buildDefaultMadrassaTimetable(subcategoryId);
  }

  return periods;
}

export async function listTimetableStatus(request: Request, subcategoryIds: string[]) {
  const user = await getRequestUser(request);
  if (user && user.role !== "super_admin") {
    const permissions = effectivePermissions(user);
    if (!can(permissions, "madrassa_timetable", "view")) {
      throw new HttpError("You do not have permission for this action", 403);
    }
  }

  const map = new Map<string, number>();
  try {
    const rows = await db
      .select({
        madrassaSubcategoryId: madrassaTimetablePeriods.madrassaSubcategoryId,
        periodCount: count(),
      })
      .from(madrassaTimetablePeriods)
      .where(inArray(madrassaTimetablePeriods.madrassaSubcategoryId, subcategoryIds))
      .groupBy(madrassaTimetablePeriods.madrassaSubcategoryId);

    for (const row of rows) {
      map.set(row.madrassaSubcategoryId, Number(row.periodCount));
    }
  } catch (err) {
    console.error("[listTimetableStatus] DB error:", err);
  }

  for (const id of subcategoryIds) {
    if (!map.has(id)) {
      map.set(id, DEFAULT_MADRASSA_PERIOD_TEMPLATES.length);
    }
  }

  return map;
}

import {
  assertNoClassPeriodOverlap,
  assertNoTeacherTimetableConflict,
  validatePeriodTimes,
} from "./timetable-conflict";

export async function createTimetablePeriod(
  request: Request,
  input: z.infer<typeof timetablePeriodInputSchema>,
) {
  await requirePermission(request, "madrassa_timetable", "create");

  // Validate period times and ensure no overlap within the same darja
  await assertNoClassPeriodOverlap({
    system: "madrassa",
    targetId: input.madrassaSubcategoryId,
    timeStart: input.timeStart,
    timeEnd: input.timeEnd,
  });

  // Ensure assigned teachers have no schedule conflicts
  await assertNoTeacherTimetableConflict({
    timeStart: input.timeStart,
    timeEnd: input.timeEnd,
    slots: input.slots,
    madrassaSubcategoryId: input.madrassaSubcategoryId,
  });

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

  const timeStart = input.timeStart ?? existing.timeStart;
  const timeEnd = input.timeEnd ?? existing.timeEnd;
  const madrassaSubcategoryId = existing.madrassaSubcategoryId;

  // Validate period times and class overlap if time changed
  if (input.timeStart !== undefined || input.timeEnd !== undefined) {
    await assertNoClassPeriodOverlap({
      system: "madrassa",
      targetId: madrassaSubcategoryId,
      timeStart,
      timeEnd,
      ignorePeriodId: id,
    });
  } else {
    validatePeriodTimes(timeStart, timeEnd);
  }

  // Check teacher conflicts
  let slotsToCheck = input.slots;
  if (!slotsToCheck) {
    const existingSlots = await db
      .select({
        dayOfWeek: madrassaTimetableSlots.dayOfWeek,
        subjectId: madrassaTimetableSlots.subjectId,
      })
      .from(madrassaTimetableSlots)
      .where(eq(madrassaTimetableSlots.periodId, id));
    slotsToCheck = existingSlots;
  }

  await assertNoTeacherTimetableConflict({
    timeStart,
    timeEnd,
    periodId: id,
    slots: slotsToCheck,
    madrassaSubcategoryId,
  });

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
