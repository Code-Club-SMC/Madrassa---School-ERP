import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports/attendance")({
  component: AttendanceReport,
});

function AttendanceReport() {
  const data = Array.from({ length: 30 }).map((_, i) => ({ day: i + 1, present: 90 + ((i * 17) % 10), absent: 5 + ((i * 3) % 6), late: 3 + ((i * 5) % 4) }));
  const totalPresent = data.reduce((a, b) => a + b.present, 0);
  const totalAbsent = data.reduce((a, b) => a + b.absent, 0);
  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports</Link>
      <PageHeader title="Attendance Report" titleUrdu="حاضری رپورٹ" description="Last 30 working days, daily counts across all sections."
        actions={<div className="flex gap-2"><Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button><Button size="sm" className="gap-1.5" onClick={() => toast.success("Excel exported")}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button></div>}
      />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Avg Present</p><p className="font-heading text-2xl font-bold mt-1 text-emerald-600">{Math.round(totalPresent / 30)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Avg Absent</p><p className="font-heading text-2xl font-bold mt-1 text-destructive">{Math.round(totalAbsent / 30)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Attendance %</p><p className="font-heading text-2xl font-bold mt-1">{Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)}%</p></Card>
      </div>
      <Card className="p-5 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Line dataKey="present" stroke="var(--chart-1)" strokeWidth={2} />
            <Line dataKey="absent" stroke="var(--chart-2)" strokeWidth={2} />
            <Line dataKey="late" stroke="var(--chart-3)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}