import { resolveSchoolClassId } from "@/lib/server/admission/catalog";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("admission catalog resolution", () => {
  test("does not resolve madrassa darja ids as school classes", async () => {
    expect(await resolveSchoolClassId("bn-dars-ula")).toBeNull();
    expect(await resolveSchoolClassId("bt-dars-ula")).toBeNull();
  });

  test("resolves real school class ids and labels", async () => {
    expect(await resolveSchoolClassId("nursery")).toBe("nursery");
    expect(await resolveSchoolClassId("جماعت پنجم")).toBe("c5");
  });
});
