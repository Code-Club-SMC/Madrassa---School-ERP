# Exam V1 Design

## Context

The current school and madrassa exam pages are mock-driven. The application now has real admissions, academic setup, students, enrollments, fees, attendance, and student timelines. Exam V1 should use active enrollments as the roster source of truth and should preserve historical exam results after a student moves class, section, institution, or darja.

Exam V1 covers internal exams for Al-Qasim Academy, Jamia Qasmia, and Jamia Zainab. It includes DMCs, multi-year annual transcripts, and seating plans. Board exam registration remains a separate future workflow.

## Goals

- Persist subjects, exam sessions, exam subjects, marks, results, DMC data, seating halls, seating plans, and seat assignments.
- Support school exams by class/section and madrassa exams by institution/category/darja.
- Enter marks from active enrollment rosters only.
- Calculate totals, percentage, grade, pass/fail, subject failures, and position.
- Generate a printable DMC per student per exam.
- Generate a student annual transcript across multiple years from locked/published exams.
- Generate hall-wise seating plans with constraint checks and printable seating sheets.
- Add high-signal exam events to the student profile timeline.

## Non-Goals

- No board exam registration workflow in V1.
- No roll number slip generation in V1 unless it is needed as a seating-plan print field.
- No parent portal result publishing in V1.
- No SMS or WhatsApp result notifications in V1.
- No invigilation duty roster in V1.
- No fee automation from exams in V1.

## Core Model

Subjects are reusable academic records. Each subject stores system, optional school class or madrassa subcategory scope, English/Urdu names, code, total marks, passing marks, display order, and active state.

Exam sessions represent a concrete exam cycle such as Monthly Test, First Term, Final Exam, Sah Mahi, Nisfus Sana, or Salanah. Each exam stores system, institution, program, target class/section or madrassa subcategory, academic year, date range, exam type, status, and metadata. Status values are `draft`, `active`, `locked`, and `published`.

Exam subjects attach reusable subjects to an exam and snapshot marks configuration. Marks and results reference `studentId`, `enrollmentId`, institution, program, placement, exam, and exam subject. This snapshotting keeps historical result data stable even if the student later moves.

## Workflows

### Subject Setup

Staff creates and maintains school and madrassa subjects from the existing subject pages. Subjects can be deactivated only when not needed for new exams. Historical exam subjects remain unchanged because exams snapshot subject name and marks.

### Exam Creation

Staff creates an exam session for a specific target: school class/section or madrassa institution/darja. The system loads active subjects for that target and lets staff attach or remove exam subjects before activation.

### Marks Entry

Marks entry loads students from active enrollments matching the exam target. Staff enters numeric marks per subject or marks a student absent/leave for a subject. Bulk paste from spreadsheet-style rows is included because the existing UI already points in that direction. Marks can be saved as draft while the exam is active. Once reviewed, exam subjects or the full exam can be locked.

### Result Calculation

The server calculates result summaries from saved marks:

- obtained marks
- total marks
- percentage
- grade
- pass/fail
- failed subjects
- class/darja position

An exam can be published only after required subjects are locked. Published results write a student timeline event. Failed result events should be warnings; routine pass events should be concise and not noisy.

### DMC Per Exam

Each published exam provides a Detailed Marks Certificate for every student. The DMC includes institution, program, class/darja, exam name, academic year, student identity, roll/admission number, subject-wise marks, total, percentage, grade, position, pass/fail, and remarks. DMC output should be print-ready and generated from persisted exam data, not frontend-only calculations.

### Annual Transcript

The annual transcript is a student-level report across multiple academic years. It reads locked/published exams, groups by academic year and class/darja, and shows yearly performance, exam summaries, final annual result, and progression history. It is derived data and is not directly editable.

## Seating Plan

`public/exam-seating.html` is a useful visual prototype. It has a strong operational layout: toolbar, hall tabs, constraint status, hall stats, legend, row/column labels, grid cells, and hover inspection. It should be used as UX inspiration, not copied directly.

Production seating should use the existing React/TypeScript direction in `src/components/shared/ExamSeating.tsx` and `src/lib/seating.ts`, but replace mock/local data with backend data.

V1 seating includes:

- hall setup with name, rows, columns, optional row/column aisles, capacity, and active state
- seating plan per exam
- automatic assignment from enrolled exam students
- deterministic generator so the same inputs can be audited and regenerated
- constraint checks to avoid same class/darja/grade adjacency within the configured gap
- violation highlighting when constraints cannot be fully satisfied
- hall-wise print/export sheets

Seat assignment records should store exam, hall, row, column, student, enrollment, placement label, and generated plan version. Staff can regenerate a plan while the exam is not locked. Locked seating preserves assignments.

## Pages

Reuse the current route structure:

- `/school/subjects`
- `/madrassa/subjects`
- `/school/exams`
- `/madrassa/exams`
- `/school/exams/$id`
- `/madrassa/exams/$id`
- `/school/exams/$id/results`
- `/madrassa/exams/$id/marks`
- `/school/exams/$id/seating`
- `/madrassa/exams/$id/seating`
- `/reports/exams`

The pages should expose creation, editing, marks entry, result review, DMC print, annual transcript access, seating setup, and reports without direct student creation.

## Reports

Exam V1 includes:

- class/darja result sheet
- subject-wise marks sheet
- fail list
- position list
- DMC per student per exam
- annual transcript across multiple academic years
- seating plan by hall
- seating roster by student roll number

Reports should be server-computed from persisted exam and seating tables.

## Permissions

Use existing permission modules:

- `school_exams_internal` for school internal exams
- `madrassa_exams_internal` for madrassa internal exams
- `reports_results` for cross-exam reporting

Marks entry should use `mark_entry`. Publishing, locking, and seating regeneration should require edit-level permission. Printing and exporting should respect print/export permissions.

## Error Handling

- Reject exam creation without a valid target class/section or madrassa subcategory.
- Reject marks outside the allowed total marks range.
- Reject publishing while required subjects are missing or unlocked.
- Reject marks changes after exam lock unless the exam is explicitly reopened by an authorized user.
- Reject seating generation when hall capacity is lower than selected students, unless the plan is explicitly allowed to leave students unseated and reports them.
- Preserve historical marks, DMCs, transcripts, and seating assignments when enrollments later move.
- Return clear API errors and surface them directly in the UI.

## Verification

Implementation should verify:

- Drizzle schema and migration generation.
- Pure result-calculation tests for pass/fail, grades, positions, absent/leave, and failed subjects.
- Pure seating-generator tests for deterministic placement, capacity handling, and violation detection.
- TypeScript build.
- Lint.
- Production build.
- DMC output uses persisted result rows.
- Annual transcript only uses locked/published exams.
- Student timeline events are written for published and failed results.

Do not start the dev server unless explicitly requested.
