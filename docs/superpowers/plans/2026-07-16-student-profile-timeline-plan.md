# Student Profile Operational Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready operational timeline on the student profile, with durable student events and best-effort Better Auth parent account creation during admission acceptance.

**Architecture:** Keep `student_events` as the source of truth for the profile timeline and centralize event writing in a server helper. Admission acceptance writes student, enrollment, guardian, sibling, admission, and account events in one coherent flow. The React profile consumes typed event payloads through a dedicated timeline component instead of rendering raw database rows.

**Tech Stack:** TanStack Start, React 19, TypeScript 7, Vite 8, Drizzle ORM, PostgreSQL, Better Auth, shadcn/Radix UI, lucide-react.

## Global Constraints

- Student creation must remain admission-driven only.
- Do not add or restore any direct student creation entry point.
- Parent account creation failure must not roll back admission acceptance.
- Use existing `student_events` columns for this implementation; do not add a migration for timeline metadata.
- Use existing `school_students`, `madrassa_students`, and admission queue permissions.
- Preserve Al-Qasim Academy, Jamia Zainab school support, Jamia Qasmia boys madrassa, and Jamia Zainab girls madrassa rules.
- Do not start the dev server during implementation unless explicitly requested.

---

## File Structure

- Create `src/lib/server/students/events.ts`: server-side event type definitions and insert helper for durable student events.
- Modify `src/lib/server/admission/service.ts`: best-effort parent account creation, student event writes during acceptance, and warning response payload.
- Modify `src/lib/server/students/service.ts`: use event helper, enrich metadata for existing profile actions, and return actor labels for profile timeline.
- Create `src/components/students/move-enrollment-dialog.tsx`: profile action for moving a student to a valid academic placement.
- Create `src/components/students/student-guardian-manager.tsx`: profile UI for linking/updating guardians.
- Create `src/components/students/student-sibling-manager.tsx`: profile UI for linking/removing siblings.
- Create `src/components/students/student-timeline.tsx`: timeline renderer, category filters, date grouping, sparse-event fallback, warning display, and parent-account retry action.
- Modify `src/components/students/student-types.ts`: typed timeline event metadata and admission accept warning shape.
- Modify `src/routes/_authenticated/students/$id.tsx`: wire Move Enrollment, guardian/sibling managers, credentials overlay, and `StudentTimeline`.
- Modify `src/routes/_authenticated/admission/queue.tsx`: handle success-with-warning API responses for parent account creation failure.
- Create `src/routes/api/students/$id/guardians/$guardianId/parent-account.ts`: retry Better Auth parent account creation for linked guardians without creating students.

## Execution Order

1. Backend event foundation and parent account acceptance behavior.
2. Move Enrollment UI on the student profile.
3. Guardian and sibling management UI on the student profile.
4. Production timeline UI using the events created by the previous operations.
5. Admission queue warning feedback and final verification.

---

### Task 1: Centralize Student Event Writing

**Files:**
- Create: `src/lib/server/students/events.ts`
- Modify: `src/lib/server/students/service.ts`

**Interfaces:**
- Produces: `insertStudentEvent(txOrDb, event)` where `event` includes `studentId`, `enrollmentId`, `type`, `message`, `metadata`, and optional `actorUserId`.
- Consumes: existing `studentEvents` Drizzle table from `src/db/schema/students.ts`.

- [ ] **Step 1: Create the event helper**

Create `src/lib/server/students/events.ts` with this interface and implementation:

```ts
import { randomUUID } from "node:crypto";
import type { db } from "@/db";
import { studentEvents } from "@/db/schema/students";

export const studentEventTypes = [
  "admission_accepted",
  "parent_account_created",
  "parent_account_failed",
  "student_updated",
  "status_changed",
  "guardian_linked",
  "guardian_updated",
  "sibling_linked",
  "sibling_removed",
  "enrollment_moved",
] as const;

export type StudentEventType = (typeof studentEventTypes)[number];
export type StudentEventMetadata = Record<string, unknown>;

type DbLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type InsertStudentEventInput = {
  studentId: string;
  enrollmentId?: string | null;
  type: StudentEventType;
  message: string;
  metadata?: StudentEventMetadata;
  actorUserId?: string | null;
};

export async function insertStudentEvent(tx: DbLike, input: InsertStudentEventInput) {
  await tx.insert(studentEvents).values({
    id: randomUUID(),
    studentId: input.studentId,
    enrollmentId: input.enrollmentId ?? null,
    type: input.type,
    message: input.message,
    metadata: input.metadata ?? {},
    actorUserId: input.actorUserId ?? null,
  });
}
```

- [ ] **Step 2: Replace the local helper in `students/service.ts`**

Import the new helper:

```ts
import { insertStudentEvent } from "@/lib/server/students/events";
```

Change existing calls from positional arguments to object form:

```ts
await insertStudentEvent(db, {
  studentId,
  enrollmentId: context.enrollmentId,
  type: "student_updated",
  message: "Student identity details updated",
  metadata: {},
  actorUserId: context.actor.id,
});
```

Remove the old local `insertStudentEvent()` function from `src/lib/server/students/service.ts`.

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --pretty false`

Expected: no TypeScript errors. If errors point to `StudentEventType`, either correct the event type string or add the approved type to `studentEventTypes`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/server/students/events.ts src/lib/server/students/service.ts
git commit -m "Add student event writer"
```

---

### Task 2: Make Parent Account Creation Best-Effort During Acceptance

**Files:**
- Modify: `src/lib/server/admission/service.ts`
- Modify: `src/routes/api/admission/applications/$id/accept.ts`
- Modify: `src/components/students/student-types.ts`

**Interfaces:**
- Consumes: `insertStudentEvent(tx, input)` from Task 1.
- Produces: `acceptAdmissionApplication()` response with optional `warnings: Array<{ code: string; message: string; metadata?: Record<string, unknown> }>` and existing `parentCredentials`.

- [ ] **Step 1: Add warning types**

In `src/lib/server/admission/service.ts`, add:

```ts
type AdmissionAcceptanceWarning = {
  code: "parent_account_failed";
  message: string;
  metadata: { email: string; reason: string };
};

type ParentAccountResult =
  | {
      ok: true;
      userId: string;
      email: string;
      credentials: {
        nameUrdu: string;
        nameEnglish: string;
        email: string;
        role: "parent";
        password: string;
      };
    }
  | {
      ok: false;
      email: string;
      reason: string;
    }
  | null;
```

- [ ] **Step 2: Convert `maybeCreateParentAccount()` to return failure instead of throwing**

Keep missing email as a validation error, because the request is incomplete. Change the Better Auth catch block to return a failure result:

```ts
  } catch (error) {
    return {
      ok: false as const,
      email,
      reason: error instanceof Error ? error.message : "Parent account creation failed",
    };
  }
```

Remove the direct `admissionEvents` insert and `AdmissionError` throw from that catch block.

- [ ] **Step 3: Write student events inside the acceptance transaction**

Import:

```ts
import { insertStudentEvent } from "@/lib/server/students/events";
```

Inside the transaction, after the guardian and siblings are created, insert:

```ts
await insertStudentEvent(tx, {
  studentId,
  enrollmentId,
  type: "admission_accepted",
  message: `Admission accepted with roll ${rollNo}`,
  metadata: {
    applicationId: id,
    refNo: application.refNo,
    source: application.source,
    variantKey: application.variantKey,
    admissionNo,
    rollNo,
    institutionId: target.institutionId,
    programId: target.programId,
    schoolClassId: target.schoolClassId,
    schoolSectionId: target.schoolSectionId,
    madrassaSubcategoryId: target.madrassaSubcategoryId,
    darja: target.darja,
  },
  actorUserId: actor.id,
});

if (parentUser?.ok) {
  await insertStudentEvent(tx, {
    studentId,
    enrollmentId,
    type: "parent_account_created",
    message: "Parent login created",
    metadata: { userId: parentUser.userId, email: parentUser.email, guardianId: resolvedGuardianId },
    actorUserId: actor.id,
  });
}

if (parentUser && !parentUser.ok) {
  await insertStudentEvent(tx, {
    studentId,
    enrollmentId,
    type: "parent_account_failed",
    message: "Parent login could not be created",
    metadata: { email: parentUser.email, reason: parentUser.reason, guardianId: resolvedGuardianId },
    actorUserId: actor.id,
  });
}
```

- [ ] **Step 4: Return warnings without failing admission**

In the return value from `acceptAdmissionApplication()`, set:

```ts
const warnings: AdmissionAcceptanceWarning[] =
  parentUser && !parentUser.ok
    ? [
        {
          code: "parent_account_failed",
          message: "Admission accepted, but parent login could not be created.",
          metadata: { email: parentUser.email, reason: parentUser.reason },
        },
      ]
    : [];
```

Return:

```ts
return {
  application: toApplicationResponse(updated),
  student: { id: studentId, rollNo, admissionNo },
  guardian: { id: resolvedGuardianId },
  parentCredentials: parentUser?.ok ? parentUser.credentials : null,
  warnings,
};
```

Update the cleanup path so it runs only for `parentUser?.ok`.

- [ ] **Step 5: Type the client warning shape**

In `src/components/students/student-types.ts`, add:

```ts
export type AdmissionAcceptanceWarning = {
  code: "parent_account_failed";
  message: string;
  metadata?: {
    email?: string;
    reason?: string;
  };
};
```

- [ ] **Step 6: Verify**

Run: `bunx tsc --noEmit --pretty false`

Expected: no TypeScript errors. Confirm no code path throws `Parent account creation failed; admission was not accepted`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/server/admission/service.ts src/routes/api/admission/applications/\$id/accept.ts src/components/students/student-types.ts
git commit -m "Make parent account creation best effort"
```

---

### Task 3: Enrich Existing Student Events And Profile Payload

**Files:**
- Modify: `src/lib/server/students/service.ts`
- Modify: `src/components/students/student-types.ts`

**Interfaces:**
- Consumes: event helper from Task 1.
- Produces: profile events with `actorName` and metadata suitable for timeline rendering.

- [ ] **Step 1: Include actor names in profile event query**

Change the `eventRows` query in `getStudentProfile()` to join `authUser`:

```ts
db
  .select({
    id: studentEvents.id,
    studentId: studentEvents.studentId,
    enrollmentId: studentEvents.enrollmentId,
    type: studentEvents.type,
    message: studentEvents.message,
    metadata: studentEvents.metadata,
    actorUserId: studentEvents.actorUserId,
    actorName: authUser.name,
    actorEmail: authUser.email,
    createdAt: studentEvents.createdAt,
  })
  .from(studentEvents)
  .leftJoin(authUser, eq(authUser.id, studentEvents.actorUserId))
  .where(eq(studentEvents.studentId, studentId))
  .orderBy(desc(studentEvents.createdAt))
  .limit(100)
```

- [ ] **Step 2: Update event type in `student-types.ts`**

Extend `StudentEventProfile`:

```ts
export type StudentEventProfile = {
  id: string;
  studentId: string;
  enrollmentId: string | null;
  type: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};
```

- [ ] **Step 3: Enrich status change events**

In `updateStudentStatus()`, read the current status before updating and write:

```ts
metadata: {
  previousStatus: current.status,
  status: input.status,
  reason: input.reason ?? null,
}
```

If the student is missing, throw `new HttpError("Student not found", 404)`.

- [ ] **Step 4: Enrich guardian and sibling events**

For guardian events, include:

```ts
metadata: {
  guardianId,
  guardianName: input.name ?? existingGuardian?.name ?? "Guardian",
  relation: input.relation,
  isPrimary: input.isPrimary,
}
```

For sibling events, include:

```ts
metadata: {
  siblingStudentId: input.siblingStudentId,
  siblingName: sibling.name,
  siblingNameUrdu: sibling.nameUrdu,
}
```

Update the sibling query to select `name` and `nameUrdu`, not only `id`.

- [ ] **Step 5: Enrich enrollment move events**

Before updating enrollment, fetch the current enrollment labels. After validating the target, write metadata with:

```ts
metadata: {
  reason: input.reason,
  from: {
    institutionName: current.institutionName,
    programName: current.programName,
    groupName: current.schoolClassName ?? current.madrassaSubcategoryName,
    sectionName: current.schoolSectionName,
    darja: current.darja,
  },
  to: {
    institutionId: target.institutionId,
    programId: target.programId,
    schoolClassId: target.schoolClassId,
    schoolSectionId: target.schoolSectionId,
    madrassaSubcategoryId: target.madrassaSubcategoryId,
    darja: target.darja,
  },
}
```

This task stores readable `from` labels and complete target IDs plus `reason`; the UI fallback displays target IDs when target labels are unavailable.

- [ ] **Step 6: Verify**

Run: `bunx tsc --noEmit --pretty false`

Expected: no TypeScript errors and no positional `insertStudentEvent(` calls remain in `src/lib/server/students/service.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/server/students/service.ts src/components/students/student-types.ts
git commit -m "Enrich student timeline events"
```

---

### Task 4: Add Parent Account Retry API

**Files:**
- Modify: `src/lib/server/students/service.ts`
- Create: `src/routes/api/students/$id/guardians/$guardianId/parent-account.ts`
- Modify: `src/components/students/student-types.ts`

**Interfaces:**
- Consumes: Better Auth `auth.api.createUser`, `generateSecurePassword()`, and `insertStudentEvent()`.
- Produces: `retryGuardianParentAccount(request, studentId, guardianId, input)` and an API response with `parentCredentials` or `warning`.

- [ ] **Step 1: Add request and response types**

In `src/lib/server/students/service.ts`, add:

```ts
export const retryGuardianParentAccountSchema = z.object({
  email: z.email(),
  password: z.string().min(8).optional(),
});

type ParentAccountRetryWarning = {
  code: "parent_account_failed";
  message: string;
  metadata: {
    email: string;
    reason: string;
    guardianId: string;
  };
};
```

In `src/components/students/student-types.ts`, add:

```ts
export type ParentAccountRetryResponse = {
  parentCredentials: ParentCreds | null;
  warning?: {
    code: "parent_account_failed";
    message: string;
    metadata?: {
      email?: string;
      reason?: string;
      guardianId?: string;
    };
  };
};

export type ParentCreds = {
  nameUrdu: string;
  nameEnglish: string;
  email: string;
  role: "parent";
  password: string;
};
```

Use this exported `ParentCreds` in the student profile timeline. Keep the existing route-local `ParentCreds` in `src/routes/_authenticated/admission/queue.tsx` unchanged to avoid coupling unrelated UI files in this task.

- [ ] **Step 2: Implement retry service**

Add imports to `src/lib/server/students/service.ts`:

```ts
import { auth } from "@/lib/auth";
import { generateSecurePassword } from "@/lib/generate-password";
```

Add:

```ts
export async function retryGuardianParentAccount(
  request: Request,
  studentId: string,
  guardianId: string,
  input: z.infer<typeof retryGuardianParentAccountSchema>,
) {
  const context = await getStudentPermissionContext(request, studentId, "edit");
  await assertGuardianLinked(studentId, guardianId);

  const [guardian] = await db.select().from(guardians).where(eq(guardians.id, guardianId)).limit(1);
  if (!guardian) throw new HttpError("Guardian not found", 404);
  if (guardian.userId) throw new HttpError("Guardian already has a parent login", 409);

  const email = input.email.toLowerCase();
  const password = input.password ?? generateSecurePassword(12);

  try {
    const result = await auth.api.createUser({
      body: {
        name: guardian.name,
        email,
        password,
        role: "parent",
        data: {
          status: "active",
          systemAccess: "both",
          mustChangePassword: true,
        },
      },
    });

    if (!result?.user?.id) throw new Error("Better Auth did not return a user id");

    await db.update(guardians).set({ userId: result.user.id, email, updatedAt: new Date() }).where(eq(guardians.id, guardianId));
    await insertStudentEvent(db, {
      studentId,
      enrollmentId: context.enrollmentId,
      type: "parent_account_created",
      message: "Parent login created after retry",
      metadata: { userId: result.user.id, email, guardianId, source: "student_profile_retry" },
      actorUserId: context.actor.id,
    });

    return {
      parentCredentials: {
        nameUrdu: guardian.nameUrdu ?? guardian.name,
        nameEnglish: guardian.name,
        email,
        role: "parent" as const,
        password,
      },
      warning: undefined,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Parent account creation failed";
    const warning: ParentAccountRetryWarning = {
      code: "parent_account_failed",
      message: "Parent login could not be created.",
      metadata: { email, reason, guardianId },
    };

    await insertStudentEvent(db, {
      studentId,
      enrollmentId: context.enrollmentId,
      type: "parent_account_failed",
      message: "Parent login retry failed",
      metadata: { ...warning.metadata, source: "student_profile_retry" },
      actorUserId: context.actor.id,
    });

    return { parentCredentials: null, warning };
  }
}
```

- [ ] **Step 3: Add API route**

Create `src/routes/api/students/$id/guardians/$guardianId/parent-account.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router";
import {
  retryGuardianParentAccount,
  retryGuardianParentAccountSchema,
} from "@/lib/server/students/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/students/$id/guardians/$guardianId/parent-account")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, retryGuardianParentAccountSchema);
        if (!body.ok) return body.response;

        try {
          return json(await retryGuardianParentAccount(request, params.id, params.guardianId, body.data));
        } catch (error) {
          return errorResponse(error, "Could not create parent account");
        }
      },
    },
  },
});
```

- [ ] **Step 4: Verify**

Run: `bunx tsc --noEmit --pretty false`

Expected: no TypeScript errors. The route tree may regenerate during build; do not manually edit `src/routeTree.gen.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/students/service.ts src/routes/api/students/\$id/guardians/\$guardianId/parent-account.ts src/components/students/student-types.ts
git commit -m "Add parent account retry endpoint"
```

---

### Task 5: Add Move Enrollment UI

**Files:**
- Create: `src/components/students/move-enrollment-dialog.tsx`
- Modify: `src/routes/_authenticated/students/$id.tsx`

**Interfaces:**
- Consumes: `profile.student`, `profile.enrollments`, `/api/academic/institutions`, `/api/academic/programs`, `/api/academic/school/classes`, `/api/academic/madrassa/categories`, and `/api/students/$id/enrollments/move`.
- Produces: `<MoveEnrollmentDialog profile={profile} open={moveOpen} onOpenChange={setMoveOpen} onMoved={loadProfile} />`.

- [ ] **Step 1: Create the dialog shell**

Create `src/components/students/move-enrollment-dialog.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StudentProfilePayload } from "@/components/students/student-types";

type Props = {
  profile: StudentProfilePayload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved: () => Promise<void> | void;
};

type InstitutionOption = { id: string; name: string; nameUrdu: string; section: string | null; active: boolean };
type ProgramOption = { id: string; institutionId: string; name: string; nameUrdu: string; system: "school" | "school_support" | "madrassa"; active: boolean };
type SchoolClassOption = { id: string; name: string; nameUrdu: string; active: boolean; sections: Array<{ id: string; name: string; active: boolean }> };
type MadrassaCategoryOption = { id: string; name: string; nameUrdu: string; active: boolean; subcategories: Array<{ id: string; name: string; nameUrdu: string; darja: string | null; active: boolean }> };
```

- [ ] **Step 2: Load academic options**

Inside the component, load all option lists when the dialog opens:

```tsx
const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
const [programs, setPrograms] = useState<ProgramOption[]>([]);
const [schoolClasses, setSchoolClasses] = useState<SchoolClassOption[]>([]);
const [madrassaCategories, setMadrassaCategories] = useState<MadrassaCategoryOption[]>([]);
const [loading, setLoading] = useState(false);
const currentEnrollment = profile.enrollments.find((item) => item.endedAt === null) ?? profile.enrollments[0];

useEffect(() => {
  if (!open) return;
  let cancelled = false;
  async function loadOptions() {
    setLoading(true);
    try {
      const [institutionResponse, programResponse, classResponse, categoryResponse] = await Promise.all([
        fetch("/api/academic/institutions", { credentials: "include" }),
        fetch("/api/academic/programs", { credentials: "include" }),
        fetch("/api/academic/school/classes", { credentials: "include" }),
        fetch("/api/academic/madrassa/categories", { credentials: "include" }),
      ]);
      const [institutionPayload, programPayload, classPayload, categoryPayload] = await Promise.all([
        institutionResponse.json().catch(() => ({})),
        programResponse.json().catch(() => ({})),
        classResponse.json().catch(() => ({})),
        categoryResponse.json().catch(() => ({})),
      ]);
      if (!institutionResponse.ok) throw new Error(institutionPayload.error || "Could not load institutions");
      if (!programResponse.ok) throw new Error(programPayload.error || "Could not load programs");
      if (!classResponse.ok) throw new Error(classPayload.error || "Could not load school classes");
      if (!categoryResponse.ok) throw new Error(categoryPayload.error || "Could not load madrassa categories");
      if (!cancelled) {
        setInstitutions(institutionPayload.institutions ?? []);
        setPrograms(programPayload.programs ?? []);
        setSchoolClasses(classPayload.classes ?? []);
        setMadrassaCategories(categoryPayload.categories ?? []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load academic options");
    } finally {
      if (!cancelled) setLoading(false);
    }
  }
  void loadOptions();
  return () => {
    cancelled = true;
  };
}, [open]);
```

- [ ] **Step 3: Add controlled form state**

Initialize from the current enrollment:

```tsx
const [institutionId, setInstitutionId] = useState("");
const [programId, setProgramId] = useState("");
const [schoolClassId, setSchoolClassId] = useState("");
const [schoolSectionId, setSchoolSectionId] = useState("");
const [madrassaSubcategoryId, setMadrassaSubcategoryId] = useState("");
const [reason, setReason] = useState("");
const [submitting, setSubmitting] = useState(false);

useEffect(() => {
  if (!open || !currentEnrollment) return;
  setInstitutionId(currentEnrollment.institutionId);
  setProgramId(currentEnrollment.programId);
  setSchoolClassId(currentEnrollment.schoolClassId ?? "");
  setSchoolSectionId(currentEnrollment.schoolSectionId ?? "");
  setMadrassaSubcategoryId(currentEnrollment.madrassaSubcategoryId ?? "");
  setReason("");
}, [currentEnrollment, open]);
```

Compute:

```tsx
const selectedProgram = programs.find((program) => program.id === programId);
const isMadrassa = selectedProgram?.system === "madrassa";
const availablePrograms = programs.filter((program) => program.institutionId === institutionId && program.active);
const availableSubcategories = madrassaCategories.flatMap((category) => category.subcategories.map((subcategory) => ({ ...subcategory, categoryName: category.name, categoryNameUrdu: category.nameUrdu })));
const selectedClass = schoolClasses.find((item) => item.id === schoolClassId);
```

- [ ] **Step 4: Submit to the existing move endpoint**

Add:

```tsx
async function submitMove() {
  if (!currentEnrollment) return;
  setSubmitting(true);
  try {
    const response = await fetch(`/api/students/${profile.student.id}/enrollments/move`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        enrollmentId: currentEnrollment.id,
        institutionId,
        programId,
        schoolClassId: isMadrassa ? null : schoolClassId || null,
        schoolSectionId: isMadrassa ? null : schoolSectionId || null,
        madrassaSubcategoryId: isMadrassa ? madrassaSubcategoryId || null : null,
        reason,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not move enrollment");
    toast.success("Enrollment moved", { description: "Academic placement updated." });
    await onMoved();
    onOpenChange(false);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not move enrollment");
  } finally {
    setSubmitting(false);
  }
}
```

- [ ] **Step 5: Render the form**

Use `ResponsiveDialog` with `ArrowRightLeft`. Render institution, program, class/subcategory, section, and reason fields. Disable submit unless `institutionId`, `programId`, the required class/subcategory, and `reason.trim()` are present. The footer button should call `submitMove()` and show `Loader2` when submitting.

- [ ] **Step 6: Wire it into the student profile**

In `src/routes/_authenticated/students/$id.tsx`, make `loadProfile` a `useCallback` inside the component so child actions can refresh the profile. Add:

```tsx
const [moveOpen, setMoveOpen] = useState(false);
```

Add a button in the `PageHeader` actions:

```tsx
<Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMoveOpen(true)}>
  <ArrowRightLeft className="h-3.5 w-3.5" />
  Move Enrollment
</Button>
```

Render:

```tsx
<MoveEnrollmentDialog profile={profile} open={moveOpen} onOpenChange={setMoveOpen} onMoved={loadProfile} />
```

- [ ] **Step 7: Verify**

Run: `bunx tsc --noEmit --pretty false`

Expected: no TypeScript errors. Do not start the dev server.

- [ ] **Step 8: Commit**

```bash
git add src/components/students/move-enrollment-dialog.tsx src/routes/_authenticated/students/\$id.tsx
git commit -m "Add move enrollment profile action"
```

---

### Task 6: Add Guardian And Sibling Management UI

**Files:**
- Create: `src/components/students/student-guardian-manager.tsx`
- Create: `src/components/students/student-sibling-manager.tsx`
- Modify: `src/routes/_authenticated/students/$id.tsx`

**Interfaces:**
- Consumes: `/api/students/$id/guardians`, `/api/students/$id/guardians/$guardianId`, `/api/students/$id/siblings`, `/api/students/$id/siblings/$siblingId`, and `/api/students?system=...&q=...`.
- Produces: profile tab managers that update existing guardians and sibling links only.

- [ ] **Step 1: Create `StudentGuardianManager`**

Create `src/components/students/student-guardian-manager.tsx` exporting:

```tsx
export function StudentGuardianManager({
  profile,
  onChanged,
}: {
  profile: StudentProfilePayload;
  onChanged: () => Promise<void> | void;
}) {
  return (
    <Card className="overflow-hidden mt-3">
      <div className="flex items-center justify-between gap-3 border-b border-border p-3">
        <p className="text-sm font-medium">Guardians</p>
        <Button size="sm" onClick={() => setEditing("new")}>Add Guardian</Button>
      </div>
      <Table>
        <TableBody>
          {profile.guardians.map((guardian) => (
            <TableRow key={guardian.guardianId}>
              <TableCell>{guardian.name}</TableCell>
              <TableCell>{guardian.relation}{guardian.isPrimary ? " · Primary" : ""}</TableCell>
              <TableCell className="font-mono text-xs">{guardian.phone ?? "—"}</TableCell>
              <TableCell className="text-end">
                <Button variant="outline" size="sm" onClick={() => setEditing(guardian.guardianId)}>Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
```

Use `ResponsiveDialog` for add/edit. Form fields: `name`, `nameUrdu`, `relation`, `phone`, `cnic`, `email`, `address`, and `isPrimary`. Add submits to `POST /api/students/${profile.student.id}/guardians`; edit submits to `PATCH /api/students/${profile.student.id}/guardians/${guardian.guardianId}`. On success, show `toast.success()` and call `await onChanged()`.

- [ ] **Step 2: Create `StudentSiblingManager`**

Create `src/components/students/student-sibling-manager.tsx` exporting:

```tsx
export function StudentSiblingManager({
  profile,
  onChanged,
}: {
  profile: StudentProfilePayload;
  onChanged: () => Promise<void> | void;
}) {
  return (
    <Card className="p-5 mt-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Siblings</p>
        <Button size="sm" onClick={() => setSearchOpen(true)}>Link Sibling</Button>
      </div>
      {profile.siblings.length === 0 && <p className="text-sm text-muted-foreground">No siblings linked.</p>}
      {profile.siblings.map((sibling) => (
        <div key={sibling.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div>
            <p className="font-urdu text-sm">{sibling.nameUrdu}</p>
            <p className="text-xs text-muted-foreground">{sibling.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRemoving(sibling)}>Remove</Button>
        </div>
      ))}
    </Card>
  );
}
```

Use a search input to query both systems:

```ts
const [schoolResponse, madrassaResponse] = await Promise.all([
  fetch(`/api/students?system=school&q=${encodeURIComponent(query)}&pageSize=10`, { credentials: "include" }),
  fetch(`/api/students?system=madrassa&q=${encodeURIComponent(query)}&pageSize=10`, { credentials: "include" }),
]);
```

Filter out the current student and already-linked siblings. Link with `POST /api/students/${profile.student.id}/siblings` and `{ siblingStudentId }`. Remove with `DELETE /api/students/${profile.student.id}/siblings/${sibling.id}`. Confirm removal with `AlertDialog`.

- [ ] **Step 3: Wire managers into profile tabs**

In `src/routes/_authenticated/students/$id.tsx`, replace the raw Guardians tab table with:

```tsx
<TabsContent value="guardians">
  <StudentGuardianManager profile={profile} onChanged={loadProfile} />
</TabsContent>
```

Replace the raw Siblings tab card with:

```tsx
<TabsContent value="siblings">
  <StudentSiblingManager profile={profile} onChanged={loadProfile} />
</TabsContent>
```

- [ ] **Step 4: Verify**

Run: `bunx tsc --noEmit --pretty false`

Expected: no TypeScript errors. The UI must not include any direct student creation action.

- [ ] **Step 5: Commit**

```bash
git add src/components/students/student-guardian-manager.tsx src/components/students/student-sibling-manager.tsx src/routes/_authenticated/students/\$id.tsx
git commit -m "Add student guardian and sibling management"
```

---

### Task 7: Build The Timeline Component

**Files:**
- Create: `src/components/students/student-timeline.tsx`
- Modify: `src/routes/_authenticated/students/$id.tsx`

**Interfaces:**
- Consumes: `StudentProfilePayload`, especially `events`, `guardians`, and `admission`.
- Produces: `<StudentTimeline profile={profile} onParentCredentials={setCreds} />`.

- [ ] **Step 1: Create timeline categories and helpers**

Create `src/components/students/student-timeline.tsx` with category mapping:

```ts
type TimelineCategory = "all" | "admission" | "academic" | "guardian" | "sibling" | "account" | "status";

const eventCategories: Record<string, Exclude<TimelineCategory, "all">> = {
  admission_accepted: "admission",
  parent_account_created: "account",
  parent_account_failed: "account",
  student_updated: "status",
  status_changed: "status",
  guardian_linked: "guardian",
  guardian_updated: "guardian",
  sibling_linked: "sibling",
  sibling_removed: "sibling",
  enrollment_moved: "academic",
};

const warningTypes = new Set(["parent_account_failed"]);
```

- [ ] **Step 2: Render grouped events**

The component should:

```tsx
export function StudentTimeline({
  profile,
  onParentCredentials,
}: {
  profile: StudentProfilePayload;
  onParentCredentials: (creds: ParentCreds) => void;
}) {
  const [filter, setFilter] = useState<TimelineCategory>("all");
  const items = useMemo(() => buildTimelineItems(profile), [profile]);
  const filtered = filter === "all" ? items : items.filter((item) => item.category === filter);
  const groups = groupByDay(filtered);

  return (
    <Card className="mt-3 p-0 overflow-hidden">
      <div className="border-b border-border p-3">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as TimelineCategory)}>
          <TabsList className="flex flex-wrap h-auto justify-start">
            {timelineFilters.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="p-5 space-y-6">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeline events for this filter.</p>
        ) : (
          groups.map((group) => <TimelineGroup key={group.label} group={group} onParentCredentials={onParentCredentials} profile={profile} />)
        )}
      </div>
    </Card>
  );
}
```

Use lucide icons: `CheckCircle2`, `AlertTriangle`, `UserRound`, `UsersRound`, `GraduationCap`, `ShieldCheck`, `RefreshCw`, and `Clock`.

- [ ] **Step 3: Build sparse-event fallback**

`buildTimelineItems()` must create safe labels even when old events have weak metadata:

```ts
function titleFor(type: string) {
  return type.split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

function metadataText(metadata: Record<string, unknown> | null) {
  if (!metadata) return [];
  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
    .map(([key, value]) => `${titleFor(key)}: ${String(value)}`);
}
```

- [ ] **Step 4: Replace Activity tab rendering**

In `src/routes/_authenticated/students/$id.tsx`, import:

```ts
import { StudentTimeline } from "@/components/students/student-timeline";
import type { ParentCreds } from "@/components/students/student-types";
import { CredentialsOverlay } from "@/features/users/credentials-display";
```

Add state:

```ts
const [creds, setCreds] = useState<ParentCreds | null>(null);
```

Replace the current `<TabsContent value="activity">...</TabsContent>` body with:

```tsx
<TabsContent value="activity">
  <StudentTimeline profile={profile} onParentCredentials={setCreds} />
</TabsContent>
```

Render the overlay near the end of the component:

```tsx
<CredentialsOverlay creds={creds} onClose={() => setCreds(null)} />
```

Remove unused `ClipboardList` usage only if no longer needed elsewhere in the file.

- [ ] **Step 5: Add retry button behavior**

For `parent_account_failed` items, render a `Retry Parent Account` button only when at least one guardian has `userId === null` and an email can be resolved from event metadata or the primary guardian. On click:

```ts
const response = await fetch(`/api/students/${profile.student.id}/guardians/${guardian.guardianId}/parent-account`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email }),
});
const payload = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(payload.error || "Could not create parent account");
if (payload.parentCredentials) onParentCredentials(payload.parentCredentials);
if (payload.warning) toast.warning(payload.warning.message, { description: payload.warning.metadata?.reason });
```

After a successful retry or warning, the page can stay on the current data until the next reload. Do not add broad cache infrastructure in this task.

- [ ] **Step 6: Verify**

Run: `bunx tsc --noEmit --pretty false`

Expected: no TypeScript errors. The component must not require the dev server to verify basic type correctness.

- [ ] **Step 7: Commit**

```bash
git add src/components/students/student-timeline.tsx src/routes/_authenticated/students/\$id.tsx
git commit -m "Add student profile timeline UI"
```

---

### Task 8: Show Admission Queue Warning Feedback

**Files:**
- Modify: `src/routes/_authenticated/admission/queue.tsx`

**Interfaces:**
- Consumes: `warnings` returned by `acceptAdmissionApplication()`.
- Produces: success toast for accepted admission and warning toast for parent account failure.

- [ ] **Step 1: Add warning type**

Near `ParentCreds`, add:

```ts
type AcceptWarning = {
  code: "parent_account_failed";
  message: string;
  metadata?: {
    email?: string;
    reason?: string;
  };
};
```

- [ ] **Step 2: Handle warnings after accept**

In `confirmAccept()`, after success and credential handling:

```ts
const warnings: AcceptWarning[] = payload.warnings ?? [];
const parentWarning = warnings.find((warning) => warning.code === "parent_account_failed");

toast.success(`Accepted — Roll ${payload.student?.rollNo ?? "assigned"}`, { description: "داخلہ منظور ہوا" });

if (parentWarning) {
  toast.warning(parentWarning.message, {
    description: [parentWarning.metadata?.email, parentWarning.metadata?.reason].filter(Boolean).join(" · "),
  });
}
```

Remove the old single success toast before adding this block to avoid duplicate success messages.

- [ ] **Step 3: Update dialog copy**

Change the parent login helper text from:

```tsx
Better Auth will create a parent user before the student record is saved.
```

to:

```tsx
Better Auth will try to create a parent login. Admission will still be accepted if account creation fails.
```

- [ ] **Step 4: Verify**

Run: `bunx tsc --noEmit --pretty false`

Expected: no TypeScript errors and only one success toast path remains in `confirmAccept()`.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_authenticated/admission/queue.tsx
git commit -m "Show parent account warning on admission accept"
```

---

### Task 9: Final Verification

**Files:**
- Review: `docs/superpowers/specs/2026-07-16-student-profile-timeline-design.md`
- Review: all files changed by Tasks 1-8

**Interfaces:**
- Consumes: complete implementation.
- Produces: verified working code with no dev server started.

- [ ] **Step 1: Run static validation**

Run:

```bash
bun run lint
```

Expected: command exits 0.

- [ ] **Step 2: Run production build**

Run:

```bash
bun run build
```

Expected: command exits 0. Existing Vite warning about `vite-tsconfig-paths` is acceptable unless new errors appear.

- [ ] **Step 3: Inspect for accidental direct student creation**

Run:

```bash
rg -n "Add Student|add-student|createStudent|students.*POST" src
```

Expected: no direct student creation UI or API is introduced. Admission APIs may still create students through acceptance.

- [ ] **Step 4: Inspect parent account failure behavior**

Run:

```bash
rg -n "Parent account creation failed; admission was not accepted|throw new AdmissionError\\(\"Parent account creation failed" src/lib/server/admission/service.ts
```

Expected: no matches.

- [ ] **Step 5: Commit verification fixes when files changed**

If verification required minor fixes and files changed:

```bash
git add <changed-files>
git commit -m "Verify student timeline integration"
```

If no fixes were required, do not create an empty commit.
