import {
  findMadrassaGrade,
  MADRASSA_GRADE_CATALOG,
  madrassaGradesForSection,
} from "@/lib/madrassa-grade-catalog";

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
});
