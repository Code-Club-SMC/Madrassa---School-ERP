import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Check, X, Clock, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { students as allStudents } from "@/mock";

type Status = "present" | "absent" | "late";

const CLASSES = [
  { id: "g1", name: "Grade 1", nameUrdu: "پہلی جماعت" },
  { id: "g3", name: "Grade 3", nameUrdu: "تیسری جماعت" },
  { id: "g5", name: "Grade 5", nameUrdu: "پانچویں جماعت" },
  { id: "g8", name: "Grade 8", nameUrdu: "آٹھویں جماعت" },
  { id: "g10", name: "Grade 10", nameUrdu: "دسویں جماعت" },
];

export const Route = createFileRoute("/_authenticated/school/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [classId, setClassId] = useState("g3");
  const [section, setSection] = useState("A");
  const [marks, setMarks] = useState<Record<string, Status>>({});

  const roster = useMemo(
    () => allStudents.filter((s) => s.system === "school").slice(0, 14),
    []
  );

  const setStatus = (id: string, s: Status) =>
    setMarks((m) => ({ ...m, [id]: s }));

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, unmarked: 0 };
    roster.forEach((r) => {
      const v = marks[r.id];
      if (!v) c.unmarked++; else c[v]++;
    });
    return c;
  }, [marks, roster]);

  const klass = CLASSES.find((k) => k.id === classId)!;

  return (
    <div>
      <PageHeader
        title="School Attendance"
        titleUrdu="حاضری — اسکول"
        description="Daily attendance marking. Fridays and holidays are auto-skipped."
        actions={
          <Button size="sm" className="gap-1.5"><Save className="h-4 w-4" />Save Attendance</Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Class</label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLASSES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-urdu me-2">{c.nameUrdu}</span>
                    <span className="text-muted-foreground text-xs">{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Section</label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["A", "B", "C"].map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => {
              const all: Record<string, Status> = {};
              roster.forEach((r) => (all[r.id] = "present"));
              setMarks(all);
            }}>Mark All Present</Button>
            <Button size="sm" variant="ghost" onClick={() => setMarks({})}>Reset</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat tone="bg-chart-1/15 text-chart-5 dark:text-chart-1" label="Present" urdu="حاضر" value={counts.present} />
        <Stat tone="bg-destructive/10 text-destructive" label="Absent" urdu="غیر حاضر" value={counts.absent} />
        <Stat tone="bg-amber-500/10 text-amber-700 dark:text-amber-400" label="Late" urdu="دیر سے" value={counts.late} />
        <Stat tone="bg-muted text-muted-foreground" label="Unmarked" urdu="باقی" value={counts.unmarked} />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-urdu text-base">{klass.nameUrdu} · سیکشن {section}</p>
            <p className="text-xs text-muted-foreground">{klass.name} · Section {section} · {date}</p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{roster.length} students</span>
        </div>
        <div className="divide-y divide-border">
          {roster.map((s) => {
            const status = marks[s.id];
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-muted/30">
                <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{s.name.split(" ").map(p => p[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-urdu text-sm leading-tight">{s.nameUrdu}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{s.rollNo}</p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusButton active={status === "present"} tone="present" onClick={() => setStatus(s.id, "present")} icon={<Check className="h-3.5 w-3.5" />} label="P" />
                  <StatusButton active={status === "late"} tone="late" onClick={() => setStatus(s.id, "late")} icon={<Clock className="h-3.5 w-3.5" />} label="L" />
                  <StatusButton active={status === "absent"} tone="absent" onClick={() => setStatus(s.id, "absent")} icon={<X className="h-3.5 w-3.5" />} label="A" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Stat({ tone, label, urdu, value }: { tone: string; label: string; urdu: string; value: number }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", tone)}>
          <CalendarCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold font-mono leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label} · <span className="font-urdu">{urdu}</span></p>
        </div>
      </div>
    </Card>
  );
}

function StatusButton({ active, tone, onClick, icon, label }: { active: boolean; tone: "present" | "late" | "absent"; onClick: () => void; icon: React.ReactNode; label: string }) {
  const tones = {
    present: active ? "bg-chart-1 text-white border-chart-1" : "hover:bg-chart-1/10 hover:text-chart-5 dark:hover:text-chart-1 border-border",
    late: active ? "bg-amber-500 text-white border-amber-500" : "hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 border-border",
    absent: active ? "bg-destructive text-white border-destructive" : "hover:bg-destructive/10 hover:text-destructive border-border",
  };
  return (
    <button onClick={onClick} className={cn("h-8 w-10 inline-flex items-center justify-center gap-1 rounded-md border text-xs font-semibold transition-colors", tones[tone])}>
      {icon}<span>{label}</span>
    </button>
  );
}
