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

  const [slotEdit, setSlotEdit] = useState<{ periodId: string; dayOfWeek: number; subjectId: string | null } | null>(null);
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
    if (!selectedClassId || selectedClassId === "__all__") {
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
  }, [selectedClassId, classes]);

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
      await deleteSchoolTimetablePeriod(deleteTarget.id);
      toast.success(t("Period deleted", "پیریڈ حذف کر دیا گیا"));
      setDeleteTarget(null);
      void loadTimetable();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete period");
    } finally {
      setDeleting(false);
    }
  };

  const saveSlot = async () => {
    if (!slotEdit || !editingPeriod) return;
    setSavingSlot(true);
    try {
      await updateSchoolTimetablePeriod(editingPeriod.id, {
        slots: editingPeriod.slots.map((s) =>
          s.dayOfWeek === slotEdit.dayOfWeek ? { ...s, subjectId: slotSubjectId } : s,
        ),
      });
      toast.success(t("Slot updated", "سلٹ اپ ڈیٹ ہو گیا"));
      setSlotEdit(null);
      setSlotSubjectId(null);
      void loadTimetable();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save slot");
    } finally {
      setSavingSlot(false);
    }
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
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} · <span className="font-urdu ms-1">{c.nameUrdu}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      ) : selectedClassId && periods.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">{isUrdu ? "اس کلاس کے لیے کوئی پیریڈ نہیں ہے" : "No periods defined for this class yet."}</p>
          <Button onClick={openAddPeriod} className="gap-1.5"><Plus className="h-4 w-4" />{isUrdu ? "پیریڈ شامل کریں" : "Add Period"}</Button>
        </Card>
      ) : selectedClassId ? (
        <>
          <Card className="p-4 mb-4 flex items-center justify-between bg-primary/5 border-primary/20">
            <div>
              <p className="font-urdu text-lg">{currentClass?.nameUrdu}</p>
              <p className="text-xs text-muted-foreground">{currentClass?.name} · 6 working days</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-1.5" onClick={openAddPeriod}><Plus className="h-4 w-4" />{isUrdu ? "پیریڈ شامل کریں" : "Add Period"}</Button>
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-start p-3 w-[170px] font-medium">{isUrdu ? "پیریڈ" : "Period"}</th>
                  {DAYS_EN.map((d, i) => (
                    <th key={d} className="text-center p-3 font-medium">
                      <p className="font-urdu text-base leading-tight">{DAYS_URDU[i]}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{d}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((row, i) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="p-3 align-top">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className="text-start hover:bg-accent/40 rounded-md px-1 py-0.5 -mx-1 transition-colors"
                          aria-label={isUrdu ? "وقت ترمیم" : "Edit period time"}
                        >
                          <p className="font-mono text-xs">{row.timeStart} → {row.timeEnd}</p>
                          <p className="font-urdu text-sm text-muted-foreground">{row.labelUrdu}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{row.label}</p>
                        </button>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditPeriod(row)}
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 6 }).map((_, dayIndex) => {
                      const slot = row.slots.find((s) => s.dayOfWeek === dayIndex);
                      const subject = slot?.subject;
                      const muted = row.isBreak;
                      return (
                        <td key={dayIndex} className="p-2 text-center">
                          {slotEdit?.periodId === row.id && slotEdit?.dayOfWeek === dayIndex ? (
                            <div className="flex flex-col gap-1">
                              <Select value={slotSubjectId ?? ""} onValueChange={setSlotSubjectId}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder={isUrdu ? "مضمون" : "Subject"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {subjects.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.nameUrdu || s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex gap-1">
                                <Button size="sm" className="h-7 flex-1 text-xs" onClick={saveSlot} disabled={savingSlot}>
                                  {isUrdu ? "محفوظ" : "Save"}
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => setSlotEdit(null)}>
                                  {isUrdu ? "منسوخ" : "Cancel"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={muted}
                              onClick={() => {
                                setSlotEdit({ periodId: row.id, dayOfWeek: dayIndex, subjectId: slot?.subjectId ?? null });
                                setSlotSubjectId(slot?.subjectId ?? null);
                              }}
                              className={cn(
                                "w-full rounded-md px-2 py-1.5 text-xs transition-colors",
                                muted ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : "bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer",
                              )}
                            >
                              {subject ? (subject.nameUrdu || subject.name) : (isUrdu ? "خالی" : "Empty")}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Dialog open={periodOpen} onOpenChange={(v) => !v && setPeriodOpen(false)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{isUrdu ? "پیریڈ شامل کریں / ترمیم کریں" : "Add / Edit Period"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div><Label>{isUrdu ? "شروعات کا وقت" : "Start Time"}</Label><Input value={periodForm.timeStart} onChange={(e) => setPeriodForm({ ...periodForm, timeStart: e.target.value })} placeholder="08:00" /></div>
                <div><Label>{isUrdu ? "اختتام کا وقت" : "End Time"}</Label><Input value={periodForm.timeEnd} onChange={(e) => setPeriodForm({ ...periodForm, timeEnd: e.target.value })} placeholder="08:40" /></div>
                <div><Label>{isUrdu ? "انگریزی لیبل" : "Label"}</Label><Input value={periodForm.label} onChange={(e) => setPeriodForm({ ...periodForm, label: e.target.value })} placeholder="Period 1" /></div>
                <div><Label className="font-urdu">اردو لیبل</Label><Input dir="rtl" className="font-urdu" value={periodForm.labelUrdu} onChange={(e) => setPeriodForm({ ...periodForm, labelUrdu: e.target.value })} /></div>
                <div className="flex items-center gap-2">
                  <input
                    id="isBreak"
                    type="checkbox"
                    checked={periodForm.isBreak}
                    onChange={(e) => setPeriodForm({ ...periodForm, isBreak: e.target.checked })}
                  />
                  <Label htmlFor="isBreak">{isUrdu ? "وقفہ" : "Break"}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPeriodOpen(false)}>{isUrdu ? "منسوخ" : "Cancel"}</Button>
                <Button onClick={savePeriod} disabled={saving}>{isUrdu ? "محفوظ" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isUrdu ? "پیریڈ حذف کریں" : "Delete Period"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isUrdu ? "کیا آپ واقعی اس پیریڈ کو حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this period?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isUrdu ? "منسوخ" : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? (isUrdu ? "حذف ہو رہا ہے..." : "Deleting...") : (isUrdu ? "حذف کریں" : "Delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
}
