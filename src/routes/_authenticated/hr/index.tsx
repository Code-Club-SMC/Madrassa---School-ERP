import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  GraduationCap,
  ShieldUser,
  HandCoins,
  CalendarDays,
  PlaneTakeoff,
  ArrowLeft,
  Users as UsersIcon,
  TrendingUp,
  Wallet,
  Clock,
  Search,
  ChevronRight,
  Plus,
  Trash2,
  CalendarClock,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookLoader } from "@/components/shared/book-loader";
import { useHR } from "@/stores/hr-store";
import { teachers as allTeachers } from "@/mock/teachers";
import { users as allUsers } from "@/mock/users";
import { formatPKR } from "@/lib/format";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMemo, useState, useEffect, type FormEvent } from "react";

export const Route = createFileRoute("/_authenticated/hr/")({
  component: HRHub,
});

type ModCard = {
  to: string;
  icon: typeof Briefcase;
  urdu: string;
  english: string;
  description: string;
  count: string;
  accent: string;
};

type TeacherDashboardRow = {
  id: string;
  name: string;
  email: string;
  designation: string;
  systemScope: string;
  employmentStatus: string;
  assignments: Array<{
    id: string;
    system: string;
    institutionId?: string;
    programId?: string;
    madrassaCategoryId: string | null;
    madrassaSubcategoryId: string | null;
    schoolClassId: string | null;
    schoolSectionId: string | null;
    academicYear: string;
    subjectId: string | null;
    subjectName: string | null;
    subjectNameUrdu: string | null;
    active: boolean;
  }>;
  timetable: Array<{
    id: string;
    assignmentId: string | null;
    weekday: number;
    startTime: string;
    endTime: string;
    room: string | null;
    madrassaSubcategoryId: string | null;
    schoolClassId: string | null;
    subjectId: string | null;
    subjectName: string | null;
    subjectNameUrdu: string | null;
    active: boolean;
  }>;
};

const WEEKDAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_NAMES_UR = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];

const WEEKDAYS = [
  { value: 1, labelEn: "Monday", labelUr: "پیر" },
  { value: 2, labelEn: "Tuesday", labelUr: "منگل" },
  { value: 3, labelEn: "Wednesday", labelUr: "بدھ" },
  { value: 4, labelEn: "Thursday", labelUr: "جمعرات" },
  { value: 5, labelEn: "Friday", labelUr: "جمعہ" },
  { value: 6, labelEn: "Saturday", labelUr: "ہفتہ" },
  { value: 0, labelEn: "Sunday", labelUr: "اتوار" },
];

function HRHub() {
  const { lang } = useLanguage();
  const { staff, payrollProfiles, leaves } = useHR();

  const [teachers, setTeachers] = useState<TeacherDashboardRow[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [systemScope, setSystemScope] = useState<"all" | "madrassa" | "school">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dayFilter, setDayFilter] = useState<"all" | "today">("today");

  // Timetable management modal state
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [manageTab, setManageTab] = useState<"schedule" | "add">("schedule");
  const [formAssignmentId, setFormAssignmentId] = useState<string>("");
  const [formWeekday, setFormWeekday] = useState<string>("1");
  const [formStartTime, setFormStartTime] = useState<string>("08:00");
  const [formEndTime, setFormEndTime] = useState<string>("08:45");
  const [formRoom, setFormRoom] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers/dashboard", { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) setTeachers(data);
    } catch {
      // Fallback
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const activeStaff = staff.filter((s) => s.status === "active").length;
  const activeTeachers = allTeachers.filter((t) => t.active).length;
  const activeUsers = allUsers.filter((u) => u.status === "active").length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;

  const monthlyPayroll = useMemo(
    () =>
      payrollProfiles.reduce(
        (sum, p) =>
          sum +
          p.basicSalary +
          p.hra +
          p.transportAllowance +
          p.medicalAllowance -
          p.eobi -
          p.incomeTax,
        0,
      ),
    [payrollProfiles],
  );

  const modules: ModCard[] = [
    {
      to: "/teachers",
      icon: GraduationCap,
      urdu: "اساتذہ",
      english: "Teachers",
      description: "Academic staff across Madrassa and School systems.",
      count: `${activeTeachers} active`,
      accent: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
    },
    {
      to: "/users",
      icon: ShieldUser,
      urdu: "صارف اکاؤنٹس",
      english: "User Accounts & Permissions",
      description: "Login accounts, roles, granular module permissions.",
      count: `${activeUsers} active`,
      accent: "from-violet-500/15 to-violet-500/0 text-violet-600",
    },
    {
      to: "/hr/payroll",
      icon: HandCoins,
      urdu: "تنخواہ",
      english: "Payroll",
      description: "Generate, approve, and disburse monthly salaries.",
      count: formatPKR(monthlyPayroll) + "/mo",
      accent: "from-amber-500/15 to-amber-500/0 text-amber-600",
    },
    {
      to: "/hr/attendance",
      icon: CalendarDays,
      urdu: "حاضری عملہ",
      english: "Staff Attendance",
      description: "Daily check-in/out, leave-aware attendance log.",
      count: `${staff.length} tracked`,
      accent: "from-cyan-500/15 to-cyan-500/0 text-cyan-600",
    },
    {
      to: "/hr/leave",
      icon: PlaneTakeoff,
      urdu: "چھٹیاں",
      english: "Leave Management",
      description: "Leave requests, approvals, and balances.",
      count: `${pendingLeaves} pending`,
      accent: "from-rose-500/15 to-rose-500/0 text-rose-600",
    },
  ];

  const kpis = [
    {
      label: "Total Workforce",
      urdu: "کل عملہ",
      value: staff.length + activeTeachers,
      icon: UsersIcon,
      hint: `${activeStaff + activeTeachers} active`,
    },
    {
      label: "User Accounts",
      urdu: "صارف اکاؤنٹس",
      value: allUsers.length,
      icon: ShieldUser,
      hint: `${activeUsers} active`,
    },
    {
      label: "Monthly Payroll",
      urdu: "ماہانہ تنخواہ",
      value: formatPKR(monthlyPayroll),
      icon: Wallet,
      hint: `${payrollProfiles.length} profiles`,
    },
    {
      label: "Pending Leaves",
      urdu: "زیرِ التواء چھٹیاں",
      value: pendingLeaves,
      icon: TrendingUp,
      hint: `${leaves.length} total`,
    },
  ];

  const filteredTeachers = useMemo(() => {
    let list = teachers;
    if (systemScope !== "all") {
      list = list.filter(
        (t) =>
          t.systemScope === systemScope ||
          t.assignments.some((a) => a.system === systemScope),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.designation.toLowerCase().includes(q) ||
          t.assignments.some(
            (a) =>
              (a.subjectName && a.subjectName.toLowerCase().includes(q)) ||
              (a.subjectNameUrdu && a.subjectNameUrdu.includes(q)),
          ),
      );
    }
    return list;
  }, [teachers, systemScope, searchQuery]);

  const todayIndex = new Date().getDay();

  // Active teacher selected for modal
  const activeManageTeacher = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId),
    [teachers, selectedTeacherId],
  );

  const openManageForTeacher = (teacherId: string, initialTab: "schedule" | "add" = "schedule") => {
    setSelectedTeacherId(teacherId);
    setManageTab(initialTab);
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher && teacher.assignments.length > 0) {
      setFormAssignmentId(teacher.assignments[0].id);
    } else {
      setFormAssignmentId("");
    }
    setManageDialogOpen(true);
  };

  const handleAddPeriod = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeManageTeacher) {
      toast.error(lang === "ur" ? "استاد منتخب کریں" : "Please select a teacher");
      return;
    }
    const assignment = activeManageTeacher.assignments.find((a) => a.id === formAssignmentId);
    if (!assignment) {
      toast.error(lang === "ur" ? "کلاس / مضمون منتخب کریں" : "Please select a class assignment");
      return;
    }
    if (!formStartTime || !formEndTime || formStartTime >= formEndTime) {
      toast.error(lang === "ur" ? "آغاز کا وقت اختتام سے پہلے ہونا چاہیے" : "Start time must be before end time");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        assignmentId: assignment.id,
        system: assignment.system,
        institutionId: assignment.institutionId || "",
        programId: assignment.programId || "",
        schoolClassId: assignment.schoolClassId,
        schoolSectionId: assignment.schoolSectionId,
        madrassaCategoryId: assignment.madrassaCategoryId,
        madrassaSubcategoryId: assignment.madrassaSubcategoryId,
        subjectId: assignment.subjectId,
        academicYear: assignment.academicYear || "2024-2025",
        weekday: Number(formWeekday),
        startTime: formStartTime,
        endTime: formEndTime,
        room: formRoom.trim() ? formRoom.trim() : null,
      };

      const res = await fetch(`/api/teachers/${activeManageTeacher.id}/timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create period");
      }

      toast.success(lang === "ur" ? "پیریڈ کامیابی سے شیڈول کر دیا گیا!" : "Timetable period added successfully!");
      setFormRoom("");
      setManageTab("schedule");
      await fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || (lang === "ur" ? "پیریڈ شامل نہ ہو سکا" : "Failed to add period"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisablePeriod = async (periodId: string) => {
    if (!activeManageTeacher) return;
    try {
      const res = await fetch(`/api/teachers/${activeManageTeacher.id}/timetable/${periodId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to disable period");
      toast.success(lang === "ur" ? "پیریڈ شیڈول سے ہٹا دیا گیا" : "Period removed from schedule");
      await fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || (lang === "ur" ? "کارروائی ناکام" : "Failed to remove period"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Management"
        titleUrdu="انسانی وسائل کا انتظام"
        description="Unified hub for staff, teachers, user accounts, payroll, attendance, and timetable management."
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-urdu text-sm text-muted-foreground leading-tight" dir="rtl" lang="ur">
                  {k.urdu}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1">
                  {k.label}
                </p>
                <p className="font-heading text-2xl font-bold truncate">{k.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{k.hint}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <k.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Module cards */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="font-urdu text-lg font-semibold" dir="rtl" lang="ur">
              شعبے
            </p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Modules</p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {modules.length} modules
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {modules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="group rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all p-4 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-br ${m.accent} flex items-center justify-center`}
                >
                  <m.icon className="h-5 w-5" />
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition rtl:rotate-180" />
              </div>
              <div>
                <p className="font-urdu text-lg font-semibold leading-tight" dir="rtl" lang="ur">
                  {m.urdu}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  {m.english}
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {m.description}
              </p>
              <Badge variant="secondary" className="self-start text-[10px] font-mono mt-auto">
                {m.count}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Teacher Timetable Management Section */}
      <Card className="p-5" id="timetable-section">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold text-lg">
                {lang === "ur" ? "اساتذہ کا نظامِ اوقات اور کلاس شیڈول" : "Teacher Timetable & Schedule Management"}
              </h3>
            </div>
            <p className="font-urdu text-sm text-muted-foreground mt-0.5">
              {lang === "ur"
                ? "اساتذہ کے پیریڈز، اسباق اور کلاس اوقات کی تشکیل و انتظام"
                : "Manage class allocations, teaching periods, and weekly schedules across all teachers"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Add Button */}
            <Button
              size="sm"
              onClick={() => {
                if (teachers.length > 0) {
                  openManageForTeacher(teachers[0].id, "add");
                }
              }}
              className="gap-1.5 h-9 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{lang === "ur" ? "نیا پیریڈ مقرر کریں" : "Schedule Period"}</span>
            </Button>

            {/* System Scope Tabs */}
            <Tabs value={systemScope} onValueChange={(v) => setSystemScope(v as any)}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs">
                  {lang === "ur" ? "تمام اساتذہ" : "All"}
                </TabsTrigger>
                <TabsTrigger value="madrassa" className="text-xs">
                  {lang === "ur" ? "مدرسہ" : "Madrassa"}
                </TabsTrigger>
                <TabsTrigger value="school" className="text-xs">
                  {lang === "ur" ? "سکول" : "School"}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Day Filter */}
            <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl border border-border/70">
              <button
                type="button"
                onClick={() => setDayFilter("today")}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer",
                  dayFilter === "today"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground font-medium",
                )}
              >
                {lang === "ur" ? "آج" : "Today"}
              </button>
              <button
                type="button"
                onClick={() => setDayFilter("all")}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer",
                  dayFilter === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground font-medium",
                )}
              >
                {lang === "ur" ? "تمام ایام" : "All Days"}
              </button>
            </div>

            <Badge variant="secondary" className="font-mono text-xs h-9 px-2.5 flex items-center">
              {filteredTeachers.length} {lang === "ur" ? "اساتذہ" : "teachers"}
            </Badge>
          </div>
        </div>

        {/* Search input bar */}
        <div className="my-4 max-w-md">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "ur"
                  ? "استاد کے نام، عہدے یا مضمون سے تلاش کریں..."
                  : "Search teacher by name, designation, or subject..."
              }
              className="ps-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Timetable Cards Grid */}
        {loadingTeachers ? (
          <BookLoader text={lang === "ur" ? "لوڈ ہو رہا ہے..." : "Loading timetable..."} className="h-48" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTeachers.map((teacher) => {
              const activeTimetable = teacher.timetable.filter((period) => period.active);
              const todayPeriods = activeTimetable.filter((period) => period.weekday === todayIndex);
              const displayedPeriods = dayFilter === "today" ? todayPeriods : activeTimetable;

              const totalClasses = new Set(
                teacher.assignments.map(
                  (a) => a.madrassaSubcategoryId ?? a.schoolClassId ?? a.id,
                ),
              ).size;

              return (
                <Card key={teacher.id} className="p-4 flex flex-col justify-between hover:border-primary/40 transition-all">
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{teacher.designation}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize shrink-0",
                          teacher.systemScope === "madrassa"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
                        )}
                      >
                        {teacher.systemScope}
                      </Badge>
                    </div>

                    {/* Stat Badges */}
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div className="rounded-md bg-muted/40 p-2 text-center">
                        <p className="font-heading text-base font-bold">{totalClasses}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {lang === "ur" ? "کلاسز" : "Classes"}
                        </p>
                      </div>
                      <div className="rounded-md bg-muted/40 p-2 text-center">
                        <p className="font-heading text-base font-bold">{activeTimetable.length}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {lang === "ur" ? "پیریڈز" : "Periods"}
                        </p>
                      </div>
                      <div className="rounded-md bg-muted/40 p-2 text-center">
                        <p className="font-heading text-base font-bold text-primary">{todayPeriods.length}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {lang === "ur" ? "آج" : "Today"}
                        </p>
                      </div>
                    </div>

                    {/* Schedule List */}
                    {displayedPeriods.length > 0 ? (
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {dayFilter === "today"
                            ? lang === "ur"
                              ? `آج کا شیڈول (${WEEKDAY_NAMES_UR[todayIndex]})`
                              : `Today's Schedule (${WEEKDAY_NAMES_EN[todayIndex]})`
                            : lang === "ur"
                            ? "فعال پیریڈز"
                            : "Active Periods"}
                        </p>
                        {displayedPeriods.slice(0, 4).map((period) => (
                          <div
                            key={period.id}
                            className="flex items-center justify-between text-xs p-1.5 rounded-md bg-muted/20"
                          >
                            <span className="font-mono text-[11px] font-medium text-foreground shrink-0">
                              {period.startTime} - {period.endTime}
                            </span>
                            <span className="text-muted-foreground truncate ms-2 text-[11px]">
                              {period.subjectName ??
                                period.subjectNameUrdu ??
                                (lang === "ur" ? "کوئی مضمون نہیں" : "No subject")}
                            </span>
                            {dayFilter === "all" && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 ms-1 shrink-0">
                                {lang === "ur"
                                  ? WEEKDAY_NAMES_UR[period.weekday]
                                  : WEEKDAY_NAMES_EN[period.weekday]?.slice(0, 3)}
                              </Badge>
                            )}
                          </div>
                        ))}
                        {displayedPeriods.length > 4 && (
                          <p className="text-[10px] text-muted-foreground text-center pt-0.5">
                            +{displayedPeriods.length - 4} {lang === "ur" ? "مزید پیریڈز" : "more periods"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border text-center py-2 text-xs text-muted-foreground">
                        {dayFilter === "today"
                          ? lang === "ur"
                            ? "آج کے لیے کوئی پیریڈ مقرر نہیں"
                            : "No periods scheduled for today"
                          : lang === "ur"
                          ? "کوئی فعال پیریڈ نہیں"
                          : "No active periods found"}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openManageForTeacher(teacher.id, "schedule")}
                      className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5 cursor-pointer"
                    >
                      <Settings className="h-3 w-3" />
                      <span>{lang === "ur" ? "شیڈول کا انتظام" : "Manage Timetable"}</span>
                    </Button>
                    <Link
                      to="/teachers"
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <span>{lang === "ur" ? "پروفائل" : "Profile"}</span>
                      <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                    </Link>
                  </div>
                </Card>
              );
            })}
            {filteredTeachers.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-10 bg-muted/20 rounded-xl border border-dashed border-border">
                {lang === "ur"
                  ? "کوئی استاد یا شیڈول نہیں ملا"
                  : "No teachers or timetable schedules matching your criteria"}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Interactive Timetable Management Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {activeManageTeacher && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pe-6">
                  <div>
                    <DialogTitle className="text-base sm:text-lg">
                      {lang === "ur"
                        ? `${activeManageTeacher.name} — نظامِ اوقات کا انتظام`
                        : `Manage Timetable — ${activeManageTeacher.name}`}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeManageTeacher.designation} · {activeManageTeacher.systemScope}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">
                    {activeManageTeacher.systemScope}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Teacher selector inside dialog if switching */}
              <div className="my-3">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {lang === "ur" ? "استاد تبدیل کریں:" : "Selected Teacher:"}
                </Label>
                <Select
                  value={activeManageTeacher.id}
                  onValueChange={(id) => {
                    setSelectedTeacherId(id);
                    const t = teachers.find((x) => x.id === id);
                    if (t && t.assignments.length > 0) setFormAssignmentId(t.assignments[0].id);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name} ({t.designation} · {t.systemScope})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub-tabs: View Schedule vs Add Period */}
              <div className="flex border-b border-border mt-4 mb-3">
                <button
                  type="button"
                  onClick={() => setManageTab("schedule")}
                  className={cn(
                    "pb-2 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer",
                    manageTab === "schedule"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {lang === "ur"
                    ? `موجودہ شیڈول (${activeManageTeacher.timetable.filter((p) => p.active).length})`
                    : `Active Schedule (${activeManageTeacher.timetable.filter((p) => p.active).length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setManageTab("add")}
                  className={cn(
                    "pb-2 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer",
                    manageTab === "add"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {lang === "ur" ? "+ نیا پیریڈ شامل کریں" : "+ Add New Period"}
                </button>
              </div>

              {manageTab === "schedule" ? (
                <div className="space-y-3 py-2">
                  {activeManageTeacher.timetable.filter((p) => p.active).length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                      <p>{lang === "ur" ? "اس استاد کا ابھی کوئی پیریڈ شیڈول نہیں ہے۔" : "No timetable periods scheduled yet for this teacher."}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setManageTab("add")}
                        className="mt-3 text-xs gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{lang === "ur" ? "پہلا پیریڈ مقرر کریں" : "Add First Period"}</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeManageTeacher.timetable
                        .filter((p) => p.active)
                        .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))
                        .map((period) => (
                          <div
                            key={period.id}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 hover:bg-muted/40 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                                  {lang === "ur"
                                    ? WEEKDAY_NAMES_UR[period.weekday]
                                    : WEEKDAY_NAMES_EN[period.weekday]}
                                </Badge>
                                <span className="font-mono text-xs font-semibold">
                                  {period.startTime} - {period.endTime}
                                </span>
                                {period.room && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                                    {period.room}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-medium text-foreground mt-1 truncate">
                                {period.subjectName ??
                                  period.subjectNameUrdu ??
                                  (lang === "ur" ? "بغیر مضمون" : "General Period")}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisablePeriod(period.id)}
                              className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0 shrink-0 cursor-pointer"
                              title={lang === "ur" ? "پیریڈ ختم کریں" : "Disable period"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAddPeriod} className="space-y-3 py-2">
                  {/* Select Assignment */}
                  <div>
                    <Label className="text-xs font-medium">
                      {lang === "ur" ? "تفویض کردہ کلاس و مضمون *" : "Class & Subject Assignment *"}
                    </Label>
                    {activeManageTeacher.assignments.length === 0 ? (
                      <div className="p-3 mt-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                        {lang === "ur"
                          ? "اس استاد کو ابھی تک کوئی کلاس تفویض نہیں کی گئی۔ پہلے کلاس تفویض کریں۔"
                          : "This teacher has no active assignments yet. Please assign a class first."}
                      </div>
                    ) : (
                      <Select
                        value={formAssignmentId}
                        onValueChange={setFormAssignmentId}
                      >
                        <SelectTrigger className="h-9 text-xs mt-1">
                          <SelectValue placeholder={lang === "ur" ? "کلاس منتخب کریں" : "Select class"} />
                        </SelectTrigger>
                        <SelectContent>
                          {activeManageTeacher.assignments.map((a) => (
                            <SelectItem key={a.id} value={a.id} className="text-xs">
                              {a.subjectName ?? a.subjectNameUrdu ?? "Subject"} ({a.system})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Weekday */}
                  <div>
                    <Label className="text-xs font-medium">
                      {lang === "ur" ? "ہفتے کا دن *" : "Day of Week *"}
                    </Label>
                    <Select value={formWeekday} onValueChange={setFormWeekday}>
                      <SelectTrigger className="h-9 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)} className="text-xs">
                            {lang === "ur" ? d.labelUr : d.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">
                        {lang === "ur" ? "شروع کا وقت *" : "Start Time *"}
                      </Label>
                      <Input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="h-9 text-xs mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">
                        {lang === "ur" ? "ختم ہونے کا وقت *" : "End Time *"}
                      </Label>
                      <Input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="h-9 text-xs mt-1"
                        required
                      />
                    </div>
                  </div>

                  {/* Room / Location */}
                  <div>
                    <Label className="text-xs font-medium">
                      {lang === "ur" ? "کمرہ / ہال (اختیاری)" : "Room / Hall (Optional)"}
                    </Label>
                    <Input
                      type="text"
                      value={formRoom}
                      onChange={(e) => setFormRoom(e.target.value)}
                      placeholder={lang === "ur" ? "مثال: کمرہ نمبر 4" : "e.g. Room 4, Lab A"}
                      className="h-9 text-xs mt-1"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setManageTab("schedule")}
                      className="text-xs h-8"
                    >
                      {lang === "ur" ? "منسوخ" : "Cancel"}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submitting || activeManageTeacher.assignments.length === 0}
                      className="text-xs h-8"
                    >
                      {submitting
                        ? lang === "ur"
                          ? "محفوظ ہو رہا ہے..."
                          : "Saving..."
                        : lang === "ur"
                        ? "پیریڈ محفوظ کریں"
                        : "Save Period"}
                    </Button>
                  </div>
                </form>
              )}

              <DialogFooter className="mt-4 pt-3 border-t border-border flex sm:justify-between items-center">
                <Link
                  to="/teachers"
                  className="text-xs text-primary hover:underline"
                >
                  {lang === "ur" ? "اساتذہ کے مکمل پورٹل پر جائیں" : "Go to Full Teachers Directory"}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManageDialogOpen(false)}
                  className="text-xs h-8"
                >
                  {lang === "ur" ? "بند کریں" : "Close"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
