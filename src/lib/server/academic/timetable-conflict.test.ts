import { describe, expect, it } from "bun:test";
import {
  ADMIN_DAY_NAMES,
  adminDayToTeacherWeekday,
  dateToTimetableDayOfWeek,
  parseMinutes,
  teacherWeekdayToAdminDay,
  timesOverlap,
  validatePeriodTimes,
} from "./timetable-conflict";

describe("timetable day of week mapping", () => {
  it("maps Gregorian dates accurately to timetable dayOfWeek index (Sat=0 .. Thu=5, Fri=null)", () => {
    // 2026-10-17 is Saturday
    expect(dateToTimetableDayOfWeek("2026-10-17")).toBe(0);

    // 2026-10-18 is Sunday
    expect(dateToTimetableDayOfWeek("2026-10-18")).toBe(1);

    // 2026-10-19 is Monday
    expect(dateToTimetableDayOfWeek("2026-10-19")).toBe(2);

    // 2026-10-20 is Tuesday
    expect(dateToTimetableDayOfWeek("2026-10-20")).toBe(3);

    // 2026-10-21 is Wednesday
    expect(dateToTimetableDayOfWeek("2026-10-21")).toBe(4);

    // 2026-10-22 is Thursday
    expect(dateToTimetableDayOfWeek("2026-10-22")).toBe(5);

    // 2026-10-23 is Friday (holiday / weekend)
    expect(dateToTimetableDayOfWeek("2026-10-23")).toBeNull();
  });

  it("handles invalid or malformed date strings gracefully", () => {
    expect(dateToTimetableDayOfWeek("invalid-date")).toBeNull();
    expect(dateToTimetableDayOfWeek("")).toBeNull();
  });

  it("correctly converts between admin timetable day and teacher profile weekday", () => {
    // Admin 0 (Saturday) -> Teacher weekday 6 (Saturday)
    expect(adminDayToTeacherWeekday(0)).toBe(6);
    expect(teacherWeekdayToAdminDay(6)).toBe(0);

    // Admin 1 (Sunday) -> Teacher weekday 0 (Sunday)
    expect(adminDayToTeacherWeekday(1)).toBe(0);
    expect(teacherWeekdayToAdminDay(0)).toBe(1);

    // Admin 2 (Monday) -> Teacher weekday 1 (Monday)
    expect(adminDayToTeacherWeekday(2)).toBe(1);
    expect(teacherWeekdayToAdminDay(1)).toBe(2);

    // Admin 3 (Tuesday) -> Teacher weekday 2 (Tuesday)
    expect(adminDayToTeacherWeekday(3)).toBe(2);
    expect(teacherWeekdayToAdminDay(2)).toBe(3);

    // Admin 4 (Wednesday) -> Teacher weekday 3 (Wednesday)
    expect(adminDayToTeacherWeekday(4)).toBe(3);
    expect(teacherWeekdayToAdminDay(3)).toBe(4);

    // Admin 5 (Thursday) -> Teacher weekday 4 (Thursday)
    expect(adminDayToTeacherWeekday(5)).toBe(4);
    expect(teacherWeekdayToAdminDay(4)).toBe(5);

    // Teacher weekday 5 (Friday) -> No admin slot
    expect(teacherWeekdayToAdminDay(5)).toBeNull();
  });
});

describe("timetable period time validation and overlap", () => {
  it("parses valid 24h HH:mm times to minutes and normalizes single digits", () => {
    expect(parseMinutes("00:00")).toBe(0);
    expect(parseMinutes("08:30")).toBe(510);
    expect(parseMinutes("8:30")).toBe(510);
    expect(parseMinutes("13:45")).toBe(825);
    expect(parseMinutes("23:59")).toBe(1439);
  });

  it("rejects invalid time formats and out-of-range hours or minutes", () => {
    expect(() => parseMinutes("25:00")).toThrow();
    expect(() => parseMinutes("12:60")).toThrow();
    expect(() => parseMinutes("not-a-time")).toThrow();
  });

  it("validates that start time must be earlier than end time", () => {
    expect(() => validatePeriodTimes("08:00", "08:45")).not.toThrow();
    expect(() => validatePeriodTimes("08:45", "08:45")).toThrow("Start time must be earlier than end time");
    expect(() => validatePeriodTimes("09:00", "08:30")).toThrow("Start time must be earlier than end time");
  });

  it("accurately detects overlapping and consecutive periods", () => {
    // Consecutive periods do not overlap
    expect(timesOverlap("08:00", "08:45", "08:45", "09:30")).toBe(false);
    expect(timesOverlap("08:45", "09:30", "08:00", "08:45")).toBe(false);

    // Non-adjacent periods do not overlap
    expect(timesOverlap("08:00", "08:45", "10:00", "10:45")).toBe(false);

    // Partially overlapping periods
    expect(timesOverlap("08:00", "08:45", "08:30", "09:15")).toBe(true);
    expect(timesOverlap("08:30", "09:15", "08:00", "08:45")).toBe(true);

    // Completely enclosed periods
    expect(timesOverlap("08:00", "11:00", "09:00", "10:00")).toBe(true);
    expect(timesOverlap("09:00", "10:00", "08:00", "11:00")).toBe(true);

    // Identical periods
    expect(timesOverlap("08:00", "08:45", "08:00", "08:45")).toBe(true);
  });
});

