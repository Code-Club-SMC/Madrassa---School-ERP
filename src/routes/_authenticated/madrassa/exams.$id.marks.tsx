import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [marks, setMarks] = useState<Record<string, number>>(() => Object.fromEntries(list.map((s, i) => [s.id, 40 + ((i * 7) % 50)])));

  return (
    <div>
      <Link to="/madrassa/exams/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back</Link>
      <PageHeader
        title="Mark Entry"
        titleUrdu="نمبر درج کریں"
        description="Enter marks subject-by-subject. Total and passing thresholds are auto-checked."
        actions={<Button size="sm" className="gap-1.5" onClick={() => toast.success("Marks saved for " + subject.name)}><Save className="h-3.5 w-3.5" />Save</Button>}
      />

      <Card className="p-3 mb-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Subject:</span>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · <span className="font-urdu ms-1">{s.urdu}</span></SelectItem>)}</SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ms-auto">Total marks: <span className="font-mono">{subject.total}</span></span>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Roll</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Darja · درجہ</TableHead>
              <TableHead className="text-end">Marks ({subject.total})</TableHead>
              <TableHead className="text-end">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((s) => {
              const m = marks[s.id] ?? 0;
              const pass = m >= 50;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                  <TableCell><p className="font-medium text-sm">{s.name}</p><p className="font-urdu text-sm text-muted-foreground">{s.nameUrdu}</p></TableCell>
                  <TableCell><span className="font-urdu text-sm">حفظ ابتدائی</span></TableCell>
                  <TableCell className="text-end">
                    <Input type="number" max={subject.total} min={0} className="h-8 w-20 ms-auto text-end font-mono" value={m} onChange={(e) => setMarks((p) => ({ ...p, [s.id]: Math.max(0, Math.min(subject.total, +e.target.value)) }))} />
                  </TableCell>
                  <TableCell className="text-end text-xs">{pass ? <span className="text-chart-5 dark:text-chart-1">پاس</span> : <span className="text-destructive">ناکام</span>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}