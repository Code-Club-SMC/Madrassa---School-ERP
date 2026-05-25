import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, GraduationCap, Plus, Upload, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { students } from "@/mock";

export const Route = createFileRoute("/_authenticated/school/exams/board")({
  component: BoardExamsPage,
});

const BOARDS = ["BISE Lahore", "BISE Rawalpindi", "BISE Multan", "BISE Karachi", "AKU-EB", "Federal Board"];
const EXAM_TYPES = ["SSC Part I (9th)", "SSC Part II (10th)", "HSSC Part I (11th)", "HSSC Part II (12th)"];

function BoardExamsPage() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const eligible = students.filter((s) => s.system === "school" && s.classId && ["c9", "c10", "c11", "c12"].includes(s.classId));
  const filtered = eligible.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.rollNo.includes(q));

  return (
    <div>
      <Link to="/school/exams" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Back to exams</Link>
      <PageHeader
        title="BISE Board Registration"
        titleUrdu="بورڈ امتحانات کا اندراج"
        description="Register Grade 9–12 students for the regional Board of Intermediate and Secondary Education examination."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"><Upload className="h-3.5 w-3.5" />Bulk Upload</Button>
            <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />Register Batch</Button>
          </div>
        }
      />

      <Card className="p-3 mb-3 flex flex-wrap items-center gap-3">
        <Select defaultValue={BOARDS[0]}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent>{BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
        <Select defaultValue={EXAM_TYPES[0]}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent>{EXAM_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
        <Input defaultValue="2026" className="w-[100px]" />
        <div className="relative w-full lg:max-w-xs ms-auto">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student…" className="pe-9" />
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Card className="p-3"><p className="text-xs text-muted-foreground">Eligible · اہل</p><p className="font-heading text-xl font-bold">{eligible.length}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Registered · رجسٹرڈ</p><p className="font-heading text-xl font-bold text-chart-5 dark:text-chart-1">{Math.floor(eligible.length * 0.7)}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Pending Payment</p><p className="font-heading text-xl font-bold text-amber-500">{Math.ceil(eligible.length * 0.2)}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Fee per Student</p><p className="font-heading text-xl font-bold">PKR 2,500</p></Card>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Roll No</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class · Group</TableHead>
              <TableHead>Father</TableHead>
              <TableHead>B-Form / CNIC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s, i) => {
              const status = i % 3 === 0 ? "pending" : i % 3 === 1 ? "registered" : "fee_due";
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                  <TableCell><p className="font-medium text-sm">{s.name}</p><p className="font-urdu text-sm text-muted-foreground">{s.nameUrdu}</p></TableCell>
                  <TableCell className="text-xs">{s.classId?.toUpperCase()} {s.section ? `· ${s.section}` : ""}</TableCell>
                  <TableCell><p className="text-xs">{s.fatherName}</p><p className="font-urdu text-sm text-muted-foreground">{s.fatherNameUrdu}</p></TableCell>
                  <TableCell className="font-mono text-[10px]">{s.guardianCnic}</TableCell>
                  <TableCell>
                    {status === "registered" && <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Registered</Badge>}
                    {status === "pending" && <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-300">Pending</Badge>}
                    {status === "fee_due" && <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300">Fee Due</Badge>}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button size="sm" variant="outline" onClick={() => toast.success(`${s.name} ${status === "registered" ? "withdrawn" : "registered with board"}`)}>{status === "registered" ? "Withdraw" : "Register"}</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Batch Register</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Board</Label><Select defaultValue={BOARDS[0]}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Exam</Label><Select defaultValue={EXAM_TYPES[0]}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXAM_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Year</Label><Input defaultValue="2026" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { toast.success(`${eligible.length} students queued for registration`); setOpen(false); }}><GraduationCap className="h-4 w-4 me-1.5" />Register All Eligible</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}