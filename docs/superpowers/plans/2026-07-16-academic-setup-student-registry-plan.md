# Academic Setup and Student Registry Implementation Plan

Design source: `docs/superpowers/specs/2026-07-16-academic-setup-student-registry-design.md`

## Scope

Implement database-backed academic setup and student registry. This plan preserves the approved rule: students are created only through admission flows. Registry screens manage existing students after admission and must not expose a direct "Add Student" action.

## Phase 1: Schema and Migration Review

1. Review existing tables in `src/db/schema/academic.ts` and `src/db/schema/students.ts`.
2. Add `student_events` only if lifecycle history cannot be represented safely with existing columns.
   - Fields: `id`, `studentId`, `enrollmentId`, `type`, `message`, `metadata`, `actorUserId`, `createdAt`.
3. Generate a Drizzle migration if `student_events` or indexes are added.
4. Confirm `drizzle.config.ts` continues to include `src/db/schema/**/*.ts`.

## Phase 2: Academic Server Services

1. Add `src/lib/server/academic/authz.ts`.
   - Reuse Better Auth session and existing permission defaults.
   - Map school setup to `school_classes`.
   - Map madrassa setup to `madrassa_categories`.

2. Add `src/lib/server/academic/service.ts`.
   - List institutions and programs.
   - List school classes with sections and active enrollment counts.
   - Create/edit/deactivate school classes.
   - Create/edit/deactivate school sections.
   - List madrassa categories/subcategories with institution/program context.
   - Create/edit/deactivate madrassa categories/subcategories.
   - Block deletion/deactivation where active enrollments would be orphaned.

3. Preserve institution boundaries:
   - Al-Qasim Academy is standalone formal school.
   - Jamia Qasmia Lil-Baneen is boys madrassa.
   - Jamia Zainab Lil-Banat is girls madrassa.
   - Jamia Zainab school support is nested/informal and limited to Nursery through Class 5.

## Phase 3: Academic API Routes

1. Add `GET /api/academic/institutions`.
2. Add `GET /api/academic/programs`.
3. Add `GET /api/academic/school/classes`.
4. Add `POST /api/academic/school/classes`.
5. Add `PATCH /api/academic/school/classes/$id`.
6. Add `POST /api/academic/school/classes/$id/sections`.
7. Add `PATCH /api/academic/school/classes/$id/sections/$sectionId`.
8. Add `GET /api/academic/madrassa/categories`.
9. Add `POST /api/academic/madrassa/categories`.
10. Add `PATCH /api/academic/madrassa/categories/$id`.
11. Add `POST /api/academic/madrassa/categories/$id/subcategories`.
12. Add `PATCH /api/academic/madrassa/categories/$id/subcategories/$subcategoryId`.

## Phase 4: Student Server Services

1. Add `src/lib/server/students/types.ts`.
   - Shared status, query, lifecycle, guardian, sibling, and enrollment schemas.

2. Add `src/lib/server/students/service.ts`.
   - List students by system (`school`, `madrassa`) with filters.
   - Read profile by student ID.
   - Update identity/contact-safe fields.
   - Update guardian details.
   - Attach existing guardian to student.
   - Confirm or remove sibling links.
   - Move enrollment to another class/section/program/subcategory where valid.
   - Mark lifecycle status with a reason.

3. Do not add a student creation service for registry screens.
   - Student creation remains in `src/lib/server/admission/service.ts`.
   - Any future import/repair tool must be designed separately.

## Phase 5: Student API Routes

1. Add `GET /api/students`.
   - Query: `system`, `status`, `q`, `institutionId`, `programId`, `classId`, `subcategoryId`, `page`, `pageSize`.

2. Add `GET /api/students/$id`.
3. Add `PATCH /api/students/$id`.
4. Add `PATCH /api/students/$id/status`.
5. Add `POST /api/students/$id/guardians`.
6. Add `PATCH /api/students/$id/guardians/$guardianId`.
7. Add `POST /api/students/$id/siblings`.
8. Add `DELETE /api/students/$id/siblings/$siblingId`.
9. Add `POST /api/students/$id/enrollments/move`.

All write routes must require the matching `school_students` or `madrassa_students` permission.

## Phase 6: Academic UI Wiring

1. Replace mock state in `/school/classes`.
   - Fetch classes and sections from `/api/academic/school/classes`.
   - Persist class and section changes through API calls.
   - Show enrollment counts from real data.

2. Replace mock state in `/madrassa/categories`.
   - Fetch categories/subcategories from `/api/academic/madrassa/categories`.
   - Persist category/subcategory changes through API calls.
   - Display boys/girls institution context where relevant.

3. Review `/madrassa/classes`.
   - Either wire it to the same madrassa subcategory API or consolidate it with `/madrassa/categories` if it duplicates the same data.

## Phase 7: Student Registry UI Wiring

1. Update `StudentsTable`.
   - Replace mock `students` with API data.
   - Keep filters and pagination.
   - Show institution/program context.
   - Remove any direct Add Student path.
   - Empty state should direct users to `/admission/new`.

2. Update `/school/students` and `/madrassa/students`.
   - Pass system filter to API-backed table.
   - Keep page headers clear.

3. Update `StudentDetailsSheet`.
   - Read real profile data.
   - Show enrollment history, guardians, parent account link status, siblings, and admission source.

4. Update `/students/$id`.
   - Use the same profile API.
   - Add lifecycle, guardian, sibling, and enrollment move actions.

5. Remove or stop using `AddStudentDialog` from registry pages.
   - Keep the file only if another page still imports it; otherwise delete it.

## Phase 8: Lifecycle and Relationship Actions

1. Implement lifecycle dialog:
   - active
   - inactive
   - transferred
   - dropout
   - graduated
   - reason/note required for non-active statuses

2. Implement enrollment move dialog:
   - School: class and section.
   - Madrassa: institution, program, category/subcategory/darja.
   - Validate Jamia Qasmia boys and Jamia Zainab girls boundaries server-side.

3. Implement guardian management:
   - Update guardian contact fields.
   - Link an existing guardian by CNIC/phone.
   - Preserve linked Better Auth parent user where present.

4. Implement sibling management:
   - Search students.
   - Add sibling link using canonical ordered pair.
   - Remove sibling link from either profile direction.

## Phase 9: Verification

1. Run `bun run db:generate` if schema changed.
2. Run `bun run db:migrate` after Postgres is available.
3. Run `bunx tsc --noEmit --pretty false`.
4. Run `bun run build`.
5. Run `bun run lint` if the TypeScript 7 / `@typescript-eslint` compatibility issue is resolved.
6. Smoke test:
   - Admission creates a student.
   - School students list shows Al-Qasim school enrollments.
   - Madrassa students list separates Jamia Qasmia boys and Jamia Zainab girls.
   - Registry does not expose Add Student.
   - Student profile shows enrollment, guardian, sibling, and admission source.
   - Lifecycle status changes persist.
   - Existing admission queue acceptance still works.

## Known Environment Blockers

- Local Postgres was not running during the last verification attempt.
- Docker daemon was unavailable from this session.
- Lint was blocked by `@typescript-eslint` compatibility with TypeScript 7.
