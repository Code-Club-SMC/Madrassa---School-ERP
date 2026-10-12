import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from "@/lib/chart-theme";
import { downloadCsv, printHtml, tableHtml, kpiHtml } from "@/lib/export";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports/monthly")({
  component: MonthlyReport,
});

function MonthlyReport() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const now = new Date();
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const URDU_MONTHS = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
  const monthLabelUrdu = `${URDU_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [applicationsList, setApplicationsList] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/dashboard?filter=all", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setDashboardData(d);
      })
      .catch(() => {});

    fetch("/api/admission/applications", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.applications && Array.isArray(d.applications)) {
          setApplicationsList(d.applications);
        }
      })
      .catch(() => {});
  }, []);

  // Real Admissions
  const admissions = applicationsList.filter((a) => a.status === "accepted").length;
  const withdrawals = applicationsList.filter((a) => a.status === "rejected").length;
  const pending = applicationsList.filter((a) => a.status === "pending").length;

  // Real Financials
  const collected = dashboardData?.financialMeta?.collected ?? 0;
  const expected = dashboardData?.financialMeta?.target ?? 0;
  const rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  const studentStatus = dashboardData?.financialMeta?.studentStatus ?? {
    cleared: { count: 0 },
    partial: { count: 0 },
    unpaid: { count: 0 },
  };

  const paid = studentStatus.cleared.count;
  const partial = studentStatus.partial.count;
  const unpaid = studentStatus.unpaid.count;

  // Attendance
  const attendanceDaily = (dashboardData?.attendanceSummary?.rates || []).map((r: any) => ({
    date: r.day,
    rate: r.rate,
  }));

  const recentActivity = dashboardData?.recentActivities || [];

  const overview = [
    { metric: "Admissions", metricUrdu: "داخلے", value: admissions },
    { metric: "Pending", metricUrdu: "زیر التواء", value: pending },
    { metric: "Withdrawals", metricUrdu: "اخراج", value: withdrawals },
    { metric: "Fee Paid", metricUrdu: "ادا شدہ", value: paid },
    { metric: "Partial", metricUrdu: "جزوی", value: partial },
    { metric: "Unpaid", metricUrdu: "غیر ادا", value: unpaid },
  ];

  const feeMix = [
    { name: "Paid", nameUrdu: "ادا شدہ", value: paid, color: CHART_COLORS[0] },
    { name: "Partial", nameUrdu: "جزوی", value: partial, color: CHART_COLORS[2] },
    { name: "Unpaid", nameUrdu: "غیر ادا", value: unpaid, color: "var(--destructive)" },
  ];

  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports
      </Link>
      <PageHeader
        title={`Monthly Summary · ${monthLabel}`}
        titleUrdu={`ماہانہ خلاصہ · ${monthLabelUrdu}`}
        description="Admissions, attendance, fee collection and activity for the current month."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printHtml(
              "Monthly Summary",
              `<h1>Monthly Summary · ${monthLabel}</h1><div class="urdu">${monthLabelUrdu}</div>
              <div>${kpiHtml([
                { label: "Admissions", value: admissions },
                { label: "Collection", value: `PKR ${collected.toLocaleString()}` },
                { label: "Rate", value: `${rate}%` },
              ])}</div>
              ${tableHtml(["Metric", "Value"], overview.map((o) => [o.metric, o.value]))}`
            )}><Printer className="h-3.5 w-3.5" />Print</Button>
            <Button size="sm" className="gap-1.5" onClick={() => downloadCsv(
              `monthly-${monthLabel.replace(/\s+/g, "-")}`,
              ["Metric", "Value"],
              overview.map((o) => [o.metric, o.value]),
            )}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="New Admissions" labelUrdu="نئے داخلے" value={admissions} accent="success" />
        <KpiCard label="Fee Collected" labelUrdu="فیس وصول" value={`PKR ${collected.toLocaleString()}`} accent="success" />
        <KpiCard label="Collection Rate" labelUrdu="وصولی کی شرح" value={`${rate}%`} accent={rate >= 75 ? "success" : "warning"} />
        <KpiCard label="Pending Apps" labelUrdu="زیر التواء درخواستیں" value={pending} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Monthly Activity Overview" titleUrdu="ماہانہ سرگرمی" className="lg:col-span-2" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="metric" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _n, p) => [v, p?.payload?.metricUrdu ?? p?.payload?.metric]} />
              <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fee Status Mix" titleUrdu="فیس کی حالت" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={feeMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {feeMix.map((f, i) => <Cell key={i} fill={f.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _n, p) => [v, p?.payload?.nameUrdu ?? p?.payload?.name]} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Attendance Rate · Weekly" titleUrdu="ہفتہ وار حاضری کی شرح" bodyClassName="h-72" className="mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={attendanceDaily} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={AXIS_TICK} stroke="var(--border)" />
            <YAxis tick={AXIS_TICK} stroke="var(--border)" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v}%`} />
            <Line dataKey="rate" name="Attendance" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="p-5 mb-4">
        <div className="mb-3">
          <h3 className={cn("font-semibold text-sm", isUrdu ? "font-urdu text-base" : "font-heading")}>
            {isUrdu ? "حالیہ سرگرمیاں" : "Recent Activity"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isUrdu ? "قسم" : "Type"}</TableHead>
                <TableHead>{isUrdu ? "سرگرمی" : "Activity"}</TableHead>
                <TableHead className="text-right">{isUrdu ? "وقت" : "When"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                    {isUrdu ? "کوئی حالیہ سرگرمی درج نہیں ہوئی" : "No recent activity recorded yet"}
                  </TableCell>
                </TableRow>
              ) : (
                recentActivity.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="capitalize text-xs">{e.type}</TableCell>
                    <TableCell>
                      <div className={cn("text-sm", isUrdu && "font-urdu")}>{isUrdu ? e.titleUrdu : e.title}</div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
