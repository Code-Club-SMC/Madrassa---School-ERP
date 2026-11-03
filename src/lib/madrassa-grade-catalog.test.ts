import {
  findMadrassaGrade,
  MADRASSA_GRADE_CATALOG,
  madrassaGradesForSection,
  getCatalogSubcategories,
  buildMadrassaCategories,
} from "@/lib/madrassa-grade-catalog";
import { CANONICAL_SCHOOL_CLASSES } from "@/lib/admission.server";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("madrassa grade catalog", () => {
  test("keeps grade ids unique", () => {
    const ids = MADRASSA_GRADE_CATALOG.map((grade) => grade.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("separates boys and girls nazira grades", () => {
    expect(madrassaGradesForSection("baneen", ["nazira"]).map((grade) => grade.id)).toEqual([
      "bn-nazira-1",
      "bn-nazira-2",
      "bn-nazira-3",
      "bn-nazira-4",
      "bn-nazira-5",
    ]);
    expect(madrassaGradesForSection("banat", ["nazira"]).map((grade) => grade.id)).toEqual([
      "bt-nazira-1",
      "bt-nazira-2",
      "bt-nazira-3",
      "bt-nazira-4",
    ]);
  });

  test("resolves duplicate grade labels within the requested section", () => {
    expect(findMadrassaGrade("درجہ اولی", "baneen")?.id).toBe("bn-dars-ula");
    expect(findMadrassaGrade("درجہ اولی", "banat")?.id).toBe("bt-dars-ula");
  });

  test("getCatalogSubcategories reliably provides classes for male and female sections", () => {
    const maleSubs = getCatalogSubcategories("male");
    expect(maleSubs.length).toBeGreaterThan(0);
    expect(maleSubs.some((s) => s.id === "bn-hifz-1")).toBe(true);
    expect(maleSubs.some((s) => s.id === "bn-nazira-1")).toBe(true);
    expect(maleSubs.some((s) => s.id === "bn-dars-ula")).toBe(true);

    const femaleSubs = getCatalogSubcategories("female");
    expect(femaleSubs.length).toBeGreaterThan(0);
    expect(femaleSubs.some((s) => s.id === "bt-nazira-1")).toBe(true);
    expect(femaleSubs.some((s) => s.id === "bt-dars-ula")).toBe(true);
  });

  test("buildMadrassaCategories produces valid categories containing subcategories", () => {
    const categories = buildMadrassaCategories();
    expect(categories.length).toBeGreaterThan(0);
    for (const cat of categories) {
      expect(cat.subcategories.length).toBeGreaterThan(0);
      expect(cat.name).toBeTruthy();
      expect(cat.nameUrdu).toBeTruthy();
    }
  });

  test("CANONICAL_SCHOOL_CLASSES includes full grade progression compatible with all genders", () => {
    expect(CANONICAL_SCHOOL_CLASSES.length).toBeGreaterThanOrEqual(10);
    const codes = CANONICAL_SCHOOL_CLASSES.map((c) => c.code);
    expect(codes).toContain("NUR");
    expect(codes).toContain("KG");
    expect(codes).toContain("I");
    expect(codes).toContain("X");

    // Must be mixed or neutral so both boys and girls sections can display them
    const maleAllowed = CANONICAL_SCHOOL_CLASSES.filter((c) => {
      const g = (c.gender || "").toLowerCase();
      return !g || g === "mixed" || g === "both" || g === "all" || g === "male";
    });
    expect(maleAllowed.length).toBe(CANONICAL_SCHOOL_CLASSES.length);

    const femaleAllowed = CANONICAL_SCHOOL_CLASSES.filter((c) => {
      const g = (c.gender || "").toLowerCase();
      return !g || g === "mixed" || g === "both" || g === "all" || g === "female";
    });
    expect(femaleAllowed.length).toBe(CANONICAL_SCHOOL_CLASSES.length);
  });
});
