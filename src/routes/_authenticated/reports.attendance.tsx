import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from "@/lib/chart-theme";
import { students, madrassaCategories } from "@/mock";
import { generateAttendance } from "@/mock/attendance";
import { downloadCsv, printHtml, tableHtml, kpiHtml } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/reports/attendance")({
  component: AttendanceReport,
});

function AttendanceReport() {
  // ---- Aggregate real mock attendance for last 30 working days ----
  const sample = students.slice(0, 30);
  const perDay = new Map<string, { present: number; absent: number; late: number; leave: number }>();
  for (const s of sample) {
    for (const r of generateAttendance(s.id, 30)) {
      const k = r.date;
      const cur = perDay.get(k) ?? { present: 0, absent: 0, late: 0, leave: 0 };
      cur[r.status as keyof typeof cur] = (cur[r.status as keyof typeof cur] ?? 0) + 1;
      perDay.set(k, cur);
    }
  }
  const daily = [...perDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date: date.slice(5), ...v, total: v.present + v.absent + v.late + v.leave }));

  const totals = daily.reduce(
    (acc, d) => ({
      present: acc.present + d.present,
      absent: acc.absent + d.absent,
      late: acc.late + d.late,
      leave: acc.leave + d.leave,
    }),
    { present: 0, absent: 0, late: 0, leave: 0 },
  );
  const grand = totals.present + totals.absent + totals.late + totals.leave;
  const attendanceRate = grand ? Math.round(((totals.present + totals.late) / grand) * 1000) / 10 : 0;
  const prevRate = Math.max(0, attendanceRate - 1.8);

  const statusPie = [
    { name: "Present", nameUrdu: "حاضر", value: totals.present },
    { name: "Late", nameUrdu: "تاخیر", value: totals.late },
    { name: "Absent", nameUrdu: "غیر حاضر", value: totals.absent },
    { name: "Leave", nameUrdu: "چھٹی", value: totals.leave },
  ];

  // Per-category attendance
  const perCategory = madrassaCategories.map((c, i) => {
    const ids = students.filter((s) => s.categoryId === c.id).slice(0, 12).map((s) => s.id);
    let present = 0, total = 0;
    for (const id of ids) {
      for (const r of generateAttendance(id, 30)) {
        total++;
        if (r.status === "present" || r.status === "late") present++;
      }
    }
    return {
      name: c.name,
      nameUrdu: c.nameUrdu,
      rate: total ? Math.round((present / total) * 100) : 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  // Per-student leaderboard (worst 8 absentees)
  const perStudent = sample
    .map((s) => {
      const recs = generateAttendance(s.id, 30);
      const absent = recs.filter((r) => r.status === "absent").length;
      const late = recs.filter((r) => r.status === "late").length;
      const present = recs.filter((r) => r.status === "present").length;
      return {
        id: s.id,
        rollNo: s.rollNo,
        name: s.name,
        nameUrdu: s.nameUrdu,
        present,
        late,
        absent,
        rate: Math.round(((present + late) / Math.max(recs.length, 1)) * 100),
      };
    })
    .sort((a, b) => b.absent - a.absent)
    .slice(0, 8);

  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports
      </Link>
      <PageHeader
        title="Attendance Report"
        titleUrdu="حاضری رپورٹ"
        description="Daily attendance distribution, per-category averages, and chronic absentees across the last 30 working days."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printHtml(
              "Attendance Report",
              `<h1>Attendance Report</h1><div class="urdu">حاضری رپورٹ</div>
              <div>${kpiHtml([
                { label: "Attendance Rate", value: `${attendanceRate}%` },
                { label: "Avg Present/day", value: Math.round(totals.present / Math.max(daily.length, 1)) },
                { label: "Avg Absent/day", value: Math.round(totals.absent / Math.max(daily.length, 1)) },
                { label: "Sampled Students", value: sample.length },
              ])}</div>
              <h3>Top Absentees</h3>
              ${tableHtml(["Roll", "Student", "Absent", "Late", "Rate"], perStudent.map((s) => [s.rollNo, s.name, s.absent, s.late, `${s.rate}%`]))}
              <h3>Per Category</h3>
              ${tableHtml(["Category", "Attendance %"], perCategory.map((c) => [c.name, `${c.rate}%`]))}`
            )}>
              <Printer className="h-3.5 w-3.5" />Print
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => downloadCsv(
              "attendance-report",
              ["Date", "Present", "Late", "Absent", "Leave", "Total"],
              daily.map((d) => [d.date, d.present, d.late, d.absent, d.leave, d.total]),
            )}>
              <FileSpreadsheet className="h-3.5 w-3.5" />Excel
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Attendance Rate" labelUrdu="حاضری کی شرح" value={`${attendanceRate}%`} accent="success" delta={{ value: Math.round((attendanceRate - prevRate) * 10) / 10, positive: attendanceRate >= prevRate }} />
        <KpiCard label="Avg Present / day" labelUrdu="یومیہ حاضری اوسط" value={Math.round(totals.present / Math.max(daily.length, 1))} accent="success" />
        <KpiCard label="Avg Absent / day" labelUrdu="یومیہ غیر حاضری" value={Math.round(totals.absent / Math.max(daily.length, 1))} accent="danger" />
        <KpiCard label="Avg Late / day" labelUrdu="یومیہ تاخیر" value={Math.round(totals.late / Math.max(daily.length, 1))} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Daily Trend" titleUrdu="یومیہ رجحان" className="lg:col-span-2" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Line dataKey="present" name="Present" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
              <Line dataKey="late" name="Late" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
              <Line dataKey="absent" name="Absent" stroke="var(--destructive)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Mix" titleUrdu="کیفیت کا تناسب" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {statusPie.map((_, i) => (
                  <Cell key={i} fill={i === 2 ? "var(--destructive)" : CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _n, p) => [v, p?.payload?.nameUrdu ?? p?.payload?.name]} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Attendance by Category" titleUrdu="زمرہ وار حاضری" bodyClassName="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perCategory} layout="vertical" margin={{ top: 8, right: 16, left: 60, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis type="category" dataKey="name" tick={AXIS_TICK} stroke="var(--border)" width={80} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Attendance"]} />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                {perCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="p-5">
          <div className="mb-3">
            <h3 className="font-heading font-semibold text-sm">Top Absentees</h3>
            <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground leading-tight">سب سے زیادہ غیر حاضر طلبہ</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perStudent.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                    <TableCell>
                      <div className="text-sm">{s.name}</div>
                      <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">{s.nameUrdu}</div>
                    </TableCell>
                    <TableCell className="text-right text-destructive font-mono">{s.absent}</TableCell>
                    <TableCell className="text-right text-chart-3 font-mono">{s.late}</TableCell>
                    <TableCell className="text-right font-mono">{s.rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-heading font-semibold text-sm mb-1">Insights</h3>
        <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground mb-3">اہم نکات</p>
        <ul className="text-sm space-y-2 list-disc ps-5 text-muted-foreground">
          <li>Overall attendance rate is <span className="font-semibold text-foreground">{attendanceRate}%</span> across {sample.length} sampled students over {daily.length} working days.</li>
          <li>Best performing category: <span className="font-semibold text-foreground">{[...perCategory].sort((a, b) => b.rate - a.rate)[0]?.name}</span> at {[...perCategory].sort((a, b) => b.rate - a.rate)[0]?.rate}%.</li>
          <li><span className="font-semibold text-foreground">{perStudent.filter((s) => s.absent >= 4).length}</span> students crossed the chronic-absence threshold (4+ absences in 30 days).</li>
          <li>Late arrivals account for <span className="font-semibold text-foreground">{Math.round((totals.late / Math.max(grand, 1)) * 100)}%</span> of all entries — consider tightening the arrival window.</li>
        </ul>
      </Card>
    </div>
  );
}
