export type AttendanceStatus = "present" | "absent" | "late" | "leave";
export type AttendanceSystem = "school" | "madrassa";

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

export type AttendanceRosterStudent = {
  id: string;
  enrollmentId: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  rollNo: string;
  admissionNo: string;
  institutionName: string;
  institutionNameUrdu: string;
  groupLabel: string;
  attendance: {
    id: string;
    studentId: string;
    enrollmentId: string;
    date: string;
    status: AttendanceStatus;
    notes: string | null;
    updatedAt: string;
  } | null;
};

export type AttendanceRosterPayload = {
  date: string;
  students: AttendanceRosterStudent[];
  summary: AttendanceSummary;
};

export type AttendanceMarkRow = {
  studentId: string;
  enrollmentId: string;
  status: AttendanceStatus;
  notes?: string;
};
