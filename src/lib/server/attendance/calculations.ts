import type { StudentAttendanceStatus } from "@/db/schema/attendance";
import type { StudentEventType } from "@/lib/server/students/events";

export type AttendanceSummary = {
  total: number;
  marked: number;
  unmarked: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attended: number;
  attendanceRate: number;
};

export type AttendanceSummaryInput = {
  status: StudentAttendanceStatus | null | undefined;
};

export function summarizeAttendance(rows: AttendanceSummaryInput[], rosterTotal = rows.length): AttendanceSummary {
  const present = rows.filter((row) => row.status === "present").length;
  const absent = rows.filter((row) => row.status === "absent").length;
  const late = rows.filter((row) => row.status === "late").length;
  const leave = rows.filter((row) => row.status === "leave").length;
  const marked = present + absent + late + leave;
  const total = Math.max(rosterTotal, marked);
  const attended = present + late;
  const rateDenominator = present + late + absent;

  return {
    total,
    marked,
    unmarked: Math.max(total - marked, 0),
    present,
    absent,
    late,
    leave,
    attended,
    attendanceRate: rateDenominator ? Math.round((attended / rateDenominator) * 1000) / 10 : 0,
  };
}

export function attendanceTimelineEvent(
  previousStatus: StudentAttendanceStatus | null | undefined,
  nextStatus: StudentAttendanceStatus,
): StudentEventType | null {
  if (!previousStatus) {
    if (nextStatus === "absent") return "attendance_absent_marked";
    if (nextStatus === "late") return "attendance_late_marked";
    if (nextStatus === "leave") return "attendance_leave_marked";
    return null;
  }

  if (previousStatus === nextStatus) return null;
  if (previousStatus === "present" && nextStatus === "present") return null;
  return "attendance_corrected";
}
