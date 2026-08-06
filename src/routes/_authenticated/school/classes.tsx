import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
  Edit2,
  GraduationCap,
  Plus,
  Power,
  PowerOff,
  Users2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/school/classes")({
  component: ClassesPage,
});

type ClassLevel = "pre_primary" | "primary" | "middle" | "secondary" | "higher_secondary";

type SchoolSection = {
  id: string;
  classId: string;
  name: string;
  group: "science" | "arts" | "commerce" | null;
  active: boolean;
  enrollmentCount: number;
};

type Klass = {
  id: string;
  name: string;
  nameUrdu: string;
  level: ClassLevel;
  govtEquivalent: string | null;
  active: boolean;
  enrollmentCount: number;
  sections: SchoolSection[];
};

const LEVEL_TONE: Record<ClassLevel, string> = {
  pre_primary: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
  primary: "bg-chart-1/15 text-chart-5 dark:text-chart-1 border-chart-2/30",
  middle: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  secondary: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  higher_secondary:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

const emptyClassForm = {
  name: "",
  nameUrdu: "",
  level: "primary" as ClassLevel,
  govtEquivalent: "",
};
const emptySectionForm = { name: "", group: "" as "" | "science" | "arts" | "commerce" };

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

function ClassesPage() {
  const [classes, setClasses] = useState<Klass[]>([]);
  const [selected, setSelected] = useState<Klass | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [cf, setCf] = useState(emptyClassForm);
  const [sf, setSf] = useState(emptySectionForm);
  const [editingClass, setEditingClass] = useState<Klass | null>(null);
  const [editingSection, setEditingSection] = useState<SchoolSection | null>(null);
  const [editClassForm, setEditClassForm] = useState(emptyClassForm);
  const [editSectionForm, setEditSectionForm] = useState(emptySectionForm);
  const [confirmAction, setConfirmAction] = useState<SchoolConfirmAction | null>(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/academic/school/classes", { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load classes");
      const next = (payload.classes ?? []) as Klass[];
      setClasses(next);
      setSelected((current) => next.find((item) => item.id === current?.id) ?? next[0] ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const totals = useMemo(
    () => ({
      classes: classes.length,
      sections: classes.reduce((sum, item) => sum + item.sections.length, 0),
      students: classes.reduce((sum, item) => sum + item.enrollmentCount, 0),
    }),
    [classes],
  );

  const addClass = async () => {
    if (!cf.name.trim() && !cf.nameUrdu.trim()) {
      toast.error("Name required · نام درکار ہے");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/academic/school/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: cf.name.trim() || cf.nameUrdu.trim(),
          nameUrdu: cf.nameUrdu.trim() || cf.name.trim(),
          level: cf.level,
          govtEquivalent: cf.govtEquivalent.trim() || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not add class");
      await loadClasses();
      toast.success("Class added");
      setCf(emptyClassForm);
      setClassOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add class");
    } finally {
      setPending(false);
    }
  };

  const addSection = async () => {
    if (!selected) return;
    if (!sf.name.trim()) {
      toast.error("Section name required");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/academic/school/classes/${selected.id}/sections`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: sf.name.trim(),
          group: sf.group || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not add section");
      await loadClasses();
      toast.success("Section added");
      setSf(emptySectionForm);
      setSectionOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add section");
    } finally {
      setPending(false);
    }
  };

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
    if (!editingSection) return;
    if (!editSectionForm.name.trim()) {
      toast.error("Section name required");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(
        `/api/academic/school/classes/${editingSection.classId}/sections/${editingSection.id}`,
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

  const confirmTitle = confirmAction?.nextActive
    ? "Reactivate setup record?"
    : "Deactivate setup record?";
  const confirmDescription = confirmAction?.nextActive
    ? "This record will become available again for new admissions and enrollment moves."
    : "This record will stop being used for new admissions or enrollment moves. Existing student history will remain unchanged.";
  const editingSectionClass = editingSection
    ? (classes.find((item) => item.id === editingSection.classId) ?? selected)
    : null;

  return (
    <div>
      <PageHeader
        title="Class & Section Manager"
        titleUrdu="جماعتیں و سیکشن"
        description="Al-Qasim Academy class structure. Student counts come from accepted admissions and active enrollments."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setClassOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Classes · جماعتیں</p>
          <p className="font-heading text-2xl font-bold mt-1">{totals.classes}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Sections · سیکشن</p>
          <p className="font-heading text-2xl font-bold mt-1">{totals.sections}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active Students · طلبہ</p>
          <p className="font-heading text-2xl font-bold mt-1">{totals.students}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card className="p-2 max-h-[70vh] overflow-y-auto">
          {loading && <p className="p-4 text-sm text-muted-foreground">Loading classes...</p>}
          {!loading && classes.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No classes configured.</p>
          )}
          {classes.map((c) => {
            const active = c.id === selected?.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "w-full text-start flex items-center gap-3 rounded-lg p-2.5 transition-colors",
                  active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60",
                )}
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border",
                    LEVEL_TONE[c.level],
                  )}
                >
                  {classPrefix(c)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-urdu text-sm leading-tight truncate">{c.nameUrdu}</p>
                    {!c.active && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{c.name}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{c.enrollmentCount}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            );
          })}
        </Card>

        {selected ? (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <p className="font-urdu text-2xl font-semibold">{selected.nameUrdu}</p>
                  <p className="text-sm text-muted-foreground">{selected.name}</p>
                </div>
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
                    onClick={() =>
                      setConfirmAction({
                        kind: "class",
                        item: selected,
                        nextActive: !selected.active,
                      })
                    }
                  >
                    {selected.active ? (
                      <PowerOff className="h-3.5 w-3.5" />
                    ) : (
                      <Power className="h-3.5 w-3.5" />
                    )}
                    {selected.active ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Sections</p>
                  <p className="text-2xl font-bold font-mono mt-1">{selected.sections.length}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Equivalent
                  </p>
                  <p className="text-lg font-bold font-mono mt-1 truncate">
                    {selected.govtEquivalent ?? classPrefix(selected)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Students</p>
                  <p className="text-2xl font-bold font-mono mt-1">{selected.enrollmentCount}</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-primary" />
                  Sections
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setSectionOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </Button>
              </div>
              <div className="space-y-2">
                {selected.sections.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3 hover:bg-muted/40 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {s.name}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Section {s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{s.enrollmentCount}</span> active students
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {s.group && <Badge variant="outline">{groupLabel(s.group)}</Badge>}
                      {!s.active && <Badge variant="secondary">Inactive</Badge>}
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
                          setConfirmAction({
                            kind: "section",
                            classItem: selected,
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
                {selected.sections.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No sections configured for this class.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Subjects · مضامین
                </h3>
                <Button size="sm" variant="outline" className="gap-1.5" asChild>
                  <a href="/school/subjects">
                    <Plus className="h-3.5 w-3.5" />
                    Manage Subjects
                  </a>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subjectsForLevel(selected.level).map((s) => (
                  <div
                    key={s.en}
                    className="flex items-center justify-between rounded-md border border-border p-2.5"
                  >
                    <div>
                      <p className="font-urdu text-sm">{s.ur}</p>
                      <p className="text-[11px] text-muted-foreground">{s.en}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{s.marks}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Select a class to manage its sections.
          </Card>
        )}
      </div>

      <ResponsiveDialog
        title="نئی جماعت"
        description="Add Class"
        open={classOpen}
        onOpenChange={setClassOpen}
        icon={GraduationCap}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="جماعت کا نام" english="Name (Urdu)" required>
              <Input
                dir="rtl"
                className="font-urdu text-base"
                value={cf.nameUrdu}
                onChange={(e) => setCf({ ...cf, nameUrdu: e.target.value })}
                placeholder="گیارہویں جماعت"
              />
            </BilingualLabel>
            <BilingualLabel urdu="انگریزی نام" english="English Name">
              <Input
                value={cf.name}
                onChange={(e) => setCf({ ...cf, name: e.target.value })}
                placeholder="Grade 11"
              />
            </BilingualLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="سطح" english="Level">
              <Select
                value={cf.level}
                onValueChange={(v) => setCf({ ...cf, level: v as ClassLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_primary">Pre-Primary</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="higher_secondary">Higher Secondary</SelectItem>
                </SelectContent>
              </Select>
            </BilingualLabel>
            <BilingualLabel urdu="حکومتی مساوات" english="Govt Equivalent">
              <Input
                value={cf.govtEquivalent}
                onChange={(e) => setCf({ ...cf, govtEquivalent: e.target.value })}
                placeholder="Class 11"
              />
            </BilingualLabel>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setClassOpen(false)}>
            Cancel
          </Button>
          <Button onClick={addClass} disabled={pending}>
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title={`نیا سیکشن${selected ? ` — ${selected.nameUrdu}` : ""}`}
        description="Add Section"
        open={sectionOpen}
        onOpenChange={setSectionOpen}
        icon={Users2}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <BilingualLabel urdu="سیکشن کا نام" english="Section Name" required>
            <Input
              value={sf.name}
              onChange={(e) => setSf({ ...sf, name: e.target.value })}
              placeholder="C"
            />
          </BilingualLabel>
          {selected && ["secondary", "higher_secondary"].includes(selected.level) && (
            <BilingualLabel urdu="گروپ" english="Group">
              <Select
                value={sf.group || "none"}
                onValueChange={(v) =>
                  setSf({
                    ...sf,
                    group: v === "none" ? "" : (v as "science" | "arts" | "commerce"),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None · کوئی نہیں</SelectItem>
                  <SelectItem value="science">Science · سائنس</SelectItem>
                  <SelectItem value="arts">Arts · آرٹس</SelectItem>
                  <SelectItem value="commerce">Commerce · کامرس</SelectItem>
                </SelectContent>
              </Select>
            </BilingualLabel>
          )}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setSectionOpen(false)}>
            Cancel
          </Button>
          <Button onClick={addSection} disabled={pending}>
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title="جماعت میں ترمیم"
        description="Edit Class"
        open={editingClass !== null}
        onOpenChange={(open) => !open && setEditingClass(null)}
        icon={GraduationCap}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="جماعت کا نام" english="Name (Urdu)" required>
              <Input
                dir="rtl"
                className="font-urdu text-base"
                value={editClassForm.nameUrdu}
                onChange={(e) =>
                  setEditClassForm({ ...editClassForm, nameUrdu: e.target.value })
                }
                placeholder="گیارہویں جماعت"
              />
            </BilingualLabel>
            <BilingualLabel urdu="انگریزی نام" english="English Name">
              <Input
                value={editClassForm.name}
                onChange={(e) => setEditClassForm({ ...editClassForm, name: e.target.value })}
                placeholder="Grade 11"
              />
            </BilingualLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="سطح" english="Level">
              <Select
                value={editClassForm.level}
                onValueChange={(v) =>
                  setEditClassForm({ ...editClassForm, level: v as ClassLevel })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_primary">Pre-Primary</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="higher_secondary">Higher Secondary</SelectItem>
                </SelectContent>
              </Select>
            </BilingualLabel>
            <BilingualLabel urdu="حکومتی مساوات" english="Govt Equivalent">
              <Input
                value={editClassForm.govtEquivalent}
                onChange={(e) =>
                  setEditClassForm({ ...editClassForm, govtEquivalent: e.target.value })
                }
                placeholder="Class 11"
              />
            </BilingualLabel>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setEditingClass(null)}>
            Cancel
          </Button>
          <Button onClick={updateClass} disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title={`سیکشن میں ترمیم${editingSectionClass ? ` — ${editingSectionClass.nameUrdu}` : ""}`}
        description="Edit Section"
        open={editingSection !== null}
        onOpenChange={(open) => !open && setEditingSection(null)}
        icon={Users2}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <BilingualLabel urdu="سیکشن کا نام" english="Section Name" required>
            <Input
              value={editSectionForm.name}
              onChange={(e) =>
                setEditSectionForm({ ...editSectionForm, name: e.target.value })
              }
              placeholder="C"
            />
          </BilingualLabel>
          {editingSectionClass && ["secondary", "higher_secondary"].includes(editingSectionClass.level) && (
            <BilingualLabel urdu="گروپ" english="Group">
              <Select
                value={editSectionForm.group || "none"}
                onValueChange={(v) =>
                  setEditSectionForm({
                    ...editSectionForm,
                    group: v === "none" ? "" : (v as "science" | "arts" | "commerce"),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None · کوئی نہیں</SelectItem>
                  <SelectItem value="science">Science · سائنس</SelectItem>
                  <SelectItem value="arts">Arts · آرٹس</SelectItem>
                  <SelectItem value="commerce">Commerce · کامرس</SelectItem>
                </SelectContent>
              </Select>
            </BilingualLabel>
          )}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setEditingSection(null)}>
            Cancel
          </Button>
          <Button onClick={updateSection} disabled={pending}>
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

function classPrefix(item: Klass) {
  const number = item.name.match(/\d+/)?.[0];
  if (number) return `G${number}`;
  return item.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function groupLabel(group: NonNullable<SchoolSection["group"]>) {
  if (group === "science") return "Science · سائنس";
  if (group === "commerce") return "Commerce · کامرس";
  return "Arts · آرٹس";
}

function subjectsForLevel(level: ClassLevel) {
  const base = [
    { ur: "اردو", en: "Urdu", marks: 100 },
    { ur: "انگریزی", en: "English", marks: 100 },
    { ur: "ریاضی", en: "Mathematics", marks: 100 },
    { ur: "اسلامیات", en: "Islamiyat", marks: 50 },
    { ur: "ناظرہ قرآن", en: "Nazira Quran", marks: 50 },
  ];
  if (level === "primary") return [...base, { ur: "سائنس", en: "General Science", marks: 75 }];
  if (level === "middle")
    return [
      ...base,
      { ur: "عمومی سائنس", en: "General Science", marks: 75 },
      { ur: "معاشرتی علوم", en: "Social Studies", marks: 75 },
    ];
  if (level === "secondary" || level === "higher_secondary") {
    return [
      ...base,
      { ur: "طبیعیات", en: "Physics", marks: 75 },
      { ur: "کیمیا", en: "Chemistry", marks: 75 },
      { ur: "حیاتیات", en: "Biology", marks: 75 },
    ];
  }
  return base.slice(0, 4);
}
