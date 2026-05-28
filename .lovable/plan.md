# Frontend One-Shot: Seating v2, HR & Payroll, Bug Fixes

Scope: pure frontend. No backend, no DB. All state via React `useState`/`useReducer` and a small Zustand-style store for HR. Types only (no `interface`, no `any`). Tailwind + shadcn/ui. TanStack Router file-based routes.

## Part 1 — Exam Seating (replace existing)

**Files**
- Delete: `src/routes/_authenticated/school/exams.$id.seating.tsx`, `src/routes/_authenticated/madrassa/exams.$id.seating.tsx` (old implementations).
- Create: `src/lib/seating.ts` — pure algorithm + types (gcd, findRowStep, canPlaceGreedy, countViolations, `buildHallSeating`, `shuffleHall`).
- Create: `src/lib/mock/seating.ts` — `mockHalls`, `mockStudents` distributed round-robin across 5 grades × 4 halls.
- Create: `src/components/shared/ExamSeating.tsx` — toolbar (Gap/Rows/Cols/Aisles/Cell px/Shuffle/Regenerate/Highlight), hall tabs, grid with axis labels + aisles, hover scale + cursor-tracking tooltip, grade legend, hall stats sidebar, status pill, feasibility banner.
- Create: `src/routes/_authenticated/school/exams.$id.seating.tsx` and `madrassa/exams.$id.seating.tsx` — thin wrappers using `<ExamSeating />`.
- Edit: `school/exams.$id.index.tsx` and `madrassa/exams.$id.index.tsx` — ensure "Seating" button routes here.

Algorithm exactly as spec: slot = `(row*rowStep + col) % numGrades`, Fisher–Yates per grade, greedy overflow with `canPlaceGreedy`, count violations after.

## Part 2 — Reports fix

- Wrap every Recharts chart in `<ResponsiveContainer width="100%" height={300}>` inside a parent with `min-h-[300px]`.
- Add empty-state fallback when data array is empty.
- Verify `reports.tsx` (index) renders `<Outlet />` if it's a layout; otherwise ensure child report routes (`reports.annual/monthly/attendance/category.tsx`) are standalone and reachable. Confirm `<Button asChild><Link to={...}>` works (already applied previously) — re-test.

## Part 3 — Classes & Subjects: full CRUD

Files: `madrassa/classes.tsx`, `school/classes.tsx`, `madrassa/subjects.tsx`, `school/subjects.tsx`.
- Add `<Dialog open onOpenChange>` with TanStack Form + zod form inside.
- Wire Add / Edit (same dialog, prefilled) / Delete (confirm AlertDialog).
- Mutations via local `useState`, spread into new arrays.

## Part 4 — Teacher detail view

- Create `src/routes/_authenticated/teachers.$teacherId.tsx` (replacing/augmenting `teachers.$id.tsx` if needed — check current filename and align with the eye icon's `to`/`params`).
- Normalize id lookups; render "Teacher not found" fallback.
- Build profile header, personal info, assigned classes/subjects, attendance + payroll summary cards (read from HR store), "View HR Profile" → `/hr/staff/$staffId`.

## Part 5 — Duplicate active nav link

- `src/components/app/app-sidebar.tsx` and `mobile-bottom-nav.tsx`: add `activeOptions={{ exact: true }}` to any link whose `to` is a prefix of another (`/`, `/madrassa`, `/school`, `/hr`, `/settings`, `/reports`).

## Part 6 — HR & Payroll (new module)

**Mock + store**
- `src/lib/mock/hr.ts` — exports typed `staffMembers`, `payrollProfiles`, `payslips`, `attendance`, `leaves`, `loans`, `departments`. 12+ staff (mix of teachers + others) with realistic PK names/CNICs/salaries; 3 months attendance; 2–3 payslips each.
- `src/stores/hr-store.ts` — Zustand store with all actions: addStaff (auto-links teachers), updateStaff, terminateStaff, updatePayrollProfile (revision), generatePayroll, approvePayroll, markPayrollPaid, bulkSaveAttendance, approveLeave, rejectLeave, addLoan, settleLoan.

**Routes (all under `_authenticated/hr/`)**
- `hr/staff.index.tsx` — list + filters + "Add Staff" Sheet (multi-step TanStack Form).
- `hr/staff.$staffId.tsx` — 7-tab profile (Overview, Payroll Profile, Payslips, Attendance, Loans, Leave, Documents).
- `hr/payroll.tsx` — generate/approve/pay flow.
- `hr/attendance.tsx` — bulk daily entry + monthly summary tab.
- `hr/leave.tsx` — approvals + history.
- `hr/departments.tsx` — CRUD table.
- `hr/index.tsx` — landing/redirect to `/hr/staff`.
- Sidebar nav: add HR group with these links.

**Teachers module → read-only academic view**
- `madrassa/teachers` & `school/teachers` (currently single `teachers.tsx`): remove "Add Teacher" button; source from HR store filtered by `staffType==='teacher'` and module; "View HR Profile" per row.

## Execution Order

1. Mock + store + lib (`seating.ts`, `mock/seating.ts`, `mock/hr.ts`, `hr-store.ts`).
2. Shared component `<ExamSeating />`.
3. All new route files (HR + seating wrappers + teacher detail) created in one batch; router codegen runs once.
4. Bug fixes (Reports, Classes/Subjects CRUD, nav active, teachers read-only).
5. Self-check via console/network and manual route smoke test.

## Technical notes

- No `interface` → use `type`. No `any` → `unknown` + narrowing.
- Forms: TanStack Form (`@tanstack/react-form`) with zod resolvers. Add dep if missing.
- Zustand: check `package.json`; add if missing.
- All sidebar links audited for `activeOptions.exact`.
- Dialogs always controlled with both `open` and `onOpenChange`.
- Recharts always wrapped + parent has fixed height.

## Out of scope

Auth, exam creation/hall config UI, anything not listed above.
