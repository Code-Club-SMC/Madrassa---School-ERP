import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Users,
  CalendarCheck2,
  Banknote,
  AlertTriangle,
  GraduationCap,
  UserPlus,
  ClipboardEdit,
  ChevronLeft,
  BookOpen,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { TeacherDashboard } from "@/components/teachers/teacher-dashboard";
import { ParentPortal } from "@/components/parents/parent-portal";
import { KpiCard } from "@/components/shared/kpi-card";
import { BookLoader } from "@/components/shared/book-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  attendanceLast7,
  categoryDistribution,
  enrollmentTrend,
  institution,
  recentActivity,
  sparkline,
} from "@/mock";
import { formatPKR, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/language-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const ACTIVITY_ICONS = {
  admission: UserPlus,
  fee: Banknote,
  attendance: CalendarCheck2,
  exam: BookOpen,
} as const;

const ACTIVITY_TONE = {
  admission: "bg-primary/10 text-primary",
  fee: "bg-chart-1/15 text-chart-5 dark:text-chart-1",
  attendance: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  exam: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
} as const;

function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login", search: { redirect: undefined } });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  if (!user) {
    return null;
  }
  if (user?.role === "teacher") {
    return <TeacherDashboard />;
  }
  if (user?.role === "parent") {
    return <ParentPortal />;
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todayUrdu = new Intl.DateTimeFormat("ur-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {lang === "ur" ? "السلام عليكم" : "Assalamu Alaikum"}, {user?.name ?? "User"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lang === "ur" ? todayUrdu : today}
            </p>
          </div>
          <div className="text-end">
            <p className="font-urdu text-lg text-foreground">{institution.nameUrdu}</p>
            <p className="font-urdu text-xs text-muted-foreground mt-0.5">
              {lang === "ur" ? todayUrdu : today}
            </p>
          </div>
        </div>
      </div>

      <PageHeader
        title={lang === "ur" ? "Dashboard" : "Dashboard"}
        titleUrdu="ڈیش بورڈ"
        description={
          lang === "ur"
            ? "مدرسہ اور اسکول دونو systems کا ملudin جائزہ"
            : "Combined overview across the Madrassa and School systems."
        }
        descriptionUrdu="مدرسہ اور اسکول دونوں نظاموں کا مل Yu جائزہ"
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={Users}
          value="1,248"
          label={lang === "ur" ? "کل طلبہ" : "Total Students"}
          labelUrdu="کل طلبہ"
          subline={lang === "ur" ? "مدرسہ 812 · اسکول 436" : "Madrassa 812 · School 436"}
          trend={{ direction: "up", value: lang === "ur" ? "+3.2% اس ماہ" : "+3.2% this month" }}
          sparkline={sparkline(1)}
        />
        <KpiCard
          icon={CalendarCheck2}
          value="94.2%"
          label={lang === "ur" ? "آج کی حاضری" : "Today's Attendance"}
          labelUrdu="آج کی حاضری"
          trend={{ direction: "up", value: lang === "ur" ? "+1.4% کل سے" : "+1.4% vs yesterday" }}
          sparkline={sparkline(2)}
        />
        <KpiCard
          icon={Banknote}
          value={formatPKR(1_842_000)}
          label={lang === "ur" ? "ماہانہ وصولی" : "Fees Collected (Month)"}
          labelUrdu="ماہانہ وصولی"
          trend={{
            direction: "up",
            value: lang === "ur" ? "+8.6% پچھلے مہینے سے" : "+8.6% vs last month",
          }}
          sparkline={sparkline(3)}
        />
        <KpiCard
          icon={AlertTriangle}
          value={formatPKR(214_500)}
          label={lang === "ur" ? "بقایا جات" : "Pending Arrears"}
          labelUrdu="بقایا جات"
          tone="destructive"
          trend={{ direction: "down", value: lang === "ur" ? "-2.1% وصول ہوا" : "-2.1% recovered" }}
          sparkline={sparkline(4)}
        />
        <KpiCard
          icon={GraduationCap}
          value="42"
          label={lang === "ur" ? "فعال اساتذہ" : "Active Teachers"}
          labelUrdu="فعال اساتذہ"
          subline={lang === "ur" ? "مدرسہ 24 · اسکول 18" : "Madrassa 24 · School 18"}
          sparkline={sparkline(5)}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
            <Link to="/admission/new">
              <UserPlus className="h-4 w-4" />
              <span className="font-urdu text-sm">{lang === "ur" ? "نیا داخلہ" : "New Admission"}</span>
              <span className="text-xs text-muted-foreground">
                {lang === "ur" ? "نیا داخلہ" : "New Admission"}
              </span>
            </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
            <Link to="/madrassa/attendance">
              <CalendarCheck2 className="h-4 w-4" />
              <span className="font-urdu text-sm">{lang === "ur" ? "حاضری" : "Attendance"}</span>
              <span className="text-xs text-muted-foreground">
                {lang === "ur" ? "حاضری کریں" : "Mark Attendance"}
              </span>
            </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
            <Link to="/madrassa/fees">
              <Banknote className="h-4 w-4" />
              <span className="font-urdu text-sm">
                {lang === "ur" ? "فیس وصول کریں" : "Receive Fee"}
              </span>
              <span className="text-xs text-muted-foreground">
                {lang === "ur" ? "ادائیگی ریکارڈ کریں" : "Record Payment"}
              </span>
            </Link>
        </Button>
      </div>

      {/* Enrollment trend */}
      <Card className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-heading font-semibold text-base">
              {lang === "ur" ? "داخلوں کا رجحان" : "Enrollment Trend"}
            </h3>
            <p className="font-urdu text-sm text-muted-foreground">
              {lang === "ur" ? "داخلوں کا رجحان — گزشتہ 12 ماہ" : "Enrollment Trend — Last 12 Months"}
            </p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="madrassa"
                name={lang === "ur" ? "مدرسہ" : "Madrassa"}
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="school"
                name={lang === "ur" ? "اسکول" : "School"}
                stroke="var(--color-chart-4)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-heading font-semibold text-base">
              {lang === "ur" ? "حاضری — گزشتہ 7 دن" : "Attendance — Last 7 Days"}
            </h3>
            <p className="font-urdu text-sm text-muted-foreground">
              {lang === "ur" ? "گزشتہ سات دن کی حاضری" : "Attendance summary for last 7 days"}
            </p>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {attendanceLast7.map((d) => {
              const intensity = Math.min(1, Math.max(0.15, d.rate / 100));
              return (
                <div key={d.day} className="flex flex-col items-center gap-2">
                  <div
                    className="aspect-square w-full rounded-lg border border-border/60 flex items-end justify-center p-1 text-[10px] text-primary-foreground/90 font-medium"
                    style={{
                      background: `color-mix(in oklab, var(--color-primary) ${Math.round(intensity * 100)}%, transparent)`,
                    }}
                  >
                    {d.rate}%
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: lang === "ur" ? "اوسط" : "Average", urdu: "اوسط", value: "89%" },
              {
                label: lang === "ur" ? "بہترین دن" : "Best Day",
                urdu: "بہترین دن",
                value: "Wed · 96%",
              },
              { label: lang === "ur" ? "کم ترین" : "Low Day", urdu: "کم ترین", value: "Sat · 78%" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-muted/50 p-3">
                <p className="font-heading text-lg font-bold tabular-nums">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="font-urdu text-xs text-muted-foreground">{lang === "ur" ? s.urdu : s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-heading font-semibold text-base">
              {lang === "ur" ? "مدرسہ — اقسام کی تقسیم" : "Madrassa Category Distribution"}
            </h3>
            <p className="font-urdu text-sm text-muted-foreground">
              {lang === "ur" ? "مدرسہ — اقسام کی تقسیم" : "Madrassa Category Distribution"}
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="var(--color-card)"
                  strokeWidth={2}
                >
                  {categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    fontSize: 12,
                    fontFamily: "var(--font-urdu)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-4">
            {categoryDistribution.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ background: `var(--color-chart-${(i % 5) + 1})` }}
                />
                <span className="font-urdu truncate flex-1">{c.name}</span>
                <span className="tabular-nums text-muted-foreground">{c.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="font-heading font-semibold text-base">Recent Activity</h3>
          <p className="font-urdu text-sm text-muted-foreground">حالیہ سرگرمیاں</p>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {recentActivity.map((a) => {
            const Icon = ACTIVITY_ICONS[a.type];
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                    ACTIVITY_TONE[a.type],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="font-urdu text-xs text-muted-foreground truncate">{a.titleUrdu}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
                  {relativeTime(a.at)}
                </p>
                <ChevronLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/20">
          <Button variant="ghost" size="sm" className="text-xs">
            <span className="font-urdu">سب دیکھیں</span>
            <span className="ms-2 text-muted-foreground">View all activity</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Quiet unused import in some builds
void AreaChart;
void Area;
