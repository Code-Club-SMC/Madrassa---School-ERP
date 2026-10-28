import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Percent, Plus, Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { institution, type FinanceRecord, type System } from "@/mock";
import { formatPKR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-context";

export const Route = createFileRoute("/_authenticated/finance/")({
  component: FinanceDashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" } as const;

type Scope = "both" | "school" | "madrassa";

function FinanceDashboard() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const [localRecords, setLocalRecords] = useState<FinanceRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("msmis_finance_records");
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  });
  const [serverTransactions, setServerTransactions] = useState<FinanceRecord[]>([]);
  const [serverMonthly, setServerMonthly] = useState<
    Array<{
      month: string;
      monthUr: string;
      income: number;
      expense: number;
      schoolIncome: number;
      madrassaIncome: number;
      schoolExpense: number;
      madrassaExpense: number;
    }>
  >([]);
  const [serverDaily, setServerDaily] = useState<
    Array<{
      day: string;
      fullLabel: string;
      income: number;
      expense: number;
      schoolIncome: number;
      madrassaIncome: number;
      schoolExpense: number;
      madrassaExpense: number;
    }>
  >([]);
  const [serverKpis, setServerKpis] = useState<{
    monthlyIncome: number;
    schoolMonthlyIncome: number;
    madrassaMonthlyIncome: number;
    annualIncome: number;
    schoolAnnualIncome: number;
    madrassaAnnualIncome: number;
    openArrears: number;
    recoveryRate: number;
  } | null>(null);

  const [scope, setScope] = useState<Scope>("both");
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/finance/overview", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!mounted || !d) return;
        if (Array.isArray(d.recentTransactions)) setServerTransactions(d.recentTransactions);
        if (Array.isArray(d.monthlyHistory)) setServerMonthly(d.monthlyHistory);
        if (Array.isArray(d.dailyHistory)) setServerDaily(d.dailyHistory);
        if (d.kpis) setServerKpis(d.kpis);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddTxn = (r: FinanceRecord) => {
    setLocalRecords((prev) => {
      const next = [r, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("msmis_finance_records", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const records = useMemo(() => {
    const localIds = new Set(localRecords.map((r) => r.id));
    const uniqueServer = serverTransactions.filter((r) => !localIds.has(r.id));
    return [...localRecords, ...uniqueServer];
  }, [localRecords, serverTransactions]);

  const scoped = useMemo(
    () => (scope === "both" ? records : records.filter((r) => r.system === scope || r.system === "both")),
    [records, scope],
  );

  const incomeKey = scope === "school" ? "schoolIncome" : scope === "madrassa" ? "madrassaIncome" : "income";
  const expenseKey = scope === "school" ? "schoolExpense" : scope === "madrassa" ? "madrassaExpense" : "expense";

  const dailyIncomeVsExpense = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthName = now.toLocaleString("en-US", { month: "short" });
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const recordSchoolIncomeByDay = new Map<number, number>();
    const recordSchoolExpenseByDay = new Map<number, number>();
    const recordMadrassaIncomeByDay = new Map<number, number>();
    const recordMadrassaExpenseByDay = new Map<number, number>();

    localRecords.forEach((r) => {
      const d = new Date(r.date);
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        const day = d.getDate();
        if (r.type === "income") {
          if (r.system === "school") {
            recordSchoolIncomeByDay.set(day, (recordSchoolIncomeByDay.get(day) ?? 0) + r.amount);
          } else if (r.system === "madrassa") {
            recordMadrassaIncomeByDay.set(day, (recordMadrassaIncomeByDay.get(day) ?? 0) + r.amount);
          } else {
            const sAmt = Math.round(r.amount * 0.5);
            recordSchoolIncomeByDay.set(day, (recordSchoolIncomeByDay.get(day) ?? 0) + sAmt);
            recordMadrassaIncomeByDay.set(day, (recordMadrassaIncomeByDay.get(day) ?? 0) + (r.amount - sAmt));
          }
        } else {
          if (r.system === "school") {
            recordSchoolExpenseByDay.set(day, (recordSchoolExpenseByDay.get(day) ?? 0) + r.amount);
          } else if (r.system === "madrassa") {
            recordMadrassaExpenseByDay.set(day, (recordMadrassaExpenseByDay.get(day) ?? 0) + r.amount);
          } else {
            const sAmt = Math.round(r.amount * 0.5);
            recordSchoolExpenseByDay.set(day, (recordSchoolExpenseByDay.get(day) ?? 0) + sAmt);
            recordMadrassaExpenseByDay.set(day, (recordMadrassaExpenseByDay.get(day) ?? 0) + (r.amount - sAmt));
          }
        }
      }
    });

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const baseDay = serverDaily[index] ?? {
        schoolIncome: 0,
        madrassaIncome: 0,
        schoolExpense: 0,
        madrassaExpense: 0,
      };

      const schoolIncome = (baseDay.schoolIncome ?? 0) + (recordSchoolIncomeByDay.get(day) ?? 0);
      const madrassaIncome = (baseDay.madrassaIncome ?? 0) + (recordMadrassaIncomeByDay.get(day) ?? 0);
      const schoolExpense = (baseDay.schoolExpense ?? 0) + (recordSchoolExpenseByDay.get(day) ?? 0);
      const madrassaExpense = (baseDay.madrassaExpense ?? 0) + (recordMadrassaExpenseByDay.get(day) ?? 0);

      return {
        day: `${day}`,
        fullLabel: `${monthName} ${day}`,
        income: schoolIncome + madrassaIncome,
        expense: schoolExpense + madrassaExpense,
        schoolIncome,
        madrassaIncome,
        schoolExpense,
        madrassaExpense,
      };
    });
  }, [serverDaily, localRecords]);

  const totals = useMemo(() => {
    const rate = serverKpis?.recoveryRate ?? 0;

    if (period === "yearly") {
      let income = serverMonthly.reduce((acc, curr) => acc + ((curr as any)[incomeKey] ?? curr.income), 0);
      let expense = serverMonthly.reduce((acc, curr) => acc + ((curr as any)[expenseKey] ?? curr.expense), 0);
      if (serverKpis) {
        const kpiAnnual =
          scope === "school"
            ? serverKpis.schoolAnnualIncome
            : scope === "madrassa"
              ? serverKpis.madrassaAnnualIncome
              : serverKpis.annualIncome;
        if (kpiAnnual > 0) income = kpiAnnual;
      }
      return { income, expense, net: income - expense, rate };
    }

    let income = dailyIncomeVsExpense.reduce((acc, curr) => acc + ((curr as any)[incomeKey] ?? curr.income), 0);
    let expense = dailyIncomeVsExpense.reduce((acc, curr) => acc + ((curr as any)[expenseKey] ?? curr.expense), 0);
    if (serverKpis) {
      const kpiMonthly =
        scope === "school"
          ? serverKpis.schoolMonthlyIncome
          : scope === "madrassa"
            ? serverKpis.madrassaMonthlyIncome
            : serverKpis.monthlyIncome;
      if (kpiMonthly > 0) income = kpiMonthly;
    }
    return { income, expense, net: income - expense, rate };
  }, [period, incomeKey, expenseKey, dailyIncomeVsExpense, serverMonthly, serverKpis, scope]);

  const incomeBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; nameUrdu: string; value: number }>();
    const mult = period === "yearly" ? 12 : 1;
    scoped.filter((r) => r.type === "income").forEach((r) => {
      const cur = map.get(r.category) ?? { name: r.category, nameUrdu: r.categoryUrdu, value: 0 };
      cur.value += r.amount * mult;
      map.set(r.category, cur);
    });
    return Array.from(map.values());
  }, [scoped, period]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; nameUrdu: string; value: number }>();
    const mult = period === "yearly" ? 12 : 1;
    scoped.filter((r) => r.type === "expense").forEach((r) => {
      const cur = map.get(r.category) ?? { name: r.category, nameUrdu: r.categoryUrdu, value: 0 };
      cur.value += r.amount * mult;
      map.set(r.category, cur);
    });
    return Array.from(map.values());
  }, [scoped, period]);

  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        titleUrdu="مالیاتی ڈیش بورڈ"
        description="Track income, expenses and category-wise cashflow."
        descriptionUrdu="آمدنی، اخراجات اور کیش فلو کی باقاعدہ نگرانی کریں۔"
        actions={
          <div className="flex items-center gap-2">
            <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Printer className="h-4 w-4" />
                  {isUrdu ? "بیلنس شیٹ" : "Balance Sheet"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="sr-only">
                  <DialogTitle>{isUrdu ? "بیلنس شیٹ" : "Balance Sheet"}</DialogTitle>
                </DialogHeader>
                <BalanceSheet
                  scope={scope}
                  incomeBreakdown={incomeBreakdown}
                  expenseBreakdown={expenseBreakdown}
                  totals={totals}
                  isUrdu={isUrdu}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              {isUrdu ? "برآمد کریں" : "Export"}
            </Button>
            <AddTxnDialog open={open} onOpenChange={setOpen} onAdd={handleAddTxn} defaultSystem={scope === "both" ? "both" : scope} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Card className="p-2 inline-flex">
          <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <TabsList>
              <TabsTrigger value="both">{isUrdu ? "مشترکہ" : "Combined"}</TabsTrigger>
              <TabsTrigger value="school">{isUrdu ? "اسکول" : "School"}</TabsTrigger>
              <TabsTrigger value="madrassa">{isUrdu ? "مدرسہ" : "Madrassa"}</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
        <Card className="p-2 inline-flex">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly">{isUrdu ? "ماہانہ" : "Monthly"}</TabsTrigger>
              <TabsTrigger value="yearly">{isUrdu ? "سالانہ" : "Yearly"}</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI
          icon={TrendingUp}
          label={
            isUrdu
              ? period === "monthly" ? "ماہانہ آمدنی" : "سالانہ آمدنی"
              : period === "monthly" ? "Monthly Income" : "Annual Income"
          }
          value={formatPKR(totals.income)}
          tone="positive"
          isUrdu={isUrdu}
        />
        <KPI
          icon={TrendingDown}
          label={
            isUrdu
              ? period === "monthly" ? "ماہانہ اخراجات" : "سالانہ اخراجات"
              : period === "monthly" ? "Monthly Expenses" : "Annual Expenses"
          }
          value={formatPKR(totals.expense)}
          tone="negative"
          isUrdu={isUrdu}
        />
        <KPI
          icon={Wallet}
          label={isUrdu ? "خالص بیلنس" : "Net Balance"}
          value={formatPKR(totals.net)}
          tone={totals.net >= 0 ? "positive" : "negative"}
          isUrdu={isUrdu}
        />
        <KPI
          icon={Percent}
          label={isUrdu ? "فیس وصولی کی شرح" : "Fee Collection"}
          value={`${totals.rate}%`}
          isUrdu={isUrdu}
        />
      </div>

      <Card className="p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className={cn("font-heading font-semibold", isUrdu && "font-urdu")}>
              {isUrdu
                ? period === "monthly" ? "یومیہ آمدنی بمقابلہ اخراجات" : "ماہانہ آمدنی بمقابلہ اخراجات"
                : period === "monthly" ? "Daily Income vs Expense" : "Monthly Income vs Expense"}
            </h3>
            <p className={cn("text-sm text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu
                ? `آمدنی بمقابلہ اخراجات · ${period === "monthly" ? "یومیہ (موجودہ ماہ)" : "ماہانہ (گزشتہ 12 ماہ)"} · ${scope === "both" ? "مشترکہ" : scope === "school" ? "اسکول" : "مدرسہ"}`
                : `${period === "monthly" ? "Daily (Current Month)" : "Monthly (Last 12 Months)"} · ${scope === "both" ? "Combined" : scope === "school" ? "School" : "Madrassa"}`}
            </p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-2)]" />
              <span className={cn(isUrdu && "font-urdu")}>
                {isUrdu
                  ? period === "monthly" ? "یومیہ آمدنی" : "ماہانہ آمدنی"
                  : period === "monthly" ? "Daily Income" : "Monthly Income"}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-4)]" />
              <span className={cn(isUrdu && "font-urdu")}>
                {isUrdu
                  ? period === "monthly" ? "یومیہ اخراجات" : "ماہانہ اخراجات"
                  : period === "monthly" ? "Daily Expense" : "Monthly Expense"}
              </span>
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={period === "monthly" ? dailyIncomeVsExpense : serverMonthly} barGap={period === "monthly" ? 2 : 6}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey={period === "monthly" ? "day" : (isUrdu ? "monthUr" : "month")}
                tick={{ fontSize: period === "monthly" ? 10 : 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
                interval={period === "monthly" ? 1 : 0}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--border)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, n) => [formatPKR(v), String(n)]}
                labelFormatter={(label) =>
                  period === "monthly"
                    ? `${isUrdu ? "دن" : "Day"} ${label} (${new Date().toLocaleString(isUrdu ? "ur-PK" : "en-US", { month: "long" })})`
                    : String(label)
                }
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar name={isUrdu ? "آمدنی" : "Income"} dataKey={incomeKey} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar name={isUrdu ? "اخراجات" : "Expense"} dataKey={expenseKey} fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <BreakdownCard
          title={isUrdu ? "آمدنی کی تفصیل" : "Income Breakdown"}
          data={incomeBreakdown}
          isUrdu={isUrdu}
        />
        <BreakdownCard
          title={isUrdu ? "اخراجات کی تفصیل" : "Expense Breakdown"}
          data={expenseBreakdown}
          isUrdu={isUrdu}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className={cn("font-heading font-semibold", isUrdu && "font-urdu")}>
            {isUrdu ? "حالیہ لین دین" : "Recent Transactions"}
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{isUrdu ? "تاریخ" : "Date"}</TableHead>
              <TableHead>{isUrdu ? "نوعیت" : "Type"}</TableHead>
              <TableHead>{isUrdu ? "نظام" : "System"}</TableHead>
              <TableHead>{isUrdu ? "شعبہ / زمرہ" : "Category"}</TableHead>
              <TableHead>{isUrdu ? "تفصیل" : "Description"}</TableHead>
              <TableHead className="text-end">{isUrdu ? "رقم" : "Amount"}</TableHead>
              <TableHead>{isUrdu ? "ذریعہ ادائیگی" : "Source"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scoped.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {isUrdu ? "کوئی لین دین درج نہیں ہے۔" : "No transactions recorded."}
                </TableCell>
              </TableRow>
            ) : (
              scoped.slice(0, 14).map((r) => {
                const categoryDisplay = isUrdu
                  ? (r.categoryUrdu || r.category)
                  : (r.category.charAt(0).toUpperCase() + r.category.slice(1));
                const rawSource = r.source || "";
                const sourceDisplay = isUrdu
                  ? (r.sourceUrdu ?? (rawSource.includes(" · ") ? rawSource.split(" · ")[1] : rawSource))
                  : (rawSource.includes(" · ") ? rawSource.split(" · ")[0] : rawSource);

                let descDisplay = isUrdu ? (r.descriptionUrdu ?? r.description) : r.description;
                if (!isUrdu && descDisplay.startsWith("فیس وصولی:")) {
                  descDisplay = descDisplay.replace(/^فیس وصولی:\s*رسید\s*#?/, "Fee Collection: Receipt #");
                }

                const systemDisplay = isUrdu
                  ? (r.system === "school" ? "اسکول" : r.system === "madrassa" ? "مدرسہ" : "مشترکہ")
                  : (r.system === "school" ? "School" : r.system === "madrassa" ? "Madrassa" : "Combined");

                const typeDisplay = isUrdu
                  ? (r.type === "income" ? "آمدنی" : "اخراجات")
                  : (r.type === "income" ? "Income" : "Expense");

                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{formatDate(r.date)}</TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-medium capitalize", r.type === "income" ? "text-chart-5 dark:text-chart-1" : "text-destructive")}>
                        {typeDisplay}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {systemDisplay}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs", isUrdu && "font-urdu")}>{categoryDisplay}</span>
                    </TableCell>
                    <TableCell className={cn("text-xs text-muted-foreground max-w-xs truncate", isUrdu && "font-urdu")}>
                      {descDisplay}
                    </TableCell>
                    <TableCell className={cn("text-end font-mono text-sm font-medium", r.type === "income" ? "text-chart-5 dark:text-chart-1" : "text-destructive")}>
                      {r.type === "income" ? "+" : "−"}{formatPKR(r.amount)}
                    </TableCell>
                    <TableCell className={cn("text-xs text-muted-foreground", isUrdu && "font-urdu")}>
                      {sourceDisplay}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  tone,
  isUrdu,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "positive" | "negative";
  isUrdu?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={cn("text-xs text-muted-foreground", isUrdu && "font-urdu")}>{label}</p>
          <p className={cn("font-heading text-xl font-bold mt-1 truncate", tone === "positive" && "text-chart-5 dark:text-chart-1", tone === "negative" && "text-destructive")}>{value}</p>
        </div>
        <Icon className={cn("h-5 w-5 shrink-0", tone === "positive" ? "text-chart-5 dark:text-chart-1" : tone === "negative" ? "text-destructive" : "text-muted-foreground")} />
      </div>
    </Card>
  );
}

function BreakdownCard({
  title,
  data,
  isUrdu,
}: {
  title: string;
  data: { name: string; nameUrdu: string; value: number }[];
  isUrdu?: boolean;
}) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      displayName: isUrdu ? (item.nameUrdu || item.name) : (item.name.charAt(0).toUpperCase() + item.name.slice(1)),
    }));
  }, [data, isUrdu]);

  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className={cn("font-heading font-semibold", isUrdu && "font-urdu")}>{title}</h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="displayName" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="var(--card)" strokeWidth={2}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPKR(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function BalanceSheet({
  scope,
  incomeBreakdown,
  expenseBreakdown,
  totals,
  isUrdu,
}: {
  scope: Scope;
  incomeBreakdown: { name: string; nameUrdu: string; value: number }[];
  expenseBreakdown: { name: string; nameUrdu: string; value: number }[];
  totals: { income: number; expense: number; net: number; rate: number };
  isUrdu: boolean;
}) {
  const period = new Date().toLocaleDateString(isUrdu ? "ur-PK" : "en-PK", { month: "long", year: "numeric" });
  const assets = [
    { label: isUrdu ? "بینک میں نقد رقم" : "Cash at Bank", value: Math.round(totals.net * 0.62) + 480000 },
    { label: isUrdu ? "واجب الادا فیس" : "Fees Receivable", value: 320000 },
    { label: isUrdu ? "سامان و اسٹاک" : "Inventory Stock", value: 180000 },
    { label: isUrdu ? "آلات و فرنیچر" : "Equipment & Furniture", value: 950000 },
  ];
  const liabilities = [
    { label: isUrdu ? "واجب الادا تنخواہیں" : "Salaries Payable", value: 240000 },
    { label: isUrdu ? "یوٹیلیٹی بلز" : "Utilities Payable", value: 65000 },
    { label: isUrdu ? "وینڈر کے بقایا جات" : "Vendor Dues", value: 120000 },
  ];
  const totalAssets = assets.reduce((a, b) => a + b.value, 0);
  const totalLiab = liabilities.reduce((a, b) => a + b.value, 0);
  const equity = totalAssets - totalLiab;

  const scopeLabel = isUrdu
    ? (scope === "both" ? "مشترکہ" : scope === "school" ? "اسکول" : "مدرسہ")
    : (scope === "both" ? "Combined" : scope === "school" ? "School" : "Madrassa");

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className={cn("font-heading font-semibold", isUrdu && "font-urdu")}>
            {isUrdu ? `بیلنس شیٹ · ${scopeLabel}` : `Balance Sheet · ${scopeLabel}`}
          </h3>
          <p className={cn("text-sm text-muted-foreground", isUrdu && "font-urdu")}>
            {period}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          {isUrdu ? "پرنٹ کریں" : "Print"}
        </Button>
      </div>
      <div className="balance-sheet-print print-target p-6">
        <div className="text-center border-b border-border pb-3 mb-4">
          <p className={cn("font-bold text-2xl", isUrdu ? "font-urdu" : "font-heading")}>
            {isUrdu ? institution.nameUrdu : institution.nameEnglish}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isUrdu ? `بیلنس شیٹ · ${period}` : `Balance Sheet · ${period}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className={cn("font-semibold mb-2 border-b border-border pb-1", isUrdu && "font-urdu")}>
              {isUrdu ? "اثاثے" : "Assets"}
            </h4>
            <table className="w-full">
              <tbody>
                {assets.map((a) => (
                  <tr key={a.label} className="border-b border-border/40">
                    <td className="py-1.5"><div className={cn(isUrdu && "font-urdu")}>{a.label}</div></td>
                    <td className="py-1.5 text-end font-mono">{formatPKR(a.value)}</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-muted/30">
                  <td className={cn("py-2 px-1", isUrdu && "font-urdu")}>{isUrdu ? "کل اثاثے" : "Total Assets"}</td>
                  <td className="py-2 text-end font-mono">{formatPKR(totalAssets)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className={cn("font-semibold mb-2 border-b border-border pb-1", isUrdu && "font-urdu")}>
              {isUrdu ? "واجبات اور ایکویٹی" : "Liabilities & Equity"}
            </h4>
            <table className="w-full">
              <tbody>
                {liabilities.map((a) => (
                  <tr key={a.label} className="border-b border-border/40">
                    <td className={cn("py-1.5", isUrdu && "font-urdu")}>{a.label}</td>
                    <td className="py-1.5 text-end font-mono">{formatPKR(a.value)}</td>
                  </tr>
                ))}
                <tr className="border-b border-border/40">
                  <td className={cn("py-1.5", isUrdu && "font-urdu")}>{isUrdu ? "کل واجبات" : "Total Liabilities"}</td>
                  <td className="py-1.5 text-end font-mono">{formatPKR(totalLiab)}</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className={cn("py-1.5", isUrdu && "font-urdu")}>{isUrdu ? "ٹرسٹ فنڈ / ایکویٹی" : "Equity / Trust Fund"}</td>
                  <td className="py-1.5 text-end font-mono">{formatPKR(equity)}</td>
                </tr>
                <tr className="font-semibold bg-muted/30">
                  <td className={cn("py-2 px-1", isUrdu && "font-urdu")}>{isUrdu ? "کل میزان" : "Total"}</td>
                  <td className="py-2 text-end font-mono">{formatPKR(totalLiab + equity)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <MiniStat label={isUrdu ? "آمدنی" : "Period Income"} value={formatPKR(totals.income)} isUrdu={isUrdu} />
          <MiniStat label={isUrdu ? "اخراجات" : "Period Expense"} value={formatPKR(totals.expense)} isUrdu={isUrdu} />
          <MiniStat label={isUrdu ? "خالص بچت" : "Net Surplus"} value={formatPKR(totals.net)} highlight={totals.net >= 0} isUrdu={isUrdu} />
          <MiniStat label={isUrdu ? "ایکویٹی تناسب" : "Equity Ratio"} value={`${Math.round((equity / Math.max(totalAssets, 1)) * 100)}%`} isUrdu={isUrdu} />
        </div>

        <div className="mt-4">
          <h4 className={cn("font-semibold text-sm mb-2", isUrdu && "font-urdu")}>
            {isUrdu ? "آمدنی کی اقسام" : "Income Categories"}
          </h4>
          <table className="w-full text-xs">
            <tbody>
              {incomeBreakdown.map((c) => (
                <tr key={c.name} className="border-b border-border/40">
                  <td className="py-1">
                    <span className={cn(isUrdu ? "font-urdu" : "capitalize")}>
                      {isUrdu ? (c.nameUrdu || c.name) : c.name}
                    </span>
                  </td>
                  <td className="py-1 text-end font-mono">{formatPKR(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <h4 className={cn("font-semibold text-sm mb-2", isUrdu && "font-urdu")}>
            {isUrdu ? "اخراجات کی اقسام" : "Expense Categories"}
          </h4>
          <table className="w-full text-xs">
            <tbody>
              {expenseBreakdown.map((c) => (
                <tr key={c.name} className="border-b border-border/40">
                  <td className="py-1">
                    <span className={cn(isUrdu ? "font-urdu" : "capitalize")}>
                      {isUrdu ? (c.nameUrdu || c.name) : c.name}
                    </span>
                  </td>
                  <td className="py-1 text-end font-mono">{formatPKR(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-12 mt-10 text-xs">
          <div className="text-center border-t border-border pt-1">
            {isUrdu ? "تیار کنندہ" : "Prepared by"}
          </div>
          <div className="text-center border-t border-border pt-1">
            {isUrdu ? "آڈیٹر" : "Auditor"}
          </div>
          <div className="text-center border-t border-border pt-1">
            {isUrdu ? "مہتمم / پرنسپل" : "Principal"}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MiniStat({ label, value, highlight, isUrdu }: { label: string; value: string; highlight?: boolean; isUrdu?: boolean }) {
  return (
    <div className="border border-border rounded p-3">
      <p className={cn("text-[10px] uppercase tracking-wide text-muted-foreground", isUrdu && "font-urdu")}>{label}</p>
      <p className={cn("font-mono text-base font-bold mt-1", highlight && "text-chart-5 dark:text-chart-1")}>{value}</p>
    </div>
  );
}

function AddTxnDialog({ open, onOpenChange, onAdd, defaultSystem }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (r: FinanceRecord) => void; defaultSystem: System }) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    category: "fees",
    amount: "",
    description: "",
    source: "",
    system: defaultSystem,
    date: new Date().toISOString().slice(0, 10),
  });
  const cats: Record<string, { en: string; ur: string }> = {
    fees: { en: "Student Fees", ur: "فیس طلباء" },
    donation: { en: "Donations", ur: "عطیات" },
    charity: { en: "Charity & Sadaqah", ur: "صدقات و خیرات" },
    inventory: { en: "Inventory & Supplies", ur: "سامان و اسٹاک" },
    salary: { en: "Salaries & Payroll", ur: "تنخواہیں" },
    misc: { en: "Miscellaneous", ur: "متفرق" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {isUrdu ? "نیا لین دین درج کریں" : "Add Transaction"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={cn(isUrdu && "font-urdu")}>
            {isUrdu ? "لین دین درج کریں" : "Record Transaction"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className={cn(isUrdu && "font-urdu")}>{isUrdu ? "نوعیت" : "Type"}</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">{isUrdu ? "آمدنی" : "Income"}</SelectItem>
                  <SelectItem value="expense">{isUrdu ? "اخراجات" : "Expense"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={cn(isUrdu && "font-urdu")}>{isUrdu ? "نظام" : "System"}</Label>
              <Select value={form.system} onValueChange={(v) => setForm({ ...form, system: v as System })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">{isUrdu ? "اسکول" : "School"}</SelectItem>
                  <SelectItem value="madrassa">{isUrdu ? "مدرسہ" : "Madrassa"}</SelectItem>
                  <SelectItem value="both">{isUrdu ? "مشترکہ" : "Combined"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className={cn(isUrdu && "font-urdu")}>{isUrdu ? "زمرہ" : "Category"}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(cats).map(([k, meta]) => (
                    <SelectItem key={k} value={k}>
                      <span className={cn(isUrdu && "font-urdu")}>
                        {isUrdu ? meta.ur : meta.en}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={cn(isUrdu && "font-urdu")}>{isUrdu ? "رقم (روپے)" : "Amount (PKR)"}</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className={cn(isUrdu && "font-urdu")}>{isUrdu ? "تاریخ" : "Date"}</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label className={cn(isUrdu && "font-urdu")}>{isUrdu ? "ذریعہ / نام" : "Source"}</Label>
            <Input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder={isUrdu ? "بینک، کیش، وینڈر یا عطیہ دہندہ..." : "Cash, Bank, Vendor, or Donor name…"}
            />
          </div>
          <div>
            <Label className={cn(isUrdu && "font-urdu")}>{isUrdu ? "تفصیل" : "Description"}</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isUrdu ? "منسوخ کریں" : "Cancel"}
          </Button>
          <Button onClick={() => {
            const amt = parseFloat(form.amount);
            if (!amt || amt <= 0) {
              toast.error(isUrdu ? "درست رقم درج کریں" : "Enter a valid amount");
              return;
            }
            const selectedCat = cats[form.category];
            onAdd({
              id: `fin-${Date.now()}`,
              date: form.date,
              type: form.type,
              category: form.category as FinanceRecord["category"],
              categoryUrdu: selectedCat?.ur ?? "",
              description: form.description || (isUrdu ? "—" : "—"),
              descriptionUrdu: form.description || (isUrdu ? "—" : "—"),
              amount: amt,
              source: form.source || (isUrdu ? "نقد" : "Cash"),
              sourceUrdu: form.source || "نقد",
              system: form.system,
            });
            toast.success(isUrdu ? "لین دین درج کر لیا گیا" : "Transaction recorded");
            onOpenChange(false);
          }}>
            {isUrdu ? "محفوظ کریں" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
