import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { BookOpen, CalendarDays, ChevronRight, GraduationCap, LineChart, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { createExamSession, listExamSessions } from "@/components/exams/exam-api";
import type { ExamSession, ExamSystem } from "@/components/exams/exam-types";
import { useLanguage } from "@/components/language-context";
import { useSystem } from "@/components/system-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookLoader } from "@/components/shared/book-loader";
import { cn } from "@/lib/utils";
import { ExamResults } from "@/components/exams/exam-results";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";

type Tab = "exams" | "seating" | "results";

type ExamMeta = {
  exam: ExamSession;
  dateStatus: "upcoming" | "started" | "passed";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nameUrdu: "",
    type: "general",
    startDate: "",
    endDate: "",
    academicYear: "",
  });

  const section = system === "madrassa" ? gender : undefined;

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
        return { exam, dateStatus };
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

  const resetForm = () => {
    setForm({ name: "", nameUrdu: "", type: "general", startDate: "", endDate: "", academicYear: "" });
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.nameUrdu.trim() || !form.startDate || !form.endDate) {
      toast.error(lang === "ur" ? "نام اور تاریخیں درکار ہیں" : "Name and dates are required");
      return;
    }

    setCreating(true);
    try {
      await createExamSession({
        system,
        type: form.type,
        name: form.name.trim(),
        nameUrdu: form.nameUrdu.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        academicYear: form.academicYear.trim() || undefined,
        subjectIds: [],
      });
      toast.success(lang === "ur" ? "امتحان بن گیا" : "Exam created");
      resetForm();
      setCreateOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create exam");
    } finally {
      setCreating(false);
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

  const tabTitle = tab === "exams" ? (lang === "ur" ? "امتحانات" : "Exams") : tab === "seating" ? (lang === "ur" ? "نشست بندی" : "Seating") : (lang === "ur" ? "نتائج" : "Results");
  const tabSubtitle = tab === "exams" ? (lang === "ur" ? "امتحانات کا نظم و انتظام" : "Manage exams") : tab === "seating" ? (lang === "ur" ? "نشست بندی کا انتظام" : "Manage seating") : (lang === "ur" ? "امتحانی نتائج اور رتبے" : "Results, ranks, and class-wise performance");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {tab === "results" ? (lang === "ur" ? (system === "madrassa" ? "نتائج — مدرسہ" : "نتائج — اسکول") : (system === "madrassa" ? "Results — Madrassa" : "Results — School")) : (lang === "ur" ? (system === "madrassa" ? "امتحانات — مدرسہ" : "امتحانات — اسکول") : (system === "madrassa" ? "Exams — Madrassa" : "Exams — School"))}
          </h2>
          <p className="text-xs text-muted-foreground">{tabSubtitle}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="exams" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {lang === "ur" ? "امتحانات" : "Exams"}
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <LineChart className="h-4 w-4" />
            {lang === "ur" ? "نتائج" : "Results"}
          </TabsTrigger>
          <TabsTrigger value="seating" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            {lang === "ur" ? "نشست بندی" : "Seating"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {lang === "ur" ? "نیا امتحان" : "New Exam"}
            </Button>
          </div>
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
                        <Link to={system === "school" ? "/school/exams/$id" : "/madrassa/exams/$id"} params={{ id: exam.id }}>
                          {lang === "ur" ? "تفصیل" : "Detail"}
                        </Link>
                      </Button>
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

        <TabsContent value="results" className="space-y-4">
          <ExamResults system={system} />
        </TabsContent>
      </Tabs>

      <ResponsiveDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
        title={lang === "ur" ? "نیا امتحان" : "New Exam"}
        description={lang === "ur" ? "امتحان کی تفصیلات داخل کریں" : "Enter exam details"}
        icon={Plus}
        className="max-w-lg"
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Label className="text-xs text-muted-foreground">{lang === "ur" ? "نام" : "Name"}</Label>
            <Input dir="ltr" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={lang === "ur" ? "امتحان کا نام" : "Exam name"} />
            <Label className="text-xs text-muted-foreground">{lang === "ur" ? "اردو نام" : "Urdu Name"}</Label>
            <Input dir="rtl" lang="ur" value={form.nameUrdu} onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })} placeholder={lang === "ur" ? "امتحان کا اردو نام" : "Exam Urdu name"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{lang === "ur" ? "شروعات کی تاریخ" : "Start Date"}</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{lang === "ur" ? "اختتام کی تاریخ" : "End Date"}</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">{lang === "ur" ? "تعلیمی سال" : "Academic Year"}</Label>
            <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder={lang === "ur" ? "2025" : "2025"} />
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
            {lang === "ur" ? "منسوخ" : "Cancel"}
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (lang === "ur" ? "بند ہو رہا ہے..." : "Creating...") : (lang === "ur" ? "شامل کریں" : "Create")}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
