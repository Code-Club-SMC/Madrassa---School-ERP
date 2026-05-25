import type { AuditEntry } from "@/types";

export const auditLog: AuditEntry[] = [
  { id: "a-01", at: "2025-05-24T10:14:00Z", userId: "u-01", userName: "Admin", action: "student.create", entity: "Student", entityId: "S-0048", details: "Admission accepted — Hifz section" },
  { id: "a-02", at: "2025-05-24T09:55:00Z", userId: "u-02", userName: "Mufti Abdullah", action: "fee.collect", entity: "FeeRecord", entityId: "F-1207", details: "Received PKR 4,500" },
  { id: "a-03", at: "2025-05-23T16:31:00Z", userId: "u-01", userName: "Admin", action: "exam.publish", entity: "ExamSeries", entityId: "E-203", details: "Sah Mahi 2025 results published" },
  { id: "a-04", at: "2025-05-23T14:02:00Z", userId: "u-03", userName: "Mr. Saleem", action: "attendance.mark", entity: "Class", entityId: "C-09", details: "Marked 32 students" },
  { id: "a-05", at: "2025-05-23T11:20:00Z", userId: "u-01", userName: "Admin", action: "concession.grant", entity: "FeeRecord", entityId: "F-1198", details: "50% sibling concession" },
  { id: "a-06", at: "2025-05-22T17:48:00Z", userId: "u-04", userName: "Qari Imran", action: "hifz.update", entity: "Student", entityId: "S-0021", details: "Juz 14 completed" },
  { id: "a-07", at: "2025-05-22T13:09:00Z", userId: "u-01", userName: "Admin", action: "user.create", entity: "User", entityId: "U-12", details: "Teacher account provisioned" },
  { id: "a-08", at: "2025-05-21T09:00:00Z", userId: "u-01", userName: "Admin", action: "promotion.run", entity: "AcademicYear", entityId: "AY-2025", details: "Promoted 142 students" },
  { id: "a-09", at: "2025-05-20T15:33:00Z", userId: "u-02", userName: "Mufti Abdullah", action: "inventory.adjust", entity: "InventoryItem", entityId: "I-44", details: "Stock +120 (Qaida)" },
  { id: "a-10", at: "2025-05-20T10:11:00Z", userId: "u-01", userName: "Admin", action: "salary.disburse", entity: "Teacher", entityId: "T-08", details: "May 2025 salary paid" },
  { id: "a-11", at: "2025-05-19T18:22:00Z", userId: "u-01", userName: "Admin", action: "website.publish", entity: "Page", entityId: "P-about", details: "About page updated" },
  { id: "a-12", at: "2025-05-19T08:45:00Z", userId: "u-05", userName: "Sister Aisha", action: "attendance.mark", entity: "Class", entityId: "C-04-B", details: "Marked 28 students (Banat)" },
  { id: "a-13", at: "2025-05-18T12:00:00Z", userId: "u-01", userName: "Admin", action: "holiday.add", entity: "Holiday", entityId: "H-15", details: "Winter Break scheduled" },
  { id: "a-14", at: "2025-05-17T14:14:00Z", userId: "u-01", userName: "Admin", action: "exit.process", entity: "Student", entityId: "S-0032", details: "Transfer certificate issued" },
  { id: "a-15", at: "2025-05-16T11:01:00Z", userId: "u-01", userName: "Admin", action: "auth.login", entity: "User", entityId: "U-01", details: "Login from 103.x.x.x" },
];