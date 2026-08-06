# Academic Year, Promotion, and Rollover V2 Design

## Scope

This design includes both the V1 foundation and the V2 production controls for academic-year management. It makes academic years real backend records, links enrollments to an academic year, and adds controlled promotion/rollover workflows for school and madrassa students.

Included:

- Academic year CRUD, activation, locking, and archival.
- Year-scoped student enrollments.
- Promotion rules for school classes and madrassa darja/subcategories.
- Promotion dry-run preview with warnings and blockers.
- Bulk apply workflow with audit/history.
- Finance carry-forward into the new academic year.
- Teacher assignment and timetable rollover.
- Promotion reports and local in-app parent notifications.

Not included:

- Direct student creation outside admissions.
- External notification providers such as SMS, WhatsApp, email, or push.
- Fully automated promotion decisions without admin confirmation.
- Cross-institution transfer workflows beyond the existing move-enrollment model.

## Current Repository Context

The current `settings/academic-year` route is frontend seed state only. `student_enrollments` already stores lifecycle dates with `startedAt` and `endedAt`, but it does not yet reference an academic year. Exams and teacher assignments store `academicYear` as plain text. Fees are linked to `enrollmentId`, which makes year-based carry-forward possible once enrollments are year-scoped.

The required foundation is to introduce a proper `academic_years` table and link related records to it incrementally without breaking existing text-based exam and teacher data.

## Data Model

Add `academic_years`:

- `id`
- `name`, for example `2026-2027`
- `hijriName`
- `startDate`
- `endDate`
- `status`: `upcoming`, `active`, `locked`, `archived`
- `carryForwardEnabled`
- `lockedAt`, `lockedByUserId`
- timestamps

The database and service layer must enforce that only one academic year can be `active` at a time. Activating a new year archives or locks the previous active year through an explicit server action, not silent UI-only state.

Add `academicYearId` to `student_enrollments`. Existing active enrollments are backfilled into the current active academic year during setup. `startedAt` and `endedAt` remain lifecycle dates.

Add promotion tables:

- `promotion_rules`: reusable next-placement rules.
- `promotion_runs`: one dry-run/apply batch.
- `promotion_run_items`: per-student decision, warnings, blockers, and resulting enrollment.

Promotion item outcomes are `promote`, `repeat`, `graduate`, `dropout`, `inactive`, and `blocked`.

## Core Workflow

Admins first create or activate an academic year. If no active year exists, the app blocks promotion and requires setup. Existing active enrollments are assigned to the active year before any rollover runs.

Promotion always starts as a dry run. The service loads eligible active students for a source academic year, evaluates promotion rules, checks institution/program/gender constraints, detects missing placements or duplicate roll numbers, and calculates optional finance carry-forward. The preview shows each student as ready, warning, or blocked.

Applying a promotion run is explicit. For ready rows, the service closes the old enrollment, creates a new enrollment for the target academic year, writes `student_events`, and records the result on the run item. Blocked rows are skipped. The operation must be transactional per student so one failure does not corrupt the whole batch.

## Migration and Backfill

The initial migration adds the academic-year tables and nullable `academicYearId` on enrollments. The setup flow then creates the first active academic year and backfills existing active enrollments into it. After backfill is verified, future enrollments created from admissions must always receive the active academic year.

Existing exam sessions and teacher assignments keep their `academicYear` text during the first rollout. Later normalization can add `academicYearId` to those tables after the core enrollment rollover path is stable.

## Finance Carry Forward

Old-year fee ledgers remain unchanged. If carry-forward is enabled, the service calculates outstanding balance for the old enrollment and creates an opening balance charge on the new enrollment. This preserves historical receipts, reversals, refunds, and adjustments while giving the new academic year a clear payable opening amount.

## Academic Year Locking

Locked years prevent normal edits to attendance, exams, fees, teacher assignments, and promotion runs tied to that year. Locking does not delete data. Super admin/admin correction paths can unlock or apply controlled corrections with audit metadata.

Lock checks should live in server services, not only in UI controls.

## Teacher Rollover

Teacher assignments and timetable periods can be copied from the source academic year to the target academic year. Copied records keep the same institution/program/class/darja/subject placement where still valid. Invalid placements are reported as blockers or warnings in a teacher rollover preview.

## UI

Replace the current mock academic-year page with a backend-driven workspace:

- Active year summary.
- Academic year list.
- Create/edit/activate/lock/archive actions.
- Promotion workspace with source year, target year, system, institution, program, and class/darja filters.
- Preview table with status, proposed placement, finance carry-forward, and blockers.
- Apply confirmation dialog for irreversible enrollment changes.
- Promotion report view after apply.

The UI should use TanStack Query key factories and targeted invalidation. Server routes should remain thin and delegate business logic to `src/lib/server`.

## Permissions

Viewing academic years requires `settings_academic_year:view`. Managing years, locking, and applying promotion requires `settings_academic_year:manage`. Student enrollment changes must also respect existing student module permissions for the relevant school or madrassa system.

## Notifications and Timeline

Promotion application writes student timeline events for promoted, repeated, graduated, dropout, and inactive outcomes. Parent-facing local in-app notifications are generated only after apply, never during dry-run preview.

## Error Handling

The preview phase should return structured blockers instead of throwing for expected business problems. Examples include missing next class, missing target subcategory, invalid institution/program pairing, gender mismatch, locked source year, or no active target year.

Apply should fail fast for invalid run state, locked years, unauthorized user, or stale preview data. Per-student failures are recorded on `promotion_run_items`.

## Testing

Focused tests should cover:

- only one active academic year
- backfilling existing enrollments
- promotion rule evaluation
- dry-run blockers and warnings
- applying promotion creates new enrollment and closes the old one
- repeat/graduate/dropout/inactive outcomes
- finance carry-forward opening balance
- locked-year edit protection
- parent notification and student timeline creation

Verification commands:

- `bun run db:generate`
- `bun run db:migrate`
- `bun test` for focused server/domain tests
- `bun run lint`
- `bun run build`
