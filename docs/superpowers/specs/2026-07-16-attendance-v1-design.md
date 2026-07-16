# Attendance V1 Design

## Context

The current school and madrassa attendance pages are mock-driven. The application now has real admissions, students, guardians, academic setup, active enrollments, student movement, student timelines, and fee operations. Attendance should use the same source of truth: a student is markable only through an active enrollment, not through direct student creation or mock rosters.

Attendance V1 covers student attendance for Al-Qasim Academy, Jamia Qasmia, and Jamia Zainab. HR/staff attendance remains separate and is not part of this phase.

## Goals

- Persist daily student attendance in Postgres through Drizzle.
- Mark attendance from active enrollment rosters.
- Support school class/section attendance for Al-Qasim Academy.
- Support madrassa category/darja attendance for Jamia Qasmia and Jamia Zainab.
- Allow same-day corrections without duplicate attendance rows.
- Add meaningful attendance events to the student profile timeline.
- Add basic attendance reports for daily summaries and student history.

## Non-Goals

- No SMS or parent notification workflow in V1.
- No biometric, RFID, or mobile teacher attendance in V1.
- No payroll or HR attendance integration in V1.
- No advanced disciplinary workflow for repeated absence in V1.
- No monthly certificate/report-card attendance formatting in V1.

## Attendance Model

Attendance is stored per student, date, and enrollment. The core table should contain:

- `studentId`
- `enrollmentId`
- `institutionId`
- `programId`
- school placement snapshot: `schoolClassId`, `schoolSectionId`
- madrassa placement snapshot: `madrassaCategoryId`, `madrassaSubcategoryId`
- `attendanceDate`
- `status`: `present`, `absent`, `late`, or `leave`
- optional `notes`
- `markedByUserId`
- timestamps

The database should enforce one row per `studentId`, `enrollmentId`, and `attendanceDate`. Saving attendance for a roster should upsert existing rows for that day. Historical rows stay linked to the enrollment that was active when attendance was marked, so later enrollment movement does not rewrite history.

## Workflows

### Mark School Attendance

Staff opens `/school/attendance`, selects a date, class, and section. The roster is loaded from active Al-Qasim Academy school enrollments. Staff can mark each student individually, mark all present, clear unsaved marks, and save. Existing attendance for the selected day loads into the UI so corrections are visible before saving.

### Mark Madrassa Attendance

Staff opens `/madrassa/attendance`, selects date, institution, category, and darja/subcategory. The roster is loaded from active Jamia Qasmia or Jamia Zainab madrassa enrollments. Gender and institution constraints remain enforced through the enrollment model and existing backend validation.

### Correct Attendance

If an attendance row already exists for the same student, enrollment, and date, saving updates the row. Corrections should create a timeline event only when the status changes from one meaningful state to another.

### Student Timeline

Attendance writes should create timeline events for:

- `attendance_absent_marked`
- `attendance_late_marked`
- `attendance_leave_marked`
- `attendance_corrected`

Routine `present` marks should not create timeline events because they would flood the profile. If an absent, late, or leave record is corrected back to present, the correction should be logged.

Timeline metadata should include date, previous status, next status, institution, program, class/section or madrassa darja, and notes where present.

## API Surface

Use readable route paths similar to the existing API style:

- `GET /api/attendance/school/roster`
- `POST /api/attendance/school/mark`
- `GET /api/attendance/madrassa/roster`
- `POST /api/attendance/madrassa/mark`
- `GET /api/attendance/reports/daily-summary`
- `GET /api/attendance/reports/student-history`

Roster endpoints return the selected cohort with existing attendance marks for the date. Mark endpoints accept date, target cohort, and student status rows, then save inside a transaction.

## Pages

Reuse and replace the existing mock pages:

- `/school/attendance`
- `/madrassa/attendance`
- `/reports/attendance`

The marking pages should keep the existing efficient roster UI shape, but source all data from the backend. The reports page should provide filters for date range, institution, program, class/section, madrassa category/darja, and student.

## Reports

V1 includes:

- Daily Summary: selected date or date range with present, absent, late, leave, unmarked, and total roster counts.
- Cohort Summary: class/section or madrassa darja totals for a date range.
- Student History: one student's attendance rows with status, date, placement, notes, and percentage.

Reports should be server-computed from attendance rows and active/historical enrollment context. Percentages should count present and late as attended, absent as not attended, and leave separately.

## Permissions

Use existing permission areas:

- School attendance requires the school attendance or school student permission area.
- Madrassa attendance requires the madrassa attendance or madrassa student permission area.
- Cross-institution reports require reports or admin-level access.

The implementation should follow the current route guard/session patterns and never expose attendance writes to unauthenticated users.

## Error Handling

- Reject marking for dates with no selected cohort.
- Reject rows for students outside the selected cohort.
- Reject inactive enrollments for new attendance marks.
- Return existing saved rows when staff revisits a marked date.
- Surface backend errors directly in the UI with toast messages.
- Keep saves transactional so partial roster writes do not leave inconsistent attendance for the same request.

## Verification

Implementation should verify:

- Drizzle schema and migration generation.
- `bunx tsc --noEmit --pretty false`.
- `bun run lint`.
- `bun run build`.
- Attendance upsert behavior for repeat saves.
- Timeline event creation for absent, late, leave, and corrections.
- No timeline noise for routine present marks.
- Report calculations for daily, cohort, and student history views.

Do not start the dev server unless explicitly requested.
