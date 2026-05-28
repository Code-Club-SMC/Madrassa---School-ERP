import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Eye, UserX } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHR } from "@/stores/hr-store";
import { AddStaffSheet } from "./-add-staff-sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/staff/")({
  component: HRStaffList,
});

const STAFF_TYPES = ["all", "teacher", "administrator", "support", "accountant", "librarian", "helper"] as const;
const STATUSES = ["all", "active", "on_leave", "terminated"] as const;
const MODULES = ["all", "school", "madrassa", "shared"] as const;

function HRStaffList() {
  const { staff, payrollProfiles, terminateStaff } = useHR();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [mod, setMod] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => staff.filter((s) => {
    if (q && !s.fullName.toLowerCase().includes(q.toLowerCase())) return false;
    if (type !== "all" && s.staffType !== type) return false;
    if (status !== "all" && s.status !== status) return false;
    if (mod !== "all" && s.module !== mod) return false;
    return true;
  }), [staff, q, type, status, mod]);

  const totalNet = useMemo(() => filtered.reduce((sum, s) => {
    const p = payrollProfiles.find((pp) => pp.staffId === s.id);
    if (!p) return sum;
    return sum + p.basicSalary + p.hra + p.transportAllowance + p.medicalAllowance - p.eobi - p.incomeTax;
  }, 0), [filtered, payrollProfiles]);

  return (
    <div>
      <PageHeader
        title="HR & Staff"
        titleUrdu="انسانی وسائل"
        description="All staff (teachers, admin, support). Onboard new staff here — they appear in their respective modules automatically."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />Add Staff</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-3"><p className="text-xs text-muted-foreground">Total</p><p className="font-heading text-2xl font-bold">{staff.length}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Active</p><p className="font-heading text-2xl font-bold text-emerald-600">{staff.filter((s) => s.status === "active").length}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">On Leave</p><p className="font-heading text-2xl font-bold text-amber-600">{staff.filter((s) => s.status === "on_leave").length}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Monthly Net</p><p className="font-heading text-xl font-bold">PKR {totalNet.toLocaleString()}</p></Card>
      </div>

      <Card className="p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="pl-8" />
        </div>
        <Select value={type} onValueChange={setType}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent>{STAFF_TYPES.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All types" : t}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All statuses" : t}</SelectItem>)}</SelectContent></Select>
        <Select value={mod} onValueChange={setMod}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent>{MODULES.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All modules" : t}</SelectItem>)}</SelectContent></Select>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Designation</TableHead><TableHead>Department</TableHead><TableHead>Join</TableHead><TableHead className="text-end">Net</TableHead><TableHead>Status</TableHead><TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const p = payrollProfiles.find((pp) => pp.staffId === s.id);
              const net = p ? p.basicSalary + p.hra + p.transportAllowance + p.medicalAllowance - p.eobi - p.incomeTax : 0;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{s.staffType}</Badge></TableCell>
                  <TableCell className="text-sm">{s.designation}</TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.joinDate}</TableCell>
                  <TableCell className="text-end font-mono text-sm">{net.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "default" : s.status === "terminated" ? "destructive" : "secondary"} className="capitalize">{s.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex gap-1 justify-end">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8"><Link to="/hr/staff/$staffId" params={{ staffId: s.id }}><Eye className="h-3.5 w-3.5" /></Link></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Terminate ${s.fullName}?`)) { terminateStaff(s.id, "manual"); toast.success("Staff terminated"); } }}><UserX className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">No staff match the filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <AddStaffSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}