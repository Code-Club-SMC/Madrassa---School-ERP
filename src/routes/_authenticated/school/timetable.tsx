import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
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
import { useSystem } from "@/components/system-context";
import { cn } from "@/lib/utils";
import {
  createSchoolTimetablePeriod,
  deleteSchoolTimetablePeriod,
  listExamSubjects,
  listSchoolTimetablePeriods,
  updateSchoolTimetablePeriod,
} from "@/components/exams/exam-api";
import type { ExamSubject, TimetablePeriod } from "@/components/exams/exam-types";

const DAYS_URDU = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const DAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];

const EMPTY_SLOTS: { dayOfWeek: number; subjectId: string | null }[] = Array.from({ length: 6 }, (_, i) => ({ dayOfWeek: i, subjectId: null }));

export const Route = createFileRoute("/_authenticated/school/timetable")({
  component: SchoolTimetablePage,
});

function SchoolTimetablePage() {
  const { gender } = useSystem();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const t = useMemo(() => (en: string, ur: string) => (isUrdu ? ur : en), [isUrdu]);

  const [classes, setClasses] = useState<Array<{ id: string; name: string; nameUrdu: string }>>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [allTimetables, setAllTimetables] = useState<Record<string, TimetablePeriod[]>>({});
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);

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

  const loadClasses = useCallback(async () => {
    const institutionId = gender === "male" ? "al_qasim_academy" : "jamia_zainab_banat";
    setLoadingClasses(true);
    try {
      const res = await fetch(`/api/academic/school/classes?institutionId=${encodeURIComponent(institutionId)}`, { credentials: "include" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not load classes");
      setClasses((payload.classes ?? []) as Array<{ id: string; name: string; nameUrdu: string }>);
      if (!selectedClassId && (payload.classes ?? []).length > 0) {
        setSelectedClassId((payload.classes ?? [])[0].id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load classes");
    } finally {
      setLoadingClasses(false);
    }
  }, [gender, selectedClassId]);

  const loadTimetable = useCallback(async () => {
    if (!selectedClassId) {
      setPeriods([]);
      return;
    }
    setLoadingTimetable(true);
    try {
      const payload = await listSchoolTimetablePeriods(selectedClassId);
      setPeriods(payload.periods);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load timetable");
    } finally {
      setLoadingTimetable(false);
    }
  }, [selectedClassId]);

  const loadAllTimetables = useCallback(async () => {
    if (!classes.length) {
      setAllTimetables({});
      return;
    }
    setLoadingTimetable(true);
    try {
      const results = await Promise.all(
        classes.map(async (cls) => {
          try {
            const payload = await listSchoolTimetablePeriods(cls.id);
            return { id: cls.id, periods: payload.periods };
          } catch {
            return { id: cls.id, periods: [] };
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
  }, [classes]);

  const loadSubjects = useCallback(async () => {
    if (!selectedClassId || selectedClassId === "__all__") {
      setSubjects([]);
      return;
    }
    setLoadingSubjects(true);
    try {
      const payload = await listExamSubjects({
        system: "school",
        schoolClassId: selectedClassId,
        active: true,
      });
      setSubjects(payload.subjects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  }, [selectedClassId]);

  const loadTeachers = useCallback(async () => {
    try {
      const res = await fetch("/api/teachers?all=true", { credentials: "include" });
      if (!res.ok) return;
      const payload = await res.json().catch(() => ({}));
      const list = Array.isArray(payload)
        ? payload.map((t: any) => ({ id: t.id, name: t.name }))
        : (payload.teachers ?? []).map((t: any) => ({ id: t.id, name: t.name }));
      setTeachers(list);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    if (selectedClassId && selectedClassId !== "__all__") {
      void loadTimetable();
    } else if (selectedClassId === "__all__") {
      void loadAllTimetables();
    }
  }, [selectedClassId, loadTimetable, loadAllTimetables]);

  useEffect(() => {
    if (selectedClassId && selectedClassId !== "__all__") {
      void loadSubjects();
    } else {
      setSubjects([]);
    }
  }, [selectedClassId, loadSubjects]);

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
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((s) => ({ dayOfWeek: s.dayOfWeek, subjectId: s.subjectId }));
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
        await updateSchoolTimetablePeriod(editingPeriod.id, {
          timeStart: periodForm.timeStart,
          timeEnd: periodForm.timeEnd,
          label: periodForm.label,
          labelUrdu: periodForm.labelUrdu,
          isBreak: periodForm.isBreak,
          slots: periodForm.slots,
        });
        toast.success(t("Period updated", "پیریڈ اپ ڈیٹ ہو گیا"));
      } else {
        if (!selectedClassId) {
          toast.error(t("Please select a class first", "پہلے کلاس منتخب کریں"));
          return;
        }
        await createSchoolTimetablePeriod({
          schoolClassId: selectedClassId,
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
      void loadAllTimetables();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save period");
    } finally {
      setSaving(false);
    }
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
      await updateSchoolTimetablePeriod(period.id, {
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSchoolTimetablePeriod(deleteTarget.id);
      toast.success(t("Period deleted", "پیریڈ حذف ہو گیا"));
      setDeleteTarget(null);
      void loadTimetable();
      void loadAllTimetables();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete period");
    } finally {
      setDeleting(false);
    }
  };

  const openSlotEdit = (periodId: string, dayOfWeek: number, subjectId: string | null, classId?: string) => {
    setSlotEdit({ periodId, dayOfWeek, subjectId, classId: classId ?? selectedClassId });
    setSlotSubjectId(subjectId);
  };

  const pageTitle = isUrdu
    ? gender === "male"
      ? "نظامِ اوقات · القاسم اکیڈمی (لڑکا)"
      : "نظامِ اوقات · جامعہ زینب (لڑکی)"
    : gender === "male"
      ? "Timetable · Al-Qasim Academy (Boys)"
      : "Timetable · Jamyah Zainab (Girls)";

  const pageDesc = isUrdu
    ? gender === "male"
      ? "القاسم اکیڈمی ٹل کے ہفتہ وار وقت کا جدول"
      : "جامعہ زینب للبنات کے ہفتہ وار وقت کا جدول"
    : gender === "male"
      ? "Weekly schedule for Al-Qasim Academy Thall"
      : "Weekly schedule for Jamyah Zainab lilbanat";

  const currentClass = classes.find((c) => c.id === selectedClassId);

  const getSlotSubject = (period: TimetablePeriod, dayOfWeek: number): ExamSubject | null | undefined => {
    const slot = period.slots.find((s) => s.dayOfWeek === dayOfWeek);
    return slot?.subject ?? null;
  };

  const getPeriodClassId = (period: TimetablePeriod): string => {
    return period.schoolClassId;
  };

  const teacherNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const teacher of teachers) {
      map.set(teacher.id, teacher.name);
    }
    return map;
  }, [teachers]);

  return (
    <div>
      <PageHeader
        title={pageTitle}
        titleUrdu={pageTitle}
        description={pageDesc}
        actions={
          <div className="flex items-center gap-2">
            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={loadingClasses || classes.length === 0}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder={loadingClasses ? "Loading..." : (isUrdu ? "کلاس منتخب کریں" : "Select class")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{isUrdu ? "تمام کلاسوں" : "All classes"}</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} · <span className="font-urdu ms-1">{c.nameUrdu}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClassId && selectedClassId !== "__all__" && (
              <Button size="sm" className="gap-1.5" onClick={openAddPeriod}>
                <Plus className="h-4 w-4" />
                {periods.length > 0
                  ? (isUrdu ? "پیریڈ شامل کریں" : "Add Period")
                  : (isUrdu ? "ٹائم ٹیبل شامل کریں" : "Add Timetable")}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />{isUrdu ? "پرنٹ" : "Print"}</Button>
          </div>
        }
      />

      {classes.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {isUrdu
            ? "اس شعبے کے لیے کوئی کلاس دستیاب نہیں ہے۔"
            : "No classes available for this section yet."}
        </Card>
      ) : !selectedClassId || selectedClassId === "__all__" ? (
        <Card className="p-8 text-center text-muted-foreground">
          {isUrdu ? "براہ کرم پہلے کلاس منتخب کریں" : "Please select a class to manage its timetable."}
        </Card>
      ) : (
        <>
          <Card className="p-4 mb-4 flex items-center justify-between bg-primary/5 border-primary/20">
            <div>
              <p className="font-urdu text-lg">{currentClass?.nameUrdu}</p>
              <p className="text-xs text-muted-foreground">{currentClass?.name} · 6 working days</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={periods.length > 0 ? "secondary" : "outline"}>
                {periods.length > 0
                  ? (isUrdu ? "ٹائم ٹیبل تیار" : "Timetable designed")
                  : (isUrdu ? "ٹائم ٹیبل نہیں" : "No timetable")}
              </Badge>
              <p className="text-xs text-muted-foreground font-mono">
                {periods.length} {isUrdu ? "پیریڈز" : "periods"}
              </p>
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 border-b border-border">
                  <TableHead className="text-start p-3 w-[170px] font-medium">
                    {isUrdu ? "پیریڈ" : "Period"}
                  </TableHead>
                  {isUrdu
                    ? DAYS_URDU.map((d, i) => (
                        <TableHead key={d} className="text-center p-3 w-[140px] font-medium">
                          <p className="font-urdu text-base leading-tight">{d}</p>
                        </TableHead>
                      ))
                    : DAYS_EN.map((d, i) => (
                        <TableHead key={d} className="text-center p-3 w-[140px] font-medium">
                          <p className="text-[10px] text-muted-foreground uppercase">{d}</p>
                        </TableHead>
                      ))}
                  <TableHead className="text-end p-3 w-[80px] font-medium">
                    {isUrdu ? "کارروائیاں" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTimetable ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground text-center py-8">
                      {isUrdu ? "ٹائم ٹیبل لوڈ ہو رہا ہے..." : "Loading timetable..."}
                    </TableCell>
                  </TableRow>
                ) : periods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground text-center py-8">
                      {isUrdu
                        ? "کوئی پیریڈ نہیں۔ شروع کرنے کے لیے 'پیریڈ شامل کریں' پر کلک کریں۔"
                        : "No periods designed. Click Add Period to begin."}
                    </TableCell>
                  </TableRow>
                ) : (
                  periods.map((row) => (
                    <TableRow key={row.id} className="border-b border-border last:border-0">
                      <TableCell className="p-3 align-top">
                        <button
                          type="button"
                          onClick={() => openEditPeriod(row)}
                          className="text-start hover:bg-accent/40 rounded-md px-1 py-0.5 -mx-1 transition-colors w-full"
                          aria-label={isUrdu ? "وقت ترمیم" : "Edit period time"}
                        >
                          <p className="font-mono text-xs">{row.timeStart} → {row.timeEnd}</p>
                          {isUrdu ? (
                            <p className="font-urdu text-sm text-muted-foreground">{row.labelUrdu}</p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground uppercase">{row.label}</p>
                          )}
                        </button>
                      </TableCell>
                      {Array.from({ length: 6 }).map((_, dayIndex) => {
                        const subject = getSlotSubject(row, dayIndex);
                        const isBreak = row.isBreak || (subject === null && row.isBreak);
                        return (
                          <TableCell key={dayIndex} className="p-2 text-center align-middle w-[140px]">
                            <button
                              type="button"
                              disabled={isBreak}
                              onClick={() => openSlotEdit(row.id, dayIndex, subject?.id ?? null, selectedClassId)}
                              className={cn(
                                "w-full rounded-md px-2 py-2 text-xs transition-colors flex flex-col items-center justify-center",
                                isBreak
                                  ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                  : "bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer",
                              )}
                            >
                              {subject ? (
                                <span className="text-center">
                                  <span className="block">{isUrdu ? subject.nameUrdu : subject.name}</span>
                                  {subject.teacherId && (
                                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                                      {teacherNameMap.get(subject.teacherId) ?? ""}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                "—"
                              )}
                            </button>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTarget(row)}
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

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
