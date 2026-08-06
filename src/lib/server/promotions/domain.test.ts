import {
  evaluatePromotionCandidate,
  studentEventTypeForPromotionOutcome,
} from "@/lib/server/promotions/domain";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("promotion domain", () => {
  test("blocks promotion when no matching rule exists", () => {
    const result = evaluatePromotionCandidate({
      system: "school",
      enrollment: {
        schoolClassId: "class-1",
        schoolSectionId: "sec-a",
        madrassaSubcategoryId: null,
      },
      rules: [],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("No promotion rule found for current placement");
  });

  test("returns ready promotion when a school rule has a target class", () => {
    const result = evaluatePromotionCandidate({
      system: "school",
      enrollment: {
        schoolClassId: "class-1",
        schoolSectionId: "sec-a",
        madrassaSubcategoryId: null,
      },
      rules: [
        {
          id: "rule-1",
          system: "school",
          outcome: "promote",
          sourceSchoolClassId: "class-1",
          sourceMadrassaSubcategoryId: null,
          targetSchoolClassId: "class-2",
          targetMadrassaSubcategoryId: null,
        },
      ],
    });

    expect(result.status).toBe("ready");
    expect(result.target.schoolClassId).toBe("class-2");
  });

  test("returns repeat target as current placement", () => {
    const result = evaluatePromotionCandidate({
      system: "madrassa",
      enrollment: {
        schoolClassId: null,
        schoolSectionId: null,
        madrassaCategoryId: "cat-1",
        madrassaSubcategoryId: "sub-1",
        darja: "awwal",
      },
      rules: [
        {
          id: "rule-1",
          system: "madrassa",
          outcome: "repeat",
          sourceMadrassaSubcategoryId: "sub-1",
        },
      ],
    });

    expect(result.status).toBe("ready");
    expect(result.outcome).toBe("repeat");
    expect(result.target.madrassaSubcategoryId).toBe("sub-1");
    expect(result.target.darja).toBe("awwal");
  });

  test("blocks promote rules with missing target placement", () => {
    const result = evaluatePromotionCandidate({
      system: "school",
      enrollment: {
        schoolClassId: "class-1",
        schoolSectionId: null,
        madrassaSubcategoryId: null,
      },
      rules: [
        {
          id: "rule-1",
          system: "school",
          outcome: "promote",
          sourceSchoolClassId: "class-1",
        },
      ],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("Promotion rule is missing target class");
  });

  test("maps promotion outcome to student event type", () => {
    expect(studentEventTypeForPromotionOutcome("promote")).toBe("promotion_applied");
    expect(studentEventTypeForPromotionOutcome("repeat")).toBe("promotion_repeated");
    expect(studentEventTypeForPromotionOutcome("graduate")).toBe("promotion_graduated");
    expect(studentEventTypeForPromotionOutcome("dropout")).toBe("promotion_dropout");
    expect(studentEventTypeForPromotionOutcome("inactive")).toBe("promotion_inactive");
  });
});
