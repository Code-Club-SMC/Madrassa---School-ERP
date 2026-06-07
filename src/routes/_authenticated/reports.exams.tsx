import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, FileSpreadsheet, Award, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from "@/lib/chart-theme";
import { examSeries, generateResults } from "@/mock";
import { downloadCsv, printHtml, tableHtml, kpiHtml } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/reports/exams")({
  component: ExamResultsReport,
});

const GRADE_ORDER = ["A+", "A", "B", "C", "F"] as const;

function ExamResultsReport() {
  const availableSeries = examSeries.filter((e) => e.subjects.length > 0);
  const [seriesId, setSeriesId] = useState(availableSeries[0]?.id ?? examSeries[0].id);
  const series = examSeries.find((s) => s.id === seriesId) ?? examSeries[0];
  const results = generateResults(seriesId, false);

  const gradeCounts = GRADE_ORDER.map((g, i) => ({
    grade: g,
    count: results.filter((r) => r.grade === g).length,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const total = results.length;
  const passing = results.filter((r) => r.grade !== "F").length;
  const passRate = total ? Math.round((passing / total) * 100) : 0;
  const distinction = results.filter((r) => r.pct >= 80).length;
  const avgPct = total ? Math.round(results.reduce((a, b) => a + b.pct, 0) / total) : 0;
  const topper = [...results].sort((a, b) => b.pct - a.pct)[0];

  const perSubject = series.subjects.map((sub, i) => {
    const marks = results.map((r) => r.marks[i] ?? 0);
    const avg = marks.length ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10 : 0;
    const passed = marks.filter((m) => m >= sub.passingMarks).length;
    return {
      subject: sub.name,
      subjectUrdu: sub.nameUrdu,
      avg,
      max: sub.totalMarks,
      passRate: marks.length ? Math.round((passed / marks.length) * 100) : 0,
    };
  });

  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports
      </Link>
      <PageHeader
        title="Exam Results Report"
        titleUrdu="نتائج کی رپورٹ"
        description="Series-level pass percentage, grade distribution, subject mastery, and topper analysis."
        actions={
          <div className="flex gap-2 flex-wrap">
            <select
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {availableSeries.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printHtml(
              "Exam Results Report",
              `<h1>${series.name}</h1><div class="urdu">${series.nameUrdu}</div>
              <div>${kpiHtml([
                { label: "Pass Rate", value: `${passRate}%` },
                { label: "Avg %", value: `${avgPct}%` },
                { label: "Distinctions", value: distinction },
                { label: "Candidates", value: total },
              ])}</div>
              ${tableHtml(["Roll", "Student", "Total", "%", "Grade"], results.map((r) => [r.student.rollNo, r.student.name, `${r.total}/${r.max}`, `${r.pct.toFixed(1)}%`, r.grade]))}`
            )}><Printer className="h-3.5 w-3.5" />Print</Button>
            <Button size="sm" className="gap-1.5" onClick={() => downloadCsv(
              `exam-results-${series.id}`,
              ["Roll", "Student", "Total", "Max", "Percent", "Grade"],
              results.map((r) => [r.student.rollNo, r.student.name, r.total, r.max, r.pct.toFixed(1), r.grade]),
            )}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Pass Rate" labelUrdu="کامیابی کی شرح" value={`${passRate}%`} accent={passRate >= 75 ? "success" : "warning"} />
        <KpiCard label="Average %" labelUrdu="اوسط" value={`${avgPct}%`} />
        <KpiCard label="Distinctions" labelUrdu="امتیازات" value={distinction} accent="success" />
        <KpiCard label="Candidates" labelUrdu="امیدوار" value={total} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Grade Distribution" titleUrdu="درجہ بندی" bodyClassName="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={gradeCounts} dataKey="count" nameKey="grade" innerRadius={50} outerRadius={90} paddingAngle={2} label={(e: { grade?: string; count?: number }) => `${e.grade} (${e.count})`}>
                {gradeCounts.map((g, i) => (
                  <Cell key={i} fill={g.grade === "F" ? "var(--destructive)" : g.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Average per Subject" titleUrdu="مضمون وار اوسط" className="lg:col-span-2" bodyClassName="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perSubject} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="subject" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _n, p) => [`${v} / ${p?.payload?.max}`, p?.payload?.subjectUrdu]} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Bar dataKey="avg" name="Average Marks" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Subject Mastery Radar" titleUrdu="مضمون مہارت" bodyClassName="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={perSubject} outerRadius={90}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={AXIS_TICK} />
              <PolarRadiusAxis tick={AXIS_TICK} domain={[0, 100]} />
              <Radar name="Pass %" dataKey="passRate" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.4} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><Award className="h-4 w-4 text-primary" />Top 5 Performers</h3>
              <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground leading-tight">سرفہرست طلبہ</p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...results].sort((a, b) => b.pct - a.pct).slice(0, 5).map((r, i) => (
                <TableRow key={r.student.id}>
                  <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                  <TableCell>
                    <div className="text-sm">{r.student.name}</div>
                    <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">{r.student.nameUrdu}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.pct.toFixed(1)}%</TableCell>
                  <TableCell className="text-right"><Badge variant={r.grade === "F" ? "destructive" : "secondary"}>{r.grade}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="p-5 mb-4">
        <div className="mb-3">
          <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Complete Result Sheet</h3>
          <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground leading-tight">مکمل نتیجہ</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll</TableHead>
                <TableHead>Student</TableHead>
                {series.subjects.map((s) => (
                  <TableHead key={s.id} className="text-right">{s.name}</TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.student.id}>
                  <TableCell className="font-mono text-xs">{r.student.rollNo}</TableCell>
                  <TableCell>
                    <div className="text-sm">{r.student.name}</div>
                    <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">{r.student.nameUrdu}</div>
                  </TableCell>
                  {r.marks.map((m, i) => (
                    <TableCell key={i} className={`text-right font-mono ${m < series.subjects[i].passingMarks ? "text-destructive" : ""}`}>{m}</TableCell>
                  ))}
                  <TableCell className="text-right font-mono">{r.total}/{r.max}</TableCell>
                  <TableCell className="text-right font-mono">{r.pct.toFixed(1)}%</TableCell>
                  <TableCell className="text-right"><Badge variant={r.grade === "F" ? "destructive" : "secondary"}>{r.grade}</Badge></TableCell>
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
          <li>Overall pass rate: <span className="font-semibold text-foreground">{passRate}%</span> with <span className="font-semibold text-foreground">{distinction}</span> distinctions.</li>
          {topper && <li>Topper: <span className="font-semibold text-foreground">{topper.student.name}</span> ({topper.pct.toFixed(1)}%, grade {topper.grade}).</li>}
          <li>Strongest subject: <span className="font-semibold text-foreground">{[...perSubject].sort((a, b) => b.passRate - a.passRate)[0]?.subject}</span> ({[...perSubject].sort((a, b) => b.passRate - a.passRate)[0]?.passRate}% pass).</li>
          <li>Subject needing attention: <span className="font-semibold text-foreground">{[...perSubject].sort((a, b) => a.passRate - b.passRate)[0]?.subject}</span> ({[...perSubject].sort((a, b) => a.passRate - b.passRate)[0]?.passRate}% pass).</li>
        </ul>
      </Card>
    </div>
  );
}