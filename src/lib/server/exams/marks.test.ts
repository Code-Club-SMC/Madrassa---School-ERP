import { marksSaveSchema } from "./service";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("exam marks validation and parsing", () => {
  test("accepts valid marks input and coerces numeric string", () => {
    const parsed = marksSaveSchema.safeParse({
      examSubjectId: "es-1",
      rows: [
        {
          studentId: "s1",
          enrollmentId: "e1",
          attendanceStatus: "present",
          obtainedMarks: "85",
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rows[0].obtainedMarks).toBe(85);
    }
  });

  test("accepts decimal marks and allows absent students with null marks", () => {
    const parsed = marksSaveSchema.safeParse({
      examSubjectId: "es-1",
      rows: [
        {
          studentId: "s1",
          enrollmentId: "e1",
          attendanceStatus: "present",
          obtainedMarks: 45.5,
        },
        {
          studentId: "s2",
          enrollmentId: "e2",
          attendanceStatus: "absent",
          obtainedMarks: null,
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rows[0].obtainedMarks).toBe(45.5);
      expect(parsed.data.rows[1].obtainedMarks).toBeNull();
    }
  });

  test("rejects negative marks", () => {
    const parsed = marksSaveSchema.safeParse({
      examSubjectId: "es-1",
      rows: [
        {
          studentId: "s1",
          enrollmentId: "e1",
          attendanceStatus: "present",
          obtainedMarks: -5,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

