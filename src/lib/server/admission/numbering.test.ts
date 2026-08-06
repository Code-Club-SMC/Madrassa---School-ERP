import { visibleNumberScopeCode, visibleScopedNumberPrefix } from "./numbering";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("admission numbering", () => {
  test("adds school class code to visible numbers", () => {
    expect(
      visibleScopedNumberPrefix(
        "ADM-REQ",
        { programId: "al_qasim_school", schoolClassId: "c1" },
        "SCH",
      ),
    ).toBe("ADM-REQ-SCH-C1");
  });

  test("uses madrassa roll prefix for visible numbers", () => {
    expect(
      visibleScopedNumberPrefix(
        "ADM-REQ",
        { programId: "zainab_dars_nizami", madrassaSubcategoryId: "bt-tarjuma" },
        "ZTR",
      ),
    ).toBe("ADM-REQ-ZTR");
  });

  test("roll number scope code is unique for school classes sharing one program prefix", () => {
    expect(visibleNumberScopeCode({ schoolClassId: "c1" }, "SCH")).toBe("SCH-C1");
    expect(visibleNumberScopeCode({ schoolClassId: "c2" }, "SCH")).toBe("SCH-C2");
  });
});
