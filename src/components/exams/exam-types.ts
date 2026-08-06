export type ExamSystem = "school" | "madrassa";
export type ExamStatus = "draft" | "active" | "locked" | "published";
export type ExamType = "monthly" | "quarterly" | "halfyearly" | "annual" | "sahmahi" | "nisfussana" | "salanah";
export type ExamAttendanceStatus = "present" | "absent" | "leave";

export type ExamSubject = {
  id: string;
  system: ExamSystem;
  schoolClassId: string | null;
  madrassaSubcategoryId: string | null;
  code: string;
  name: string;
  nameUrdu: string;
  group: string;
  totalMarks: number;
  passingMarks: number;
  displayOrder: number;
  active: boolean;
};

export type ExamSessionSubject = {
  id: string;
  subjectId: string;
  code: string;
  name: string;
  nameUrdu: string;
  totalMarks: number;
  passingMarks: number;
  examDate: string | null;
  startTime: string | null;
  endTime: string | null;
  displayOrder: number;
  locked: boolean;
};

export type ExamSession = {
  id: string;
  system: ExamSystem;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  schoolClassId: string | null;
  schoolSectionId: string | null;
  madrassaCategoryId: string | null;
  madrassaSubcategoryId: string | null;
  academicYear: string;
  type: ExamType;
  name: string;
  nameUrdu: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  groupLabel: string;
  subjects: ExamSessionSubject[];
  studentCount: number;
  publishedAt: string | null;
};

export type MarksEntryStudent = {
  id: string;
  enrollmentId: string;
  rollNo: string;
  admissionNo: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  groupLabel: string;
  mark: {
    attendanceStatus: ExamAttendanceStatus;
    obtainedMarks: number | null;
    notes: string | null;
    status: "draft" | "locked";
  } | null;
};

export type MarksEntryPayload = {
  exam: ExamSession;
  subject: ExamSessionSubject;
  students: MarksEntryStudent[];
};

export type DmcPayload = {
  exam: ExamSession;
  student: {
    id: string;
    name: string;
    nameUrdu: string;
    fatherName: string;
    rollNo: string;
    admissionNo: string;
    groupLabel: string;
  };
  result: {
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    status: "pass" | "fail";
    position: number | null;
  };
  subjects: Array<{
    code: string;
    name: string;
    nameUrdu: string;
    totalMarks: number;
    passingMarks: number;
    obtainedMarks: number | null;
    attendanceStatus: ExamAttendanceStatus;
  }>;
};

export type TranscriptPayload = {
  student: {
    id: string;
    name: string;
    nameUrdu: string;
    fatherName: string;
  };
  years: Array<{
    academicYear: string;
    classLabel: string;
    annualResult: {
      examName: string;
      grade: string;
      status: "pass" | "fail";
      percentageTimes100: number;
    } | null;
    averagePercentage: number;
    finalStatus: "pass" | "fail";
    exams: Array<{
      examName: string;
      examType: string;
      obtainedMarks: number;
      totalMarks: number;
      percentageTimes100: number;
      grade: string;
      status: "pass" | "fail";
    }>;
  }>;
};

export type ExamHall = {
  id: string;
  system: ExamSystem;
  name: string;
  nameUrdu: string | null;
  rows: number;
  cols: number;
  capacity: number;
  aisleEveryRow: number;
  aisleEveryCol: number;
  active: boolean;
};

export type SeatingPlanPayload = {
  exam: ExamSession;
  plan: {
    id: string;
    examId: string;
    version: number;
    gap: number;
    seed: string;
    status: "draft" | "locked";
    violationCount: number;
    unseatedStudents: Array<{ studentId: string; enrollmentId: string; rollNo: string }>;
    generatedAt: string;
    lockedAt: string | null;
    halls: Array<{
      id: string;
      name: string;
      rows: number;
      cols: number;
      assignments: Array<{
        id: string;
        studentId: string;
        enrollmentId: string;
        rowNo: number;
        colNo: number;
        seatLabel: string;
        placementLabel: string;
        studentName: string;
        studentNameUrdu: string;
        rollNo: string;
        admissionNo: string;
      }>;
    }>;
  } | null;
};

export type ExamReportPayload = {
  rows: Array<{
    examId: string;
    examName: string;
    examNameUrdu: string;
    system: ExamSystem;
    academicYear: string;
    studentId: string;
    studentName: string;
    studentNameUrdu: string;
    fatherName: string;
    rollNo: string;
    admissionNo: string;
    obtainedMarks: number;
    totalMarks: number;
    percentageTimes100: number;
    percentage: number;
    grade: string;
    status: "pass" | "fail";
    position: number | null;
    groupLabel: string;
  }>;
  summary: {
    total: number;
    pass: number;
    fail: number;
    passRate: number;
    averagePercentage: number;
  };
  gradeDistribution: Array<{ grade: string; count: number }>;
  positions: ExamReportPayload["rows"];
  failList: ExamReportPayload["rows"];
};
