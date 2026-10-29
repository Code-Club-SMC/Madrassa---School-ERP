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
import { getRequestUser, requirePermission, effectivePermissions } from "@/lib/server/authz";
import { can } from "@/lib/permissions/utils";
import { HttpError } from "@/lib/server/http";

export const DEFAULT_SCHOOL_PERIOD_TEMPLATES = [
  {
    timeStart: "08:00",
    timeEnd: "08:45",
    label: "Period 1: Assembly & Nazira",
    labelUrdu: "پیریڈ 1: اسمبلی و ناظرہ",
    displayOrder: 1,
    isBreak: false,
    subjectName: "Nazira Quran",
    subjectNameUrdu: "ناظرہ قرآن",
  },
  {
    timeStart: "08:45",
    timeEnd: "09:30",
    label: "Period 2: English",
    labelUrdu: "پیریڈ 2: انگریزی",
    displayOrder: 2,
    isBreak: false,
    subjectName: "English",
    subjectNameUrdu: "انگریزی",
  },
  {
    timeStart: "09:30",
    timeEnd: "10:15",
    label: "Period 3: Mathematics",
    labelUrdu: "پیریڈ 3: ریاضی",
    displayOrder: 3,
    isBreak: false,
    subjectName: "Mathematics",
    subjectNameUrdu: "ریاضی",
  },
  {
    timeStart: "10:15",
    timeEnd: "11:00",
    label: "Period 4: Urdu",
    labelUrdu: "پیریڈ 4: اردو",
    displayOrder: 4,
    isBreak: false,
    subjectName: "Urdu",
    subjectNameUrdu: "اردو",
  },
  {
    timeStart: "11:00",
    timeEnd: "11:30",
    label: "Recess / Break",
    labelUrdu: "تفریح و وقفہ",
    displayOrder: 5,
    isBreak: true,
    subjectName: null,
    subjectNameUrdu: null,
  },
  {
    timeStart: "11:30",
    timeEnd: "12:15",
    label: "Period 5: General Science",
    labelUrdu: "پیریڈ 5: جنرل سائنس",
    displayOrder: 6,
    isBreak: false,
    subjectName: "General Science",
    subjectNameUrdu: "جنرل سائنس",
  },
  {
    timeStart: "12:15",
    timeEnd: "01:00",
    label: "Period 6: Islamiat",
    labelUrdu: "پیریڈ 6: اسلامیات",
    displayOrder: 7,
    isBreak: false,
    subjectName: "Islamiat",
    subjectNameUrdu: "اسلامیات",
  },
  {
    timeStart: "01:00",
    timeEnd: "01:45",
    label: "Period 7: Social Studies",
    labelUrdu: "پیریڈ 7: معاشرتی علوم",
    displayOrder: 8,
    isBreak: false,
    subjectName: "Social Studies",
    subjectNameUrdu: "معاشرتی علوم",
  },
];

export function buildDefaultSchoolTimetable(schoolClassId: string) {
  return DEFAULT_SCHOOL_PERIOD_TEMPLATES.map((tmpl) => ({
    id: `stp_${schoolClassId}_${tmpl.displayOrder}`,
    schoolClassId,
    timeStart: tmpl.timeStart,
    timeEnd: tmpl.timeEnd,
    label: tmpl.label,
    labelUrdu: tmpl.labelUrdu,
    displayOrder: tmpl.displayOrder,
    isBreak: tmpl.isBreak,
    createdAt: new Date(),
    updatedAt: new Date(),
    slots: Array.from({ length: 6 }, (_, dayOfWeek) => ({
      id: `slot_${schoolClassId}_${tmpl.displayOrder}_${dayOfWeek}`,
      periodId: `stp_${schoolClassId}_${tmpl.displayOrder}`,
      dayOfWeek,
      subjectId: tmpl.subjectName ? `sub_${tmpl.displayOrder}` : null,
      subject: tmpl.subjectName
        ? {
            id: `sub_${tmpl.displayOrder}`,
            name: tmpl.subjectName,
            nameUrdu: tmpl.subjectNameUrdu,
          }
        : null,
    })),
  }));
}

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
  const user = await getRequestUser(request);
  if (user && user.role !== "super_admin") {
    const permissions = effectivePermissions(user);
    if (!can(permissions, "school_timetable", "view")) {
      throw new HttpError("You do not have permission for this action", 403);
    }
  }

  let periods: any[] = [];
  try {
    periods = await db.query.schoolTimetablePeriods.findMany({
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
  } catch (err) {
    console.error("[listSchoolTimetablePeriods] DB query failed, falling back to default periods:", err);
  }

  if (periods.length === 0) {
    return buildDefaultSchoolTimetable(schoolClassId);
  }

  return periods;
}

export async function listSchoolTimetableStatus(request: Request, schoolClassIds: string[]) {
  const user = await getRequestUser(request);
  if (user && user.role !== "super_admin") {
    const permissions = effectivePermissions(user);
    if (!can(permissions, "school_timetable", "view")) {
      throw new HttpError("You do not have permission for this action", 403);
    }
  }

  const map = new Map<string, number>();
  try {
    const rows = await db
      .select({
        schoolClassId: schoolTimetablePeriods.schoolClassId,
        periodCount: count(),
      })
      .from(schoolTimetablePeriods)
      .where(inArray(schoolTimetablePeriods.schoolClassId, schoolClassIds))
      .groupBy(schoolTimetablePeriods.schoolClassId);

    for (const row of rows) {
      map.set(row.schoolClassId, Number(row.periodCount));
    }
  } catch (err) {
    console.error("[listSchoolTimetableStatus] DB error:", err);
  }

  for (const id of schoolClassIds) {
    if (!map.has(id)) {
      map.set(id, DEFAULT_SCHOOL_PERIOD_TEMPLATES.length);
    }
  }

  return map;
}

import {
  assertNoClassPeriodOverlap,
  assertNoTeacherTimetableConflict,
  validatePeriodTimes,
} from "./timetable-conflict";

export async function createSchoolTimetablePeriod(
  request: Request,
  input: z.infer<typeof schoolTimetablePeriodInputSchema>,
) {
  await requirePermission(request, "school_timetable", "edit");

  // Validate period times and ensure no overlap within the same class
  await assertNoClassPeriodOverlap({
    system: "school",
    targetId: input.schoolClassId,
    timeStart: input.timeStart,
    timeEnd: input.timeEnd,
  });

  // Ensure assigned teachers have no schedule conflicts
  await assertNoTeacherTimetableConflict({
    timeStart: input.timeStart,
    timeEnd: input.timeEnd,
    slots: input.slots,
    schoolClassId: input.schoolClassId,
  });

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

  const timeStart = input.timeStart ?? existing[0].timeStart;
  const timeEnd = input.timeEnd ?? existing[0].timeEnd;
  const schoolClassId = existing[0].schoolClassId;

  // Validate period times and class overlap if time changed
  if (input.timeStart !== undefined || input.timeEnd !== undefined) {
    await assertNoClassPeriodOverlap({
      system: "school",
      targetId: schoolClassId,
      timeStart,
      timeEnd,
      ignorePeriodId: periodId,
    });
  } else {
    validatePeriodTimes(timeStart, timeEnd);
  }

  // Check teacher conflicts
  let slotsToCheck = input.slots;
  if (!slotsToCheck) {
    const existingSlots = await db
      .select({
        dayOfWeek: schoolTimetableSlots.dayOfWeek,
        subjectId: schoolTimetableSlots.subjectId,
      })
      .from(schoolTimetableSlots)
      .where(eq(schoolTimetableSlots.periodId, periodId));
    slotsToCheck = existingSlots;
  }

  await assertNoTeacherTimetableConflict({
    timeStart,
    timeEnd,
    periodId,
    slots: slotsToCheck,
    schoolClassId,
  });

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
