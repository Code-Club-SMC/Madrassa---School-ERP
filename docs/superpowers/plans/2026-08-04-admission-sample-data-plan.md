# Admission Sample Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe “fill sample data” action to official admission forms.

**Architecture:** Keep generator logic outside UI in `src/lib/admission-sample-data.ts`. `PdfFormRenderer` calls generator with current `AdmissionVariant`, then merges only missing fields into current form state.

**Tech Stack:** TanStack Start, React, TypeScript, shadcn UI, existing admission variant and madrassa grade catalog modules.

## Global Constraints

- Sample fill must never submit the form.
- Sample fill must only fill empty fields; existing user-entered values stay unchanged.
- Gender must follow `variant.key`: boys variants use male data, girls variants use female data.
- Madrassa class/darja values must come from `madrassaGradesForSection()` and the existing client-provided grade catalog.
- Keep UI copy in Urdu.
- Do not start dev server.

---

### Task 1: Sample Data Helper

**Files:**

- Create: `src/lib/admission-sample-data.ts`

**Interfaces:**

- Consumes: `AdmissionVariant`, `madrassaGradesForSection`
- Produces: `buildAdmissionSampleData(variant: AdmissionVariant): Record<string, string>`

- [ ] **Step 1: Create helper**

```ts
import type { AdmissionVariant } from "@/lib/admission-variants";
import { madrassaGradesForSection, type MadrassaGradeKind } from "@/lib/madrassa-grade-catalog";

export function buildAdmissionSampleData(variant: AdmissionVariant): Record<string, string> {
  const isGirls = variant.key === "school-girls" || variant.key.startsWith("madrassa-girls");
  if (variant.layout === "school") return schoolSample(isGirls);
  if (variant.layout === "madrassa-short") return madrassaShortSample(variant, isGirls);
  return madrassaLongSample(variant, isGirls);
}
```

- [ ] **Step 2: Use catalog-backed grade picker**

```ts
function firstGradeId(variant: AdmissionVariant) {
  const section = variant.category === "madrassa-girls" ? "banat" : "baneen";
  const kinds: MadrassaGradeKind[] =
    variant.key === "madrassa-boys-hifz"
      ? ["hifz"]
      : variant.key === "madrassa-boys-nazira" || variant.key === "madrassa-girls-nazira"
        ? ["nazira"]
        : ["preparatory", "dars_nizami", "tajweed", "takhassus", "short_course"];

  return madrassaGradesForSection(section, kinds)[0]?.id ?? "";
}
```

- [ ] **Step 3: Verify**

Run: `bun run lint`

Expected: pass.

### Task 2: UI Action

**Files:**

- Modify: `src/components/admission/pdf-form-renderer.tsx`

**Interfaces:**

- Consumes: `buildAdmissionSampleData(variant)`
- Produces: button `نمونہ ڈیٹا بھریں`

- [ ] **Step 1: Import helper and icon**

```ts
import { Wand2 } from "lucide-react";
import { buildAdmissionSampleData } from "@/lib/admission-sample-data";
```

- [ ] **Step 2: Add merge function**

```ts
const fillSampleData = () => {
  const sample = buildAdmissionSampleData(variant);
  setForm((current) => ({ ...sample, ...current }));
  toast.success("خالی خانوں میں نمونہ ڈیٹا بھر دیا گیا");
};
```

- [ ] **Step 3: Add button near header actions**

```tsx
<Button type="button" variant="outline" onClick={fillSampleData}>
  <Wand2 className="h-4 w-4 me-2" />
  <span className="font-urdu">نمونہ ڈیٹا بھریں</span>
</Button>
```

- [ ] **Step 4: Verify**

Run: `bun run lint`
Run: `bun run build`

Expected: both pass.

## Self-Review

- Covers sample-fill action, gender safety, empty-field merge, catalog-backed madrassa class selection.
- No placeholders.
- Helper signature and UI import match.
