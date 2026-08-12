import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus, Users2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
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

type AcademicYear = {
  id: string;
  name: string;
  system: "school" | "madrassa";
  status: "upcoming" | "active" | "locked" | "archived";
};

const emptyForm = { urdu: "", english: "", darja: "", rollPrefix: "", fee: "" };

function ClassesPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const location = useLocation();

  const t = useMemo(() => (en: string, ur: string) => (isUrdu ? ur : en), [isUrdu]);

  const isDetailPage = location.pathname !== "/madrassa/classes";

  if (isDetailPage) {
    return <Outlet />;
  }

  const [category, setCategory] = useState<MadrassaCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(emptyForm);
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

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedYearId
        ? `/api/academic/madrassa/categories?academicYearId=${encodeURIComponent(selectedYearId)}`
        : "/api/academic/madrassa/categories";
      const response = await fetch(url, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        navigate({ to: "/login", search: { redirect: undefined } });
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load classes");
      const categories = (payload.categories ?? []) as MadrassaCategory[];
      setCategory(
        categories.find((item) => item.id === "dars_nizami") ??
          categories.find((item) => item.name.toLowerCase().includes("dars")) ??
          null,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load classes");
    } finally {
      setLoading(false);
    }
  }, [selectedYearId, navigate]);

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

  const classes = category?.subcategories ?? [];
  const total = useMemo(
    () => classes.reduce((sum, item) => sum + item.enrollmentCount, 0),
    [classes],
  );

  const selectedYear = useMemo(
    () => years.find((y) => y.id === selectedYearId) ?? null,
    [years, selectedYearId],
  );

  const canAddClass = Boolean(category && selectedYearId);

  const addClass = useCallback(async () => {
    if (!category) return;
    if (!f.urdu.trim() && !f.english.trim()) {
      toast.error(t("Name required", "نام درکار ہے"));
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
            fee: f.fee ? Number(f.fee) : null,
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
  }, [category, f, navigate, loadClasses, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-muted-foreground">{t("Loading...", "لوڈ ہو رہا ہے...")}</p>
      </div>
    );
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
            <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)} disabled={!canAddClass}>
              <Plus className="h-4 w-4" />
              {t("Add Class", "کلاس شامل کریں")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{t("Classes", "کلاسز")} · {t("Classes", "کلاسز")}</p>
          <p className="font-heading text-2xl font-bold mt-1">{classes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{t("Active Students", "طلبہ")} · {t("Active Students", "طلبہ")}</p>
          <p className="font-heading text-2xl font-bold mt-1">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{t("Academic Year", "تعلیمی سال")} · {t("Academic Year", "تعلیمی سال")}</p>
          <p className="font-heading text-lg font-bold mt-1 truncate">
            {selectedYear?.name ?? t("Select year", "سال منتخب کریں")}
          </p>
        </Card>
      </div>

      {!selectedYearId && (
        <Card className="p-5 text-sm text-muted-foreground">
          {t("Select an academic year to manage classes.", "کلاسز کا انتظام کرنے کے لیے تعلیمی سال منتخب کریں۔")}
        </Card>
      )}
      {selectedYearId && loading && <Card className="p-5 text-sm text-muted-foreground">{t("Loading classes...", "کلاسز لوڈ ہو رہی ہیں...")}</Card>}
      {selectedYearId && !loading && !category && (
        <Card className="p-5 text-sm text-muted-foreground">
          {t("Dars-e-Nizami category is not configured.", "درس نظامی کا زمرہ ترتیب نہیں ہے۔")}
        </Card>
      )}
      {selectedYearId && !loading && category && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((d) => (
            <Link key={d.id} to="/madrassa/classes/$classId" params={{ classId: d.id }} className="block">
              <Card className="p-5 hover:border-primary/40 transition-colors cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {d.rollPrefix}
                  </Badge>
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
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[11px]">
                    Qasmia {d.qasmiaCount}
                  </Badge>
                  <Badge variant="secondary" className="text-[11px]">
                    Zainab {d.zainabCount}
                  </Badge>
                </div>
              </Card>
            </Link>
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
    </div>
  );
}
