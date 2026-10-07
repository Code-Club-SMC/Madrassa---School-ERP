import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  History,
  IdCard,
  MapPin,
  Phone,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users2,
  Wallet,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/components/language-context";
import { formatDate, formatNumber, formatPKR } from "@/lib/format";
import type { StudentLifecycleArchive } from "@/lib/server/students/lifecycle-service";

type SearchParams = {
  studentId?: string;
};

export const Route = createFileRoute("/_authenticated/settings/student-lifecycle")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    studentId: typeof search.studentId === "string" ? search.studentId : undefined,
  }),
  component: StudentLifecyclePage,
});

type SearchStudentItem = {
  id: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  gender: string;
  status: string;
  rollNo: string;
  admissionNo: string;
  institutionName: string;
  institutionNameUrdu: string;
  programSystem: string;
  schoolClassName: string | null;
  schoolClassNameUrdu: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  startedAt: string;
  endedAt: string | null;
};

function StudentLifecyclePage() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const searchParams = useSearch({ from: "/_authenticated/settings/student-lifecycle" });

  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState<"all" | "school" | "madrassa">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [studentList, setStudentList] = useState<SearchStudentItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    searchParams.studentId ?? null,
  );
  const [archive, setArchive] = useState<StudentLifecycleArchive | null>(null);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "timeline" | "exams" | "attendance" | "finance" | "family" | "events"
  >("timeline");

  // Status Change Dialog state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("graduated");
  const [statusReason, setStatusReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Print Dossier modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Load student list
  const fetchStudents = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (systemFilter !== "all") params.set("system", systemFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "40");

      const res = await fetch(`/api/admin/student-lifecycle?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load students");
      const data = await res.json();
      setStudentList(data.students ?? []);

      // If no student selected yet and we have results, auto-select the first one
      if (!selectedStudentId && data.students?.length > 0 && !searchParams.studentId) {
        setSelectedStudentId(data.students[0].id);
      }
    } catch {
      setStudentList([]);
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, systemFilter, statusFilter, selectedStudentId, searchParams.studentId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Load complete student life archive when student is selected
  const fetchArchive = useCallback(async (id: string) => {
    setLoadingArchive(true);
    setArchiveError(null);
    try {
      const res = await fetch(`/api/admin/student-lifecycle/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load student life record");
      }
      const data = await res.json();
      setArchive(data);
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : "Error loading data");
      setArchive(null);
    } finally {
      setLoadingArchive(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      void fetchArchive(selectedStudentId);
    }
  }, [selectedStudentId, fetchArchive]);

  // Update status handler
  const handleUpdateStatus = async () => {
    if (!archive?.student.id) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/students/${archive.student.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update status");
      }
      setStatusModalOpen(false);
      setStatusReason("");
      void fetchArchive(archive.student.id);
      void fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const student = archive?.student;
  const lifecycle = archive?.lifecycle;

  const initials = useMemo(() => {
    if (!student) return "";
    return student.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }, [student]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isUrdu ? "مکمل تعلیمی زندگی کا ریکارڈ و سوانح" : "Student Educational Life Archive"}
        titleUrdu="سوانحِ تعلیمی و جامع تعلیمی ریکارڈ"
        description={
          isUrdu
            ? "طالب علم کے داخلے کے آغاز سے اختتام تک کا مکمل تعلیمی سفر: کلاسز کی ترتیب، امتحانی اسناد، حاضری، فیس کھاتہ اور جامع ڈوزیئر۔"
            : "Super Admin 360° student educational lifecycle record: start to end tenure, academic progressions, exam transcripts, attendance history, fees ledger, and official printable dossier."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {archive && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPrintModalOpen(true)}
                >
                  <Printer className="h-4 w-4" />
                  {isUrdu ? "پرنٹ مکمل ڈوزیئر" : "Print Official Dossier"}
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setNewStatus(student?.status ?? "graduated");
                    setStatusModalOpen(true);
                  }}
                >
                  <Award className="h-4 w-4" />
                  {isUrdu ? "کیفیت / فراغت کا اندراج" : "Update Status / Exit"}
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-1.5">
                  <Link to="/students/$id" params={{ id: archive.student.id }}>
                    <ExternalLink className="h-4 w-4" />
                    {isUrdu ? "طالب علم پروفائل" : "View Profile"}
                  </Link>
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Top Filter and Quick Student Picker */}
      <Card className="p-4 bg-card/60 backdrop-blur border-border/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? "نام، رول نمبر، داخلہ نمبر، شناختی کارڈ تلاش کریں..." : "Search name, roll no, admission no..."}
              className="ps-9 h-9 text-xs"
            />
          </div>

          <Select
            value={systemFilter}
            onValueChange={(val) => setSystemFilter(val as typeof systemFilter)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={isUrdu ? "نظام منتخب کریں" : "Filter System"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isUrdu ? "تمام شعبہ جات (مدرسہ و اسکول)" : "All Systems (Madrassa & School)"}</SelectItem>
              <SelectItem value="madrassa">{isUrdu ? "جامعہ / مدرسہ" : "Madrassa Only"}</SelectItem>
              <SelectItem value="school">{isUrdu ? "اسکول" : "School Only"}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={isUrdu ? "کیفیت منتخب کریں" : "Filter Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isUrdu ? "تمام کیفیت (حاضر و فارغ)" : "All Statuses"}</SelectItem>
              <SelectItem value="active">{isUrdu ? "حاضر / زیرِ تعلیم (Active)" : "Active (Currently Enrolled)"}</SelectItem>
              <SelectItem value="graduated">{isUrdu ? "فارغ التحصیل (Graduated)" : "Graduated"}</SelectItem>
              <SelectItem value="transferred">{isUrdu ? "منتقل شدہ (Transferred)" : "Transferred"}</SelectItem>
              <SelectItem value="dropout">{isUrdu ? "ترک کردہ (Dropout)" : "Dropout"}</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-xs text-muted-foreground flex items-center justify-between sm:justify-end gap-2 px-1">
            <span>
              {loadingList ? (isUrdu ? "تلاش جاری ہے..." : "Searching...") : `${studentList.length} ${isUrdu ? "طلبہ دستیاب" : "students found"}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setSearchQuery("");
                setSystemFilter("all");
                setStatusFilter("all");
              }}
            >
              <RotateCcw className="h-3 w-3 me-1" />
              {isUrdu ? "صاف کریں" : "Reset"}
            </Button>
          </div>
        </div>

        {/* Student Quick Selector Chips */}
        {studentList.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-thin">
            {studentList.map((s) => {
              const isSelected = selectedStudentId === s.id;
              const classLabel = isUrdu
                ? (s.madrassaSubcategoryNameUrdu ?? s.schoolClassNameUrdu ?? "—")
                : (s.schoolClassName ?? s.madrassaSubcategoryName ?? "—");

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  type="button"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-start shrink-0 text-xs transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background/80 hover:bg-accent border-border text-foreground"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {s.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium leading-none truncate max-w-[130px]">
                      {isUrdu ? s.nameUrdu : s.name}
                    </p>
                    <p
                      className={`text-[10px] leading-tight truncate max-w-[130px] mt-0.5 ${
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {s.rollNo} · {classLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Loading or Error states */}
      {loadingArchive && (
        <Card className="p-12 text-center text-muted-foreground">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="font-medium">{isUrdu ? "طالب علم کا مکمل تعلیمی ریکارڈ لوڈ ہو رہا ہے..." : "Compiling entire student educational life archive..."}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isUrdu ? "تاریخی داخلے، امتحانی اسناد، حاضری اور مالیات کا تجزیہ کیا جا رہا ہے" : "Synthesizing enrollment history, transcripts, attendance, and finance ledger."}
          </p>
        </Card>
      )}

      {archiveError && !loadingArchive && (
        <Card className="p-8 text-center text-destructive border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{archiveError}</p>
        </Card>
      )}

      {/* Main Student Life Archive Content */}
      {archive && !loadingArchive && (
        <div className="space-y-6">
          {/* Identity & Tenure Banner */}
          <Card className="p-6 relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.03]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Student Identity */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-heading font-bold text-2xl shrink-0 shadow-inner">
                  {initials}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-urdu text-2xl font-bold leading-tight text-foreground">
                      {student?.nameUrdu}
                    </h2>
                    <span className="text-sm text-muted-foreground font-sans">
                      ({student?.name})
                    </span>
                    <StatusBadge status={student?.status ?? "active"} />
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <strong className="text-foreground">{isUrdu ? "ولدیت:" : "Father:"}</strong>{" "}
                      {isUrdu ? (student?.fatherNameUrdu || student?.fatherName) : student?.fatherName}
                    </span>
                    <span>·</span>
                    <span>
                      <strong className="text-foreground">{isUrdu ? "رول نمبر:" : "Roll No:"}</strong>{" "}
                      <span className="font-mono">{lifecycle?.currentEnrollment?.rollNo ?? "—"}</span>
                    </span>
                    <span>·</span>
                    <span>
                      <strong className="text-foreground">{isUrdu ? "داخلہ نمبر:" : "Adm No:"}</strong>{" "}
                      <span className="font-mono">{lifecycle?.currentEnrollment?.admissionNo ?? "—"}</span>
                    </span>
                    {student?.cnicBForm && (
                      <>
                        <span>·</span>
                        <span>
                          <strong className="text-foreground">B-Form:</strong>{" "}
                          <span className="font-mono">{student.cnicBForm}</span>
                        </span>
                      </>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <Badge variant="outline" className="gap-1 bg-background">
                      <Building2 className="h-3 w-3 text-primary" />
                      {isUrdu
                        ? lifecycle?.currentEnrollment?.institutionNameUrdu
                        : lifecycle?.currentEnrollment?.institutionName}
                    </Badge>
                    <Badge variant="secondary" className="font-urdu">
                      {isUrdu
                        ? (lifecycle?.currentEnrollment?.madrassaSubcategoryNameUrdu ?? lifecycle?.currentEnrollment?.schoolClassNameUrdu ?? "—")
                        : (lifecycle?.currentEnrollment?.schoolClassName ?? lifecycle?.currentEnrollment?.madrassaSubcategoryName ?? "—")}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {lifecycle?.currentEnrollment?.academicYearName ?? "—"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Lifecycle Duration Highlight Box */}
              <div className="bg-background/80 border border-primary/20 rounded-xl p-4 shadow-sm min-w-[280px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/60">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {isUrdu ? "کل مدتِ تعلیم (عمرِ تعلیمی)" : "Entire Educational Tenure"}
                  </span>
                  <Badge
                    variant={lifecycle?.isOngoing ? "default" : "secondary"}
                    className="text-[10px] uppercase font-bold"
                  >
                    {lifecycle?.isOngoing
                      ? (isUrdu ? "تاحال زیرِ تعلیم" : "Ongoing / Active")
                      : (isUrdu ? "مکمل / منقطع" : "Completed / Ended")}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">{isUrdu ? "تاریخ آغاز / داخلہ:" : "Start Date:"}</span>
                    <span className="font-medium font-mono">
                      {lifecycle?.startDate ? formatDate(lifecycle.startDate) : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">{isUrdu ? "تاریخ اختتام / فراغت:" : "End / Exit Date:"}</span>
                    <span className="font-medium font-mono">
                      {lifecycle?.endDate
                        ? formatDate(lifecycle.endDate)
                        : (isUrdu ? "جاری ہے (Active)" : "Present (Ongoing)")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex justify-between items-baseline">
                    <span className="font-semibold text-foreground">{isUrdu ? "کل وقت گزرا:" : "Total Time Spent:"}</span>
                    <span className="font-bold text-primary text-sm font-urdu">
                      {isUrdu ? lifecycle?.duration.formattedUr : lifecycle?.duration.formattedEn}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-end font-mono">
                    ({formatNumber(lifecycle?.duration.totalDays ?? 0)} {isUrdu ? "دن" : "days"})
                  </p>
                </div>
              </div>
            </div>

            {/* Quick 4 Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60 text-xs">
              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  {isUrdu ? "امتحانی کارکردگی" : "Academic Average"}
                </span>
                <p className="text-base font-bold font-mono">
                  {archive.exams.summary.avgPercentage}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {archive.exams.summary.passedExams}/{archive.exams.summary.totalExams} {isUrdu ? "امتحانات پاس" : "exams passed"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1">
                  <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {isUrdu ? "حاضری تناسب" : "Lifetime Attendance"}
                </span>
                <p className="text-base font-bold font-mono text-emerald-600">
                  {archive.attendance.summary.rate}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {archive.attendance.summary.presentDays}/{archive.attendance.summary.totalDays} {isUrdu ? "دن حاضر" : "days present"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5 text-blue-600" />
                  {isUrdu ? "فیس کھاتہ" : "Financial Clearance"}
                </span>
                <p
                  className={`text-base font-bold font-mono ${
                    archive.finance.summary.balancePaisa === 0
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {archive.finance.summary.balancePaisa === 0
                    ? (isUrdu ? "تمام واجبات ادا" : "Cleared (0 Dues)")
                    : formatPKR(archive.finance.summary.balancePaisa / 100)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isUrdu ? "کل ادائیگی:" : "Total Paid:"}{" "}
                  {formatPKR(archive.finance.summary.totalPaidPaisa / 100)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1">
                  <History className="h-3.5 w-3.5 text-purple-600" />
                  {isUrdu ? "کل کلاسز / مدارج" : "Class Enrollments"}
                </span>
                <p className="text-base font-bold font-mono text-purple-600">
                  {archive.enrollments.length} {isUrdu ? "مدارج" : "stages"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {archive.events.length} {isUrdu ? "تاریخی واقعات" : "logged events"}
                </p>
              </div>
            </div>
          </Card>

          {/* Deep Lifecycle Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as typeof activeTab)}
            className="space-y-4"
          >
            <TabsList className="bg-muted/80 p-1 flex flex-wrap h-auto gap-1">
              <TabsTrigger value="timeline" className="gap-1.5 text-xs">
                <History className="h-3.5 w-3.5" />
                {isUrdu ? "سلسلہِ تعلیم (Enrollment History)" : "Educational Journey"}
              </TabsTrigger>
              <TabsTrigger value="exams" className="gap-1.5 text-xs">
                <GraduationCap className="h-3.5 w-3.5" />
                {isUrdu ? "امتحانی اسناد (Exam Transcripts)" : "Examination Records"}
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-1.5 text-xs">
                <CalendarCheck className="h-3.5 w-3.5" />
                {isUrdu ? "حاضری ریکارڈ (Attendance Life)" : "Attendance Record"}
              </TabsTrigger>
              <TabsTrigger value="finance" className="gap-1.5 text-xs">
                <Receipt className="h-3.5 w-3.5" />
                {isUrdu ? "فیس و مالیات (Fee Ledger)" : "Fees & Financials"}
              </TabsTrigger>
              <TabsTrigger value="family" className="gap-1.5 text-xs">
                <Users2 className="h-3.5 w-3.5" />
                {isUrdu ? "سرپرست و بہن بھائی (Family)" : "Guardians & Siblings"}
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                {isUrdu ? "تاریخی واقعات (Audit Events)" : "Audit & Events"}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Educational Timeline & Progressions */}
            <TabsContent value="timeline" className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-base">
                      {isUrdu ? "طالب علم کا تاریخی سفرِ تعلیم" : "Chronological Academic Progression"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isUrdu
                        ? "سال بہ سال مختلف درجات اور کلاسز میں طالب علم کا مکمل داخلہ ریکارڈ اور مدت۔"
                        : "Detailed record of every academic year, institution, class/darja, and tenure."}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {archive.enrollments.length} {isUrdu ? "مدارج ریکارڈ شدہ" : "Progression Records"}
                  </Badge>
                </div>

                <div className="relative border-s-2 border-primary/20 ms-4 space-y-6 py-2">
                  {archive.enrollments.map((enr, idx) => {
                    const isLatest = idx === archive.enrollments.length - 1;
                    const durationEnr = calculateDuration(
                      new Date(enr.startedAt),
                      enr.endedAt ? new Date(enr.endedAt) : new Date(),
                    );

                    return (
                      <div key={enr.id} className="relative ps-6 group">
                        {/* Dot on the timeline */}
                        <div
                          className={`absolute -start-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-background transition-all ${
                            isLatest
                              ? "bg-primary ring-4 ring-primary/20"
                              : "bg-muted-foreground/60"
                          }`}
                        />

                        <Card className="p-4 hover:border-primary/40 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold font-urdu text-base text-foreground">
                                {isUrdu
                                  ? (enr.madrassaSubcategoryNameUrdu ?? enr.schoolClassNameUrdu ?? "—")
                                  : (enr.schoolClassName ?? enr.madrassaSubcategoryName ?? "—")}
                              </span>
                              <Badge variant="secondary" className="text-[11px] font-mono">
                                {enr.academicYearName ?? "—"}
                              </Badge>
                              <StatusBadge status={enr.status} />
                            </div>

                            <span className="text-xs text-muted-foreground font-mono">
                              {formatDate(enr.startedAt)} ➔{" "}
                              {enr.endedAt ? formatDate(enr.endedAt) : (isUrdu ? "تاحال (Active)" : "Present")}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground block text-[11px]">
                                {isUrdu ? "ادارہ:" : "Institution:"}
                              </span>
                              <span className="font-medium">
                                {isUrdu ? enr.institutionNameUrdu : enr.institutionName}
                              </span>
                            </div>

                            <div>
                              <span className="text-muted-foreground block text-[11px]">
                                {isUrdu ? "شعبہ / نظام:" : "Program & System:"}
                              </span>
                              <span className="font-medium capitalize">
                                {enr.programSystem} ({enr.institutionGender === "banat" ? "بنات" : "بنین"})
                              </span>
                            </div>

                            <div>
                              <span className="text-muted-foreground block text-[11px]">
                                {isUrdu ? "رول و داخلہ نمبر:" : "Roll & Adm No:"}
                              </span>
                              <span className="font-mono font-medium">
                                Roll: {enr.rollNo} · Adm: {enr.admissionNo}
                              </span>
                            </div>

                            <div>
                              <span className="text-muted-foreground block text-[11px]">
                                {isUrdu ? "مدتِ درسی:" : "Class Tenure:"}
                              </span>
                              <span className="font-urdu font-medium text-primary">
                                {isUrdu ? durationEnr.formattedUr : durationEnr.formattedEn}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 2: Examination Transcripts */}
            <TabsContent value="exams" className="space-y-4">
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-base">
                      {isUrdu ? "امتحانی نتائج و کارکردگی کا مکمل ریکارڈ" : "Lifetime Examination Performance & Transcripts"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isUrdu
                        ? "تمام ششماہی، سالانہ اور بورڈ کے امتحانات کے تفصیلی پرچے و حاصل کردہ نمبرات۔"
                        : "Term-by-term and annual examination result breakdown with subject-level marks."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {archive.exams.summary.passedExams}/{archive.exams.summary.totalExams} Passed
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {archive.exams.summary.avgPercentage}% Avg
                    </Badge>
                  </div>
                </div>

                {archive.exams.sessions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {isUrdu ? "اس طالب علم کے لیے کوئی شائع شدہ امتحانی نتائج دستیاب نہیں۔" : "No published examination results found for this student."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {archive.exams.sessions.map((session) => (
                      <Card key={session.id} className="overflow-hidden border-border/80">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/40 border-b border-border">
                          <div>
                            <span className="font-semibold font-urdu text-base me-2">
                              {session.examNameUrdu || session.examName}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({session.academicYear} · {session.examType})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge
                              variant={session.status === "pass" ? "default" : "destructive"}
                              className="font-mono uppercase"
                            >
                              {session.status} · Grade {session.grade}
                            </Badge>
                            <Badge variant="outline" className="font-mono">
                              {session.obtainedMarks}/{session.totalMarks} (
                              {(session.percentageTimes100 / 100).toFixed(1)}%)
                            </Badge>
                            {session.position && (
                              <Badge variant="secondary" className="gap-1">
                                <Award className="h-3 w-3 text-amber-500" />
                                {isUrdu ? `پوزیشن ${session.position}` : `Rank #${session.position}`}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {session.subjects.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow className="text-xs bg-muted/20">
                                <TableHead>{isUrdu ? "مضمون / کتاب" : "Subject"}</TableHead>
                                <TableHead className="text-end">{isUrdu ? "کل نمبر" : "Total"}</TableHead>
                                <TableHead className="text-end">{isUrdu ? "کامیابی نمبر" : "Passing"}</TableHead>
                                <TableHead className="text-end">{isUrdu ? "حاصل کردہ نمبر" : "Obtained"}</TableHead>
                                <TableHead className="text-center">{isUrdu ? "گریڈ" : "Grade"}</TableHead>
                                <TableHead className="text-end">{isUrdu ? "نتیجہ" : "Result"}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {session.subjects.map((sub) => (
                                <TableRow key={sub.code} className="text-xs">
                                  <TableCell className="font-medium">
                                    <span className="font-urdu me-2 text-sm">{sub.nameUrdu}</span>
                                    <span className="text-muted-foreground text-[11px]">({sub.name})</span>
                                  </TableCell>
                                  <TableCell className="text-end font-mono">{sub.totalMarks}</TableCell>
                                  <TableCell className="text-end font-mono text-muted-foreground">
                                    {sub.passingMarks}
                                  </TableCell>
                                  <TableCell className="text-end font-mono font-bold">
                                    {sub.obtainedMarks ?? 0}
                                  </TableCell>
                                  <TableCell className="text-center font-mono">{sub.grade}</TableCell>
                                  <TableCell className="text-end">
                                    {sub.passed ? (
                                      <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                        {isUrdu ? "کامیاب" : "Pass"}
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        {isUrdu ? "ناکام" : "Fail"}
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* TAB 3: Attendance Life Record */}
            <TabsContent value="attendance" className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-base">
                      {isUrdu ? "طالب علم کی کل حاضری کا ریکارڈ" : "Lifetime Attendance & Regularity Log"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isUrdu
                        ? "تمام تعلیمی سالوں میں کل تعلیمی ایام، حاضری، غیر حاضری اور رخصتوں کی تفصیل۔"
                        : "Summary and breakdown of enrolled school days, absences, and leaves across all years."}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-emerald-600 border-emerald-300">
                    {archive.attendance.summary.rate}% Attendance
                  </Badge>
                </div>

                {/* Yearly Attendance Breakdown Table */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {isUrdu ? "سال بہ سال حاضری کا تناسب:" : "Year-by-Year Attendance Breakdown:"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {archive.attendance.byYear.map((yr) => (
                      <Card key={yr.year} className="p-3 bg-muted/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm">{yr.year}</span>
                          <Badge variant={yr.rate >= 90 ? "default" : "secondary"} className="font-mono text-xs">
                            {yr.rate}%
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground space-y-0.5 mt-2">
                          <div className="flex justify-between">
                            <span>{isUrdu ? "کل ایام:" : "Total Days:"}</span>
                            <span className="font-mono text-foreground">{yr.total}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600">
                            <span>{isUrdu ? "حاضر:" : "Present:"}</span>
                            <span className="font-mono">{yr.present}</span>
                          </div>
                          <div className="flex justify-between text-destructive">
                            <span>{isUrdu ? "غیر حاضر:" : "Absent:"}</span>
                            <span className="font-mono">{yr.absent}</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>{isUrdu ? "رخصت:" : "Leaves:"}</span>
                            <span className="font-mono">{yr.leave}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Recent 30 Attendance Days Log */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {isUrdu ? "حالیہ 30 تعلیمی ایام کا حاضری لاگ:" : "Recent 30 Tracked Days Log:"}
                  </h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs bg-muted/40 sticky top-0">
                          <TableHead>{isUrdu ? "تاریخ" : "Date"}</TableHead>
                          <TableHead>{isUrdu ? "حاضری کیفیت" : "Status"}</TableHead>
                          <TableHead>{isUrdu ? "وضاحت / نوٹ" : "Notes"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archive.attendance.recent.map((att) => (
                          <TableRow key={att.id} className="text-xs">
                            <TableCell className="font-mono">{att.attendanceDate}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  att.status === "present"
                                    ? "outline"
                                    : att.status === "absent"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="capitalize text-[11px]"
                              >
                                {att.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{att.notes || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 4: Fees & Financials */}
            <TabsContent value="finance" className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-base">
                      {isUrdu ? "مکمل فیس کھاتہ و مالیاتی تاریخ" : "Student Lifetime Fee Ledger & Financial Clearance"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isUrdu
                        ? "شعبہ مالیات کا مکمل کھاتہ: کل چالان، وصولیاں، رعایات اور واجبات۔"
                        : "Full audit of fee invoices, payment receipts, concessions, and outstanding balance."}
                    </p>
                  </div>
                  <Badge
                    variant={archive.finance.summary.balancePaisa === 0 ? "outline" : "destructive"}
                    className="font-mono text-xs"
                  >
                    {archive.finance.summary.balancePaisa === 0
                      ? (isUrdu ? "کلیئرنس مکمل (0 واجبات)" : "Clearance: 0 PKR")
                      : `Due: ${formatPKR(archive.finance.summary.balancePaisa / 100)}`}
                  </Badge>
                </div>

                {/* 4 Financial Summary Counters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-muted/40 border text-xs">
                    <span className="text-muted-foreground block text-[11px]">
                      {isUrdu ? "کل جاری شدہ فیسیں:" : "Total Invoiced Fees:"}
                    </span>
                    <p className="font-bold text-sm font-mono mt-0.5">
                      {formatPKR(archive.finance.summary.totalBilledPaisa / 100)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">
                      {isUrdu ? "کل موصول شدہ فیس:" : "Total Paid Amount:"}
                    </span>
                    <p className="font-bold text-sm font-mono mt-0.5 text-emerald-700 dark:text-emerald-300">
                      {formatPKR(archive.finance.summary.totalPaidPaisa / 100)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                    <span className="text-purple-700 dark:text-purple-400 block text-[11px]">
                      {isUrdu ? "کل رعایات / معافی:" : "Total Concessions / Waived:"}
                    </span>
                    <p className="font-bold text-sm font-mono mt-0.5 text-purple-700 dark:text-purple-300">
                      {formatPKR(archive.finance.summary.totalWaivedPaisa / 100)}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-lg border text-xs ${
                      archive.finance.summary.balancePaisa === 0
                        ? "bg-muted/40"
                        : "bg-destructive/10 border-destructive/20"
                    }`}
                  >
                    <span
                      className={`block text-[11px] ${
                        archive.finance.summary.balancePaisa === 0
                          ? "text-muted-foreground"
                          : "text-destructive"
                      }`}
                    >
                      {isUrdu ? "باقی واجب الادا:" : "Current Outstanding Dues:"}
                    </span>
                    <p
                      className={`font-bold text-sm font-mono mt-0.5 ${
                        archive.finance.summary.balancePaisa === 0
                          ? "text-foreground"
                          : "text-destructive"
                      }`}
                    >
                      {formatPKR(archive.finance.summary.balancePaisa / 100)}
                    </p>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      {isUrdu ? "وصولی کی رسیدیں (Payment Receipts):" : "Official Payment Receipts Log:"}
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="text-xs bg-muted/40">
                            <TableHead>{isUrdu ? "رسید نمبر" : "Receipt No"}</TableHead>
                            <TableHead>{isUrdu ? "تاریخ" : "Date"}</TableHead>
                            <TableHead>{isUrdu ? "طریقہ" : "Method"}</TableHead>
                            <TableHead className="text-end">{isUrdu ? "رقم" : "Amount"}</TableHead>
                            <TableHead className="text-end">{isUrdu ? "کیفیت" : "Status"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {archive.finance.payments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">
                                {isUrdu ? "کوئی رسید موجود نہیں" : "No payment records found"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            archive.finance.payments.map((pmt) => (
                              <TableRow key={pmt.id} className="text-xs">
                                <TableCell className="font-mono font-medium">{pmt.receiptNo}</TableCell>
                                <TableCell className="font-mono text-muted-foreground">
                                  {formatDate(pmt.paymentDate)}
                                </TableCell>
                                <TableCell className="capitalize">{pmt.method}</TableCell>
                                <TableCell className="text-end font-mono font-bold">
                                  {formatPKR(pmt.amountPaisa / 100)}
                                </TableCell>
                                <TableCell className="text-end">
                                  <Badge variant="outline" className="text-emerald-600 text-[10px]">
                                    {pmt.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 5: Family, Guardians & Siblings */}
            <TabsContent value="family" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guardians */}
                <Card className="p-5">
                  <h3 className="font-semibold text-base mb-3 pb-2 border-b border-border flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {isUrdu ? "سرپرستان و ولی (Guardians)" : "Registered Guardians"}
                  </h3>

                  <div className="space-y-3">
                    {archive.guardians.map((g) => (
                      <Card key={g.guardianId} className="p-3 bg-muted/20">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-urdu font-semibold text-base text-foreground">
                              {g.nameUrdu || g.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {g.name} · <Badge variant="secondary" className="text-[10px]">{g.relation}</Badge>
                            </p>
                          </div>
                          {g.isPrimary && (
                            <Badge variant="default" className="text-[10px]">
                              {isUrdu ? "بنیادی ولی" : "Primary"}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                          {g.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <span className="font-mono text-foreground">{g.phone}</span>
                            </span>
                          )}
                          {g.cnic && (
                            <span className="flex items-center gap-1.5">
                              <IdCard className="h-3 w-3" />
                              <span className="font-mono text-foreground">{g.cnic}</span>
                            </span>
                          )}
                          {g.address && (
                            <span className="flex items-center gap-1.5 col-span-2">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{g.address}</span>
                            </span>
                          )}
                        </div>

                        {g.parentUserUsername && (
                          <div className="mt-3 pt-2 border-t border-border/40 text-[11px] flex items-center justify-between">
                            <span className="text-muted-foreground">{isUrdu ? "پورٹل لاگ ان:" : "Portal Login:"}</span>
                            <span className="font-mono text-primary font-medium">{g.parentUserUsername}</span>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* Siblings */}
                <Card className="p-5">
                  <h3 className="font-semibold text-base mb-3 pb-2 border-b border-border flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-primary" />
                    {isUrdu ? "بہن بھائی (Siblings in Institution)" : "Enrolled Siblings Network"}
                  </h3>

                  {archive.siblings.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      {isUrdu ? "کوئی منسلک بہن بھائی موجود نہیں۔" : "No linked siblings found in the system."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {archive.siblings.map((sib) => (
                        <Card key={sib.id} className="p-3 bg-muted/20 flex items-center justify-between">
                          <div>
                            <p className="font-urdu font-medium text-sm">
                              {sib.nameUrdu || sib.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              Roll: {sib.rollNo} · {sib.className}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {sib.relationship}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setSelectedStudentId(sib.id)}
                            >
                              {isUrdu ? "سوانح دیکھیں" : "View Life"}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* TAB 6: Audit Events Log */}
            <TabsContent value="events" className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold text-base mb-3 pb-2 border-b border-border flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isUrdu ? "تاریخی واقعات کا ریکارڈ (Institutional Milestones)" : "Audit Trail of Key Events"}
                </h3>

                {archive.events.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    {isUrdu ? "کوئی واقعات ریکارڈ نہیں ہوئے۔" : "No institutional events recorded."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {archive.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-lg border bg-muted/10 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {ev.type}
                            </Badge>
                            <span className="font-medium text-foreground">{ev.message}</span>
                          </div>
                          {ev.actorName && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {isUrdu ? "کارروائی کنندہ:" : "Recorded by:"} {ev.actorName}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                          {formatDate(ev.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* MODAL 1: Update Status / Graduation / Exit */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isUrdu ? "طالب علم کی تعلیمی کیفیت و فراغت کا اندراج" : "Update Student Lifecycle Status"}
            </DialogTitle>
            <DialogDescription>
              {isUrdu
                ? "طالب علم کو فارغ التحصیل (Graduated)، منتقل شدہ (Transferred)، یا ترک کردہ (Dropout) کے طور پر نشان زد کریں۔"
                : "Mark the student as graduated, transferred, dropout, or reactivate as active."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-medium block mb-1.5">{isUrdu ? "نئی کیفیت (Status):" : "New Status:"}</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="graduated">{isUrdu ? "فارغ التحصیل (Graduated / Sanad Holder)" : "Graduated (Alumnus)"}</SelectItem>
                  <SelectItem value="active">{isUrdu ? "حاضر / زیرِ تعلیم (Active Enrolled)" : "Active (Currently Enrolled)"}</SelectItem>
                  <SelectItem value="transferred">{isUrdu ? "منتقل شدہ (Transferred to other institution)" : "Transferred"}</SelectItem>
                  <SelectItem value="dropout">{isUrdu ? "ترک کردہ / خارج (Dropout / Left)" : "Dropout / Withdrawn"}</SelectItem>
                  <SelectItem value="inactive">{isUrdu ? "غیر فعال (Inactive)" : "Inactive"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-medium block mb-1.5">
                {isUrdu ? "سبب / سند و اخراج کے نوٹس (Reason / Remarks):" : "Reason / Certificate Remarks:"}
              </label>
              <Input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={isUrdu ? "مثال: تکمیل حفظ القرآن و اعطائے سند، یا اسکول منتقلی..." : "e.g., Completed Hifz-ul-Quran & issued Sanad #482..."}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              {isUrdu ? "منسوخ" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleUpdateStatus} disabled={updatingStatus}>
              {updatingStatus ? (isUrdu ? "محفوظ ہو رہا ہے..." : "Saving...") : (isUrdu ? "محفوظ کریں" : "Update Status")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Printable Official Educational Dossier */}
      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex justify-between items-center">
              <span>{isUrdu ? "سرکاری جامع تعلیمی ڈوزیئر و سندِ کارکردگی" : "Official Comprehensive Educational Dossier"}</span>
              <Button size="sm" onClick={() => window.print()} className="gap-1.5">
                <Printer className="h-4 w-4" />
                {isUrdu ? "پرنٹ کریں (Print)" : "Print Document"}
              </Button>
            </DialogTitle>
          </DialogHeader>

          {archive && (
            <div id="printable-dossier" className="p-6 bg-white text-black font-sans space-y-6 border rounded-lg print:border-none print:p-0">
              {/* Header */}
              <div className="text-center border-b-2 border-black pb-4 space-y-1">
                <p className="font-urdu text-3xl font-bold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                <h1 className="font-urdu text-2xl font-bold mt-1">
                  {lifecycle?.currentEnrollment?.institutionNameUrdu ?? "جامعہ و اسکول"}
                </h1>
                <p className="text-xs uppercase tracking-widest font-semibold text-gray-700">
                  {lifecycle?.currentEnrollment?.institutionName ?? "INSTITUTIONAL HEADQUARTERS"}
                </p>
                <p className="font-urdu text-lg font-bold text-gray-900 mt-2">
                  سوانحِ تعلیمی، جامع کارکردگی ریکارڈ و سندِ فراغت
                </p>
                <p className="text-xs font-serif uppercase tracking-wider text-gray-600">
                  COMPREHENSIVE STUDENT LIFETIME EDUCATIONAL DOSSIER & TRANSCRIPT
                </p>
              </div>

              {/* Bio Data Table */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-black p-3 bg-gray-50/50">
                <div>
                  <p className="font-urdu text-base font-bold">{student?.nameUrdu}</p>
                  <p className="text-gray-700 font-medium">{student?.name}</p>
                  <p className="mt-1">
                    <strong>ولدیت:</strong> {student?.fatherNameUrdu || student?.fatherName} ({student?.fatherName})
                  </p>
                  <p>
                    <strong>تاریخ پیدائش:</strong> {student?.dob ? formatDate(student.dob) : "—"} · <strong>جنس:</strong> {student?.gender}
                  </p>
                  {student?.cnicBForm && (
                    <p>
                      <strong>ب فارم / شناختی کارڈ:</strong> {student.cnicBForm}
                    </p>
                  )}
                </div>

                <div className="text-end space-y-1">
                  <p>
                    <strong>داخلہ نمبر (Adm No):</strong> {lifecycle?.currentEnrollment?.admissionNo}
                  </p>
                  <p>
                    <strong>رول نمبر (Roll No):</strong> {lifecycle?.currentEnrollment?.rollNo}
                  </p>
                  <p>
                    <strong>تاریخ داخلہ (Admission Date):</strong> {formatDate(lifecycle?.startDate ?? "")}
                  </p>
                  <p>
                    <strong>تاریخ فراغت / اختتام (Exit Date):</strong>{" "}
                    {lifecycle?.endDate ? formatDate(lifecycle.endDate) : "حاضر / جاری (Currently Enrolled)"}
                  </p>
                  <p className="font-bold text-black font-urdu text-sm mt-1">
                    کل مدتِ تعلیم: {lifecycle?.duration.formattedUr} ({lifecycle?.duration.formattedEn})
                  </p>
                </div>
              </div>

              {/* 1. Progression History */}
              <div>
                <h4 className="font-urdu text-base font-bold border-b border-black pb-1 mb-2">
                  اولاً: درجات و سلسلہِ تعلیمی کی تفصیل (Academic Stages & Tenures)
                </h4>
                <table className="w-full text-xs border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-1">#</th>
                      <th className="border border-black p-1">تعلیمی سال</th>
                      <th className="border border-black p-1">کلاس / درجہ</th>
                      <th className="border border-black p-1">تاریخ آغاز</th>
                      <th className="border border-black p-1">تاریخ اختتام</th>
                      <th className="border border-black p-1">کیفیت / نتیجہ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archive.enrollments.map((e, i) => (
                      <tr key={e.id} className="text-center border-b border-black">
                        <td className="border border-black p-1">{i + 1}</td>
                        <td className="border border-black p-1 font-mono">{e.academicYearName}</td>
                        <td className="border border-black p-1 font-urdu font-medium">
                          {e.madrassaSubcategoryNameUrdu ?? e.schoolClassNameUrdu}
                        </td>
                        <td className="border border-black p-1 font-mono">{formatDate(e.startedAt)}</td>
                        <td className="border border-black p-1 font-mono">
                          {e.endedAt ? formatDate(e.endedAt) : "تاحال (Present)"}
                        </td>
                        <td className="border border-black p-1 uppercase font-semibold">{e.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2. Examinations Transcript Table */}
              <div>
                <h4 className="font-urdu text-base font-bold border-b border-black pb-1 mb-2">
                  ثانیاً: امتحانی اسناد و حاصل کردہ نتائج (Examination Performance Summary)
                </h4>
                <table className="w-full text-xs border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-1">امتحان</th>
                      <th className="border border-black p-1">سال</th>
                      <th className="border border-black p-1">کل نمبر</th>
                      <th className="border border-black p-1">حاصل کردہ</th>
                      <th className="border border-black p-1">فیصد</th>
                      <th className="border border-black p-1">گریڈ</th>
                      <th className="border border-black p-1">نتیجہ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archive.exams.sessions.map((ex) => (
                      <tr key={ex.id} className="text-center border-b border-black">
                        <td className="border border-black p-1 font-urdu text-start font-medium ps-2">
                          {ex.examNameUrdu || ex.examName}
                        </td>
                        <td className="border border-black p-1 font-mono">{ex.academicYear}</td>
                        <td className="border border-black p-1 font-mono">{ex.totalMarks}</td>
                        <td className="border border-black p-1 font-mono font-bold">{ex.obtainedMarks}</td>
                        <td className="border border-black p-1 font-mono">
                          {(ex.percentageTimes100 / 100).toFixed(1)}%
                        </td>
                        <td className="border border-black p-1 font-mono font-bold">{ex.grade}</td>
                        <td className="border border-black p-1 uppercase font-bold">{ex.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 3. Conduct & Attendance Verification */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-black p-3">
                <div>
                  <p className="font-bold font-urdu text-sm mb-1">تصدیقِ اخلاق و حاضری:</p>
                  <p className="text-gray-800 leading-relaxed font-urdu text-xs">
                    مذکورہ طالب علم کا دورانِ تعلیم اخلاق و کردار شاندار رہا ہے۔ حاضری کا مجموعی تناسب{" "}
                    <strong>{archive.attendance.summary.rate}%</strong> رہا اور ادارہ اس کی کارکردگی کی تصدیق کرتا ہے۔
                  </p>
                </div>
                <div>
                  <p className="font-bold font-urdu text-sm mb-1">تصدیقِ مالیات و واجبات:</p>
                  <p className="text-gray-800 leading-relaxed font-urdu text-xs">
                    {archive.finance.summary.balancePaisa === 0 ? (
                      "طالب علم کے ذمہ شعبہ مالیات کے تمام تر واجبات و فیسیں مکمل طور پر ادا شدہ ہیں اور اس پر کوئی بقیہ رقم واجب الادا نہیں۔"
                    ) : (
                      `طالب علم کے ذمہ بقایا رقم ${formatPKR(archive.finance.summary.balancePaisa / 100)} درج ہے۔`
                    )}
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-3 text-center text-xs">
                <div>
                  <div className="border-t border-black w-36 mx-auto pt-1 font-urdu font-bold">
                    ناظمِ تعلیمات / پرنسپل
                  </div>
                  <p className="text-[10px] text-gray-500">Director of Academics</p>
                </div>

                <div>
                  <div className="border-t border-black w-36 mx-auto pt-1 font-urdu font-bold">
                    ناظمِ امتحانات
                  </div>
                  <p className="text-[10px] text-gray-500">Controller of Exams</p>
                </div>

                <div>
                  <div className="border-t border-black w-36 mx-auto pt-1 font-urdu font-bold">
                    مہتمم / ہیڈ ماسٹر
                  </div>
                  <p className="text-[10px] text-gray-500">Super Admin / Principal</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertTriangle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

