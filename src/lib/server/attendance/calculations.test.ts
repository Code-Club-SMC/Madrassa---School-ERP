import { attendanceTimelineEvent, summarizeAttendance } from "./calculations";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("attendance calculations", () => {
  test("summarizes roster counts and excludes leave from attendance-rate denominator", () => {
    const summary = summarizeAttendance(
      [
        { status: "present" },
        { status: "present" },
        { status: "late" },
        { status: "absent" },
        { status: "leave" },
      ],
      6,
    );

    expect(summary).toEqual({
      total: 6,
      marked: 5,
      unmarked: 1,
      present: 2,
      absent: 1,
      late: 1,
      leave: 1,
      attended: 3,
      attendanceRate: 75,
    });
  });

  test("does not create timeline noise for routine present marks", () => {
    expect(attendanceTimelineEvent(null, "present")).toBeNull();
    expect(attendanceTimelineEvent("present", "present")).toBeNull();
  });

  test("creates first-mark events for absent late and leave", () => {
    expect(attendanceTimelineEvent(null, "absent")).toBe("attendance_absent_marked");
    expect(attendanceTimelineEvent(null, "late")).toBe("attendance_late_marked");
    expect(attendanceTimelineEvent(null, "leave")).toBe("attendance_leave_marked");
  });

  test("creates correction event for meaningful status changes", () => {
    expect(attendanceTimelineEvent("absent", "present")).toBe("attendance_corrected");
    expect(attendanceTimelineEvent("present", "late")).toBe("attendance_corrected");
    expect(attendanceTimelineEvent("leave", "absent")).toBe("attendance_corrected");
  });
});
