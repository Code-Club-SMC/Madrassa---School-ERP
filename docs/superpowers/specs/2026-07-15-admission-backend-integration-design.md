# Admission Backend Integration Design

## Context

Admission forms are currently rendered and printed in the frontend, while application queue, interviews, documents, and waitlist screens still use mock data. The app already has Postgres, Drizzle, Better Auth, route permissions, and a strong frontend/domain model for school classes, madrassa categories, students, guardians, and applications. This phase promotes that existing admission-facing model into real backend tables and APIs without attempting to backend-enable the entire ERP.

The client clarified an important institution boundary:

- Al-Qasim Academy is a standalone formal school institution. It needs formal registration, admissions, classes, parent communication support later, and room to grow from primary/middle to matric and beyond.
- Jamia Zainab School Department is not a standalone school. It is an informal school-support program under Jamia Zainab Lil-Banat for madrassa girls, limited to primary-level school subjects.

## Goals

- Store public admission submissions as real pending applications.
- Store admin-created admissions as real students immediately.
- Support review, interviews, documents, waitlist, acceptance, and rejection.
- Preserve exact form reprint data with raw form JSON, variant key, and photo path.
- Normalize enough academic structure for reliable reporting and future modules.
- Support guardians, optional parent user accounts, and confirmed sibling links.
- Generate application, admission, and roll numbers with transactional yearly sequences.

## Non-Goals

- Full backend implementation for fees, attendance, exams, timetables, reports, or SMS.
- Replacing all existing school/madrassa mock-backed screens in this phase.
- Redesigning the print templates.

## Architecture

Add backend modules without creating a separate admissions system:

- `src/db/schema/academic.ts`: institutions, programs, school classes, madrassa categories, and madrassa subcategories.
- `src/db/schema/students.ts`: students, enrollments, guardians, student-guardian links, and sibling links.
- `src/db/schema/admission.ts`: admission applications, workflow events, uploaded photo paths, and number sequences.
- `src/lib/server/admission/`: server-only services for submission, queue reads, workflow updates, acceptance, rejection, number generation, guardian matching, sibling matching, and optional parent account creation.
- `src/routes/api/admission/...`: API routes consumed by public and authenticated admission pages.

The frontend flows become:

- Public `/apply`: creates an `admission_applications` row only.
- Admin `/admission/new`: creates `students` and `student_enrollments` immediately.
- Admin `/admission/queue`: reads real applications, manages workflow, confirms guardian/sibling suggestions, optionally creates a parent login, and accepts into `students`.

## Data Model

Academic tables:

- `institutions`: stable records for Al-Qasim Academy, Jamia Qasmia Lil-Baneen, and Jamia Zainab Lil-Banat.
- `programs`: formal and informal institution programs, including `al_qasim_school`, `qasmia_hifz`, `qasmia_nazira`, `qasmia_dars_nizami`, `zainab_dars_nizami`, `zainab_nazira`, and `zainab_school_support`.
- `school_classes`: seeded from `src/mock/classes.ts`, including Nursery through Class 12 for future scaling.
- `madrassa_categories` and `madrassa_subcategories`: seeded from `src/mock/categories.ts`.

Admission tables:

- `admission_applications`: source, variant key, reference number, workflow status, normalized applicant fields, `formData` JSON, `photoPath`, target academic fields, timestamps, and audit fields.
- `admission_events`: append-only history for status changes, notes, interviews, document checks, waitlist movement, acceptance, rejection, and retryable failures.
- `number_sequences`: transactional counters by year, institution, program, target class/subcategory, and sequence type.

Student and family tables:

- `students`: identity/person record only.
- `student_enrollments`: links a student to institution, program, school class or madrassa subcategory/darja, admission number, roll number, start/end dates, and status.
- `guardians`: contact/family records keyed by CNIC and phone where available, with optional `userId` linking to Better Auth `user.id`.
- `student_guardians`: student-to-guardian relation records.
- `student_siblings`: explicit confirmed sibling links stored once per pair using a canonical ordered pair, with service methods returning sibling relationships in both directions.

## Workflow

Public submission:

1. Validate variant and required form fields.
2. Resolve target institution/program from the variant.
3. Store normalized fields and raw `formData`.
4. Store photo under `public/uploads/admissions/...` and save `photoPath`.
5. Generate `application_ref`.
6. Set status to `pending`.

Admin direct admission:

1. Validate form and target academic placement.
2. Suggest guardian and sibling matches by CNIC first, phone second.
3. Admin confirms guardian reuse/new guardian and sibling links.
4. Create student, enrollment, guardian links, sibling links, and audit events.
5. Generate admission and roll numbers transactionally.

Queue workflow statuses:

- `pending`
- `under_review`
- `interview_scheduled`
- `documents_pending`
- `waitlisted`
- `accepted`
- `rejected`

Acceptance:

1. Admin confirms target placement, guardian decision, sibling links, and whether to create a parent login.
2. If parent login is not selected, create student/enrollment/guardian links and mark accepted.
3. If parent login is selected, validate email/phone before creating records.
4. Parent user creation is part of acceptance. If Better Auth parent creation fails, the application remains unaccepted and no student/enrollment should remain created.
5. Record retryable failure details in `admission_events` without changing status to `accepted`.

## Validation and Permissions

- Public users can only create applications.
- Authenticated admin/receptionist roles can create direct admissions and update review workflow where permitted.
- Only roles with `admission_queue.approve` can accept or reject.
- Variant-to-program mapping must be enforced server-side.
- Al-Qasim admissions require a formal school class.
- Jamia Zainab school-support class is optional and limited to Nursery through Class 5.
- Madrassa admissions require the relevant category/subcategory or darja.
- Accepted applications cannot be accepted again.
- Duplicate student or guardian matches create warnings/suggestions, not automatic links.

## Seeding and Migration

Add Drizzle schema files, update the schema export/import pattern used by `src/db/index.ts`, then generate a migration with `bun run db:generate`.

Seed stable academic IDs from existing frontend data:

- Institutions and programs from the approved mapping.
- School classes from `src/mock/classes.ts`.
- Madrassa categories/subcategories from `src/mock/categories.ts`.

Seeds must be idempotent so local development and future deployments can safely rerun them.

## Rollout Plan

1. Add schema, migration, and seed utilities.
2. Add admission server services and API routes.
3. Wire public `/apply` to real applications.
4. Wire admin `/admission/new` to direct student creation.
5. Wire queue, interviews, documents, and waitlist to real application workflow.
6. Replace admission dashboard/interview mock counts with API data.

Existing mocks may remain temporarily for modules outside admissions.

## Open Implementation Notes

- Use local disk photo storage for this phase: `public/uploads/admissions/<record-id>/<filename>`.
- Keep full `formData` even after acceptance for exact print output and audit.
- Keep number generation inside database transactions to prevent duplicate references.
- Parent account creation should use Better Auth APIs consistently with the existing user-management module.
