import { admissionErrorResponse } from "./errors";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("admissionErrorResponse", () => {
  test("maps duplicate admission numbers to a safe message", async () => {
    const error = new Error("Failed query");
    Object.assign(error, {
      cause: {
        code: "23505",
        constraint: "admission_applications_ref_no_unique",
      },
    });

    const response = admissionErrorResponse(error);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("داخلہ نمبر بنانے میں مسئلہ ہوا، دوبارہ کوشش کریں");
  });

  test("maps missing madrassa grade foreign keys to a safe message", async () => {
    const response = admissionErrorResponse({
      code: "23503",
      constraint: "admission_applications_madrassa_subcategory_id_madrassa_subcategories_id_fk",
    });
    const payload = await response.json();

    expect(payload.error).toBe("منتخب کردہ مدرسہ درجہ موجود نہیں، درجات کی ترتیب دوبارہ لوڈ کریں");
  });
});
