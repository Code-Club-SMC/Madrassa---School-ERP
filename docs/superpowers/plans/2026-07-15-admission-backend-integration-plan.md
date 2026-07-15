# Admission Backend Integration Implementation Plan

Design source: `docs/superpowers/specs/2026-07-15-admission-backend-integration-design.md`

## Scope

Implement the approved admission-first structured backend. This plan covers academic seed tables, students, guardians, enrollments, siblings, applications, workflow events, number sequences, admission APIs, and admission UI wiring. It intentionally excludes full backend work for fees, attendance, exams, timetables, reports, and SMS.

## Phase 1: Schema Foundation

1. Add `src/db/schema/academic.ts`.
   - Tables: `institutions`, `programs`, `schoolClasses`, `madrassaCategories`, `madrassaSubcategories`.
   - Use stable text IDs that match frontend concepts.
   - Include fields for `system`, `formal/informal`, level, roll prefix, display names, Urdu names, and active status.

2. Add `src/db/schema/students.ts`.
   - Tables: `students`, `studentEnrollments`, `guardians`, `studentGuardians`, `studentSiblings`.
   - Keep student identity separate from enrollment placement.
   - Store sibling links once per canonical ordered pair and expose bidirectional reads in service code.

3. Add `src/db/schema/admission.ts`.
   - Tables: `admissionApplications`, `admissionEvents`, `numberSequences`.
   - Store normalized applicant fields plus raw `formData` JSON and `photoPath`.
   - Add indexes for status, ref number, guardian phone/CNIC, target program, and created date.

4. Update schema exports/imports.
   - Keep Better Auth schema in `src/db/schema/auth.ts`.
   - Ensure Drizzle sees every schema file via `drizzle.config.ts`.
   - Update `src/db/index.ts` schema imports if needed.

## Phase 2: Seed Data

1. Add server-side seed utility under `src/lib/server/admission/seed.ts` or `src/lib/server/academic/seed.ts`.
2. Seed stable institutions:
   - `al_qasim_academy`
   - `jamia_qasmia_baneen`
   - `jamia_zainab_banat`
3. Seed programs:
   - `al_qasim_school`
   - `qasmia_hifz`
   - `qasmia_nazira`
   - `qasmia_dars_nizami`
   - `zainab_dars_nizami`
   - `zainab_nazira`
   - `zainab_school_support`
4. Seed `schoolClasses` from `src/mock/classes.ts`.
5. Seed madrassa categories/subcategories from `src/mock/categories.ts`.
6. Make seeding idempotent with upsert semantics.

## Phase 3: Server Services

1. Add `src/lib/server/admission/types.ts`.
   - Request/response types and shared status constants.

2. Add `src/lib/server/admission/numbering.ts`.
   - Generate `application_ref`, `admission_no`, and `roll_no`.
   - Use transactions and row-level sequence updates to avoid duplicates.

3. Add `src/lib/server/admission/validation.ts`.
   - Enforce variant-to-program mapping.
   - Enforce Al-Qasim formal class requirement.
   - Enforce Jamia Zainab school-support limit through Class 5.
   - Enforce madrassa category/subcategory or darja requirements.

4. Add `src/lib/server/admission/guardians.ts`.
   - Suggest guardian matches by CNIC first, phone second.
   - Return possible sibling suggestions from confirmed guardian links.
   - Create or reuse guardians only after admin confirmation.

5. Add `src/lib/server/admission/applications.ts`.
   - Create public applications.
   - List/filter queue.
   - Read detail.
   - Update workflow status.
   - Reject with reason.
   - Accept into student/enrollment.

6. Add `src/lib/server/admission/students.ts`.
   - Create direct admin admissions.
   - Create student, enrollment, guardian links, sibling links, and audit events.

7. Add parent-account handling.
   - If parent login is selected during acceptance, Better Auth parent creation is required.
   - If parent user creation fails, do not mark accepted and do not leave student/enrollment records created.

## Phase 4: API Routes

1. Add `POST /api/admission/applications`.
2. Add `GET /api/admission/applications`.
3. Add `GET /api/admission/applications/$id`.
4. Add `PATCH /api/admission/applications/$id/status`.
5. Add `POST /api/admission/applications/$id/accept`.
6. Add `POST /api/admission/applications/$id/reject`.
7. Add `GET /api/admission/guardian-suggestions`.
8. Add `POST /api/admission/students` for direct admin admission.

All authenticated routes must enforce existing permission concepts, especially `admission_new.create` and `admission_queue.approve`.

## Phase 5: File Uploads

1. Store admission photos under `public/uploads/admissions/<record-id>/`.
2. Validate file type and size server-side.
3. Store only the relative `photoPath` in Postgres.
4. Keep existing print renderer compatible with stored `photoPath` for reprints.

## Phase 6: Frontend Wiring

1. Update `PdfFormRenderer`.
   - Public mode posts to `POST /api/admission/applications`.
   - Admin mode posts to `POST /api/admission/students`.
   - Use backend ref/roll/admission numbers instead of random numbers.

2. Update `/admission/queue`.
   - Replace mock `applications` state with API data.
   - Add status transitions for review, interview, documents, waitlist, accept, and reject.
   - Add acceptance flow controls for guardian reuse, sibling confirmation, target placement, and optional parent login.

3. Update `/admission/interviews`.
   - Use real application data and workflow statuses.
   - Keep UI scope focused on scheduling/status/document checks.

4. Update admission dashboard counts.
   - Replace mock pending counts with API-backed counts.

## Phase 7: Migration and Verification

1. Run `bun run db:generate`.
2. Run `bun run db:migrate` against local Postgres.
3. Run seed utility.
4. Run `bun run build`.
5. Manually verify:
   - Public application creates pending queue item.
   - Admin direct admission creates student/enrollment/guardian.
   - Queue accept creates student/enrollment and marks application accepted.
   - Queue reject records reason and event.
   - Guardian/sibling suggestions appear but require confirmation.
   - Parent login creation failure blocks acceptance when selected.
   - Reprint works from stored form JSON/photo path.

## Rollback Notes

- Migrations should be isolated to new admission/academic/student tables plus any safe schema export changes.
- Existing Better Auth tables must not be rewritten.
- Existing mock-backed modules outside admission should continue to render during rollout.
