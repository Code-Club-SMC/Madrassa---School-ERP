import type { AttendanceMarkRow, AttendanceRosterPayload } from "./attendance-types";

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

export function getSchoolAttendanceRoster(input: { date: string; classId: string; sectionId: string }) {
  const params = new URLSearchParams(input);
  return requestJson<AttendanceRosterPayload>(`/api/attendance/school/roster?${params.toString()}`);
}

export function markSchoolAttendance(input: {
  date: string;
  classId: string;
  sectionId: string;
  rows: AttendanceMarkRow[];
}) {
  return requestJson<AttendanceRosterPayload>("/api/attendance/school/mark", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMadrassaAttendanceRoster(input: {
  date: string;
  institutionId: string;
  subcategoryId: string;
}) {
  const params = new URLSearchParams(input);
  return requestJson<AttendanceRosterPayload>(`/api/attendance/madrassa/roster?${params.toString()}`);
}

export function markMadrassaAttendance(input: {
  date: string;
  institutionId: string;
  subcategoryId: string;
  rows: AttendanceMarkRow[];
}) {
  return requestJson<AttendanceRosterPayload>("/api/attendance/madrassa/mark", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
