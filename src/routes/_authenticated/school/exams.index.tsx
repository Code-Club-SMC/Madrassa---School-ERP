import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardList, Plus, Calendar, Grid3x3, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/school/exams/")({
  component: ExamsPage,
});

type Series = {
  id: string; name: string; nameUrdu: string;
  type: "monthly" | "quarterly" | "halfyearly" | "annual" | "board";
  status: "Upcoming" | "Active" | "Completed";
  startDate: string; endDate: string;
  classes: string[];
  subjects: number;
};

const SEED: Series[] = [
  { id: "ex-q1", name: "First Quarterly 2025", nameUrdu: "پہلا سہ ماہی امتحان", type: "quarterly", status: "Completed", startDate: "2025-06-10", endDate: "2025-06-20", classes: ["Grade 1–5"], subjects: 6 },
  { id: "ex-mid", name: "Mid-Term / Half-Yearly 2025", nameUrdu: "نصف سالہ امتحان", type: "halfyearly", status: "Completed", startDate: "2025-09-15", endDate: "2025-09-28", classes: ["Grade 1–10"], subjects: 8 },
  { id: "ex-q3", name: "Third Quarterly 2025", nameUrdu: "تیسرا سہ ماہی امتحان", type: "quarterly", status: "Active", startDate: "2025-12-05", endDate: "2025-12-15", classes: ["Grade 1–8"], subjects: 6 },
  { id: "ex-ann", name: "Annual Examination 2026", nameUrdu: "سالانہ امتحان", type: "annual", status: "Upcoming", startDate: "2026-03-01", endDate: "2026-03-25", classes: ["All Classes"], subjects: 10 },
  { id: "ex-ssc1", name: "SSC Part I (BISE Prep)", nameUrdu: "میٹرک حصہ اول — بورڈ تیاری", type: "board", status: "Upcoming", startDate: "2026-02-10", endDate: "2026-02-22", classes: ["Grade 9 — Science", "Grade 9 — Arts"], subjects: 8 },
];

const STATUS_TONE: Record<Series["status"], string> = {
  Upcoming: "bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-300",
  Active: "bg-chart-1/15 text-chart-5 border-chart-2/30 dark:text-chart-1",
  Completed: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABEL: Record<Series["type"], string> = {
  monthly: "ماہانہ ٹیسٹ",
  quarterly: "سہ ماہی",
  halfyearly: "نصف سالہ",
  annual: "سالانہ",
  board: "BISE بورڈ",
};

function ExamsPage() {
  const [series, setSeries] = useState<Series[]>(SEED);
  const [newOpen, setNewOpen] = useState(false);
  const [seating, setSeating] = useState<Series | null>(null);
  return (
    <div>
      <PageHeader
        title="School Examinations"
        titleUrdu="امتحانات — اسکول"
        description="Pakistani exam cycle — Monthly, Quarterly, Half-Yearly, Annual + BISE board preparatory exams for Grade 9–12."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" />New Exam Series</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {series.map((s) => (
          <Card key={s.id} className="p-5 flex flex-col hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{s.name}</p>
                <p className="font-urdu text-base text-muted-foreground mt-0.5">{s.nameUrdu}</p>
              </div>
              <Badge variant="outline" className={STATUS_TONE[s.status]}>{s.status}</Badge>
            </div>

            <div className="space-y-2 text-xs flex-1">
              <Row icon={<FileText className="h-3.5 w-3.5" />} label="Type" value={<span className="font-urdu">{TYPE_LABEL[s.type]}</span>} />
              <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Dates" value={`${formatDate(s.startDate)} → ${formatDate(s.endDate)}`} />
              <Row icon={<Grid3x3 className="h-3.5 w-3.5" />} label="Subjects" value={`${s.subjects} subjects`} />
              <div className="flex flex-wrap gap-1 pt-1">
                {s.classes.map((c) => (
                  <span key={c} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{c}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info("Schedule view — exam detail page")}>Schedule</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setSeating(s)}>Seating</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info(s.status === "Completed" ? "Opening results…" : "Marks entry opens after exam date")}>{s.status === "Completed" ? "Results" : "Marks"}</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 mt-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Pakistani Grading Scale (BISE)</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-mono">A1 (80%+)</span> ممتاز · <span className="font-mono">A (70–79%)</span> بہت اچھا · <span className="font-mono">B (60–69%)</span> اچھا · <span className="font-mono">C (50–59%)</span> اوسط · <span className="font-mono">D (40–49%)</span> کم اوسط · <span className="font-mono">F (&lt;33%)</span> ناکام
            </p>
          </div>
        </div>
      </Card>

      <NewSeriesDialog open={newOpen} onOpenChange={setNewOpen} onAdd={(s) => setSeries((p) => [s, ...p])} />

      <Dialog open={!!seating} onOpenChange={(v) => !v && setSeating(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Seating Plan — {seating?.name}</DialogTitle></DialogHeader>
          <p className="font-urdu text-sm text-muted-foreground -mt-2">{seating?.nameUrdu} · نشست بندی</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {["Hall A", "Hall B", "Room 1", "Room 2"].map((r) => (
              <Card key={r} className="p-3">
                <p className="text-xs font-semibold">{r}</p>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {Array.from({ length: 16 }).map((_, i) => <div key={i} className="aspect-square rounded bg-primary/10 text-primary text-[9px] flex items-center justify-center font-mono">{i + 1}</div>)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">16 seats · class colour-coded</p>
              </Card>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => window.print()}>Print</Button><Button onClick={() => setSeating(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function NewSeriesDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (s: Series) => void }) {
  const [f, setF] = useState({ name: "", nameUrdu: "", type: "quarterly" as Series["type"], startDate: "", endDate: "", subjects: 6 });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Exam Series · نیا امتحان</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. First Quarterly 2026" /></div>
            <div><Label className="font-urdu">اردو نام</Label><Input dir="rtl" className="font-urdu" value={f.nameUrdu} onChange={(e) => setF({ ...f, nameUrdu: e.target.value })} /></div>
          </div>
          <div><Label>Type</Label>
            <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as Series["type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Test · ماہانہ</SelectItem>
                <SelectItem value="quarterly">Quarterly · سہ ماہی</SelectItem>
                <SelectItem value="halfyearly">Half-Yearly · نصف سالہ</SelectItem>
                <SelectItem value="annual">Annual · سالانہ</SelectItem>
                <SelectItem value="board">BISE Board Prep · بورڈ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Start</Label><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
            <div><Label>End</Label><Input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
            <div><Label>Subjects</Label><Input type="number" value={f.subjects} onChange={(e) => setF({ ...f, subjects: +e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!f.name.trim() || !f.startDate || !f.endDate) { toast.error("Name and dates required"); return; }
            onAdd({ id: `ex-${Date.now()}`, name: f.name, nameUrdu: f.nameUrdu || f.name, type: f.type, status: "Upcoming", startDate: f.startDate, endDate: f.endDate, classes: ["All Classes"], subjects: f.subjects });
            toast.success("Exam series created");
            onOpenChange(false);
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
