import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Layers, GraduationCap, CalendarRange, BarChart3, Shield, FileText, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { madrassaCategories, students, feeRecords } from "@/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsHub,
});

const REPORTS = [
  { key: "attendance", to: "/reports/attendance" as const, icon: ClipboardList, title: "Attendance", titleUrdu: "حاضری", desc: "Daily attendance trends with heatmap and per-student breakdown." },
  { key: "category", to: "/reports/category" as const, icon: Layers, title: "Category-wise", titleUrdu: "زمرہ وار", desc: "Enrollment, retention and fee collection by Hifz / Nazira / class." },
  { key: "exam", to: "/school/exams" as const, icon: GraduationCap, title: "Exam Results", titleUrdu: "نتائج", desc: "Series-level pass percentages and grade distribution." },
  { key: "monthly", to: "/reports/monthly" as const, icon: CalendarRange, title: "Monthly Summary", titleUrdu: "ماہانہ", desc: "Combined admissions, attendance, fees for a single month." },
  { key: "annual", to: "/reports/annual" as const, icon: BarChart3, title: "Annual Report", titleUrdu: "سالانہ", desc: "Year-on-year growth, finance health and academic outcomes." },
  { key: "admin", to: "/audit" as const, icon: Shield, title: "Administrative", titleUrdu: "انتظامی", desc: "Audit log, role activity and system change history." },
];

function ReportsHub() {
  const enrollment = madrassaCategories.map((c) => ({
    name: c.name,
    students: c.subcategories.reduce((a, b) => a + b.count, 0),
  }));

  const present = students.filter((s) => s.status === "active").length;
  const collected = feeRecords.filter((f) => f.status === "paid").length;
  const collectionRate = Math.round((collected / Math.max(feeRecords.length, 1)) * 100);

  return (
    <div>
      <PageHeader
        title="Reports"
        titleUrdu="رپورٹس"
        description="Generate and export institutional reports."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("PDF export queued")}><FileText className="h-3.5 w-3.5" />Export PDF</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Excel export queued")}><FileSpreadsheet className="h-3.5 w-3.5" />Export Excel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Students · کل طلبہ</p><p className="font-heading text-2xl font-bold mt-1">{students.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Active · فعال</p><p className="font-heading text-2xl font-bold mt-1 text-chart-5 dark:text-chart-1">{present}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Fee Collection · فیس وصولی</p><p className="font-heading text-2xl font-bold mt-1">{collectionRate}%</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Reports Available</p><p className="font-heading text-2xl font-bold mt-1">{REPORTS.length}</p></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {REPORTS.map((r) => (
          <Card key={r.key} className="p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><r.icon className="h-5 w-5 text-primary" /></div>
            <div>
              <h3 className="font-heading font-semibold text-base">{r.title}</h3>
              <p className="font-urdu text-sm text-muted-foreground leading-tight">{r.titleUrdu}</p>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{r.desc}</p>
            <Link to={r.to}><Button size="sm" variant="outline" className="w-full">Open Report</Button></Link>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <h3 className="font-heading font-semibold">Enrollment by Category</h3>
          <p className="font-urdu text-sm text-muted-foreground">زمرہ وار اندراج</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={enrollment}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="students" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
