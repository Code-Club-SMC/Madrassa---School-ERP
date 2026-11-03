import { describe, expect, it } from "bun:test";
import { createHmac } from "node:crypto";
import {
  listSchoolClasses,
  createSchoolClass,
  updateSchoolClass,
  deleteSchoolClass,
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

function createMockSuperAdminRequest(url: string, init?: RequestInit) {
  const secret = process.env.SESSION_SECRET || "msmis_erp_fallback_secret_key_2026_super_secure";
  const payload = {
    userId: "test-admin-1",
    email: "superadmin@msmis.pk",
    role: "super_admin",
    name: "Super Admin",
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", secret).update(base64).digest("base64");
  const cookie = `msmis_session=${base64}.${signature}`;

  const headers = new Headers(init?.headers);
  headers.set("cookie", cookie);

  return new Request(url, {
    ...init,
    headers,
  });
}

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

  it("createSchoolClass persists a new school class for boys and girls institutions without throwing", async () => {
    const adminReq = createMockSuperAdminRequest("http://localhost:3000/api/academic/school/classes", {
      method: "POST",
    });

    // 1. Add male class
    const maleClass = await createSchoolClass(adminReq, {
      institutionId: "al_qasim_academy",
      code: "G11",
      name: "Grade 11",
      nameUrdu: "گیارہویں جماعت",
      fee: 5000,
    });

    expect(maleClass.id).toBeDefined();
    expect(maleClass.institutionId).toBe("al_qasim_academy");
    expect(maleClass.gender).toBe("male");
    expect(maleClass.name).toBe("Grade 11");

    // 2. Add female class
    const femaleClass = await createSchoolClass(adminReq, {
      institutionId: "jamia_zainab_banat",
      code: "ZG11",
      name: "Grade 11 Girls",
      nameUrdu: "گیارہویں جماعت برائے طالبات",
      fee: 5000,
    });

    expect(femaleClass.id).toBeDefined();
    expect(femaleClass.institutionId).toBe("jamia_zainab_banat");
    expect(femaleClass.gender).toBe("female");

    // 3. Verify they are listed
    const maleClassesReq = new Request("http://localhost:3000/api/academic/school/classes?institutionId=al_qasim_academy");
    const maleClasses = await listSchoolClasses(maleClassesReq);
    expect(maleClasses.some((c) => c.id === maleClass.id)).toBe(true);

    const femaleClassesReq = new Request("http://localhost:3000/api/academic/school/classes?institutionId=jamia_zainab_banat");
    const femaleClasses = await listSchoolClasses(femaleClassesReq);
    expect(femaleClasses.some((c) => c.id === femaleClass.id)).toBe(true);

    // 4. Update the class
    const updated = await updateSchoolClass(adminReq, maleClass.id, {
      fee: 5500,
      active: true,
    });
    expect(updated.fee).toBe(5500);

    // 5. Clean up by deleting test classes
    await deleteSchoolClass(adminReq, maleClass.id);
    await deleteSchoolClass(adminReq, femaleClass.id);

    // Verify deletion
    const finalClasses = await listSchoolClasses(maleClassesReq);
    expect(finalClasses.some((c) => c.id === maleClass.id)).toBe(false);
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

