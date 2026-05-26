import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarRange, Plus, Archive, AlertTriangle, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings/academic-year")({
  component: AcademicYearPage,
});

type Year = {
  id: string;
  gregorian: string;
  hijri: string;
  startDate: string;
  endDate: string;
  status: "active" | "archived" | "upcoming";
  carryForward: boolean;
};

const SEED: Year[] = [
  { id: "y-2023", gregorian: "2023–2024", hijri: "1445–1446", startDate: "2023-08-01", endDate: "2024-05-31", status: "archived", carryForward: true },
  { id: "y-2024", gregorian: "2024–2025", hijri: "1446–1447", startDate: "2024-08-01", endDate: "2025-05-31", status: "active", carryForward: true },
];

const STATUS_TONE: Record<Year["status"], string> = {
  active: "bg-chart-1/15 text-chart-5 border-chart-2/30 dark:text-chart-1",
  archived: "bg-muted text-muted-foreground border-border",
  upcoming: "bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-300",
};

function AcademicYearPage() {
  const [years, setYears] = useState<Year[]>(SEED);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ gregorian: "", hijri: "", startDate: "", endDate: "", carryForward: true });
  const active = years.find((y) => y.status === "active");

  function archive(id: string) {
    setYears((p) => p.map((y) => y.id === id ? { ...y, status: "archived" as const } : y));
    toast.success("Year archived");
  }
  function activate(id: string) {
    setYears((p) => p.map((y) => y.id === id ? { ...y, status: "active" as const } : y.status === "active" ? { ...y, status: "archived" as const } : y));
    toast.success("Year activated");
  }

  return (
    <div>
      <PageHeader
        title="Academic Year"
        titleUrdu="تعلیمی سال"
        description="Configure the current academic year. All exams, attendance, fees, and reports are anchored to this year."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New Year</Button>}
      />

      {active && (
        <Card className="p-6 mb-4 bg-primary/5 border-primary/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarRange className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Current Academic Year · موجودہ تعلیمی سال</p>
              </div>
              <h2 className="font-heading text-3xl font-bold mt-2">{active.gregorian}</h2>
              <p className="font-urdu text-lg text-muted-foreground mt-0.5">ہجری {active.hijri}</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
                <Row label="Start Date" value={formatDate(active.startDate)} />
                <Row label="End Date" value={formatDate(active.endDate)} />
                <Row label="Carry Forward" value={active.carryForward ? "Enabled" : "Disabled"} />
                <Row label="Status" value={<Badge variant="outline" className={STATUS_TONE.active}>Active</Badge>} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-heading font-semibold text-sm">All Academic Years · تمام سال</h3>
        </div>
        <div className="divide-y divide-border">
          {years.map((y) => (
            <div key={y.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Calendar className="h-4 w-4 text-muted-foreground" /></div>
                <div>
                  <p className="font-semibold text-sm">{y.gregorian}</p>
                  <p className="font-urdu text-sm text-muted-foreground">ہجری {y.hijri}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{formatDate(y.startDate)} → {formatDate(y.endDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={STATUS_TONE[y.status]}>{y.status}</Badge>
                {y.status === "active" ? (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => archive(y.id)}><Archive className="h-3.5 w-3.5" />Archive</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => activate(y.id)}>Activate</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Academic Year · نیا تعلیمی سال</DialogTitle></DialogHeader>
          {active && (
            <Alert variant="default" className="border-amber-300/40 bg-amber-100/50 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>An active year already exists</AlertTitle>
              <AlertDescription className="font-urdu">ایک سال پہلے سے فعال ہے — نیا سال فعال کرنے پر پرانا خود بخود آرکائیو ہو جائے گا۔</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Gregorian Year</Label><Input value={f.gregorian} onChange={(e) => setF({ ...f, gregorian: e.target.value })} placeholder="2025–2026" /></div>
              <div><Label>Hijri Year</Label><Input value={f.hijri} onChange={(e) => setF({ ...f, hijri: e.target.value })} placeholder="1447–1448" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Start Date</Label><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Carry Forward Students</p>
                <p className="text-xs text-muted-foreground">Re-enrol all active students into the new year with the same darja/class.</p>
              </div>
              <Switch checked={f.carryForward} onCheckedChange={(v) => setF({ ...f, carryForward: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!f.gregorian.trim() || !f.startDate || !f.endDate) { toast.error("Year label and dates required"); return; }
              setYears((p) => [
                ...p.map((y) => y.status === "active" ? { ...y, status: "archived" as const } : y),
                { id: `y-${Date.now()}`, gregorian: f.gregorian, hijri: f.hijri || "—", startDate: f.startDate, endDate: f.endDate, status: "active" as const, carryForward: f.carryForward },
              ]);
              toast.success("New academic year created");
              setF({ gregorian: "", hijri: "", startDate: "", endDate: "", carryForward: true });
              setOpen(false);
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}