import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_authenticated/reports/monthly")({
  component: MonthlyReport,
});

function MonthlyReport() {
  const data = [
    { metric: "Admissions", value: 18 },
    { metric: "Withdrawals", value: 3 },
    { metric: "Promoted", value: 24 },
    { metric: "Fee Paid", value: 142 },
    { metric: "Unpaid", value: 31 },
    { metric: "Notices", value: 9 },
  ];
  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports</Link>
      <PageHeader title="Monthly Summary" titleUrdu="ماہانہ خلاصہ" description="Combined admissions, attendance, fees and notices for the selected month."
        actions={<Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button>}
      />
      <Card className="p-5 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}