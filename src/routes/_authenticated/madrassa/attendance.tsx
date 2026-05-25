import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, X, Clock, Save, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { madrassaCategories, students, type AttendanceStatus } from "@/mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/madrassa/attendance")({
  component: AttendancePage,
});

const today = new Date().toISOString().slice(0, 10);

function AttendancePage() {
  const [date, setDate] = useState(today);
  const [subId, setSubId] = useState(madrassaCategories[0].subcategories[0].id);
  const cohort = useMemo(() => students.filter((s) => s.system === "madrassa" && s.subcategoryId === subId), [subId]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});

  const counts = useMemo(() => {
    const out = { present: 0, absent: 0, late: 0, unmarked: 0 };
    cohort.forEach((s) => {
      const m = marks[s.id];
      if (!m) out.unmarked++;
      else out[m]++;
    });
    return out;
  }, [cohort, marks]);

  const setAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    cohort.forEach((s) => (next[s.id] = status));
    setMarks(next);
  };

  const save = () => toast.success(`Attendance saved · ${counts.present + counts.absent + counts.late}/${cohort.length}`, { description: "حاضری محفوظ ہوگئی" });

  return (
    <div>
      <PageHeader title="Madrassa Attendance" titleUrdu="مدرسہ کی حاضری" description="Mark daily attendance per sub-category." />

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Date · تاریخ</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1.5 block">Sub-category · ذیلی قسم</label>
            <Select value={subId} onValueChange={setSubId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {madrassaCategories.map((c) => c.subcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}><span className="font-urdu">{s.nameUrdu}</span><span className="text-xs text-muted-foreground ms-2">{c.name} · {s.name}</span></SelectItem>
                )))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <Pill label="Present" urdu="حاضر" count={counts.present} className="bg-chart-1/15 text-chart-5 dark:text-chart-1" />
          <Pill label="Absent" urdu="غیر حاضر" count={counts.absent} className="bg-destructive/10 text-destructive" />
          <Pill label="Late" urdu="دیر سے" count={counts.late} className="bg-amber-500/15 text-amber-700 dark:text-amber-400" />
          <Pill label="Unmarked" urdu="بقیہ" count={counts.unmarked} className="bg-muted text-muted-foreground" />
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setAll("present")}>Mark all present</Button>
          <Button size="sm" variant="outline" onClick={() => setMarks({})}>Clear</Button>
          <Button size="sm" onClick={save} className="gap-1.5"><Save className="h-3.5 w-3.5" />Save</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {cohort.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No students in this cohort.</div>
          ) : cohort.map((s) => {
            const m = marks[s.id];
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar className="h-9 w-9"><AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{s.name[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-urdu text-sm">{s.nameUrdu}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{s.rollNo}</p>
                </div>
                <div className="flex gap-1">
                  <MarkBtn active={m === "present"} onClick={() => setMarks({ ...marks, [s.id]: "present" })} className="text-chart-5 dark:text-chart-1 data-[active=true]:bg-chart-1/20"><Check className="h-4 w-4" /></MarkBtn>
                  <MarkBtn active={m === "late"} onClick={() => setMarks({ ...marks, [s.id]: "late" })} className="text-amber-700 dark:text-amber-400 data-[active=true]:bg-amber-500/20"><Clock className="h-4 w-4" /></MarkBtn>
                  <MarkBtn active={m === "absent"} onClick={() => setMarks({ ...marks, [s.id]: "absent" })} className="text-destructive data-[active=true]:bg-destructive/15"><X className="h-4 w-4" /></MarkBtn>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Pill({ label, urdu, count, className }: { label: string; urdu: string; count: number; className: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1", className)}>
      <span className="font-mono tabular-nums">{count}</span>
      <span>{label}</span>
      <span className="font-urdu opacity-80">{urdu}</span>
    </span>
  );
}

function MarkBtn({ children, active, onClick, className }: { children: React.ReactNode; active: boolean; onClick: () => void; className?: string }) {
  return (
    <button type="button" data-active={active} onClick={onClick} className={cn("h-8 w-8 rounded-lg border border-border flex items-center justify-center transition-colors hover:bg-muted", className)}>
      {children}
    </button>
  );
}
