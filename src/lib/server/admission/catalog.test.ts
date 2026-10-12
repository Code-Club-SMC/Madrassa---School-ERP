import { matchSchoolClass, resolveSchoolClassId } from "@/lib/server/admission/catalog";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("admission catalog resolution", () => {
  const sampleClasses = [
    { id: "nursery", name: "Nursery", nameUrdu: "نرسری", govtEquivalent: null },
    { id: "c5", name: "Class 5", nameUrdu: "جماعت پنجم", govtEquivalent: "Primary" },
  ];

  test("does not resolve madrassa darja ids as school classes", () => {
    expect(matchSchoolClass("bn-dars-ula", sampleClasses)).toBeNull();
    expect(matchSchoolClass("bt-dars-ula", sampleClasses)).toBeNull();
  });

  test("resolves real school class ids and labels", () => {
    expect(matchSchoolClass("nursery", sampleClasses)).toBe("nursery");
    expect(matchSchoolClass("جماعت پنجم", sampleClasses)).toBe("c5");
    expect(matchSchoolClass("class 5", sampleClasses)).toBe("c5");
  });

  test("resolveSchoolClassId safely returns null on unknown class", async () => {
    expect(await resolveSchoolClassId(undefined)).toBeNull();
    expect(await resolveSchoolClassId("")).toBeNull();
  });
});
