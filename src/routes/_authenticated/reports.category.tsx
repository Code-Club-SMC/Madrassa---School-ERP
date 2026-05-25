import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { madrassaCategories } from "@/mock";

export const Route = createFileRoute("/_authenticated/reports/category")({
  component: CategoryReport,
});

function CategoryReport() {
  const data = madrassaCategories.map((c) => ({ name: c.name, value: c.subcategories.reduce((a, b) => a + b.count, 0) }));
  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports</Link>
      <PageHeader title="Category-wise Report" titleUrdu="زمرہ وار رپورٹ" description="Distribution of Madrassa students across Wifaq categories."
        actions={<Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print</Button>}
      />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-heading font-semibold mb-3">Breakdown</h3>
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ background: COLORS[i % COLORS.length] }} /><span className="text-sm">{d.name}</span></div>
                <span className="font-mono text-sm">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}