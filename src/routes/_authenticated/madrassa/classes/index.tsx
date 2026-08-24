import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { BookLoader } from "@/components/shared/book-loader";
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
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/hooks/use-auth";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/madrassa/classes/")({
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
  section: string;
};

type MadrassaCategory = {
  id: string;
  name: string;
  nameUrdu: string;
  subcategories: MadrassaSubcategory[];
  enrollmentCount: number;
};

type AcademicYear = {
  id: string;
  name: string;
  system: "school" | "madrassa";
  status: "upcoming" | "active" | "locked" | "archived";
};

const emptyForm = { categoryId: "", urdu: "", english: "", darja: "", rollPrefix: "", fee: "" };

function ClassesPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { gender } = useSystem();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const t = useMemo(() => (en: string, ur: string) => (isUrdu ? ur : en), [isUrdu]);

  const [category, setCategory] = useState<MadrassaCategory | null>(null);
  const [allCategories, setAllCategories] = useState<MadrassaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MadrassaSubcategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAddDialog = useCallback(() => {
    setF((prev) => ({ ...prev, categoryId: category?.id ?? "" }));
    setOpen(true);
  }, [category]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [yearsLoading, setYearsLoading] = useState(true);

  const activeMadrassaYear = useMemo(
    () => years.find((y) => y.system === "madrassa" && y.status === "active"),
    [years],
  );

  useEffect(() => {
    if (activeMadrassaYear) {
      setSelectedYearId(activeMadrassaYear.id);
    }
  }, [activeMadrassaYear]);

  const loadYears = useCallback(async () => {
    setYearsLoading(true);
    try {
      const response = await fetch("/api/academic-years", { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        navigate({ to: "/login", search: { redirect: undefined } });
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load academic years");
      setYears((payload.years ?? []) as AcademicYear[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load academic years");
    } finally {
      setYearsLoading(false);
    }
  }, [navigate]);

  const allowedCategoryNames = useMemo(() => {
    if (gender === "male") {
      return new Set(["Nazira", "Hifz", "Dars-e-Nizami"]);
    }
    return new Set(["Nazira", "Dars-e-Nizami"]);
  }, [gender]);

  const categorySectionMap = useMemo(() => {
    const base = new Map<string, string>();
    base.set("Nazira", "male");
    base.set("Hifz", "male");
    base.set("Dars-e-Nizami", "male");
    if (gender === "female") {
      base.set("Nazira", "female");
      base.set("Dars-e-Nizami", "female");
    }
    return base;
  }, [gender]);

  const visibleCategories = useMemo(() => {
    const filtered = allCategories.filter((c) => allowedCategoryNames.has(c.name) || allowedCategoryNames.has(c.nameUrdu));
    return filtered.map((c) => ({
      ...c,
      section: categorySectionMap.get(c.name) ?? gender,
    }));
  }, [allCategories, allowedCategoryNames, categorySectionMap, gender]);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYearId) params.set("academicYearId", selectedYearId);
      const response = await fetch(`/api/academic/madrassa/categories?${params.toString()}`, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        navigate({ to: "/login", search: { redirect: undefined } });
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load classes");
      const categories = (payload.categories ?? []) as MadrassaCategory[];
      const filtered = categories.filter((c) => allowedCategoryNames.has(c.name) || allowedCategoryNames.has(c.nameUrdu));
      setAllCategories(filtered);
      const defaultCategory =
        filtered.find((item) => item.id === "dars_nizami") ??
        filtered.find((item) => item.name.toLowerCase().includes("dars")) ??
        filtered[0] ??
        null;
      setCategory(defaultCategory);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load classes");
    } finally {
      setLoading(false);
    }
  }, [selectedYearId, navigate, allowedCategoryNames]);

  useEffect(() => {
    void loadYears();
  }, [loadYears]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login", search: { redirect: undefined } });
    }
  }, [user, isLoading, navigate]);

  const classes = (category?.subcategories ?? []).filter((s) => {
    const expected = categorySectionMap.get(category?.name ?? "") ?? gender;
    return !expected || s.section === expected;
  });
  const total = useMemo(
    () => classes.reduce((sum, item) => sum + item.enrollmentCount, 0),
    [classes],
  );

  const selectedYear = useMemo(
    () => years.find((y) => y.id === selectedYearId) ?? null,
    [years, selectedYearId],
  );

  const canAddClass = Boolean(selectedYearId);

  const addClass = useCallback(async () => {
    if (!f.categoryId) {
      toast.error(t("Please select a category", "زمرہ منتخب کریں"));
      return;
    }
    if (!f.urdu.trim() && !f.english.trim()) {
      toast.error(t("Name required", "نام درکار ہے"));
      return;
    }

    const selectedCategory = allCategories.find((c) => c.id === f.categoryId);
    const section = selectedCategory ? (categorySectionMap.get(selectedCategory.name) ?? gender) : gender;

    setPending(true);
    try {
      const response = await fetch(
        `/api/academic/madrassa/categories/${f.categoryId}/subcategories`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: f.english.trim() || f.urdu.trim(),
            nameUrdu: f.urdu.trim() || f.english.trim(),
            rollPrefix: f.rollPrefix.trim() || undefined,
            darja: f.darja.trim() || null,
            fee: f.fee ? Number(f.fee) : null,
            section,
          }),
        },
      );
      if (response.status === 401 || response.status === 403) {
        navigate({ to: "/login", search: { redirect: undefined } });
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not add class");
      await loadClasses();
      toast.success(t("Class added", "کلاس شامل کر دی گئی"));
      setF(emptyForm);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add class");
    } finally {
      setPending(false);
    }
  }, [f, navigate, loadClasses, t, allCategories, categorySectionMap, gender]);

  const confirmDelete = async () => {
    if (!deleteTarget || !category) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/academic/madrassa/categories/${category.id}/subcategories/${deleteTarget.id}`,
        { method: "DELETE", credentials: "include" },
      );
      if (response.status === 401 || response.status === 403) {
        navigate({ to: "/login", search: { redirect: undefined } });
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete class");
      toast.success(t("Class deleted", "کلاس حذف ہو گئی"));
      setDeleteTarget(null);
      await loadClasses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete class");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={t("Madrassa Classes", "مدرسہ کے کلاسز")}
        titleUrdu="مدرسہ کے کلاسز"
        description={t("Manage classes for the selected madrassa academic year. Enrollment counts reflect the chosen year.", "منتخب تعلیمی سال کے لیے کلاسز کا انتظام کریں۔ داخلہ کے تناظر میں طلبہ کی تعداد دکھائی جاتی ہے۔")}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={selectedYearId}
              onValueChange={(value) => setSelectedYearId(value)}
            >
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder={t("Select year", "سال منتخب کریں")} />
              </SelectTrigger>
              <SelectContent>
                {yearsLoading && <SelectItem value="loading" disabled>{t("Loading...", "لوڈ ہو رہا ہے...")}</SelectItem>}
                {!yearsLoading && years.filter((y) => y.system === "madrassa").length === 0 && (
                  <SelectItem value="none" disabled>{t("No academic years found", "کوئی تعلیمی سال نہیں ملا")}</SelectItem>
                )}
                {years
                  .filter((y) => y.system === "madrassa")
                  .map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name} {y.status === "active" ? `(${t("Active", "فعال")})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1.5" onClick={openAddDialog} disabled={!canAddClass}>
              <Plus className="h-4 w-4" />
              {t("Add Class", "کلاس شامل کریں")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {visibleCategories.map((c) => {
          const expectedSection = categorySectionMap.get(c.name) ?? gender;
          const categoryClasses = c.subcategories.filter((s) => !expectedSection || s.section === expectedSection);
          const classCount = categoryClasses.length;
          const studentCount = categoryClasses.reduce((sum, item) => sum + item.enrollmentCount, 0);
          const isActive = category?.id === c.id;
          return (
            <Card
              key={c.id}
              className={cn(
                "p-4 transition-colors cursor-pointer h-full",
                isActive ? "border-primary" : "hover:border-primary/40",
              )}
              onClick={() => setCategory(c)}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-bold leading-tight">{isUrdu ? c.nameUrdu : c.name}</p>
                <div className="text-right">
                  <p className="text-2xl font-bold">{classCount}</p>
                  <p className="text-xs text-muted-foreground">{t("Classes", "کلاسز")}</p>
                  <p className="text-xl font-bold mt-1">{studentCount}</p>
                  <p className="text-xs text-muted-foreground">{t("Students", "طلبہ")}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!selectedYearId && (
        <Card className="p-5 text-sm text-muted-foreground">
          {t("Select an academic year to manage classes.", "کلاسز کا انتظام کرنے کے لیے تعلیمی سال منتخب کریں۔")}
        </Card>
      )}
      {selectedYearId && loading && <Card className="p-5 text-sm text-muted-foreground">{t("Loading classes...", "کلاسز لوڈ ہو رہی ہیں...")}</Card>}
      {selectedYearId && !loading && visibleCategories.length === 0 && (
        <Card className="p-5 text-sm text-muted-foreground">
          {t("No madrassa categories configured for this section.", "اس سیکشن کے لیے کوئی مدرسہ زمرہ ترتیب نہیں ہے۔")}
        </Card>
      )}
      {selectedYearId && !loading && category && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((d) => (
              <Card
                key={d.id}
                className="p-5 hover:border-primary/40 transition-colors cursor-pointer h-full"
                onClick={() => navigate({ to: "/madrassa/classes/$classId", params: { classId: d.id } })}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {d.rollPrefix}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(d);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="font-urdu text-xl font-semibold">{isUrdu ? d.nameUrdu : d.name}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
                  {isUrdu ? d.name : d.nameUrdu}
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
              </Card>
          ))}
        </div>
      )}

      <ResponsiveDialog
        title={t("New Class", "نیا کلاس")}
        description={t("Add Class", "کلاس شامل کریں")}
        open={open}
        onOpenChange={setOpen}
        icon={BookOpen}
        className="max-w-md"
      >
        <div className="grid gap-4">
          <div className={cn("grid gap-3", isUrdu ? "grid-cols-2" : "grid-cols-2")}>
            <BilingualLabel urdu="کلاس کا نام" english="Name (Urdu)" required lang={lang}>
              <Input
                dir="rtl"
                lang="ur"
                inputMode="text"
                className="font-urdu text-sm h-9"
                value={f.urdu}
                onChange={(e) => setF({ ...f, urdu: e.target.value })}
                placeholder={t("Class", "کلاس")}
              />
            </BilingualLabel>
            <BilingualLabel urdu="انگریزی" english={isUrdu ? "English Name" : "Class Name"} lang={lang}>
              <Input
                lang="en"
                value={f.english}
                onChange={(e) => setF({ ...f, english: e.target.value })}
                placeholder={t("Class", "کلاس")}
              />
            </BilingualLabel>
          </div>
          <BilingualLabel urdu="زمرہ" english="Category" required lang={lang}>
            <Select
              value={f.categoryId}
              onValueChange={(value) => setF({ ...f, categoryId: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("Select category", "زمرہ منتخب کریں")} />
              </SelectTrigger>
              <SelectContent>
                {visibleCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {isUrdu ? c.nameUrdu : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </BilingualLabel>
          <div className={cn("grid gap-3", isUrdu ? "grid-cols-2" : "grid-cols-1")}>
            <BilingualLabel urdu="رول سابقہ" english="Roll Prefix" lang={lang}>
              <Input
                value={f.rollPrefix}
                onChange={(e) => setF({ ...f, rollPrefix: e.target.value })}
                placeholder="DN9"
              />
            </BilingualLabel>
            <BilingualLabel urdu="کلاس کوڈ" english="Class Code" lang={lang}>
              <Input
                value={f.darja}
                onChange={(e) => setF({ ...f, darja: e.target.value })}
                placeholder={t("Class Code", "کلاس کوڈ")}
              />
            </BilingualLabel>
          </div>
          <BilingualLabel urdu="تعلیمی سال" english="Academic Year" lang={lang}>
            <Input
              value={selectedYear?.name ?? ""}
              readOnly
              disabled
              className={cn("h-10 bg-muted", isUrdu ? "font-urdu text-right" : "text-left")}
            />
          </BilingualLabel>
          <BilingualLabel urdu="فیس" english="Fee" lang={lang}>
            <Input
              type="number"
              min={0}
              value={f.fee}
              onChange={(e) => setF({ ...f, fee: e.target.value })}
              placeholder="0"
            />
          </BilingualLabel>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("Cancel", "منسوخ کریں")}
          </Button>
          <Button onClick={addClass} disabled={pending || !canAddClass}>
            {pending ? t("Adding...", "شامل ہو رہا ہے...") : t("Add", "شامل کریں")}
          </Button>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete class?", "کلاس حذف کریں؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action cannot be undone.", "یہ کارروائی واپس نہیں کی جا سکتی۔")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("Cancel", "منسوخ کریں")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? t("Deleting...", "حذف ہو رہا ہے...") : t("Delete", "حذف کریں")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
