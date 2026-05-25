import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Printer, Banknote, Building2, Wallet, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { teachers } from "@/mock/teachers";
import { formatPKR, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/teachers_/salary")({
  component: SalaryPage,
});

type Adj = { allowance: number; deduction: number; method: "cash" | "bank"; paid: boolean; paidOn?: string };

function SalaryPage() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [adj, setAdj] = useState<Record<string, Adj>>(() =>
    Object.fromEntries(teachers.map((t) => [t.id, { allowance: 0, deduction: 0, method: "bank" as const, paid: false }])),
  );
  const [printId, setPrintId] = useState<string | null>(null);

  const rows = useMemo(() => teachers.filter((t) => t.active).map((t) => {
    const a = adj[t.id] ?? { allowance: 0, deduction: 0, method: "bank", paid: false };
    const base = t.monthlySalaryPaisa / 100;
    const net = base + a.allowance - a.deduction;
    return { teacher: t, a, base, net };
  }), [adj]);

  const totals = rows.reduce(
    (acc, r) => ({ base: acc.base + r.base, allow: acc.allow + r.a.allowance, ded: acc.ded + r.a.deduction, net: acc.net + r.net, paid: acc.paid + (r.a.paid ? r.net : 0) }),
    { base: 0, allow: 0, ded: 0, net: 0, paid: 0 },
  );

  const update = (id: string, patch: Partial<Adj>) => setAdj((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const print = (id: string) => {
    setPrintId(id);
    setTimeout(() => { window.print(); setTimeout(() => setPrintId(null), 600); }, 100);
  };

  const printRow = printId ? rows.find((r) => r.teacher.id === printId) : null;

  return (
    <div>
      <PageHeader
        title="Teacher Salary Slips"
        titleUrdu="اساتذہ کی تنخواہ سلپ"
        description="Generate, adjust and print monthly salary slips. Allowances and deductions in PKR."
        actions={
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[170px]" />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Stat icon={Banknote} label="Base Total" ur="بنیادی تنخواہ" value={formatPKR(totals.base)} />
        <Stat icon={Wallet} label="Allowances" ur="الاؤنسز" value={formatPKR(totals.allow)} tone="text-chart-1" />
        <Stat icon={Wallet} label="Deductions" ur="کٹوتیاں" value={formatPKR(totals.ded)} tone="text-destructive" />
        <Stat icon={Building2} label="Net Payable" ur="قابل ادا" value={formatPKR(totals.net)} tone="text-primary" />
        <Stat icon={Calendar} label="Paid" ur="ادا شدہ" value={formatPKR(totals.paid)} />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Teacher</TableHead>
              <TableHead className="text-end">Base</TableHead>
              <TableHead className="w-[110px]">Allowance</TableHead>
              <TableHead className="w-[110px]">Deduction</TableHead>
              <TableHead className="text-end">Net</TableHead>
              <TableHead className="w-[120px]">Method</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[110px] text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.teacher.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-urdu text-sm font-semibold leading-tight">{r.teacher.nameUrdu}</p>
                    <p className="text-[11px] text-muted-foreground">{r.teacher.name} · {r.teacher.designation.replace("_", " ")}</p>
                  </div>
                </TableCell>
                <TableCell className="text-end font-mono text-sm">{formatPKR(r.base)}</TableCell>
                <TableCell><Input type="number" min={0} value={r.a.allowance} onChange={(e) => update(r.teacher.id, { allowance: Number(e.target.value) || 0 })} className="h-8 text-end font-mono" /></TableCell>
                <TableCell><Input type="number" min={0} value={r.a.deduction} onChange={(e) => update(r.teacher.id, { deduction: Number(e.target.value) || 0 })} className="h-8 text-end font-mono" /></TableCell>
                <TableCell className="text-end font-mono font-bold text-primary">{formatPKR(r.net)}</TableCell>
                <TableCell>
                  <Select value={r.a.method} onValueChange={(v) => update(r.teacher.id, { method: v as "cash" | "bank" })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {r.a.paid ? <Badge className="bg-chart-1/15 text-chart-1 border-0">Paid</Badge> : <Badge variant="outline">Pending</Badge>}
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-1">
                    {!r.a.paid && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => { update(r.teacher.id, { paid: true, paidOn: new Date().toISOString().slice(0, 10) }); toast.success(`Paid to ${r.teacher.name}`); }}>Mark Paid</Button>}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => print(r.teacher.id)} title="Print slip" aria-label={`Print salary slip for ${r.teacher.name}`}><Printer className="h-3.5 w-3.5" aria-hidden="true" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {printRow && (
        <div className="salary-slip-print print-target hidden">
          <SalarySlipDoc r={printRow} month={month} />
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, ur, value, tone }: { icon: typeof Banknote; label: string; ur: string; value: string; tone?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label} · <span className="font-urdu">{ur}</span></div>
      <p className={`font-heading text-xl font-bold mt-1 ${tone ?? ""}`}>{value}</p>
    </Card>
  );
}

function SalarySlipDoc({ r, month }: { r: { teacher: typeof teachers[number]; a: Adj; base: number; net: number }; month: string }) {
  return (
    <div className="bg-white text-black p-10 font-sans" style={{ width: "210mm", minHeight: "297mm" }}>
      <header className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">Madinat-ul-Salihin Madrassa &amp; Islamic Institute</h1>
        <p className="text-sm">SALARY SLIP · تنخواہ سلپ · {month}</p>
      </header>
      <BilingualLabel urdu="تفصیل ملازم" english="Employee Details">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm border border-black p-4">
          <div><b>Name:</b> {r.teacher.name}</div>
          <div className="font-urdu text-right"><b>نام:</b> {r.teacher.nameUrdu}</div>
          <div><b>Designation:</b> {r.teacher.designation.replace("_", " ")}</div>
          <div><b>CNIC:</b> {r.teacher.cnic}</div>
          <div><b>Joined:</b> {formatDate(r.teacher.joinedAt)}</div>
          <div><b>Bank:</b> {r.teacher.bankName ?? "—"}</div>
        </div>
      </BilingualLabel>
      <div className="mt-6">
        <table className="w-full border-collapse border border-black text-sm">
          <thead className="bg-gray-100">
            <tr><th className="border border-black p-2 text-left">Earnings</th><th className="border border-black p-2 text-right">Amount (PKR)</th></tr>
          </thead>
          <tbody>
            <tr><td className="border border-black p-2">Basic Salary · بنیادی تنخواہ</td><td className="border border-black p-2 text-right font-mono">{formatPKR(r.base)}</td></tr>
            <tr><td className="border border-black p-2">Allowances · الاؤنسز</td><td className="border border-black p-2 text-right font-mono">{formatPKR(r.a.allowance)}</td></tr>
            <tr><td className="border border-black p-2">Deductions · کٹوتیاں</td><td className="border border-black p-2 text-right font-mono text-red-700">({formatPKR(r.a.deduction)})</td></tr>
            <tr className="bg-gray-100 font-bold"><td className="border border-black p-2">Net Payable · قابل ادا</td><td className="border border-black p-2 text-right font-mono">{formatPKR(r.net)}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm"><b>Payment Method:</b> {r.a.method.toUpperCase()} {r.a.paid && r.a.paidOn ? ` · Paid on ${formatDate(r.a.paidOn)}` : ""}</div>
      <div className="grid grid-cols-2 gap-8 mt-20 text-sm">
        <div className="border-t-2 border-black pt-2 text-center">Accountant · اکاؤنٹنٹ</div>
        <div className="border-t-2 border-black pt-2 text-center">Principal · پرنسپل</div>
      </div>
    </div>
  );
}