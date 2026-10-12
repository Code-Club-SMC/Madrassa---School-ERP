import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { downloadCsv, printHtml, tableHtml, kpiHtml } from "@/lib/export";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports/annual")({
  component: AnnualReport,
});

export function AnnualReport() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/dashboard?filter=all", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setDashboardData(d);
      })
      .catch(() => {});

    fetch("/api/academic/madrassa/categories", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.categories && Array.isArray(d.categories)) {
          setCategories(d.categories);
        }
      })
      .catch(() => {});
  }, []);

  const totalEnroll = parseInt(dashboardData?.kpis?.totalStudents?.replace(/,/g, "") || "0", 10);
  const monthlyHistory = dashboardData?.financialMeta?.monthlyHistory || [];

  const finance = monthlyHistory.map((m: any) => ({
    month: m.month,
    collection: m.collected,
    expenses: 0,
    surplus: m.collected,
  }));

  const totalCollection = finance.reduce((a: number, b: any) => a + b.collection, 0);
  const totalExpenses = finance.reduce((a: number, b: any) => a + b.expenses, 0);
  const surplus = totalCollection - totalExpenses;

  const enrollmentTrend = (dashboardData?.trendData || []).map((t: any) => ({
    month: t.month,
    madrassa: (t.qasimiaMadrassa || 0) + (t.zainabMadrassa || 0),
    school: (t.qasimAcademy || 0) + (t.zainabSchool || 0),
  }));

  const yoyGrowth = 0;

  const academicOutcomes = [
    { subject: "Hifz", subjectUrdu: "حفظ", pass: 100, distinction: 50 },
    { subject: "Nazira", subjectUrdu: "ناظرہ", pass: 100, distinction: 60 },
    { subject: "Alimiyat", subjectUrdu: "عالمیہ", pass: 95, distinction: 40 },
    { subject: "Mathematics", subjectUrdu: "حساب", pass: 90, distinction: 30 },
  ];

  const categoryGrowth = categories.map((c: any) => ({
    name: c.name,
    nameUrdu: c.nameUrdu,
    current: (c.subcategories || []).reduce((a: number, b: any) => a + (b.studentCount || 0), 0),
    previous: 0,
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
              ${tableHtml(["Month", "Collection", "Expenses", "Surplus"], finance.map((f: any) => [f.month, f.collection, f.expenses, f.surplus]))}
              <h3>Academic Outcomes</h3>
              ${tableHtml(["Subject", "Pass %", "Distinction %"], academicOutcomes.map((a) => [a.subject, a.pass, a.distinction]))}`
            )}><Printer className="h-3.5 w-3.5" />Print</Button>
            <Button size="sm" className="gap-1.5" onClick={() => downloadCsv(
              "annual-report",
              ["Month", "Collection", "Expenses", "Surplus"],
              finance.map((f: any) => [f.month, f.collection, f.expenses, f.surplus]),
            )}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Enrollment" labelUrdu="کل اندراج" value={totalEnroll} delta={{ value: yoyGrowth, positive: true }} />
        <KpiCard label="Annual Collection" labelUrdu="سالانہ وصولی" value={`PKR ${totalCollection.toLocaleString()}`} accent="success" />
        <KpiCard label="Annual Expenses" labelUrdu="سالانہ اخراجات" value={`PKR ${totalExpenses.toLocaleString()}`} accent="warning" />
        <KpiCard label="Net Surplus" labelUrdu="خالص بچت" value={`PKR ${surplus.toLocaleString()}`} accent={surplus >= 0 ? "success" : "danger"} />
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

        <ChartCard title="Category Growth" titleUrdu="سالانہ زمرہ وار جائزہ" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryGrowth} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _n, p) => [v, p?.payload?.nameUrdu ?? p?.payload?.name]} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Bar dataKey="current" name="Enrolled Students" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
