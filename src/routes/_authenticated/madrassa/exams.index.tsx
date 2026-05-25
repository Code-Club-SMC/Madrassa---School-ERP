import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardList, Plus, Calendar, Grid3x3, FileText, BookMarked } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/madrassa/exams/")({
  component: MadrassaExamsPage,
});

type MType = "sahmahi" | "nisfussana" | "salanah" | "wifaqi" | "zimni";
type Status = "Upcoming" | "Active" | "Completed";
type Series = {
  id: string; name: string; nameUrdu: string; type: MType; status: Status;
  startDate: string; endDate: string; darjat: string[]; subjects: number;
  hijriYear?: string; wifaqBoard?: string;
};

const SEED: Series[] = [
  { id: "mex-sm1", name: "First Sah Mahi 1447", nameUrdu: "پہلا سہ ماہی امتحان", type: "sahmahi", status: "Completed", startDate: "2025-08-01", endDate: "2025-08-08", darjat: ["قاعدہ", "ناظرہ", "حفظ ابتدائی"], subjects: 4 },
  { id: "mex-nm1", name: "Nisfus Sana 1447", nameUrdu: "نصف السنہ امتحان", type: "nisfussana", status: "Completed", startDate: "2025-11-01", endDate: "2025-11-12", darjat: ["تمام درجات"], subjects: 8 },
  { id: "mex-sl1", name: "Salanah 1447", nameUrdu: "سالانہ امتحان", type: "salanah", status: "Active", startDate: "2026-04-15", endDate: "2026-05-05", darjat: ["تمام درجات"], subjects: 10 },
  { id: "mex-wf1", name: "Wifaqi Salanah (Wifaq)", nameUrdu: "وفاقی سالانہ امتحان", type: "wifaqi", status: "Upcoming", startDate: "2026-05-20", endDate: "2026-06-05", darjat: ["ثانویہ عامہ +"], subjects: 6, hijriYear: "1447", wifaqBoard: "Wifaq ul Madaris Al-Arabia" },
  { id: "mex-zm1", name: "Zimni Supplementary", nameUrdu: "ضمنی امتحان", type: "zimni", status: "Upcoming", startDate: "2026-08-01", endDate: "2026-08-05", darjat: ["ناکام طلبہ"], subjects: 3, hijriYear: "1447", wifaqBoard: "Wifaq ul Madaris Al-Arabia" },
];

const STATUS_TONE: Record<Status, string> = {
  Upcoming: "bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-300",
  Active: "bg-chart-1/15 text-chart-5 border-chart-2/30 dark:text-chart-1",
  Completed: "bg-muted text-muted-foreground border-border",
};
const TYPE_LABEL: Record<MType, string> = {
  sahmahi: "سہ ماہی",
  nisfussana: "نصف السنہ",
  salanah: "سالانہ",
  wifaqi: "وفاقی · بورڈ",
  zimni: "ضمنی · سپلیمنٹری",
};

function MadrassaExamsPage() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series[]>(SEED);
  const [tab, setTab] = useState<"internal" | "board">("internal");
  const [open, setOpen] = useState(false);
  const [seating, setSeating] = useState<Series | null>(null);

  const visible = series.filter((s) => tab === "internal" ? ["sahmahi", "nisfussana", "salanah"].includes(s.type) : ["wifaqi", "zimni"].includes(s.type));

  return (
    <div>
      <PageHeader
        title="Madrassa Examinations"
        titleUrdu="امتحانات — مدرسہ"
        description="Internal: Sah Mahi · Nisfus Sana · Salanah. External: Wifaqi Salanah & Zimni board exams. Same workflow as school exams with Wifaq-specific Hijri year and board fields."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New Exam Series</Button>}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="internal">Internal · داخلی</TabsTrigger>
          <TabsTrigger value="board">Wifaq Board · وفاق</TabsTrigger>
        </TabsList>
        <TabsContent value="internal" />
        <TabsContent value="board" />
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((s) => (
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
              {s.hijriYear && <Row icon={<BookMarked className="h-3.5 w-3.5" />} label="Hijri Year" value={`${s.hijriYear}H`} />}
              {s.wifaqBoard && <p className="text-[10px] text-muted-foreground italic pt-1">{s.wifaqBoard}</p>}
              <div className="flex flex-wrap gap-1 pt-1">
                {s.darjat.map((c) => <span key={c} className="font-urdu text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">{c}</span>)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info("Schedule view — coming up in detail page")}>Schedule</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate({ to: "/madrassa/exams/$id/seating", params: { id: s.id } })}>Seating</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info(s.status === "Completed" ? "Opening results…" : "Marks entry opens after exam date")}>{s.status === "Completed" ? "Results" : "Marks"}</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 mt-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Wifaq Grading Scale · وفاق کا گریڈنگ سسٹم</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-mono">ممتاز (80%+)</span> · <span className="font-mono">جید جداً (70–79%)</span> · <span className="font-mono">جید (60–69%)</span> · <span className="font-mono">مقبول (50–59%)</span> · <span className="font-mono">راسب (&lt;50%)</span> ناکام
            </p>
          </div>
        </div>
      </Card>

      <NewExamDialog open={open} onOpenChange={setOpen} onAdd={(s) => setSeries((p) => [s, ...p])} />
      <SeatingDialog series={seating} onClose={() => setSeating(null)} />
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

function NewExamDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (s: Series) => void }) {
  const [f, setF] = useState({ name: "", nameUrdu: "", type: "sahmahi" as MType, startDate: "", endDate: "", hijriYear: "1447" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Exam Series · نیا امتحان</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><Label className="font-urdu">اردو نام</Label><Input dir="rtl" className="font-urdu" value={f.nameUrdu} onChange={(e) => setF({ ...f, nameUrdu: e.target.value })} /></div>
          </div>
          <div><Label>Type</Label>
            <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as MType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABEL) as MType[]).map((k) => <SelectItem key={k} value={k}><span className="capitalize">{k}</span> · <span className="font-urdu">{TYPE_LABEL[k]}</span></SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Start</Label><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
            <div><Label>End</Label><Input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
            {(f.type === "wifaqi" || f.type === "zimni") && <div><Label>Hijri Year</Label><Input value={f.hijriYear} onChange={(e) => setF({ ...f, hijriYear: e.target.value })} /></div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!f.name.trim() || !f.startDate || !f.endDate) { toast.error("Name and dates required"); return; }
            onAdd({
              id: `mex-${Date.now()}`, name: f.name, nameUrdu: f.nameUrdu || f.name, type: f.type, status: "Upcoming",
              startDate: f.startDate, endDate: f.endDate, darjat: ["تمام درجات"], subjects: 0,
              ...(f.type === "wifaqi" || f.type === "zimni" ? { hijriYear: f.hijriYear, wifaqBoard: "Wifaq ul Madaris Al-Arabia" } : {}),
            });
            toast.success("Exam series created");
            onOpenChange(false);
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SeatingDialog({ series, onClose }: { series: Series | null; onClose: () => void }) {
  const rooms = ["Hall A", "Hall B", "Room 1", "Room 2"];
  return (
    <Dialog open={!!series} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Seating Plan — {series?.name}</DialogTitle></DialogHeader>
        <p className="font-urdu text-sm text-muted-foreground -mt-2">{series?.nameUrdu} · نشست بندی</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {rooms.map((r) => (
            <Card key={r} className="p-3">
              <p className="text-xs font-semibold">{r}</p>
              <div className="grid grid-cols-4 gap-1 mt-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded bg-primary/10 text-primary text-[9px] flex items-center justify-center font-mono">{i + 1}</div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">16 seats · بنین + بنات على نفس الجدول</p>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}