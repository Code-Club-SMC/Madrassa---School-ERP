import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardList, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  createTimetablePeriod,
  deleteTimetablePeriod,
  listExamSubjects,
  listTimetablePeriods,
  updateTimetablePeriod,
} from "@/components/exams/exam-api";
import type { ExamSubject, TimetablePeriod } from "@/components/exams/exam-types";

type MadrassaSubcategory = {
  id: string;
  categoryId: string;
  name: string;
  nameUrdu: string;
  rollPrefix: string;
  darja: string | null;
  govtEquivalent: string | null;
  durationYears: number | null;
  fee: number | null;
  enrollmentCount: number;
  qasmiaCount: number;
  zainabCount: number;
};

type MadrassaCategory = {
  id: string;
  name: string;
  nameUrdu: string;
  subcategories: MadrassaSubcategory[];
};

const DAYS_URDU = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const DAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];

const EMPTY_SLOTS: { dayOfWeek: number; subjectId: string | null }[] = Array.from({ length: 6 }, (_, i) => ({ dayOfWeek: i, subjectId: null }));

export const Route = createFileRoute("/_authenticated/madrassa/timetable")({
  component: TimetablePage,
});

function TimetablePage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const t = useMemo(() => (en: string, ur: string) => (isUrdu ? ur : en), [isUrdu]);

  const [categories, setCategories] = useState<MadrassaCategory[]>([]);
  const [subcategories, setSubcategories] = useState<MadrassaSubcategory[]>([]);
  const [timetableStatus, setTimetableStatus] = useState<Record<string, number>>({});
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("__all__");
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [allTimetables, setAllTimetables] = useState<Record<string, TimetablePeriod[]>>({});
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [periodOpen, setPeriodOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<TimetablePeriod | null>(null);
  const [periodForm, setPeriodForm] = useState({
    timeStart: "",
    timeEnd: "",
    label: "",
    labelUrdu: "",
    isBreak: false,
    slots: EMPTY_SLOTS,
  });
  const [saving, setSaving] = useState(false);

   const [slotEdit, setSlotEdit] = useState<{ periodId: string; dayOfWeek: number; subjectId: string | null; classId: string } | null>(null);
   const [slotSubjectId, setSlotSubjectId] = useState<string | null>(null);
   const [savingSlot, setSavingSlot] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TimetablePeriod | null>(null);
  const [deleting, setDeleting] = useState(false);

  const allSubcategoryIds = useMemo(
    () => subcategories.map((s) => s.id),
    [subcategories],
  );

   const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/academic/madrassa/categories", { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        navigate({ to: "/login", search: { redirect: undefined } });
        return;
      }
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not load classes");

      const cats = (payload.categories ?? []) as MadrassaCategory[];
      setCategories(cats);
      const all = cats.flatMap((c: MadrassaCategory) => c.subcategories ?? []);
      setSubcategories(all);
      if (!selectedSubcategoryId) {
        setSelectedSubcategoryId("__all__");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load classes");
    } finally {
      setLoadingCategories(false);
    }
  }, [navigate, selectedSubcategoryId]);

  const loadTimetableStatus = useCallback(async () => {
    if (allSubcategoryIds.length === 0) return;
    try {
      const params = new URLSearchParams();
      allSubcategoryIds.forEach((id) => params.append("subcategoryId", id));
      const res = await fetch(`/api/academic/madrassa/timetable/status?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const payload = await res.json().catch(() => ({}));
        setTimetableStatus(payload.status ?? {});
      }
    } catch {
      // non-critical
    }
  }, [allSubcategoryIds]);

   const loadTimetable = useCallback(async () => {
    if (!selectedSubcategoryId || selectedSubcategoryId === "__all__") {
      setPeriods([]);
      return;
    }
    setLoadingTimetable(true);
    try {
      const payload = await listTimetablePeriods(selectedSubcategoryId);
      setPeriods(payload.periods);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load timetable");
    } finally {
      setLoadingTimetable(false);
    }
  }, [selectedSubcategoryId]);

  const loadAllTimetables = useCallback(async () => {
    if (!selectedSubcategoryId || selectedSubcategoryId !== "__all__") {
      setAllTimetables({});
      return;
    }
    setLoadingTimetable(true);
    try {
      const results = await Promise.all(
        subcategories.map(async (sub) => {
          try {
            const payload = await listTimetablePeriods(sub.id);
            return { id: sub.id, periods: payload.periods };
          } catch {
            return { id: sub.id, periods: [] };
          }
        }),
      );
      const map: Record<string, TimetablePeriod[]> = {};
      for (const entry of results) {
        map[entry.id] = entry.periods;
      }
      setAllTimetables(map);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load timetables");
    } finally {
      setLoadingTimetable(false);
    }
  }, [selectedSubcategoryId, subcategories]);

  const loadSubjects = useCallback(async () => {
    if (!selectedSubcategoryId) return;
    setLoadingSubjects(true);
    try {
      const payload = await listExamSubjects({
        system: "madrassa",
        madrassaSubcategoryId: selectedSubcategoryId,
        active: true,
      });
      setSubjects(payload.subjects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  }, [selectedSubcategoryId]);

  const selectedSubcategory = useMemo(
    () => subcategories.find((s) => s.id === selectedSubcategoryId) ?? null,
    [subcategories, selectedSubcategoryId],
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedSubcategory?.categoryId) ?? null,
    [categories, selectedSubcategory],
  );

   useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadTimetableStatus();
  }, [loadTimetableStatus]);

  useEffect(() => {
    if (selectedSubcategoryId === "__all__") {
      void loadAllTimetables();
    } else {
      void loadTimetable();
    }
  }, [selectedSubcategoryId, loadTimetable, loadAllTimetables]);

  useEffect(() => {
    if (selectedSubcategoryId === "__all__") {
      setSubjects([]);
    } else {
      void loadSubjects();
    }
  }, [selectedSubcategoryId, loadSubjects]);

   useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login", search: { redirect: undefined } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!slotEdit) return;
    const classId = slotEdit.classId ?? selectedSubcategoryId;
    if (!classId || classId === "__all__") return;
    setLoadingSubjects(true);
    let cancelled = false;
    (async () => {
      try {
        const payload = await listExamSubjects({
          system: "madrassa",
          madrassaSubcategoryId: classId,
          active: true,
        });
        if (!cancelled) {
          setSubjects(payload.subjects);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Could not load subjects");
        }
      } finally {
        if (!cancelled) {
          setLoadingSubjects(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slotEdit, selectedSubcategoryId]);

  const openAddPeriod = () => {
    setEditingPeriod(null);
    setPeriodForm({
      timeStart: "",
      timeEnd: "",
      label: "",
      labelUrdu: "",
      isBreak: false,
      slots: EMPTY_SLOTS,
    });
    setPeriodOpen(true);
  };

  const openEditPeriod = (period: TimetablePeriod) => {
    setEditingPeriod(period);
    const slots = period.slots
      .slice()
      .sort((a: TimetablePeriod["slots"][number], b: TimetablePeriod["slots"][number]) => a.dayOfWeek - b.dayOfWeek)
      .map((s: TimetablePeriod["slots"][number]) => ({ dayOfWeek: s.dayOfWeek, subjectId: s.subjectId }));
    setPeriodForm({
      timeStart: period.timeStart,
      timeEnd: period.timeEnd,
      label: period.label,
      labelUrdu: period.labelUrdu,
      isBreak: period.isBreak,
      slots: slots.length === 6 ? slots : [...slots, ...EMPTY_SLOTS.slice(slots.length)],
    });
    setPeriodOpen(true);
  };

  const savePeriod = async () => {
    if (!periodForm.timeStart.trim() || !periodForm.timeEnd.trim() || !periodForm.label.trim() || !periodForm.labelUrdu.trim()) {
      toast.error(t("All fields are required", "تمام فیلڈز درکار ہیں"));
      return;
    }

    setSaving(true);
    try {
      if (editingPeriod) {
        await updateTimetablePeriod(editingPeriod.id, {
          timeStart: periodForm.timeStart,
          timeEnd: periodForm.timeEnd,
          label: periodForm.label,
          labelUrdu: periodForm.labelUrdu,
          isBreak: periodForm.isBreak,
          slots: periodForm.slots,
        });
        toast.success(t("Period updated", "پیریڈ اپ ڈیٹ ہو گیا"));
      } else {
        if (!selectedSubcategoryId) {
          toast.error(t("Please select a class first", "پہلے کلاس منتخب کریں"));
          return;
        }
        await createTimetablePeriod({
          madrassaSubcategoryId: selectedSubcategoryId,
          timeStart: periodForm.timeStart,
          timeEnd: periodForm.timeEnd,
          label: periodForm.label,
          labelUrdu: periodForm.labelUrdu,
          isBreak: periodForm.isBreak,
          slots: periodForm.slots,
        });
        toast.success(t("Period added", "پیریڈ شامل کر دیا گیا"));
      }
      setPeriodOpen(false);
      void loadTimetable();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save period");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTimetablePeriod(deleteTarget.id);
      toast.success(t("Period deleted", "پیریڈ حذف ہو گیا"));
      setDeleteTarget(null);
      void loadTimetable();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete period");
    } finally {
      setDeleting(false);
    }
  };

   const openSlotEdit = (periodId: string, dayOfWeek: number, subjectId: string | null, classId?: string) => {
    setSlotEdit({ periodId, dayOfWeek, subjectId, classId: classId ?? selectedSubcategoryId });
    setSlotSubjectId(subjectId);
  };

  const saveSlot = async () => {
    if (!slotEdit) return;
    const period =
      periods.find((p) => p.id === slotEdit.periodId) ??
      (slotEdit.classId ? allTimetables[slotEdit.classId]?.find((p) => p.id === slotEdit.periodId) : undefined);
    if (!period) return;
    setSavingSlot(true);
    try {
      const updatedSlots = period.slots.map((s: TimetablePeriod["slots"][number]) =>
        s.dayOfWeek === slotEdit.dayOfWeek ? { ...s, subjectId: slotSubjectId } : s,
      );
      await updateTimetablePeriod(period.id, {
        slots: updatedSlots.map((s: TimetablePeriod["slots"][number]) => ({ dayOfWeek: s.dayOfWeek, subjectId: s.subjectId })),
      });
      toast.success(t("Slot updated", "سلٹ اپ ڈیٹ ہو گیا"));
      setSlotEdit(null);
      void loadTimetable();
      void loadAllTimetables();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update slot");
    } finally {
      setSavingSlot(false);
    }
  };

   const handleClassChange = (value: string) => {
    setSelectedSubcategoryId(value);
  };

  const getSlotSubject = (period: TimetablePeriod, dayOfWeek: number): ExamSubject | null | undefined => {
    const slot = period.slots.find((s) => s.dayOfWeek === dayOfWeek);
    return slot?.subject ?? null;
  };

  const getPeriodClassId = (period: TimetablePeriod): string => {
    return period.madrassaSubcategoryId;
  };

  if (authLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  if (!user) {
    return null;
  }

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-muted-foreground">{t("Loading classes...", "کلاسز لوڈ ہو رہی ہیں...")}</p>
      </div>
    );
  }

  const hasTimetable = selectedSubcategoryId ? (timetableStatus[selectedSubcategoryId] ?? 0) > 0 : false;

  return (
    <div>
      <PageHeader
        title="Madrassa Timetable"
        titleUrdu="مدرسہ — نظامِ اوقات"
        description={t("Weekly schedule per class. Click a slot to assign a subject.", "ہفتہ وار نظام۔ سلٹ پر کلک کر کے مضمون مقرر کریں۔")}
        actions={
          <div className="flex items-center gap-2">
            <Select value={selectedSubcategoryId} onValueChange={handleClassChange}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder={t("Select class", "کلاس منتخب کریں")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">
                  <span className="flex items-center gap-2">
                    {t("All Classes", "تمام کلاسز")}
                  </span>
                </SelectItem>
                {subcategories.length === 0 ? (
                  <SelectItem value="__empty" disabled>
                    {t("No classes found", "کوئی کلاس نہیں ملی")}
                  </SelectItem>
                ) : (
                  subcategories.map((sub: MadrassaSubcategory) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      <span className="flex items-center gap-2">
                        {isUrdu ? sub.nameUrdu : sub.name}
                        <span className="text-[10px] text-muted-foreground uppercase">{sub.rollPrefix}</span>
                        {(timetableStatus[sub.id] ?? 0) > 0 && (
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            {t("Timetable", "ٹائم ٹیبل")}
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedSubcategoryId !== "__all__" && (
              <Button size="sm" className="gap-1.5" onClick={openAddPeriod}>
                <Plus className="h-4 w-4" />
                {t("Add Period", "پیریڈ شامل کریں")}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              {t("Print", "پرنٹ")}
            </Button>
          </div>
        }
      />

      {selectedSubcategory && selectedSubcategoryId !== "__all__" && (
        <Card className="p-4 mb-4 flex items-center justify-between bg-primary/5 border-primary/20">
          <div>
            <p className="font-urdu text-lg">{isUrdu ? selectedSubcategory.nameUrdu : selectedSubcategory.name}</p>
            <p className="text-xs text-muted-foreground">
              {isUrdu ? selectedCategory?.nameUrdu ?? "" : selectedCategory?.name ?? ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hasTimetable ? "secondary" : "outline"}>
              {hasTimetable ? t("Timetable designed", "ٹائم ٹیبل تیار") : t("No timetable", "ٹائم ٹیبل نہیں")}
            </Badge>
            <p className="text-xs text-muted-foreground font-mono">
              {periods.length} {t("periods", "پیریڈز")}
            </p>
          </div>
        </Card>
      )}

      {selectedSubcategoryId === "__all__" && (
        <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-muted-foreground">
            {t("Showing timetables for all classes", "تمام کلاسز کے نظامِ اوقات دکھائے جا رہے ہیں")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {Object.values(allTimetables).reduce((sum, p) => sum + p.length, 0)} {t("total periods", "کل پیریڈز")}
          </p>
        </Card>
      )}

      <Card className="overflow-x-auto">
        {selectedSubcategoryId === "__all__" ? (
          <div className="divide-y divide-border">
            {subcategories
              .filter((sub) => (allTimetables[sub.id]?.length ?? 0) > 0)
              .map((sub) => {
                const classPeriods = allTimetables[sub.id] ?? [];
                const category = categories.find((c) => c.id === sub.categoryId);
                return (
                  <div key={sub.id} className="p-4">
                    <div className="mb-3">
                      <p className="font-heading font-bold">{isUrdu ? sub.nameUrdu : sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isUrdu ? category?.nameUrdu ?? "" : category?.name ?? ""} · {sub.rollPrefix}
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 border-b border-border">
                          <TableHead className="text-start p-3 w-[170px] font-medium">
                            {t("Period", "پیریڈ")}
                          </TableHead>
                          {isUrdu
                            ? DAYS_URDU.map((d, i) => (
                                <TableHead key={d} className="text-center p-3 font-medium">
                                  <p className="font-urdu text-base leading-tight">{d}</p>
                                </TableHead>
                              ))
                            : DAYS_EN.map((d, i) => (
                                <TableHead key={d} className="text-center p-3 font-medium">
                                  <p className="text-[10px] text-muted-foreground uppercase">{d}</p>
                                </TableHead>
                              ))}
                          <TableHead className="text-end p-3 w-[80px] font-medium">{t("Actions", "کارروائیاں")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classPeriods.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-muted-foreground text-center py-4">
                              {t("No periods designed.", "کوئی پیریڈ نہیں۔")}
                            </TableCell>
                          </TableRow>
                        ) : (
                          classPeriods.map((period: TimetablePeriod) => (
                            <tr key={period.id} className="border-b border-border last:border-0">
                              <td className="p-3 align-top">
                                <button
                                  type="button"
                                  onClick={() => openEditPeriod(period)}
                                  className="text-start hover:bg-accent/40 rounded-md px-1 py-0.5 -mx-1 transition-colors w-full"
                                  aria-label="Edit period"
                                >
                                  <p className="font-mono text-xs">{period.timeStart} → {period.timeEnd}</p>
                                  {isUrdu ? (
                                    <p className="font-urdu text-sm text-muted-foreground">{period.labelUrdu}</p>
                                  ) : (
                                    <p className="text-[10px] text-muted-foreground uppercase">{period.label}</p>
                                  )}
                                </button>
                              </td>
                              {DAYS_EN.map((_, dayIndex) => {
                                const subject = getSlotSubject(period, dayIndex);
                                const isBreak = period.isBreak || (subject === null && period.isBreak);
                                return (
                                  <td key={dayIndex} className="p-2 text-center">
                                <button
                                  type="button"
                                  disabled={isBreak}
                                  onClick={() => openSlotEdit(period.id, dayIndex, subject?.id ?? null, period.madrassaSubcategoryId)}
                                  className={cn(
                                    "w-full rounded-md px-2 py-1.5 text-xs transition-colors",
                                    isBreak
                                      ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                      : "bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer",
                                  )}
                                >
                                  {subject ? (isUrdu ? subject.nameUrdu : subject.name) : "—"}
                                </button>
                                  </td>
                                );
                              })}
                              <TableCell className="text-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => setDeleteTarget(period)}
                                  disabled={deleting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            {subcategories.filter((sub) => (allTimetables[sub.id]?.length ?? 0) > 0).length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                {t("No timetables designed yet.", "ابھی تک کوئی نظامِ اوقات تیار نہیں کیا گیا۔")}
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 border-b border-border">
                <TableHead className="text-start p-3 w-[170px] font-medium">
                  {t("Period", "پیریڈ")}
                </TableHead>
                {isUrdu
                  ? DAYS_URDU.map((d, i) => (
                      <TableHead key={d} className="text-center p-3 font-medium">
                        <p className="font-urdu text-base leading-tight">{d}</p>
                      </TableHead>
                    ))
                  : DAYS_EN.map((d, i) => (
                      <TableHead key={d} className="text-center p-3 font-medium">
                        <p className="text-[10px] text-muted-foreground uppercase">{d}</p>
                      </TableHead>
                    ))}
                <TableHead className="text-end p-3 w-[80px] font-medium">{t("Actions", "کارروائیاں")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTimetable ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground text-center py-8">
                    {t("Loading timetable...", "ٹائم ٹیبل لوڈ ہو رہا ہے...")}
                  </TableCell>
                </TableRow>
              ) : periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground text-center py-8">
                    {t("No periods designed. Click Add Period to begin.", "کوئی پیریڈ نہیں۔ شروع کرنے کے لیے 'پیریڈ شامل کریں' پر کلک کریں۔")}
                  </TableCell>
                </TableRow>
              ) : (
                periods.map((period: TimetablePeriod) => (
                  <tr key={period.id} className="border-b border-border last:border-0">
                    <td className="p-3 align-top">
                      <button
                        type="button"
                        onClick={() => openEditPeriod(period)}
                        className="text-start hover:bg-accent/40 rounded-md px-1 py-0.5 -mx-1 transition-colors w-full"
                        aria-label="Edit period"
                      >
                        <p className="font-mono text-xs">{period.timeStart} → {period.timeEnd}</p>
                        {isUrdu ? (
                          <p className="font-urdu text-sm text-muted-foreground">{period.labelUrdu}</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground uppercase">{period.label}</p>
                        )}
                      </button>
                    </td>
                    {DAYS_EN.map((_, dayIndex) => {
                      const subject = getSlotSubject(period, dayIndex);
                      const isBreak = period.isBreak || (subject === null && period.isBreak);
                      return (
                        <td key={dayIndex} className="p-2 text-center">
                          <button
                            type="button"
                            disabled={isBreak}
                            onClick={() => openSlotEdit(period.id, dayIndex, subject?.id ?? null, selectedSubcategoryId)}
                            className={cn(
                              "w-full rounded-md px-2 py-1.5 text-xs transition-colors",
                              isBreak
                                ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                : "bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer",
                            )}
                          >
                            {subject ? (isUrdu ? subject.nameUrdu : subject.name) : "—"}
                          </button>
                        </td>
                      );
                    })}
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(period)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={periodOpen} onOpenChange={(v) => !v && setPeriodOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPeriod ? t("Edit Period", "پیریڈ ترمیم") : t("Add Period", "پیریڈ شامل کریں")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <BilingualLabel urdu="شروعات" english="Start Time">
                <Input
                  value={periodForm.timeStart}
                  onChange={(e) => setPeriodForm({ ...periodForm, timeStart: e.target.value })}
                  placeholder="07:00"
                />
              </BilingualLabel>
              <BilingualLabel urdu="اختتام" english="End Time">
                <Input
                  value={periodForm.timeEnd}
                  onChange={(e) => setPeriodForm({ ...periodForm, timeEnd: e.target.value })}
                  placeholder="08:30"
                />
              </BilingualLabel>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <BilingualLabel urdu="نام" english="Label">
                <Input
                  value={periodForm.label}
                  onChange={(e) => setPeriodForm({ ...periodForm, label: e.target.value })}
                  placeholder="Period 1"
                />
              </BilingualLabel>
              <BilingualLabel urdu="اردو لیبل" english="Urdu Label">
                <Input
                  dir="rtl"
                  lang="ur"
                  className="font-urdu"
                  value={periodForm.labelUrdu}
                  onChange={(e) => setPeriodForm({ ...periodForm, labelUrdu: e.target.value })}
                  placeholder="پہلا پیریڈ"
                />
              </BilingualLabel>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isBreak"
                type="checkbox"
                checked={periodForm.isBreak}
                onChange={(e) => setPeriodForm({ ...periodForm, isBreak: e.target.checked })}
              />
              <Label htmlFor="isBreak">{t("Break / Prayer slot", "وقفہ / نماز کا سلٹ")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodOpen(false)}>
              {t("Cancel", "منسوخ کریں")}
            </Button>
            <Button onClick={savePeriod} disabled={saving}>
              {saving ? t("Saving...", "محفوظ ہو رہا ہے...") : t("Save", "محفوظ کریں")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!slotEdit} onOpenChange={(v) => !v && setSlotEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Edit Subject", "مضمون ترمیم")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>{t("Subject", "مضمون")}</Label>
              <Select value={slotSubjectId ?? "__none"} onValueChange={(v) => setSlotSubjectId(v === "__none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select subject", "مضمون منتخب کریں")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">{t("None / Break", "خالی / وقفہ")}</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {isUrdu ? s.nameUrdu : s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subjects.length === 0 && !loadingSubjects && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("No subjects found for this class.", "اس کلاس کے لیے کوئی مضمون نہیں ملا۔")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotEdit(null)}>
              {t("Cancel", "منسوخ کریں")}
            </Button>
            <Button onClick={saveSlot} disabled={savingSlot}>
              {savingSlot ? t("Saving...", "محفوظ ہو رہا ہے...") : t("Save", "محفوظ کریں")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete period?", "پیریڈ حذف کریں؟")}</AlertDialogTitle>
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
