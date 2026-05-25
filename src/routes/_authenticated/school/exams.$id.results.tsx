import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Save, Printer, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { students, institution } from "@/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/school/exams/$id/results")({
  component: ResultsPage,
});

const SUBJECTS = [
  { id: "su1", name: "Urdu", urdu: "اردو", total: 100 },
  { id: "su2", name: "English", urdu: "انگریزی", total: 100 },
  { id: "su3", name: "Math", urdu: "ریاضی", total: 100 },
  { id: "su4", name: "Islamiyat", urdu: "اسلامیات", total: 100 },
  { id: "su5", name: "Science", urdu: "سائنس", total: 75 },
  { id: "su6", name: "S.Studies", urdu: "مطالعہ", total: 75 },
];

function bisGrade(pct: number) {
  if (pct >= 80) return { g: "A1", urdu: "ممتاز", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" };
  if (pct >= 70) return { g: "A", urdu: "بہت اچھا", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
  if (pct >= 60) return { g: "B", urdu: "اچھا", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300" };
  if (pct >= 50) return { g: "C", urdu: "اوسط", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };
  if (pct >= 40) return { g: "D", urdu: "کم اوسط", tone: "bg-orange-500/15 text-orange-700 dark:text-orange-300" };
  if (pct >= 33) return { g: "E", urdu: "بمشکل پاس", tone: "bg-orange-500/15 text-orange-700 dark:text-orange-300" };
  return { g: "F", urdu: "ناکام", tone: "bg-destructive/15 text-destructive" };
}

function ResultsPage() {
  const { id } = useParams({ from: "/_authenticated/school/exams/$id/results" });
  const schoolStudents = students.filter((s) => s.system === "school").slice(0, 12);
  const [editMode, setEditMode] = useState(false);
  const [dmcOpen, setDmcOpen] = useState<typeof schoolStudents[number] | null>(null);

  const [marks, setMarks] = useState<Record<string, Record<string, number>>>(() => {
    const seed: Record<string, Record<string, number>> = {};
    schoolStudents.forEach((s, i) => {
      seed[s.id] = {};
      SUBJECTS.forEach((sub, j) => {
        seed[s.id][sub.id] = Math.max(0, Math.min(sub.total, Math.round(40 + (Math.sin(i + j) + 1) * 25 + (i % 4) * 4)));
      });
    });
    return seed;
  });

  const rows = useMemo(() => schoolStudents.map((s) => {
    const sm = marks[s.id] ?? {};
    const totalObt = SUBJECTS.reduce((a, sub) => a + (sm[sub.id] ?? 0), 0);
    const totalMax = SUBJECTS.reduce((a, sub) => a + sub.total, 0);
    const pct = Math.round((totalObt / totalMax) * 100);
    return { s, sm, totalObt, totalMax, pct, grade: bisGrade(pct) };
  }).sort((a, b) => b.pct - a.pct).map((r, i) => ({ ...r, position: i + 1 })), [marks, schoolStudents]);

  return (
    <div>
      <Link to="/school/exams/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back to exam</Link>
      <PageHeader
        title="Exam Results"
        titleUrdu="نتائج"
        description="Mark sheet with auto-calculated grade per BISE scale. Switch to edit mode to enter marks."
        actions={
          <div className="flex gap-2">
            <Button variant={editMode ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => { setEditMode((v) => !v); if (editMode) toast.success("Marks saved"); }}>
              {editMode ? <><Save className="h-3.5 w-3.5" />Save & Lock</> : <><Pencil className="h-3.5 w-3.5" />Enter Marks · نمبر درج کریں</>}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print List</Button>
          </div>
        }
      />

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>#</TableHead>
              <TableHead>Student</TableHead>
              {SUBJECTS.map((s) => <TableHead key={s.id} className="text-end font-mono">{s.name}<br /><span className="text-[10px] text-muted-foreground">/{s.total}</span></TableHead>)}
              <TableHead className="text-end">Total</TableHead>
              <TableHead className="text-end">%</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-end">DMC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.s.id}>
                <TableCell className="font-mono text-xs">{r.position}</TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{r.s.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{r.s.rollNo}</p>
                </TableCell>
                {SUBJECTS.map((sub) => (
                  <TableCell key={sub.id} className="text-end">
                    {editMode ? (
                      <Input type="number" className="h-7 w-16 ml-auto text-end font-mono text-xs"
                        value={r.sm[sub.id] ?? 0}
                        max={sub.total}
                        onChange={(e) => setMarks((p) => ({ ...p, [r.s.id]: { ...p[r.s.id], [sub.id]: Math.min(sub.total, Math.max(0, +e.target.value)) } }))} />
                    ) : <span className="font-mono text-sm">{r.sm[sub.id] ?? 0}</span>}
                  </TableCell>
                ))}
                <TableCell className="text-end font-mono text-sm font-medium">{r.totalObt}/{r.totalMax}</TableCell>
                <TableCell className="text-end font-mono text-sm">{r.pct}%</TableCell>
                <TableCell><Badge variant="outline" className={cn(r.grade.tone, "font-mono text-xs")}>{r.grade.g}</Badge></TableCell>
                <TableCell className="text-end"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDmcOpen(r.s)}><FileText className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!dmcOpen} onOpenChange={(v) => !v && setDmcOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detailed Marks Certificate · تفصیلی نتیجہ کارڈ</DialogTitle></DialogHeader>
          {dmcOpen && (() => {
            const r = rows.find((x) => x.s.id === dmcOpen.id);
            if (!r) return null;
            return (
              <div className="dmc-card print-target border border-border rounded-lg p-6 bg-card">
                <div className="text-center border-b border-border pb-3 mb-3">
                  <p className="font-heading text-xl font-bold">{institution.nameEnglish}</p>
                  <p className="font-urdu text-2xl">{institution.nameUrdu}</p>
                  <p className="text-xs text-muted-foreground mt-1">Detailed Marks Certificate — {id.toUpperCase()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{r.s.name}</span><br /><span className="font-urdu text-base">{r.s.nameUrdu}</span></div>
                  <div><span className="text-muted-foreground">Guardian:</span> <span className="font-medium">{r.s.guardianName}</span><br /><span className="font-urdu text-base">{r.s.guardianNameUrdu}</span></div>
                  <div><span className="text-muted-foreground">Roll No:</span> <span className="font-mono">{r.s.rollNo}</span></div>
                  <div><span className="text-muted-foreground">Class:</span> <span className="font-mono">{r.s.classId}-{r.s.section}</span></div>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50"><th className="text-start p-2 border border-border">Subject · مضمون</th><th className="text-end p-2 border border-border">Total</th><th className="text-end p-2 border border-border">Obtained</th></tr>
                  </thead>
                  <tbody>
                    {SUBJECTS.map((sub) => (
                      <tr key={sub.id}><td className="p-2 border border-border">{sub.name} · <span className="font-urdu">{sub.urdu}</span></td><td className="text-end font-mono p-2 border border-border">{sub.total}</td><td className="text-end font-mono p-2 border border-border">{r.sm[sub.id] ?? 0}</td></tr>
                    ))}
                    <tr className="bg-muted/30 font-semibold"><td className="p-2 border border-border">Total</td><td className="text-end font-mono p-2 border border-border">{r.totalMax}</td><td className="text-end font-mono p-2 border border-border">{r.totalObt}</td></tr>
                  </tbody>
                </table>
                <div className="grid grid-cols-3 gap-3 text-center mt-4 text-xs">
                  <div className="border border-border rounded p-2"><p className="text-muted-foreground">Percentage</p><p className="font-mono text-base font-bold">{r.pct}%</p></div>
                  <div className="border border-border rounded p-2"><p className="text-muted-foreground">Grade</p><p className={cn("font-mono text-base font-bold", r.grade.tone)}>{r.grade.g} · <span className="font-urdu">{r.grade.urdu}</span></p></div>
                  <div className="border border-border rounded p-2"><p className="text-muted-foreground">Position</p><p className="font-mono text-base font-bold">{r.position}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-12 mt-8 text-xs">
                  <div className="text-center border-t border-border pt-1">Class Teacher · کلاس استاد</div>
                  <div className="text-center border-t border-border pt-1">Principal · پرنسپل</div>
                </div>
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => window.print()}>Print DMC</Button><Button onClick={() => setDmcOpen(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}