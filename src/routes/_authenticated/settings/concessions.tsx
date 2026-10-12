import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartHandshake, Plus, Trash2, Award } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatPKR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings/concessions")({
  component: ConcessionsPage,
});

type Concession = {
  id: string;
  studentId: string;
  studentName?: string;
  studentNameUrdu?: string;
  monthlyFeePaisa?: number;
  reason: "orphan" | "hardship" | "merit" | "sibling" | "staff_child" | "other";
  reasonUrdu: string;
  percent: number;
  approvedBy: string;
  active: boolean;
};

const REASONS: { v: Concession["reason"]; en: string; ur: string }[] = [
  { v: "orphan", en: "Orphan", ur: "یتیم" },
  { v: "hardship", en: "Hardship", ur: "مالی مشکل" },
  { v: "merit", en: "Merit / Scholarship", ur: "وظیفہ" },
  { v: "sibling", en: "Sibling discount", ur: "بھائی بہن" },
  { v: "staff_child", en: "Staff child", ur: "اہلکار اولاد" },
  { v: "other", en: "Other", ur: "دیگر" },
];

function ConcessionsPage() {
  const [items, setItems] = useState<Concession[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fee_concessions");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("fee_concessions", JSON.stringify(items));
      } catch {}
    }
  }, [items]);

  const totalWaivedPaisa = items.filter((i) => i.active).reduce((a, c) => {
    return a + Math.round(((c.monthlyFeePaisa ?? 200000) * c.percent) / 100);
  }, 0);

  return (
    <div>
      <PageHeader
        title="Concessions & Scholarships"
        titleUrdu="رعایات و وظائف"
        description="Manage fee waivers for orphans, hardship cases, sibling discounts and scholarships."
        actions={<AddConcessionDialog onSave={(c) => { setItems((p) => [c, ...p]); toast.success("Concession added"); }} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Active · فعال</p><p className="font-heading text-2xl font-bold mt-1">{items.filter((i) => i.active).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Orphans · یتیم</p><p className="font-heading text-2xl font-bold mt-1 text-chart-1">{items.filter((i) => i.reason === "orphan" && i.active).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Scholarships · وظائف</p><p className="font-heading text-2xl font-bold mt-1 text-chart-2">{items.filter((i) => i.reason === "merit" && i.active).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Monthly Waived</p><p className="font-heading text-2xl font-bold mt-1 font-mono">{formatPKR(totalWaivedPaisa / 100)}</p></Card>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Student</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Monthly Waived</TableHead>
              <TableHead>Approved By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  کوئی رعایت درج نہیں ہے — No fee concessions recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => {
                const waived = Math.round(((c.monthlyFeePaisa ?? 200000) * c.percent) / 100);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{c.studentName ?? c.studentId}</p>
                      {c.studentNameUrdu && <p className="font-urdu text-sm text-muted-foreground">{c.studentNameUrdu}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{REASONS.find((r) => r.v === c.reason)?.en}</Badge>
                      <p className="font-urdu text-xs text-muted-foreground mt-0.5">{c.reasonUrdu}</p>
                    </TableCell>
                    <TableCell className="font-mono">{c.percent}%</TableCell>
                    <TableCell className="font-mono text-sm">{formatPKR(waived / 100)}</TableCell>
                    <TableCell className="text-sm">{c.approvedBy}</TableCell>
                    <TableCell>{c.active ? <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" variant="outline">Active</Badge> : <Badge variant="outline">Ended</Badge>}</TableCell>
                    <TableCell className="text-end">
                      <Button size="sm" variant="ghost" onClick={() => { setItems((p) => p.filter((x) => x.id !== c.id)); toast.success("Concession removed"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5 mt-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Auto-apply rules · خودکار اصول</p>
            <p className="text-xs text-muted-foreground mt-1">Orphans (یتیم) receive 100% waiver automatically. Siblings of existing students get 25% off the younger child's fee. Staff children get 50% off. Override per student above.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AddConcessionDialog({ onSave }: { onSave: (c: Concession) => void }) {
  const [open, setOpen] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    reason: "orphan" as Concession["reason"],
    percent: 25,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/students?pageSize=50", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.students && Array.isArray(d.students)) {
            setStudentList(d.students);
            if (d.students.length > 0 && !form.studentId) {
              setForm((f) => ({ ...f, studentId: d.students[0].id }));
            }
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const selectedStudent = studentList.find((s) => s.id === form.studentId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Concession</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Concession · نئی رعایت</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <Label>Student · طالب علم</Label>
            {studentList.length === 0 ? (
              <Input
                placeholder="Enter Student ID / Roll No"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              />
            ) : (
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {studentList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.rollNo || s.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>Reason · وجہ</Label>
            <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v as Concession["reason"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REASONS.map((r) => <SelectItem key={r.v} value={r.v}>{r.en} · <span className="font-urdu ms-1">{r.ur}</span></SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Waiver % · شرحِ رعایت ({form.percent}%)</Label>
            <Input type="number" min={0} max={100} value={form.percent} onChange={(e) => setForm({ ...form, percent: +e.target.value })} />
          </div>
          <div>
            <Label>Notes · وضاحت</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!form.studentId}
            onClick={() => {
              const r = REASONS.find((x) => x.v === form.reason)!;
              onSave({
                id: `c${Date.now()}`,
                studentId: form.studentId,
                studentName: selectedStudent?.name ?? form.studentId,
                studentNameUrdu: selectedStudent?.nameUrdu,
                reason: form.reason,
                reasonUrdu: r.ur,
                percent: form.percent,
                approvedBy: "Super Admin",
                active: true,
              });
              setOpen(false);
            }}
          >
            <HeartHandshake className="h-3.5 w-3.5 me-1.5" />Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}