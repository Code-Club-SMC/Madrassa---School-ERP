import { useEffect, useMemo, useState } from "react";
import { BookOpen, GraduationCap, LineChart, Users } from "lucide-react";
import { toast } from "sonner";
import { getDmc, getExamReport, listExamSessions } from "@/components/exams/exam-api";
import type { DmcPayload, ExamReportPayload, ExamSession, ExamSystem } from "@/components/exams/exam-types";
import { useLanguage } from "@/components/language-context";
import { useSystem } from "@/components/system-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookLoader } from "@/components/shared/book-loader";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { DmcView } from "@/components/exams/dmc-view";
import { cn } from "@/lib/utils";

type ViewMode = "class" | "individual";

type Props = {
  system: ExamSystem;
};

export function ExamResults({ system }: Props) {
  const { lang } = useLanguage();
  const { gender } = useSystem();
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ExamReportPayload | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("class");
  const [studentSearch, setStudentSearch] = useState("");
  const [dmcExamId, setDmcExamId] = useState<string | null>(null);
  const [dmcStudentId, setDmcStudentId] = useState<string | null>(null);
  const [dmcData, setDmcData] = useState<DmcPayload | null>(null);
  const [dmcLoading, setDmcLoading] = useState(false);

  const section = system === "madrassa" ? gender : undefined;

  const loadExams = async () => {
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

  const loadReport = async (examId: string) => {
    setReportLoading(true);
    try {
      const data = await getExamReport({ system, examId });
      setReport(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load results");
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    if (examId) {
      loadReport(examId);
    } else {
      setReport(null);
    }
  };

  const handleViewDmc = async (studentId: string) => {
    if (!selectedExamId) return;
    setDmcExamId(selectedExamId);
    setDmcStudentId(studentId);
    setDmcData(null);
  };

  useEffect(() => {
    if (!dmcExamId || !dmcStudentId) return;
    let cancelled = false;
    setDmcLoading(true);
    getDmc(dmcExamId, dmcStudentId)
      .then((data) => {
        if (!cancelled) setDmcData(data);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Could not load result card");
      })
      .finally(() => {
        if (!cancelled) setDmcLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dmcExamId, dmcStudentId]);

  const publishedExams = useMemo(
    () => exams.filter((e) => e.status === "published"),
    [exams],
  );

  const filteredRows = useMemo(() => {
    if (!report) return [];
    if (!studentSearch.trim()) return report.rows;
    const query = studentSearch.trim().toLowerCase();
    return report.rows.filter(
      (row) =>
        row.studentName.toLowerCase().includes(query) ||
        row.studentNameUrdu.includes(query) ||
        row.rollNo.toLowerCase().includes(query) ||
        row.admissionNo.toLowerCase().includes(query),
    );
  }, [report, studentSearch]);

  const classSummary = useMemo(() => {
    if (!report) return [];
    const map = new Map<string, { label: string; total: number; pass: number; fail: number; avg: number; students: typeof report.rows }>();
    for (const row of report.rows) {
      const label = row.groupLabel || (lang === "ur" ? "نامعلوم" : "Unknown");
      const entry = map.get(label) || { label, total: 0, pass: 0, fail: 0, avg: 0, students: [] };
      entry.total += 1;
      if (row.status === "pass") entry.pass += 1;
      else entry.fail += 1;
      entry.avg += row.percentageTimes100;
      entry.students.push(row);
      map.set(label, entry);
    }
    return Array.from(map.values())
      .map((entry) => ({ ...entry, avg: Math.round(entry.avg / entry.total) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [report, lang]);

  const statusTone: Record<string, string> = {
    pass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
    fail: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {lang === "ur" ? (system === "madrassa" ? "نتائج — مدرسہ" : "نتائج — اسکول") : (system === "madrassa" ? "Results — Madrassa" : "Results — School")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {lang === "ur" ? "امتحانی نتائج اور رتبے" : "Exam results, ranks, and class-wise performance"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadExams} className="gap-1.5">
          {lang === "ur" ? "تازہ کاری" : "Refresh"}
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">
              {lang === "ur" ? "امتحان منتخب کریں" : "Select Exam"}
            </Label>
            <Select value={selectedExamId} onValueChange={handleExamChange}>
              <SelectTrigger>
                <SelectValue placeholder={lang === "ur" ? "امتحان چُنں" : "Choose exam"} />
              </SelectTrigger>
              <SelectContent>
                {publishedExams.length === 0 ? (
                  <SelectItem value="" disabled>
                    {lang === "ur" ? "کوئی امتحان نہیں ملا" : "No published exams"}
                  </SelectItem>
                ) : (
                  publishedExams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">
              {lang === "ur" ? "طالب علم تلاش کریں" : "Search Student"}
            </Label>
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder={lang === "ur" ? "نام، رول نمبر، داخلہ نمبر" : "Name, roll no, admission no"}
              disabled={!selectedExamId || reportLoading}
            />
          </div>
        </div>
      </Card>

      {!selectedExamId ? (
        <Card className="p-8 text-center text-muted-foreground">
          {lang === "ur" ? "امتحان منتخب کریں" : "Select an exam to view results"}
        </Card>
      ) : reportLoading ? (
        <BookLoader text={lang === "ur" ? "لوڈ ہو رہا ہے..." : "Loading results..."} className="h-64" />
      ) : !report ? (
        <Card className="p-8 text-center text-muted-foreground">
          {lang === "ur" ? "کوئی نتائج نہیں ملا" : "No results found"}
        </Card>
      ) : (
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList className="mb-4">
            <TabsTrigger value="class" className="gap-2">
              <Users className="h-4 w-4" />
              {lang === "ur" ? "جماعت کے لحاظ سے" : "Class-wise"}
            </TabsTrigger>
            <TabsTrigger value="individual" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              {lang === "ur" ? "انفرادی" : "Individual"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="class" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">{lang === "ur" ? "کل طلباء" : "Total"}</p>
                <p className="text-xl font-bold">{report.summary.total}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">{lang === "ur" ? "پاس" : "Pass"}</p>
                <p className="text-xl font-bold text-emerald-600">{report.summary.pass}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">{lang === "ur" ? "فیل" : "Fail"}</p>
                <p className="text-xl font-bold text-destructive">{report.summary.fail}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">{lang === "ur" ? "پاس شرح" : "Pass Rate"}</p>
                <p className="text-xl font-bold">{report.summary.passRate}%</p>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classSummary.map((cls) => (
                <Card key={cls.label} className="p-4">
                  <div className="mb-3">
                    <h4 className="font-semibold">{cls.label}</h4>
                    <p className="text-xs text-muted-foreground">
                      {lang === "ur" ? `${cls.total} طلباء` : `${cls.total} students`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{lang === "ur" ? "پاس" : "Pass"}</span>
                      <span className="font-mono text-emerald-600">{cls.pass}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{lang === "ur" ? "فیل" : "Fail"}</span>
                      <span className="font-mono text-destructive">{cls.fail}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{lang === "ur" ? "اوسط" : "Average"}</span>
                      <span className="font-mono">{cls.avg}%</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden">
              <div className="p-4">
                <h3 className="font-semibold">
                  {lang === "ur" ? "رتبہ جات" : "Rankings"}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="p-3 w-16">{lang === "ur" ? "رتبہ" : "Rank"}</th>
                      <th className="p-3">{lang === "ur" ? "طالب علم" : "Student"}</th>
                      <th className="p-3">{lang === "ur" ? "جماعت" : "Class"}</th>
                      <th className="p-3 text-end">{lang === "ur" ? "نمارک" : "Marks"}</th>
                      <th className="p-3 text-end">{lang === "ur" ? "فیصد" : "Percentage"}</th>
                      <th className="p-3 text-end">{lang === "ur" ? "گریڈ" : "Grade"}</th>
                      <th className="p-3 text-end">{lang === "ur" ? "حالت" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          {lang === "ur" ? "کوئی نتائج نہیں ملا" : "No results found"}
                        </td>
                      </tr>
                    ) : (
                      filteredRows
                        .sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999))
                        .map((row) => (
                          <tr key={`${row.examId}:${row.studentId}`} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-mono font-semibold">{row.position ?? "-"}</td>
                            <td className="p-3">
                              <p className="font-medium">{row.studentName}</p>
                              <p className="font-urdu text-xs text-muted-foreground">{row.studentNameUrdu}</p>
                            </td>
                            <td className="p-3">{row.groupLabel}</td>
                            <td className="p-3 text-end font-mono">{row.obtainedMarks}/{row.totalMarks}</td>
                            <td className="p-3 text-end font-mono">{row.percentage.toFixed(2)}%</td>
                            <td className="p-3 text-end">
                              <Badge variant="outline" className="text-xs">
                                {row.grade}
                              </Badge>
                            </td>
                            <td className="p-3 text-end">
                              <Badge variant="outline" className={cn("capitalize text-xs", statusTone[row.status])}>
                                {row.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-3">
                {lang === "ur" ? "رکن منتخب کر کے انفرادی نتیجہ دیکھیں" : "Select a student to view individual result"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.rows.length === 0 ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    {lang === "ur" ? "کوئی طالب علم نہیں ملا" : "No students found"}
                  </p>
                ) : (
                  report.rows.map((row) => (
                    <Card key={`${row.examId}:${row.studentId}`} className="p-4 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{row.studentName}</p>
                          <p className="font-urdu text-sm text-muted-foreground">{row.studentNameUrdu}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lang === "ur" ? "رول نمبر" : "Roll"}: {row.rollNo} · {lang === "ur" ? "داخلہ نمبر" : "Admission"}: {row.admissionNo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lang === "ur" ? "جماعت" : "Class"}: {row.groupLabel}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-lg font-bold font-mono">{row.percentage.toFixed(2)}%</p>
                          <Badge variant="outline" className={cn("text-xs", statusTone[row.status])}>
                            {row.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lang === "ur" ? "رتبہ" : "Rank"}: {row.position ?? "-"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDmc(row.studentId)}>
                          {lang === "ur" ? "نتیجہ کارڈ" : "Result Card"}
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <ResponsiveDialog
        open={!!dmcExamId && !!dmcStudentId}
        onOpenChange={(open) => {
          if (!open) {
            setDmcExamId(null);
            setDmcStudentId(null);
            setDmcData(null);
          }
        }}
        title={lang === "ur" ? "نتیجہ کارڈ" : "Result Card"}
        description={lang === "ur" ? "امتحانی نتیجہ کارڈ" : "Exam result card"}
        className="max-w-3xl"
      >
        {dmcLoading ? (
          <BookLoader text={lang === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."} className="h-48" />
        ) : dmcData ? (
          <DmcView data={dmcData} />
        ) : (
          <p className="text-sm text-muted-foreground">{lang === "ur" ? "ڈیٹا موجود نہیں" : "No data available"}</p>
        )}
      </ResponsiveDialog>
    </div>
  );
}
