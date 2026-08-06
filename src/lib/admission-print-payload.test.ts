import { buildAdmissionPrintPayload } from "@/lib/admission-print-payload";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("admission print payload", () => {
  test("merges saved admission numbers into the printable form", () => {
    const payload = buildAdmissionPrintPayload(
      { name: "عبداللہ", req_darja: "bn-dars-ula" },
      {
        application: {
          id: "app-1",
          refNo: "ADM-REQ-0001",
          submittedAt: "2026-07-27T10:00:00.000Z",
          madrassaSubcategoryId: "bn-dars-sania",
        },
        student: {
          id: "student-1",
          admissionNo: "ADM-0001",
          rollNo: "QD1-0001",
        },
      },
    );

    expect(payload).toMatchObject({
      form_no: "ADM-REQ-0001",
      adm_no: "ADM-0001",
      roll_no: "QD1-0001",
      adm_date: "2026-07-27",
      req_darja: "bn-dars-ula",
      shoba: "bn-dars-sania",
    });
  });

  test("uses backend admission number over stale form values", () => {
    const payload = buildAdmissionPrintPayload(
      { form_no: "manual-form", adm_no: "manual-adm", roll_no: "manual-roll" },
      {
        application: { id: "app-1", refNo: "server-ref" },
        student: { id: "student-1", admissionNo: "server-adm", rollNo: "server-roll" },
      },
    );

    expect(payload.form_no).toBe("manual-form");
    expect(payload.adm_no).toBe("server-adm");
    expect(payload.roll_no).toBe("manual-roll");
  });

  test("does not use form reference as admission number", () => {
    const payload = buildAdmissionPrintPayload(
      { name: "عبداللہ" },
      {
        application: { id: "app-1", refNo: "ADM-REQ-0001" },
        student: { id: "student-1", rollNo: "QD1-0001" },
      },
    );

    expect(payload.form_no).toBe("ADM-REQ-0001");
    expect(payload.adm_no).toBe("");
    expect(payload.roll_no).toBe("QD1-0001");
  });
});
