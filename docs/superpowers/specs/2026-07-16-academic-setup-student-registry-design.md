# Academic Setup and Student Registry Design

## Context

Admission forms now create the canonical student, enrollment, guardian, and sibling records. The next phase turns the academic setup and student registry screens from mock-backed UI into database-backed management surfaces. This phase must preserve the rule that admissions are the only source of new student creation.

Institution boundaries are explicit:

- Al-Qasim Academy is a standalone formal school institution.
- Jamia Qasmia Lil-Baneen is the boys madrassa.
- Jamia Zainab Lil-Banat is the girls madrassa.
- Jamia Zainab school support is an informal nested program under Jamia Zainab, not a standalone school.

## Goals

- Replace mock-backed academic setup pages with APIs and database reads/writes.
- Replace mock-backed school and madrassa student lists with real student registry APIs.
- Remove visible direct student creation from registry screens.
- Keep `/admission/new` and queue acceptance as the only user-facing paths that create students.
- Support student profile views with enrollment, guardian, and sibling data.
- Support lifecycle actions after admission: edit details, update guardians, confirm siblings, transfer/move enrollment, mark inactive, transferred, dropout, or graduated.

## Non-Goals

- Fees, attendance, exams, timetables, SMS, and parent portal implementation.
- Bulk import or migration tooling.
- Reworking the admission print templates.
- A direct "Add Student" form in school or madrassa student screens.

## Architecture

Add focused server modules:

- `src/lib/server/academic/`: list and manage institutions, programs, school classes, sections, madrassa categories, and madrassa subcategories.
- `src/lib/server/students/`: list students, read profiles, update details, manage guardians/siblings, and manage lifecycle/enrollment moves.
- `src/routes/api/academic/...`: academic setup API routes.
- `src/routes/api/students/...`: student registry API routes.

Reuse existing Drizzle tables:

- `institutions`
- `programs`
- `school_classes`
- `school_class_sections`
- `madrassa_categories`
- `madrassa_subcategories`
- `students`
- `student_enrollments`
- `guardians`
- `student_guardians`
- `student_siblings`

If lifecycle audit needs more detail than `updated_at`, add a small `student_events` table with event type, message, metadata, actor, and timestamp.

## Academic Setup

School setup manages Al-Qasim Academy classes and sections. It must support future growth through middle, secondary, and higher-secondary levels.

Madrassa setup must keep boys and girls programs separate:

- Boys: Jamia Qasmia Lil-Baneen programs such as Hifz, Nazira, and Dars-e-Nizami.
- Girls: Jamia Zainab Lil-Banat programs such as Nazira and Dars-e-Nizami.

Jamia Zainab school support remains tied to Jamia Zainab and is limited to Nursery through Class 5.

The setup pages should show active/inactive records and allow create/edit/deactivate where the user has the relevant permission. Deletion should be blocked when records are referenced by enrollments.

## Student Registry

Student lists become API-backed:

- `/school/students`: enrollments whose program/system is school or school support.
- `/madrassa/students`: enrollments whose program/system is madrassa.

The lists support search, filters, pagination, and export preparation. They must display roll number, student identity, current enrollment, guardian, status, and institution/program context.

The registry must not show an "Add Student" button. Empty states should direct staff to the admission module instead of offering direct creation.

## Student Profile

The profile reads real data for:

- Student identity and status.
- Current and historical enrollments.
- Institution and program.
- School class/section or madrassa category/subcategory/darja.
- Guardians and linked parent user account status.
- Confirmed siblings in both directions.
- Admission source where available.

Allowed profile actions:

- Edit identity and contact-safe fields.
- Update guardian details or attach an existing guardian.
- Confirm or remove sibling links.
- Mark lifecycle status with a reason.
- Move enrollment to a different class, section, program, or subcategory where permitted.

Profile actions must not create a new student row.

## Permissions

- `school_classes`: manage school classes and sections.
- `madrassa_categories`: manage madrassa categories and subcategories.
- `school_students`: view/edit/export/print school student registry.
- `madrassa_students`: view/edit/export/print madrassa student registry.
- `admission_new` and `admission_queue` remain the only creation permissions for student creation through admission flows.

Super admin has full access. Other roles use existing permission defaults and custom overrides.

## Validation

- Institution and program IDs are server-controlled.
- Jamia Qasmia admissions/enrollments are boys madrassa records.
- Jamia Zainab admissions/enrollments are girls madrassa records.
- Al-Qasim Academy school enrollment requires a school class.
- Jamia Zainab school-support enrollment cannot exceed Class 5.
- Section must belong to the selected class.
- Madrassa subcategory must belong to the selected category/program context.
- Referenced academic records cannot be deleted while enrollments use them.

## Data Flow

Admissions create students and initial enrollments. Registry APIs read these records and mutate only post-admission management fields. Lifecycle changes write the student or enrollment status and append a student event when available.

Academic setup changes affect future admissions and moves, but should not silently rewrite existing enrollments. Existing enrollments keep their explicit class, section, program, or subcategory IDs.

## Rollout Plan

1. Add academic API services and routes.
2. Add student registry API services and routes.
3. Wire school classes, madrassa categories, and madrassa classes pages to APIs.
4. Wire school and madrassa student lists to APIs.
5. Wire student profile sheet/page to real profile data.
6. Remove direct student creation UI from registry screens.
7. Add lifecycle and guardian/sibling management actions.
8. Run migration, build, TypeScript, and smoke tests after Postgres is available.

## Verification

- School classes page reads/writes database classes and sections.
- Madrassa setup separates Jamia Qasmia boys and Jamia Zainab girls records.
- Student lists show records created through admissions.
- Registry has no visible direct "Add Student" flow.
- Student profile shows enrollment, guardian, sibling, and admission context.
- Lifecycle actions update status and preserve history.
- Existing admission flow still creates students correctly.
