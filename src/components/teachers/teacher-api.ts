import type {
  AcademicInstitution,
  AcademicProgram,
  ExamSubjectOption,
  SchoolClassOption,
  TeacherCredentials,
  TeacherDetail,
  TeacherListItem,
  TeacherAssignment,
  TeacherClassAssignment,
  TeacherTimetablePeriod,
  MadrassaCategoryOption,
} from "./teacher-types";

type TeacherCreateResponse = {
  teacher: unknown;
  credentials: TeacherCredentials;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String(payload.error)
        : "Teacher request failed";
    throw new Error(message);
  }
  return payload as T;
}

function withIdentityFields(detail: TeacherDetail): TeacherDetail {
  return {
    ...detail,
    profile: {
      ...detail.profile,
      name: detail.profile.name ?? detail.account.name,
      email: detail.profile.email ?? detail.account.email,
      nameUrdu: detail.profile.nameUrdu ?? detail.account.nameUrdu ?? null,
      phone: detail.profile.phone ?? detail.account.phone ?? null,
      cnic: detail.profile.cnic ?? detail.account.cnic ?? null,
    },
  };
}

export function listTeachers(params: URLSearchParams) {
  const suffix = params.toString();
  return requestJson<TeacherListItem[] | { teachers: TeacherListItem[] }>(
    `/api/teachers${suffix ? `?${suffix}` : ""}`,
  ).then((payload) => (Array.isArray(payload) ? payload : payload.teachers));
}

export function createTeacher(payload: Record<string, unknown>) {
  return requestJson<TeacherCreateResponse>("/api/teachers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTeacher(id: string) {
  return requestJson<TeacherDetail>(`/api/teachers/${id}`).then(withIdentityFields);
}

export function updateTeacher(id: string, payload: Record<string, unknown>) {
  return requestJson<TeacherDetail>(`/api/teachers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }).then(withIdentityFields);
}

export function setTeacherActive(id: string, active: boolean) {
  return requestJson<TeacherDetail>(`/api/teachers/${id}/active`, {
    method: "POST",
    body: JSON.stringify({ active }),
  }).then(withIdentityFields);
}

export function deleteTeacher(id: string) {
  return requestJson<{ success: true; deletedTeacherId: string }>(`/api/teachers/${id}`, {
    method: "DELETE",
  });
}

export function createTeacherAssignment(teacherId: string, payload: Record<string, unknown>) {
  return requestJson<TeacherDetail>(`/api/teachers/${teacherId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(withIdentityFields);
}

export function setTeacherAssignmentActive(
  teacherId: string,
  assignmentId: string,
  active: boolean,
) {
  return requestJson<TeacherDetail>(`/api/teachers/${teacherId}/assignments/${assignmentId}`, {
    method: "POST",
    body: JSON.stringify({ active }),
  }).then(withIdentityFields);
}

export function createTeacherTimetablePeriod(teacherId: string, payload: Record<string, unknown>) {
  return requestJson<TeacherDetail>(`/api/teachers/${teacherId}/timetable`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(withIdentityFields);
}

export function setTeacherTimetablePeriodActive(
  teacherId: string,
  periodId: string,
  active: boolean,
) {
  return requestJson<TeacherDetail>(`/api/teachers/${teacherId}/timetable/${periodId}`, {
    method: "POST",
    body: JSON.stringify({ active }),
  }).then(withIdentityFields);
}

export async function listAcademicOptions() {
  const [institutions, programs, schoolClasses, madrassaCategories] = await Promise.all([
    requestJson<{ institutions: AcademicInstitution[] }>("/api/academic/institutions"),
    requestJson<{ programs: AcademicProgram[] }>("/api/academic/programs"),
    requestJson<{ classes: SchoolClassOption[] }>("/api/academic/school/classes"),
    requestJson<{ categories: MadrassaCategoryOption[] }>("/api/academic/madrassa/categories"),
  ]);

  return {
    institutions: institutions.institutions,
    programs: programs.programs,
    schoolClasses: schoolClasses.classes,
    madrassaCategories: madrassaCategories.categories,
  };
}

export function listTeacherSubjects(input: {
  system: "school" | "madrassa";
  schoolClassId?: string;
  madrassaSubcategoryId?: string;
}) {
  const params = new URLSearchParams({ system: input.system, active: "true" });
  if (input.schoolClassId) params.set("schoolClassId", input.schoolClassId);
  if (input.madrassaSubcategoryId) {
    params.set("madrassaSubcategoryId", input.madrassaSubcategoryId);
  }
  return requestJson<{ subjects: ExamSubjectOption[] }>(
    `/api/exams/subjects?${params.toString()}`,
  ).then((payload) => payload.subjects);
}

export function getMyTeacherDashboard() {
  return requestJson<{
    profile: TeacherDetail["profile"];
    account: TeacherDetail["account"];
    assignments: TeacherAssignment[];
    timetable: TeacherTimetablePeriod[];
  }>("/api/teachers/me/dashboard").then((payload) => {
    console.log("[teacher-api] getMyTeacherDashboard payload", { assignments: payload.assignments.length, timetable: payload.timetable.length });
    return payload;
  });
}

export function getMyTeacherClasses() {
  return requestJson<TeacherClassAssignment[]>("/api/teachers/me/classes").then((payload) => {
    console.log("[teacher-api] getMyTeacherClasses payload", Array.isArray(payload) ? payload.length : "object", payload);
    return payload;
  });
}

export function getMyTeacherExams() {
  return requestJson<{
    assignments: TeacherClassAssignment[];
    sessions: Array<{
      id: string;
      name: string;
      system: "school" | "madrassa";
      status: string;
      academicYear: string;
      startDate: string;
      endDate: string;
      publishedAt: string | null;
    }>;
  }>("/api/teachers/me/exams");
}

export function getMyTeacherReports() {
  return requestJson<{
    profile: TeacherDetail["profile"];
    assignments: TeacherAssignment[];
    totalClasses: number;
    totalSchool: number;
    totalMadrassa: number;
  }>("/api/teachers/me/reports");
}
