import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHR } from "@/stores/hr-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/payroll")({ component: PayrollPage });

function PayrollPage() {
  const { staff, payslips, generatePayroll, approvePayroll, markPayrollPaid } = useHR();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const runSlips = useMemo(() => payslips.filter((p) => p.month === month && p.year === year), [payslips, month, year]);
  const totals = runSlips.reduce((a, p) => ({ gross: a.gross + p.grossSalary, ded: a.ded + p.totalDeductions, net: a.net + p.netSalary }), { gross: 0, ded: 0, net: 0 });

  return (
    <div>
      <PageHeader title="Payroll" titleUrdu="تنخواہ" description="Generate, approve and pay staff salaries." />
      <Card className="p-4 mb-4 flex flex-wrap items-end gap-3">
        <div><p className="text-xs text-muted-foreground mb-1">Month</p><Select value={String(month)} onValueChange={(v) => setMonth(+v)}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }).map((_, i) => <SelectItem key={i} value={String(i + 1)}>{i + 1}</SelectItem>)}</SelectContent></Select></div>
        <div><p className="text-xs text-muted-foreground mb-1">Year</p><Select value={String(year)} onValueChange={(v) => setYear(+v)}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{[2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex-1" />
        <Button onClick={() => { generatePayroll(month, year); toast.success("Payroll generated"); }}>Generate</Button>
        <Button variant="outline" onClick={() => { approvePayroll(month, year); toast.success("Approved"); }}>Approve</Button>
        <Button variant="outline" onClick={() => { markPayrollPaid(month, year); toast.success("Marked paid"); }}>Mark Paid</Button>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-3"><p className="text-xs text-muted-foreground">Headcount</p><p className="font-heading text-2xl font-bold">{runSlips.length}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Gross</p><p className="font-heading text-xl font-bold">PKR {totals.gross.toLocaleString()}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Deductions</p><p className="font-heading text-xl font-bold text-destructive">PKR {totals.ded.toLocaleString()}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Net</p><p className="font-heading text-xl font-bold text-primary">PKR {totals.net.toLocaleString()}</p></Card>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-end">Gross</TableHead><TableHead className="text-end">Deductions</TableHead><TableHead className="text-end">Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {runSlips.map((p) => { const s = staff.find((x) => x.id === p.staffId); return (
              <TableRow key={p.id}><TableCell>{s?.fullName ?? p.staffId}</TableCell><TableCell className="text-end font-mono">{p.grossSalary.toLocaleString()}</TableCell><TableCell className="text-end font-mono">{p.totalDeductions.toLocaleString()}</TableCell><TableCell className="text-end font-mono font-semibold">{p.netSalary.toLocaleString()}</TableCell><TableCell><Badge variant={p.status === "paid" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></TableCell></TableRow>
            ); })}
            {runSlips.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No payslips for this run. Click Generate.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}