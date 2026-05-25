import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Grid3x3, Users, Printer, Pencil, BookMarked, Users2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/madrassa/exams/$id")({
  component: MadrassaExamDetail,
});

const SUBJECTS = [
  { id: "su1", name: "Hifz", urdu: "حفظ", total: 100, pass: 50 },
  { id: "su2", name: "Nazira", urdu: "ناظرہ", total: 100, pass: 50 },
  { id: "su3", name: "Tajweed", urdu: "تجوید", total: 100, pass: 50 },
  { id: "su4", name: "Sarf", urdu: "صرف", total: 100, pass: 50 },
  { id: "su5", name: "Nahw", urdu: "نحو", total: 100, pass: 50 },
  { id: "su6", name: "Fiqh", urdu: "فقہ", total: 100, pass: 50 },
];

function MadrassaExamDetail() {
  const { id } = useParams({ from: "/_authenticated/madrassa/exams/$id" });
  return (
    <div>
      <Link to="/madrassa/exams" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back to exams</Link>
      <PageHeader
        title={`Exam ${id.toUpperCase()}`}
        titleUrdu="امتحان کی تفصیل"
        description="Subject schedule, darja-wise grouping, and mark entry workflow per Wifaq standards."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print Date Sheet</Button>
            <Link to="/madrassa/exams/$id/marks" params={{ id }}><Button size="sm" className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Enter Marks</Button></Link>
            <Link to="/madrassa/exams/$id/seating" params={{ id }}><Button variant="outline" size="sm" className="gap-1.5"><Users2 className="h-3.5 w-3.5" />Halqa Viva</Button></Link>
            <Link to="/madrassa/exams/$id/results" params={{ id }}><Button variant="outline" size="sm">Results</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Dates · تاریخ</p><p className="font-mono text-sm mt-1">{formatDate("2026-04-15")} → {formatDate("2026-05-05")}</p></div><Calendar className="h-4 w-4 text-muted-foreground" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Subjects · مضامین</p><p className="font-heading text-xl font-bold mt-1">{SUBJECTS.length}</p></div><Grid3x3 className="h-4 w-4 text-muted-foreground" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Students · طلبہ</p><p className="font-heading text-xl font-bold mt-1">156</p></div><Users className="h-4 w-4 text-muted-foreground" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Type</p><p className="font-urdu text-base mt-1">سالانہ</p></div><BookMarked className="h-4 w-4 text-muted-foreground" /></div></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-heading font-semibold">Subject Schedule · شیڈول</h3>
          <p className="font-urdu text-sm text-muted-foreground mt-0.5">بنین و بنات کا مشترکہ شیڈول</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Subject · مضمون</TableHead>
              <TableHead>Darja · درجہ</TableHead>
              <TableHead>Date · تاریخ</TableHead>
              <TableHead>Time · وقت</TableHead>
              <TableHead className="text-end">Total / Pass</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SUBJECTS.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell><p className="font-medium text-sm">{s.name}</p><p className="font-urdu text-base text-muted-foreground">{s.urdu}</p></TableCell>
                <TableCell><span className="font-urdu text-sm">{["قاعدہ", "ناظرہ", "حفظ", "اعدادیہ", "اولیٰ", "ثانیہ"][i]}</span></TableCell>
                <TableCell className="font-mono text-xs">{formatDate(new Date(2026, 3, 15 + i * 2).toISOString())}</TableCell>
                <TableCell className="font-mono text-xs">08:30 – 11:00</TableCell>
                <TableCell className="text-end font-mono text-sm">{s.total} / {s.pass}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}