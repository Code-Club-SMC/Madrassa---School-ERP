import { resolveSchoolClassId } from "@/lib/server/admission/catalog";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("admission catalog resolution", () => {
  test("does not resolve madrassa darja ids as school classes", () => {
    expect(resolveSchoolClassId("bn-idadiya-awwal")).toBeNull();
    expect(resolveSchoolClassId("bt-tarjuma")).toBeNull();
  });

  test("resolves real school class ids and labels", () => {
    expect(resolveSchoolClassId("nursery")).toBe("nursery");
    expect(resolveSchoolClassId("جماعت پنجم")).toBe("c5");
  });
});
