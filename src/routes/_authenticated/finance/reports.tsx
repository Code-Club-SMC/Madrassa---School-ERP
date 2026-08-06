import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, Download, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPKR } from "@/lib/formatters";

export const Route = createFileRoute("/_authenticated/finance/reports")({
  component: FinanceReportsPage,
});

type ReportKey = "daily" | "dues" | "student" | "institution" | "audit";
type ReportSystem = "both" | "school" | "madrassa";
type ReportPayload = Record<string, unknown>;
type ReportRow = Record<string, unknown>;

const endpointByReport: Record<ReportKey, string> = {
  daily: "/api/fees/reports/daily-collection",
  dues: "/api/fees/reports/outstanding-dues",
  student: "/api/fees/reports/student-ledger",
  institution: "/api/fees/reports/institution-summary",
  audit: "/api/fees/reports/reversal-refund-audit",
};

function FinanceReportsPage() {
  const [report, setReport] = useState<ReportKey>("daily");
  const [system, setSystem] = useState<ReportSystem>("both");
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [query, setQuery] = useState("");
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ system, dateFrom, dateTo });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`${endpointByReport[report]}?${params.toString()}`, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load report");
      setData(payload as ReportPayload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load report");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, query, report, system]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Finance Reports"
        titleUrdu="مالی رپورٹس"
        description="Collection, dues, student ledger, institution summary, and reversal/refund audit reports."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        }
      />

      <Card className="mb-4 p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student, receipt, or actor..."
              className="pe-9"
            />
          </div>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Tabs value={report} onValueChange={(value) => setReport(value as ReportKey)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="dues">Dues</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="institution">Institution</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={system} onValueChange={(value) => setSystem(value as ReportSystem)}>
            <TabsList>
              <TabsTrigger value="both">Both</TabsTrigger>
              <TabsTrigger value="school">School</TabsTrigger>
              <TabsTrigger value="madrassa">Madrassa</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      <ReportContent report={report} data={data} loading={loading} />
    </div>
  );
}

function ReportContent({
  report,
  data,
  loading,
}: {
  report: ReportKey;
  data: ReportPayload | null;
  loading: boolean;
}) {
  if (loading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Loading report...</Card>;
  }

  if (report === "daily") return <DailyCollectionReport rows={rowsFrom(data, ["receipts", "rows", "payments"])} />;
  if (report === "dues") return <OutstandingDuesReport rows={rowsFrom(data, ["students", "rows", "dues"])} />;
  if (report === "student") return <StudentLedgerReport rows={rowsFrom(data, ["rows", "ledger", "students"])} />;
  if (report === "institution") return <InstitutionSummaryReport rows={rowsFrom(data, ["institutions", "rows", "summary"])} />;
  return <AuditReport rows={rowsFrom(data, ["adjustments", "rows", "audit"])} />;
}

function DailyCollectionReport({ rows }: { rows: ReportRow[] }) {
  return (
    <ReportTable
      empty="No collection rows for this range."
      headers={["Receipt", "Date", "Student", "Method", "Gross", "Refunded", "Net"]}
      rows={rows.map((row) => [
        text(row, ["receiptNo", "receipt_no"]),
        date(row, ["receivedAt", "date", "createdAt"]),
        text(row, ["studentName", "student", "name"]),
        text(row, ["method"]),
        money(row, ["grossPaisa", "amountPaisa", "grossAmountPaisa"]),
        money(row, ["refundedPaisa", "refundPaisa"]),
        money(row, ["netPaisa", "netAmountPaisa", "amountPaisa"]),
      ])}
    />
  );
}

function OutstandingDuesReport({ rows }: { rows: ReportRow[] }) {
  return (
    <ReportTable
      empty="No outstanding dues found."
      headers={["Student", "Institution", "Group", "Current", "30+", "60+", "90+", "Total"]}
      rows={rows.map((row) => [
        text(row, ["studentName", "student", "name"]),
        text(row, ["institutionName", "institution"]),
        text(row, ["groupLabel", "group", "className", "darja"]),
        money(row, ["currentPaisa", "current"]),
        money(row, ["thirtyPaisa", "bucket30Paisa", "30"]),
        money(row, ["sixtyPaisa", "bucket60Paisa", "60"]),
        money(row, ["ninetyPaisa", "bucket90Paisa", "90"]),
        money(row, ["totalOutstandingPaisa", "outstandingPaisa", "totalPaisa"]),
      ])}
    />
  );
}

function StudentLedgerReport({ rows }: { rows: ReportRow[] }) {
  return (
    <ReportTable
      empty="No student ledger rows found."
      headers={["Student", "Reference", "Date", "Type", "Debit", "Credit", "Balance"]}
      rows={rows.map((row) => [
        text(row, ["studentName", "student", "name"]),
        text(row, ["reference", "receiptNo", "chargeLabel", "label"]),
        date(row, ["date", "createdAt", "receivedAt", "dueDate"]),
        text(row, ["type", "kind", "status"]),
        money(row, ["debitPaisa", "chargePaisa", "amountPaisa"]),
        money(row, ["creditPaisa", "paidPaisa"]),
        money(row, ["balancePaisa", "outstandingPaisa"]),
      ])}
    />
  );
}

function InstitutionSummaryReport({ rows }: { rows: ReportRow[] }) {
  return (
    <ReportTable
      empty="No institution summary rows found."
      headers={["Institution", "Charges", "Collected", "Reversed", "Refunded", "Outstanding"]}
      rows={rows.map((row) => [
        text(row, ["institutionName", "institution"]),
        money(row, ["chargedPaisa", "totalChargedPaisa"]),
        money(row, ["collectedPaisa", "totalPaidPaisa"]),
        money(row, ["reversedPaisa", "totalReversedPaisa"]),
        money(row, ["refundedPaisa", "totalRefundedPaisa"]),
        money(row, ["outstandingPaisa"]),
      ])}
    />
  );
}

function AuditReport({ rows }: { rows: ReportRow[] }) {
  return (
    <ReportTable
      empty="No reversals or refunds found."
      headers={["Date", "Actor", "Type", "Reference", "Amount", "Reason"]}
      rows={rows.map((row) => [
        date(row, ["createdAt", "date"]),
        text(row, ["actorName", "actorEmail", "actor"]),
        text(row, ["type"]),
        text(row, ["reference", "receiptNo", "chargeId", "paymentId"]),
        money(row, ["amountPaisa"]),
        text(row, ["reason"]),
      ])}
    />
  );
}

function ReportTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {headers.map((header, index) => (
              <TableHead key={header} className={index >= headers.length - 3 ? "text-end" : undefined}>
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} className="py-10 text-center text-sm text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={row.join(":") || rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={`${cellIndex}:${cell}`}
                    className={cellIndex >= headers.length - 3 ? "text-end font-mono text-xs" : "text-sm"}
                  >
                    {cell || "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function rowsFrom(data: ReportPayload | null, keys: string[]) {
  if (Array.isArray(data)) return data.filter(isReportRow);
  if (!data || !isReportRow(data)) return [];
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return value.filter(isReportRow);
  }
  return [];
}

function isReportRow(value: unknown): value is ReportRow {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function valueFrom(row: ReportRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

function text(row: ReportRow, keys: string[]) {
  const value = valueFrom(row, keys);
  return value === null ? "—" : String(value);
}

function money(row: ReportRow, keys: string[]) {
  const value = valueFrom(row, keys);
  return typeof value === "number" ? formatPKR(value) : "—";
}

function date(row: ReportRow, keys: string[]) {
  const value = valueFrom(row, keys);
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : formatDate(parsed);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
