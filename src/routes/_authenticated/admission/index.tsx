import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  Filter,
  Check,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { useLanguage } from "@/components/language-context";
import { applications as mockApplications } from "@/mock";
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

function AdmissionProgressDashboard() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isUrdu = lang === "ur";

  const [applicationsList, setApplicationsList] = useState<ApplicationItem[]>(() =>
    (mockApplications as unknown as ApplicationItem[]) || [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch("/api/admission/applications", { credentials: "include" });
        if (res.ok) {
          const payload = await res.json();
          if (payload?.applications && Array.isArray(payload.applications) && isMounted) {
            setApplicationsList(payload.applications);
          }
        }
      } catch {
        // Fallback to mock data already initialized
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Aggregated Pipeline Metrics
  const metrics = useMemo(() => {
    const total = applicationsList.length;
    const pending = applicationsList.filter((a) => a.status === "pending").length;
    const underReview = applicationsList.filter((a) => a.status === "under_review").length;
    const interviews = applicationsList.filter((a) => a.status === "interview_scheduled").length;
    const docsPending = applicationsList.filter((a) => a.status === "documents_pending").length;
    const waitlisted = applicationsList.filter((a) => a.status === "waitlisted").length;
    const accepted = applicationsList.filter((a) => a.status === "accepted").length;
    const rejected = applicationsList.filter((a) => a.status === "rejected").length;

    const madrassaCount = applicationsList.filter((a) => a.system === "madrassa").length;
    const schoolCount = applicationsList.filter((a) => a.system === "school").length;

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
  }, [applicationsList]);

  // Filtered applications for the activity table
  const filteredApplications = useMemo(() => {
    return applicationsList.filter((app) => {
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
  }, [applicationsList, searchQuery, statusFilter]);

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
      {/* Header with Quick Actions */}
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
            <div className="text-2xl font-bold">{metrics.total}</div>
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
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
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
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
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
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.accepted}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.conversionRate}% {isUrdu ? "شرحِ داخلہ" : "admission rate"} ({metrics.waitlisted} {isUrdu ? "انتظار" : "waitlist"})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Intake Pipeline & System Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Pipeline Funnel */}
        <Card className="lg:col-span-2 border-border/60 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {isUrdu ? "داخلہ مراحل کا فلو چارٹ" : "Intake Pipeline Progress"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isUrdu
                    ? "درخواست جمع کرانے سے حتمی داخلہ تک ہر مرحلے کی شرح"
                    : "Stage-by-stage progression from submission to official enrollment"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 font-mono text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                {metrics.conversionRate}% {isUrdu ? "تکمیل" : "Success"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Received / Pending */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                  {isUrdu ? "1. نئی موصولہ درخواستیں (زیرِ انتظار)" : "1. Intake Received (Pending / Under Review)"}
                </span>
                <span className="text-muted-foreground font-mono">
                  {metrics.activeProcessing} / {metrics.total} ({metrics.total > 0 ? Math.round((metrics.activeProcessing / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <Progress
                value={metrics.total > 0 ? (metrics.activeProcessing / metrics.total) * 100 : 0}
                className="h-2 bg-amber-500/15"
              />
            </div>

            {/* Step 2: Interviews */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                  {isUrdu ? "2. انٹرویو اور امتحانی مرحلہ" : "2. Interview & Assessment Stage"}
                </span>
                <span className="text-muted-foreground font-mono">
                  {metrics.interviews} / {metrics.total} ({metrics.total > 0 ? Math.round((metrics.interviews / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <Progress
                value={metrics.total > 0 ? (metrics.interviews / metrics.total) * 100 : 0}
                className="h-2 bg-blue-500/15"
              />
            </div>

            {/* Step 3: Document Verification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
                  {isUrdu ? "3. دستاویزات کی تصدیق" : "3. Document Verification"}
                </span>
                <span className="text-muted-foreground font-mono">
                  {metrics.docsPending} / {metrics.total} ({metrics.total > 0 ? Math.round((metrics.docsPending / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <Progress
                value={metrics.total > 0 ? (metrics.docsPending / metrics.total) * 100 : 0}
                className="h-2 bg-purple-500/15"
              />
            </div>

            {/* Step 4: Waitlist */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />
                  {isUrdu ? "4. نشستوں کی گنجائش کے منتظر (ویٹ لسٹ)" : "4. Waitlisted Applicants"}
                </span>
                <span className="text-muted-foreground font-mono">
                  {metrics.waitlisted} / {metrics.total} ({metrics.total > 0 ? Math.round((metrics.waitlisted / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <Progress
                value={metrics.total > 0 ? (metrics.waitlisted / metrics.total) * 100 : 0}
                className="h-2 bg-orange-500/15"
              />
            </div>

            {/* Step 5: Final Admission */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3 inline-block" />
                  {isUrdu ? "5. باضابطہ تصدیق شدہ داخلے (رول نمبر جاری)" : "5. Official Enrollment (Roll # Issued)"}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  {metrics.accepted} / {metrics.total} ({metrics.conversionRate}%)
                </span>
              </div>
              <Progress
                value={metrics.conversionRate}
                className="h-2.5 bg-emerald-500/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Breakdown & Fast Shortcuts */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {isUrdu ? "شعبہ جات کے مطابق تقسیم" : "Campus Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span>{isUrdu ? "جامعہ (مدرسہ)" : "Madrassa (Qasimia & Zainab)"}</span>
                  </span>
                  <span className="font-mono font-medium">{metrics.madrassaCount}</span>
                </div>
                <Progress
                  value={metrics.total > 0 ? (metrics.madrassaCount / metrics.total) * 100 : 0}
                  className="h-1.5"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-sky-600" />
                    <span>{isUrdu ? "القاسم اکیڈمی (سکول)" : "School Section"}</span>
                  </span>
                  <span className="font-mono font-medium">{metrics.schoolCount}</span>
                </div>
                <Progress
                  value={metrics.total > 0 ? (metrics.schoolCount / metrics.total) * 100 : 0}
                  className="h-1.5"
                />
              </div>

              <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
                <span>{isUrdu ? "مسترد درخواستیں:" : "Rejected applications:"}</span>
                <span className="font-mono font-medium text-destructive">{metrics.rejected}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Navigation Card */}
          <Card className="border-border/60 shadow-xs bg-sidebar-accent/10">
            <CardContent className="p-4 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isUrdu ? "فوری رسائی" : "Quick Navigation"}
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs h-9 hover:bg-background"
              >
                <Link to="/admission/new">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-3.5 w-3.5 text-primary" />
                    {isUrdu ? "نیا طالب علم داخل کریں" : "Direct Student Admission"}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs h-9 hover:bg-background"
              >
                <Link to="/admission/queue">
                  <span className="flex items-center gap-2">
                    <Inbox className="h-3.5 w-3.5 text-amber-500" />
                    {isUrdu ? "درخواستوں کا جائزہ لیں" : "Process Online Queue"}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs h-9 hover:bg-background"
              >
                <Link to="/admission/interviews">
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-blue-500" />
                    {isUrdu ? "دستاویزات اور ویٹ لسٹ" : "Docs & Waitlist Desk"}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Applications & Intake Activity */}
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
                    statusFilter === "all" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "سب" : "All"}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                    statusFilter === "pending" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "زیرِ التواء" : "Pending"}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("in_process")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                    statusFilter === "in_process" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "انٹرویو" : "Interview"}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("accepted")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors select-none",
                    statusFilter === "accepted" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isUrdu ? "منظور" : "Accepted"}
                </button>
              </div>
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
                  filteredApplications.slice(0, 8).map((app) => (
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
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-sky-500/10 text-sky-600",
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

          {filteredApplications.length > 8 && (
            <div className="mt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => navigate({ to: "/admission/queue" })}
              >
                {isUrdu
                  ? `تمام ${filteredApplications.length} درخواستیں دیکھیں`
                  : `View all ${filteredApplications.length} applications in queue`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
