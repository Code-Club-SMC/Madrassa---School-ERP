import {
  assertAcademicYearCalendar,
  assertAcademicYearEditable,
  assertActiveAcademicYear,
  assertValidAcademicYearDates,
  defaultCalendarTypeForSystem,
  nextAcademicYearStatus,
} from "@/lib/server/academic-years/domain";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("academic year domain", () => {
  test("rejects academic year end date before start date", () => {
    expect(() => assertValidAcademicYearDates("2026-08-01", "2026-07-31")).toThrow(
      "اختتامی تاریخ آغاز کے بعد ہونی چاہیے",
    );
  });

  test("rejects invalid academic year dates", () => {
    expect(() => assertValidAcademicYearDates("2026/08/01", "2027-07-31")).toThrow(
      "تعلیمی سال کی تاریخیں درست نہیں",
    );
  });

  test("activating upcoming year archives previous active year", () => {
    expect(nextAcademicYearStatus("active", "activate_other")).toBe("archived");
  });

  test("activating selected year makes it active", () => {
    expect(nextAcademicYearStatus("upcoming", "activate_self")).toBe("active");
  });

  test("active academic year is required before creating new enrollments", () => {
    expect(() => assertActiveAcademicYear(null)).toThrow("فعال تعلیمی سال موجود نہیں");
    expect(() => assertActiveAcademicYear(null, "madrassa")).toThrow(
      "فعال مدرسہ تعلیمی سال موجود نہیں",
    );
  });

  test("allows edits for active and upcoming years only", () => {
    expect(() => assertAcademicYearEditable("active")).not.toThrow();
    expect(() => assertAcademicYearEditable("upcoming")).not.toThrow();
    expect(() => assertAcademicYearEditable("locked")).toThrow("تعلیمی سال مقفل ہے");
    expect(() => assertAcademicYearEditable("archived")).toThrow("تعلیمی سال مقفل ہے");
  });

  test("defaults school years to Gregorian and madrassa years to Hijri", () => {
    expect(defaultCalendarTypeForSystem("school")).toBe("gregorian");
    expect(defaultCalendarTypeForSystem("madrassa")).toBe("hijri");
  });

  test("rejects calendar types that do not match the academic-year system", () => {
    expect(() => assertAcademicYearCalendar("school", "gregorian")).not.toThrow();
    expect(() => assertAcademicYearCalendar("madrassa", "hijri")).not.toThrow();
    expect(() => assertAcademicYearCalendar("school", "hijri")).toThrow(
      "اسکول تعلیمی سال کے لیے شمسی کیلنڈر لازم ہے",
    );
    expect(() => assertAcademicYearCalendar("madrassa", "gregorian")).toThrow(
      "مدرسہ تعلیمی سال کے لیے ہجری کیلنڈر لازم ہے",
    );
  });
});
