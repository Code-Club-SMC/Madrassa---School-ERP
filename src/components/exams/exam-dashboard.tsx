import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { BookOpen, CalendarDays, ChevronRight, GraduationCap, LineChart, Users } from "lucide-react";
import { toast } from "sonner";
import { getExamReport, listExamSessions } from "@/components/exams/exam-api";
import type { ExamReportPayload, ExamSession, ExamSystem } from "@/components/exams/exam-types";
import { useLanguage } from "@/components/language-context";
import { useSystem } from "@/components/system-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookLoader } from "@/components/shared/book-loader";
import { cn } from "@/lib/utils";

type Tab = "exams" | "seating";

type ExamMeta = {
  exam: ExamSession;
  dateStatus: "upcoming" | "started" | "passed";
  canViewReport: boolean;
};

type Props = {
  system: ExamSystem;
};

export function ExamDashboard({ system }: Props) {
  const { lang } = useLanguage();
  const { gender } = useSystem();
  const [tab, setTab] = useState<Tab>("exams");
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportExamId, setReportExamId] = useState<string | null>(null);
  const [report, setReport] = useState<ExamReportPayload | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const section = system === "madrassa" ? (gender === "male" ? "baneen" : gender === "female" ? "banat" : undefined) : undefined;

  const examMeta = useMemo<ExamMeta[]>(() => {
    const today = new Date();
    return exams
      .map((exam) => {
        const start = new Date(exam.startDate);
        const end = new Date(exam.endDate);
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        let dateStatus: ExamMeta["dateStatus"] = "upcoming";
        if (todayStart >= startDate && todayStart <= endDate) dateStatus = "started";
        else if (todayStart > endDate) dateStatus = "passed";
        const canViewReport = exam.status === "published" && dateStatus === "passed";
        return { exam, dateStatus, canViewReport };
      })
      .sort((a, b) => new Date(b.exam.startDate).getTime() - new Date(a.exam.startDate).getTime());
  }, [exams]);

  const load = async () => {
    setLoading(true);
    try {
      const payload = await listExamSessions(system, section);
      setExams(payload.exams);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [system, section]);

  const handleViewReport = async (examId: string) => {
    setReportExamId(examId);
    setReportLoading(true);
    try {
      const data = await getExamReport({ system, examId });
      setReport(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load report");
    } finally {
      setReportLoading(false);
    }
  };

  const statusTone: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    active: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200",
    locked: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  };

  const dateStatusTone: Record<string, string> = {
    upcoming: "bg-slate-100 text-slate-600",
    started: "bg-blue-100 text-blue-700",
    passed: "bg-zinc-200 text-zinc-600",
  };

  const dateStatusLabel = (status: ExamMeta["dateStatus"]) => {
    if (lang === "ur") {
      switch (status) {
        case "upcoming":
          return "آئندہ";
        case "started":
          return "جاری";
        case "passed":
          return "مکمل";
        default:
          return "";
      }
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="exams" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {lang === "ur" ? "امتحانات" : "Exams"}
          </TabsTrigger>
          <TabsTrigger value="seating" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            {lang === "ur" ? "نشست بندی" : "Seating"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          {loading ? (
            <BookLoader text={lang === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."} className="h-64" />
          ) : examMeta.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {lang === "ur" ? "کوئی امتحان نہیں ملا" : "No exams found"}
            </Card>
          ) : (
            <div className="grid gap-3">
              {examMeta.map(({ exam, dateStatus, canViewReport }) => (
                <Card key={exam.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{exam.name}</h4>
                        <Badge variant="outline" className={cn("capitalize text-xs", statusTone[exam.status])}>
                          {exam.status}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", dateStatusTone[dateStatus])}>
                          {dateStatusLabel(dateStatus)}
                        </Badge>
                      </div>
                      <p className="font-urdu text-sm text-muted-foreground mb-2">{exam.nameUrdu}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(exam.startDate), "dd MMM yyyy")} - {format(new Date(exam.endDate), "dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {exam.studentCount} {lang === "ur" ? "طلباء" : "students"}
                        </span>
                        <span>{exam.groupLabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={system === "school" ? "/school/exams/$id" : "/madrassa/exams/$id"} params={{ id: exam.id }}>
                          {lang === "ur" ? "تفصیل" : "Detail"}
                        </Link>
                      </Button>
                      {canViewReport && (
                        <Button size="sm" onClick={() => handleViewReport(exam.id)}>
                          <LineChart className="h-3.5 w-3.5 mr-1.5" />
                          {lang === "ur" ? "رپورٹ" : "Report"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="seating" className="space-y-4">
          {loading ? (
            <BookLoader text={lang === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."} className="h-64" />
          ) : examMeta.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {lang === "ur" ? "کوئی امتحان نہیں ملا" : "No exams found"}
            </Card>
          ) : (
            <div className="grid gap-3">
              {examMeta.map(({ exam, dateStatus }) => (
                <Card key={exam.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{exam.name}</h4>
                        <Badge variant="outline" className={cn("capitalize text-xs", statusTone[exam.status])}>
                          {exam.status}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", dateStatusTone[dateStatus])}>
                          {dateStatusLabel(dateStatus)}
                        </Badge>
                      </div>
                      <p className="font-urdu text-sm text-muted-foreground mb-2">{exam.nameUrdu}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(exam.startDate), "dd MMM yyyy")} - {format(new Date(exam.endDate), "dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {exam.studentCount} {lang === "ur" ? "طلباء" : "students"}
                        </span>
                        <span>{exam.groupLabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={system === "school" ? "/school/exams/$id/seating" : "/madrassa/exams/$id/seating"} params={{ id: exam.id }}>
                          {lang === "ur" ? "نشست بندی" : "Seating"}
                          <ChevronRight className="h-3.5 w-3.5 ml-1 rtl:rotate-180" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {reportExamId && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {lang === "ur" ? "امتحانی رپورٹ" : "Exam Report"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setReportExamId(null); setReport(null); }}>
              {lang === "ur" ? "بند کریں" : "Close"}
            </Button>
          </div>
          {reportLoading ? (
            <BookLoader text={lang === "ur" ? "لوڈ ہو رہا ہے..." : "Loading report..."} className="h-48" />
          ) : report ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{lang === "ur" ? "کل طلباء" : "Total"}</p>
                  <p className="text-xl font-bold">{report.summary.total}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{lang === "ur" ? "پاس" : "Pass"}</p>
                  <p className="text-xl font-bold text-emerald-600">{report.summary.pass}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{lang === "ur" ? "فیل" : "Fail"}</p>
                  <p className="text-xl font-bold text-destructive">{report.summary.fail}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{lang === "ur" ? "پاس شرح" : "Pass Rate"}</p>
                  <p className="text-xl font-bold">{report.summary.passRate}%</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">{lang === "ur" ? "جماعت کے لحاظ سے" : "By Class"}</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(
                    report.rows.reduce<Record<string, { label: string; total: number; pass: number; fail: number; avg: number }>>((acc, row) => {
                      const label = row.groupLabel || (lang === "ur" ? "نامعلوم" : "Unknown");
                      if (!acc[label]) acc[label] = { label, total: 0, pass: 0, fail: 0, avg: 0 };
                      acc[label].total += 1;
                      if (row.status === "pass") acc[label].pass += 1;
                      else acc[label].fail += 1;
                      acc[label].avg += row.percentageTimes100;
                      return acc;
                    }, {})
                  ).map(([label, data]) => (
                    <Card key={label} className="p-4">
                      <p className="mb-2 font-medium truncate">{label}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>{lang === "ur" ? "کل" : "Total"}: {data.total}</span>
                        <span>{lang === "ur" ? "پاس" : "Pass"}: {data.pass}</span>
                        <span>{lang === "ur" ? "فیل" : "Fail"}: {data.fail}</span>
                        <span>{lang === "ur" ? "اوسط" : "Avg"}: {Math.round(data.avg / data.total)}%</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {report.gradeDistribution.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">{lang === "ur" ? "گریڈ کی تقسیم" : "Grade Distribution"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.gradeDistribution.map((item) => (
                      <Badge key={item.grade} variant="secondary">
                        {item.grade}: {item.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{lang === "ur" ? "رپورٹ موجود نہیں" : "No report data"}</p>
          )}
        </Card>
      )}
    </div>
  );
}
