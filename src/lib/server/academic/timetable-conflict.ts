import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { user as authUser } from "@/db/schema/auth";
import { examSubjects } from "@/db/schema/exams";
import { schoolClasses, madrassaSubcategories } from "@/db/schema/academic";
import { teacherAssignments, teacherProfiles, teacherTimetablePeriods } from "@/db/schema/teachers";
import {
  schoolTimetablePeriods,
  schoolTimetableSlots,
  madrassaTimetablePeriods,
  madrassaTimetableSlots,
} from "@/db/schema/timetable";
import { HttpError } from "@/lib/server/http";

export const ADMIN_DAY_NAMES: Array<{ en: string; ur: string }> = [
  { en: "Saturday", ur: "السبت" },
  { en: "Sunday", ur: "الأحد" },
  { en: "Monday", ur: "الإثنين" },
  { en: "Tuesday", ur: "الثلاثاء" },
  { en: "Wednesday", ur: "الأربعاء" },
  { en: "Thursday", ur: "الخميس" },
];

/**
 * Maps a Gregorian date string (YYYY-MM-DD) to a timetable slot day-of-week index (0..5):
 * 0 = Saturday (السبت)
 * 1 = Sunday (الأحد)
 * 2 = Monday (الإثنين)
 * 3 = Tuesday (الثلاثاء)
 * 4 = Wednesday (الأربعاء)
 * 5 = Thursday (الخميس)
 * Friday (5 in JS getDay) is the weekend holiday -> returns null.
 */
export function dateToTimetableDayOfWeek(dateString: string): number | null {
  const parts = dateString.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const jsDay = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  if (jsDay === 5) return null; // Friday (weekend/holiday)
  return jsDay === 6 ? 0 : jsDay + 1;
}

/**
 * Converts admin day (0=Sat..5=Thu) to teacher profile weekday (0=Sun..6=Sat).
 */
export function adminDayToTeacherWeekday(adminDay: number): number {
  return adminDay === 0 ? 6 : adminDay - 1;
}

/**
 * Converts teacher profile weekday (0=Sun..6=Sat) to admin day (0=Sat..5=Thu).
 * Friday (5) has no admin timetable slot and returns null.
 */
export function teacherWeekdayToAdminDay(weekday: number): number | null {
  if (weekday === 5) return null; // Friday
  return weekday === 6 ? 0 : weekday + 1;
}

export function normalizeTimeToHHMM(value: string): string {
  if (!value) return "00:00";
  const trimmed = value.trim();

  // If already standard HH:mm (e.g. "08:30" or "14:00")
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle "12 30" or "12-30" or "12.30"
  const separated = trimmed.replace(/[\s\.\-]+/, ":");
  if (/^\d{1,2}:\d{1,2}$/.test(separated)) {
    const [h, m] = separated.split(":").map(Number);
    const hours = Math.min(Math.max(h, 0), 23);
    const mins = Math.min(Math.max(m, 0), 59);
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  // Handle single number like "7", "8", "10", "12", "1", "2"
  if (/^\d{1,2}$/.test(trimmed)) {
    const num = Number(trimmed);
    let hours = num;
    if (num >= 1 && num <= 6) {
      hours = num + 12; // 1 PM -> 13:00, 2 PM -> 14:00 in school schedule
    }
    hours = Math.min(Math.max(hours, 0), 23);
    return `${String(hours).padStart(2, "0")}:00`;
  }

  return trimmed;
}

export function parseMinutes(value: string, fieldLabel = "Time"): number {
  const normalized = normalizeTimeToHHMM(value);
  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    throw new HttpError(`${fieldLabel} must use HH:mm format (e.g. 08:30)`, 400);
  }
  const [hours, mins] = normalized.split(":").map(Number);
  if (hours > 23 || mins > 59) {
    throw new HttpError(`${fieldLabel} must be a valid time (00:00 - 23:59)`, 400);
  }
  return hours * 60 + mins;
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const startA = parseMinutes(aStart, "Start time");
  const endA = parseMinutes(aEnd, "End time");
  const startB = parseMinutes(bStart, "Start time");
  const endB = parseMinutes(bEnd, "End time");

  if (startA >= endA || startB >= endB) {
    throw new HttpError("Start time must be earlier than end time", 400);
  }

  return startA < endB && startB < endA;
}

export function validatePeriodTimes(timeStart: string, timeEnd: string): void {
  const start = parseMinutes(timeStart, "Start time");
  const end = parseMinutes(timeEnd, "End time");
  if (start >= end) {
    throw new HttpError("Start time must be earlier than end time", 400);
  }
}

/**
 * Asserts that the proposed period does not overlap in time with another period
 * in the same class (school) or darja (madrassa).
 */
export async function assertNoClassPeriodOverlap(params: {
  system: "school" | "madrassa";
  targetId: string; // schoolClassId or madrassaSubcategoryId
  timeStart: string;
  timeEnd: string;
  ignorePeriodId?: string | null;
}) {
  validatePeriodTimes(params.timeStart, params.timeEnd);

  if (params.system === "school") {
    const existing = await db
      .select({
        id: schoolTimetablePeriods.id,
        label: schoolTimetablePeriods.label,
        timeStart: schoolTimetablePeriods.timeStart,
        timeEnd: schoolTimetablePeriods.timeEnd,
      })
      .from(schoolTimetablePeriods)
      .where(eq(schoolTimetablePeriods.schoolClassId, params.targetId));

    for (const p of existing) {
      if (params.ignorePeriodId && p.id === params.ignorePeriodId) continue;
      if (timesOverlap(params.timeStart, params.timeEnd, p.timeStart, p.timeEnd)) {
        throw new HttpError(
          `Period time (${params.timeStart} - ${params.timeEnd}) overlaps with existing period "${p.label}" (${p.timeStart} - ${p.timeEnd}) in this class.`,
          400,
        );
      }
    }
  } else {
    const existing = await db
      .select({
        id: madrassaTimetablePeriods.id,
        label: madrassaTimetablePeriods.label,
        timeStart: madrassaTimetablePeriods.timeStart,
        timeEnd: madrassaTimetablePeriods.timeEnd,
      })
      .from(madrassaTimetablePeriods)
      .where(eq(madrassaTimetablePeriods.madrassaSubcategoryId, params.targetId));

    for (const p of existing) {
      if (params.ignorePeriodId && p.id === params.ignorePeriodId) continue;
      if (timesOverlap(params.timeStart, params.timeEnd, p.timeStart, p.timeEnd)) {
        throw new HttpError(
          `Period time (${params.timeStart} - ${params.timeEnd}) overlaps with existing period "${p.label}" (${p.timeStart} - ${p.timeEnd}) in this class/darja.`,
          400,
        );
      }
    }
  }
}

export type ResolvedSlotTeacher = {
  dayOfWeek: number;
  subjectId: string;
  teacherProfileId: string;
  teacherName: string;
  subjectName: string;
};

/**
 * Resolves teacher profile IDs and user names for the provided subject slots in a class/darja.
 */
export async function resolveTeachersForSlots(
  slots: Array<{ dayOfWeek: number; subjectId?: string | null }>,
  context: { schoolClassId?: string; madrassaSubcategoryId?: string },
): Promise<ResolvedSlotTeacher[]> {
  const activeSlots = slots.filter(
    (s): s is { dayOfWeek: number; subjectId: string } => Boolean(s.subjectId),
  );
  if (activeSlots.length === 0) return [];

  const subjectIds = Array.from(new Set(activeSlots.map((s) => s.subjectId)));
  const subjects = await db
    .select({
      id: examSubjects.id,
      name: examSubjects.name,
      teacherId: examSubjects.teacherId,
    })
    .from(examSubjects)
    .where(inArray(examSubjects.id, subjectIds));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const assignmentClauses = [
    inArray(teacherAssignments.subjectId, subjectIds),
    eq(teacherAssignments.active, true),
  ];
  if (context.schoolClassId) {
    assignmentClauses.push(eq(teacherAssignments.schoolClassId, context.schoolClassId));
  } else if (context.madrassaSubcategoryId) {
    assignmentClauses.push(eq(teacherAssignments.madrassaSubcategoryId, context.madrassaSubcategoryId));
  }
  const assignments = await db
    .select({
      subjectId: teacherAssignments.subjectId,
      teacherProfileId: teacherAssignments.teacherProfileId,
    })
    .from(teacherAssignments)
    .where(and(...assignmentClauses));
  const assignmentMap = new Map(
    assignments
      .filter((a): a is { subjectId: string; teacherProfileId: string } => Boolean(a.subjectId))
      .map((a) => [a.subjectId, a.teacherProfileId]),
  );

  const teacherProfileIds = new Set<string>();
  for (const s of activeSlots) {
    const assignedTeacher = assignmentMap.get(s.subjectId);
    const directTeacher = subjectMap.get(s.subjectId)?.teacherId;
    const tId = assignedTeacher || directTeacher;
    if (tId) teacherProfileIds.add(tId);
  }

  if (teacherProfileIds.size === 0) return [];

  const teacherUsers = await db
    .select({
      profileId: teacherProfiles.id,
      name: authUser.name,
    })
    .from(teacherProfiles)
    .innerJoin(authUser, eq(authUser.id, teacherProfiles.userId))
    .where(inArray(teacherProfiles.id, Array.from(teacherProfileIds)));
  const teacherNameMap = new Map(teacherUsers.map((t) => [t.profileId, t.name]));

  const result: ResolvedSlotTeacher[] = [];
  for (const s of activeSlots) {
    const tId = assignmentMap.get(s.subjectId) || subjectMap.get(s.subjectId)?.teacherId;
    if (!tId) continue;
    const sub = subjectMap.get(s.subjectId);
    result.push({
      dayOfWeek: s.dayOfWeek,
      subjectId: s.subjectId,
      teacherProfileId: tId,
      teacherName: teacherNameMap.get(tId) || "Teacher",
      subjectName: sub?.name || "Subject",
    });
  }

  return result;
}

/**
 * Queries all subjects actively taught by a teacher (via direct subject assignment or explicit placement).
 */
async function getTeacherTaughtSubjects(teacherProfileId: string): Promise<{
  directSubjectIds: Set<string>;
  explicitAssignmentPairs: Map<string, Set<string>>; // key: "school:classId" or "madrassa:subcatId" -> Set of subjectIds
}> {
  const [direct, explicit] = await Promise.all([
    db
      .select({ id: examSubjects.id })
      .from(examSubjects)
      .where(and(eq(examSubjects.teacherId, teacherProfileId), eq(examSubjects.active, true))),
    db
      .select({
        system: teacherAssignments.system,
        schoolClassId: teacherAssignments.schoolClassId,
        madrassaSubcategoryId: teacherAssignments.madrassaSubcategoryId,
        subjectId: teacherAssignments.subjectId,
      })
      .from(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.teacherProfileId, teacherProfileId),
          eq(teacherAssignments.active, true),
        ),
      ),
  ]);

  const directSubjectIds = new Set(direct.map((d) => d.id));
  const explicitAssignmentPairs = new Map<string, Set<string>>();

  for (const a of explicit) {
    if (!a.subjectId) continue;
    const key = a.system === "school" ? `school:${a.schoolClassId}` : `madrassa:${a.madrassaSubcategoryId}`;
    let set = explicitAssignmentPairs.get(key);
    if (!set) {
      set = new Set();
      explicitAssignmentPairs.set(key, set);
    }
    set.add(a.subjectId);
  }

  return { directSubjectIds, explicitAssignmentPairs };
}

/**
 * Asserts that none of the teachers scheduled in the proposed period have a conflicting period
 * at the same time on the same day in:
 * 1) Other school timetable periods
 * 2) Other madrassa timetable periods
 * 3) Teacher explicit timetable periods (teacherTimetablePeriods)
 */
export async function assertNoTeacherTimetableConflict(params: {
  timeStart: string;
  timeEnd: string;
  periodId?: string | null;
  slots: Array<{ dayOfWeek: number; subjectId?: string | null }>;
  schoolClassId?: string;
  madrassaSubcategoryId?: string;
}) {
  validatePeriodTimes(params.timeStart, params.timeEnd);

  const slotTeachers = await resolveTeachersForSlots(params.slots, {
    schoolClassId: params.schoolClassId,
    madrassaSubcategoryId: params.madrassaSubcategoryId,
  });

  if (slotTeachers.length === 0) return;

  for (const st of slotTeachers) {
    const dayName = ADMIN_DAY_NAMES[st.dayOfWeek]?.en || `Day ${st.dayOfWeek}`;
    const dayNameUrdu = ADMIN_DAY_NAMES[st.dayOfWeek]?.ur || "";

    const { directSubjectIds, explicitAssignmentPairs } = await getTeacherTaughtSubjects(st.teacherProfileId);

    // 1. Check School Timetables
    const schoolSlots = await db
      .select({
        periodId: schoolTimetablePeriods.id,
        label: schoolTimetablePeriods.label,
        timeStart: schoolTimetablePeriods.timeStart,
        timeEnd: schoolTimetablePeriods.timeEnd,
        schoolClassId: schoolTimetablePeriods.schoolClassId,
        className: schoolClasses.name,
        subjectId: schoolTimetableSlots.subjectId,
        subjectName: examSubjects.name,
        subjectTeacherId: examSubjects.teacherId,
      })
      .from(schoolTimetablePeriods)
      .innerJoin(schoolTimetableSlots, eq(schoolTimetableSlots.periodId, schoolTimetablePeriods.id))
      .leftJoin(schoolClasses, eq(schoolClasses.id, schoolTimetablePeriods.schoolClassId))
      .leftJoin(examSubjects, eq(examSubjects.id, schoolTimetableSlots.subjectId))
      .where(
        and(
          eq(schoolTimetableSlots.dayOfWeek, st.dayOfWeek),
          eq(schoolTimetablePeriods.isBreak, false),
        ),
      );

    for (const row of schoolSlots) {
      if (params.periodId && row.periodId === params.periodId) continue;
      if (!row.subjectId) continue;

      // Check if this school slot is taught by this teacher
      const isExplicit = explicitAssignmentPairs.get(`school:${row.schoolClassId}`)?.has(row.subjectId);
      const isDirect = row.subjectTeacherId === st.teacherProfileId;
      if (isExplicit || isDirect) {
        if (timesOverlap(params.timeStart, params.timeEnd, row.timeStart, row.timeEnd)) {
          throw new HttpError(
            `Teacher "${st.teacherName}" is already assigned to a period on ${dayName} at ${row.timeStart} - ${row.timeEnd} (${row.className ?? "School"}: ${row.label}${row.subjectName ? ` - ${row.subjectName}` : ""}). A teacher cannot be assigned multiple periods at the same time.`,
            409,
          );
        }
      }
    }

    // 2. Check Madrassa Timetables
    const madrassaSlotsList = await db
      .select({
        periodId: madrassaTimetablePeriods.id,
        label: madrassaTimetablePeriods.label,
        timeStart: madrassaTimetablePeriods.timeStart,
        timeEnd: madrassaTimetablePeriods.timeEnd,
        madrassaSubcategoryId: madrassaTimetablePeriods.madrassaSubcategoryId,
        subcategoryName: madrassaSubcategories.name,
        subjectId: madrassaTimetableSlots.subjectId,
        subjectName: examSubjects.name,
        subjectTeacherId: examSubjects.teacherId,
      })
      .from(madrassaTimetablePeriods)
      .innerJoin(madrassaTimetableSlots, eq(madrassaTimetableSlots.periodId, madrassaTimetablePeriods.id))
      .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, madrassaTimetablePeriods.madrassaSubcategoryId))
      .leftJoin(examSubjects, eq(examSubjects.id, madrassaTimetableSlots.subjectId))
      .where(
        and(
          eq(madrassaTimetableSlots.dayOfWeek, st.dayOfWeek),
          eq(madrassaTimetablePeriods.isBreak, false),
        ),
      );

    for (const row of madrassaSlotsList) {
      if (params.periodId && row.periodId === params.periodId) continue;
      if (!row.subjectId) continue;

      const isExplicit = explicitAssignmentPairs.get(`madrassa:${row.madrassaSubcategoryId}`)?.has(row.subjectId);
      const isDirect = row.subjectTeacherId === st.teacherProfileId;
      if (isExplicit || isDirect) {
        if (timesOverlap(params.timeStart, params.timeEnd, row.timeStart, row.timeEnd)) {
          throw new HttpError(
            `Teacher "${st.teacherName}" is already assigned to a period on ${dayName} at ${row.timeStart} - ${row.timeEnd} (${row.subcategoryName ?? "Madrassa"}: ${row.label}${row.subjectName ? ` - ${row.subjectName}` : ""}). A teacher cannot be assigned multiple periods at the same time.`,
            409,
          );
        }
      }
    }

    // 3. Check Teacher Timetable Periods
    const teacherPeriods = await db
      .select({
        id: teacherTimetablePeriods.id,
        weekday: teacherTimetablePeriods.weekday,
        startTime: teacherTimetablePeriods.startTime,
        endTime: teacherTimetablePeriods.endTime,
      })
      .from(teacherTimetablePeriods)
      .where(
        and(
          eq(teacherTimetablePeriods.teacherProfileId, st.teacherProfileId),
          eq(teacherTimetablePeriods.active, true),
          eq(teacherTimetablePeriods.weekday, adminDayToTeacherWeekday(st.dayOfWeek)),
        ),
      );

    for (const tp of teacherPeriods) {
      if (timesOverlap(params.timeStart, params.timeEnd, tp.startTime, tp.endTime)) {
        throw new HttpError(
          `Teacher "${st.teacherName}" already has an assigned timetable period on ${dayName} at ${tp.startTime} - ${tp.endTime}. A teacher cannot be assigned multiple periods at the same time.`,
          409,
        );
      }
    }
  }
}

/**
 * Checks if a teacher has any existing class timetable slots that conflict with a proposed
 * teacherTimetablePeriod (called from teacher service).
 */
export async function assertTeacherTimetableConflictWithClassTimetables(
  teacherProfileId: string,
  next: { weekday: number; startTime: string; endTime: string; ignorePeriodId: string | null },
) {
  validatePeriodTimes(next.startTime, next.endTime);

  const adminDay = teacherWeekdayToAdminDay(next.weekday);
  if (adminDay === null) return; // Friday

  const dayName = ADMIN_DAY_NAMES[adminDay]?.en || `Day ${adminDay}`;
  const { explicitAssignmentPairs } = await getTeacherTaughtSubjects(teacherProfileId);

  // 1. Check School Timetables
  const schoolSlots = await db
    .select({
      periodId: schoolTimetablePeriods.id,
      label: schoolTimetablePeriods.label,
      timeStart: schoolTimetablePeriods.timeStart,
      timeEnd: schoolTimetablePeriods.timeEnd,
      schoolClassId: schoolTimetablePeriods.schoolClassId,
      className: schoolClasses.name,
      subjectId: schoolTimetableSlots.subjectId,
      subjectName: examSubjects.name,
      subjectTeacherId: examSubjects.teacherId,
    })
    .from(schoolTimetablePeriods)
    .innerJoin(schoolTimetableSlots, eq(schoolTimetableSlots.periodId, schoolTimetablePeriods.id))
    .leftJoin(schoolClasses, eq(schoolClasses.id, schoolTimetablePeriods.schoolClassId))
    .leftJoin(examSubjects, eq(examSubjects.id, schoolTimetableSlots.subjectId))
    .where(
      and(
        eq(schoolTimetableSlots.dayOfWeek, adminDay),
        eq(schoolTimetablePeriods.isBreak, false),
      ),
    );

  for (const row of schoolSlots) {
    if (!row.subjectId) continue;
    const isExplicit = explicitAssignmentPairs.get(`school:${row.schoolClassId}`)?.has(row.subjectId);
    const isDirect = row.subjectTeacherId === teacherProfileId;
    if (isExplicit || isDirect) {
      if (timesOverlap(next.startTime, next.endTime, row.timeStart, row.timeEnd)) {
        throw new HttpError(
          `Teacher is already assigned to a school period on ${dayName} at ${row.timeStart} - ${row.timeEnd} (${row.className ?? "School"}: ${row.label}${row.subjectName ? ` - ${row.subjectName}` : ""}).`,
          409,
        );
      }
    }
  }

  // 2. Check Madrassa Timetables
  const madrassaSlotsList = await db
    .select({
      periodId: madrassaTimetablePeriods.id,
      label: madrassaTimetablePeriods.label,
      timeStart: madrassaTimetablePeriods.timeStart,
      timeEnd: madrassaTimetablePeriods.timeEnd,
      madrassaSubcategoryId: madrassaTimetablePeriods.madrassaSubcategoryId,
      subcategoryName: madrassaSubcategories.name,
      subjectId: madrassaTimetableSlots.subjectId,
      subjectName: examSubjects.name,
      subjectTeacherId: examSubjects.teacherId,
    })
    .from(madrassaTimetablePeriods)
    .innerJoin(madrassaTimetableSlots, eq(madrassaTimetableSlots.periodId, madrassaTimetablePeriods.id))
    .leftJoin(madrassaSubcategories, eq(madrassaSubcategories.id, madrassaTimetablePeriods.madrassaSubcategoryId))
    .leftJoin(examSubjects, eq(examSubjects.id, madrassaTimetableSlots.subjectId))
    .where(
      and(
        eq(madrassaTimetableSlots.dayOfWeek, adminDay),
        eq(madrassaTimetablePeriods.isBreak, false),
      ),
    );

  for (const row of madrassaSlotsList) {
    if (!row.subjectId) continue;
    const isExplicit = explicitAssignmentPairs.get(`madrassa:${row.madrassaSubcategoryId}`)?.has(row.subjectId);
    const isDirect = row.subjectTeacherId === teacherProfileId;
    if (isExplicit || isDirect) {
      if (timesOverlap(next.startTime, next.endTime, row.timeStart, row.timeEnd)) {
        throw new HttpError(
          `Teacher is already assigned to a madrassa period on ${dayName} at ${row.timeStart} - ${row.timeEnd} (${row.subcategoryName ?? "Madrassa"}: ${row.label}${row.subjectName ? ` - ${row.subjectName}` : ""}).`,
          409,
        );
      }
    }
  }
}

