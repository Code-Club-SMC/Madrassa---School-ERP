import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { students, institution } from "@/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/madrassa/exams/$id/results")({
  component: MadrassaResults,
});

const SUBJECTS = [
  { id: "su1", name: "Hifz", urdu: "حفظ", total: 100 },
  { id: "su2", name: "Tajweed", urdu: "تجوید", total: 100 },
  { id: "su3", name: "Sarf", urdu: "صرف", total: 100 },
  { id: "su4", name: "Nahw", urdu: "نحو", total: 100 },
  { id: "su5", name: "Fiqh", urdu: "فقہ", total: 100 },
];

function wifaqGrade(pct: number) {
  if (pct >= 80) return { g: "ممتاز", roman: "Mumtaz", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" };
  if (pct >= 70) return { g: "جید جداً", roman: "Jayyid Jiddan", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
  if (pct >= 60) return { g: "جید", roman: "Jayyid", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300" };
  if (pct >= 50) return { g: "مقبول", roman: "Maqbool", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };
  return { g: "راسب", roman: "Rasib (Fail)", tone: "bg-destructive/15 text-destructive" };
}

function MadrassaResults() {
  const { id } = useParams({ from: "/_authenticated/madrassa/exams/$id/results" });
  const list = students.filter((s) => s.system === "madrassa").slice(0, 10);
  const [open, setOpen] = useState<typeof list[number] | null>(null);

  const rows = useMemo(() => list.map((s, i) => {
    const marks = SUBJECTS.map((sub, j) => Math.max(0, Math.min(sub.total, Math.round(45 + (Math.sin(i + j) + 1) * 22 + i * 2))));
    const obt = marks.reduce((a, b) => a + b, 0);
    const max = SUBJECTS.reduce((a, b) => a + b.total, 0);
    const pct = Math.round((obt / max) * 100);
    return { s, marks, obt, max, pct, grade: wifaqGrade(pct) };
  }).sort((a, b) => b.pct - a.pct).map((r, i) => ({ ...r, position: i + 1 })), [list]);

  return (
    <div>
      <Link to="/madrassa/exams/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back</Link>
      <PageHeader title="Results" titleUrdu="نتائج" description="Wifaq grading: ممتاز · جید جداً · جید · مقبول · راسب" actions={<Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print Sheet</Button>} />

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>#</TableHead>
              <TableHead>Student</TableHead>
              {SUBJECTS.map((s) => <TableHead key={s.id} className="text-end font-mono"><span className="font-urdu text-sm">{s.urdu}</span><br /><span className="text-[10px] text-muted-foreground">/{s.total}</span></TableHead>)}
              <TableHead className="text-end">Total</TableHead>
              <TableHead className="text-end">%</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-end">Card</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.s.id}>
                <TableCell className="font-mono text-xs">{r.position}</TableCell>
                <TableCell><p className="font-medium text-sm">{r.s.name}</p><p className="font-urdu text-sm text-muted-foreground">{r.s.nameUrdu}</p></TableCell>
                {r.marks.map((m, i) => <TableCell key={i} className="text-end font-mono text-sm">{m}</TableCell>)}
                <TableCell className="text-end font-mono text-sm font-medium">{r.obt}/{r.max}</TableCell>
                <TableCell className="text-end font-mono text-sm">{r.pct}%</TableCell>
                <TableCell><Badge variant="outline" className={cn(r.grade.tone, "font-urdu")}>{r.grade.g}</Badge></TableCell>
                <TableCell className="text-end"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(r.s)}><FileText className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>نتیجہ کارڈ · Result Card</DialogTitle></DialogHeader>
          {open && (() => {
            const r = rows.find((x) => x.s.id === open.id);
            if (!r) return null;
            return (
              <div className="dmc-card print-target border border-border rounded-lg p-6 bg-card">
                <div className="text-center border-b border-border pb-3 mb-3">
                  <p className="font-urdu text-2xl font-bold">{institution.nameUrdu}</p>
                  <p className="font-heading text-base">{institution.nameEnglish}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-urdu">نتیجہ کارڈ — امتحان {id.toUpperCase()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div><span className="text-muted-foreground font-urdu">نام:</span> <span className="font-urdu text-lg">{r.s.nameUrdu}</span></div>
                  <div><span className="text-muted-foreground font-urdu">والد:</span> <span className="font-urdu text-lg">{r.s.guardianNameUrdu}</span></div>
                  <div><span className="text-muted-foreground font-urdu">رول نمبر:</span> <span className="font-mono">{r.s.rollNo}</span></div>
                  <div><span className="text-muted-foreground font-urdu">پوزیشن:</span> <span className="font-mono">{r.position}</span></div>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-muted/50"><th className="text-start p-2 border border-border font-urdu">مضمون</th><th className="text-end p-2 border border-border">Total</th><th className="text-end p-2 border border-border">حاصل</th></tr></thead>
                  <tbody>
                    {SUBJECTS.map((sub, i) => (
                      <tr key={sub.id}><td className="p-2 border border-border"><span className="font-urdu">{sub.urdu}</span> · {sub.name}</td><td className="text-end font-mono p-2 border border-border">{sub.total}</td><td className="text-end font-mono p-2 border border-border">{r.marks[i]}</td></tr>
                    ))}
                    <tr className="bg-muted/30 font-semibold"><td className="p-2 border border-border font-urdu">کل</td><td className="text-end font-mono p-2 border border-border">{r.max}</td><td className="text-end font-mono p-2 border border-border">{r.obt}</td></tr>
                  </tbody>
                </table>
                <div className="grid grid-cols-2 gap-3 mt-4 text-center text-xs">
                  <div className="border border-border rounded p-2"><p className="font-urdu text-muted-foreground">فیصد</p><p className="font-mono text-lg font-bold">{r.pct}%</p></div>
                  <div className="border border-border rounded p-2"><p className="font-urdu text-muted-foreground">درجہ</p><p className={cn("font-urdu text-lg font-bold", r.grade.tone)}>{r.grade.g}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-12 mt-8 text-xs">
                  <div className="text-center border-t border-border pt-1 font-urdu">شیخ الحدیث</div>
                  <div className="text-center border-t border-border pt-1 font-urdu">مہتمم صاحب</div>
                </div>
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => window.print()}>Print</Button><Button onClick={() => setOpen(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}