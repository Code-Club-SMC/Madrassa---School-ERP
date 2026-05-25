import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Receipt, Printer, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, type StatusKey } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { feeRecords, students, institution, type FeeRecord } from "@/mock";
import { formatPKR, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/madrassa/fees")({
  component: FeesPage,
});

const madrassaRecords = feeRecords.filter((r) => {
  const s = students.find((x) => x.id === r.studentId);
  return s?.system === "madrassa";
});

const statusMap: Record<string, StatusKey> = { paid: "accepted", unpaid: "pending", partial: "pending", overdue: "rejected", waived: "inactive" };

function FeesPage() {
  const [records, setRecords] = useState(madrassaRecords);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "unpaid" | "paid" | "defaulters">("all");
  const [receipt, setReceipt] = useState<FeeRecord | null>(null);

  const totals = useMemo(() => ({
    expected: records.reduce((a, r) => a + r.monthlyFee, 0),
    collected: records.reduce((a, r) => a + r.paidAmount, 0),
    defaulters: records.filter((r) => r.status === "overdue" || r.status === "unpaid").length,
  }), [records]);

  const filtered = useMemo(() => records.filter((r) => {
    if (tab === "unpaid" && r.status !== "unpaid" && r.status !== "partial") return false;
    if (tab === "paid" && r.status !== "paid") return false;
    if (tab === "defaulters" && r.status !== "overdue") return false;
    if (q && !r.nameUrdu.includes(q) && !r.rollNo.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [records, tab, q]);

  const collect = (r: FeeRecord) => {
    setRecords((rs) => rs.map((x) => x.id === r.id ? { ...x, paidAmount: x.monthlyFee, status: "paid", paidOn: new Date().toISOString() } : x));
    const updated = { ...r, paidAmount: r.monthlyFee, status: "paid" as const, paidOn: new Date().toISOString() };
    setReceipt(updated);
    toast.success(`Collected ${formatPKR(r.monthlyFee)}`, { description: "فیس وصول ہوگئی" });
  };

  return (
    <div>
      <PageHeader title="Madrassa Fees" titleUrdu="مدرسہ کی فیس" description="Monthly fee tracking with receipts and defaulter watch." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Expected · متوقع</p><p className="font-heading text-2xl font-bold mt-1">{formatPKR(totals.expected)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Collected · وصول</p><p className="font-heading text-2xl font-bold mt-1 text-chart-5 dark:text-chart-1">{formatPKR(totals.collected)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Defaulters · نادہندگان</p><p className="font-heading text-2xl font-bold mt-1 text-destructive">{totals.defaulters}</p></Card>
      </div>

      <Card className="p-3 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Roll or name…" className="pe-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Roll #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-end">Fee</TableHead>
              <TableHead className="text-end">Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12"><EmptyState icon={Wallet} heading="No fee records" headingUrdu="کوئی ریکارڈ نہیں" /></TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.rollNo}</TableCell>
                <TableCell><p className="font-urdu text-sm">{r.nameUrdu}</p></TableCell>
                <TableCell className="text-end font-mono">{formatPKR(r.monthlyFee)}</TableCell>
                <TableCell className="text-end font-mono">{formatPKR(r.paidAmount)}</TableCell>
                <TableCell><StatusBadge status={statusMap[r.status]} /></TableCell>
                <TableCell className="text-end">
                  {r.status === "paid" ? (
                    <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setReceipt(r)}><Receipt className="h-3.5 w-3.5" />Receipt</Button>
                  ) : (
                    <Button size="sm" className="h-8 gap-1.5 bg-chart-1 hover:bg-chart-1/90 text-white" onClick={() => collect(r)}><CheckCircle2 className="h-3.5 w-3.5" />Collect</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)}>
        <DialogContent className="max-w-md print:shadow-none">
          <DialogHeader><DialogTitle className="font-heading">Fee Receipt <span className="font-urdu text-base text-muted-foreground ms-2">فیس کی رسید</span></DialogTitle></DialogHeader>
          {receipt && (
            <div className="print-page rounded-xl border border-border p-5 space-y-3">
              <div className="text-center pb-3 border-b border-border">
                <p className="font-urdu text-lg font-bold">{institution.nameUrdu}</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{institution.nameEnglish}</p>
              </div>
              <ReceiptRow label="Receipt No." urdu="رسید نمبر" value={`R-${receipt.id.toUpperCase()}`} mono />
              <ReceiptRow label="Date" urdu="تاریخ" value={formatDate(receipt.paidOn ?? new Date())} />
              <ReceiptRow label="Student" urdu="طالب علم" value={receipt.nameUrdu} urduValue />
              <ReceiptRow label="Roll" urdu="رول" value={receipt.rollNo} mono />
              <ReceiptRow label="Month" urdu="ماہ" value={receipt.month} mono />
              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">Amount Paid · ادا کردہ</p><p className="font-urdu text-sm">جزاکم اللہ خیراً</p></div>
                <p className="font-heading text-2xl font-bold text-chart-5 dark:text-chart-1">{formatPKR(receipt.paidAmount)}</p>
              </div>
            </div>
          )}
          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setReceipt(null)}>Close</Button>
            <Button onClick={() => window.print()} className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReceiptRow({ label, urdu, value, mono, urduValue }: { label: string; urdu: string; value: string; mono?: boolean; urduValue?: boolean }) {
  return (
    <div className="flex justify-between text-sm gap-3">
      <div><p className="font-urdu">{urdu}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>
      <p className={[mono && "font-mono", urduValue && "font-urdu text-base", "text-end"].filter(Boolean).join(" ")}>{value}</p>
    </div>
  );
}
