import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Edit2, Hash, Plus, Power, PowerOff, Users2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/madrassa/categories")({
  component: CategoriesPage,
});

type MadrassaSubcategory = {
  id: string;
  categoryId: string;
  name: string;
  nameUrdu: string;
  rollPrefix: string;
  darja: string | null;
  govtEquivalent: string | null;
  durationYears: number | null;
  active: boolean;
  enrollmentCount: number;
  qasmiaCount: number;
  zainabCount: number;
};

type MadrassaCategory = {
  id: string;
  name: string;
  nameUrdu: string;
  description: string | null;
  descriptionUrdu: string | null;
  active: boolean;
  subcategories: MadrassaSubcategory[];
  enrollmentCount: number;
  qasmiaCount: number;
  zainabCount: number;
};

const emptyCatForm = { name: "", nameUrdu: "" };
const emptyDarjaForm = { name: "", nameUrdu: "", rollPrefix: "", darja: "", durationYears: "" };

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

function CategoriesPage() {
  const [cats, setCats] = useState<MadrassaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [addCat, setAddCat] = useState(false);
  const [addDarja, setAddDarja] = useState<string | null>(null);
  const [catForm, setCatForm] = useState(emptyCatForm);
  const [darjaForm, setDarjaForm] = useState(emptyDarjaForm);
  const [editingCat, setEditingCat] = useState<MadrassaCategory | null>(null);
  const [editingDarja, setEditingDarja] = useState<{
    category: MadrassaCategory;
    subcategory: MadrassaSubcategory;
  } | null>(null);
  const [editCatForm, setEditCatForm] = useState(emptyCatForm);
  const [editDarjaForm, setEditDarjaForm] = useState(emptyDarjaForm);
  const [confirmAction, setConfirmAction] = useState<MadrassaConfirmAction | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/academic/madrassa/categories", { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load madrassa categories");
      setCats((payload.categories ?? []) as MadrassaCategory[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load madrassa categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const totals = useMemo(
    () => ({
      categories: cats.length,
      subcategories: cats.reduce((sum, item) => sum + item.subcategories.length, 0),
      students: cats.reduce((sum, item) => sum + item.enrollmentCount, 0),
    }),
    [cats],
  );

  const createCategory = async () => {
    if (!catForm.nameUrdu.trim() && !catForm.name.trim()) {
      toast.error("Name required · نام درکار ہے");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/academic/madrassa/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: catForm.name.trim() || catForm.nameUrdu.trim(),
          nameUrdu: catForm.nameUrdu.trim() || catForm.name.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not add category");
      await loadCategories();
      toast.success("Category added");
      setCatForm(emptyCatForm);
      setAddCat(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add category");
    } finally {
      setPending(false);
    }
  };

  const createSubcategory = async () => {
    if (!addDarja || (!darjaForm.name.trim() && !darjaForm.nameUrdu.trim())) {
      toast.error("Name required · نام درکار ہے");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/academic/madrassa/categories/${addDarja}/subcategories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: darjaForm.name.trim() || darjaForm.nameUrdu.trim(),
          nameUrdu: darjaForm.nameUrdu.trim() || darjaForm.name.trim(),
          rollPrefix: darjaForm.rollPrefix.trim() || undefined,
          darja: darjaForm.darja.trim() || null,
          durationYears: darjaForm.durationYears ? Number(darjaForm.durationYears) : null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not add darja");
      await loadCategories();
      toast.success("Darja added");
      setDarjaForm(emptyDarjaForm);
      setAddDarja(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add darja");
    } finally {
      setPending(false);
    }
  };

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

  const confirmTitle = confirmAction?.nextActive
    ? "Reactivate setup record?"
    : "Deactivate setup record?";
  const confirmDescription = confirmAction?.nextActive
    ? "This record will become available again for new admissions and enrollment moves."
    : "This record will stop being used for new admissions or enrollment moves. Existing student history will remain unchanged.";

  return (
    <div>
      <PageHeader
        title="Madrassa Categories"
        titleUrdu="مدرسہ کے درجات"
        description="Jamia Qasmia and Jamia Zainab shared madrassa structure. Student counts come from active enrollments."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setAddCat(true)}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Categories · کل درجات</p>
          <p className="font-heading text-2xl font-bold mt-1">{totals.categories}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Sub-categories · ذیلی</p>
          <p className="font-heading text-2xl font-bold mt-1">{totals.subcategories}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Madrassa Students · طلبہ</p>
          <p className="font-heading text-2xl font-bold mt-1">{totals.students}</p>
        </Card>
      </div>

      <div className="space-y-4">
        {loading && (
          <Card className="p-5 text-sm text-muted-foreground">Loading categories...</Card>
        )}
        {!loading && cats.length === 0 && (
          <Card className="p-5 text-sm text-muted-foreground">
            No madrassa categories configured.
          </Card>
        )}
        {cats.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="flex flex-col gap-3 p-4 bg-muted/30 border-b border-border sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-urdu text-xl font-semibold">{c.nameUrdu}</h3>
                <p className="text-xs text-muted-foreground tracking-wide uppercase">{c.name}</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {!c.active && <Badge variant="secondary">Inactive</Badge>}
                <Badge variant="outline" className="gap-1.5">
                  <Users2 className="h-3 w-3" />
                  <span>
                    {c.enrollmentCount} <span className="font-urdu">طلبہ</span>
                  </span>
                </Badge>
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
                  onClick={() =>
                    setConfirmAction({ kind: "category", item: c, nextActive: !c.active })
                  }
                >
                  {c.active ? (
                    <PowerOff className="h-3.5 w-3.5" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}
                  {c.active ? "Deactivate" : "Reactivate"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7"
                  onClick={() => setAddDarja(c.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Darja
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {c.subcategories.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 px-4 py-3 hover:bg-accent/30 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    <div className="min-w-0">
                      <p className="font-urdu text-base">{s.nameUrdu}</p>
                      <p className="text-xs text-muted-foreground">{s.name}</p>
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded inline-flex items-center gap-1 text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      {s.rollPrefix}
                    </span>
                    <Badge variant="secondary" className="text-[11px]">
                      Qasmia {s.qasmiaCount}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      Zainab {s.zainabCount}
                    </Badge>
                    {!s.active && <Badge variant="secondary">Inactive</Badge>}
                    <span className="font-mono text-sm tabular-nums w-10 text-end">
                      {s.enrollmentCount}
                    </span>
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
                        setConfirmAction({
                          kind: "subcategory",
                          category: c,
                          item: s,
                          nextActive: !s.active,
                        })
                      }
                    >
                      {s.active ? (
                        <PowerOff className="h-3.5 w-3.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                      {s.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </div>
              ))}
              {c.subcategories.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No sub-categories configured.
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <ResponsiveDialog
        title="نیا زمرہ"
        description="Add Category"
        open={addCat}
        onOpenChange={setAddCat}
        icon={Hash}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <BilingualLabel urdu="زمرہ کا نام" english="Category Name (Urdu)" required>
            <Input
              dir="rtl"
              className="font-urdu text-base"
              value={catForm.nameUrdu}
              onChange={(e) => setCatForm({ ...catForm, nameUrdu: e.target.value })}
              placeholder="مثال: تحفیظ"
            />
          </BilingualLabel>
          <BilingualLabel urdu="انگریزی نام" english="English Name" required>
            <Input
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="e.g. Tahfeez"
            />
          </BilingualLabel>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setAddCat(false)}>
            Cancel
          </Button>
          <Button onClick={createCategory} disabled={pending}>
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title="نیا ذیلی درجہ"
        description="Add Darja"
        open={!!addDarja}
        onOpenChange={(open) => !open && setAddDarja(null)}
        icon={Users2}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <BilingualLabel urdu="بنیادی زمرہ" english="Parent Category">
            <Select value={addDarja ?? ""} onValueChange={(v) => setAddDarja(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </BilingualLabel>
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="درجہ کا نام" english="Name (Urdu)" required>
              <Input
                dir="rtl"
                className="font-urdu text-base"
                value={darjaForm.nameUrdu}
                onChange={(e) => setDarjaForm({ ...darjaForm, nameUrdu: e.target.value })}
                placeholder="مثال: درجہ اولیٰ"
              />
            </BilingualLabel>
            <BilingualLabel urdu="انگریزی" english="English">
              <Input
                value={darjaForm.name}
                onChange={(e) => setDarjaForm({ ...darjaForm, name: e.target.value })}
                placeholder="Aamma"
              />
            </BilingualLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="رول نمبر سابقہ" english="Roll Prefix">
              <Input
                value={darjaForm.rollPrefix}
                onChange={(e) => setDarjaForm({ ...darjaForm, rollPrefix: e.target.value })}
                placeholder="HF"
              />
            </BilingualLabel>
            <BilingualLabel urdu="نظامی درجہ" english="Darja Code">
              <Input
                value={darjaForm.darja}
                onChange={(e) => setDarjaForm({ ...darjaForm, darja: e.target.value })}
                placeholder="Year 1"
              />
            </BilingualLabel>
          </div>
          <BilingualLabel urdu="مدت" english="Duration Years">
            <Input
              type="number"
              min={1}
              value={darjaForm.durationYears}
              onChange={(e) => setDarjaForm({ ...darjaForm, durationYears: e.target.value })}
              placeholder="1"
            />
          </BilingualLabel>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setAddDarja(null)}>
            Cancel
          </Button>
          <Button onClick={createSubcategory} disabled={pending}>
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title="زمرہ میں ترمیم"
        description="Edit Category"
        open={!!editingCat}
        onOpenChange={(open) => !open && setEditingCat(null)}
        icon={Hash}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <BilingualLabel urdu="زمرہ کا نام" english="Category Name (Urdu)" required>
            <Input
              dir="rtl"
              className="font-urdu text-base"
              value={editCatForm.nameUrdu}
              onChange={(e) => setEditCatForm({ ...editCatForm, nameUrdu: e.target.value })}
              placeholder="مثال: تحفیظ"
            />
          </BilingualLabel>
          <BilingualLabel urdu="انگریزی نام" english="English Name" required>
            <Input
              value={editCatForm.name}
              onChange={(e) => setEditCatForm({ ...editCatForm, name: e.target.value })}
              placeholder="e.g. Tahfeez"
            />
          </BilingualLabel>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setEditingCat(null)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={updateCategory} disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title="ذیلی درجہ میں ترمیم"
        description="Edit Darja"
        open={!!editingDarja}
        onOpenChange={(open) => !open && setEditingDarja(null)}
        icon={Users2}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="درجہ کا نام" english="Name (Urdu)" required>
              <Input
                dir="rtl"
                className="font-urdu text-base"
                value={editDarjaForm.nameUrdu}
                onChange={(e) =>
                  setEditDarjaForm({ ...editDarjaForm, nameUrdu: e.target.value })
                }
                placeholder="مثال: درجہ اولیٰ"
              />
            </BilingualLabel>
            <BilingualLabel urdu="انگریزی" english="English">
              <Input
                value={editDarjaForm.name}
                onChange={(e) => setEditDarjaForm({ ...editDarjaForm, name: e.target.value })}
                placeholder="Aamma"
              />
            </BilingualLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="رول نمبر سابقہ" english="Roll Prefix">
              <Input
                value={editDarjaForm.rollPrefix}
                onChange={(e) =>
                  setEditDarjaForm({ ...editDarjaForm, rollPrefix: e.target.value })
                }
                placeholder="HF"
              />
            </BilingualLabel>
            <BilingualLabel urdu="نظامی درجہ" english="Darja Code">
              <Input
                value={editDarjaForm.darja}
                onChange={(e) => setEditDarjaForm({ ...editDarjaForm, darja: e.target.value })}
                placeholder="Year 1"
              />
            </BilingualLabel>
          </div>
          <BilingualLabel urdu="مدت" english="Duration Years">
            <Input
              type="number"
              min={1}
              value={editDarjaForm.durationYears}
              onChange={(e) =>
                setEditDarjaForm({ ...editDarjaForm, durationYears: e.target.value })
              }
              placeholder="1"
            />
          </BilingualLabel>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setEditingDarja(null)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={updateSubcategory} disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </ResponsiveDialog>

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
    </div>
  );
}
