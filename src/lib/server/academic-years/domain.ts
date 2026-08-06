import type {
  AcademicYearCalendarType,
  AcademicYearStatus,
  AcademicYearSystem,
} from "@/db/schema/academic-years";
import { HttpError } from "@/lib/server/http";

export function assertValidAcademicYearDates(startDate: string, endDate: string) {
  const start = dateOnlyValue(startDate);
  const end = dateOnlyValue(endDate);

  if (!start || !end) throw new HttpError("تعلیمی سال کی تاریخیں درست نہیں", 400);
  if (end <= start) throw new HttpError("اختتامی تاریخ آغاز کے بعد ہونی چاہیے", 400);
}

export function nextAcademicYearStatus(
  current: AcademicYearStatus,
  action: "activate_self" | "activate_other" | "lock" | "archive",
): AcademicYearStatus {
  if (action === "activate_self") return "active";
  if (action === "activate_other") return current === "active" ? "archived" : current;
  if (action === "lock") return "locked";
  return "archived";
}

export function assertAcademicYearCalendar(
  system: AcademicYearSystem,
  calendarType: AcademicYearCalendarType,
) {
  const expected = defaultCalendarTypeForSystem(system);
  if (calendarType !== expected) {
    throw new HttpError(
      `${systemLabel(system)} تعلیمی سال کے لیے ${calendarLabel(expected)} کیلنڈر لازم ہے`,
      400,
    );
  }
}

export function defaultCalendarTypeForSystem(system: AcademicYearSystem): AcademicYearCalendarType {
  return system === "madrassa" ? "hijri" : "gregorian";
}

export function assertActiveAcademicYear<T extends { id: string }>(
  year: T | null | undefined,
  system?: AcademicYearSystem,
): T {
  if (!year) {
    throw new HttpError(
      system ? `فعال ${systemLabel(system)} تعلیمی سال موجود نہیں` : "فعال تعلیمی سال موجود نہیں",
      409,
    );
  }
  return year;
}

export function isAcademicYearEditable(status: AcademicYearStatus) {
  return status === "upcoming" || status === "active";
}

export function assertAcademicYearEditable(status: AcademicYearStatus) {
  if (!isAcademicYearEditable(status)) throw new HttpError("تعلیمی سال مقفل ہے", 409);
}

function dateOnlyValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function systemLabel(system: AcademicYearSystem) {
  return system === "madrassa" ? "مدرسہ" : "اسکول";
}

function calendarLabel(calendarType: AcademicYearCalendarType) {
  return calendarType === "hijri" ? "ہجری" : "شمسی";
}
