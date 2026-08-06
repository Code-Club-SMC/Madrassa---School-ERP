import { HttpError } from "@/lib/server/http";

export type TeacherSystem = "school" | "madrassa";

export type TeacherPlacementInput = {
  system: TeacherSystem;
  institutionId: string;
  programId: string;
  schoolClassId?: string | null;
  schoolSectionId?: string | null;
  madrassaCategoryId?: string | null;
  madrassaSubcategoryId?: string | null;
};

export type TimetableConflictRow = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

function minutes(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new HttpError("Time must use HH:mm format", 400);

  const [hours, mins] = value.split(":").map(Number);
  if (hours > 23 || mins > 59) throw new HttpError("Time must use HH:mm format", 400);

  return hours * 60 + mins;
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const startA = minutes(aStart);
  const endA = minutes(aEnd);
  const startB = minutes(bStart);
  const endB = minutes(bEnd);

  if (startA >= endA || startB >= endB) throw new HttpError("Start time must be before end time", 400);

  return startA < endB && startB < endA;
}

export function validateTimeRange(startTime: string, endTime: string) {
  timesOverlap(startTime, endTime, startTime, endTime);
}

export function hasTimetableConflict(
  rows: TimetableConflictRow[],
  next: { weekday: number; startTime: string; endTime: string; ignorePeriodId?: string | null },
) {
  return rows.some((row) => {
    if (!row.active) return false;
    if (next.ignorePeriodId && row.id === next.ignorePeriodId) return false;
    if (row.weekday !== next.weekday) return false;
    return timesOverlap(row.startTime, row.endTime, next.startTime, next.endTime);
  });
}

export function validateTeacherPlacement(input: TeacherPlacementInput) {
  if (!input.institutionId || !input.programId) {
    throw new HttpError("Institution and program are required", 400);
  }

  if (input.system === "school") {
    if (!input.schoolClassId || !input.schoolSectionId) {
      throw new HttpError("School teacher assignment requires class and section", 400);
    }
    if (input.madrassaCategoryId || input.madrassaSubcategoryId) {
      throw new HttpError("School teacher assignment cannot include madrassa placement", 400);
    }
    return;
  }

  if (!input.madrassaCategoryId || !input.madrassaSubcategoryId) {
    throw new HttpError("Madrassa teacher assignment requires category and darja", 400);
  }
  if (input.schoolClassId || input.schoolSectionId) {
    throw new HttpError("Madrassa teacher assignment cannot include school placement", 400);
  }
}

export function normalizeSalaryPaisa(value: number | null | undefined) {
  if (value == null) return 0;
  if (!Number.isInteger(value) || value < 0) {
    throw new HttpError("Salary must be a non-negative integer paisa amount", 400);
  }
  return value;
}
