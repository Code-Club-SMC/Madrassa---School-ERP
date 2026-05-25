import type { AttendanceRecord, AttendanceStatus } from "@/types";
import { students } from "@/mock/students";

/** Deterministic attendance generator (~90 days) per student. Skips Fridays (off-day). */
export function generateAttendance(studentId: string, days = 90): AttendanceRecord[] {
  const out: AttendanceRecord[] = [];
  const today = new Date();
  // Simple deterministic pseudo-random based on student id + day index.
  let seed = 0;
  for (let i = 0; i < studentId.length; i++) seed = (seed * 31 + studentId.charCodeAt(i)) >>> 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() === 5) continue; // Friday off
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = (seed % 1000) / 1000;
    let status: AttendanceStatus;
    if (r > 0.13) status = "present";
    else if (r > 0.08) status = "late";
    else if (r > 0.04) status = "absent";
    else status = "leave";
    out.push({
      id: `att-${studentId}-${i}`,
      studentId,
      date: d.toISOString().slice(0, 10),
      status,
    });
  }
  return out;
}

/** Aggregate attendance percentage for a student over the last N days. */
export function attendancePercent(studentId: string, days = 30): number {
  const recs = generateAttendance(studentId, days);
  if (recs.length === 0) return 0;
  const present = recs.filter((r) => r.status === "present" || r.status === "late").length;
  return Math.round((present / recs.length) * 1000) / 10;
}

/** Daily attendance summary for the last 7 days (for dashboards). */
export const attendanceLast7 = (() => {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return Array.from({ length: 7 }).map((_, i) => {
    const day = labels[i];
    let total = 0;
    let present = 0;
    for (const s of students.slice(0, 12)) {
      const recs = generateAttendance(s.id, 7);
      const rec = recs[i];
      if (!rec) continue;
      total++;
      if (rec.status === "present" || rec.status === "late") present++;
    }
    return { day, rate: total ? Math.round((present / total) * 100) : 0 };
  });
})();