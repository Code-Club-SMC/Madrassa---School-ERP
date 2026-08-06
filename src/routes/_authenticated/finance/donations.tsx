import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Printer, Receipt, HandCoins } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { formatPKR, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance/donations")({
  component: DonationsPage,
});

type DonationType = "zakat" | "sadqa" | "general" | "khairat" | "fitra";
type Donation = {
  id: string;
  receiptNo: string;
  date: string;
  donor: string;
  donorUrdu: string;
  phone?: string;
  cnic?: string;
  type: DonationType;
  purpose: string;
  amountPaisa: number;
  method: "cash" | "bank" | "online";
};

const TYPE_META: Record<DonationType, { en: string; ur: string; tone: string }> = {
  zakat: { en: "Zakat", ur: "زکوٰۃ", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  sadqa: { en: "Sadqa", ur: "صدقہ", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  khairat: { en: "Khairat", ur: "خیرات", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  fitra: { en: "Fitrana", ur: "فطرانہ", tone: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300" },
  general: { en: "General", ur: "عام عطیہ", tone: "bg-muted text-foreground" },
};

const SEED: Donation[] = [
  { id: "d1", receiptNo: "DR-2026-0001", date: "2026-05-12", donor: "Haji Abdul Rauf", donorUrdu: "حاجی عبدالرؤف", phone: "0300-1111111", cnic: "35202-1234567-1", type: "zakat", purpose: "Orphan student fees", amountPaisa: 250_000_00, method: "bank" },
  { id: "d2", receiptNo: "DR-2026-0002", date: "2026-05-18", donor: "Anonymous", donorUrdu: "گمنام", type: "sadqa", purpose: "Inventory — notebooks", amountPaisa: 15_000_00, method: "cash" },
  { id: "d3", receiptNo: "DR-2026-0003", date: "2026-05-22", donor: "Mrs. Aisha Khan", donorUrdu: "عائشہ خان", phone: "0321-2222222", type: "general", purpose: "Building fund", amountPaisa: 100_000_00, method: "online" },
];

function DonationsPage() {
  const [items, setItems] = useState<Donation[]>(SEED);
  const [open, setOpen] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);

  const totals = items.reduce((acc, d) => {
    acc.all += d.amountPaisa;
    acc[d.type] = (acc[d.type] ?? 0) + d.amountPaisa;
    return acc;
  }, { all: 0 } as Record<string, number>);

  const print = (id: string) => {
    setPrintId(id);
    setTimeout(() => { window.print(); setTimeout(() => setPrintId(null), 600); }, 100);
  };

  const printDoc = printId ? items.find((d) => d.id === printId) : null;

  return (
    <div>
      <PageHeader
        title="Donation Receipts"
        titleUrdu="عطیات کی رسیدیں"
        description="Issue official receipts for Zakat, Sadqa, Fitrana and general donations. Auto-numbered."
        actions={<Button className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Record Donation</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <Card className="p-3 col-span-2 lg:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><HandCoins className="h-3.5 w-3.5" />Total Received · <span className="font-urdu">کل وصول</span></div>
          <p className="font-heading text-2xl font-bold text-primary mt-1">{formatPKR(totals.all / 100)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{items.length} receipts issued</p>
        </Card>
        {(Object.keys(TYPE_META) as DonationType[]).map((t) => (
          <Card key={t} className="p-3">
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${TYPE_META[t].tone}`}>{TYPE_META[t].en}</div>
            <p className="font-heading text-sm font-bold mt-1.5 font-mono">{formatPKR((totals[t] ?? 0) / 100)}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Receipt No</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Purpose</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-end">Amount</TableHead>
              <TableHead className="text-end w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell><div className="font-mono text-xs">{d.receiptNo}</div><div className="text-[10px] text-muted-foreground">{formatDate(d.date)}</div></TableCell>
                <TableCell><p className="font-urdu text-sm font-semibold leading-tight">{d.donorUrdu}</p><p className="text-[11px] text-muted-foreground">{d.donor}</p></TableCell>
                <TableCell><Badge className={`${TYPE_META[d.type].tone} border-0`}>{TYPE_META[d.type].en} · <span className="font-urdu ms-1">{TYPE_META[d.type].ur}</span></Badge></TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{d.purpose}</TableCell>
                <TableCell className="text-xs uppercase">{d.method}</TableCell>
                <TableCell className="text-end font-mono font-bold text-primary">{formatPKR(d.amountPaisa / 100)}</TableCell>
                <TableCell className="text-end"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => print(d.id)} aria-label={`Print donation receipt ${d.id}`}><Printer className="h-3.5 w-3.5" aria-hidden="true" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <RecordDialog open={open} onOpenChange={setOpen} onSave={(d) => { setItems((p) => [{ ...d, id: `d${Date.now()}`, receiptNo: `DR-2026-${String(items.length + 1).padStart(4, "0")}` }, ...p]); toast.success("Receipt issued"); }} />

      {printDoc && (
        <div className="donation-receipt-print print-target hidden">
          <DonationReceipt d={printDoc} />
        </div>
      )}
    </div>
  );
}

function RecordDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (d: Omit<Donation, "id" | "receiptNo">) => void }) {
  const [donor, setDonor] = useState("");
  const [donorUrdu, setDonorUrdu] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [type, setType] = useState<DonationType>("zakat");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "bank" | "online">("cash");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Record Donation <span className="font-urdu text-base text-muted-foreground ms-2">عطیہ درج کریں</span></DialogTitle>
          <DialogDescription>An auto-numbered receipt (DR-YYYY-####) will be created and printable.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <BilingualLabel urdu="نام عطیہ دہندہ" english="Donor Name" required><Input value={donor} onChange={(e) => setDonor(e.target.value)} placeholder="Haji…" /></BilingualLabel>
          <BilingualLabel urdu="اردو نام" english="Urdu Name"><Input value={donorUrdu} onChange={(e) => setDonorUrdu(e.target.value)} className="font-urdu text-right" dir="rtl" /></BilingualLabel>
          <BilingualLabel urdu="فون" english="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300-…" /></BilingualLabel>
          <BilingualLabel urdu="شناختی کارڈ" english="CNIC"><Input value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="35202-…" /></BilingualLabel>
          <BilingualLabel urdu="قسم" english="Type" required>
            <Select value={type} onValueChange={(v) => setType(v as DonationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zakat">Zakat · زکوٰۃ</SelectItem>
                <SelectItem value="sadqa">Sadqa · صدقہ</SelectItem>
                <SelectItem value="khairat">Khairat · خیرات</SelectItem>
                <SelectItem value="fitra">Fitrana · فطرانہ</SelectItem>
                <SelectItem value="general">General · عام</SelectItem>
              </SelectContent>
            </Select>
          </BilingualLabel>
          <BilingualLabel urdu="طریقہ ادائیگی" english="Method">
            <Select value={method} onValueChange={(v) => setMethod(v as "cash" | "bank" | "online")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
            </Select>
          </BilingualLabel>
          <BilingualLabel urdu="رقم (PKR)" english="Amount (PKR)" required><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" /></BilingualLabel>
          <div className="col-span-2"><BilingualLabel urdu="مقصد" english="Purpose"><Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} placeholder="Orphan fees, building fund, books…" /></BilingualLabel></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!donor || !amount} onClick={() => { onSave({ date: new Date().toISOString().slice(0, 10), donor, donorUrdu: donorUrdu || donor, phone, cnic, type, purpose, amountPaisa: Number(amount) * 100, method }); onOpenChange(false); setDonor(""); setDonorUrdu(""); setPhone(""); setCnic(""); setPurpose(""); setAmount(""); }}>Issue Receipt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DonationReceipt({ d }: { d: Donation }) {
  return (
    <div className="bg-white text-black p-10 font-sans" style={{ width: "210mm", minHeight: "148mm" }}>
      <header className="text-center border-b-4 border-double border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">Madinat-ul-Salihin Madrassa &amp; Islamic Institute</h1>
        <p className="text-sm">Registered Religious & Educational Trust · Lahore, Pakistan</p>
        <div className="inline-flex items-center gap-2 mt-3 px-4 py-1 border-2 border-black">
          <Receipt className="h-4 w-4" /><span className="font-bold tracking-widest">DONATION RECEIPT · عطیہ کی رسید</span>
        </div>
      </header>
      <div className="flex justify-between text-sm mb-6">
        <div><b>Receipt No:</b> <span className="font-mono">{d.receiptNo}</span></div>
        <div><b>Date:</b> {formatDate(d.date)}</div>
      </div>
      <table className="w-full border-collapse border border-black text-sm mb-6">
        <tbody>
          <tr><td className="border border-black p-2 w-[180px] bg-gray-50"><b>Donor · عطیہ دہندہ</b></td><td className="border border-black p-2">{d.donor} <span className="font-urdu mx-2">({d.donorUrdu})</span></td></tr>
          {d.phone && <tr><td className="border border-black p-2 bg-gray-50"><b>Phone · فون</b></td><td className="border border-black p-2 font-mono">{d.phone}</td></tr>}
          {d.cnic && <tr><td className="border border-black p-2 bg-gray-50"><b>CNIC · شناختی کارڈ</b></td><td className="border border-black p-2 font-mono">{d.cnic}</td></tr>}
          <tr><td className="border border-black p-2 bg-gray-50"><b>Type · قسم</b></td><td className="border border-black p-2">{TYPE_META[d.type].en} · <span className="font-urdu">{TYPE_META[d.type].ur}</span></td></tr>
          <tr><td className="border border-black p-2 bg-gray-50"><b>Purpose · مقصد</b></td><td className="border border-black p-2">{d.purpose || "—"}</td></tr>
          <tr><td className="border border-black p-2 bg-gray-50"><b>Method · طریقہ</b></td><td className="border border-black p-2 uppercase">{d.method}</td></tr>
          <tr className="bg-gray-100"><td className="border border-black p-3"><b>AMOUNT · رقم</b></td><td className="border border-black p-3 text-xl font-bold font-mono">{formatPKR(d.amountPaisa / 100)}</td></tr>
        </tbody>
      </table>
      <p className="text-xs italic mb-10 font-urdu text-right">جزاکم اللہ خیراً۔ آپ کا عطیہ بطورِ امانت ادارے کے فلاحی و تعلیمی مصارف میں استعمال ہوگا۔</p>
      <div className="grid grid-cols-2 gap-8 mt-16 text-sm">
        <div className="border-t-2 border-black pt-2 text-center">Received By · وصول کنندہ</div>
        <div className="border-t-2 border-black pt-2 text-center">Authorized Signature · مجاز دستخط</div>
      </div>
    </div>
  );
}