# Attendance V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend-backed daily student attendance for school and madrassa students, with enrollment-based rosters, corrections, reports, and student timeline events.

**Architecture:** Add a focused Drizzle attendance schema, a server attendance service that owns roster/mark/report logic, thin TanStack Start API route files, and shared frontend attendance components consumed by school, madrassa, and reports routes. Attendance rows snapshot enrollment placement so later student movement does not rewrite history.

**Tech Stack:** TanStack Start, React 19, TypeScript 7, Vite 8, Drizzle ORM, Postgres, Zod, shadcn/Radix UI, Bun tests.

## Global Constraints

- Do not start the dev server unless explicitly requested.
- Persist daily student attendance in Postgres through Drizzle.
- Mark attendance from active enrollment rosters only.
- Support Al-Qasim Academy school class/section attendance.
- Support Jamia Qasmia and Jamia Zainab madrassa category/darja attendance.
- Supported statuses are exactly `present`, `absent`, `late`, and `leave`.
- Routine `present` marks must not create student timeline events.
- Corrections from `absent`, `late`, or `leave` back to `present` must create a correction timeline event.
- HR/staff attendance, SMS, biometric/RFID, parent notification, and payroll are out of scope.

---

## File Structure

- Create `src/db/schema/attendance.ts`: `student_attendance` table, status type, and Drizzle relations.
- Modify `src/db/index.ts`: include `attendanceSchema` in the Drizzle schema object.
- Modify `src/lib/server/students/events.ts`: add attendance event type constants.
- Create `src/lib/server/attendance/calculations.ts`: pure summary and timeline-decision helpers.
- Create `src/lib/server/attendance/calculations.test.ts`: Bun tests for summary and event behavior.
- Create `src/lib/server/attendance/service.ts`: zod schemas, roster loading, mark/upsert transaction, daily summary, student history.
- Create API routes under `src/routes/api/attendance/**`: thin handlers that parse input and call service functions.
- Create `src/components/attendance/attendance-types.ts`: frontend payload and form types.
- Create `src/components/attendance/attendance-api.ts`: typed fetch wrappers.
- Create `src/components/attendance/attendance-marker.tsx`: shared roster marking UI for school and madrassa pages.
- Modify `src/routes/_authenticated/school/attendance.tsx`: replace mock school attendance with backend UI.
- Modify `src/routes/_authenticated/madrassa/attendance.tsx`: replace mock madrassa attendance with backend UI.
- Modify `src/routes/_authenticated/reports/attendance.tsx`: replace mock report generation with backend report API.
- Modify `src/components/students/student-timeline.tsx`: add attendance category, icons, labels, and detail rendering.
- Modify `src/routeTree.gen.ts`: regenerate through `bun run build`.

---

### Task 1: Attendance Schema and Pure Calculations

**Files:**
- Create: `src/db/schema/attendance.ts`
- Create: `src/lib/server/attendance/calculations.ts`
- Create: `src/lib/server/attendance/calculations.test.ts`
- Modify: `src/db/index.ts`
- Modify: `src/lib/server/students/events.ts`

**Interfaces:**
- Produces `studentAttendance`, `studentAttendanceRelations`, and `type StudentAttendanceStatus`.
- Produces `summarizeAttendance(rows, rosterTotal)` and `attendanceTimelineEvent(previousStatus, nextStatus)`.
- Produces new student event types used by Task 2 and Task 6.

- [ ] **Step 1: Add attendance event names**

Modify `src/lib/server/students/events.ts` so `studentEventTypes` includes these values after the finance event types:

```ts
  "attendance_absent_marked",
  "attendance_late_marked",
  "attendance_leave_marked",
  "attendance_corrected",
```

- [ ] **Step 2: Create the Drizzle attendance schema**

Create `src/db/schema/attendance.ts` with this table shape:

```ts
import { relations } from "drizzle-orm";
import { date, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { user } from "@/db/schema/auth";
import { studentEnrollments, students } from "@/db/schema/students";

export type StudentAttendanceStatus = "present" | "absent" | "late" | "leave";

export const studentAttendance = pgTable(
  "student_attendance",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => studentEnrollments.id, { onDelete: "restrict" }),
    institutionId: text("institution_id").notNull().references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    schoolSectionId: text("school_section_id").references(() => schoolClassSections.id, { onDelete: "restrict" }),
    madrassaCategoryId: text("madrassa_category_id").references(() => madrassaCategories.id, {
      onDelete: "restrict",
    }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, {
      onDelete: "restrict",
    }),
    attendanceDate: date("attendance_date", { mode: "string" }).notNull(),
    status: text("status").$type<StudentAttendanceStatus>().notNull(),
    notes: text("notes"),
    markedByUserId: text("marked_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("student_attendance_student_enrollment_date_idx").on(
      table.studentId,
      table.enrollmentId,
      table.attendanceDate,
    ),
    index("student_attendance_student_idx").on(table.studentId),
    index("student_attendance_enrollment_idx").on(table.enrollmentId),
    index("student_attendance_institution_idx").on(table.institutionId),
    index("student_attendance_program_idx").on(table.programId),
    index("student_attendance_school_class_idx").on(table.schoolClassId),
    index("student_attendance_school_section_idx").on(table.schoolSectionId),
    index("student_attendance_madrassa_category_idx").on(table.madrassaCategoryId),
    index("student_attendance_madrassa_subcategory_idx").on(table.madrassaSubcategoryId),
    index("student_attendance_date_idx").on(table.attendanceDate),
    index("student_attendance_status_idx").on(table.status),
  ],
);

export const studentAttendanceRelations = relations(studentAttendance, ({ one }) => ({
  student: one(students, { fields: [studentAttendance.studentId], references: [students.id] }),
  enrollment: one(studentEnrollments, {
    fields: [studentAttendance.enrollmentId],
    references: [studentEnrollments.id],
  }),
  institution: one(institutions, { fields: [studentAttendance.institutionId], references: [institutions.id] }),
  program: one(programs, { fields: [studentAttendance.programId], references: [programs.id] }),
  schoolClass: one(schoolClasses, { fields: [studentAttendance.schoolClassId], references: [schoolClasses.id] }),
  schoolSection: one(schoolClassSections, {
    fields: [studentAttendance.schoolSectionId],
    references: [schoolClassSections.id],
  }),
  madrassaCategory: one(madrassaCategories, {
    fields: [studentAttendance.madrassaCategoryId],
    references: [madrassaCategories.id],
  }),
  madrassaSubcategory: one(madrassaSubcategories, {
    fields: [studentAttendance.madrassaSubcategoryId],
    references: [madrassaSubcategories.id],
  }),
  markedBy: one(user, { fields: [studentAttendance.markedByUserId], references: [user.id] }),
}));
```

- [ ] **Step 3: Register the schema**

Modify `src/db/index.ts`:

```ts
import * as attendanceSchema from "@/db/schema/attendance";
```

and add it to the schema object after `admissionSchema`:

```ts
    ...attendanceSchema,
```

- [ ] **Step 4: Add pure attendance calculations**

Create `src/lib/server/attendance/calculations.ts`:

```ts
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
```

- [ ] **Step 5: Add Bun tests for calculations**

Create `src/lib/server/attendance/calculations.test.ts`:

```ts
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
```

- [ ] **Step 6: Verify Task 1**

Run:

```bash
bun test src/lib/server/attendance/calculations.test.ts
```

Expected: all attendance calculation tests pass.

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors from the new schema/helpers.

---

### Task 2: Server Service and API Routes

**Files:**
- Create: `src/lib/server/attendance/service.ts`
- Create: `src/routes/api/attendance/school/roster.ts`
- Create: `src/routes/api/attendance/school/mark.ts`
- Create: `src/routes/api/attendance/madrassa/roster.ts`
- Create: `src/routes/api/attendance/madrassa/mark.ts`
- Create: `src/routes/api/attendance/reports/daily-summary.ts`
- Create: `src/routes/api/attendance/reports/student-history.ts`

**Interfaces:**
- Consumes: `studentAttendance`, `StudentAttendanceStatus`, `summarizeAttendance`, `attendanceTimelineEvent`, `insertStudentEvent`.
- Produces:
  - `schoolAttendanceRosterQuerySchema`
  - `madrassaAttendanceRosterQuerySchema`
  - `markSchoolAttendanceSchema`
  - `markMadrassaAttendanceSchema`
  - `attendanceDailySummaryQuerySchema`
  - `attendanceStudentHistoryQuerySchema`
  - `getSchoolAttendanceRoster(request, query)`
  - `markSchoolAttendance(request, input)`
  - `getMadrassaAttendanceRoster(request, query)`
  - `markMadrassaAttendance(request, input)`
  - `getAttendanceDailySummaryReport(request, query)`
  - `getAttendanceStudentHistoryReport(request, query)`

- [ ] **Step 1: Define zod schemas and shared types**

Create `src/lib/server/attendance/service.ts` with these top-level declarations:

```ts
import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, inArray, isNull, lte, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { studentAttendance, type StudentAttendanceStatus } from "@/db/schema/attendance";
import { studentEnrollments, students } from "@/db/schema/students";
import type { ModuleKey } from "@/lib/permissions/module-registry";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import { attendanceTimelineEvent, summarizeAttendance } from "@/lib/server/attendance/calculations";
import { insertStudentEvent } from "@/lib/server/students/events";

const attendanceStatuses = ["present", "absent", "late", "leave"] as const;

export const schoolAttendanceRosterQuerySchema = z.object({
  date: z.string().trim().min(1),
  classId: z.string().trim().min(1),
  sectionId: z.string().trim().min(1),
});

export const madrassaAttendanceRosterQuerySchema = z.object({
  date: z.string().trim().min(1),
  institutionId: z.string().trim().min(1),
  subcategoryId: z.string().trim().min(1),
});

const markRowSchema = z.object({
  studentId: z.string().trim().min(1),
  enrollmentId: z.string().trim().min(1),
  status: z.enum(attendanceStatuses),
  notes: z.string().trim().optional(),
});

export const markSchoolAttendanceSchema = schoolAttendanceRosterQuerySchema.extend({
  rows: z.array(markRowSchema).min(1),
});

export const markMadrassaAttendanceSchema = madrassaAttendanceRosterQuerySchema.extend({
  rows: z.array(markRowSchema).min(1),
});

export const attendanceDailySummaryQuerySchema = z.object({
  system: z.enum(["both", "school", "madrassa"]).default("both"),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  institutionId: z.string().trim().optional(),
  programId: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  sectionId: z.string().trim().optional(),
  subcategoryId: z.string().trim().optional(),
});

export const attendanceStudentHistoryQuerySchema = z.object({
  studentId: z.string().trim().min(1),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
});

type AttendanceSystem = "school" | "madrassa";
type AttendanceTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type RosterStudent = {
  studentId: string;
  enrollmentId: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  rollNo: string;
  admissionNo: string;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  schoolClassId: string | null;
  schoolClassName: string | null;
  schoolClassNameUrdu: string | null;
  schoolSectionId: string | null;
  schoolSectionName: string | null;
  madrassaCategoryId: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu: string | null;
  madrassaSubcategoryId: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  darja: string | null;
};
```

- [ ] **Step 2: Add service helpers**

In the same file, add helpers with these exact names and behavior:

```ts
function attendanceModuleForSystem(system: AttendanceSystem): ModuleKey {
  return system === "madrassa" ? "madrassa_attendance" : "school_attendance";
}

function parseAttendanceDate(value: string, label = "date") {
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(`Invalid ${label}`, 400);
  return date;
}

function compactSql<T extends SQL | undefined>(clauses: T[]) {
  return clauses.filter(Boolean) as SQL[];
}

function serializeAttendanceRow(row: typeof studentAttendance.$inferSelect | undefined) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    date: row.attendanceDate,
    status: row.status,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

- [ ] **Step 3: Implement roster loading**

Implement `loadRoster(system, filters)` in `service.ts`. It must:

- query `students`
- inner join `student_enrollments`, `institutions`, and `programs`
- left join `school_classes`, `school_class_sections`, `madrassa_subcategories`, and `madrassa_categories`
- require `students.status = "active"`, `student_enrollments.status = "active"`, and `student_enrollments.endedAt IS NULL`
- for school, require `programs.system = "school"`, selected `classId`, and selected `sectionId`
- for madrassa, require `programs.system = "madrassa"`, selected `institutionId`, and selected `subcategoryId`
- order by `student_enrollments.rollNo`

Return `RosterStudent[]` using the type from Step 1.

- [ ] **Step 4: Implement `getSchoolAttendanceRoster` and `getMadrassaAttendanceRoster`**

Both functions must:

- require `view` permission for `school_attendance` or `madrassa_attendance`
- parse the date through `parseAttendanceDate`
- load the roster
- load existing `student_attendance` rows for roster enrollment IDs and the selected date
- return `{ date, students, summary }`

Each student payload must include:

```ts
{
  id: row.studentId,
  enrollmentId: row.enrollmentId,
  name: row.name,
  nameUrdu: row.nameUrdu,
  fatherName: row.fatherName,
  rollNo: row.rollNo,
  admissionNo: row.admissionNo,
  institutionName: row.institutionName,
  institutionNameUrdu: row.institutionNameUrdu,
  groupLabel: row.schoolClassName
    ? `${row.schoolClassName} · ${row.schoolSectionName ?? "No section"}`
    : `${row.madrassaCategoryName ?? "Madrassa"} · ${row.madrassaSubcategoryName ?? "Darja"}`,
  attendance: serializeAttendanceRow(existingByEnrollment.get(row.enrollmentId)),
}
```

- [ ] **Step 5: Implement mark/upsert transaction**

Implement shared `markAttendance(system, input)` and export wrappers `markSchoolAttendance` and `markMadrassaAttendance`.

Rules:

- Load the selected roster first.
- Reject if `input.rows` contains a `studentId`/`enrollmentId` outside that roster.
- Load existing rows for the selected roster/date.
- If no existing rows are being changed, require `create` permission.
- If at least one existing row changes status or notes, require `edit` permission.
- Upsert using `onConflictDoUpdate` on `student_attendance_student_enrollment_date_idx`.
- For each row, call `attendanceTimelineEvent(previousStatus, nextStatus)`.
- Insert timeline events only when the helper returns a type.
- Message format:
  - first absent: `Marked absent for 2026-07-16`
  - first late: `Marked late for 2026-07-16`
  - first leave: `Marked on leave for 2026-07-16`
  - correction: `Attendance corrected for 2026-07-16`

Timeline metadata must include:

```ts
{
  date,
  previousStatus,
  nextStatus: row.status,
  notes: row.notes ?? null,
  institutionName: rosterRow.institutionName,
  programName: rosterRow.programName,
  className: rosterRow.schoolClassName,
  sectionName: rosterRow.schoolSectionName,
  madrassaCategoryName: rosterRow.madrassaCategoryName,
  madrassaSubcategoryName: rosterRow.madrassaSubcategoryName,
  darja: rosterRow.darja,
}
```

- [ ] **Step 6: Implement report functions**

Implement `getAttendanceDailySummaryReport`:

- require `reports_attendance` `view`
- filter `student_attendance` by date range and optional system/placement filters
- return `{ rows, totals }`
- each row groups by date and placement label
- totals use `summarizeAttendance`

Implement `getAttendanceStudentHistoryReport`:

- require `reports_attendance` `view`
- filter by one `studentId` and optional date range
- join student, enrollment, institution, program, school class/section, and madrassa category/subcategory
- return `{ student, rows, summary }`

- [ ] **Step 7: Add API routes**

Each route uses `createFileRoute`, parses input with the exported schema, calls the service function, and returns `errorResponse` on failure. Use this pattern:

```ts
import { createFileRoute } from "@tanstack/react-router";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";
import { getSchoolAttendanceRoster, schoolAttendanceRosterQuerySchema } from "@/lib/server/attendance/service";

export const Route = createFileRoute("/api/attendance/school/roster")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = schoolAttendanceRosterQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await getSchoolAttendanceRoster(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load attendance roster");
        }
      },
    },
  },
});
```

Create equivalent files for:

- `src/routes/api/attendance/school/mark.ts`
- `src/routes/api/attendance/madrassa/roster.ts`
- `src/routes/api/attendance/madrassa/mark.ts`
- `src/routes/api/attendance/reports/daily-summary.ts`
- `src/routes/api/attendance/reports/student-history.ts`

For POST routes, use `parseJsonBody(request, markSchoolAttendanceSchema)` or `parseJsonBody(request, markMadrassaAttendanceSchema)`.

- [ ] **Step 8: Verify Task 2**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors from service/API route files.

---

### Task 3: Migration and Route Generation

**Files:**
- Create: `drizzle/<next>_*.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `drizzle/meta/<next>_snapshot.json`
- Modify: `src/routeTree.gen.ts`

**Interfaces:**
- Consumes: schema and route files from Tasks 1 and 2.
- Produces: generated migration and TanStack route tree entries for attendance API routes.

- [ ] **Step 1: Generate migration**

Run:

```bash
bun run db:generate
```

Expected: Drizzle creates exactly one new migration for `student_attendance`.

- [ ] **Step 2: Inspect generated migration**

Run:

```bash
ls drizzle
```

Expected: a new SQL migration file appears after `0004_skinny_jubilee.sql`.

Open the generated SQL and confirm it includes:

```sql
CREATE TABLE "student_attendance"
```

and a unique index equivalent to:

```sql
CREATE UNIQUE INDEX "student_attendance_student_enrollment_date_idx"
```

- [ ] **Step 3: Regenerate route tree**

Run:

```bash
bun run build
```

Expected:

- production build passes
- `src/routeTree.gen.ts` includes `/api/attendance/...` routes
- the existing Vite warning about `vite-tsconfig-paths` may still appear and is not part of this task

- [ ] **Step 4: Do not apply migration unless explicitly needed**

Do not run `bun run db:migrate` as part of this task unless the user specifically asks or implementation verification requires a live database.

---

### Task 4: Frontend API and Shared Attendance Marker

**Files:**
- Create: `src/components/attendance/attendance-types.ts`
- Create: `src/components/attendance/attendance-api.ts`
- Create: `src/components/attendance/attendance-marker.tsx`

**Interfaces:**
- Consumes: API payloads from Task 2.
- Produces reusable UI used by Task 5.

- [ ] **Step 1: Create frontend types**

Create `src/components/attendance/attendance-types.ts`:

```ts
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
```

- [ ] **Step 2: Create typed fetch helpers**

Create `src/components/attendance/attendance-api.ts`:

```ts
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
```

- [ ] **Step 3: Build `AttendanceMarker`**

Create `src/components/attendance/attendance-marker.tsx`. It must accept:

```ts
type AttendanceMarkerProps = {
  title: string;
  subtitle: string;
  roster: AttendanceRosterPayload | null;
  loading: boolean;
  saving: boolean;
  marks: Record<string, AttendanceStatus>;
  notes: Record<string, string>;
  onSetStatus: (studentId: string, status: AttendanceStatus) => void;
  onSetNote: (studentId: string, note: string) => void;
  onMarkAllPresent: () => void;
  onClear: () => void;
  onSave: () => void;
};
```

UI requirements:

- Use `Card`, `Button`, `Input`, `Avatar`, and `Badge`.
- Use lucide icons `Check`, `X`, `Clock`, `CalendarMinus`, and `Save`.
- Show counts for present, absent, late, leave, and unmarked.
- Show a row per student with roll number, Urdu name, English name, status buttons, and a small optional note input.
- Disable save while saving or when no roster is loaded.
- Keep button dimensions stable: `h-8 w-9` for status icon buttons.

- [ ] **Step 4: Verify Task 4**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors from the shared attendance frontend files.

---

### Task 5: School and Madrassa Attendance Pages

**Files:**
- Modify: `src/routes/_authenticated/school/attendance.tsx`
- Modify: `src/routes/_authenticated/madrassa/attendance.tsx`

**Interfaces:**
- Consumes: Task 4 API helpers and `AttendanceMarker`.
- Produces backend-backed school and madrassa attendance pages.

- [ ] **Step 1: Replace school mock data with backend calls**

In `src/routes/_authenticated/school/attendance.tsx`:

- Remove `students as allStudents` from `@/mock`.
- Load school classes from `/api/academic/school/classes`.
- Keep local state for `date`, `classId`, `sectionId`, `roster`, `marks`, `notes`, `loading`, and `saving`.
- When class/date/section changes, call `getSchoolAttendanceRoster`.
- Initialize `marks` and `notes` from `student.attendance`.
- Save using `markSchoolAttendance`.
- Show success toast `Attendance saved`.
- Show backend errors with `toast.error(error.message)`.

The submitted rows must be:

```ts
const rows = roster.students
  .filter((student) => marks[student.id])
  .map((student) => ({
    studentId: student.id,
    enrollmentId: student.enrollmentId,
    status: marks[student.id],
    notes: notes[student.id]?.trim() || undefined,
  }));
```

- [ ] **Step 2: Replace madrassa mock data with backend calls**

In `src/routes/_authenticated/madrassa/attendance.tsx`:

- Remove `madrassaCategories` and `students` from `@/mock`.
- Load institutions from `/api/academic/institutions`.
- Load madrassa categories/subcategories from `/api/academic/madrassa/categories`.
- Keep local state for `date`, `institutionId`, `subcategoryId`, `roster`, `marks`, `notes`, `loading`, and `saving`.
- When date/institution/subcategory changes, call `getMadrassaAttendanceRoster`.
- Initialize `marks` and `notes` from `student.attendance`.
- Save using `markMadrassaAttendance`.
- Show success toast `Attendance saved`.
- Show backend errors with `toast.error(error.message)`.

- [ ] **Step 3: Keep operational UI constraints**

Both pages must:

- use `AttendanceMarker`
- keep the date input visible at the top
- keep target selectors visible above the roster
- show an empty state when no active students exist for the selected target
- not include a direct student creation shortcut

- [ ] **Step 4: Verify Task 5**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors from the attendance pages.

---

### Task 6: Reports, Timeline UI, and Final Verification

**Files:**
- Modify: `src/routes/_authenticated/reports/attendance.tsx`
- Modify: `src/components/students/student-timeline.tsx`
- Modify: `src/routeTree.gen.ts`

**Interfaces:**
- Consumes: report API routes and attendance event types from previous tasks.
- Produces production-facing report UI and readable attendance timeline events.

- [ ] **Step 1: Replace mock report data**

In `src/routes/_authenticated/reports/attendance.tsx`:

- Remove `students`, `madrassaCategories`, and `generateAttendance` mock usage.
- Fetch `/api/attendance/reports/daily-summary` using `URLSearchParams`.
- Provide filters for `dateFrom`, `dateTo`, and `system`.
- Render KPI cards for attendance rate, average present, average absent, and average late.
- Render a daily trend chart from report rows.
- Render a table grouped by date and placement label.
- Keep existing print/CSV actions, but source their data from the backend payload.

- [ ] **Step 2: Add attendance timeline category**

Modify `src/components/students/student-timeline.tsx`:

- Add `"attendance"` to `TimelineCategory` and `EventCategory`.
- Add event category mappings:

```ts
  attendance_absent_marked: "attendance",
  attendance_late_marked: "attendance",
  attendance_leave_marked: "attendance",
  attendance_corrected: "attendance",
```

- Add timeline filter:

```ts
{ value: "attendance", label: "Attendance" }
```

- Use `CalendarCheck` or `ClipboardCheck` from `lucide-react` for attendance icons.
- Treat `attendance_absent_marked` as warning-toned.
- Render metadata details for `date`, `previousStatus`, `nextStatus`, `institutionName`, `programName`, `className`, `sectionName`, `madrassaCategoryName`, `madrassaSubcategoryName`, `darja`, and `notes`.

- [ ] **Step 3: Generate route tree and migration if not already current**

Run:

```bash
bun run build
```

Expected:

- build passes
- `src/routeTree.gen.ts` includes the new attendance API routes

- [ ] **Step 4: Run focused and project verification**

Run:

```bash
bun test src/lib/server/attendance/calculations.test.ts
```

Expected: all tests pass.

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors.

Run:

```bash
bun run lint
```

Expected: TypeScript and ESLint pass.

Run:

```bash
bun run build
```

Expected: production build passes.

- [ ] **Step 5: Review changed files**

Run:

```bash
git diff --check -- src/db src/lib/server/attendance src/routes/api/attendance src/components/attendance src/routes/_authenticated/school/attendance.tsx src/routes/_authenticated/madrassa/attendance.tsx src/routes/_authenticated/reports/attendance.tsx src/components/students/student-timeline.tsx docs/superpowers/plans/2026-07-16-attendance-v1-plan.md
```

Expected: no whitespace errors.

Run:

```bash
git diff -- src/db src/lib/server/attendance src/routes/api/attendance src/components/attendance src/routes/_authenticated/school/attendance.tsx src/routes/_authenticated/madrassa/attendance.tsx src/routes/_authenticated/reports/attendance.tsx src/components/students/student-timeline.tsx
```

Expected: changes match the Attendance V1 spec and do not introduce direct student creation, SMS, HR attendance, biometric, or payroll work.
