import { getVariant } from "@/lib/admission-variants";
import { buildAdmissionSampleData } from "@/lib/admission-sample-data";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("admission sample data", () => {
  test("uses male sample data for boys madrassa forms", () => {
    const variant = getVariant("madrassa-boys-general");
    if (!variant) throw new Error("boys madrassa variant missing");

    const sample = buildAdmissionSampleData(variant);

    expect(sample.name).toBe("محمد عبداللہ");
    expect(sample.req_darja.startsWith("bn-")).toBe(true);
    expect(sample.candidate_darja.startsWith("bn-")).toBe(true);
  });

  test("uses female sample data for girls madrassa forms", () => {
    const variant = getVariant("madrassa-girls-general");
    if (!variant) throw new Error("girls madrassa variant missing");

    const sample = buildAdmissionSampleData(variant);

    expect(sample.name).toBe("عائشہ فاطمہ");
    expect(sample.req_darja.startsWith("bt-")).toBe(true);
    expect(sample.candidate_darja.startsWith("bt-")).toBe(true);
  });

  test("uses female sample data for girls school forms", () => {
    const variant = getVariant("school-girls");
    if (!variant) throw new Error("girls school variant missing");

    const sample = buildAdmissionSampleData(variant);

    expect(sample.name).toBe("عائشہ فاطمہ");
    expect(sample.class).toBe("چہارم");
  });
});
