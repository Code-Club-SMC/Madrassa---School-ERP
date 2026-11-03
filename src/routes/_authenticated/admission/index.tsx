import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  Inbox,
  CalendarClock,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Search,
  School,
  BookOpen,
  Check,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  BarChart3,
  ListFilter,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { useLanguage } from "@/components/language-context";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admission/")({
  component: AdmissionProgressDashboard,
});

type ApplicationItem = {
  id: string;
  refNo: string;
  name: string;
  nameUrdu: string;
  system: "madrassa" | "school";
  categoryOrClass: string;
  phone: string;
  submittedAt: string;
  status:
    | "pending"
    | "under_review"
    | "interview_scheduled"
    | "documents_pending"
    | "waitlisted"
    | "accepted"
    | "rejected";
};

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
} as const;

function AdmissionProgressDashboard() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isUrdu = lang === "ur";

  const [applicationsList, setApplicationsList] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campusFilter, setCampusFilter] = useState<"all" | "madrassa" | "school">("all");
  const [pipelineView, setPipelineView] = useState<"chart" | "funnel">("chart");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admission/applications", { credentials: "include" });
      if (res.ok) {
        const payload = await res.json();
        if (payload?.applications && Array.isArray(payload.applications)) {
          setApplicationsList(payload.applications);
        }
      }
    } catch (err) {
      console.warn("Could not fetch applications from API, waiting for retry:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Scoped Applications based on Campus Filter
  const scopedApps = useMemo(() => {
    if (campusFilter === "all") return applicationsList;
    return applicationsList.filter((a) => a.system === campusFilter);
  }, [applicationsList, campusFilter]);

  // Aggregated Pipeline Metrics
  const metrics = useMemo(() => {
    const total = scopedApps.length;
    const pending = scopedApps.filter((a) => a.status === "pending").length;
    const underReview = scopedApps.filter((a) => a.status === "under_review").length;
    const interviews = scopedApps.filter((a) => a.status === "interview_scheduled").length;
    const docsPending = scopedApps.filter((a) => a.status === "documents_pending").length;
    const waitlisted = scopedApps.filter((a) => a.status === "waitlisted").length;
    const accepted = scopedApps.filter((a) => a.status === "accepted").length;
    const rejected = scopedApps.filter((a) => a.status === "rejected").length;

    const madrassaCount = scopedApps.filter((a) => a.system === "madrassa").length;
    const schoolCount = scopedApps.filter((a) => a.system === "school").length;

    const activeProcessing = pending + underReview;
    const inEvaluation = interviews + docsPending;
    const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return {
      total,
      pending,
      underReview,
      interviews,
      docsPending,
      waitlisted,
      accepted,
      rejected,
      madrassaCount,
      schoolCount,
      activeProcessing,
      inEvaluation,
      conversionRate,
    };
  }, [scopedApps]);

  // Stage Progression Chart Data
  const stageChartData = useMemo(() => {
    return [
      {
        stageKey: "pending",
        name: isUrdu ? "موصولہ" : "Received",
        fullName: isUrdu ? "1. نئی موصولہ درخواستیں" : "1. Intake Received",
        count: metrics.activeProcessing,
        pct: metrics.total > 0 ? Math.round((metrics.activeProcessing / metrics.total) * 100) : 0,
        fill: "#f59e0b",
      },
      {
        stageKey: "review",
        name: isUrdu ? "زیرِ جائزہ" : "In Review",
        fullName: isUrdu ? "2. زیرِ جائزہ درخواستیں" : "2. In Review",
        count: metrics.underReview,
        pct: metrics.total > 0 ? Math.round((metrics.underReview / metrics.total) * 100) : 0,
        fill: "#f97316",
      },
      {
        stageKey: "interview",
        name: isUrdu ? "انٹرویو" : "Interview",
        fullName: isUrdu ? "3. انٹرویو اور امتحانی مرحلہ" : "3. Interview & Assessment",
        count: metrics.interviews,
        pct: metrics.total > 0 ? Math.round((metrics.interviews / metrics.total) * 100) : 0,
        fill: "#3b82f6",
      },
      {
        stageKey: "docs",
        name: isUrdu ? "دستاویزات" : "Docs",
        fullName: isUrdu ? "4. دستاویزات کی تصدیق" : "4. Document Verification",
        count: metrics.docsPending,
        pct: metrics.total > 0 ? Math.round((metrics.docsPending / metrics.total) * 100) : 0,
        fill: "#a855f7",
      },
      {
        stageKey: "waitlist",
        name: isUrdu ? "ویٹ لسٹ" : "Waitlist",
        fullName: isUrdu ? "5. نشستوں کے منتظر (ویٹ لسٹ)" : "5. Waitlisted Applicants",
        count: metrics.waitlisted,
        pct: metrics.total > 0 ? Math.round((metrics.waitlisted / metrics.total) * 100) : 0,
        fill: "#fb7185",
      },
      {
        stageKey: "accepted",
        name: isUrdu ? "داخلہ منظور" : "Enrolled",
        fullName: isUrdu ? "6. باضابطہ داخلہ (رول نمبر جاری)" : "6. Officially Enrolled",
        count: metrics.accepted,
        pct: metrics.conversionRate,
        fill: "#10b981",
      },
    ];
  }, [metrics, isUrdu]);

  // 6-Month Intake History Trend
  const monthlyTrendData = useMemo(() => {
    const monthNamesEn = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    const monthNamesUr = ["جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر"];

    return monthNamesEn.map((mName, idx) => {
      const monthNum = idx + 6; // June (6) to November (11)
      const inMonth = scopedApps.filter((a) => {
        const d = new Date(a.submittedAt);
        return !isNaN(d.getTime()) && d.getMonth() + 1 === monthNum;
      });

      const rec = inMonth.length;
      const acc = inMonth.filter((a) => a.status === "accepted").length;
      const rev = inMonth.filter((a) => a.status === "under_review" || a.status === "pending").length;
      const int = inMonth.filter((a) => a.status === "interview_scheduled" || a.status === "documents_pending").length;

      return {
        month: isUrdu ? monthNamesUr[idx] : mName,
        received: rec,
        evaluation: int,
        accepted: acc,
        underReview: rev,
      };
    });
  }, [scopedApps, isUrdu]);

  // Campus Donut Breakdown
  const campusPieData = useMemo(() => {
    return [
      {
        name: isUrdu ? "جامعہ (مدرسہ)" : "Madrassa (Qasimia & Zainab)",
        value: applicationsList.filter((a) => a.system === "madrassa").length,
        color: "#10b981",
      },
      {
        name: isUrdu ? "سکول (القاسم اکیڈمی)" : "School (Al-Qasim Academy)",
        value: applicationsList.filter((a) => a.system === "school").length,
        color: "#0ea5e9",
      },
    ].filter((d) => d.value > 0);
  }, [applicationsList, isUrdu]);

  // Program Breakdown Progress
  const programBreakdown = useMemo(() => {
    const totalCount = applicationsList.length || 1;
    const nizami = applicationsList.filter(
      (a) => a.categoryOrClass.includes("درس نظامی") || a.categoryOrClass.includes("Dars-e-Nizami"),
    ).length;
    const hifz = applicationsList.filter(
      (a) => a.categoryOrClass.includes("حفظ") || a.categoryOrClass.includes("Hifz"),
    ).length;
    const nazira = applicationsList.filter(
      (a) => a.categoryOrClass.includes("ناظرہ") || a.categoryOrClass.includes("Nazira"),
    ).length;
    const schoolPrimary = applicationsList.filter(
      (a) =>
        a.system === "school" &&
        (a.categoryOrClass.includes("Class 1") ||
          a.categoryOrClass.includes("Class 2") ||
          a.categoryOrClass.includes("Class 3") ||
          a.categoryOrClass.includes("Class 4") ||
          a.categoryOrClass.includes("Class 5")),
    ).length;
    const schoolSec = applicationsList.filter(
      (a) =>
        a.system === "school" &&
        (a.categoryOrClass.includes("Class 6") ||
          a.categoryOrClass.includes("Class 7") ||
          a.categoryOrClass.includes("Class 8") ||
          a.categoryOrClass.includes("Class 9") ||
          a.categoryOrClass.includes("Class 10")),
    ).length;

    return [
      {
        labelEn: "Hifz Quran",
        labelUr: "حفظ قرآن",
        count: hifz,
        pct: Math.round((hifz / totalCount) * 100),
        color: "bg-emerald-500",
      },
      {
        labelEn: "Nazira & Qaida",
        labelUr: "ناظرہ و قاعدہ",
        count: nazira,
        pct: Math.round((nazira / totalCount) * 100),
        color: "bg-teal-500",
      },
      {
        labelEn: "Dars-e-Nizami",
        labelUr: "درس نظامی",
        count: nizami,
        pct: Math.round((nizami / totalCount) * 100),
        color: "bg-indigo-500",
      },
      {
        labelEn: "Primary School (Class 1-5)",
        labelUr: "پرائمری سکول (اول تا پنجم)",
        count: schoolPrimary,
        pct: Math.round((schoolPrimary / totalCount) * 100),
        color: "bg-sky-500",
      },
      {
        labelEn: "Secondary School (Class 6-10)",
        labelUr: "ثانوی سکول (ششم تا دہم)",
        count: schoolSec,
        pct: Math.round((schoolSec / totalCount) * 100),
        color: "bg-blue-600",
      },
    ];
  }, [applicationsList]);

  // Filtered applications for the activity table
  const filteredApplications = useMemo(() => {
    return scopedApps.filter((app) => {
      const matchesSearch =
        !searchQuery ||
        app.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.nameUrdu?.includes(searchQuery) ||
        app.refNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.categoryOrClass?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "pending") return app.status === "pending" || app.status === "under_review";
      if (statusFilter === "in_process")
        return app.status === "interview_scheduled" || app.status === "documents_pending";
      if (statusFilter === "waitlisted") return app.status === "waitlisted";
      if (statusFilter === "accepted") return app.status === "accepted";
      if (statusFilter === "rejected") return app.status === "rejected";

      return true;
    });
  }, [scopedApps, searchQuery, statusFilter]);

  const getStatusBadge = (status: ApplicationItem["status"]) => {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 hover:bg-emerald-500/25">
            <CheckCircle2 className="h-3 w-3" />
            {isUrdu ? "قبول شدہ" : "Accepted"}
          </Badge>
        );
      case "interview_scheduled":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 hover:bg-blue-500/25">
            <CalendarClock className="h-3 w-3" />
            {isUrdu ? "انٹرویو طے شدہ" : "Interview"}
          </Badge>
        );
      case "documents_pending":
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 gap-1 hover:bg-purple-500/25">
            <FileCheck2 className="h-3 w-3" />
            {isUrdu ? "دستاویزات طلب" : "Docs Pending"}
          </Badge>
        );
      case "waitlisted":
        return (
          <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30 gap-1 hover:bg-orange-500/25">
            <Clock className="h-3 w-3" />
            {isUrdu ? "انتظار کی فہرست" : "Waitlisted"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {isUrdu ? "مسترد شدہ" : "Rejected"}
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 hover:bg-amber-500/25">
            <Clock className="h-3 w-3" />
            {isUrdu ? "زیرِ جائزہ" : "Under Review"}
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 hover:bg-amber-500/25">
            <Clock className="h-3 w-3" />
            {isUrdu ? "زیرِ التواء" : "Pending"}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions & Campus Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageHeader
            title="Admission Progress Dashboard"
            titleUrdu="داخلہ پیش رفت ڈیش بورڈ"
            description={
              isUrdu
                ? "داخلہ مہم کی موجودہ صورتحال، مراحل کی پیش رفت، اور فوری اقدامات کا مکمل جائزہ"
                : "Real-time intake tracking, application pipeline stages, and admission workflows."
            }
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Campus Selector Toggle */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setCampusFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                campusFilter === "all" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isUrdu ? "تمام شعبہ جات" : "All Campuses"}
            </button>
            <button
              type="button"
              onClick={() => setCampusFilter("madrassa")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors select-none flex items-center gap-1",
                campusFilter === "madrassa" ? "bg-emerald-500 text-white font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <BookOpen className="h-3 w-3" />
              <span>{isUrdu ? "مدرسہ" : "Madrassa"}</span>
            </button>
            <button
              type="button"
              onClick={() => setCampusFilter("school")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors select-none flex items-center gap-1",
                campusFilter === "school" ? "bg-sky-600 text-white font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <School className="h-3 w-3" />
              <span>{isUrdu ? "سکول" : "School"}</span>
            </button>
          </div>

          <Button
            onClick={() => navigate({ to: "/admission/new" })}
            className="gap-2 shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isUrdu ? "نیا داخلہ فارم" : "New Admission"}</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="gap-2 relative"
          >
            <Link to="/admission/queue">
              <Inbox className="h-4 w-4" />
              <span>{isUrdu ? "درخواستوں کی قطار" : "Application Queue"}</span>
              {metrics.activeProcessing > 0 && (
                <Badge className="ms-1 bg-amber-500 text-white hover:bg-amber-600 px-1.5 py-0 text-[10px] h-4">
                  {metrics.activeProcessing}
                </Badge>
              )}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link to="/admission/interviews">
              <CalendarClock className="h-4 w-4" />
              <span>{isUrdu ? "انٹرویو اور دستاویزات" : "Interviews & Docs"}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <Card className="border-border/60 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isUrdu ? "کل موصولہ درخواستیں" : "Total Applications"}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>{metrics.madrassaCount} {isUrdu ? "مدرسہ" : "Madrassa"}</span>
              <span>•</span>
              <span>{metrics.schoolCount} {isUrdu ? "سکول" : "School"}</span>
            </p>
          </CardContent>
        </Card>

        {/* Needs Action / Pending */}
        <Card className="border-border/60 shadow-xs hover:border-amber-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isUrdu ? "زیرِ جائزہ درخواستیں" : "Action Required"}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {metrics.activeProcessing}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.pending} {isUrdu ? "نئی" : "new"}, {metrics.underReview} {isUrdu ? "زیرِ پڑتال" : "in review"}
            </p>
          </CardContent>
        </Card>

        {/* Interviews & Verification */}
        <Card className="border-border/60 shadow-xs hover:border-blue-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isUrdu ? "انٹرویو و دستاویزات" : "In Evaluation"}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CalendarClock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {metrics.inEvaluation}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.interviews} {isUrdu ? "انٹرویو" : "interview"}, {metrics.docsPending} {isUrdu ? "دستاویزات" : "docs"}
            </p>
          </CardContent>
        </Card>

        {/* Enrolled / Accepted */}
        <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isUrdu ? "کامیاب داخلے (منظور شدہ)" : "Admitted / Enrolled"}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.accepted}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.conversionRate}% {isUrdu ? "شرحِ داخلہ" : "admission rate"} ({metrics.waitlisted} {isUrdu ? "انتظار" : "waitlist"})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Intake Pipeline Chart (BarChart & Stage Breakdown) */}
        <Card className="lg:col-span-2 border-border/60 shadow-xs">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>{isUrdu ? "داخلہ مراحل کا فلو چارٹ" : "Intake Pipeline Stage Progression"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isUrdu
                    ? "درخواست جمع کرانے سے حتمی داخلہ تک ہر مرحلے کے درست اعداد و شمار"
                    : "Stage-by-stage intake counts, conversion ratios, and pipeline movement"}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 font-mono text-xs">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  {metrics.conversionRate}% {isUrdu ? "کامیابی شرح" : "Enrollment Rate"}
                </Badge>

                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
                  <button
                    type="button"
                    onClick={() => setPipelineView("chart")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors select-none",
                      pipelineView === "chart" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {isUrdu ? "بار چارٹ" : "Bar Chart"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPipelineView("funnel")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors select-none",
                      pipelineView === "funnel" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {isUrdu ? "فلو لسٹ" : "Flow List"}
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pipelineView === "chart" ? (
              <div className="space-y-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} opacity={0.4} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(val: any, _name: any, item: any) => [
                          `${val} ${isUrdu ? "امیدوار" : "applicants"} (${item?.payload?.pct}%)`,
                          item?.payload?.fullName,
                        ]}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stageChartData.map((entry) => (
                          <Cell key={entry.stageKey} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stage Legend Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-border/50 text-center">
                  {stageChartData.map((s) => (
                    <div key={s.stageKey} className="p-1.5 rounded-md bg-muted/30 border border-border/40">
                      <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: s.fill }} />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <div className="text-base font-bold font-mono mt-0.5">{s.count}</div>
                      <div className="text-[10px] text-muted-foreground">{s.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Funnel Step-by-Step Progress Bars View */
              <div className="space-y-3.5">
                {stageChartData.map((stage, idx) => (
                  <div key={stage.stageKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: stage.fill }} />
                        <span>{stage.fullName}</span>
                      </span>
                      <span className="font-mono text-muted-foreground">
                        <strong className="text-foreground">{stage.count}</strong> / {metrics.total} ({stage.pct}%)
                      </span>
                    </div>
                    <Progress value={stage.pct} className="h-2" style={{ backgroundColor: `${stage.fill}20` }} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campus & Program Distribution Donut Card */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                <span>{isUrdu ? "شعبہ جاتی تقسیم" : "Campus Distribution"}</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {metrics.total} {isUrdu ? "کل" : "Total"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {isUrdu ? "مدرسہ و سکول کے مابین درخواستوں کا تناسب" : "Distribution between Madrassa & School sections"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Pie
                    data={campusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                  >
                    {campusPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Program Breakdown List */}
            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isUrdu ? "پروگرامز کے مطابق اعداد و شمار" : "Program Wise Intake"}
              </div>
              {programBreakdown.map((prog) => (
                <div key={prog.labelEn} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{isUrdu ? prog.labelUr : prog.labelEn}</span>
                    <span className="font-mono font-medium">
                      {prog.count} ({prog.pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", prog.color)} style={{ width: `${prog.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6-Month Intake & Enrollment Trend Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isUrdu ? "گزشتہ 6 ماہ کا داخلہ رجحان" : "6-Month Intake & Enrollment Trend"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isUrdu
                  ? "ماہ بہ ماہ موصولہ درخواستیں، جائزہ، اور حتمی داخلے کی تفصیل"
                  : "Monthly progression tracking applications received vs enrolled students"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {isUrdu ? "منظور شدہ داخلے" : "Enrolled"}
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                {isUrdu ? "انٹرویو و ٹیسٹ" : "Evaluation"}
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {isUrdu ? "کل موصولہ" : "Intake"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} opacity={0.4} />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any, nameKey: any) => [
                    `${val} ${isUrdu ? "درخواستیں" : "apps"}`,
                    nameKey === "received"
                      ? isUrdu
                        ? "کل موصولہ"
                        : "Intake Received"
                      : nameKey === "evaluation"
                      ? isUrdu
                        ? "زیرِ جائزہ و انٹرویو"
                        : "Evaluation Stage"
                      : isUrdu
                      ? "منظور شدہ داخلہ"
                      : "Officially Enrolled",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRec)"
                />
                <Area
                  type="monotone"
                  dataKey="evaluation"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInt)"
                />
                <Area
                  type="monotone"
                  dataKey="accepted"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAcc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications & Intake Activity Table */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {isUrdu ? "حالیہ داخلہ درخواستیں" : "Recent Intake Applications"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isUrdu
                  ? "تازہ ترین درخواستوں کی تفصیل اور ان کے موجودہ مراحل"
                  : "Latest applications across all programs and current status"}
              </CardDescription>
            </div>

            {/* Search and Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isUrdu ? "تلاش کریں..." : "Filter applicants..."}
                  className="h-8 ps-8 text-xs"
                />
              </div>

              <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                    statusFilter === "all" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "سب" : "All"}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                    statusFilter === "pending" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "زیرِ التواء" : "Pending"}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("in_process")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                    statusFilter === "in_process" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "انٹرویو" : "Interview"}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("waitlisted")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                    statusFilter === "waitlisted" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "ویٹ لسٹ" : "Waitlist"}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("accepted")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                    statusFilter === "accepted" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "منظور" : "Accepted"}
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 gap-1 text-xs"
                onClick={() => void loadData()}
                disabled={loading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                <span>{isUrdu ? "تازہ کریں" : "Refresh"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-start">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-3 text-start">{isUrdu ? "درخواست نمبر" : "Ref No"}</th>
                  <th className="py-2.5 px-3 text-start">{isUrdu ? "امیدوار کا نام" : "Applicant"}</th>
                  <th className="py-2.5 px-3 text-start">{isUrdu ? "شعبہ / کلاس" : "Program / Class"}</th>
                  <th className="py-2.5 px-3 text-start">{isUrdu ? "رابطہ نمبر" : "Contact"}</th>
                  <th className="py-2.5 px-3 text-start">{isUrdu ? "تاریخ" : "Submitted"}</th>
                  <th className="py-2.5 px-3 text-start">{isUrdu ? "مرحلہ / کیفیت" : "Status"}</th>
                  <th className="py-2.5 px-3 text-end">{isUrdu ? "اقدام" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {isUrdu ? "کوئی درخواست نہیں ملی" : "No matching applications found"}
                    </td>
                  </tr>
                ) : (
                  filteredApplications.slice(0, 10).map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-primary">
                        {app.refNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-foreground">{app.name}</div>
                        {app.nameUrdu && (
                          <div className="font-urdu text-[11px] text-muted-foreground">{app.nameUrdu}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold",
                              app.system === "madrassa"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                            )}
                          >
                            {app.system}
                          </span>
                          <span className="text-muted-foreground truncate max-w-[140px]">
                            {app.categoryOrClass}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {app.phone || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {app.submittedAt ? formatDate(app.submittedAt) : "—"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="py-2.5 px-3 text-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs gap-1 hover:text-primary"
                          onClick={() => navigate({ to: "/admission/queue" })}
                        >
                          <span>{isUrdu ? "جائزہ لیں" : "Review"}</span>
                          <ArrowUpRight className="h-3 w-3 rtl:rotate-180" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredApplications.length > 10 && (
            <div className="mt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => navigate({ to: "/admission/queue" })}
              >
                {isUrdu
                  ? `تمام ${filteredApplications.length} درخواستیں قطار میں دیکھیں`
                  : `View all ${filteredApplications.length} applications in queue`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
