# Academic Setup Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production-ready edit and confirmed deactivate/reactivate actions for school and madrassa academic setup records.

**Architecture:** Keep the existing single-page setup screens and reuse the current `PATCH` API routes. Each page owns its own edit form state, active-state confirmation state, mutation helpers, and refresh behavior. No new database schema, server route, or global settings page is needed.

**Tech Stack:** TanStack Start file routes, React, TypeScript, shadcn/Radix UI, Sonner toasts, existing `ResponsiveDialog`, existing academic setup API routes.

## Global Constraints

- No hard delete support.
- No new academic setup schema changes.
- No new global academic settings page.
- No fees integration in this step.
- Use quick action buttons for deactivate/reactivate.
- Require confirmation dialogs for deactivate/reactivate actions.
- Keep inactive records visible with `Inactive` badges.
- Surface backend enrollment-protection errors without masking them.
- Do not start the dev server for this task.

---

## File Structure

- Modify `src/routes/_authenticated/school/classes.tsx`: add edit dialogs, quick active-state actions, confirmation dialog, and school class/section PATCH helpers.
- Modify `src/routes/_authenticated/madrassa/categories.tsx`: add edit dialogs, quick active-state actions, confirmation dialog, and madrassa category/subcategory PATCH helpers.
- Do not modify `src/lib/server/academic/service.ts`: update schemas and active-enrollment protections already exist.
- Do not modify `src/routes/api/academic/**`: PATCH handlers already exist.

---

### Task 1: School Class and Section Actions

**Files:**
- Modify: `src/routes/_authenticated/school/classes.tsx`

**Interfaces:**
- Consumes: `PATCH /api/academic/school/classes/:id` with body `{ name?, nameUrdu?, level?, govtEquivalent?, active? }`.
- Consumes: `PATCH /api/academic/school/classes/:id/sections/:sectionId` with body `{ name?, group?, active? }`.
- Produces: class edit UI, section edit UI, confirmed deactivate/reactivate buttons, and refreshed class data.

- [ ] **Step 1: Add imports for action UI**

In `src/routes/_authenticated/school/classes.tsx`, extend the icon and alert-dialog imports:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronRight, Edit2, GraduationCap, Plus, Power, PowerOff, Users2 } from "lucide-react";
```

Keep the existing imports that are still used.

- [ ] **Step 2: Add edit and confirmation state types**

Add these types and empty forms near the existing form constants:

```tsx
type ClassForm = typeof emptyClassForm;
type SectionForm = typeof emptySectionForm;

type SchoolConfirmAction =
  | { kind: "class"; item: Klass; nextActive: boolean }
  | { kind: "section"; classItem: Klass; item: SchoolSection; nextActive: boolean };

const toClassForm = (item: Klass): ClassForm => ({
  name: item.name,
  nameUrdu: item.nameUrdu,
  level: item.level,
  govtEquivalent: item.govtEquivalent ?? "",
});

const toSectionForm = (item: SchoolSection): SectionForm => ({
  name: item.name,
  group: item.group ?? "",
});
```

Inside `ClassesPage`, add:

```tsx
const [editingClass, setEditingClass] = useState<Klass | null>(null);
const [editingSection, setEditingSection] = useState<SchoolSection | null>(null);
const [editClassForm, setEditClassForm] = useState(emptyClassForm);
const [editSectionForm, setEditSectionForm] = useState(emptySectionForm);
const [confirmAction, setConfirmAction] = useState<SchoolConfirmAction | null>(null);
```

- [ ] **Step 3: Add mutation helpers**

Add these functions inside `ClassesPage`, after `addSection`:

```tsx
const updateClass = async () => {
  if (!editingClass) return;
  if (!editClassForm.name.trim() && !editClassForm.nameUrdu.trim()) {
    toast.error("Name required · نام درکار ہے");
    return;
  }

  setPending(true);
  try {
    const response = await fetch(`/api/academic/school/classes/${editingClass.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: editClassForm.name.trim() || editClassForm.nameUrdu.trim(),
        nameUrdu: editClassForm.nameUrdu.trim() || editClassForm.name.trim(),
        level: editClassForm.level,
        govtEquivalent: editClassForm.govtEquivalent.trim() || null,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not update class");
    await loadClasses();
    toast.success("Class updated");
    setEditingClass(null);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not update class");
  } finally {
    setPending(false);
  }
};

const updateSection = async () => {
  if (!selected || !editingSection) return;
  if (!editSectionForm.name.trim()) {
    toast.error("Section name required");
    return;
  }

  setPending(true);
  try {
    const response = await fetch(
      `/api/academic/school/classes/${selected.id}/sections/${editingSection.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editSectionForm.name.trim(),
          group: editSectionForm.group || null,
        }),
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not update section");
    await loadClasses();
    toast.success("Section updated");
    setEditingSection(null);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not update section");
  } finally {
    setPending(false);
  }
};

const applyActiveChange = async () => {
  if (!confirmAction) return;

  setPending(true);
  try {
    const endpoint =
      confirmAction.kind === "class"
        ? `/api/academic/school/classes/${confirmAction.item.id}`
        : `/api/academic/school/classes/${confirmAction.classItem.id}/sections/${confirmAction.item.id}`;
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: confirmAction.nextActive }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not update status");
    await loadClasses();
    toast.success(confirmAction.nextActive ? "Reactivated" : "Deactivated");
    setConfirmAction(null);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not update status");
  } finally {
    setPending(false);
  }
};
```

- [ ] **Step 4: Wire quick actions into the school UI**

For each class list row and selected class summary, show `Inactive` when `active` is false. Add class-level action buttons in the selected class card:

```tsx
<div className="flex flex-wrap items-center gap-2">
  {!selected.active && <Badge variant="secondary">Inactive</Badge>}
  <Badge variant="outline" className={cn("border", LEVEL_TONE[selected.level])}>
    {selected.level.replace("_", " ")}
  </Badge>
  <Button
    size="sm"
    variant="outline"
    className="gap-1.5"
    onClick={() => {
      setEditingClass(selected);
      setEditClassForm(toClassForm(selected));
    }}
  >
    <Edit2 className="h-3.5 w-3.5" />
    Edit
  </Button>
  <Button
    size="sm"
    variant={selected.active ? "destructive" : "outline"}
    className="gap-1.5"
    onClick={() => setConfirmAction({ kind: "class", item: selected, nextActive: !selected.active })}
  >
    {selected.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
    {selected.active ? "Deactivate" : "Reactivate"}
  </Button>
</div>
```

For each section row, add:

```tsx
<Button
  size="sm"
  variant="outline"
  className="gap-1.5"
  onClick={() => {
    setEditingSection(s);
    setEditSectionForm(toSectionForm(s));
  }}
>
  <Edit2 className="h-3.5 w-3.5" />
  Edit
</Button>
<Button
  size="sm"
  variant={s.active ? "destructive" : "outline"}
  className="gap-1.5"
  onClick={() =>
    setConfirmAction({ kind: "section", classItem: selected, item: s, nextActive: !s.active })
  }
>
  {s.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
  {s.active ? "Deactivate" : "Reactivate"}
</Button>
```

- [ ] **Step 5: Add edit dialogs and confirmation dialog**

Add a class edit `ResponsiveDialog`, a section edit `ResponsiveDialog`, and one `AlertDialog` near the existing add dialogs. The edit dialogs reuse the same fields as the create dialogs and call `updateClass` / `updateSection`.

The confirmation dialog must derive copy from `confirmAction`:

```tsx
const confirmTitle = confirmAction?.nextActive
  ? "Reactivate setup record?"
  : "Deactivate setup record?";
const confirmDescription = confirmAction?.nextActive
  ? "This record will become available again for new admissions and enrollment moves."
  : "This record will stop being used for new admissions or enrollment moves. Existing student history will remain unchanged.";
```

Render:

```tsx
<AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
      <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={applyActiveChange} disabled={pending}>
        {pending ? "Saving..." : confirmAction?.nextActive ? "Reactivate" : "Deactivate"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 6: Verify school page changes**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors from `src/routes/_authenticated/school/classes.tsx`.

---

### Task 2: Madrassa Category and Darja Actions

**Files:**
- Modify: `src/routes/_authenticated/madrassa/categories.tsx`

**Interfaces:**
- Consumes: `PATCH /api/academic/madrassa/categories/:id` with body `{ name?, nameUrdu?, description?, descriptionUrdu?, active? }`.
- Consumes: `PATCH /api/academic/madrassa/categories/:id/subcategories/:subcategoryId` with body `{ name?, nameUrdu?, rollPrefix?, darja?, govtEquivalent?, durationYears?, active? }`.
- Produces: category edit UI, darja edit UI, confirmed deactivate/reactivate buttons, and refreshed madrassa setup data.

- [ ] **Step 1: Add imports for action UI**

In `src/routes/_authenticated/madrassa/categories.tsx`, extend imports:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronRight, Edit2, Hash, Plus, Power, PowerOff, Users2 } from "lucide-react";
```

- [ ] **Step 2: Add edit and confirmation state types**

Add these types and helpers near form constants:

```tsx
type CategoryForm = typeof emptyCatForm;
type DarjaForm = typeof emptyDarjaForm;

type MadrassaConfirmAction =
  | { kind: "category"; item: MadrassaCategory; nextActive: boolean }
  | {
      kind: "subcategory";
      category: MadrassaCategory;
      item: MadrassaSubcategory;
      nextActive: boolean;
    };

const toCategoryForm = (item: MadrassaCategory): CategoryForm => ({
  name: item.name,
  nameUrdu: item.nameUrdu,
});

const toDarjaForm = (item: MadrassaSubcategory): DarjaForm => ({
  name: item.name,
  nameUrdu: item.nameUrdu,
  rollPrefix: item.rollPrefix,
  darja: item.darja ?? "",
  durationYears: item.durationYears ? String(item.durationYears) : "",
});
```

Inside `CategoriesPage`, add:

```tsx
const [editingCat, setEditingCat] = useState<MadrassaCategory | null>(null);
const [editingDarja, setEditingDarja] = useState<{
  category: MadrassaCategory;
  subcategory: MadrassaSubcategory;
} | null>(null);
const [editCatForm, setEditCatForm] = useState(emptyCatForm);
const [editDarjaForm, setEditDarjaForm] = useState(emptyDarjaForm);
const [confirmAction, setConfirmAction] = useState<MadrassaConfirmAction | null>(null);
```

- [ ] **Step 3: Add mutation helpers**

Add these functions inside `CategoriesPage`, after `createSubcategory`:

```tsx
const updateCategory = async () => {
  if (!editingCat) return;
  if (!editCatForm.nameUrdu.trim() && !editCatForm.name.trim()) {
    toast.error("Name required · نام درکار ہے");
    return;
  }

  setPending(true);
  try {
    const response = await fetch(`/api/academic/madrassa/categories/${editingCat.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: editCatForm.name.trim() || editCatForm.nameUrdu.trim(),
        nameUrdu: editCatForm.nameUrdu.trim() || editCatForm.name.trim(),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not update category");
    await loadCategories();
    toast.success("Category updated");
    setEditingCat(null);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not update category");
  } finally {
    setPending(false);
  }
};

const updateSubcategory = async () => {
  if (!editingDarja || (!editDarjaForm.name.trim() && !editDarjaForm.nameUrdu.trim())) {
    toast.error("Name required · نام درکار ہے");
    return;
  }

  setPending(true);
  try {
    const response = await fetch(
      `/api/academic/madrassa/categories/${editingDarja.category.id}/subcategories/${editingDarja.subcategory.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editDarjaForm.name.trim() || editDarjaForm.nameUrdu.trim(),
          nameUrdu: editDarjaForm.nameUrdu.trim() || editDarjaForm.name.trim(),
          rollPrefix: editDarjaForm.rollPrefix.trim() || undefined,
          darja: editDarjaForm.darja.trim() || null,
          durationYears: editDarjaForm.durationYears ? Number(editDarjaForm.durationYears) : null,
        }),
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not update darja");
    await loadCategories();
    toast.success("Darja updated");
    setEditingDarja(null);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not update darja");
  } finally {
    setPending(false);
  }
};

const applyActiveChange = async () => {
  if (!confirmAction) return;

  setPending(true);
  try {
    const endpoint =
      confirmAction.kind === "category"
        ? `/api/academic/madrassa/categories/${confirmAction.item.id}`
        : `/api/academic/madrassa/categories/${confirmAction.category.id}/subcategories/${confirmAction.item.id}`;
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: confirmAction.nextActive }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not update status");
    await loadCategories();
    toast.success(confirmAction.nextActive ? "Reactivated" : "Deactivated");
    setConfirmAction(null);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not update status");
  } finally {
    setPending(false);
  }
};
```

- [ ] **Step 4: Wire quick actions into the madrassa UI**

In each category header, add `Inactive`, `Edit`, and active-state buttons:

```tsx
{!c.active && <Badge variant="secondary">Inactive</Badge>}
<Button
  size="sm"
  variant="outline"
  className="gap-1.5 h-7"
  onClick={() => {
    setEditingCat(c);
    setEditCatForm(toCategoryForm(c));
  }}
>
  <Edit2 className="h-3.5 w-3.5" />
  Edit
</Button>
<Button
  size="sm"
  variant={c.active ? "destructive" : "outline"}
  className="gap-1.5 h-7"
  onClick={() => setConfirmAction({ kind: "category", item: c, nextActive: !c.active })}
>
  {c.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
  {c.active ? "Deactivate" : "Reactivate"}
</Button>
```

In each subcategory row, keep the count badges and add:

```tsx
{!s.active && <Badge variant="secondary">Inactive</Badge>}
<Button
  size="sm"
  variant="outline"
  className="gap-1.5 h-7"
  onClick={() => {
    setEditingDarja({ category: c, subcategory: s });
    setEditDarjaForm(toDarjaForm(s));
  }}
>
  <Edit2 className="h-3.5 w-3.5" />
  Edit
</Button>
<Button
  size="sm"
  variant={s.active ? "destructive" : "outline"}
  className="gap-1.5 h-7"
  onClick={() =>
    setConfirmAction({ kind: "subcategory", category: c, item: s, nextActive: !s.active })
  }
>
  {s.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
  {s.active ? "Deactivate" : "Reactivate"}
</Button>
```

- [ ] **Step 5: Add edit dialogs and confirmation dialog**

Add a category edit `ResponsiveDialog`, a darja edit `ResponsiveDialog`, and one `AlertDialog` near the existing add dialogs. The edit dialogs reuse the current create fields and call `updateCategory` / `updateSubcategory`.

The confirmation copy must be:

```tsx
const confirmTitle = confirmAction?.nextActive
  ? "Reactivate setup record?"
  : "Deactivate setup record?";
const confirmDescription = confirmAction?.nextActive
  ? "This record will become available again for new admissions and enrollment moves."
  : "This record will stop being used for new admissions or enrollment moves. Existing student history will remain unchanged.";
```

Render:

```tsx
<AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
      <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={applyActiveChange} disabled={pending}>
        {pending ? "Saving..." : confirmAction?.nextActive ? "Reactivate" : "Deactivate"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 6: Verify madrassa page changes**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: no TypeScript errors from `src/routes/_authenticated/madrassa/categories.tsx`.

---

### Task 3: Final Verification and Cleanup

**Files:**
- Modify only files from Tasks 1 and 2 if verification reveals issues.

**Interfaces:**
- Consumes: completed school and madrassa UI mutations.
- Produces: verified build-ready implementation.

- [ ] **Step 1: Check formatting-sensitive diff**

Run:

```bash
git diff --check -- src/routes/_authenticated/school/classes.tsx src/routes/_authenticated/madrassa/categories.tsx
```

Expected: no whitespace errors.

- [ ] **Step 2: Run TypeScript**

Run:

```bash
bunx tsc --noEmit --pretty false
```

Expected: command exits successfully.

- [ ] **Step 3: Run lint**

Run:

```bash
bun run lint
```

Expected: command exits successfully.

- [ ] **Step 4: Run production build**

Run:

```bash
bun run build
```

Expected: command exits successfully. The existing Vite `vite-tsconfig-paths` warning may appear and is not part of this task.

- [ ] **Step 5: Review final diff**

Run:

```bash
git diff -- src/routes/_authenticated/school/classes.tsx src/routes/_authenticated/madrassa/categories.tsx
```

Expected: diff only contains edit dialogs, quick action buttons, confirmation dialog wiring, and PATCH mutation helpers for academic setup actions.
