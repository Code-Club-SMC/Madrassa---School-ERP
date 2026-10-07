import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, GraduationCap, CalendarRange, BarChart3, Shield, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from "recharts";
import { madrassaCategories, students, feeRecords } from "@/mock";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { TOOLTIP_STYLE, AXIS_TICK } from "@/lib/chart-theme";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports/")({
  component: ReportsHub,
});

const REPORTS = [
  {
    key: "attendance",
    to: "/reports/attendance" as const,
    icon: ClipboardList,
    title: "Attendance Report",
    titleUrdu: "حاضری رپورٹ",
    desc: "Daily attendance trends with heatmap and per-student breakdown.",
    descUrdu: "یومیہ حاضری کے رجحانات اور طلبہ کے انفرادی ریکارڈ کا جائزہ۔",
  },
  {
    key: "exam",
    to: "/reports/exams" as const,
    icon: GraduationCap,
    title: "Exam Results",
    titleUrdu: "امتحانی نتائج",
    desc: "Series-level pass percentages, grade distribution and subject mastery.",
    descUrdu: "امتحانی کامیابی کی شرح، گریڈز کی تقسیم اور مضامین کی کارکردگی۔",
  },
  {
    key: "monthly",
    to: "/reports/monthly" as const,
    icon: CalendarRange,
    title: "Monthly Summary",
    titleUrdu: "ماہانہ خلاصہ",
    desc: "Combined admissions, attendance, fees for a single month.",
    descUrdu: "ایک ماہ کے داخلے، حاضری اور فیسوں کا مجموعی خلاصہ۔",
  },
  {
    key: "annual",
    to: "/reports/annual" as const,
    icon: BarChart3,
    title: "Annual Report",
    titleUrdu: "سالانہ رپورٹ",
    desc: "Year-on-year growth, finance health and academic outcomes.",
    descUrdu: "سال بہ سال ترقی، مالی صحت اور تعلیمی نتائج کی جامع رپورٹ۔",
  },
  {
    key: "admin",
    to: "/reports/admin" as const,
    icon: Shield,
    title: "Administrative",
    titleUrdu: "انتظامی رپورٹ",
    desc: "Audit log, role activity, security events and system change history.",
    descUrdu: "آڈٹ لاگ، صارفین کی سرگرمیاں، سیکیورٹی اور انتظامی تبدیلیاں۔",
  },
];

function ReportsHub() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const enrollment = madrassaCategories.map((c) => ({
    name: c.name,
    nameUrdu: c.nameUrdu,
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
        descriptionUrdu="ادارہ جاتی رپورٹس تیار کریں اور پرنٹ یا برآمد کریں۔"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
              <FileText className="h-3.5 w-3.5" />
              {isUrdu ? "پرنٹ کریں" : "Print Hub"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Students" labelUrdu="کل طلبہ" value={students.length} delta={{ value: 6, positive: true }} />
        <KpiCard label="Active" labelUrdu="فعال" value={present} accent="success" />
        <KpiCard label="Fee Collection" labelUrdu="فیس وصولی" value={`${collectionRate}%`} accent={collectionRate >= 75 ? "success" : "warning"} />
        <KpiCard label="Reports Available" labelUrdu="دستیاب رپورٹس" value={REPORTS.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {REPORTS.map((r) => (
          <Card key={r.key} className="p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <r.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className={cn("text-base font-semibold", isUrdu ? "font-urdu text-lg" : "font-heading")}>
                {isUrdu ? r.titleUrdu : r.title}
              </h3>
            </div>
            <p className={cn("text-xs text-muted-foreground line-clamp-2 flex-1", isUrdu && "font-urdu")}>
              {isUrdu ? r.descUrdu : r.desc}
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to={r.to}>{isUrdu ? "رپورٹ کھولیں" : "Open Report"}</Link>
            </Button>
          </Card>
        ))}
      </div>

      <ChartCard
        title="Enrollment by Category"
        titleUrdu="زمرہ وار اندراج"
        description={isUrdu ? "وفاق کے زمروں کے مطابق مدرسہ کے طلبہ کی تقسیم۔" : "Madrassa students grouped by Wifaq category."}
        bodyClassName="h-72"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={enrollment} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey={isUrdu ? "nameUrdu" : "name"} tick={AXIS_TICK} stroke="var(--border)" />
            <YAxis tick={AXIS_TICK} stroke="var(--border)" />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "color-mix(in oklab, var(--primary) 8%, transparent)" }}
              formatter={(v: number, _n, p) => [
                `${v} ${isUrdu ? "طلبہ" : "students"}`,
                isUrdu ? p?.payload?.nameUrdu : p?.payload?.name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
            <Bar dataKey="students" name={isUrdu ? "طلبہ" : "Students"} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
