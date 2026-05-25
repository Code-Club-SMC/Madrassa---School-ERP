import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, Lock, Unlock, ClipboardPaste, Calculator, Download, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { students } from "@/mock";

export const Route = createFileRoute("/_authenticated/madrassa/exams/$id/marks")({
  component: MarksEntry,
});

const SUBJECTS = [
  { id: "su1", name: "Hifz", urdu: "حفظ", total: 100 },
  { id: "su2", name: "Nazira", urdu: "ناظرہ", total: 100 },
  { id: "su3", name: "Tajweed", urdu: "تجوید", total: 100 },
  { id: "su4", name: "Sarf", urdu: "صرف", total: 100 },
  { id: "su5", name: "Nahw", urdu: "نحو", total: 100 },
];

function MarksEntry() {
  const { id } = useParams({ from: "/_authenticated/madrassa/exams/$id/marks" });
  const list = students.filter((s) => s.system === "madrassa").slice(0, 12);
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const subject = SUBJECTS.find((s) => s.id === subjectId)!;
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(list.map((s, i) => [s.id, Object.fromEntries(SUBJECTS.map((sub, j) => [sub.id, 40 + ((i * 7 + j * 5) % 50)]))])),
  );
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const stats = useMemo(() => {
    const vals = list.map((s) => marks[s.id]?.[subjectId] ?? 0);
    const pass = vals.filter((v) => v >= 50).length;
    const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const top = Math.max(...vals);
    return { pass, fail: vals.length - pass, avg: Math.round(avg), top, total: vals.length };
  }, [marks, subjectId, list]);

  const isLocked = !!locked[subjectId];

  const applyPaste = () => {
    const rows = pasteText.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
    let updated = 0;
    const next = { ...marks };
    rows.forEach((row) => {
      const parts = row.split(/[\t,;|]/).map((p) => p.trim());
      if (parts.length < 2) return;
      const [rollOrName, mark] = parts;
      const m = Number(mark);
      if (Number.isNaN(m)) return;
      const stu = list.find((s) => s.rollNo === rollOrName || s.name.toLowerCase().includes(rollOrName.toLowerCase()));
      if (!stu) return;
      next[stu.id] = { ...next[stu.id], [subjectId]: Math.max(0, Math.min(subject.total, m)) };
      updated++;
    });
    setMarks(next);
    setPasteOpen(false);
    setPasteText("");
    toast.success(`${updated} mark${updated === 1 ? "" : "s"} updated from clipboard`);
  };

  const exportCsv = () => {
    const header = ["Roll", "Name", ...SUBJECTS.map((s) => s.name)].join(",");
    const rows = list.map((s) => [s.rollNo, s.name, ...SUBJECTS.map((sub) => marks[s.id]?.[sub.id] ?? 0)].join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `marks-exam-${id}.csv`;
    a.click();
  };

  return (
    <div>
      <Link to="/madrassa/exams/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back</Link>
      <PageHeader
        title="Mark Entry"
        titleUrdu="نمبر درج کریں"
        description="Enter marks subject-by-subject. Bulk paste, CSV export, and per-subject lock prevent accidental edits after publishing."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={exportCsv}><Download className="h-3.5 w-3.5" />Export CSV</Button>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={isLocked} onClick={() => setPasteOpen(true)}><ClipboardPaste className="h-3.5 w-3.5" />Bulk Paste</Button>
            <Button size="sm" className="gap-1.5" disabled={isLocked} onClick={() => toast.success(`Marks saved for ${subject.name}`)}><Save className="h-3.5 w-3.5" />Save</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
        <Card className="p-3 col-span-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Subject:</span>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-[200px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · <span className="font-urdu ms-1">{s.urdu}</span></SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant={isLocked ? "default" : "outline"} className="gap-1.5 h-8" onClick={() => { setLocked((p) => ({ ...p, [subjectId]: !p[subjectId] })); toast.success(isLocked ? "Subject unlocked" : "Subject locked — marks finalized"); }}>
              {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {isLocked ? "Locked" : "Unlocked"}
            </Button>
          </div>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground">PASS RATE</p>
          <p className="font-heading text-lg font-bold text-chart-1">{stats.pass}/{stats.total}</p>
          <Progress value={(stats.pass / Math.max(stats.total, 1)) * 100} className="h-1 mt-1" />
        </Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground">CLASS AVG</p><p className="font-heading text-lg font-bold">{stats.avg}<span className="text-xs text-muted-foreground">/{subject.total}</span></p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground">TOP SCORE</p><p className="font-heading text-lg font-bold text-primary">{stats.top}</p></Card>
      </div>

      {isLocked && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 mb-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <Lock className="h-3.5 w-3.5" />
          <span>This subject is locked. Marks are read-only. Unlock to make changes (requires audit log entry).</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Roll</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Darja</TableHead>
              <TableHead className="text-end">Marks ({subject.total})</TableHead>
              <TableHead className="text-end">All Subjects</TableHead>
              <TableHead className="text-end">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((s) => {
              const m = marks[s.id]?.[subjectId] ?? 0;
              const pass = m >= 50;
              const all = SUBJECTS.reduce((sum, sub) => sum + (marks[s.id]?.[sub.id] ?? 0), 0);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                  <TableCell><p className="font-medium text-sm">{s.name}</p><p className="font-urdu text-sm text-muted-foreground">{s.nameUrdu}</p></TableCell>
                  <TableCell><span className="font-urdu text-sm">حفظ ابتدائی</span></TableCell>
                  <TableCell className="text-end">
                    <Input type="number" max={subject.total} min={0} disabled={isLocked}
                      className="h-8 w-20 ms-auto text-end font-mono"
                      value={m}
                      onChange={(e) => setMarks((p) => ({ ...p, [s.id]: { ...p[s.id], [subjectId]: Math.max(0, Math.min(subject.total, +e.target.value)) } }))} />
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs text-muted-foreground">{all}/{SUBJECTS.length * 100}</TableCell>
                  <TableCell className="text-end">
                    {pass ? <Badge className="bg-chart-1/15 text-chart-1 border-0 text-[10px]">Pass · پاس</Badge> : <Badge variant="destructive" className="text-[10px]">Fail · ناکام</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><ClipboardPaste className="h-5 w-5 text-primary" />Bulk Paste Marks</DialogTitle>
            <DialogDescription>
              Paste rows from Excel / Sheets. Format: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">RollNo, Marks</code> per line.
              Separators allowed: tab, comma, semicolon, pipe.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={10} placeholder={`M1001,78\nM1002,65\nM1003,92`} className="font-mono text-xs" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasteOpen(false)}>Cancel</Button>
            <Button onClick={applyPaste} disabled={!pasteText.trim()} className="gap-1.5"><Upload className="h-3.5 w-3.5" />Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}