# Scoped Academic Years Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admissions to use separate active academic years for school and madrassa systems.

**Architecture:** Add system/calendar scope to academic years, update backend services to resolve active years by system, and replace the mock settings page with an API-backed TanStack Query UI. Keep Gregorian dates as the database source of truth and Hijri labels as explicit admin-entered metadata.

**Tech Stack:** TanStack Start, React, TypeScript, TanStack Query, Drizzle ORM, Postgres.

## Global Constraints

- Do not start the dev server.
- Do not hardcode or infer Hijri-to-Gregorian dates.
- Madrassa academic years use `calendarType: "hijri"`.
- School academic years use `calendarType: "gregorian"`.
- Admissions must resolve academic years from the selected program system.

---

### Task 1: Schema And Migration

**Files:**

- Modify: `src/db/schema/academic-years.ts`
- Create/Modify: Drizzle migration under `drizzle/`

- [x] Add `system` and `calendarType` columns to `academicYears`.
- [x] Replace the global active-year unique index with a per-system active-year unique index.
- [x] Generate or write the matching Drizzle migration.

### Task 2: Academic-Year Service

**Files:**

- Modify: `src/lib/server/academic-years/domain.ts`
- Modify: `src/lib/server/academic-years/service.ts`
- Modify: `src/lib/server/academic-years/domain.test.ts`

- [x] Add system/calendar validation helpers.
- [x] Make create/list/activate/backfill system-aware.
- [x] Keep status locking behavior unchanged.
- [x] Add focused tests for calendar validation and missing active-year messages.

### Task 3: Admission Integration

**Files:**

- Modify: `src/lib/server/admission/service.ts`

- [x] Resolve the target program's system before accepting the admission.
- [x] Use `getActiveAcademicYear(programSystem)` instead of global active-year lookup.
- [x] Store the scoped academic year id on the created enrollment.

### Task 4: Settings UI

**Files:**

- Modify: `src/routes/_authenticated/settings/academic-year.tsx`

- [x] Replace local seed state with `useQuery`.
- [x] Add mutations for create, activate, archive, and lock.
- [x] Show school and madrassa academic years separately.
- [x] Make the madrassa form clearly Hijri-calendar based while still requiring Gregorian start/end dates.

### Task 5: Verification

- [x] Run targeted tests.
- [x] Run `bun run lint`.
- [x] Run `bun run build`.
- [x] Do not run `bun run dev`.
