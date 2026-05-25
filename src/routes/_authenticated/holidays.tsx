import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { holidays as seedHolidays } from "@/mock/holidays";
import type { Holiday } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/holidays")({
  component: HolidaysPage,
});

type HolidayType = Holiday["type"] | "weekly_off" | "vacation" | "exam";

const TYPE_META: Record<string, { label: string; urdu: string; tone: string; dot: string }> = {
  national: { label: "Public", urdu: "سرکاری چھٹی", tone: "bg-[oklch(0.93_0.07_25)] dark:bg-[oklch(0.32_0.08_25)] text-[oklch(0.34_0.14_25)] dark:text-[oklch(0.90_0.07_25)] border-[oklch(0.80_0.12_25)]", dot: "bg-[oklch(0.65_0.18_25)]" },
  religious: { label: "Islamic", urdu: "اسلامی تہوار", tone: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300/50", dot: "bg-amber-500" },
  institutional: { label: "Institutional", urdu: "ادارہ", tone: "bg-[oklch(0.93_0.06_280)] dark:bg-[oklch(0.32_0.08_280)] text-[oklch(0.34_0.14_280)] dark:text-[oklch(0.90_0.07_280)] border-[oklch(0.80_0.12_280)]", dot: "bg-[oklch(0.55_0.18_280)]" },
  vacation: { label: "Vacation", urdu: "تعطیلات", tone: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300/50", dot: "bg-blue-500" },
  exam: { label: "Exam", urdu: "امتحانی دن", tone: "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-300/50", dot: "bg-purple-500" },
  weekly_off: { label: "Weekly Off", urdu: "ہفتہ وار", tone: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_UR = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function HolidaysPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [items, setItems] = useState<Holiday[]>(seedHolidays);
  const [weeklyOff, setWeeklyOff] = useState<number[]>([5]); // Fri default (madrassa)

  const monthLabel = useMemo(() => new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" }), [year, month]);

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();
    const cells: { iso: string | null; d: number | null; weekday: number }[] = [];
    for (let i = 0; i < lead; i++) cells.push({ iso: null, d: null, weekday: i });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ iso: toISO(year, month, d), d, weekday: date.getDay() });
    }
    while (cells.length % 7 !== 0) cells.push({ iso: null, d: null, weekday: cells.length % 7 });
    return cells;
  }, [year, month]);

  const byDate = useMemo(() => {
    const m = new Map<string, Holiday>();
    items.forEach((h) => m.set(h.date, h));
    return m;
  }, [items]);

  function navMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function upsert(date: string, partial: Partial<Holiday>) {
    setItems((prev) => {
      const existing = prev.find((h) => h.date === date);
      if (existing) {
        toast.success("Holiday updated");
        return prev.map((h) => h.date === date ? { ...h, ...partial } : h);
      }
      toast.success("Holiday added");
      return [...prev, {
        id: `h-${Date.now()}`,
        date,
        nameEnglish: partial.nameEnglish ?? "Holiday",
        nameUrdu: partial.nameUrdu ?? "چھٹی",
        type: (partial.type as Holiday["type"]) ?? "institutional",
        recurring: partial.recurring ?? false,
      }];
    });
  }

  function remove(date: string) {
    setItems((prev) => prev.filter((h) => h.date !== date));
    toast.success("Holiday removed");
  }

  function toggleWeekly(d: number) {
    setWeeklyOff((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  const monthHolidays = useMemo(
    () => items
      .filter((h) => h.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [items, year, month],
  );

  return (
    <div>
      <PageHeader
        title="Holiday & Vacation Calendar"
        titleUrdu="چھٹیوں کا کیلنڈر"
        description="National, religious and institutional holidays. Marked dates are excluded from attendance automatically."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Calendar */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navMonth(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navMonth(1)} aria-label="Next month"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></Button>
              <p className="font-heading text-lg font-bold ms-2">{monthLabel}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth()); }}>Today</Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS_EN.map((w, i) => (
              <div key={w} className={cn("text-center text-[10px] uppercase tracking-wide py-1", weeklyOff.includes(i) ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-muted-foreground")}>
                <div>{w}</div>
                <div className="font-urdu text-[10px]" dir="rtl">{WEEKDAYS_UR[i]}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((cell, i) => {
              if (!cell.iso) return <div key={i} className="aspect-square" />;
              const h = byDate.get(cell.iso);
              const isWeeklyOff = weeklyOff.includes(cell.weekday);
              const meta = h ? TYPE_META[h.type] : isWeeklyOff ? TYPE_META.weekly_off : null;
              const isToday = cell.iso === toISO(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <Popover key={i}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "aspect-square rounded-md border p-1.5 text-start text-xs transition hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary",
                        meta?.tone ?? "border-border bg-card",
                        isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-sm font-semibold">{cell.d}</span>
                        {meta && <span className={cn("h-1.5 w-1.5 rounded-full mt-1", meta.dot)} />}
                      </div>
                      {h && <p className="font-urdu text-[10px] mt-1 truncate" dir="rtl">{h.nameUrdu}</p>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="start">
                    <DayEditor
                      date={cell.iso}
                      holiday={h}
                      onSave={(p) => upsert(cell.iso!, p)}
                      onDelete={() => remove(cell.iso!)}
                    />
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
            {Object.entries(TYPE_META).map(([k, m]) => (
              <span key={k} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px]", m.tone)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                {m.label} <span className="font-urdu" dir="rtl">· {m.urdu}</span>
              </span>
            ))}
          </div>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <p className="font-heading text-sm font-bold mb-2">Weekly Off Days · ہفتہ وار چھٹی</p>
            <p className="text-xs text-muted-foreground mb-3">School: Sunday. Madrassa: Friday. Configure your institution's days off.</p>
            <div className="space-y-1.5">
              {WEEKDAYS_EN.map((w, i) => (
                <label key={w} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                  <Checkbox checked={weeklyOff.includes(i)} onCheckedChange={() => toggleWeekly(i)} />
                  <span className="text-sm flex-1">{w}</span>
                  <span className="font-urdu text-xs text-muted-foreground" dir="rtl">{WEEKDAYS_UR[i]}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <p className="font-heading text-sm font-bold mb-2">Holidays this month · اس ماہ کی چھٹیاں</p>
            {monthHolidays.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No holidays this month.</p>
            ) : (
              <ul className="space-y-2">
                {monthHolidays.map((h) => {
                  const m = TYPE_META[h.type];
                  return (
                    <li key={h.id} className="flex items-start gap-2 text-xs">
                      <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", m.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{h.nameEnglish}</p>
                        <p className="font-urdu text-muted-foreground truncate" dir="rtl">{h.nameUrdu}</p>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{h.date.slice(8)} {new Date(h.date).toLocaleString("en-US", { weekday: "short" })}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function DayEditor({ date, holiday, onSave, onDelete }: { date: string; holiday: Holiday | undefined; onSave: (p: Partial<Holiday>) => void; onDelete: () => void }) {
  const [name, setName] = useState(holiday?.nameEnglish ?? "");
  const [urdu, setUrdu] = useState(holiday?.nameUrdu ?? "");
  const [type, setType] = useState<Holiday["type"]>(holiday?.type ?? "institutional");
  const [recurring, setRecurring] = useState(holiday?.recurring ?? false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{new Date(date).toDateString()}</p>
        {holiday && <Badge variant="outline" className="text-[10px]">existing</Badge>}
      </div>
      <div className="grid gap-2">
        <div>
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Independence Day" className="h-8" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-urdu" dir="rtl">اردو نام</Label>
          <Input value={urdu} onChange={(e) => setUrdu(e.target.value)} dir="rtl" className="h-8 font-urdu" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as Holiday["type"])}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="national">Public · سرکاری</SelectItem>
              <SelectItem value="religious">Islamic · اسلامی</SelectItem>
              <SelectItem value="institutional">Institutional · ادارہ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <Checkbox checked={recurring} onCheckedChange={(v) => setRecurring(!!v)} />
          Recurring each year · ہر سال
        </label>
      </div>
      <div className="flex gap-2 pt-2 border-t border-border">
        {holiday && <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" />Remove</Button>}
        <Button size="sm" className="ms-auto gap-1" onClick={() => {
          if (!name.trim()) { toast.error("Name required"); return; }
          onSave({ nameEnglish: name, nameUrdu: urdu || name, type, recurring });
        }}><Plus className="h-3 w-3" />{holiday ? "Update" : "Add"}</Button>
      </div>
    </div>
  );
}