import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { madrassaCategories, students, feeRecords } from "@/mock";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from "@/lib/chart-theme";
import { downloadCsv, printHtml, tableHtml, kpiHtml } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/reports/category")({
  component: CategoryReport,
});

function CategoryReport() {
  const byCategory = madrassaCategories.map((c, i) => {
    const total = c.subcategories.reduce((a, b) => a + b.count, 0);
    const inSystem = students.filter((s) => s.categoryId === c.id);
    const female = inSystem.filter((s) => s.gender === "female").length;
    const active = inSystem.filter((s) => s.status === "active").length;
    const fee = feeRecords.filter((f) => inSystem.some((s) => s.id === f.studentId));
    const collected = fee.reduce((a, b) => a + b.paidAmount, 0);
    const expected = fee.reduce((a, b) => a + b.monthlyFee, 0);
    return {
      id: c.id,
      name: c.name,
      nameUrdu: c.nameUrdu,
      value: total,
      female,
      male: total - female,
      active,
      collected,
      expected,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  const grandTotal = byCategory.reduce((a, b) => a + b.value, 0);

  const subBreakdown = madrassaCategories.flatMap((c) =>
    c.subcategories.map((s) => ({
      category: c.name,
      categoryUrdu: c.nameUrdu,
      name: s.name,
      nameUrdu: s.nameUrdu,
      count: s.count,
      rollPrefix: s.rollPrefix,
    })),
  );

  const top = [...byCategory].sort((a, b) => b.value - a.value)[0];

  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports
      </Link>
      <PageHeader
        title="Category-wise Report"
        titleUrdu="زمرہ وار رپورٹ"
        description="Enrollment, gender split and fee collection across Wifaq categories."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printHtml(
              "Category Report",
              `<h1>Category-wise Report</h1><div class="urdu">زمرہ وار رپورٹ</div>
              <div>${kpiHtml([
                { label: "Total Enrolled", value: grandTotal },
                { label: "Categories", value: byCategory.length },
                { label: "Largest", value: top?.name ?? "—" },
              ])}</div>
              ${tableHtml(["Category", "Subcategory", "Roll Prefix", "Students", "%"], subBreakdown.map((s) => [s.category, s.name, s.rollPrefix, s.count, `${Math.round((s.count / grandTotal) * 1000) / 10}%`]))}`
            )}><Printer className="h-3.5 w-3.5" />Print</Button>
            <Button size="sm" className="gap-1.5" onClick={() => downloadCsv(
              "category-report",
              ["Category", "Subcategory", "Roll Prefix", "Students", "% of Total"],
              subBreakdown.map((s) => [s.category, s.name, s.rollPrefix, s.count, `${Math.round((s.count / grandTotal) * 1000) / 10}%`]),
            )}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Enrolled" labelUrdu="کل اندراج" value={grandTotal} />
        <KpiCard label="Categories" labelUrdu="زمرے" value={byCategory.length} />
        <KpiCard label="Largest Category" labelUrdu="سب سے بڑا زمرہ" value={top?.name ?? "—"} accent="success" />
        <KpiCard label="Subcategories" labelUrdu="ذیلی زمرے" value={subBreakdown.length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Distribution" titleUrdu="تقسیم" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                stroke="var(--background)"
                strokeWidth={2}
                label={(e: { percent?: number }) => `${Math.round((e.percent ?? 0) * 100)}%`}
                labelLine={false}
              >
                {byCategory.map((c) => <Cell key={c.id} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _n, p) => [`${v} students`, p?.payload?.nameUrdu ?? p?.payload?.name]} />
              <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gender Split per Category" titleUrdu="زمرہ وار صنفی تقسیم" bodyClassName="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
              <Bar dataKey="male" name="Male" stackId="g" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="female" name="Female" stackId="g" fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Fee Collection by Category" titleUrdu="زمرہ وار فیس وصولی" bodyClassName="h-72" className="mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byCategory} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={AXIS_TICK} stroke="var(--border)" />
            <YAxis tick={AXIS_TICK} stroke="var(--border)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
            <Bar dataKey="expected" name="Expected" fill={CHART_COLORS[3]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="p-5 mb-4">
        <div className="mb-3">
          <h3 className="font-heading font-semibold text-sm">Subcategory Breakdown</h3>
          <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground leading-tight">ذیلی زمرے کی تفصیل</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Roll Prefix</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subBreakdown.map((s) => (
                <TableRow key={`${s.category}-${s.name}`}>
                  <TableCell>
                    <div className="text-sm">{s.category}</div>
                    <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">{s.categoryUrdu}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{s.name}</div>
                    <div dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">{s.nameUrdu}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.rollPrefix}</TableCell>
                  <TableCell className="text-right font-mono">{s.count}</TableCell>
                  <TableCell className="text-right font-mono">{Math.round((s.count / grandTotal) * 1000) / 10}%</TableCell>
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
          <li><span className="font-semibold text-foreground">{top?.name}</span> ({top?.nameUrdu}) is the largest category with {top?.value} students — {Math.round(((top?.value ?? 0) / grandTotal) * 100)}% of total enrollment.</li>
          <li>Average category size is <span className="font-semibold text-foreground">{Math.round(grandTotal / byCategory.length)}</span> students.</li>
          <li>Smallest category <span className="font-semibold text-foreground">{[...byCategory].sort((a, b) => a.value - b.value)[0]?.name}</span> may need recruitment focus.</li>
        </ul>
      </Card>
    </div>
  );
}
