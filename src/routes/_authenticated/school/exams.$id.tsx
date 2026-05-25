import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Grid3x3, Users, Printer, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { schoolClasses } from "@/mock";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/school/exams/$id")({
  component: SchoolExamDetail,
});

const SUBJECTS = [
  { id: "su1", name: "Urdu", urdu: "اردو", total: 100, pass: 33 },
  { id: "su2", name: "English", urdu: "انگریزی", total: 100, pass: 33 },
  { id: "su3", name: "Mathematics", urdu: "ریاضی", total: 100, pass: 33 },
  { id: "su4", name: "Islamiyat", urdu: "اسلامیات", total: 100, pass: 33 },
  { id: "su5", name: "General Science", urdu: "عمومی سائنس", total: 75, pass: 25 },
  { id: "su6", name: "Social Studies", urdu: "مطالعہ پاکستان", total: 75, pass: 25 },
];

const DAYS_OF_WEEK = ["Sat", "Sun", "Mon", "Tue", "Wed"];
const URDU_DAYS = ["ہفتہ", "اتوار", "پیر", "منگل", "بدھ"];

function SchoolExamDetail() {
  const { id } = useParams({ from: "/_authenticated/school/exams/$id" });
  const examName = `Exam Series ${id.toUpperCase()}`;

  return (
    <div>
      <Link to="/school/exams" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back to exams</Link>
      <PageHeader
        title={examName}
        titleUrdu="امتحان کی تفصیل"
        description={`${SUBJECTS.length} subjects · ${schoolClasses.slice(0, 6).length} classes participating`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print Date Sheet</Button>
            <Link to="/school/exams/$id/seating" params={{ id }}><Button variant="outline" size="sm">Seating</Button></Link>
            <Link to="/school/exams/$id/results" params={{ id }}><Button size="sm" className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Enter Marks</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat icon={Calendar} label="Dates" urdu="تاریخیں" value={`${formatDate("2026-03-01")} → ${formatDate("2026-03-22")}`} />
        <Stat icon={Grid3x3} label="Subjects" urdu="مضامین" value={String(SUBJECTS.length)} />
        <Stat icon={Users} label="Students" urdu="طلبہ" value="312" />
        <Stat icon={Badge as never} label="Status" urdu="حالت" value="Upcoming" />
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule · شیڈول</TabsTrigger>
          <TabsTrigger value="timetable">Timetable view · جدول</TabsTrigger>
          <TabsTrigger value="subjects">Subjects · مضامین</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card className="overflow-hidden mt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-end">Total Marks</TableHead>
                  <TableHead className="text-end">Passing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SUBJECTS.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell><p className="font-medium text-sm">{s.name}</p><p className="font-urdu text-sm text-muted-foreground">{s.urdu}</p></TableCell>
                    <TableCell className="font-mono text-xs">{formatDate(new Date(2026, 2, 1 + i * 2).toISOString())}</TableCell>
                    <TableCell className="font-mono text-xs">09:00 – 11:30</TableCell>
                    <TableCell className="text-end font-mono text-sm">{s.total}</TableCell>
                    <TableCell className="text-end font-mono text-sm text-muted-foreground">{s.pass}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="timetable">
          <Card className="p-4 mt-4">
            <div className="grid grid-cols-5 gap-3">
              {DAYS_OF_WEEK.map((d, i) => {
                const subj = SUBJECTS[i];
                return (
                  <div key={d}>
                    <p className="text-xs uppercase text-muted-foreground">{d}</p>
                    <p className="font-urdu text-sm text-muted-foreground mb-2">{URDU_DAYS[i]}</p>
                    {subj ? (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="font-medium text-sm">{subj.name}</p>
                        <p className="font-urdu text-sm text-muted-foreground">{subj.urdu}</p>
                        <p className="font-mono text-[10px] mt-1.5 text-muted-foreground">09:00–11:30</p>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-lg p-3 text-center text-muted-foreground text-xs">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {SUBJECTS.map((s) => (
              <Card key={s.id} className="p-4">
                <p className="font-semibold">{s.name}</p>
                <p className="font-urdu text-sm text-muted-foreground">{s.urdu}</p>
                <div className="flex justify-between mt-3 text-xs">
                  <span>Total: <span className="font-mono">{s.total}</span></span>
                  <span className="text-muted-foreground">Pass: <span className="font-mono">{s.pass}</span></span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon: Icon, label, urdu, value }: { icon: React.ElementType; label: string; urdu: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-urdu text-xs text-muted-foreground">{urdu}</p>
          <p className="font-heading text-base font-bold mt-1 truncate">{value}</p>
        </div>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Card>
  );
}