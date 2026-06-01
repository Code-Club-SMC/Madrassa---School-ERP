import { createFileRoute, Link } from "@tanstack/react-router";
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
import { students, applications, feeRecords, recentActivity } from "@/mock";
import { generateAttendance } from "@/mock/attendance";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports/monthly")({
  component: MonthlyReport,
});

function MonthlyReport() {
  const now = new Date();
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const monthLabelUrdu = now.toLocaleString("ur-PK", { month: "long", year: "numeric" });

  // Admissions this month (use applications)
  const admissions = applications.filter((a) => a.status === "accepted").length;
  const withdrawals = applications.filter((a) => a.status === "rejected").length;
  const pending = applications.filter((a) => a.status === "pending").length;

  const paid = feeRecords.filter((f) => f.status === "paid").length;
  const partial = feeRecords.filter((f) => f.status === "partial").length;
  const unpaid = feeRecords.filter((f) => f.status === "unpaid" || f.status === "overdue").length;
  const collected = feeRecords.reduce((a, b) => a + b.paidAmount, 0);
  const expected = feeRecords.reduce((a, b) => a + b.monthlyFee, 0);
  const rate = expected ? Math.round((collected / expected) * 100) : 0;

  // 30-day attendance trend
  const sample = students.slice(0, 24);
  const per = new Map<string, { p: number; t: number }>();
  for (const s of sample) {
    for (const r of generateAttendance(s.id, 30)) {
      const cur = per.get(r.date) ?? { p: 0, t: 0 };
      cur.t++;
      if (r.status === "present" || r.status === "late") cur.p++;
      per.set(r.date, cur);
    }
  }
  const attendanceDaily = [...per.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ date: d.slice(5), rate: Math.round((v.p / v.t) * 100) }));

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
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button>
            <Button size="sm" className="gap-1.5" onClick={() => toast.success("Excel exported")}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="New Admissions" labelUrdu="نئے داخلے" value={admissions} accent="success" delta={{ value: 12, positive: true }} />
        <KpiCard label="Fee Collected" labelUrdu="فیس وصول" value={`${(collected / 1000).toFixed(1)}k`} accent="success" />
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

      <ChartCard title="Attendance Rate · Last 30 days" titleUrdu="پچھلے 30 دن کی حاضری" bodyClassName="h-72" className="mb-4">
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
          <h3 className="font-heading font-semibold text-sm">Recent Activity</h3>
          <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground leading-tight">حالیہ سرگرمیاں</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="capitalize text-xs">{e.type}</TableCell>
                  <TableCell>
                    <div className="text-sm">{e.title}</div>
                    <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">{e.titleUrdu}</div>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</TableCell>
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
          <li><span className="font-semibold text-foreground">PKR {collected.toLocaleString()}</span> of <span className="font-semibold text-foreground">PKR {expected.toLocaleString()}</span> collected ({rate}% collection efficiency).</li>
          <li><span className="font-semibold text-foreground">{unpaid}</span> students remain unpaid this month — follow-up notices recommended.</li>
          <li><span className="font-semibold text-foreground">{admissions}</span> admissions confirmed vs <span className="font-semibold text-foreground">{withdrawals}</span> withdrawals — net growth of {admissions - withdrawals}.</li>
        </ul>
      </Card>
    </div>
  );
}
