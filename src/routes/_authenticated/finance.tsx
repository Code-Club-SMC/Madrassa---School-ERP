import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, Percent, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { financeRecords, incomeVsExpense, feeRecords } from "@/mock";
import { formatPKR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/finance")({
  component: FinanceDashboard,
});

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))"];

function FinanceDashboard() {
  const totals = useMemo(() => {
    const income = financeRecords.filter((r) => r.type === "income").reduce((a, r) => a + r.amount, 0);
    const expense = financeRecords.filter((r) => r.type === "expense").reduce((a, r) => a + r.amount, 0);
    const collected = feeRecords.filter((f) => f.status === "paid").length;
    const rate = Math.round((collected / Math.max(feeRecords.length, 1)) * 100);
    return { income, expense, net: income - expense, rate };
  }, []);

  const incomeBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; nameUrdu: string; value: number }>();
    financeRecords.filter((r) => r.type === "income").forEach((r) => {
      const cur = map.get(r.category) ?? { name: r.category, nameUrdu: r.categoryUrdu, value: 0 };
      cur.value += r.amount;
      map.set(r.category, cur);
    });
    return Array.from(map.values());
  }, []);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; nameUrdu: string; value: number }>();
    financeRecords.filter((r) => r.type === "expense").forEach((r) => {
      const cur = map.get(r.category) ?? { name: r.category, nameUrdu: r.categoryUrdu, value: 0 };
      cur.value += r.amount;
      map.set(r.category, cur);
    });
    return Array.from(map.values());
  }, []);

  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        titleUrdu="مالیاتی ڈیش بورڈ"
        description="Track income, expenses and category-wise cashflow."
        actions={<Button className="gap-1.5"><Plus className="h-4 w-4" />Add Transaction</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI icon={TrendingUp} label="Income" urdu="آمدنی" value={formatPKR(totals.income)} tone="positive" />
        <KPI icon={TrendingDown} label="Expenses" urdu="اخراجات" value={formatPKR(totals.expense)} tone="negative" />
        <KPI icon={Wallet} label="Net Balance" urdu="بیلنس" value={formatPKR(totals.net)} tone={totals.net >= 0 ? "positive" : "negative"} />
        <KPI icon={Percent} label="Fee Collection" urdu="فیس وصولی" value={`${totals.rate}%`} />
      </div>

      <Card className="p-5 mb-4">
        <div className="mb-3">
          <h3 className="font-heading font-semibold">Income vs Expense</h3>
          <p className="font-urdu text-sm text-muted-foreground">آمدنی بمقابلہ اخراجات · گزشتہ 12 ماہ</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => formatPKR(v)} />
              <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
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
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-end">Amount</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financeRecords.slice(0, 12).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{formatDate(r.date)}</TableCell>
                <TableCell><span className={cn("text-xs font-medium capitalize", r.type === "income" ? "text-chart-5 dark:text-chart-1" : "text-destructive")}>{r.type}</span></TableCell>
                <TableCell><span className="text-xs capitalize">{r.category}</span> · <span className="font-urdu text-sm">{r.categoryUrdu}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{r.description}</TableCell>
                <TableCell className={cn("text-end font-mono text-sm font-medium", r.type === "income" ? "text-chart-5 dark:text-chart-1" : "text-destructive")}>{r.type === "income" ? "+" : "−"}{formatPKR(r.amount)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
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
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => formatPKR(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
