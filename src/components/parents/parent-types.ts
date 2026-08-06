import type { NotificationItem } from "@/components/notifications/notification-types";

export type GuardianDashboardPayload = {
  guardians: Array<{
    id: string;
    name: string;
    nameUrdu: string | null;
    phone: string | null;
    email: string | null;
    cnic: string | null;
    address: string | null;
    status: string;
  }>;
  students: ParentStudent[];
  notifications: NotificationItem[];
  summary: {
    studentCount: number;
    totalOutstandingPaisa: number;
    unreadNotifications: number;
    averageAttendanceRate: number | null;
  };
};

export type ParentStudent = {
  id: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  gender: string;
  status: string;
  guardian: {
    id: string;
    name: string;
    nameUrdu: string | null;
    phone: string | null;
    email: string | null;
    relation: string;
    isPrimary: boolean;
  };
  enrollment: {
    id: string;
    rollNo: string;
    admissionNo: string;
    status: string;
    institutionId: string;
    institutionName: string;
    institutionNameUrdu: string;
    programId: string;
    programName: string;
    programNameUrdu: string;
    system: "school" | "madrassa";
    groupLabel: string;
    darja: string | null;
  };
  fees: {
    totalChargedPaisa: number;
    totalConcessionPaisa: number;
    totalPaidPaisa: number;
    totalRefundedPaisa: number;
    totalReversedPaisa: number;
    outstandingPaisa: number;
  };
  attendance: {
    marked: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    attendanceRate: number | null;
  };
  latestResult: {
    examId: string;
    examName: string;
    examNameUrdu: string;
    academicYear: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    status: string;
    position: number | null;
    publishedAt: string | null;
  } | null;
  timeline: Array<{
    id: string;
    type: string;
    message: string | null;
    metadata: Record<string, unknown> | null;
    actorName: string | null;
    createdAt: string;
  }>;
};

export type GuardianAccountsPayload = {
  guardians: GuardianAccount[];
  summary: {
    total: number;
    linked: number;
    unlinked: number;
  };
};

export type GuardianAccount = {
  id: string;
  name: string;
  nameUrdu: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  userId: string | null;
  parentUserEmail: string | null;
  parentUserUsername: string | null;
  students: Array<{
    id: string;
    name: string;
    nameUrdu: string;
    rollNo: string | null;
    relation: string | null;
    isPrimary: boolean | null;
  }>;
};
