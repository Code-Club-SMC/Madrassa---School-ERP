import { describe, expect, it } from "bun:test";
import {
  listSchoolClasses,
  listAcademicInstitutions,
  listAcademicPrograms,
  listMadrassaCategories,
  listMadrassaSubcategories,
} from "./service";
import {
  listSchoolTimetablePeriods,
  listSchoolTimetableStatus,
} from "./school-timetable";
import {
  listTimetablePeriods,
  listTimetableStatus,
} from "./timetable";

describe("Academic Service & Timetable Resilience", () => {
  it("listAcademicInstitutions loads institutions for unauthenticated request without throwing", async () => {
    const request = new Request("http://localhost:3000/api/academic/institutions");
    const institutions = await listAcademicInstitutions(request);
    expect(Array.isArray(institutions)).toBe(true);
    expect(institutions.length).toBeGreaterThanOrEqual(3);
    const names = institutions.map((i) => i.id);
    expect(names).toContain("al_qasim_academy");
    expect(names).toContain("jamia_qasmia_baneen");
    expect(names).toContain("jamia_zainab_banat");
  });

  it("listAcademicPrograms loads programs without throwing", async () => {
    const request = new Request("http://localhost:3000/api/academic/programs");
    const programs = await listAcademicPrograms(request);
    expect(Array.isArray(programs)).toBe(true);
    expect(programs.length).toBeGreaterThanOrEqual(5);
  });

  it("listSchoolClasses returns default school classes with enrollment and subject counts", async () => {
    const request = new Request("http://localhost:3000/api/academic/school/classes");
    const classes = await listSchoolClasses(request);
    expect(Array.isArray(classes)).toBe(true);
    expect(classes.length).toBeGreaterThanOrEqual(10);
    const nursery = classes.find((c) => c.name === "Nursery" || c.nameUrdu === "نرسری");
    expect(nursery).toBeDefined();
    expect(nursery?.subjectCount).toBeGreaterThan(0);
    expect(nursery?.enrollmentCount).toBeGreaterThanOrEqual(0);
  });

  it("listMadrassaCategories returns canonical categories and subcategories", async () => {
    const request = new Request("http://localhost:3000/api/academic/madrassa/categories");
    const categories = await listMadrassaCategories(request);
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThanOrEqual(3);
    const categoryIds = categories.map((c) => c.id);
    expect(categoryIds).toContain("dars_nizami");
    expect(categoryIds).toContain("hifz");
    expect(categoryIds).toContain("qaida_nazira");
  });

  it("listMadrassaSubcategories returns subcategories list", async () => {
    const request = new Request("http://localhost:3000/api/academic/madrassa/subcategories");
    const subcategories = await listMadrassaSubcategories(request);
    expect(Array.isArray(subcategories)).toBe(true);
    expect(subcategories.length).toBeGreaterThanOrEqual(10);
  });

  it("listSchoolTimetablePeriods returns structured timetable periods for a school class", async () => {
    const request = new Request("http://localhost:3000/api/academic/school/timetable?schoolClassId=class_1");
    const periods = await listSchoolTimetablePeriods(request, "class_1");
    expect(Array.isArray(periods)).toBe(true);
    expect(periods.length).toBeGreaterThanOrEqual(6);
    // Period 1
    const p1 = periods[0];
    expect(p1.timeStart).toBeDefined();
    expect(p1.timeEnd).toBeDefined();
    expect(p1.slots.length).toBe(6);
  });

  it("listSchoolTimetableStatus returns counts for class ids", async () => {
    const request = new Request("http://localhost:3000/api/academic/school/timetable");
    const status = await listSchoolTimetableStatus(request, ["class_1", "class_2"]);
    expect(status instanceof Map).toBe(true);
    expect(status.get("class_1")).toBeGreaterThanOrEqual(6);
    expect(status.get("class_2")).toBeGreaterThanOrEqual(6);
  });

  it("listTimetablePeriods returns structured periods for a madrassa subcategory", async () => {
    const request = new Request("http://localhost:3000/api/academic/madrassa/timetable?subcategoryId=hifz_1");
    const periods = await listTimetablePeriods(request, "hifz_1");
    expect(Array.isArray(periods)).toBe(true);
    expect(periods.length).toBeGreaterThanOrEqual(4);
    const p1 = periods[0];
    expect(p1.timeStart).toBeDefined();
    expect(p1.timeEnd).toBeDefined();
    expect(p1.slots.length).toBe(6);
  });

  it("listTimetableStatus returns counts for madrassa subcategory ids", async () => {
    const request = new Request("http://localhost:3000/api/academic/madrassa/timetable/status");
    const status = await listTimetableStatus(request, ["hifz_1", "nazira_boys_1"]);
    expect(status instanceof Map).toBe(true);
    expect(status.get("hifz_1")).toBeGreaterThanOrEqual(4);
    expect(status.get("nazira_boys_1")).toBeGreaterThanOrEqual(4);
  });
});

