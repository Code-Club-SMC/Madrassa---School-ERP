import type {
  DmcPayload,
  ExamHall,
  ExamReportPayload,
  ExamSession,
  ExamSubject,
  ExamSystem,
  MarksEntryPayload,
  SeatingPlanPayload,
  TranscriptPayload,
} from "./exam-types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload as T;
}

export function listExamSubjects(input: {
  system: ExamSystem;
  schoolClassId?: string;
  madrassaSubcategoryId?: string;
  active?: boolean;
}) {
  const params = new URLSearchParams({ system: input.system });
  if (input.schoolClassId) params.set("schoolClassId", input.schoolClassId);
  if (input.madrassaSubcategoryId) params.set("madrassaSubcategoryId", input.madrassaSubcategoryId);
  if (input.active !== undefined) params.set("active", String(input.active));
  return requestJson<{ subjects: ExamSubject[] }>(`/api/exams/subjects?${params.toString()}`);
}

export function createExamSubject(input: {
  system: ExamSystem;
  schoolClassId?: string;
  madrassaSubcategoryId?: string;
  code: string;
  name: string;
  nameUrdu: string;
  group: string;
  totalMarks: number;
  passingMarks: number;
  displayOrder: number;
}) {
  return requestJson<{ subject: ExamSubject }>("/api/exams/subjects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateExamSubject(id: string, input: {
  system?: ExamSystem;
  schoolClassId?: string;
  madrassaSubcategoryId?: string;
  code?: string;
  name?: string;
  nameUrdu?: string;
  group?: string;
  totalMarks?: number;
  passingMarks?: number;
  displayOrder?: number;
  active?: boolean;
}) {
  return requestJson<{ subject: ExamSubject }>(`/api/exams/subjects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteExamSubject(id: string) {
  return requestJson<{ subject: ExamSubject }>(`/api/exams/subjects/${id}`, {
    method: "DELETE",
  });
}

export function listExamSessions(system: ExamSystem) {
  return requestJson<{ exams: ExamSession[] }>(`/api/exams/sessions?system=${system}`);
}

export function createExamSession(input: {
  system: ExamSystem;
  institutionId?: string;
  programId?: string;
  schoolClassId?: string;
  schoolSectionId?: string;
  madrassaCategoryId?: string;
  madrassaSubcategoryId?: string;
  academicYear?: string;
  type: string;
  name: string;
  nameUrdu: string;
  startDate: string;
  endDate: string;
  subjectIds: string[];
}) {
  return requestJson<{ exam: ExamSession }>("/api/exams/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getExamSession(id: string) {
  return requestJson<{ exam: ExamSession }>(`/api/exams/sessions/${id}`);
}

export function getMarksEntry(examId: string, examSubjectId: string) {
  return requestJson<MarksEntryPayload>(`/api/exams/sessions/${examId}/marks?examSubjectId=${examSubjectId}`);
}

export function saveMarks(examId: string, input: {
  examSubjectId: string;
  rows: Array<{
    studentId: string;
    enrollmentId: string;
    attendanceStatus: "present" | "absent" | "leave";
    obtainedMarks: number | null;
    notes?: string;
  }>;
}) {
  return requestJson<MarksEntryPayload>(`/api/exams/sessions/${examId}/marks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function lockExamSubject(examId: string, subjectId: string) {
  return requestJson<{ exam: ExamSession }>(`/api/exams/sessions/${examId}/subjects/${subjectId}/lock`, {
    method: "POST",
  });
}

export function publishExam(examId: string) {
  return requestJson<{ exam: ExamSession }>(`/api/exams/sessions/${examId}/publish`, { method: "POST" });
}

export function getDmc(examId: string, studentId: string) {
  return requestJson<DmcPayload>(`/api/exams/sessions/${examId}/dmc/${studentId}`);
}

export function getTranscript(studentId: string) {
  return requestJson<TranscriptPayload>(`/api/exams/students/${studentId}/transcript`);
}

export function listExamHalls(system: ExamSystem) {
  return requestJson<{ halls: ExamHall[] }>(`/api/exams/halls?system=${system}`);
}

export function createExamHall(input: {
  system: ExamSystem;
  name: string;
  nameUrdu?: string;
  rows: number;
  cols: number;
  aisleEveryRow: number;
  aisleEveryCol: number;
}) {
  return requestJson<{ hall: ExamHall }>("/api/exams/halls", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getSeatingPlan(examId: string) {
  return requestJson<SeatingPlanPayload>(`/api/exams/sessions/${examId}/seating`);
}

export function generateSeatingPlan(examId: string, input: { gap: number; seed?: string; allowUnseated: boolean }) {
  return requestJson<SeatingPlanPayload>(`/api/exams/sessions/${examId}/seating`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function lockSeatingPlan(examId: string, planId: string) {
  return requestJson<SeatingPlanPayload>(`/api/exams/sessions/${examId}/seating/${planId}/lock`, {
    method: "POST",
  });
}

export function getExamReport(input: { system?: ExamSystem | "both"; examId?: string; academicYear?: string }) {
  const params = new URLSearchParams();
  if (input.system) params.set("system", input.system);
  if (input.examId) params.set("examId", input.examId);
  if (input.academicYear) params.set("academicYear", input.academicYear);
  return requestJson<ExamReportPayload>(`/api/exams/reports/summary?${params.toString()}`);
}

export type TimetablePeriod = {
  id: string;
  madrassaSubcategoryId: string;
  timeStart: string;
  timeEnd: string;
  label: string;
  labelUrdu: string;
  displayOrder: number;
  isBreak: boolean;
  createdAt: string;
  updatedAt: string;
  slots: Array<{
    id: string;
    periodId: string;
    dayOfWeek: number;
    subjectId: string | null;
    createdAt: string;
    updatedAt: string;
    subject: ExamSubject | null;
  }>;
};

export function listTimetablePeriods(subcategoryId: string) {
  return requestJson<{ periods: TimetablePeriod[] }>(`/api/academic/madrassa/timetable?subcategoryId=${subcategoryId}`);
}

export function createTimetablePeriod(input: {
  madrassaSubcategoryId: string;
  timeStart: string;
  timeEnd: string;
  label: string;
  labelUrdu: string;
  isBreak?: boolean;
  slots: Array<{ dayOfWeek: number; subjectId: string | null }>;
}) {
  return requestJson<{ period: TimetablePeriod }>("/api/academic/madrassa/timetable", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTimetablePeriod(id: string, input: {
  timeStart?: string;
  timeEnd?: string;
  label?: string;
  labelUrdu?: string;
  isBreak?: boolean;
  slots?: Array<{ dayOfWeek: number; subjectId: string | null }>;
}) {
  return requestJson<{ period: TimetablePeriod }>(`/api/academic/madrassa/timetable/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTimetablePeriod(id: string) {
  return requestJson<{ success: true }>(`/api/academic/madrassa/timetable/${id}`, {
    method: "DELETE",
  });
}
