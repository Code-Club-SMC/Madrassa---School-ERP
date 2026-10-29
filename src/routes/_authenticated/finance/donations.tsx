import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Printer, Receipt, HandCoins, Loader2 } from "lucide-react";
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
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";

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
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [items, setItems] = useState<Donation[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("msmis_donations");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return SEED;
  });
  const [open, setOpen] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchDonations() {
      try {
        const res = await fetch("/api/finance/donations");
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data.donations) && data.donations.length > 0) {
            setItems(data.donations);
            try {
              localStorage.setItem("msmis_donations", JSON.stringify(data.donations));
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to load donations:", err);
      }
    }
    fetchDonations();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveDonation = async (d: Omit<Donation, "id" | "receiptNo">) => {
    try {
      const res = await fetch("/api/finance/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.donation) {
          setItems((prev) => {
            const next = [data.donation, ...prev.filter((p) => p.id !== data.donation.id)];
            try {
              localStorage.setItem("msmis_donations", JSON.stringify(next));
            } catch {}
            return next;
          });
          toast.success(isUrdu ? "رسید جاری کر دی گئی ہے" : "Receipt issued successfully");
          return;
        }
      }
    } catch {}

    // Fallback if network/offline
    const fallback: Donation = {
      ...d,
      id: `d${Date.now()}`,
      receiptNo: `DR-${new Date().getFullYear()}-${String(items.length + 1).padStart(4, "0")}`,
    };
    setItems((prev) => {
      const next = [fallback, ...prev];
      try {
        localStorage.setItem("msmis_donations", JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success(isUrdu ? "رسید جاری کر دی گئی ہے" : "Receipt issued successfully");
  };

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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HandCoins className="h-3.5 w-3.5" />
            <span className={cn(isUrdu && "font-urdu")}>{isUrdu ? "کل وصولی" : "Total Received"}</span>
          </div>
          <p className="font-heading text-2xl font-bold text-primary mt-1">{formatPKR(totals.all / 100)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{items.length} {isUrdu ? "رسیدات جاری ہوئیں" : "receipts issued"}</p>
        </Card>
        {(Object.keys(TYPE_META) as DonationType[]).map((t) => (
          <Card key={t} className="p-3">
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${TYPE_META[t].tone} ${isUrdu ? "font-urdu" : ""}`}>
              {isUrdu ? TYPE_META[t].ur : TYPE_META[t].en}
            </div>
            <p className="font-heading text-sm font-bold mt-1.5 font-mono">{formatPKR((totals[t] ?? 0) / 100)}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{isUrdu ? "رسید نمبر" : "Receipt No"}</TableHead>
              <TableHead>{isUrdu ? "عطیہ دہندہ" : "Donor"}</TableHead>
              <TableHead>{isUrdu ? "نوعیت" : "Type"}</TableHead>
              <TableHead className="hidden md:table-cell">{isUrdu ? "مقصد" : "Purpose"}</TableHead>
              <TableHead>{isUrdu ? "طریقہ" : "Method"}</TableHead>
              <TableHead className="text-end">{isUrdu ? "رقم" : "Amount"}</TableHead>
              <TableHead className="text-end w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell><div className="font-mono text-xs">{d.receiptNo}</div><div className="text-[10px] text-muted-foreground">{formatDate(d.date)}</div></TableCell>
                <TableCell>
                  <p className={cn("text-sm font-semibold leading-tight", isUrdu && "font-urdu")}>
                    {isUrdu ? (d.donorUrdu || d.donor) : d.donor}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge className={`${TYPE_META[d.type].tone} border-0 ${isUrdu ? "font-urdu" : ""}`}>
                    {isUrdu ? TYPE_META[d.type].ur : TYPE_META[d.type].en}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{d.purpose}</TableCell>
                <TableCell className="text-xs uppercase">{d.method}</TableCell>
                <TableCell className="text-end font-mono font-bold text-primary">{formatPKR(d.amountPaisa / 100)}</TableCell>
                <TableCell className="text-end"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => print(d.id)} aria-label={`Print donation receipt ${d.id}`}><Printer className="h-3.5 w-3.5" aria-hidden="true" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <RecordDialog open={open} onOpenChange={setOpen} onSave={handleSaveDonation} />

      {printDoc && (
        <div className="donation-receipt-print print-target hidden">
          <DonationReceipt d={printDoc} />
        </div>
      )}
    </div>
  );
}

function RecordDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (d: Omit<Donation, "id" | "receiptNo">) => void }) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [donor, setDonor] = useState("");
  const [donorUrdu, setDonorUrdu] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [type, setType] = useState<DonationType>("zakat");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "bank" | "online">("cash");
  const [submitting, setSubmitting] = useState(false);

  const handleIssue = async () => {
    if (submitting || !donor || !amount) return;
    setSubmitting(true);
    try {
      await onSave({
        date: new Date().toISOString().slice(0, 10),
        donor,
        donorUrdu: donorUrdu || donor,
        phone,
        cnic,
        type,
        purpose,
        amountPaisa: Number(amount) * 100,
        method,
      });
      setDonor("");
      setDonorUrdu("");
      setPhone("");
      setCnic("");
      setPurpose("");
      setAmount("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className={cn("font-heading", isUrdu && "font-urdu")}>
            {isUrdu ? "عطیہ درج کریں" : "Record Donation"}
          </DialogTitle>
          <DialogDescription className={cn(isUrdu && "font-urdu")}>
            {isUrdu ? "ایک خودکار نمبر والی رسید بنائی جائے گی جسے پرنٹ بھی کیا جا سکتا ہے۔" : "An auto-numbered receipt (DR-YYYY-####) will be created and printable."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <BilingualLabel urdu="نام عطیہ دہندہ" english="Donor Name" required><Input value={donor} onChange={(e) => setDonor(e.target.value)} placeholder="Haji…" disabled={submitting} /></BilingualLabel>
          <BilingualLabel urdu="اردو نام" english="Urdu Name"><Input value={donorUrdu} onChange={(e) => setDonorUrdu(e.target.value)} className="font-urdu text-right" dir="rtl" disabled={submitting} /></BilingualLabel>
          <BilingualLabel urdu="فون" english="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300-…" disabled={submitting} /></BilingualLabel>
          <BilingualLabel urdu="شناختی کارڈ" english="CNIC"><Input value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="35202-…" disabled={submitting} /></BilingualLabel>
          <BilingualLabel urdu="قسم" english="Type" required>
            <Select value={type} onValueChange={(v) => setType(v as DonationType)} disabled={submitting}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zakat">{isUrdu ? "زکوٰۃ" : "Zakat"}</SelectItem>
                <SelectItem value="sadqa">{isUrdu ? "صدقہ" : "Sadqa"}</SelectItem>
                <SelectItem value="khairat">{isUrdu ? "خیرات" : "Khairat"}</SelectItem>
                <SelectItem value="fitra">{isUrdu ? "فطرانہ" : "Fitrana"}</SelectItem>
                <SelectItem value="general">{isUrdu ? "عام عطیات" : "General"}</SelectItem>
              </SelectContent>
            </Select>
          </BilingualLabel>
          <BilingualLabel urdu="طریقہ ادائیگی" english="Method">
            <Select value={method} onValueChange={(v) => setMethod(v as "cash" | "bank" | "online")} disabled={submitting}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
            </Select>
          </BilingualLabel>
          <BilingualLabel urdu="رقم (PKR)" english="Amount (PKR)" required><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" disabled={submitting} /></BilingualLabel>
          <div className="col-span-2"><BilingualLabel urdu="مقصد" english="Purpose"><Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} placeholder="Orphan fees, building fund, books…" disabled={submitting} /></BilingualLabel></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button disabled={!donor || !amount || submitting} onClick={handleIssue} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{submitting ? "Issuing..." : "Issue Receipt"}</span>
          </Button>
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