import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_authenticated/reports/annual")({
  component: AnnualReport,
});

function AnnualReport() {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const data = months.map((m, i) => ({ month: m, enrollment: 280 + i * 4 + (i % 3) * 6, collection: 410000 + i * 18000, expenses: 290000 + i * 9000 }));
  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports</Link>
      <PageHeader title="Annual Report" titleUrdu="سالانہ رپورٹ" description="Year-on-year enrollment, fee collection and expenses."
        actions={<Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button>}
      />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 h-80">
          <h3 className="font-heading font-semibold mb-3 text-sm">Enrollment Trend</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Area dataKey="enrollment" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5 h-80">
          <h3 className="font-heading font-semibold mb-3 text-sm">Finance · Collection vs Expenses</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Area dataKey="collection" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.2} />
              <Area dataKey="expenses" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}