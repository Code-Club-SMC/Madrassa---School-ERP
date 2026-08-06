# Teacher Management V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Teacher Management V1 with a dedicated Add Teacher workflow, Better Auth-backed teacher identity, teacher profiles, salary input fields, assignments, timetable periods, teacher dashboard, and assignment-scoped student attendance access.

**Architecture:** Keep Better Auth `user` as the only login identity. The Teachers module creates teacher users through a server service, then stores teacher-only operational data in Drizzle tables linked one-to-one with `user.id`. Attendance remains student attendance; teachers can load and mark rosters only for assigned class/section or darja/subcategory placements.

**Tech Stack:** TanStack Start file routes, React, TypeScript, Better Auth admin/server API, Drizzle ORM, PostgreSQL, Zod, shadcn/Radix UI, TanStack Query-style fetch helpers where the local codebase already uses them.

## Global Constraints

- Do not add a separate teacher auth table.
- Do not create a login path outside Better Auth.
- `Teachers -> Add Teacher` creates a Better Auth user internally with `role = "teacher"`.
- User Accounts remains the global identity list, but is not required for teacher creation.
- Salary fields are input-only in V1: no payroll processing, salary disbursement, payslip generation, or payroll reports.
- Teacher/staff attendance is excluded.
- Teachers mark student attendance only for assigned classes/sections or madrassa darja/subcategories.
- Use existing `ResponsiveDialog` and `ResponsiveSheet` patterns for create/edit flows.
- Use confirmation dialogs for deactivate, remove assignment, and disable timetable period.
- Keep route files thin and move backend logic into `src/lib/server/teachers/`.
- Do not start the Vite dev server during implementation unless the user explicitly asks.

---

## Scope Check

The spec touches auth, teacher profiles, assignments, timetable, dashboard, and attendance gating. These are one connected subsystem because all flows depend on the `teacher_profiles` and `teacher_assignments` model. Payroll, staff attendance, leave, performance reviews, messaging, and salary slips stay outside this plan.

## File Structure

- Create `src/db/schema/teachers.ts`: Drizzle tables and relations for teacher profiles, assignments, and timetable periods.
- Modify `src/db/index.ts`: include teacher schema in Drizzle schema registry.
- Create `src/lib/server/teachers/domain.ts`: pure validation helpers for time overlap, placement checks, active status, and salary normalization.
- Create `src/lib/server/teachers/service.ts`: server-side teacher CRUD, Better Auth user creation, assignment APIs, timetable APIs, self-service dashboard APIs.
- Create `src/lib/server/teachers/domain.test.ts`: pure tests for overlap and placement helpers.
- Create `src/routes/api/teachers/*.ts`: API routes that delegate to teacher service.
- Create `src/components/teachers/teacher-types.ts`: UI payload types.
- Create `src/components/teachers/teacher-api.ts`: fetch helpers for teacher APIs.
- Create `src/components/teachers/add-teacher-dialog.tsx`: dedicated Add Teacher form.
- Create `src/components/teachers/teacher-workspace.tsx`: teacher list, filters, Add Teacher entry point.
- Create `src/components/teachers/teacher-profile-workspace.tsx`: profile, salary info, account, assignment, timetable tabs.
- Create `src/components/teachers/teacher-dashboard.tsx`: teacher self-service dashboard content.
- Replace `src/routes/_authenticated/teachers/index.tsx`: thin wrapper around teacher workspace.
- Replace `src/routes/_authenticated/teachers/$id.tsx`: thin wrapper around teacher profile workspace.
- Modify `src/routes/_authenticated/dashboard.tsx`: render teacher dashboard for `role = "teacher"`.
- Modify `src/lib/server/attendance/service.ts`: enforce assignment checks for teacher users on roster load and mark.
- Modify `src/lib/nav-config.ts`: expose Teachers route to roles with teacher permissions and keep teacher users on Dashboard/Attendance links.
- Generate Drizzle migration in `drizzle/`.

---

### Task 1: Teacher Schema and Domain Helpers

**Files:**
- Create: `src/db/schema/teachers.ts`
- Create: `src/lib/server/teachers/domain.ts`
- Create: `src/lib/server/teachers/domain.test.ts`
- Modify: `src/db/index.ts`

**Interfaces:**
- Produces: `teacherProfiles`, `teacherAssignments`, `teacherTimetablePeriods`
- Produces: `timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean`
- Produces: `validateTeacherPlacement(input: TeacherPlacementInput): void`
- Produces: `normalizeSalaryPaisa(value: number | null | undefined): number`
- Consumes: `user` from `src/db/schema/auth.ts`
- Consumes: academic tables from `src/db/schema/academic.ts`
- Consumes: `examSubjects` from `src/db/schema/exams.ts`

- [ ] **Step 1: Write failing domain tests**

Create `src/lib/server/teachers/domain.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import {
  normalizeSalaryPaisa,
  timesOverlap,
  validateTeacherPlacement,
} from "@/lib/server/teachers/domain";

describe("teacher domain helpers", () => {
  test("detects overlapping timetable periods", () => {
    expect(timesOverlap("08:00", "08:40", "08:39", "09:10")).toBe(true);
    expect(timesOverlap("08:00", "08:40", "08:40", "09:10")).toBe(false);
    expect(timesOverlap("09:00", "10:00", "08:00", "09:01")).toBe(true);
  });

  test("rejects inverted timetable periods", () => {
    expect(() => timesOverlap("10:00", "09:00", "08:00", "09:00")).toThrow("Start time must be before end time");
  });

  test("validates school placement fields", () => {
    expect(() =>
      validateTeacherPlacement({
        system: "school",
        institutionId: "inst",
        programId: "program",
        schoolClassId: "class",
        schoolSectionId: "section",
        madrassaCategoryId: null,
        madrassaSubcategoryId: null,
      }),
    ).not.toThrow();
  });

  test("rejects school placement without section", () => {
    expect(() =>
      validateTeacherPlacement({
        system: "school",
        institutionId: "inst",
        programId: "program",
        schoolClassId: "class",
        schoolSectionId: null,
        madrassaCategoryId: null,
        madrassaSubcategoryId: null,
      }),
    ).toThrow("School teacher assignment requires class and section");
  });

  test("validates madrassa placement fields", () => {
    expect(() =>
      validateTeacherPlacement({
        system: "madrassa",
        institutionId: "inst",
        programId: "program",
        schoolClassId: null,
        schoolSectionId: null,
        madrassaCategoryId: "category",
        madrassaSubcategoryId: "subcategory",
      }),
    ).not.toThrow();
  });

  test("normalizes missing salary to zero paisa", () => {
    expect(normalizeSalaryPaisa(undefined)).toBe(0);
    expect(normalizeSalaryPaisa(null)).toBe(0);
    expect(normalizeSalaryPaisa(4500000)).toBe(4500000);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
bun test src/lib/server/teachers/domain.test.ts
```

Expected: FAIL because `src/lib/server/teachers/domain.ts` does not exist.

- [ ] **Step 3: Add pure domain helper implementation**

Create `src/lib/server/teachers/domain.ts`:

```ts
import { HttpError } from "@/lib/server/http";

export type TeacherSystem = "school" | "madrassa";

export type TeacherPlacementInput = {
  system: TeacherSystem;
  institutionId: string;
  programId: string;
  schoolClassId: string | null | undefined;
  schoolSectionId: string | null | undefined;
  madrassaCategoryId: string | null | undefined;
  madrassaSubcategoryId: string | null | undefined;
};

function minutes(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new HttpError("Time must use HH:mm format", 400);
  const [hours, mins] = value.split(":").map(Number);
  if (hours > 23 || mins > 59) throw new HttpError("Time must use HH:mm format", 400);
  return hours * 60 + mins;
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const startA = minutes(aStart);
  const endA = minutes(aEnd);
  const startB = minutes(bStart);
  const endB = minutes(bEnd);
  if (startA >= endA || startB >= endB) throw new HttpError("Start time must be before end time", 400);
  return startA < endB && startB < endA;
}

export function validateTeacherPlacement(input: TeacherPlacementInput) {
  if (!input.institutionId || !input.programId) throw new HttpError("Institution and program are required", 400);

  if (input.system === "school") {
    if (!input.schoolClassId || !input.schoolSectionId) {
      throw new HttpError("School teacher assignment requires class and section", 400);
    }
    if (input.madrassaCategoryId || input.madrassaSubcategoryId) {
      throw new HttpError("School teacher assignment cannot include madrassa placement", 400);
    }
    return;
  }

  if (!input.madrassaCategoryId || !input.madrassaSubcategoryId) {
    throw new HttpError("Madrassa teacher assignment requires category and darja", 400);
  }
  if (input.schoolClassId || input.schoolSectionId) {
    throw new HttpError("Madrassa teacher assignment cannot include school placement", 400);
  }
}

export function normalizeSalaryPaisa(value: number | null | undefined) {
  if (value == null) return 0;
  if (!Number.isInteger(value) || value < 0) throw new HttpError("Salary must be a non-negative integer paisa amount", 400);
  return value;
}
```

- [ ] **Step 4: Add Drizzle teacher schema**

Create `src/db/schema/teachers.ts` with these tables:

```ts
import { relations } from "drizzle-orm";
import { boolean, date, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import {
  institutions,
  madrassaCategories,
  madrassaSubcategories,
  programs,
  schoolClasses,
  schoolClassSections,
} from "@/db/schema/academic";
import { user } from "@/db/schema/auth";
import { examSubjects } from "@/db/schema/exams";

export const teacherProfiles = pgTable(
  "teacher_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    systemScope: text("system_scope").default("both").notNull(),
    gender: text("gender"),
    designation: text("designation").notNull(),
    qualification: text("qualification"),
    qualificationUrdu: text("qualification_urdu"),
    address: text("address"),
    joinedAt: date("joined_at", { mode: "string" }).notNull(),
    employmentStatus: text("employment_status").default("active").notNull(),
    baseMonthlySalaryPaisa: integer("base_monthly_salary_paisa").default(0).notNull(),
    bankName: text("bank_name"),
    bankAccount: text("bank_account"),
    paymentMethod: text("payment_method").default("cash").notNull(),
    salaryEffectiveDate: date("salary_effective_date", { mode: "string" }),
    salaryNotes: text("salary_notes"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    uniqueIndex("teacher_profiles_user_idx").on(table.userId),
    index("teacher_profiles_status_idx").on(table.employmentStatus),
    index("teacher_profiles_system_scope_idx").on(table.systemScope),
  ],
);

export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: text("id").primaryKey(),
    teacherProfileId: text("teacher_profile_id").notNull().references(() => teacherProfiles.id, { onDelete: "cascade" }),
    system: text("system").notNull(),
    institutionId: text("institution_id").notNull().references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    schoolSectionId: text("school_section_id").references(() => schoolClassSections.id, { onDelete: "restrict" }),
    madrassaCategoryId: text("madrassa_category_id").references(() => madrassaCategories.id, { onDelete: "restrict" }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, { onDelete: "restrict" }),
    subjectId: text("subject_id").references(() => examSubjects.id, { onDelete: "restrict" }),
    academicYear: text("academic_year").notNull(),
    effectiveFrom: date("effective_from", { mode: "string" }),
    effectiveTo: date("effective_to", { mode: "string" }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index("teacher_assignments_teacher_idx").on(table.teacherProfileId),
    index("teacher_assignments_system_idx").on(table.system),
    index("teacher_assignments_school_idx").on(table.schoolClassId, table.schoolSectionId),
    index("teacher_assignments_madrassa_idx").on(table.madrassaCategoryId, table.madrassaSubcategoryId),
    index("teacher_assignments_subject_idx").on(table.subjectId),
    index("teacher_assignments_active_idx").on(table.active),
  ],
);

export const teacherTimetablePeriods = pgTable(
  "teacher_timetable_periods",
  {
    id: text("id").primaryKey(),
    teacherProfileId: text("teacher_profile_id").notNull().references(() => teacherProfiles.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(() => teacherAssignments.id, { onDelete: "set null" }),
    system: text("system").notNull(),
    institutionId: text("institution_id").notNull().references(() => institutions.id, { onDelete: "restrict" }),
    programId: text("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
    schoolClassId: text("school_class_id").references(() => schoolClasses.id, { onDelete: "restrict" }),
    schoolSectionId: text("school_section_id").references(() => schoolClassSections.id, { onDelete: "restrict" }),
    madrassaCategoryId: text("madrassa_category_id").references(() => madrassaCategories.id, { onDelete: "restrict" }),
    madrassaSubcategoryId: text("madrassa_subcategory_id").references(() => madrassaSubcategories.id, { onDelete: "restrict" }),
    subjectId: text("subject_id").references(() => examSubjects.id, { onDelete: "restrict" }),
    academicYear: text("academic_year").notNull(),
    weekday: integer("weekday").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    room: text("room"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index("teacher_timetable_teacher_idx").on(table.teacherProfileId),
    index("teacher_timetable_assignment_idx").on(table.assignmentId),
    index("teacher_timetable_weekday_idx").on(table.weekday),
    index("teacher_timetable_school_idx").on(table.schoolClassId, table.schoolSectionId),
    index("teacher_timetable_madrassa_idx").on(table.madrassaCategoryId, table.madrassaSubcategoryId),
    index("teacher_timetable_active_idx").on(table.active),
  ],
);

export const teacherProfilesRelations = relations(teacherProfiles, ({ one, many }) => ({
  user: one(user, { fields: [teacherProfiles.userId], references: [user.id] }),
  assignments: many(teacherAssignments),
  timetablePeriods: many(teacherTimetablePeriods),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({ one, many }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [teacherAssignments.teacherProfileId],
    references: [teacherProfiles.id],
  }),
  subject: one(examSubjects, { fields: [teacherAssignments.subjectId], references: [examSubjects.id] }),
  timetablePeriods: many(teacherTimetablePeriods),
}));

export const teacherTimetablePeriodsRelations = relations(teacherTimetablePeriods, ({ one }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [teacherTimetablePeriods.teacherProfileId],
    references: [teacherProfiles.id],
  }),
  assignment: one(teacherAssignments, {
    fields: [teacherTimetablePeriods.assignmentId],
    references: [teacherAssignments.id],
  }),
  subject: one(examSubjects, { fields: [teacherTimetablePeriods.subjectId], references: [examSubjects.id] }),
}));
```

- [ ] **Step 5: Register teacher schema in Drizzle**

Modify `src/db/index.ts`:

```ts
import * as teacherSchema from "@/db/schema/teachers";
```

Add `...teacherSchema` to the `schema` object after `...examSchema`.

- [ ] **Step 6: Verify helper tests pass**

Run:

```bash
bun test src/lib/server/teachers/domain.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/db/schema/teachers.ts src/db/index.ts src/lib/server/teachers/domain.ts src/lib/server/teachers/domain.test.ts
git commit -m "Add teacher schema and domain helpers"
```

---

### Task 2: Teacher Server Service

**Files:**
- Create: `src/lib/server/teachers/service.ts`
- Modify: `src/lib/server/teachers/domain.ts`
- Test: `src/lib/server/teachers/domain.test.ts`

**Interfaces:**
- Consumes: `teacherProfiles`, `teacherAssignments`, `teacherTimetablePeriods`
- Consumes: `auth.api.createUser({ body })` from Better Auth
- Produces: `createTeacher(request, input)`
- Produces: `listTeachers(request, query)`
- Produces: `getTeacher(request, id)`
- Produces: `updateTeacherProfile(request, id, input)`
- Produces: `setTeacherActiveState(request, id, input)`
- Produces: `createTeacherAssignment(request, teacherId, input)`
- Produces: `updateTeacherAssignment(request, teacherId, assignmentId, input)`
- Produces: `setTeacherAssignmentActive(request, teacherId, assignmentId, input)`
- Produces: `createTeacherTimetablePeriod(request, teacherId, input)`
- Produces: `setTeacherTimetablePeriodActive(request, teacherId, periodId, input)`
- Produces: `getMyTeacherDashboard(request)`
- Produces: `assertTeacherCanAccessAttendancePlacement(actorUserId, system, filters)`

- [ ] **Step 1: Extend domain tests for duplicate and overlap helpers**

Append to `src/lib/server/teachers/domain.test.ts`:

```ts
import { hasTimetableConflict } from "@/lib/server/teachers/domain";

test("finds active timetable conflict for same teacher and weekday", () => {
  expect(
    hasTimetableConflict(
      [
        { id: "p1", weekday: 1, startTime: "08:00", endTime: "08:40", active: true },
        { id: "p2", weekday: 2, startTime: "08:00", endTime: "08:40", active: true },
        { id: "p3", weekday: 1, startTime: "09:00", endTime: "09:40", active: false },
      ],
      { weekday: 1, startTime: "08:30", endTime: "09:00", ignorePeriodId: null },
    ),
  ).toBe(true);
});

test("ignores the current period when editing timetable", () => {
  expect(
    hasTimetableConflict(
      [{ id: "p1", weekday: 1, startTime: "08:00", endTime: "08:40", active: true }],
      { weekday: 1, startTime: "08:10", endTime: "08:35", ignorePeriodId: "p1" },
    ),
  ).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
bun test src/lib/server/teachers/domain.test.ts
```

Expected: FAIL because `hasTimetableConflict` is not exported.

- [ ] **Step 3: Add conflict helper**

Add to `src/lib/server/teachers/domain.ts`:

```ts
export type TimetableConflictRow = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

export function hasTimetableConflict(
  rows: TimetableConflictRow[],
  next: { weekday: number; startTime: string; endTime: string; ignorePeriodId: string | null },
) {
  return rows.some((row) => {
    if (!row.active) return false;
    if (next.ignorePeriodId && row.id === next.ignorePeriodId) return false;
    if (row.weekday !== next.weekday) return false;
    return timesOverlap(row.startTime, row.endTime, next.startTime, next.endTime);
  });
}
```

- [ ] **Step 4: Create service with Zod schemas and auth-safe teacher creation**

Create `src/lib/server/teachers/service.ts`. The create flow must follow this exact shape:

```ts
import { randomUUID } from "node:crypto";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user as authUser } from "@/db/schema/auth";
import { teacherAssignments, teacherProfiles, teacherTimetablePeriods } from "@/db/schema/teachers";
import { auth } from "@/lib/auth";
import { ROLE_DEFAULTS } from "@/lib/permissions/role-defaults";
import { generateSecurePassword } from "@/lib/generate-password";
import { requirePermission } from "@/lib/server/authz";
import { HttpError } from "@/lib/server/http";
import {
  hasTimetableConflict,
  normalizeSalaryPaisa,
  validateTeacherPlacement,
} from "@/lib/server/teachers/domain";

const systemScopeSchema = z.enum(["school", "madrassa", "both"]);
const paymentMethodSchema = z.enum(["cash", "bank"]);
const employmentStatusSchema = z.enum(["active", "inactive"]);
const systemSchema = z.enum(["school", "madrassa"]);

export const createTeacherSchema = z.object({
  name: z.string().trim().min(1),
  nameUrdu: z.string().trim().optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().optional(),
  cnic: z.string().trim().optional(),
  gender: z.enum(["male", "female"]).optional(),
  systemScope: systemScopeSchema.default("both"),
  designation: z.string().trim().min(1),
  qualification: z.string().trim().optional(),
  qualificationUrdu: z.string().trim().optional(),
  address: z.string().trim().optional(),
  joinedAt: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseMonthlySalaryPaisa: z.number().int().nonnegative().optional(),
  bankName: z.string().trim().optional(),
  bankAccount: z.string().trim().optional(),
  paymentMethod: paymentMethodSchema.default("cash"),
  salaryEffectiveDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  salaryNotes: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  password: z.string().min(8).optional(),
});

export const teacherListQuerySchema = z.object({
  q: z.string().trim().optional(),
  systemScope: z.enum(["all", "school", "madrassa", "both"]).default("all"),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

export const updateTeacherProfileSchema = createTeacherSchema.omit({ email: true, password: true }).partial();

export const teacherActiveStateSchema = z.object({
  active: z.boolean(),
});

export const teacherAssignmentSchema = z.object({
  system: systemSchema,
  institutionId: z.string().trim().min(1),
  programId: z.string().trim().min(1),
  schoolClassId: z.string().trim().optional().nullable(),
  schoolSectionId: z.string().trim().optional().nullable(),
  madrassaCategoryId: z.string().trim().optional().nullable(),
  madrassaSubcategoryId: z.string().trim().optional().nullable(),
  subjectId: z.string().trim().optional().nullable(),
  academicYear: z.string().trim().min(1),
  effectiveFrom: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  effectiveTo: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const teacherTimetablePeriodSchema = teacherAssignmentSchema.extend({
  assignmentId: z.string().trim().optional().nullable(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  room: z.string().trim().optional().nullable(),
});

export async function createTeacher(request: Request, input: z.infer<typeof createTeacherSchema>) {
  const actor = await requirePermission(request, "teachers", "create");
  const existing = await db.select({ id: authUser.id }).from(authUser).where(eq(authUser.email, input.email)).limit(1);
  if (existing[0]) throw new HttpError("A user already exists with this email", 409);

  const password = input.password ?? generateSecurePassword(12);
  const result = await auth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password,
      role: "teacher",
      data: {
        nameUrdu: input.nameUrdu,
        phone: input.phone,
        cnic: input.cnic,
        status: "active",
        systemAccess: input.systemScope,
        mustChangePassword: true,
        permissions: ROLE_DEFAULTS.teacher,
        department: "Teaching",
        designation: input.designation,
      },
    },
  });

  if (!result?.user?.id) throw new HttpError("Better Auth did not return a user id", 500);

  try {
    const teacher = await db.transaction(async (tx) => {
      const [profile] = await tx.insert(teacherProfiles).values({
        id: randomUUID(),
        userId: result.user.id,
        systemScope: input.systemScope,
        gender: input.gender,
        designation: input.designation,
        qualification: input.qualification,
        qualificationUrdu: input.qualificationUrdu,
        address: input.address,
        joinedAt: input.joinedAt,
        employmentStatus: "active",
        baseMonthlySalaryPaisa: normalizeSalaryPaisa(input.baseMonthlySalaryPaisa),
        bankName: input.bankName,
        bankAccount: input.bankAccount,
        paymentMethod: input.paymentMethod,
        salaryEffectiveDate: input.salaryEffectiveDate,
        salaryNotes: input.salaryNotes,
        notes: input.notes,
      }).returning();
      return profile;
    });

    return {
      teacher,
      credentials: {
        nameUrdu: input.nameUrdu ?? input.name,
        nameEnglish: input.name,
        email: input.email,
        role: "teacher" as const,
        password,
      },
      actorUserId: actor.id,
    };
  } catch (error) {
    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUser(result.user.id);
    throw error;
  }
}
```

- [ ] **Step 5: Implement list/detail/update/deactivate service functions**

Add functions in the same file with these signatures:

```ts
export async function listTeachers(request: Request, query: z.infer<typeof teacherListQuerySchema>) {
  await requirePermission(request, "teachers", "view");
  const clauses = [
    eq(authUser.role, "teacher"),
    query.status === "all" ? undefined : eq(teacherProfiles.employmentStatus, query.status),
    query.systemScope === "all" ? undefined : eq(teacherProfiles.systemScope, query.systemScope),
    query.q
      ? or(
          ilike(authUser.name, `%${query.q}%`),
          ilike(authUser.email, `%${query.q}%`),
          ilike(teacherProfiles.designation, `%${query.q}%`),
        )
      : undefined,
  ].filter(Boolean);

  return db.select({
    id: teacherProfiles.id,
    userId: teacherProfiles.userId,
    name: authUser.name,
    email: authUser.email,
    nameUrdu: authUser.nameUrdu,
    phone: authUser.phone,
    cnic: authUser.cnic,
    systemScope: teacherProfiles.systemScope,
    designation: teacherProfiles.designation,
    qualification: teacherProfiles.qualification,
    joinedAt: teacherProfiles.joinedAt,
    employmentStatus: teacherProfiles.employmentStatus,
    baseMonthlySalaryPaisa: teacherProfiles.baseMonthlySalaryPaisa,
  })
    .from(teacherProfiles)
    .innerJoin(authUser, eq(authUser.id, teacherProfiles.userId))
    .where(and(...clauses))
    .orderBy(asc(authUser.name));
}

export async function getTeacher(request: Request, id: string) {
  await requirePermission(request, "teachers", "view");
  return loadTeacherDetail(id);
}

export async function updateTeacherProfile(request: Request, id: string, input: z.infer<typeof updateTeacherProfileSchema>) {
  await requirePermission(request, "teachers", "edit");
  const profile = await requireTeacherProfile(id);
  await db.update(teacherProfiles).set({
    ...input,
    baseMonthlySalaryPaisa: input.baseMonthlySalaryPaisa == null
      ? undefined
      : normalizeSalaryPaisa(input.baseMonthlySalaryPaisa),
    updatedAt: new Date(),
  }).where(eq(teacherProfiles.id, profile.id));
  return loadTeacherDetail(id);
}

export async function setTeacherActiveState(request: Request, id: string, input: z.infer<typeof teacherActiveStateSchema>) {
  await requirePermission(request, "teachers", "edit");
  const profile = await requireTeacherProfile(id);
  const nextStatus = input.active ? "active" : "inactive";
  await db.update(teacherProfiles).set({ employmentStatus: nextStatus, updatedAt: new Date() }).where(eq(teacherProfiles.id, id));
  await db.update(authUser).set({
    status: nextStatus,
    banned: !input.active,
    banReason: input.active ? null : "Teacher disabled",
    updatedAt: new Date(),
  }).where(eq(authUser.id, profile.userId));
  if (!input.active) {
    await db.update(teacherAssignments).set({ active: false, updatedAt: new Date() }).where(eq(teacherAssignments.teacherProfileId, id));
    await db.update(teacherTimetablePeriods).set({ active: false, updatedAt: new Date() }).where(eq(teacherTimetablePeriods.teacherProfileId, id));
  }
  return loadTeacherDetail(id);
}
```

Add local helpers:

```ts
async function requireTeacherProfile(id: string) {
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.id, id)).limit(1);
  if (!profile) throw new HttpError("Teacher not found", 404);
  return profile;
}

async function loadTeacherDetail(id: string) {
  const profile = await requireTeacherProfile(id);
  const [account] = await db.select().from(authUser).where(eq(authUser.id, profile.userId)).limit(1);
  if (!account) throw new HttpError("Teacher account not found", 404);
  const assignments = await db.select().from(teacherAssignments).where(eq(teacherAssignments.teacherProfileId, id));
  const timetable = await db.select().from(teacherTimetablePeriods).where(eq(teacherTimetablePeriods.teacherProfileId, id));
  return { profile, account, assignments, timetable };
}
```

- [ ] **Step 6: Implement assignment and timetable service functions**

Use `validateTeacherPlacement(input)` before inserting assignments or timetable periods. Before inserting timetable, load active periods for that teacher and call `hasTimetableConflict`. Throw `new HttpError("Teacher already has a timetable period in this time range", 409)` on conflict.

The functions must return `loadTeacherDetail(teacherId)` after writes:

```ts
export async function createTeacherAssignment(request: Request, teacherId: string, input: z.infer<typeof teacherAssignmentSchema>) {
  await requirePermission(request, "teachers", "edit");
  await requireTeacherProfile(teacherId);
  validateTeacherPlacement(input);
  await db.insert(teacherAssignments).values({ id: randomUUID(), teacherProfileId: teacherId, ...input, active: true });
  return loadTeacherDetail(teacherId);
}

export async function setTeacherAssignmentActive(request: Request, teacherId: string, assignmentId: string, input: z.infer<typeof teacherActiveStateSchema>) {
  await requirePermission(request, "teachers", "edit");
  await requireTeacherProfile(teacherId);
  await db.update(teacherAssignments).set({ active: input.active, updatedAt: new Date() }).where(eq(teacherAssignments.id, assignmentId));
  if (!input.active) {
    await db.update(teacherTimetablePeriods).set({ active: false, updatedAt: new Date() }).where(eq(teacherTimetablePeriods.assignmentId, assignmentId));
  }
  return loadTeacherDetail(teacherId);
}
```

- [ ] **Step 7: Implement self-service dashboard and attendance access helper**

Add:

```ts
export async function getMyTeacherDashboard(request: Request) {
  const actor = await requirePermission(request, "dashboard", "view");
  if (actor.role !== "teacher") throw new HttpError("Teacher dashboard is only available to teacher accounts", 403);
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, actor.id)).limit(1);
  if (!profile) throw new HttpError("Teacher profile not found", 404);
  const assignments = await db.select().from(teacherAssignments).where(and(eq(teacherAssignments.teacherProfileId, profile.id), eq(teacherAssignments.active, true)));
  const timetable = await db.select().from(teacherTimetablePeriods).where(and(eq(teacherTimetablePeriods.teacherProfileId, profile.id), eq(teacherTimetablePeriods.active, true)));
  return { profile, assignments, timetable };
}

export async function assertTeacherCanAccessAttendancePlacement(
  actorUserId: string,
  system: "school" | "madrassa",
  filters: { classId?: string; sectionId?: string; institutionId?: string; subcategoryId?: string },
) {
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, actorUserId)).limit(1);
  if (!profile || profile.employmentStatus !== "active") throw new HttpError("Teacher profile is not active", 403);

  const clauses = [
    eq(teacherAssignments.teacherProfileId, profile.id),
    eq(teacherAssignments.active, true),
    eq(teacherAssignments.system, system),
    system === "school" ? eq(teacherAssignments.schoolClassId, filters.classId ?? "") : undefined,
    system === "school" ? eq(teacherAssignments.schoolSectionId, filters.sectionId ?? "") : undefined,
    system === "madrassa" ? eq(teacherAssignments.institutionId, filters.institutionId ?? "") : undefined,
    system === "madrassa" ? eq(teacherAssignments.madrassaSubcategoryId, filters.subcategoryId ?? "") : undefined,
  ].filter(Boolean);

  const [assignment] = await db.select({ id: teacherAssignments.id }).from(teacherAssignments).where(and(...clauses)).limit(1);
  if (!assignment) throw new HttpError("Teacher is not assigned to this attendance group", 403);
}
```

- [ ] **Step 8: Verify tests pass**

Run:

```bash
bun test src/lib/server/teachers/domain.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 2**

```bash
git add src/lib/server/teachers/service.ts src/lib/server/teachers/domain.ts src/lib/server/teachers/domain.test.ts
git commit -m "Add teacher management service"
```

---

### Task 3: Teacher API Routes

**Files:**
- Create: `src/routes/api/teachers/index.ts`
- Create: `src/routes/api/teachers/$id.ts`
- Create: `src/routes/api/teachers/$id/active.ts`
- Create: `src/routes/api/teachers/$id/assignments.ts`
- Create: `src/routes/api/teachers/$id/assignments/$assignmentId.ts`
- Create: `src/routes/api/teachers/$id/timetable.ts`
- Create: `src/routes/api/teachers/$id/timetable/$periodId.ts`
- Create: `src/routes/api/teachers/me/dashboard.ts`

**Interfaces:**
- Consumes: all exports from `src/lib/server/teachers/service.ts`
- Produces: REST endpoints used by `src/components/teachers/teacher-api.ts`

- [ ] **Step 1: Create list/create route**

Create `src/routes/api/teachers/index.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router";
import { createTeacher, createTeacherSchema, listTeachers, teacherListQuerySchema } from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = teacherListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);
        try {
          return json(await listTeachers(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load teachers");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, createTeacherSchema);
        if (!body.ok) return body.response;
        try {
          return json(await createTeacher(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create teacher");
        }
      },
    },
  },
});
```

- [ ] **Step 2: Create detail/update route**

Create `src/routes/api/teachers/$id.ts` with GET and PATCH handlers:

```ts
import { createFileRoute } from "@tanstack/react-router";
import { getTeacher, updateTeacherProfile, updateTeacherProfileSchema } from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json(await getTeacher(request, params.id));
        } catch (error) {
          return errorResponse(error, "Could not load teacher");
        }
      },
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, updateTeacherProfileSchema);
        if (!body.ok) return body.response;
        try {
          return json(await updateTeacherProfile(request, params.id, body.data));
        } catch (error) {
          return errorResponse(error, "Could not update teacher");
        }
      },
    },
  },
});
```

- [ ] **Step 3: Create active-state route**

Create `src/routes/api/teachers/$id/active.ts` with POST body `teacherActiveStateSchema` and call `setTeacherActiveState`.

- [ ] **Step 4: Create assignment routes**

Create `src/routes/api/teachers/$id/assignments.ts` with POST to `createTeacherAssignment`.

Create `src/routes/api/teachers/$id/assignments/$assignmentId.ts` with PATCH to `updateTeacherAssignment` and POST to `setTeacherAssignmentActive`.

- [ ] **Step 5: Create timetable routes**

Create `src/routes/api/teachers/$id/timetable.ts` with POST to `createTeacherTimetablePeriod`.

Create `src/routes/api/teachers/$id/timetable/$periodId.ts` with PATCH to `setTeacherTimetablePeriodActive`.

- [ ] **Step 6: Create self-service dashboard route**

Create `src/routes/api/teachers/me/dashboard.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router";
import { getMyTeacherDashboard } from "@/lib/server/teachers/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/teachers/me/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json(await getMyTeacherDashboard(request));
        } catch (error) {
          return errorResponse(error, "Could not load teacher dashboard");
        }
      },
    },
  },
});
```

- [ ] **Step 7: Build to verify route generation**

Run:

```bash
bun run build
```

Expected: PASS. `src/routeTree.gen.ts` updates to include the new API routes.

- [ ] **Step 8: Commit Task 3**

```bash
git add src/routes/api/teachers src/routeTree.gen.ts
git commit -m "Add teacher management API routes"
```

---

### Task 4: Teacher UI Types, API Client, and Add Teacher Dialog

**Files:**
- Create: `src/components/teachers/teacher-types.ts`
- Create: `src/components/teachers/teacher-api.ts`
- Create: `src/components/teachers/add-teacher-dialog.tsx`
- Reuse: `src/components/custom/responsive-dialog.tsx`
- Reuse: `src/features/users/credentials-display.tsx`

**Interfaces:**
- Consumes: `/api/teachers`
- Produces: `TeacherListItem`, `TeacherDetail`, `TeacherCredentials`
- Produces: `createTeacher(payload): Promise<{ teacher: unknown; credentials: TeacherCredentials }>`
- Produces: `<AddTeacherDialog open onOpenChange onCreated />`

- [ ] **Step 1: Create UI types**

Create `src/components/teachers/teacher-types.ts`:

```ts
export type TeacherSystemScope = "school" | "madrassa" | "both";
export type TeacherSystem = "school" | "madrassa";

export type TeacherListItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  nameUrdu: string | null;
  phone: string | null;
  cnic: string | null;
  systemScope: TeacherSystemScope;
  designation: string;
  qualification: string | null;
  joinedAt: string;
  employmentStatus: "active" | "inactive";
  baseMonthlySalaryPaisa: number;
};

export type TeacherCredentials = {
  nameUrdu: string;
  nameEnglish: string;
  email: string;
  role: "teacher";
  password: string;
};

export type TeacherAssignment = {
  id: string;
  system: TeacherSystem;
  institutionId: string;
  programId: string;
  schoolClassId: string | null;
  schoolSectionId: string | null;
  madrassaCategoryId: string | null;
  madrassaSubcategoryId: string | null;
  subjectId: string | null;
  academicYear: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  active: boolean;
};

export type TeacherTimetablePeriod = TeacherAssignment & {
  assignmentId: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string | null;
};

export type TeacherDetail = {
  profile: TeacherListItem & {
    gender: string | null;
    address: string | null;
    qualificationUrdu: string | null;
    bankName: string | null;
    bankAccount: string | null;
    paymentMethod: "cash" | "bank";
    salaryEffectiveDate: string | null;
    salaryNotes: string | null;
    notes: string | null;
  };
  account: {
    id: string;
    name: string;
    email: string;
    status: string | null;
    banned: boolean | null;
  };
  assignments: TeacherAssignment[];
  timetable: TeacherTimetablePeriod[];
};
```

- [ ] **Step 2: Create fetch helpers**

Create `src/components/teachers/teacher-api.ts`:

```ts
import type { TeacherCredentials, TeacherDetail, TeacherListItem } from "./teacher-types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Teacher request failed");
  return payload as T;
}

export function listTeachers(params: URLSearchParams) {
  return requestJson<TeacherListItem[]>(`/api/teachers?${params.toString()}`);
}

export function createTeacher(payload: Record<string, unknown>) {
  return requestJson<{ teacher: unknown; credentials: TeacherCredentials }>("/api/teachers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTeacher(id: string) {
  return requestJson<TeacherDetail>(`/api/teachers/${id}`);
}

export function updateTeacher(id: string, payload: Record<string, unknown>) {
  return requestJson<TeacherDetail>(`/api/teachers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setTeacherActive(id: string, active: boolean) {
  return requestJson<TeacherDetail>(`/api/teachers/${id}/active`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}
```

- [ ] **Step 3: Build Add Teacher dialog**

Create `src/components/teachers/add-teacher-dialog.tsx` using `ResponsiveDialog`. Required fields: English name, email, designation, joined date. Include salary inputs in the same dialog. On success, call `onCreated(credentials)` and close.

Core submit function:

```ts
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setSubmitting(true);
  try {
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      nameUrdu: String(form.get("nameUrdu") ?? "") || undefined,
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? "") || undefined,
      cnic: String(form.get("cnic") ?? "") || undefined,
      gender: String(form.get("gender") ?? "") || undefined,
      systemScope,
      designation: String(form.get("designation") ?? ""),
      qualification: String(form.get("qualification") ?? "") || undefined,
      qualificationUrdu: String(form.get("qualificationUrdu") ?? "") || undefined,
      address: String(form.get("address") ?? "") || undefined,
      joinedAt: String(form.get("joinedAt") ?? ""),
      baseMonthlySalaryPaisa: Math.round(Number(form.get("baseMonthlySalary") || 0) * 100),
      bankName: String(form.get("bankName") ?? "") || undefined,
      bankAccount: String(form.get("bankAccount") ?? "") || undefined,
      paymentMethod,
      salaryEffectiveDate: String(form.get("salaryEffectiveDate") ?? "") || undefined,
      salaryNotes: String(form.get("salaryNotes") ?? "") || undefined,
      notes: String(form.get("notes") ?? "") || undefined,
    };
    const result = await createTeacher(payload);
    toast.success("Teacher created");
    onCreated(result.credentials);
    onOpenChange(false);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not create teacher");
  } finally {
    setSubmitting(false);
  }
}
```

- [ ] **Step 4: Verify TypeScript**

Run:

```bash
bun run build
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/teachers/teacher-types.ts src/components/teachers/teacher-api.ts src/components/teachers/add-teacher-dialog.tsx
git commit -m "Add teacher creation UI primitives"
```

---

### Task 5: Teacher Admin List and Profile Workspaces

**Files:**
- Create: `src/components/teachers/teacher-workspace.tsx`
- Create: `src/components/teachers/teacher-profile-workspace.tsx`
- Modify: `src/routes/_authenticated/teachers/index.tsx`
- Modify: `src/routes/_authenticated/teachers/$id.tsx`
- Modify: `src/lib/nav-config.ts`

**Interfaces:**
- Consumes: `listTeachers`, `getTeacher`, `setTeacherActive`
- Consumes: `AddTeacherDialog`
- Produces: backend-backed Teachers page
- Produces: backend-backed teacher profile page

- [ ] **Step 1: Replace mock list with `TeacherWorkspace`**

Create `src/components/teachers/teacher-workspace.tsx` with:

```tsx
export function TeacherWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [systemScope, setSystemScope] = useState<"all" | "school" | "madrassa" | "both">("all");
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [credentials, setCredentials] = useState<TeacherCredentials | null>(null);

  async function loadTeachers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, status, systemScope });
      setTeachers(await listTeachers(params));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load teachers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeachers();
  }, [query, status, systemScope]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers"
        titleUrdu="اساتذہ"
        description="Manage teacher accounts, profiles, assignments, and timetable."
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add Teacher</Button>}
      />
      <Card className="p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teachers..." />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{teacher.name}</p>
                <p className="text-xs text-muted-foreground">{teacher.email}</p>
                <p className="text-xs text-muted-foreground">{teacher.designation}</p>
              </div>
              <StatusBadge status={teacher.employmentStatus} showUrdu={false} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
              <span>{teacher.systemScope}</span>
              <Button size="sm" variant="outline" asChild>
                <Link to="/teachers/$id" params={{ id: teacher.id }}>View</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <AddTeacherDialog open={addOpen} onOpenChange={setAddOpen} onCreated={setCredentials} />
      <CredentialsOverlay creds={credentials} onClose={() => setCredentials(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Build teacher cards/table**

Each row/card must show name, email, designation, system scope, status, joined date, salary amount, and actions: View Profile, ID Card, Deactivate/Activate. Use `StatusBadge` and `formatPKR`.

- [ ] **Step 3: Create profile workspace**

Create `src/components/teachers/teacher-profile-workspace.tsx` with tabs:

```tsx
type TeacherProfileTab = "overview" | "assignments" | "timetable" | "salary" | "account";
```

The Overview tab shows identity/profile fields. Salary tab shows base monthly salary, payment method, bank data, effective date, and notes. Account tab shows email, status, and Better Auth account state.

- [ ] **Step 4: Add deactivate confirmation**

Use `AlertDialog` before calling `setTeacherActive(id, false)`. Dialog copy:

```tsx
<AlertDialogTitle>Deactivate teacher?</AlertDialogTitle>
<AlertDialogDescription>
  This disables the teacher login and deactivates assignments and timetable periods.
</AlertDialogDescription>
```

- [ ] **Step 5: Replace route files with thin wrappers**

Modify `src/routes/_authenticated/teachers/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { TeacherWorkspace } from "@/components/teachers/teacher-workspace";

export const Route = createFileRoute("/_authenticated/teachers/")({
  component: TeacherWorkspace,
});
```

Modify `src/routes/_authenticated/teachers/$id.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { TeacherProfileWorkspace } from "@/components/teachers/teacher-profile-workspace";

export const Route = createFileRoute("/_authenticated/teachers/$id")({
  component: TeacherProfileWorkspace,
});
```

- [ ] **Step 6: Update nav roles for Teachers**

Modify `src/lib/nav-config.ts` so Teachers is visible to `super_admin`, `admin`, `principal`, and `hr_manager`. Keep User Accounts visible only to `super_admin`.

- [ ] **Step 7: Verify build**

Run:

```bash
bun run build
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add src/components/teachers/teacher-workspace.tsx src/components/teachers/teacher-profile-workspace.tsx src/routes/_authenticated/teachers/index.tsx 'src/routes/_authenticated/teachers/$id.tsx' src/lib/nav-config.ts src/routeTree.gen.ts
git commit -m "Replace mock teachers with backend workspace"
```

---

### Task 6: Assignments and Timetable UI

**Files:**
- Modify: `src/components/teachers/teacher-api.ts`
- Create: `src/components/teachers/teacher-assignment-manager.tsx`
- Create: `src/components/teachers/teacher-timetable-manager.tsx`
- Modify: `src/components/teachers/teacher-profile-workspace.tsx`
- Reuse: academic fetch helpers from existing attendance/exam components

**Interfaces:**
- Consumes: `/api/teachers/:id/assignments`
- Consumes: `/api/teachers/:id/timetable`
- Produces: assignment manager and timetable manager embedded in profile workspace

- [ ] **Step 1: Add assignment and timetable API helpers**

Append to `src/components/teachers/teacher-api.ts`:

```ts
export function createTeacherAssignment(teacherId: string, payload: Record<string, unknown>) {
  return requestJson<TeacherDetail>(`/api/teachers/${teacherId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function setTeacherAssignmentActive(teacherId: string, assignmentId: string, active: boolean) {
  return requestJson<TeacherDetail>(`/api/teachers/${teacherId}/assignments/${assignmentId}`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}

export function createTeacherTimetablePeriod(teacherId: string, payload: Record<string, unknown>) {
  return requestJson<TeacherDetail>(`/api/teachers/${teacherId}/timetable`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function setTeacherTimetablePeriodActive(teacherId: string, periodId: string, active: boolean) {
  return requestJson<TeacherDetail>(`/api/teachers/${teacherId}/timetable/${periodId}`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}
```

- [ ] **Step 2: Build assignment manager**

Create `src/components/teachers/teacher-assignment-manager.tsx`. It must support:

- system selector: school or madrassa
- school placement: institution, program, class, section, subject, academic year
- madrassa placement: institution, program, category, subcategory/darja, subject, academic year
- effective from/to
- active/inactive list
- confirmation dialog before deactivation

On submit, call `createTeacherAssignment`.

- [ ] **Step 3: Build timetable manager**

Create `src/components/teachers/teacher-timetable-manager.tsx`. It must support:

- assignment selector
- weekday selector
- start time
- end time
- room
- period list grouped by weekday
- confirmation dialog before deactivation

If the API returns conflict error, display the backend message with `toast.error`.

- [ ] **Step 4: Embed managers in profile workspace**

In `src/components/teachers/teacher-profile-workspace.tsx`, render:

```tsx
<TabsContent value="assignments">
  <TeacherAssignmentManager teacher={teacher} onChange={setTeacher} />
</TabsContent>
<TabsContent value="timetable">
  <TeacherTimetableManager teacher={teacher} onChange={setTeacher} />
</TabsContent>
```

- [ ] **Step 5: Verify build**

Run:

```bash
bun run build
```

Expected: PASS.

- [ ] **Step 6: Commit Task 6**

```bash
git add src/components/teachers/teacher-api.ts src/components/teachers/teacher-assignment-manager.tsx src/components/teachers/teacher-timetable-manager.tsx src/components/teachers/teacher-profile-workspace.tsx
git commit -m "Add teacher assignments and timetable UI"
```

---

### Task 7: Assignment-Scoped Attendance and Teacher Dashboard

**Files:**
- Modify: `src/lib/server/attendance/service.ts`
- Modify: `src/routes/_authenticated/dashboard.tsx`
- Create: `src/components/teachers/teacher-dashboard.tsx`
- Modify: `src/components/teachers/teacher-api.ts`

**Interfaces:**
- Consumes: `assertTeacherCanAccessAttendancePlacement`
- Consumes: `/api/teachers/me/dashboard`
- Produces: assignment-aware attendance access for teacher accounts
- Produces: teacher self-service dashboard

- [ ] **Step 1: Gate attendance roster and mark calls by teacher assignments**

Modify `src/lib/server/attendance/service.ts` inside `getSchoolAttendanceRoster`, `getMadrassaAttendanceRoster`, and `markAttendance`:

```ts
import { getRequestUser } from "@/lib/server/authz";
import { assertTeacherCanAccessAttendancePlacement } from "@/lib/server/teachers/service";
```

After the existing permission check and before loading roster:

```ts
const actor = await getRequestUser(request);
if (actor?.role === "teacher") {
  await assertTeacherCanAccessAttendancePlacement(actor.id, "school", {
    classId: query.classId,
    sectionId: query.sectionId,
  });
}
```

For madrassa:

```ts
const actor = await getRequestUser(request);
if (actor?.role === "teacher") {
  await assertTeacherCanAccessAttendancePlacement(actor.id, "madrassa", {
    institutionId: query.institutionId,
    subcategoryId: query.subcategoryId,
  });
}
```

Inside `markAttendance`, perform the same check based on `system` and `input` before saving rows.

- [ ] **Step 2: Add teacher dashboard API helper**

Append to `src/components/teachers/teacher-api.ts`:

```ts
export function getMyTeacherDashboard() {
  return requestJson<{
    profile: unknown;
    assignments: TeacherAssignment[];
    timetable: TeacherTimetablePeriod[];
  }>("/api/teachers/me/dashboard");
}
```

- [ ] **Step 3: Build teacher dashboard component**

Create `src/components/teachers/teacher-dashboard.tsx`:

```tsx
export function TeacherDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getMyTeacherDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTeacherDashboard()
      .then(setData)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load teacher dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading teacher dashboard...</div>;
  if (!data) return <EmptyState icon={GraduationCap} heading="Teacher profile not ready" headingUrdu="استاد پروفائل تیار نہیں" />;

  const today = new Date().getDay();
  const todayPeriods = data.timetable.filter((period) => period.weekday === today && period.active);

  return (
    <div className="space-y-4">
      <PageHeader title="Teacher Dashboard" titleUrdu="استاد ڈیش بورڈ" description="Your timetable, assignments, and student attendance shortcuts." />
      {/* render today's timetable, assignments, attendance shortcuts, and exam shortcuts */}
    </div>
  );
}
```

Attendance shortcut links:

- school assignment links to `/school/attendance`
- madrassa assignment links to `/madrassa/attendance`

The attendance pages already require the selected class/section or darja; the teacher dashboard should show the placement labels and link to the right module.

- [ ] **Step 4: Branch dashboard by role**

Modify `src/routes/_authenticated/dashboard.tsx`:

```tsx
import { TeacherDashboard } from "@/components/teachers/teacher-dashboard";
```

Inside `DashboardPage`:

```tsx
if (user?.role === "teacher") {
  return <TeacherDashboard />;
}
```

- [ ] **Step 5: Verify build**

Run:

```bash
bun run build
```

Expected: PASS.

- [ ] **Step 6: Commit Task 7**

```bash
git add src/lib/server/attendance/service.ts src/components/teachers/teacher-dashboard.tsx src/components/teachers/teacher-api.ts src/routes/_authenticated/dashboard.tsx
git commit -m "Scope teacher attendance to assignments"
```

---

### Task 8: Migration, Verification, and Cleanup

**Files:**
- Create: one new SQL migration file under `drizzle/` from `bun run db:generate`
- Modify: `drizzle/meta/_journal.json`
- Modify: one new Drizzle snapshot file under `drizzle/meta/`
- Inspect: `src/routeTree.gen.ts`

**Interfaces:**
- Consumes: schema created in Task 1
- Produces: applied Postgres schema for Teacher V1

- [ ] **Step 1: Generate Drizzle migration**

Run:

```bash
bun run db:generate
```

Expected: one new SQL migration creates `teacher_profiles`, `teacher_assignments`, and `teacher_timetable_periods`.

- [ ] **Step 2: Inspect migration**

Run:

```bash
rg -n "teacher_profiles|teacher_assignments|teacher_timetable_periods|exam_subjects|user_id|DROP TABLE|ALTER TABLE .* DROP" drizzle
```

Expected: output shows teacher table creation and foreign-key references; output does not show destructive drops for existing tables.

- [ ] **Step 3: Apply migration**

Run:

```bash
bun run db:migrate
```

Expected: migrations applied successfully. If sandbox networking blocks `localhost:5432`, rerun with host access because the local Docker Postgres is outside the sandbox network.

- [ ] **Step 4: Run focused tests**

Run:

```bash
bun test src/lib/server/teachers/domain.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```bash
bun run lint
bun run build
```

Expected: both PASS.

- [ ] **Step 6: Verify no mock teacher imports remain in active teacher routes**

Run:

```bash
rg -n "@/mock/teachers|seedTeachers|teachersById" src/routes/_authenticated/teachers src/components/teachers
```

Expected: no output.

- [ ] **Step 7: Commit Task 8**

```bash
git add drizzle src/routeTree.gen.ts
git commit -m "Add teacher management migration"
```

---

## Final Manual Checks

- Create a teacher from `Teachers -> Add Teacher`; confirm credentials are shown once.
- Confirm the teacher appears in User Accounts with `role = teacher`.
- Open the teacher profile and add one school assignment.
- Add an overlapping timetable period and confirm the API rejects it.
- Add a non-overlapping timetable period and confirm it appears on the profile.
- Sign in as the teacher and confirm Dashboard shows the teacher dashboard.
- As the teacher, open attendance for an assigned group and confirm it loads.
- As the teacher, open attendance for an unassigned group and confirm a 403 message.

## Sources Consulted

- Better Auth Admin plugin docs: https://better-auth.com/docs/plugins/admin
- Better Auth Drizzle adapter docs: https://better-auth.com/docs/adapters/drizzle
