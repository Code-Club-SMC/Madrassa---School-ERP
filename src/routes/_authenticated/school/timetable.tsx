import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { schoolClasses } from "@/mock/classes";
import { cn } from "@/lib/utils";
import { useSystem } from "@/components/system-context";
import { useLanguage } from "@/components/language-context";

export const Route = createFileRoute("/_authenticated/school/timetable")({
  component: SchoolTimetablePage,
});

const initialPeriods = [
  { time: "08:00 → 08:40", label: "Assembly", urdu: "اسمبلی", subjects: ["Assembly", "Assembly", "Assembly", "Assembly", "Assembly", "Assembly"] },
  { time: "08:40 → 09:20", label: "Period 1", urdu: "پہلا پیریڈ", subjects: ["Urdu", "English", "Math", "Science", "Islamiat", "Urdu"] },
  { time: "09:20 → 10:00", label: "Period 2", urdu: "دوسرا پیریڈ", subjects: ["English", "Math", "Urdu", "S.Studies", "Math", "English"] },
  { time: "10:00 → 10:40", label: "Period 3", urdu: "تیسرا پیریڈ", subjects: ["Math", "Science", "Islamiat", "English", "Urdu", "Math"] },
  { time: "10:40 → 11:00", label: "Break", urdu: "وقفہ", subjects: ["Break", "Break", "Break", "Break", "Break", "Break"] },
  { time: "11:00 → 11:40", label: "Period 4", urdu: "چوتھا پیریڈ", subjects: ["Science", "Urdu", "English", "Math", "Computer", "Science"] },
  { time: "11:40 → 12:20", label: "Period 5", urdu: "پانچواں پیریڈ", subjects: ["S.Studies", "Computer", "Science", "Islamiat", "English", "Arts"] },
  { time: "12:20 → 13:00", label: "Period 6", urdu: "چھٹا پیریڈ", subjects: ["Islamiat", "Arts", "PE", "Urdu", "Science", "S.Studies"] },
  { time: "13:00 → 13:30", label: "Zuhr · Dhuhr", urdu: "نمازِ ظہر", subjects: ["Prayer", "Prayer", "Prayer", "Prayer", "Prayer", "Prayer"] },
];
const daysEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const daysUr = ["پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];

function SchoolTimetablePage() {
  const { gender } = useSystem();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const visibleClasses = useMemo(
    () => schoolClasses.filter((c) => c.gender === gender),
    [gender],
  );

  const [cls, setCls] = useState<string>(visibleClasses[0]?.id ?? "");
  const [tables, setTables] = useState<Record<string, typeof initialPeriods>>({});
  const periods = tables[cls] ?? initialPeriods;
  const [edit, setEdit] = useState<{ row: number; col: number; value: string } | null>(null);
  const [timeEdit, setTimeEdit] = useState<{ row: number; time: string; urdu: string; label: string } | null>(null);
  const current = visibleClasses.find((c) => c.id === cls);

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

  function updateCell(row: number, col: number, value: string) {
    setTables((p) => {
      const base = p[cls] ?? initialPeriods.map((r) => ({ ...r, subjects: [...r.subjects] }));
      const next = base.map((r, i) => i === row ? { ...r, subjects: r.subjects.map((s, j) => j === col ? value : s) } : r);
      return { ...p, [cls]: next };
    });
    toast.success(isUrdu ? "پیریڈ اپ ڈیٹ ہو گیا" : "Period updated");
  }

  return (
    <div>
      <PageHeader
        title={pageTitle}
        titleUrdu={pageTitle}
        description={pageDesc}
        actions={
          <div className="flex items-center gap-2">
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder={isUrdu ? "کلاس منتخب کریں" : "Select class"} /></SelectTrigger>
              <SelectContent>
                {visibleClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} · <span className="font-urdu ms-1">{c.nameUrdu}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />{isUrdu ? "پرنٹ" : "Print"}</Button>
          </div>
        }
      />

      {visibleClasses.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {isUrdu
            ? "اس شعبے کے لیے کوئی کلاس دستیاب نہیں ہے۔"
            : "No classes available for this section yet."}
        </Card>
      ) : current ? (
        <>
          <Card className="p-4 mb-4 flex items-center justify-between bg-primary/5 border-primary/20">
            <div>
              <p className="font-urdu text-lg">{current.nameUrdu}</p>
              <p className="text-xs text-muted-foreground">{current.name} · 6 working days</p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {periods.filter((p) => !["Break", "Prayer", "Assembly"].includes(p.subjects[0])).length} {isUrdu ? "تعلیمی پیریڈز/دن" : "academic periods/day"}
            </p>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-start p-3 w-[170px] font-medium">{isUrdu ? "پیریڈ" : "Period"}</th>
                  {daysEn.map((d, i) => (
                    <th key={d} className="text-center p-3 font-medium">
                      <p className="font-urdu text-base leading-tight">{daysUr[i]}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{d}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-3 align-top">
                      <button
                        type="button"
                        onClick={() => setTimeEdit({ row: i, time: row.time, urdu: row.urdu, label: row.label })}
                        className="text-start hover:bg-accent/40 rounded-md px-1 py-0.5 -mx-1 transition-colors w-full"
                        aria-label={isUrdu ? "وقت ترمیم" : "Edit period time"}
                      >
                        <p className="font-mono text-xs">{row.time}</p>
                        <p className="font-urdu text-sm text-muted-foreground">{row.urdu}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{row.label}</p>
                      </button>
                    </td>
                    {row.subjects.map((subj, j) => {
                      const muted = ["Break", "Prayer", "Assembly"].includes(subj);
                      return (
                        <td key={j} className="p-2 text-center">
                          <button
                            type="button"
                            disabled={muted}
                            onClick={() => setEdit({ row: i, col: j, value: subj })}
                            className={cn(
                              "w-full rounded-md px-2 py-1.5 text-xs transition-colors",
                              muted ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : "bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer",
                            )}
                          >{subj}</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>{isUrdu ? "پیریڈ ترمیم · Edit Period" : "Edit Period · پیریڈ ترمیم"}</DialogTitle></DialogHeader>
              <div>
                <Label>{isUrdu ? "مضمون" : "Subject"}</Label>
                <Input value={edit?.value ?? ""} onChange={(e) => setEdit((p) => p ? { ...p, value: e.target.value } : p)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEdit(null)}>{isUrdu ? "منسوخ" : "Cancel"}</Button>
                <Button onClick={() => { if (edit) { updateCell(edit.row, edit.col, edit.value || "—"); setEdit(null); } }}>{isUrdu ? "محفوظ" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={!!timeEdit} onOpenChange={(v) => !v && setTimeEdit(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>{isUrdu ? "وقت ترمیم · Edit Period Time" : "Edit Period Time · وقت ترمیم"}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>{isUrdu ? "وقت" : "Time"}</Label><Input value={timeEdit?.time ?? ""} onChange={(e) => setTimeEdit((p) => p ? { ...p, time: e.target.value } : p)} placeholder="08:00 → 08:40" /></div>
                <div><Label>{isUrdu ? "انگریزی لیبل" : "Label"}</Label><Input value={timeEdit?.label ?? ""} onChange={(e) => setTimeEdit((p) => p ? { ...p, label: e.target.value } : p)} placeholder="Period 1" /></div>
                <div><Label className="font-urdu">اردو لیبل</Label><Input dir="rtl" className="font-urdu" value={timeEdit?.urdu ?? ""} onChange={(e) => setTimeEdit((p) => p ? { ...p, urdu: e.target.value } : p)} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTimeEdit(null)}>{isUrdu ? "منسوخ" : "Cancel"}</Button>
                <Button onClick={() => {
                  if (!timeEdit) return;
                  setTables((p) => {
                    const base = p[cls] ?? initialPeriods.map((r) => ({ ...r, subjects: [...r.subjects] }));
                    const next = base.map((r, i) => i === timeEdit.row ? { ...r, time: timeEdit.time || r.time, urdu: timeEdit.urdu || r.urdu, label: timeEdit.label || r.label } : r);
                    return { ...p, [cls]: next };
                  });
                  toast.success(isUrdu ? "وقت اپ ڈیٹ ہو گیا" : "Time updated"); setTimeEdit(null);
                }}>{isUrdu ? "محفوظ" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}
