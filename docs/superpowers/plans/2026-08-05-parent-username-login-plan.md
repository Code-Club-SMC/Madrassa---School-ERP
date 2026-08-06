# Parent Username Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parents receive username/password portal access automatically from admission, while staff continue using email/password.

**Architecture:** Keep Better Auth as the auth backend. Use Better Auth username plugin for parent login IDs and keep internal generated email hidden because Better Auth requires an email value. Update login page to Urdu-only staff/parent modes.

**Tech Stack:** TanStack Router, React, TypeScript, Better Auth, Drizzle/Postgres, shadcn/Radix UI.

## Global Constraints

- Frontend copy for this work must be Urdu-only.
- Staff login uses email/password.
- Parent login uses username/password.
- No new sequence table for parent login IDs.
- Parent admission must still succeed if account creation fails.
- Do not start the dev server during implementation.

---

### Task 1: Parent Username Generation

**Files:**
- Create: `src/lib/server/auth/parent-login.ts`
- Modify: `src/lib/auth.ts`

**Interfaces:**
- Produces: `buildParentUsernameBase(name: string): string`
- Produces: `createUniqueParentLoginIdentity(name: string): Promise<{ username: string; email: string }>`

- [x] Add username helper that romanizes common Urdu names, slugifies ASCII names, appends random digits, checks `user.username`, and returns hidden internal email.
- [x] Confirm Better Auth `username()` plugin is already configured for parent login IDs.
- [x] Add focused tests for generated username shape and uniqueness retry.

### Task 2: Parent Account Creation

**Files:**
- Modify: `src/lib/server/admission/service.ts`
- Modify: `src/lib/server/students/service.ts`
- Modify: `src/components/students/student-types.ts`

**Interfaces:**
- Consumes: `createUniqueParentLoginIdentity(name)`
- Produces parent credentials with `username` and hidden `email`.

- [x] Direct admission auto-creates parent login without requiring guardian email.
- [x] Admission queue creates parent login when operator checks the box, without email input.
- [x] Student profile guardian action creates parent login without email input.
- [x] Event metadata stores username and hidden email, never password.
- [x] Failure keeps admission successful and logs `parent_account_failed`.

### Task 3: Urdu Login UI

**Files:**
- Modify: `src/routes/login.tsx`

**Interfaces:**
- Staff mode calls `authClient.signIn.email`.
- Parent mode calls `authClient.signIn.username`.

- [x] Replace English login copy with Urdu-only copy.
- [x] Add `عملہ` / `والدین` segmented control.
- [x] Use email field in staff mode and login ID field in parent mode.
- [x] Replace wrong right-panel madrassa name with four known units: boys madrassa, girls madrassa, Al-Qasim Academy, girls school-support department.
- [x] Improve spacing, RTL layout, and error messages.

### Task 4: Credential Display And Guardian UI

**Files:**
- Modify: `src/features/users/credentials-display.tsx`
- Modify: `src/components/students/student-guardian-manager.tsx`
- Modify: `src/components/students/student-timeline.tsx`
- Modify: `src/routes/_authenticated/admission/queue.tsx`

**Interfaces:**
- `ParentCreds` includes optional `username`.

- [x] Show `لاگ اِن آئی ڈی` for parent credentials.
- [x] Stop showing hidden generated email as parent-facing credential.
- [x] Remove parent email input from parent-login creation dialogs.
- [x] Keep guardian email as optional contact info only.

### Task 5: Verification

**Files:**
- Existing tests plus new parent-login tests.

- [x] Run parent-login focused tests.
- [x] Run existing admission focused tests.
- [x] Run `bun run lint`.
- [x] Run `bun run build`.
