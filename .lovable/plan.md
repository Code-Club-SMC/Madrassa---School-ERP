# MSMIS Frontend Implementation Plan

Source of truth: `msmis-ui-brief-2-3.md` (3,574 lines). Sections 1–6 override 7–13; Sections 41–45 supersede 12–13; Section 51 supersedes 13.4; Section 50 replaces Hifz profile cards/tabs.

Acceptance bar (non-negotiable): "indistinguishable from a senior SaaS product designer". All 55 routes wired, all 12 mock files present, RTL/Urdu Nastaliq throughout, paisa-based money, every async surface has skeleton + error + empty states, print stylesheets for receipts/DMC/ID cards/salary slips.

---

## Build order (rationale)

Foundation → shell → data spine → admission → academic (Madrassa, then School) → people (Teachers, IDs) → reports/print → ops (Inventory, Finance) → dashboard → portals (Parents, Website) → settings/audit → QA. Each later phase consumes types/mocks/components produced earlier, so reordering creates rework.

---

## Phase A — Foundation refactor

- Move to feature-folder layout per Section 39+58: `src/features/{admission,madrassa,school,teachers,fees,reports,inventory,finance,parents,website,settings}/components`, `src/types/*`, `src/hooks/{useSession,useSystem,useTheme}.ts`, `src/lib/{formatters,theme,cn}.ts`, `src/components/shared/*`, `src/components/app/*`.
- Replace monolithic `src/mock/index.ts` with domain files: `students, categories, classes, subjects, finance, users, attendance, exams, madrassa-exams, applications, holidays, audit-log` (12 files, 15–20 records each, real Wifaq/Pakistani data per §41.4, §42.1, §57).
- `formatters.ts`: `formatPKR(paisa)`, `formatUrduDate`, `toArabicIndic`, `formatRoll`, `formatPercent`. All money stored as paisa (PKR×100).
- `theme.ts`: pre-render apply (no FOUC) reading from localStorage; `useTheme` hook with light/dark/system.
- `StatusBadge` with full 11-status map (§6); `BilingualLabel`, `EmptyState`, `PageHeader`, `DataTableWrapper`, `KPICard`, `PlaceholderPage` polished to spec.
- Fonts: wire `@fontsource-variable/geist`, `@fontsource-variable/inter`, `@fontsource/noto-nastaliq-urdu`; `font-urdu` utility; `dir="rtl"` on all Urdu strings.
- CSS logical properties only (`ms-/me-/ps-/pe-`); add lint guard comment in `styles.css`.

## Phase B — Shell & Navigation

- `AppShell` (§8.1) with sidebar + topbar + outlet; system-switch fade (Madrassa ↔ School) per §44.
- Sidebar: GLOBAL section label, role-gated entries (super_admin sees Users), bottom-pinned admin section, 14px row height, 18px icons, 17.5rem width, breathable spacing.
- `nav-config.ts` with `madrassaNav`/`schoolNav`/`globalNav`/`adminNav` including §44 additions (`/madrassa/exams`, `/school/classes`) and §46/47/48/56 additions.
- Topbar: search (`cmdk`), notifications, theme toggle, system switcher, user menu.
- Mobile bottom nav (<md) per §29.

## Phase C — Auth & Users

- `/login` (§9.1), `/change-password` (§9.2), `/users` super_admin-only (§9.3) with credentials overlay.
- Public `/apply` (§11.5) and `/parents` login (§18.3).
- Session mock via `useSession`; role gating across routes.

## Phase D — Admission

- `/admission` hub, `/admission/new` 5-step wizard (Personal → System → Details → Guardian → Review) per §11.3 with DatePicker, photo thumbnail, sibling chip search with removal animation, cascading skeletons.
- `/admission/queue` (§11.4) with Accept (generates roll, opens credentials overlay) / Reject (reason dialog) / View flows.

## Phase E — Madrassa module

- `/madrassa/students` list + `$id` profile with Dars-e-Nizami tab (§41.7), Hifz profile variant (§50: progress card, 30-cell Juz Grid, Juz Detail Popover, Revision Tracking tab replacing Fees, Hifz Exam tab, Wifaq registration).
- `/madrassa/categories` with real Wifaq tree (Qaida/Nazira, Hifz, Dars-e-Nizami 8 darjat, Takhassus) per §41.4.
- `/madrassa/attendance` daily marking.
- `/madrassa/fees` with receipt dialog (§30.3) + concessions (§49.4) + defaulters.
- `/madrassa/exams` + `$id` + `$id/marks` + `$id/results` + `/exams/board` (§41.5) — Sah Mahi / Nisfus Sana / Salanah + Wifaqi Salanah / Zimni; Wifaq Roll & Ilhaq numbers; Madrassa Result Card print (§51.2).
- `/madrassa/timetable` Dars schedule (§48).
- Promotion/Demotion dialog (§30.1, darja-aware §41.8); Exit dialog (§30.2); Hifz Completion Ceremony (§50.2).

## Phase F — School module

- `/school/students` + `$id` profile (§13.1, §23) with Exams tab replacing History.
- `/school/classes` manager (§42.4) with sections, Science/Arts group assign.
- `/school/attendance`, `/school/fees` (§31.1).
- `/school/exams` + `$id` + `seating` + `results` + `/exams/board` (§42.5) with Pakistani grading A1/A/B/C/D/E/F (§42.6).
- `/school/timetable` builder (§47).
- DMC print layout (§51.1).

## Phase G — Teachers, ID Cards, Salary

- `/teachers` list + `$id` profile with Pakistani fields (§53.1), attendance (§53.2), Salary tab + Salary Slip print (§53.3).
- `/id-cards` generator (§14.3, §52) — School ID & Madrassa ID print layouts.

## Phase H — Reports & print

- `/reports` hub + `/attendance`, `/category`, `/results`, `/monthly` (§32.1, §55.1), `/annual` (§32.2, §55.2).
- Print stylesheet (§28) for receipts, DMCs, ID cards, salary slips, result sheets.

## Phase I — Inventory & Finance

- `/inventory` with stock history sheet (§33.1), graduation gift distribution (§33.2).
- `/finance` dashboard, transaction dialogs (§34.1), summary cards, balance sheet (§34.3).

## Phase J — Global Dashboard

- `/dashboard` (§17.1) with KPI cards, charts (recharts using `--chart-*` tokens), recent activity, system-aware data.

## Phase K — Parents Portal

- `/parents` layout + dashboard (§18.2): fees (§54.1), attendance (§54.2), results (§54.3).

## Phase L — Public Website + CMS

- `/website` + `/about-madrassa`, `/about-school`, `/gallery`, `/notices`, `/contact`, `/apply` (§19).
- `/settings/website` CMS panel (§35.1) for announcements with website visibility flag.

## Phase M — Settings, Audit, final QA

- `/settings` hub, `/settings/academic-year` (§46.1), `/settings/holidays` (§46.2), `/settings/audit` (§56.1).
- Final pass: RTL verification (§38), accessibility checklist (§37), dark-mode visual check (§27), print preview for every printable surface, responsive breakpoints (§29), 11-state badge coverage, empty/error/skeleton on every async surface.

---

## Technical details

**Routing:** TanStack Router file-based, flat dot-separated naming. Layout routes: `_authenticated.tsx` (auth gate + AppShell), `_authenticated.madrassa.tsx`, `_authenticated.school.tsx`, `_authenticated.reports.tsx`, `_authenticated.settings.tsx`, `_authenticated.admission.tsx`, plus `website.tsx` and `parents.tsx`. Each layout renders `<Outlet />`. Every leaf route gets a `head()` with route-specific meta.

**State/data:** TanStack Query against in-memory mock modules wrapped in `queryOptions` factories per domain (e.g. `madrassa/queries.ts`). Loader pattern: `loader: ({ context }) => context.queryClient.ensureQueryData(...)` + `useSuspenseQuery` in component. No `useEffect` + fetch.

**Forms:** `@tanstack/react-form` + `zod` schemas in `features/*/schemas`.

**Types:** `src/types/{student,teacher,exam,fee,attendance,application,inventory,finance,user,announcement,audit,timetable,holiday,academic-year}.ts`. Use `type` (not `interface`) per brief.

**Money:** all amounts as integer paisa; `formatPKR(paisa)` is the single render path. Forms accept rupees and convert on submit.

**Bilingual:** every label uses `<BilingualLabel urdu="..." english="..." />`; Urdu strings carry `dir="rtl" lang="ur"` and `font-urdu`. Status badges render Urdu primary + English subtitle.

**Print:** `@media print` rules per §28; printable surfaces use `print-page` wrapper; A4 portrait for DMC/Result Card/Salary Slip, CR80 for ID cards.

**Charts:** recharts using `--chart-1..5` tokens; never raw colors.

**File count estimate:** ~60 route files, ~70 feature components, 12 mock files, 14 type files, 6 shared components, 4 hooks, 3 lib files.

---

## Out of scope (frontend brief only)

No backend, no Supabase, no auth provider, no real API calls. Mocks only. Component shape is stable so a future swap to TanStack Query against a real API requires no structural change.

---

## Delivery cadence

I will land phases sequentially, ending each phase with a short summary of what's clickable and what's still placeholder, so you can spot-check before the next phase begins. Phase A lands first.
