import {
  hasTimetableConflict,
  normalizeSalaryPaisa,
  timesOverlap,
  validateTeacherPlacement,
} from "@/lib/server/teachers/domain";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("teacher domain helpers", () => {
  test("detects overlapping timetable periods", () => {
    expect(timesOverlap("08:00", "08:40", "08:39", "09:10")).toBe(true);
    expect(timesOverlap("08:00", "08:40", "08:40", "09:10")).toBe(false);
    expect(timesOverlap("09:00", "10:00", "08:00", "09:01")).toBe(true);
  });

  test("rejects inverted timetable periods", () => {
    expect(() => timesOverlap("10:00", "09:00", "08:00", "09:00")).toThrow(
      "Start time must be before end time",
    );
  });

  test("rejects invalid timetable format", () => {
    expect(() => timesOverlap("8:00", "09:00", "10:00", "11:00")).toThrow("Time must use HH:mm format");
    expect(() => timesOverlap("08:00", "25:00", "10:00", "11:00")).toThrow("Time must use HH:mm format");
  });

  test("validates school placement fields", () => {
    expect(() =>
      validateTeacherPlacement({
        system: "school",
        institutionId: "inst",
        programId: "program",
        schoolClassId: "class",
        schoolSectionId: "section",
        madrassaCategoryId: null,
        madrassaSubcategoryId: null,
      }),
    ).not.toThrow();
  });

  test("rejects school placement without section", () => {
    expect(() =>
      validateTeacherPlacement({
        system: "school",
        institutionId: "inst",
        programId: "program",
        schoolClassId: "class",
        schoolSectionId: null,
        madrassaCategoryId: null,
        madrassaSubcategoryId: null,
      }),
    ).toThrow("School teacher assignment requires class and section");
  });

  test("rejects school placement with madrassa fields", () => {
    expect(() =>
      validateTeacherPlacement({
        system: "school",
        institutionId: "inst",
        programId: "program",
        schoolClassId: "class",
        schoolSectionId: "section",
        madrassaCategoryId: "category",
        madrassaSubcategoryId: null,
      }),
    ).toThrow("School teacher assignment cannot include madrassa placement");
  });

  test("validates madrassa placement fields", () => {
    expect(() =>
      validateTeacherPlacement({
        system: "madrassa",
        institutionId: "inst",
        programId: "program",
        schoolClassId: null,
        schoolSectionId: null,
        madrassaCategoryId: "category",
        madrassaSubcategoryId: "subcategory",
      }),
    ).not.toThrow();
  });

  test("rejects madrassa placement without darja", () => {
    expect(() =>
      validateTeacherPlacement({
        system: "madrassa",
        institutionId: "inst",
        programId: "program",
        schoolClassId: null,
        schoolSectionId: null,
        madrassaCategoryId: "category",
        madrassaSubcategoryId: null,
      }),
    ).toThrow("Madrassa teacher assignment requires category and darja");
  });

  test("normalizes missing salary to zero paisa", () => {
    expect(normalizeSalaryPaisa(undefined)).toBe(0);
    expect(normalizeSalaryPaisa(null)).toBe(0);
    expect(normalizeSalaryPaisa(4500000)).toBe(4500000);
  });

  test("rejects invalid salary values", () => {
    expect(() => normalizeSalaryPaisa(-1)).toThrow("Salary must be a non-negative integer paisa amount");
    expect(() => normalizeSalaryPaisa(10.5)).toThrow("Salary must be a non-negative integer paisa amount");
  });

  test("finds active timetable conflict for same teacher and weekday", () => {
    expect(
      hasTimetableConflict(
        [
          { id: "p1", weekday: 1, startTime: "08:00", endTime: "08:40", active: true },
          { id: "p2", weekday: 2, startTime: "08:00", endTime: "08:40", active: true },
          { id: "p3", weekday: 1, startTime: "09:00", endTime: "09:40", active: false },
        ],
        { weekday: 1, startTime: "08:30", endTime: "09:00", ignorePeriodId: null },
      ),
    ).toBe(true);
  });

  test("ignores current period and inactive periods when editing timetable", () => {
    expect(
      hasTimetableConflict(
        [
          { id: "p1", weekday: 1, startTime: "08:00", endTime: "08:40", active: true },
          { id: "p2", weekday: 1, startTime: "08:10", endTime: "08:35", active: false },
        ],
        { weekday: 1, startTime: "08:10", endTime: "08:35", ignorePeriodId: "p1" },
      ),
    ).toBe(false);
  });
});
