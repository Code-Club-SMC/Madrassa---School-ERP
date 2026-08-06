# Admission Print and Madrassa Grade Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build clean generated A4 admission prints with duplex madrassa Auhad-Nama pages and actual boys/girls madrassa grade catalogs.

**Architecture:** Add reusable grade/catalog data first, then replace the existing `src/lib/admission-print.ts` overlay renderer with generated print HTML. Keep scanned PDFs/images as references/assets, not generated front-page backgrounds. UI continues to call `printAdmissionForm`, but passes a merged print payload after save.

**Tech Stack:** TanStack Start, React 19, TypeScript 7, browser print HTML/CSS, Drizzle-backed admission/enrollment data.

## Global Constraints

- Do not start the dev server unless explicitly requested.
- Scanned admission forms are references only; generated print pages must be clean typed HTML.
- Auhad-Nama text must be typed Urdu HTML; unclear scan words must be isolated for human review instead of guessed silently.
- Print all typed form/backend fields, but leave signatures/stamps/manual approvals blank.
- Keep A4 portrait output and duplex-ready page ordering.
- Run `bun run lint` and `bun run build` before completion.

---

### Task 1: Madrassa Grade Catalog Foundation

**Files:**

- Create: `src/lib/madrassa-grade-catalog.ts`
- Modify: `src/mock/categories.ts`
- Modify: `src/lib/server/academic/seed.ts`
- Test: `src/lib/madrassa-grade-catalog.test.ts`

**Interfaces:**

- Produces `MadrassaSection = "baneen" | "banat"`.
- Produces `MadrassaGradeCatalogItem`.
- Produces `getMadrassaGradeCatalog(section)`.
- Produces `findMadrassaGrade(id)`.

- [x] Add boys/girls catalog entries from the handwritten sheet.
- [x] Include IDs, English labels, Urdu labels, roll prefixes, category, section, display order, and optional duration years.
- [x] Update `src/mock/categories.ts` to derive madrassa categories/subcategories from the catalog.
- [x] Update academic seeding to continue inserting the derived categories and subcategories.
- [x] Add tests that boys and girls catalogs differ and that IDs are unique.
- [x] Run `bun test src/lib/madrassa-grade-catalog.test.ts`.

### Task 2: Print Payload Merge

**Files:**

- Create: `src/lib/admission-print-payload.ts`
- Modify: `src/components/admission/pdf-form-renderer.tsx`
- Test: `src/lib/admission-print-payload.test.ts`

**Interfaces:**

- Produces `buildAdmissionPrintPayload(input)`.
- Consumes `variant`, current form state, optional uploaded photo, and save response.

- [x] Merge form state with backend response values.
- [x] Map `application.refNo` to `form_no`.
- [x] Map `student.admissionNo` to `adm_no`.
- [x] Map `student.rollNo` to `roll_no`.
- [x] Fill `adm_date` from the saved application timestamp when missing.
- [x] Preserve user-entered values when backend does not return a replacement.
- [x] Update post-save Print button to print merged values.
- [x] Run `bun test src/lib/admission-print-payload.test.ts`.

### Task 3: Generated Front Page Renderer

**Files:**

- Modify: `src/lib/admission-print.ts`

**Interfaces:**

- Produces `renderAdmissionPrintHtml(variant, payload)`.
- Keeps exported `printAdmissionForm(variant, form, institutionUrdu, options)`.

- [x] Keep the public API in `src/lib/admission-print.ts` and replace the legacy overlay internals there.
- [x] Generate A4 front pages with typed HTML, not image-backed template overlays.
- [x] Reference the existing Urdu font family in print CSS.
- [x] Render typed field lines for all visible admission inputs.
- [x] Leave signature/stamp/office approval lines blank.
- [x] Remove scanned fallback from the default print path.
- [x] Run `bun run lint`.

### Task 4: Typed Auhad-Nama Back Pages

**Files:**

- Modify: `src/lib/admission-print.ts`

**Interfaces:**

- Produces `renderAuhadNamaPage(section, payload)`.
- Produces `requiresAuhadNamaBackPage(variant)`.

- [x] Add boys Auhad-Nama typed page structure from `public/AuhadNama-Jamia-Qasmia.pdf`.
- [x] Add girls Auhad-Nama typed page structure from `public/Auhad-Nama-Jamia-Zanib-lil-Banat.pdf`.
- [x] Insert typed fields where the source page has dotted lines for student/guardian/class/date details.
- [x] Keep signature lines empty.
- [x] Mark unclear source text as `data-review="needs-urdu-review"` in the renderer so it can be found.
- [x] Verify through `bun run lint` and `bun run build`.

### Task 5: Admission UI Grade Selects

**Files:**

- Modify: `src/components/admission/pdf-form-renderer.tsx`
- Modify: `src/lib/server/admission/catalog.ts`

**Interfaces:**

- Consumes `getMadrassaGradeCatalog(section)`.
- Produces admission form grade selections that map to existing `madrassaSubcategoryId` and `darja`.

- [x] Replace madrassa free-text `shoba`/`req_darja` entry with select controls where possible.
- [x] Keep backend compatibility for legacy text resolution through catalog matching.
- [x] Ensure boys variants use `baneen` grades and girls variants use `banat` grades.
- [x] Ensure server target resolution accepts grade IDs from the catalog.
- [x] Run `bun run lint`.

### Task 6: Final Verification

**Files:**

- Review: `src/lib/admission-print.ts`
- Review: `src/components/admission/pdf-form-renderer.tsx`
- Review: `src/lib/madrassa-grade-catalog.ts`

**Interfaces:**

- Consumes all previous tasks.

- [x] Run `bun test src/lib/madrassa-grade-catalog.test.ts src/lib/admission-print-payload.test.ts`.
- [x] Run `bun run lint`.
- [x] Run `bun run build`.
- [x] Confirm no dev server was started.

## Self-Review

- Spec coverage: generated front pages, duplex Auhad-Nama pages, signature blanks, typed field printing, backend-value merge, and boys/girls grade catalogs are covered.
- Placeholder scan: no task relies on unspecified implementation names.
- Type consistency: catalog and print payload interfaces are defined before renderers and UI consume them.
