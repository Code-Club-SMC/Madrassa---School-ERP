import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Percent, Plus, Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { financeRecords as initialFinance, incomeVsExpense, feeRecords, institution, type FinanceRecord, type System } from "@/mock";
import { formatPKR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/finance")({
  component: FinanceDashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" } as const;

type Scope = "both" | "school" | "madrassa";

function FinanceDashboard() {
  const [records, setRecords] = useState<FinanceRecord[]>(initialFinance);
  const [scope, setScope] = useState<Scope>("both");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"overview" | "balance">("overview");

  const scoped = useMemo(
    () => (scope === "both" ? records : records.filter((r) => r.system === scope || r.system === "both")),
    [records, scope],
  );

  const totals = useMemo(() => {
    const income = scoped.filter((r) => r.type === "income").reduce((a, r) => a + r.amount, 0);
    const expense = scoped.filter((r) => r.type === "expense").reduce((a, r) => a + r.amount, 0);
    const collected = feeRecords.filter((f) => f.status === "paid").length;
    const rate = Math.round((collected / Math.max(feeRecords.length, 1)) * 100);
    return { income, expense, net: income - expense, rate };
  }, [scoped]);

  const incomeBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; nameUrdu: string; value: number }>();
    scoped.filter((r) => r.type === "income").forEach((r) => {
      const cur = map.get(r.category) ?? { name: r.category, nameUrdu: r.categoryUrdu, value: 0 };
      cur.value += r.amount;
      map.set(r.category, cur);
    });
    return Array.from(map.values());
  }, [scoped]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; nameUrdu: string; value: number }>();
    scoped.filter((r) => r.type === "expense").forEach((r) => {
      const cur = map.get(r.category) ?? { name: r.category, nameUrdu: r.categoryUrdu, value: 0 };
      cur.value += r.amount;
      map.set(r.category, cur);
    });
    return Array.from(map.values());
  }, [scoped]);

  const incomeKey = scope === "school" ? "schoolIncome" : scope === "madrassa" ? "madrassaIncome" : "income";
  const expenseKey = scope === "school" ? "schoolExpense" : scope === "madrassa" ? "madrassaExpense" : "expense";

  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        titleUrdu="مالیاتی ڈیش بورڈ"
        description="Track income, expenses and category-wise cashflow."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" />Export</Button>
            <AddTxnDialog open={open} onOpenChange={setOpen} onAdd={(r) => setRecords((p) => [r, ...p])} defaultSystem={scope === "both" ? "both" : scope} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Card className="p-2 inline-flex">
          <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <TabsList>
              <TabsTrigger value="both">Combined · مشترکہ</TabsTrigger>
              <TabsTrigger value="school">School · اسکول</TabsTrigger>
              <TabsTrigger value="madrassa">Madrassa · مدرسہ</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
        <Card className="p-2 inline-flex">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="overview">Overview · جائزہ</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet · بیلنس شیٹ</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </div>

      {view === "balance" ? (
        <BalanceSheet scope={scope} incomeBreakdown={incomeBreakdown} expenseBreakdown={expenseBreakdown} totals={totals} />
      ) : (
        <>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI icon={TrendingUp} label="Income" urdu="آمدنی" value={formatPKR(totals.income)} tone="positive" />
        <KPI icon={TrendingDown} label="Expenses" urdu="اخراجات" value={formatPKR(totals.expense)} tone="negative" />
        <KPI icon={Wallet} label="Net Balance" urdu="بیلنس" value={formatPKR(totals.net)} tone={totals.net >= 0 ? "positive" : "negative"} />
        <KPI icon={Percent} label="Fee Collection" urdu="فیس وصولی" value={`${totals.rate}%`} />
      </div>

      <Card className="p-5 mb-4">
        <div className="mb-3">
          <h3 className="font-heading font-semibold">Income vs Expense</h3>
          <p className="font-urdu text-sm text-muted-foreground">آمدنی بمقابلہ اخراجات · گزشتہ 12 ماہ · {scope === "both" ? "مشترکہ" : scope === "school" ? "اسکول" : "مدرسہ"}</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpense} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--border)" />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--border)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [formatPKR(v), String(n)]} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar name="Income" dataKey={incomeKey} fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              <Bar name="Expense" dataKey={expenseKey} fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <BreakdownCard title="Income breakdown" urdu="آمدنی کی تفصیل" data={incomeBreakdown} />
        <BreakdownCard title="Expense breakdown" urdu="اخراجات کی تفصیل" data={expenseBreakdown} />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-heading font-semibold">Recent Transactions</h3>
          <p className="font-urdu text-sm text-muted-foreground">حالیہ لین دین</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>System</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-end">Amount</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scoped.slice(0, 14).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{formatDate(r.date)}</TableCell>
                <TableCell><span className={cn("text-xs font-medium capitalize", r.type === "income" ? "text-chart-5 dark:text-chart-1" : "text-destructive")}>{r.type}</span></TableCell>
                <TableCell><span className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.system}</span></TableCell>
                <TableCell><span className="text-xs capitalize">{r.category}</span> · <span className="font-urdu text-sm">{r.categoryUrdu}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{r.description}</TableCell>
                <TableCell className={cn("text-end font-mono text-sm font-medium", r.type === "income" ? "text-chart-5 dark:text-chart-1" : "text-destructive")}>{r.type === "income" ? "+" : "−"}{formatPKR(r.amount)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, urdu, value, tone }: { icon: React.ElementType; label: string; urdu: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-urdu text-xs text-muted-foreground">{urdu}</p>
          <p className={cn("font-heading text-xl font-bold mt-1 truncate", tone === "positive" && "text-chart-5 dark:text-chart-1", tone === "negative" && "text-destructive")}>{value}</p>
        </div>
        <Icon className={cn("h-5 w-5 shrink-0", tone === "positive" ? "text-chart-5 dark:text-chart-1" : tone === "negative" ? "text-destructive" : "text-muted-foreground")} />
      </div>
    </Card>
  );
}

function BreakdownCard({ title, urdu, data }: { title: string; urdu: string; data: { name: string; nameUrdu: string; value: number }[] }) {
  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="font-heading font-semibold">{title}</h3>
        <p className="font-urdu text-sm text-muted-foreground">{urdu}</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="var(--card)" strokeWidth={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPKR(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AddTxnDialog({ open, onOpenChange, onAdd, defaultSystem }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (r: FinanceRecord) => void; defaultSystem: System }) {
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    category: "fees",
    amount: "",
    description: "",
    source: "",
    system: defaultSystem,
    date: new Date().toISOString().slice(0, 10),
  });
  const cats: Record<string, string> = { fees: "فیس", donation: "عطیہ", charity: "صدقات", inventory: "سامان", salary: "تنخواہ", misc: "متفرق" };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Transaction · لین دین درج کریں</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>System</Label>
              <Select value={form.system} onValueChange={(v) => setForm({ ...form, system: v as System })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="school">School</SelectItem><SelectItem value="madrassa">Madrassa</SelectItem><SelectItem value="both">Combined</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(cats).map(([k, u]) => <SelectItem key={k} value={k}><span className="capitalize">{k}</span> · <span className="font-urdu">{u}</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (PKR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Fee Module, Vendor, Donor name…" /></div>
          <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            const amt = parseFloat(form.amount);
            if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
            onAdd({
              id: `fin-${Date.now()}`,
              date: form.date,
              type: form.type,
              category: form.category as FinanceRecord["category"],
              categoryUrdu: cats[form.category] ?? "",
              description: form.description || "—",
              amount: amt,
              source: form.source || "—",
              system: form.system,
            });
            toast.success("Transaction recorded");
            onOpenChange(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
