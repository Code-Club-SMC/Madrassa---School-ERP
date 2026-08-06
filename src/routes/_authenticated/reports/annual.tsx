import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, LineChart, Line, ComposedChart,
} from "recharts";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from "@/lib/chart-theme";
import { madrassaCategories, students, enrollmentTrend } from "@/mock";
import { downloadCsv, printHtml, tableHtml, kpiHtml } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/reports/annual")({
  component: AnnualReport,
});

function AnnualReport() {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const finance = months.map((m, i) => {
    const collection = 410000 + i * 18000 + (i % 3) * 7000;
    const expenses = 290000 + i * 9000 + (i % 4) * 4500;
    return { month: m, collection, expenses, surplus: collection - expenses };
  });

  const totalEnroll = students.length;
  const totalCollection = finance.reduce((a, b) => a + b.collection, 0);
  const totalExpenses = finance.reduce((a, b) => a + b.expenses, 0);
  const surplus = totalCollection - totalExpenses;

  const yoyGrowth = Math.round(
    ((enrollmentTrend[enrollmentTrend.length - 1].madrassa + enrollmentTrend[enrollmentTrend.length - 1].school) /
      Math.max(enrollmentTrend[0].madrassa + enrollmentTrend[0].school, 1) - 1) * 100,
  );

  const academicOutcomes = [
    { subject: "Hifz", subjectUrdu: "حفظ", pass: 92, distinction: 41 },
    { subject: "Nazira", subjectUrdu: "ناظرہ", pass: 96, distinction: 58 },
    { subject: "Alimiyat", subjectUrdu: "عالمیہ", pass: 88, distinction: 30 },
    { subject: "Mathematics", subjectUrdu: "حساب", pass: 84, distinction: 22 },
    { subject: "English", subjectUrdu: "انگریزی", pass: 81, distinction: 18 },
    { subject: "Science", subjectUrdu: "سائنس", pass: 79, distinction: 14 },
  ];

  const categoryGrowth = madrassaCategories.map((c, i) => ({
    name: c.name,
    nameUrdu: c.nameUrdu,
    current: c.subcategories.reduce((a, b) => a + b.count, 0),
    previous: Math.round(c.subcategories.reduce((a, b) => a + b.count, 0) * (0.85 + (i % 3) * 0.05)),
  }));

  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports
      </Link>
      <PageHeader
        title="Annual Report"
        titleUrdu="سالانہ رپورٹ"
        description="Year-on-year enrollment, finance health and academic outcomes."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printHtml(
              "Annual Report",
              `<h1>Annual Report</h1><div class="urdu">سالانہ رپورٹ</div>
              <div>${kpiHtml([
                { label: "Enrollment", value: totalEnroll },
                { label: "Collection", value: `PKR ${totalCollection.toLocaleString()}` },
                { label: "Surplus", value: `PKR ${surplus.toLocaleString()}` },
              ])}</div>
              <h3>Month-by-Month Finance</h3>
              ${tableHtml(["Month", "Collection", "Expenses", "Surplus"], finance.map((f) => [f.month, f.collection, f.expenses, f.surplus]))}
              <h3>Academic Outcomes</h3>
              ${tableHtml(["Subject", "Pass %", "Distinction %"], academicOutcomes.map((a) => [a.subject, a.pass, a.distinction]))}`
            )}><Printer className="h-3.5 w-3.5" />Print</Button>
            <Button size="sm" className="gap-1.5" onClick={() => downloadCsv(
              "annual-report",
              ["Month", "Collection", "Expenses", "Surplus"],
              finance.map((f) => [f.month, f.collection, f.expenses, f.surplus]),
            )}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Enrollment" labelUrdu="کل اندراج" value={totalEnroll} delta={{ value: yoyGrowth, positive: yoyGrowth >= 0 }} />
        <KpiCard label="Annual Collection" labelUrdu="سالانہ وصولی" value={`${(totalCollection / 100000).toFixed(1)}L`} accent="success" />
        <KpiCard label="Annual Expenses" labelUrdu="سالانہ اخراجات" value={`${(totalExpenses / 100000).toFixed(1)}L`} accent="warning" />
        <KpiCard label="Net Surplus" labelUrdu="خالص بچت" value={`${(surplus / 100000).toFixed(1)}L`} accent={surplus > 0 ? "success" : "danger"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Enrollment Trend" titleUrdu="اندراج کا رجحان" description="Last 12 months — Madrassa vs School." bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enrollmentTrend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[2]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Area dataKey="madrassa" name="Madrassa" stroke={CHART_COLORS[0]} fill="url(#g1)" strokeWidth={2} />
              <Area dataKey="school" name="School" stroke={CHART_COLORS[2]} fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Finance · Collection vs Expenses" titleUrdu="وصولی بمقابلہ اخراجات" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={finance} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Bar dataKey="collection" name="Collection" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
              <Line dataKey="surplus" name="Surplus" stroke="var(--destructive)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Academic Outcomes" titleUrdu="تعلیمی نتائج" description="Pass percentage and distinctions by subject." bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={academicOutcomes} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="subject" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _n, p) => [`${v}%`, p?.payload?.subjectUrdu]} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Bar dataKey="pass" name="Pass %" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
              <Bar dataKey="distinction" name="Distinction %" fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category Growth · YoY" titleUrdu="سالانہ اضافہ زمرہ وار" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryGrowth} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _n, p) => [v, p?.payload?.nameUrdu ?? p?.payload?.name]} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Bar dataKey="previous" name="Previous Year" fill={CHART_COLORS[3]} radius={[6, 6, 0, 0]} />
              <Bar dataKey="current" name="Current Year" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="p-5 mb-4">
        <div className="mb-3">
          <h3 className="font-heading font-semibold text-sm">Month-by-Month Finance</h3>
          <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground leading-tight">ماہ بہ ماہ مالی صورت حال</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Collection</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Surplus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finance.map((f) => (
                <TableRow key={f.month}>
                  <TableCell className="font-medium">{f.month}</TableCell>
                  <TableCell className="text-right font-mono text-chart-1">PKR {f.collection.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">PKR {f.expenses.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-mono ${f.surplus >= 0 ? "text-chart-1" : "text-destructive"}`}>PKR {f.surplus.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-heading font-semibold text-sm mb-1">Insights</h3>
        <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground mb-3">اہم نکات</p>
        <ul className="text-sm space-y-2 list-disc ps-5 text-muted-foreground">
          <li>Year-on-year enrollment growth: <span className="font-semibold text-foreground">{yoyGrowth}%</span>.</li>
          <li>Operating surplus of <span className="font-semibold text-foreground">PKR {surplus.toLocaleString()}</span> ({Math.round((surplus / totalCollection) * 100)}% margin) — financial position remains healthy.</li>
          <li>Best performing subject: <span className="font-semibold text-foreground">{[...academicOutcomes].sort((a, b) => b.pass - a.pass)[0].subject}</span> ({[...academicOutcomes].sort((a, b) => b.pass - a.pass)[0].pass}% pass).</li>
          <li>Largest category gain: <span className="font-semibold text-foreground">{[...categoryGrowth].sort((a, b) => (b.current - b.previous) - (a.current - a.previous))[0].name}</span> (+{[...categoryGrowth].sort((a, b) => (b.current - b.previous) - (a.current - a.previous))[0].current - [...categoryGrowth].sort((a, b) => (b.current - b.previous) - (a.current - a.previous))[0].previous} students).</li>
        </ul>
      </Card>
    </div>
  );
}
