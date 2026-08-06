import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileSpreadsheet, Printer, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AttendanceSummary } from "@/components/attendance/attendance-types";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "@/lib/chart-theme";
import { downloadCsv, kpiHtml, printHtml, tableHtml } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/reports/attendance")({
  component: AttendanceReport,
});

type ReportSystem = "both" | "school" | "madrassa";

type AttendanceDailySummaryRow = {
  date: string;
  system: "school" | "madrassa";
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  schoolClassId: string | null;
  schoolSectionId: string | null;
  madrassaSubcategoryId: string | null;
  placementLabel: string;
  summary: AttendanceSummary;
};

type AttendanceDailySummaryPayload = {
  rows: AttendanceDailySummaryRow[];
  totals: AttendanceSummary;
};

type AttendanceReportFilters = {
  system: ReportSystem;
  dateFrom: string;
  dateTo: string;
};

type DailyTrendRow = {
  date: string;
  dateLabel: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  marked: number;
  total: number;
  attendanceRate: number;
};

type PlacementTrendRow = {
  key: string;
  system: "school" | "madrassa";
  systemLabel: string;
  placementLabel: string;
  institutionName: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  marked: number;
  total: number;
  attendanceRate: number;
};

const emptySummary: AttendanceSummary = {
  total: 0,
  marked: 0,
  unmarked: 0,
  present: 0,
  absent: 0,
  late: 0,
  leave: 0,
  attended: 0,
  attendanceRate: 0,
};

const emptyReport: AttendanceDailySummaryPayload = {
  rows: [],
  totals: emptySummary,
};

function AttendanceReport() {
  const [dateFrom, setDateFrom] = useState(() => formatLocalDate(daysAgo(29)));
  const [dateTo, setDateTo] = useState(() => formatLocalDate(new Date()));
  const [system, setSystem] = useState<ReportSystem>("both");

  const filters = useMemo(
    () => ({ system, dateFrom, dateTo }),
    [dateFrom, dateTo, system],
  );
  const reportQuery = useQuery({
    queryKey: ["attendance", "reports", "daily-summary", filters],
    queryFn: () => fetchAttendanceDailySummary(filters),
    staleTime: 30_000,
  });

  const report = reportQuery.data ?? emptyReport;
  const dailyTrend = useMemo(() => aggregateDailyRows(report.rows), [report.rows]);
  const placementTrend = useMemo(() => aggregatePlacementRows(report.rows), [report.rows]);
  const tableRows = useMemo(
    () =>
      [...report.rows].sort(
        (a, b) => b.date.localeCompare(a.date) || a.placementLabel.localeCompare(b.placementLabel),
      ),
    [report.rows],
  );
  const dayCount = Math.max(dailyTrend.length, 1);
  const totals = report.totals;
  const avgPresent = Math.round(totals.present / dayCount);
  const avgAbsent = Math.round(totals.absent / dayCount);
  const avgLate = Math.round(totals.late / dayCount);

  function handlePrint() {
    printHtml(
      "Attendance Report",
      `<h1>Attendance Report</h1>
      <div class="urdu">حاضری رپورٹ</div>
      <div class="meta">${dateFrom} to ${dateTo} · ${systemLabel(system)}</div>
      ${kpiHtml([
        { label: "Attendance Rate", value: `${formatPercent(totals.attendanceRate)}` },
        { label: "Avg Present / day", value: avgPresent },
        { label: "Avg Absent / day", value: avgAbsent },
        { label: "Avg Late / day", value: avgLate },
      ])}
      <h3>Daily Trend</h3>
      ${tableHtml(
        ["Date", "Present", "Late", "Absent", "Leave", "Marked", "Rate"],
        dailyTrend.map((row) => [
          row.date,
          row.present,
          row.late,
          row.absent,
          row.leave,
          row.marked,
          formatPercent(row.attendanceRate),
        ]),
      )}
      <h3>Placement Breakdown</h3>
      ${tableHtml(reportTableHeaders, tableRows.map(reportTableCells))}`,
    );
  }

  function handleCsv() {
    downloadCsv(
      `attendance-report-${dateFrom}-${dateTo}`,
      reportTableHeaders,
      tableRows.map(reportTableCells),
    );
  }

  return (
    <div>
      <Link
        to="/reports"
        className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        Reports
      </Link>
      <PageHeader
        title="Attendance Report"
        titleUrdu="حاضری رپورٹ"
        description="Backend-backed daily attendance summaries by date, system, and placement."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={reportQuery.isFetching}
              onClick={() => void reportQuery.refetch()}
            >
              <RefreshCw className={reportQuery.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={report.rows.length === 0}
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={report.rows.length === 0}
              onClick={handleCsv}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </Button>
          </div>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(180px,240px)]">
          <div>
            <Label htmlFor="attendance-date-from" className="mb-1.5 block text-xs text-muted-foreground">
              Date from
            </Label>
            <Input
              id="attendance-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="attendance-date-to" className="mb-1.5 block text-xs text-muted-foreground">
              Date to
            </Label>
            <Input
              id="attendance-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">System</Label>
            <Select value={system} onValueChange={(value) => setSystem(value as ReportSystem)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both systems</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="madrassa">Madrassa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {reportQuery.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Could not load attendance report</AlertTitle>
          <AlertDescription>
            {reportQuery.error instanceof Error ? reportQuery.error.message : "The report request failed."}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Attendance Rate"
          labelUrdu="حاضری کی شرح"
          value={formatPercent(totals.attendanceRate)}
          accent={totals.attendanceRate >= 85 ? "success" : totals.attendanceRate >= 70 ? "warning" : "danger"}
        />
        <KpiCard label="Avg Present / day" labelUrdu="یومیہ حاضری اوسط" value={avgPresent} accent="success" />
        <KpiCard label="Avg Absent / day" labelUrdu="یومیہ غیر حاضری" value={avgAbsent} accent="danger" />
        <KpiCard label="Avg Late / day" labelUrdu="یومیہ تاخیر" value={avgLate} accent="warning" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Daily Trend" titleUrdu="یومیہ رجحان" className="lg:col-span-2" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dateLabel" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Line dataKey="present" name="Present" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
              <Line dataKey="late" name="Late" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
              <Line dataKey="absent" name="Absent" stroke="var(--destructive)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Placement Rate" titleUrdu="درجہ وار شرح" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={placementTrend.slice(0, 10)}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 84, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis
                type="category"
                dataKey="placementLabel"
                tick={AXIS_TICK}
                stroke="var(--border)"
                width={110}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}%`, "Attendance"]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as PlacementTrendRow | undefined;
                  return row ? `${row.placementLabel} · ${row.systemLabel}` : "Placement";
                }}
              />
              <Bar dataKey="attendanceRate" name="Attendance %" radius={[0, 6, 6, 0]}>
                {placementTrend.slice(0, 10).map((row, index) => (
                  <Cell key={row.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Daily Placement Breakdown</h3>
            <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground">
              روزانہ درجہ وار حاضری
            </p>
          </div>
          <Badge variant="outline">{reportQuery.isFetching ? "Loading..." : `${tableRows.length} rows`}</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="text-right">Leave</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    Loading attendance report...
                  </TableCell>
                </TableRow>
              ) : tableRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    No attendance records found for this range.
                  </TableCell>
                </TableRow>
              ) : (
                tableRows.map((row) => (
                  <TableRow key={`${row.date}:${row.system}:${row.institutionId}:${row.placementLabel}`}>
                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {row.system}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{row.institutionName}</div>
                      <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">
                        {row.institutionNameUrdu}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{row.placementLabel}</div>
                      <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">
                        {row.programNameUrdu}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-chart-1">{row.summary.present}</TableCell>
                    <TableCell className="text-right font-mono text-chart-3">{row.summary.late}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{row.summary.absent}</TableCell>
                    <TableCell className="text-right font-mono">{row.summary.leave}</TableCell>
                    <TableCell className="text-right font-mono">{formatPercent(row.summary.attendanceRate)}</TableCell>
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

async function fetchAttendanceDailySummary(filters: AttendanceReportFilters) {
  const params = new URLSearchParams({
    system: filters.system,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  const response = await fetch(`/api/attendance/reports/daily-summary?${params.toString()}`, {
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Could not load attendance report",
    );
  }
  return payload as AttendanceDailySummaryPayload;
}

function aggregateDailyRows(rows: AttendanceDailySummaryRow[]): DailyTrendRow[] {
  const byDate = new Map<string, DailyTrendRow>();

  for (const row of rows) {
    const current = byDate.get(row.date) ?? {
      date: row.date,
      dateLabel: formatShortDate(row.date),
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      marked: 0,
      total: 0,
      attendanceRate: 0,
    };
    current.present += row.summary.present;
    current.absent += row.summary.absent;
    current.late += row.summary.late;
    current.leave += row.summary.leave;
    current.marked += row.summary.marked;
    current.total += row.summary.total;
    current.attendanceRate = calculateAttendanceRate(current);
    byDate.set(row.date, current);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function aggregatePlacementRows(rows: AttendanceDailySummaryRow[]): PlacementTrendRow[] {
  const byPlacement = new Map<string, PlacementTrendRow>();

  for (const row of rows) {
    const key = `${row.system}:${row.institutionId}:${row.programId}:${row.placementLabel}`;
    const current = byPlacement.get(key) ?? {
      key,
      system: row.system,
      systemLabel: systemLabel(row.system),
      placementLabel: row.placementLabel,
      institutionName: row.institutionName,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      marked: 0,
      total: 0,
      attendanceRate: 0,
    };
    current.present += row.summary.present;
    current.absent += row.summary.absent;
    current.late += row.summary.late;
    current.leave += row.summary.leave;
    current.marked += row.summary.marked;
    current.total += row.summary.total;
    current.attendanceRate = calculateAttendanceRate(current);
    byPlacement.set(key, current);
  }

  return Array.from(byPlacement.values()).sort(
    (a, b) => b.marked - a.marked || b.attendanceRate - a.attendanceRate,
  );
}

function calculateAttendanceRate(row: Pick<DailyTrendRow, "present" | "late" | "absent">) {
  const denominator = row.present + row.late + row.absent;
  return denominator ? Math.round(((row.present + row.late) / denominator) * 1000) / 10 : 0;
}

const reportTableHeaders = [
  "Date",
  "System",
  "Institution",
  "Program",
  "Placement",
  "Present",
  "Late",
  "Absent",
  "Leave",
  "Marked",
  "Total",
  "Attendance %",
];

function reportTableCells(row: AttendanceDailySummaryRow) {
  return [
    row.date,
    systemLabel(row.system),
    row.institutionName,
    row.programName,
    row.placementLabel,
    row.summary.present,
    row.summary.late,
    row.summary.absent,
    row.summary.leave,
    row.summary.marked,
    row.summary.total,
    formatPercent(row.summary.attendanceRate),
  ];
}

function systemLabel(system: ReportSystem | "school" | "madrassa") {
  if (system === "school") return "School";
  if (system === "madrassa") return "Madrassa";
  return "Both systems";
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
