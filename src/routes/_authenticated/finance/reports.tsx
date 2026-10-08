import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Download,
  Printer,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  aggregateByCategory,
  aggregateByMonth,
  filterTransactions,
  type ComprehensiveTransaction,
  type FinancePeriod,
  type FinanceScope,
} from "@/lib/finance/comprehensive-reports";

export const Route = createFileRoute("/_authenticated/finance/reports")({
  component: FinanceReportsPage,
});

type FinanceReportType = "income" | "expenses";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatRupees(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function FinanceReportsPage() {
  const [report, setReport] = useState<FinanceReportType>("income");
  const [period, setPeriod] = useState<FinancePeriod>("annually");
  const [system, setSystem] = useState<FinanceScope>("both");
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [dateFrom, setDateFrom] = useState<string>("2026-05-01");
  const [dateTo, setDateTo] = useState<string>(today());
  const [query, setQuery] = useState("");

  // Aggregated comprehensive transactions for Income and Expenses
  const filteredIncomeTransactions = useMemo(() => {
    return filterTransactions({
      type: "income",
      scope: system,
      period,
      year,
      month,
      dateFrom,
      dateTo,
      query,
    });
  }, [system, period, year, month, dateFrom, dateTo, query]);

  const filteredExpenseTransactions = useMemo(() => {
    return filterTransactions({
      type: "expense",
      scope: system,
      period,
      year,
      month,
      dateFrom,
      dateTo,
      query,
    });
  }, [system, period, year, month, dateFrom, dateTo, query]);

  // Summary Metrics
  const incomeTotal = useMemo(() => {
    return filteredIncomeTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [filteredIncomeTransactions]);

  const expenseTotal = useMemo(() => {
    return filteredExpenseTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [filteredExpenseTransactions]);

  const incomeCategories = useMemo(() => {
    return aggregateByCategory(filteredIncomeTransactions);
  }, [filteredIncomeTransactions]);

  const expenseCategories = useMemo(() => {
    return aggregateByCategory(filteredExpenseTransactions);
  }, [filteredExpenseTransactions]);

  const incomeMonthlyBreakdown = useMemo(() => {
    return aggregateByMonth(filteredIncomeTransactions);
  }, [filteredIncomeTransactions]);

  const expenseMonthlyBreakdown = useMemo(() => {
    return aggregateByMonth(filteredExpenseTransactions);
  }, [filteredExpenseTransactions]);

  // Print metadata
  const printReportMeta = useMemo(() => {
    const periodLabel =
      period === "annually"
        ? `Annual Fiscal Year ${year}`
        : period === "monthly"
        ? `Month: ${MONTH_NAMES[month - 1]} ${year}`
        : `Daily Range: ${dateFrom} to ${dateTo}`;

    const scopeLabel =
      system === "both"
        ? "Consolidated (School & Madrassa Network)"
        : system === "school"
        ? "Al-Qasim Academy (School Campus)"
        : "Jamia Qasimia (Madrassa Campus)";

    const title =
      report === "income"
        ? "OFFICIAL STATEMENT OF REVENUE & INCOME"
        : "OFFICIAL STATEMENT OF EXPENDITURES & DISBURSEMENTS";

    return { title, periodLabel, scopeLabel };
  }, [report, period, system, year, month, dateFrom, dateTo]);

  // Export to CSV
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const filename = `finance-${report}-report-${system}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (report === "income") {
      headers = ["Voucher No", "Date", "Category", "Party Name", "Role", "Campus", "Method", "Amount (PKR)", "Status"];
      rows = filteredIncomeTransactions.map((tx) => [
        tx.voucherNo,
        tx.date,
        tx.categoryLabel,
        tx.partyName,
        tx.partyRole,
        tx.systemLabel,
        tx.paymentMethod.toUpperCase(),
        tx.amount,
        tx.status,
      ]);
    } else {
      headers = ["Voucher No", "Date", "Expense Head", "Beneficiary/Vendor", "Role", "Campus", "Method", "Amount (PKR)", "Status"];
      rows = filteredExpenseTransactions.map((tx) => [
        tx.voucherNo,
        tx.date,
        tx.categoryLabel,
        tx.partyName,
        tx.partyRole,
        tx.systemLabel,
        tx.paymentMethod.toUpperCase(),
        tx.amount,
        tx.status,
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join(
        "\n",
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Financial report exported successfully");
  };

  return (
    <div className="space-y-4">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 10pt;
          }
          nav, aside, header, .no-print, button, input, [role="tablist"], .print-hidden {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-sheet {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #d1d5db !important;
            padding: 5px 8px !important;
            color: black !important;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Screen Page Header */}
      <div className="no-print">
        <PageHeader
          title="Finance Reports"
          titleUrdu="مالی رپورٹس"
          description="Comprehensive income and expenses reports with annual, monthly, and daily granularity across School and Madrassa."
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportCsv}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Print Report
              </Button>
            </div>
          }
        />
      </div>

      {/* Official Printable Document Header (Rendered on window.print()) */}
      <div className="hidden print:block border-b-2 border-primary/40 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold font-serif text-gray-900 tracking-wide">
              الجامعة القاسمية و اکیڈمی القاسم
            </h1>
            <h2 className="text-sm font-semibold uppercase text-gray-800 tracking-wider">
              Al-Qasim Integrated Educational Network
            </h2>
            <p className="text-xs text-gray-600">
              Department of Finance, Accounts & Internal Audit · شعبہ مالیات و آڈٹ
            </p>
          </div>
          <div className="text-end text-xs text-gray-700 space-y-0.5">
            <div className="font-bold text-sm text-gray-900 uppercase">
              {printReportMeta.title}
            </div>
            <div>
              <span className="font-semibold">Period:</span> {printReportMeta.periodLabel}
            </div>
            <div>
              <span className="font-semibold">Scope:</span> {printReportMeta.scopeLabel}
            </div>
            <div>
              <span className="font-semibold">Date Issued:</span> {new Date().toLocaleDateString("en-PK")}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters, Search, Tabs & Granularity */}
      <Card className="no-print p-4 space-y-3.5 border-border/60 shadow-sm">
        {/* Top Control Bar: Search and Period Pickers */}
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student, donor, staff, receipt voucher, or category..."
              className="ps-9"
            />
          </div>

          {/* Period specific selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {period === "annually" && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Fiscal Year:</span>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-28 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026-2027</SelectItem>
                    <SelectItem value="2025">2025-2026</SelectItem>
                    <SelectItem value="2024">2024-2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {period === "monthly" && (
              <div className="flex items-center gap-2">
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="w-32 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-24 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {period === "daily" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">From:</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 w-36 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">To:</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 w-36 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Control Bar: Report Tabs (Income & Expenses only), Period Selector, System Scope */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
          {/* Primary Report Types: Income & Expenses */}
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={report} onValueChange={(v) => setReport(v as FinanceReportType)}>
              <TabsList className="h-9 bg-muted/60 p-1">
                <TabsTrigger value="income" className="text-xs gap-1.5 data-[state=active]:font-semibold">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Income · آمدنی
                </TabsTrigger>
                <TabsTrigger value="expenses" className="text-xs gap-1.5 data-[state=active]:font-semibold">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  Expenses · اخراجات
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Granularity & System Scope */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Period Granularity */}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as FinancePeriod)}>
              <TabsList className="h-9 bg-muted/60 p-1">
                <TabsTrigger value="annually" className="text-xs">
                  Annually · سالانہ
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">
                  Monthly · ماہانہ
                </TabsTrigger>
                <TabsTrigger value="daily" className="text-xs">
                  Daily · روزانہ
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Institutional System Scope */}
            <Tabs value={system} onValueChange={(v) => setSystem(v as FinanceScope)}>
              <TabsList className="h-9 bg-muted/60 p-1">
                <TabsTrigger value="both" className="text-xs">
                  Both
                </TabsTrigger>
                <TabsTrigger value="school" className="text-xs">
                  School
                </TabsTrigger>
                <TabsTrigger value="madrassa" className="text-xs">
                  Madrassa
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Report Body Content */}
      {report === "income" ? (
        <IncomeReportView
          period={period}
          year={year}
          month={month}
          totalIncome={incomeTotal}
          categories={incomeCategories}
          monthlyBreakdown={incomeMonthlyBreakdown}
          transactions={filteredIncomeTransactions}
        />
      ) : (
        <ExpenseReportView
          period={period}
          year={year}
          month={month}
          totalExpense={expenseTotal}
          categories={expenseCategories}
          monthlyBreakdown={expenseMonthlyBreakdown}
          transactions={filteredExpenseTransactions}
        />
      )}

      {/* Printable Signature & Authorization Block */}
      <div className="hidden print:grid grid-cols-3 gap-8 mt-12 pt-6 border-t border-gray-300 text-center text-xs">
        <div>
          <div className="h-14 border-b border-dashed border-gray-400 mb-2"></div>
          <p className="font-semibold text-gray-900">Prepared By (محاسب)</p>
          <p className="text-gray-500 text-[10px]">Senior Accountant / Bursar</p>
        </div>
        <div>
          <div className="h-14 border-b border-dashed border-gray-400 mb-2"></div>
          <p className="font-semibold text-gray-900">Verified By (آڈیٹر)</p>
          <p className="text-gray-500 text-[10px]">Internal Audit Committee</p>
        </div>
        <div>
          <div className="h-14 border-b border-dashed border-gray-400 mb-2"></div>
          <p className="font-semibold text-gray-900">Approved By (مہتمم / پرنسپل)</p>
          <p className="text-gray-500 text-[10px]">Head of Institution / Principal</p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 1. Income Report Component
// -------------------------------------------------------------
function IncomeReportView({
  period,
  year,
  month,
  totalIncome,
  categories,
  monthlyBreakdown,
  transactions,
}: {
  period: FinancePeriod;
  year: number;
  month: number;
  totalIncome: number;
  categories: Array<{ label: string; labelUrdu: string; total: number; count: number; percentage: number; tone: string }>;
  monthlyBreakdown: Array<{ monthNumber: number; monthName: string; monthNameUrdu: string; total: number; count: number }>;
  transactions: ComprehensiveTransaction[];
}) {
  const feeIncome = useMemo(() => {
    return transactions
      .filter((t) => t.category.includes("fee"))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const donationIncome = useMemo(() => {
    return transactions
      .filter((t) => t.category.includes("donation"))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  return (
    <div className="space-y-4">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="h-4 w-4" />
            Total Revenue · کل آمدنی
          </div>
          <p className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-2 font-mono">
            {formatRupees(totalIncome)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {transactions.length} receipts & vouchers in period
          </p>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Student Fees · طلبہ کی فیسیں
          </div>
          <p className="font-heading text-xl font-bold mt-2 font-mono text-foreground">
            {formatRupees(feeIncome)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Tuition, admission, exams, transport
          </p>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Donations & Charity · عطیات و صدقات
          </div>
          <p className="font-heading text-xl font-bold mt-2 font-mono text-purple-700 dark:text-purple-300">
            {formatRupees(donationIncome)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Zakat, Sadqa, Fitrana, Building Fund
          </p>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Average Inflow / Transaction
          </div>
          <p className="font-heading text-xl font-bold mt-2 font-mono">
            {transactions.length > 0 ? formatRupees(Math.round(totalIncome / transactions.length)) : "PKR 0"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Verified across all payment channels
          </p>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card className="p-4 overflow-hidden border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">Income Account Heads Breakdown</h3>
            <p className="text-xs text-muted-foreground">Detailed contribution of each revenue stream</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {categories.length} Categories Active
          </Badge>
        </div>

        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[44%] text-start">Account Head · عنوان کھاتہ</TableHead>
              <TableHead className="w-[16%] text-center">Vouchers</TableHead>
              <TableHead className="w-[24%] text-end">Amount (PKR)</TableHead>
              <TableHead className="w-[16%] text-end">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                  No income transactions recorded for the selected period.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.label}>
                  <TableCell className="font-medium text-sm text-start">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${c.tone}`}>
                        {c.label}
                      </span>
                      <span className="text-xs text-muted-foreground font-urdu">{c.labelUrdu}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono">
                    <div className="flex items-center justify-center">
                      <span>{c.count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-end font-mono font-semibold text-sm">
                    {formatRupees(c.total)}
                  </TableCell>
                  <TableCell className="text-end text-xs font-mono font-medium">
                    {c.percentage}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Monthly distribution when Annual period is active */}
      {period === "annually" && (
        <Card className="p-4 overflow-hidden border-border/60">
          <div className="mb-3">
            <h3 className="font-semibold text-sm">12-Month Annual Inflow Progression</h3>
            <p className="text-xs text-muted-foreground">Month-by-month revenue collection trajectory</p>
          </div>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[44%] text-start">Month</TableHead>
                <TableHead className="w-[16%] text-center">Receipts</TableHead>
                <TableHead className="w-[24%] text-end">Total Inflow (PKR)</TableHead>
                <TableHead className="w-[16%] text-end">Annual Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyBreakdown.map((m) => {
                const share = totalIncome > 0 ? Math.round((m.total / totalIncome) * 100) : 0;
                return (
                  <TableRow key={m.monthNumber}>
                    <TableCell className="text-xs font-medium text-start">
                      {m.monthName} <span className="text-muted-foreground font-urdu ms-1">({m.monthNameUrdu})</span>
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono">
                      <div className="flex items-center justify-center">
                        <span>{m.count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-semibold">
                      {formatRupees(m.total)}
                    </TableCell>
                    <TableCell className="text-end text-xs font-mono">{share}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Itemized Transactions Table */}
      <Card className="p-4 overflow-hidden border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">Itemized Revenue & Receipt Ledger</h3>
            <p className="text-xs text-muted-foreground">Individual receipt transactions with payer references</p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{transactions.length} rows</span>
        </div>

        <Table className="table-fixed min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[18%] text-start">Voucher No</TableHead>
              <TableHead className="w-[12%] text-start">Date</TableHead>
              <TableHead className="w-[16%] text-start">Account Head</TableHead>
              <TableHead className="w-[22%] text-start">Party / Donor / Student</TableHead>
              <TableHead className="w-[11%] text-center">Campus</TableHead>
              <TableHead className="w-[9%] text-center">Method</TableHead>
              <TableHead className="w-[12%] text-end">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.slice(0, 50).map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs font-semibold text-primary text-start">{tx.voucherNo}</TableCell>
                <TableCell className="text-xs font-mono text-start">{tx.date}</TableCell>
                <TableCell className="text-xs text-start">
                  <span className="font-medium">{tx.categoryLabel}</span>
                </TableCell>
                <TableCell className="text-xs text-start">
                  <div className="font-medium truncate">{tx.partyName}</div>
                  <span className="text-[10px] text-muted-foreground">{tx.partyRole}</span>
                </TableCell>
                <TableCell className="text-xs text-center">
                  <div className="flex items-center justify-center">
                    <span>{tx.systemLabel}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-center">
                  <div className="flex items-center justify-center">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {tx.paymentMethod}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-end font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {formatRupees(tx.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// 2. Expenses Report Component
// -------------------------------------------------------------
function ExpenseReportView({
  period,
  year,
  month,
  totalExpense,
  categories,
  monthlyBreakdown,
  transactions,
}: {
  period: FinancePeriod;
  year: number;
  month: number;
  totalExpense: number;
  categories: Array<{ label: string; labelUrdu: string; total: number; count: number; percentage: number; tone: string }>;
  monthlyBreakdown: Array<{ monthNumber: number; monthName: string; monthNameUrdu: string; total: number; count: number }>;
  transactions: ComprehensiveTransaction[];
}) {
  const payrollTotal = useMemo(() => {
    return transactions
      .filter((t) => t.category.includes("salary"))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const operationsTotal = useMemo(() => {
    return transactions
      .filter((t) => !t.category.includes("salary"))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  return (
    <div className="space-y-4">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20">
          <div className="flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
            <TrendingDown className="h-4 w-4" />
            Total Expenditure · کل اخراجات
          </div>
          <p className="font-heading text-2xl font-bold text-rose-700 dark:text-rose-300 mt-2 font-mono">
            {formatRupees(totalExpense)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {transactions.length} vouchers disbursed in period
          </p>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Staff & Faculty Payroll · تنخواہیں
          </div>
          <p className="font-heading text-xl font-bold mt-2 font-mono text-foreground">
            {formatRupees(payrollTotal)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            School teachers, Qaris, Mudarris, Admin
          </p>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Operations, Utilities & Mess · معمول کے اخراجات
          </div>
          <p className="font-heading text-xl font-bold mt-2 font-mono text-amber-700 dark:text-amber-300">
            {formatRupees(operationsTotal)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            WAPDA, Gas, Mess Ration, Maintenance, Books
          </p>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Average Outflow / Voucher
          </div>
          <p className="font-heading text-xl font-bold mt-2 font-mono">
            {transactions.length > 0 ? formatRupees(Math.round(totalExpense / transactions.length)) : "PKR 0"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Reconciled against verified vendor bills
          </p>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card className="p-4 overflow-hidden border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">Expenditure Head of Accounts</h3>
            <p className="text-xs text-muted-foreground">Itemized categories of institutional operational cost</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {categories.length} Categories Active
          </Badge>
        </div>

        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[44%] text-start">Expense Head · مد خرچ</TableHead>
              <TableHead className="w-[16%] text-center">Vouchers</TableHead>
              <TableHead className="w-[24%] text-end">Amount (PKR)</TableHead>
              <TableHead className="w-[16%] text-end">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                  No expense records found for the selected period.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.label}>
                  <TableCell className="font-medium text-sm text-start">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${c.tone}`}>
                        {c.label}
                      </span>
                      <span className="text-xs text-muted-foreground font-urdu">{c.labelUrdu}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono">
                    <div className="flex items-center justify-center">
                      <span>{c.count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-end font-mono font-semibold text-sm">
                    {formatRupees(c.total)}
                  </TableCell>
                  <TableCell className="text-end text-xs font-mono font-medium">
                    {c.percentage}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Monthly distribution when Annual period is active */}
      {period === "annually" && (
        <Card className="p-4 overflow-hidden border-border/60">
          <div className="mb-3">
            <h3 className="font-semibold text-sm">12-Month Annual Expense Outflow</h3>
            <p className="text-xs text-muted-foreground">Monthly expense distribution across calendar year</p>
          </div>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[44%] text-start">Month</TableHead>
                <TableHead className="w-[16%] text-center">Vouchers</TableHead>
                <TableHead className="w-[24%] text-end">Total Outflow (PKR)</TableHead>
                <TableHead className="w-[16%] text-end">Annual Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyBreakdown.map((m) => {
                const share = totalExpense > 0 ? Math.round((m.total / totalExpense) * 100) : 0;
                return (
                  <TableRow key={m.monthNumber}>
                    <TableCell className="text-xs font-medium text-start">
                      {m.monthName} <span className="text-muted-foreground font-urdu ms-1">({m.monthNameUrdu})</span>
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono">
                      <div className="flex items-center justify-center">
                        <span>{m.count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-semibold">
                      {formatRupees(m.total)}
                    </TableCell>
                    <TableCell className="text-end text-xs font-mono">{share}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Itemized Transactions Table */}
      <Card className="p-4 overflow-hidden border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">Itemized Expense Vouchers Ledger</h3>
            <p className="text-xs text-muted-foreground">Individual expense vouchers with payee & beneficiary details</p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{transactions.length} rows</span>
        </div>

        <Table className="table-fixed min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[18%] text-start">Voucher No</TableHead>
              <TableHead className="w-[12%] text-start">Date</TableHead>
              <TableHead className="w-[16%] text-start">Expense Head</TableHead>
              <TableHead className="w-[22%] text-start">Payee / Vendor / Staff</TableHead>
              <TableHead className="w-[11%] text-center">Campus</TableHead>
              <TableHead className="w-[9%] text-center">Method</TableHead>
              <TableHead className="w-[12%] text-end">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.slice(0, 50).map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs font-semibold text-primary text-start">{tx.voucherNo}</TableCell>
                <TableCell className="text-xs font-mono text-start">{tx.date}</TableCell>
                <TableCell className="text-xs font-medium text-start">{tx.categoryLabel}</TableCell>
                <TableCell className="text-xs text-start">
                  <div className="font-medium truncate">{tx.partyName}</div>
                  <span className="text-[10px] text-muted-foreground">{tx.description}</span>
                </TableCell>
                <TableCell className="text-xs text-center">
                  <div className="flex items-center justify-center">
                    <span>{tx.systemLabel}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-center">
                  <div className="flex items-center justify-center">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {tx.paymentMethod}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-end font-mono text-xs font-bold text-rose-700 dark:text-rose-300">
                  {formatRupees(tx.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
