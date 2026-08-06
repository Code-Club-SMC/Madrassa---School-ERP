import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Plus, Users2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/madrassa/classes")({
  component: ClassesPage,
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
  enrollmentCount: number;
  qasmiaCount: number;
  zainabCount: number;
};

type MadrassaCategory = {
  id: string;
  name: string;
  nameUrdu: string;
  subcategories: MadrassaSubcategory[];
  enrollmentCount: number;
};

const emptyForm = { urdu: "", english: "", darja: "", durationYears: "", rollPrefix: "" };

function ClassesPage() {
  const [category, setCategory] = useState<MadrassaCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(emptyForm);

  const loadDarajat = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/academic/madrassa/categories", { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load Dars-e-Nizami darjat");
      const categories = (payload.categories ?? []) as MadrassaCategory[];
      setCategory(
        categories.find((item) => item.id === "dars_nizami") ??
          categories.find((item) => item.name.toLowerCase().includes("dars")) ??
          null,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Dars-e-Nizami darjat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDarajat();
  }, [loadDarajat]);

  const darajat = category?.subcategories ?? [];
  const total = useMemo(
    () => darajat.reduce((sum, item) => sum + item.enrollmentCount, 0),
    [darajat],
  );

  const addDarja = async () => {
    if (!category) return;
    if (!f.urdu.trim() && !f.english.trim()) {
      toast.error("Name required · نام درکار ہے");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(
        `/api/academic/madrassa/categories/${category.id}/subcategories`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: f.english.trim() || f.urdu.trim(),
            nameUrdu: f.urdu.trim() || f.english.trim(),
            rollPrefix: f.rollPrefix.trim() || undefined,
            darja: f.darja.trim() || null,
            durationYears: f.durationYears ? Number(f.durationYears) : null,
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not add darja");
      await loadDarajat();
      toast.success("Darja added");
      setF(emptyForm);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add darja");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Dars-e-Nizami Darjat"
        titleUrdu="درس نظامی کے درجات"
        description="Shared Dars-e-Nizami catalog for Jamia Qasmia boys and Jamia Zainab girls. Enrollment counts are read from active students."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)} disabled={!category}>
            <Plus className="h-4 w-4" />
            Add Darja
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Darjat · درجات</p>
          <p className="font-heading text-2xl font-bold mt-1">{darajat.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active Students · طلبہ</p>
          <p className="font-heading text-2xl font-bold mt-1">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Category · زمرہ</p>
          <p className="font-heading text-lg font-bold mt-1 truncate">
            {category?.name ?? "Dars-e-Nizami"}
          </p>
        </Card>
      </div>

      {loading && <Card className="p-5 text-sm text-muted-foreground">Loading darjat...</Card>}
      {!loading && !category && (
        <Card className="p-5 text-sm text-muted-foreground">
          Dars-e-Nizami category is not configured.
        </Card>
      )}
      {!loading && category && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {darajat.map((d) => (
            <Card key={d.id} className="p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {d.rollPrefix}
                </Badge>
              </div>
              <p className="font-urdu text-xl font-semibold">{d.nameUrdu}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
                {d.name}
              </p>
              <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  {d.govtEquivalent ?? d.darja ?? "Dars-e-Nizami"}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-foreground">
                  <Users2 className="h-3 w-3" />
                  {d.enrollmentCount}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-[11px]">
                  Qasmia {d.qasmiaCount}
                </Badge>
                <Badge variant="secondary" className="text-[11px]">
                  Zainab {d.zainabCount}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ResponsiveDialog
        title="نیا درجہ"
        description="Add Darja"
        open={open}
        onOpenChange={setOpen}
        icon={BookOpen}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="درجہ کا نام" english="Name (Urdu)" required>
              <Input
                dir="rtl"
                className="font-urdu text-base"
                value={f.urdu}
                onChange={(e) => setF({ ...f, urdu: e.target.value })}
                placeholder="درجہ تاسعہ"
              />
            </BilingualLabel>
            <BilingualLabel urdu="انگریزی" english="English Name">
              <Input
                value={f.english}
                onChange={(e) => setF({ ...f, english: e.target.value })}
                placeholder="Taasia"
              />
            </BilingualLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BilingualLabel urdu="رول سابقہ" english="Roll Prefix">
              <Input
                value={f.rollPrefix}
                onChange={(e) => setF({ ...f, rollPrefix: e.target.value })}
                placeholder="DN9"
              />
            </BilingualLabel>
            <BilingualLabel urdu="نظامی درجہ" english="Darja Code">
              <Input
                value={f.darja}
                onChange={(e) => setF({ ...f, darja: e.target.value })}
                placeholder="taasia"
              />
            </BilingualLabel>
          </div>
          <BilingualLabel urdu="مدت" english="Duration Years">
            <Input
              type="number"
              min={1}
              value={f.durationYears}
              onChange={(e) => setF({ ...f, durationYears: e.target.value })}
              placeholder="1"
            />
          </BilingualLabel>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={addDarja} disabled={pending || !category}>
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
