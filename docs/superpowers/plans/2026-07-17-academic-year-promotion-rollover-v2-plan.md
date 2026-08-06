# Academic Year, Promotion, and Rollover V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the V1 academic-year foundation and V2 promotion/rollover controls in one production-ready flow.

**Architecture:** Add `academic_years` and year-scope `student_enrollments` first, then layer promotion rules, dry-run previews, transactional apply, finance carry-forward, teacher rollover, locking, reports, and local notifications. Keep API routes thin and place business logic in `src/lib/server/...`; keep UI data fetching behind TanStack Query key factories.

**Tech Stack:** TanStack Start, TanStack Router file API routes, TanStack Query, React 19, TypeScript 7, Drizzle ORM, PostgreSQL, Better Auth, shadcn/Radix UI.

## Global Constraints

- Do not start the dev server unless explicitly requested.
- No direct student creation outside admissions.
- No SMS, WhatsApp, email, push, or third-party notification providers.
- Only one academic year may be `active` at a time.
- Promotion apply must be explicit and confirmed; dry-run preview never mutates enrollments.
- Existing exam sessions and teacher assignments keep `academicYear` text during this rollout.
- Old-year finance ledgers remain unchanged; carry-forward creates a new-year opening charge.
- Use TanStack Query array keys and targeted invalidation.

---

## File Structure

- Create `src/db/schema/academic-years.ts`: academic year and promotion tables.
- Modify `src/db/index.ts`: include the new schema namespace.
- Modify `src/db/schema/students.ts`: add nullable `academicYearId` to `student_enrollments`.
- Modify `src/lib/server/students/events.ts`: add promotion event types.
- Create `src/lib/server/academic-years/domain.ts`: pure status, date, backfill, and locking helpers.
- Create `src/lib/server/academic-years/service.ts`: CRUD, activation, backfill, locking, and year guards.
- Create `src/lib/server/academic-years/domain.test.ts`: pure academic-year tests.
- Create `src/routes/api/academic-years/index.ts`, `src/routes/api/academic-years/$id.ts`, `src/routes/api/academic-years/$id/activate.ts`, `src/routes/api/academic-years/$id/lock.ts`, `src/routes/api/academic-years/backfill.ts`.
- Create `src/lib/server/promotions/domain.ts`: promotion rule matching and preview evaluation.
- Create `src/lib/server/promotions/service.ts`: promotion rule CRUD, dry-run creation, apply, finance carry-forward, teacher rollover.
- Create `src/lib/server/promotions/domain.test.ts`: promotion preview tests.
- Create API routes under `src/routes/api/promotions/...`.
- Create `src/components/academic-years/academic-year-api.ts`, `src/components/academic-years/academic-year-workspace.tsx`, `src/components/promotions/promotion-api.ts`, `src/components/promotions/promotion-workspace.tsx`.
- Replace `src/routes/_authenticated/settings/academic-year.tsx` seed-state UI with the backend-driven workspace.

---

### Task 1: Schema and Migration Foundation

**Files:**

- Create: `src/db/schema/academic-years.ts`
- Modify: `src/db/index.ts`
- Modify: `src/db/schema/students.ts`
- Modify: `src/lib/server/students/events.ts`
- Generate: `drizzle/*.sql`

**Interfaces:**

- Produces `academicYears`, `promotionRules`, `promotionRuns`, `promotionRunItems`.
- Produces `studentEnrollments.academicYearId`.
- Produces student event types `promotion_applied`, `promotion_repeated`, `promotion_graduated`, `promotion_dropout`, `promotion_inactive`.

- [ ] Add `src/db/schema/academic-years.ts` with these exported types and tables:

```ts
export type AcademicYearStatus = "upcoming" | "active" | "locked" | "archived";
export type PromotionSystem = "school" | "madrassa";
export type PromotionOutcome =
  | "promote"
  | "repeat"
  | "graduate"
  | "dropout"
  | "inactive"
  | "blocked";
export type PromotionRunStatus = "draft" | "previewed" | "applied" | "failed" | "cancelled";
export type PromotionItemStatus =
  | "ready"
  | "warning"
  | "blocked"
  | "applied"
  | "failed"
  | "skipped";
```

- [ ] Define `academicYears` with `id`, `name`, `hijriName`, `startDate`, `endDate`, `status`, `carryForwardEnabled`, `lockedAt`, `lockedByUserId`, timestamps, and a partial unique index for one active year:

```ts
uniqueIndex("academic_years_one_active_idx")
  .on(table.status)
  .where(sql`${table.status} = 'active'`);
```

- [ ] Define `promotionRules` with source/target placement columns for school and madrassa scopes, `outcome`, `active`, and `displayOrder`.
- [ ] Define `promotionRuns` with `sourceAcademicYearId`, `targetAcademicYearId`, `system`, `institutionId`, `programId`, `status`, `carryForwardFees`, `includeTeacherRollover`, `createdByUserId`, `appliedAt`, and `appliedByUserId`.
- [ ] Define `promotionRunItems` with `runId`, `studentId`, `sourceEnrollmentId`, `targetEnrollmentId`, `outcome`, `status`, `warnings`, `blockers`, `carryForwardAmountPaisa`, `metadata`, and timestamps.
- [ ] Add `academicYearId` to `studentEnrollments` as nullable first:

```ts
academicYearId: text("academic_year_id").references(() => academicYears.id, { onDelete: "restrict" }),
```

- [ ] Add indexes on `student_enrollments.academic_year_id` and `(student_id, academic_year_id)`.
- [ ] Import/export the new schema in `src/db/index.ts`.
- [ ] Add promotion event types to `studentEventTypes` in `src/lib/server/students/events.ts`.
- [ ] Run `bun run db:generate`.
- [ ] Inspect generated SQL and verify it only adds the new tables, indexes, and nullable enrollment column.
- [ ] Do not run `bun run db:migrate` until Task 2 has the setup/backfill service ready.

---

### Task 2: Academic Year Domain, Service, API, and Backfill

**Files:**

- Create: `src/lib/server/academic-years/domain.ts`
- Create: `src/lib/server/academic-years/service.ts`
- Create: `src/lib/server/academic-years/domain.test.ts`
- Create: `src/routes/api/academic-years/index.ts`
- Create: `src/routes/api/academic-years/$id.ts`
- Create: `src/routes/api/academic-years/$id/activate.ts`
- Create: `src/routes/api/academic-years/$id/lock.ts`
- Create: `src/routes/api/academic-years/backfill.ts`

**Interfaces:**

- Produces `academicYearInputSchema`, `academicYearUpdateSchema`, `listAcademicYears(request)`, `createAcademicYear(request, input)`, `activateAcademicYear(request, id)`, `lockAcademicYear(request, id)`, `backfillActiveEnrollments(request, academicYearId)`, `requireEditableAcademicYearId(academicYearId)`.
- Consumes `academicYears` and `studentEnrollments.academicYearId`.

- [ ] Write `src/lib/server/academic-years/domain.test.ts` with tests:

```ts
import {
  assertValidAcademicYearDates,
  nextAcademicYearStatus,
} from "@/lib/server/academic-years/domain";

test("rejects academic year end date before start date", () => {
  expect(() => assertValidAcademicYearDates("2026-08-01", "2026-07-31")).toThrow(
    "End date must be after start date",
  );
});

test("activating upcoming year archives previous active year", () => {
  expect(nextAcademicYearStatus("active", "activate_other")).toBe("archived");
});
```

- [ ] Run `bun test src/lib/server/academic-years/domain.test.ts` and confirm it fails because the module does not exist.
- [ ] Implement `assertValidAcademicYearDates(startDate: string, endDate: string): void`.
- [ ] Implement `nextAcademicYearStatus(current: AcademicYearStatus, action: "activate_self" | "activate_other" | "lock" | "archive"): AcademicYearStatus`.
- [ ] Add Zod schemas:

```ts
export const academicYearInputSchema = z.object({
  name: z.string().trim().min(1),
  hijriName: z.string().trim().optional().nullable(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  carryForwardEnabled: z.boolean().default(true),
});
```

- [ ] Implement `listAcademicYears`, `createAcademicYear`, `updateAcademicYear`, `activateAcademicYear`, `lockAcademicYear`, and `archiveAcademicYear` in `service.ts`.
- [ ] Use `requirePermission(request, "settings_academic_year", "view")` for listing.
- [ ] Use `requirePermission(request, "settings_academic_year", "manage")` for create/update/activate/lock/archive/backfill.
- [ ] Implement `backfillActiveEnrollments(request, academicYearId)` to update active enrollments where `endedAt is null` and `academicYearId is null`.
- [ ] Implement `requireEditableAcademicYearId(academicYearId)` to throw `HttpError("Academic year is locked", 409)` for locked/archived years.
- [ ] Add thin TanStack API routes using `json`, `parseJsonBody`, and `errorResponse`.
- [ ] Run `bun test src/lib/server/academic-years/domain.test.ts`.
- [ ] Run `bun run db:migrate` with local Postgres access.
- [ ] Verify the migration with a direct query for `academic_years` and `student_enrollments.academic_year_id`.

---

### Task 3: Enrollment Year Integration

**Files:**

- Modify: `src/lib/server/admission/service.ts`
- Modify: `src/lib/server/students/service.ts`
- Modify: `src/lib/server/academic-years/service.ts`
- Test: `src/lib/server/academic-years/domain.test.ts`

**Interfaces:**

- Consumes `getActiveAcademicYear()` from `academic-years/service.ts`.
- Produces admissions and move-enrollment behavior that always keeps new active enrollments year-scoped.

- [ ] Add `getActiveAcademicYear()` to `academic-years/service.ts`; it returns the one active year or throws `HttpError("No active academic year is configured", 409)`.
- [ ] Update admission acceptance enrollment creation to set `academicYearId` from `getActiveAcademicYear()`.
- [ ] Update manual enrollment move logic to preserve the current enrollment `academicYearId`; moves are placement corrections, not year rollovers.
- [ ] Add service guards so a locked enrollment year blocks normal edit/move operations.
- [ ] Add a domain test for active-year requirement:

```ts
test("active academic year is required before creating new enrollments", () => {
  expect(() => assertActiveAcademicYear(null)).toThrow("No active academic year is configured");
});
```

- [ ] Implement `assertActiveAcademicYear(year: { id: string } | null | undefined): { id: string }`.
- [ ] Run `bun test src/lib/server/academic-years/domain.test.ts`.
- [ ] Run `bun run lint`.

---

### Task 4: Promotion Rule and Preview Engine

**Files:**

- Create: `src/lib/server/promotions/domain.ts`
- Create: `src/lib/server/promotions/service.ts`
- Create: `src/lib/server/promotions/domain.test.ts`
- Create: `src/routes/api/promotions/rules.ts`
- Create: `src/routes/api/promotions/preview.ts`
- Create: `src/routes/api/promotions/runs/$id.ts`

**Interfaces:**

- Produces `promotionPreviewSchema`, `evaluatePromotionCandidate(input)`, `createPromotionPreview(request, input)`.
- Consumes active academic years, promotion rules, student enrollments, academic setup tables.

- [ ] Write `src/lib/server/promotions/domain.test.ts` with tests:

```ts
import { evaluatePromotionCandidate } from "@/lib/server/promotions/domain";

test("blocks promotion when no matching rule exists", () => {
  const result = evaluatePromotionCandidate({
    system: "school",
    enrollment: { schoolClassId: "class-1", schoolSectionId: "sec-a", madrassaSubcategoryId: null },
    rules: [],
  });
  expect(result.status).toBe("blocked");
  expect(result.blockers).toContain("No promotion rule found for current placement");
});

test("returns ready promotion when a school rule has a target class", () => {
  const result = evaluatePromotionCandidate({
    system: "school",
    enrollment: { schoolClassId: "class-1", schoolSectionId: "sec-a", madrassaSubcategoryId: null },
    rules: [
      {
        id: "rule-1",
        system: "school",
        outcome: "promote",
        sourceSchoolClassId: "class-1",
        sourceMadrassaSubcategoryId: null,
        targetSchoolClassId: "class-2",
        targetMadrassaSubcategoryId: null,
      },
    ],
  });
  expect(result.status).toBe("ready");
  expect(result.target.schoolClassId).toBe("class-2");
});
```

- [ ] Run `bun test src/lib/server/promotions/domain.test.ts` and confirm it fails.
- [ ] Implement `evaluatePromotionCandidate` as a pure function returning:

```ts
type PromotionEvaluation = {
  outcome: PromotionOutcome;
  status: "ready" | "warning" | "blocked";
  target: {
    schoolClassId: string | null;
    schoolSectionId: string | null;
    madrassaSubcategoryId: string | null;
    darja: string | null;
  };
  warnings: string[];
  blockers: string[];
};
```

- [ ] Add `promotionPreviewSchema` with `sourceAcademicYearId`, `targetAcademicYearId`, `system`, `institutionId`, `programId`, optional class/section/subcategory filters, `carryForwardFees`, and `includeTeacherRollover`.
- [ ] Implement `createPromotionPreview(request, input)`:
  - require `settings_academic_year:manage`
  - reject same source/target year
  - reject locked target year
  - load active source enrollments
  - evaluate each student against rules
  - insert `promotion_runs` with status `previewed`
  - insert `promotion_run_items`
- [ ] Return `{ run, items, summary }` with counts for ready, warning, blocked, and carry-forward total.
- [ ] Add `POST /api/promotions/preview` and `GET /api/promotions/runs/$id`.
- [ ] Run `bun test src/lib/server/promotions/domain.test.ts`.
- [ ] Run `bun run lint`.

---

### Task 5: Promotion Apply, Timeline, Notifications, and Finance Carry-Forward

**Files:**

- Modify: `src/lib/server/promotions/service.ts`
- Modify: `src/lib/server/finance/service.ts`
- Modify: `src/lib/server/notifications/domain.ts`
- Modify: `src/lib/server/notifications/student-events.ts`
- Create: `src/routes/api/promotions/runs/$id/apply.ts`
- Test: `src/lib/server/promotions/domain.test.ts`

**Interfaces:**

- Produces `applyPromotionRun(request, runId)`.
- Consumes `promotion_run_items` with status `ready` or `warning`.
- Produces new `student_enrollments` rows and optional opening balance fee charges.

- [ ] Add notification templates for promotion event types in `notificationTemplatesForStudentEvent`.
- [ ] Add `createOpeningBalanceCharge(tx, input)` in finance service with:

```ts
type OpeningBalanceInput = {
  studentId: string;
  enrollmentId: string;
  institutionId: string;
  programId: string;
  amountPaisa: number;
  sourceEnrollmentId: string;
  academicYearName: string;
  actorUserId: string;
};
```

- [ ] In `applyPromotionRun`, require `settings_academic_year:manage`.
- [ ] Reject runs not in `previewed` status.
- [ ] Re-check source/target year lock status.
- [ ] For each ready/warning item in a transaction:
  - close old enrollment with `endedAt`
  - create new enrollment for promoted/repeated students
  - update student status for graduate/dropout/inactive
  - create opening balance charge when `carryForwardAmountPaisa > 0`
  - write `student_events`
  - update `promotion_run_items`
- [ ] Mark blocked items as skipped.
- [ ] Mark the run as `applied` with `appliedAt` and `appliedByUserId`.
- [ ] Add `POST /api/promotions/runs/$id/apply`.
- [ ] Add a domain test for outcome-to-event mapping:

```ts
test("maps promotion outcome to student event type", () => {
  expect(studentEventTypeForPromotionOutcome("graduate")).toBe("promotion_graduated");
  expect(studentEventTypeForPromotionOutcome("repeat")).toBe("promotion_repeated");
});
```

- [ ] Run `bun test src/lib/server/promotions/domain.test.ts src/lib/server/notifications/domain.test.ts`.
- [ ] Run `bun run lint`.

---

### Task 6: Lock Guards and Teacher Rollover

**Files:**

- Modify: `src/lib/server/attendance/service.ts`
- Modify: `src/lib/server/exams/service.ts`
- Modify: `src/lib/server/finance/service.ts`
- Modify: `src/lib/server/teachers/service.ts`
- Modify: `src/lib/server/promotions/service.ts`
- Create: `src/routes/api/promotions/runs/$id/teacher-rollover.ts`

**Interfaces:**

- Consumes `requireEditableAcademicYearId`.
- Produces `previewTeacherRollover(request, runId)` and `applyTeacherRollover(request, runId)`.

- [ ] Add lock checks before write operations in attendance marking, exam mutation/publishing, fee charge/payment/reversal/refund, and teacher assignment/timetable mutations.
- [ ] For services that only have `academicYear` text, resolve it through `academicYears.name` before checking lock.
- [ ] Implement `previewTeacherRollover(request, runId)` to list source teacher assignments/timetable rows and warnings for invalid target placements.
- [ ] Implement `applyTeacherRollover(request, runId)` to copy valid assignments and timetable periods to target academic year text.
- [ ] Add `POST /api/promotions/runs/$id/teacher-rollover`.
- [ ] Run focused service tests if available.
- [ ] Run `bun run lint`.

---

### Task 7: Academic Year and Promotion UI

**Files:**

- Create: `src/components/academic-years/academic-year-api.ts`
- Create: `src/components/academic-years/academic-year-workspace.tsx`
- Create: `src/components/promotions/promotion-api.ts`
- Create: `src/components/promotions/promotion-workspace.tsx`
- Modify: `src/routes/_authenticated/settings/academic-year.tsx`

**Interfaces:**

- Produces `academicYearKeys`, `promotionKeys`.
- Consumes the API routes from Tasks 2, 4, 5, and 6.

- [ ] Add `academicYearKeys`:

```ts
export const academicYearKeys = {
  all: ["academic-years"] as const,
  lists: () => [...academicYearKeys.all, "list"] as const,
  list: () => [...academicYearKeys.lists()] as const,
};
```

- [ ] Add API functions: `listAcademicYears`, `createAcademicYear`, `updateAcademicYear`, `activateAcademicYear`, `lockAcademicYear`, `backfillActiveEnrollments`.
- [ ] Add `promotionKeys` and API functions: `listPromotionRules`, `createPromotionRule`, `createPromotionPreview`, `getPromotionRun`, `applyPromotionRun`, `applyTeacherRollover`.
- [ ] Replace seed-state academic year UI with backend data:
  - active year summary
  - year list
  - create/edit actions
  - activate/lock/archive confirmation dialogs
  - backfill action shown only when active enrollments without year exist
- [ ] Add promotion workspace tab/section:
  - source year
  - target year
  - system/institution/program/class/subcategory filters
  - carry-forward and teacher-rollover toggles
  - preview button
  - preview results table
  - apply confirmation dialog
  - post-apply report summary
- [ ] Keep the UI operational and dense; do not add marketing/landing sections.
- [ ] Invalidate `academicYearKeys.all`, `promotionKeys.all`, student query keys, fee query keys, and notification keys after apply.
- [ ] Run `bun run lint`.
- [ ] Run `bun run build`.

---

### Task 8: Final Migration, Backfill, and Verification

**Files:**

- Generate/modify: `drizzle/*.sql`
- Review: `drizzle/meta/_journal.json`

**Interfaces:**

- Consumes all earlier tasks.
- Produces applied database schema and verified build.

- [ ] Run `bun run db:generate` after all schema edits.
- [ ] Review generated migration SQL for:
  - `academic_years`
  - `promotion_rules`
  - `promotion_runs`
  - `promotion_run_items`
  - `student_enrollments.academic_year_id`
  - indexes and foreign keys
- [ ] Run `bun run db:migrate` with local Postgres access.
- [ ] Create the first active academic year through the API or DB-safe setup path.
- [ ] Run the backfill endpoint for existing active enrollments.
- [ ] Verify with SQL:

```sql
select status, count(*) from academic_years group by status;
select count(*) from student_enrollments where ended_at is null and academic_year_id is null;
```

Expected: one `active` academic year and zero active enrollments without `academic_year_id`.

- [ ] Run focused tests:

```bash
bun test src/lib/server/academic-years/domain.test.ts
bun test src/lib/server/promotions/domain.test.ts
bun test src/lib/server/notifications/domain.test.ts
```

- [ ] Run `bun run lint`.
- [ ] Run `bun run build`.
- [ ] Do not start the dev server unless explicitly requested.

---

## Self-Review

- Spec coverage: academic years, enrollment linkage, promotion rules, dry-run, apply, finance carry-forward, locking, teacher rollover, reports/UI, local notifications, and tests are all mapped to tasks.
- Red-flag scan: no task uses vague filler language.
- Type consistency: status/outcome names match the approved spec and are defined in Task 1 before later tasks use them.
