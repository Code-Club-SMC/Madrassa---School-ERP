import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  Loader2,
  User,
  BarChart3,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";
import { TeacherSidebar } from "./teacher-sidebar";
import {
  getMyTeacherDashboard,
  getMyTeacherClasses,
  getMyTeacherExams,
  getMyTeacherReports,
} from "./teacher-api";
import {
  getSchoolAttendanceRoster,
  getMadrassaAttendanceRoster,
  markSchoolAttendance,
  markMadrassaAttendance,
} from "@/components/attendance/attendance-api";
import { AttendanceMarker } from "@/components/attendance/attendance-marker";
import type {
  AttendanceRosterPayload,
  AttendanceStatus,
  AttendanceMarkRow,
} from "@/components/attendance/attendance-types";
import type {
  TeacherAssignment,
  TeacherClassAssignment,
  TeacherTimetablePeriod,
  TeacherDetail,
} from "./teacher-types";

type TeacherTab =
  | "dashboard"
  | "classes"
  | "timetable"
  | "exams"
  | "attendance"
  | "reports"
  | "profile";

const weekdaysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdaysUr = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];

const navItems: { value: TeacherTab; icon: typeof BookOpen; en: string; ur: string }[] = [
  { value: "dashboard", icon: BookOpen, en: "Dashboard", ur: "ڈیش بورڈ" },
  { value: "classes", icon: GraduationCap, en: "Classes", ur: "کلاسز" },
  { value: "timetable", icon: CalendarClock, en: "Timetable", ur: "ٹائم ٹیبل" },
  { value: "exams", icon: ClipboardList, en: "Exams", ur: "امتحانات" },
  { value: "attendance", icon: CalendarCheck, en: "Attendance", ur: "حاضری" },
  { value: "reports", icon: BarChart3, en: "Reports", ur: "رپورٹس" },
  { value: "profile", icon: User, en: "Profile", ur: "پروفائل" },
];

export function TeacherPortal() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [tab, setTab] = useState<TeacherTab>("dashboard");
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof getMyTeacherDashboard>> | null>(null);
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof getMyTeacherClasses>> | null>(null);
  const [exams, setExams] = useState<Awaited<ReturnType<typeof getMyTeacherExams>> | null>(null);
  const [reports, setReports] = useState<Awaited<ReturnType<typeof getMyTeacherReports>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getMyTeacherDashboard()
        .then(setDashboard)
        .catch((error) => {
          if (active) toast.error(error instanceof Error ? error.message : "Could not load dashboard");
        }),
      getMyTeacherClasses().then(setClasses).catch(() => {}),
      getMyTeacherExams().then(setExams).catch(() => {}),
      getMyTeacherReports().then(setReports).catch(() => {}),
    ]).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const today = new Date().getDay();
  const todayPeriods: TeacherTimetablePeriod[] = useMemo(
    () =>
      (dashboard?.timetable ?? [])
        .filter((period) => period.weekday === today && period.active)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [dashboard?.timetable, today],
  );

  if (loading) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
        {isUrdu ? "استاد پورٹل لوڈ ہو رہا ہے..." : "Loading teacher portal..."}
      </Card>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <EmptyState
          icon={GraduationCap}
          heading={isUrdu ? "استاد پروفائل تیار نہیں" : "Teacher profile not ready"}
          headingUrdu="استاد پروفائل تیار نہیں"
          description={
            isUrdu
              ? "براہ کرم ایڈمنسٹریٹر سے اپنی استاد پروفائل مکمل کروائیں۔"
              : "Ask an administrator to complete your teacher profile."
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile / Tablet Horizontal Navigation Tabs */}
      <div className="lg:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                  isUrdu && "font-urdu text-sm",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{isUrdu ? item.ur : item.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <TeacherSidebar active={tab} onChange={setTab} />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-5">
          {tab === "dashboard" && (
            <DashboardView
              dashboard={dashboard}
              todayPeriods={todayPeriods}
              today={today}
              classAssignments={classes ?? []}
              isUrdu={isUrdu}
            />
          )}
          {tab === "classes" && <ClassesTab assignments={classes ?? []} isUrdu={isUrdu} />}
          {tab === "timetable" && (
            <TimetableTab
              periods={dashboard.timetable}
              assignments={classes ?? []}
              isUrdu={isUrdu}
            />
          )}
          {tab === "exams" && <ExamsTab data={exams} isUrdu={isUrdu} />}
          {tab === "attendance" && (
            <AttendanceTab assignments={dashboard.assignments} isUrdu={isUrdu} />
          )}
          {tab === "reports" && <ReportsTab data={reports} isUrdu={isUrdu} />}
          {tab === "profile" && (
            <ProfileTab
              profile={dashboard.profile}
              account={dashboard.account}
              isUrdu={isUrdu}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardView({
  dashboard,
  todayPeriods,
  today,
  classAssignments,
  isUrdu,
}: {
  dashboard: Awaited<ReturnType<typeof getMyTeacherDashboard>>;
  todayPeriods: TeacherTimetablePeriod[];
  today: number;
  classAssignments: Awaited<ReturnType<typeof getMyTeacherClasses>>;
  isUrdu: boolean;
}) {
  const dayName = isUrdu ? weekdaysUr[today] : weekdaysEn[today];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Metric
          icon={BookOpen}
          label={isUrdu ? "فعال کلاسز" : "Active Classes"}
          value={dashboard.assignments.length}
        />
        <Metric
          icon={CalendarClock}
          label={isUrdu ? "ہفتہ وار پیریڈز" : "Weekly Periods"}
          value={dashboard.timetable.length}
        />
        <Metric
          icon={CalendarCheck}
          label={isUrdu ? `آج کے پیریڈز (${dayName})` : `${dayName} Periods`}
          value={todayPeriods.length}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className={cn("text-base font-semibold", isUrdu && "font-urdu")}>
                {isUrdu ? "آج کا ٹائم ٹیبل" : "Today's Timetable"}
              </h2>
              <p className={cn("text-sm text-muted-foreground", isUrdu && "font-urdu")}>{dayName}</p>
            </div>
            <Badge variant="outline">{todayPeriods.length}</Badge>
          </div>
          {todayPeriods.length === 0 ? (
            <p className={cn("rounded-md bg-muted/40 p-4 text-sm text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu ? "آج کے دن کوئی پیریڈ شیڈول نہیں ہے۔" : "No active periods today."}
            </p>
          ) : (
            <div className="space-y-2">
              {todayPeriods.map((period) => (
                <div key={period.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold">
                        {period.startTime} - {period.endTime}
                      </p>
                      <p className={cn("text-sm", isUrdu && "font-urdu")}>
                        {placementLabel(period, isUrdu)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {period.room ? (isUrdu ? `کمرہ نمبر ${period.room}` : `Room ${period.room}`) : (isUrdu ? "کمرہ متعین نہیں" : "No room")}
                      </p>
                    </div>
                    <ShortcutButtons assignment={period} isUrdu={isUrdu} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className={cn("text-base font-semibold", isUrdu && "font-urdu")}>
              {isUrdu ? "تفویض شدہ گروپس" : "Assigned Groups"}
            </h2>
            <p className={cn("text-sm text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu
                ? "آپ کی حاضری اور نتائج کی رسائی ان گروپس تک محدود ہے۔"
                : "Student attendance and exam access is limited to these groups."}
            </p>
          </div>
          {classAssignments.length === 0 ? (
            <p className={cn("rounded-md bg-muted/40 p-4 text-sm text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu ? "ابھی کوئی گروپ تفویض نہیں ہے۔" : "No active assignments yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {classAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{assignment.system}</Badge>
                    <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
                  </div>
                  <p className={cn("text-sm font-medium", isUrdu && "font-urdu")}>
                    {placementLabelForClasses(assignment, isUrdu)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.subjectName ?? assignment.subjectCode ?? ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ClassesTab({
  assignments,
  isUrdu,
}: {
  assignments: TeacherClassAssignment[];
  isUrdu: boolean;
}) {
  if (assignments.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={GraduationCap}
          heading={isUrdu ? "کوئی کلاس تفویض نہیں" : "No classes assigned"}
          headingUrdu="کوئی کلاس تفویض نہیں"
          description={
            isUrdu
              ? "ایڈمنسٹریٹر کی جانب سے کلاس تفویض ہونے کے بعد وہ یہاں ظاہر ہوگی۔"
              : "Your assigned classes will appear here once an administrator assigns them."
          }
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge variant="secondary">{assignment.system}</Badge>
            <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
          </div>
          <p className={cn("text-sm font-medium", isUrdu && "font-urdu")}>
            {placementLabelForClasses(assignment, isUrdu)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Info
              label={isUrdu ? "مضمون" : "Subject"}
              value={assignment.subjectName ?? assignment.subjectCode ?? "-"}
            />
            <Info
              label={isUrdu ? "ادارہ" : "Institution"}
              value={assignment.institutionName ?? "-"}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TimetableTab({
  periods,
  assignments,
  isUrdu,
}: {
  periods: TeacherTimetablePeriod[];
  assignments: TeacherClassAssignment[];
  isUrdu: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<number, TeacherTimetablePeriod[]>();
    for (const period of periods) {
      const list = map.get(period.weekday) ?? [];
      list.push(period);
      map.set(period.weekday, list);
    }
    return map;
  }, [periods]);

  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(today);
  const selectedPeriods = grouped.get(selectedDay) ?? [];
  const days = isUrdu ? weekdaysUr : weekdaysEn;

  if (periods.length === 0 && assignments.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={CalendarClock}
          heading={isUrdu ? "کوئی ٹائم ٹیبل نہیں" : "No timetable yet"}
          headingUrdu="کوئی ٹائم ٹیبل نہیں"
          description={
            isUrdu
              ? "ابھی تک آپ کو کوئی کلاس یا ٹائم ٹیبل تفویض نہیں کیا گیا ہے۔"
              : "You don't have any class assignments or timetable periods yet. Contact an administrator to assign classes to you."
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day, index) => {
          const count = (grouped.get(index) ?? []).length;
          const isSelected = selectedDay === index;
          const isToday = index === today;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(index)}
              className={cn(
                "rounded-lg border p-2 text-center transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : isToday
                    ? "border-primary/40 bg-muted/20"
                    : "hover:bg-muted/40",
              )}
            >
              <p className={cn("text-[11px] font-medium truncate", isUrdu && "font-urdu text-xs")}>
                {day}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {count} {isUrdu ? "پیریڈ" : count === 1 ? "class" : "classes"}
              </p>
            </button>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className={cn("text-sm font-semibold", isUrdu && "font-urdu")}>
            {days[selectedDay]}
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {selectedPeriods.length} {isUrdu ? "پیریڈز" : "periods"}
          </Badge>
        </div>
        {selectedPeriods.length === 0 ? (
          <p className={cn("text-xs text-muted-foreground py-4 text-center", isUrdu && "font-urdu")}>
            {isUrdu ? "اس دن کوئی پیریڈ شیڈول نہیں ہے۔" : "No classes scheduled for this day."}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedPeriods.map((period) => (
              <div key={period.id} className="rounded-md border p-3">
                <p className="font-mono text-xs font-semibold">
                  {period.startTime} - {period.endTime}
                </p>
                <p className={cn("mt-1 text-xs", isUrdu && "font-urdu")}>
                  {placementLabel(period, isUrdu)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {period.room ? (isUrdu ? `کمرہ ${period.room}` : `Room ${period.room}`) : (isUrdu ? "کمرہ نہیں" : "No room")}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ExamsTab({
  data,
  isUrdu,
}: {
  data: Awaited<ReturnType<typeof getMyTeacherExams>> | null;
  isUrdu: boolean;
}) {
  if (!data) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          heading={isUrdu ? "امتحانات لوڈ ہو رہے ہیں" : "Exams loading"}
          headingUrdu="امتحانات لوڈ ہو رہے ہیں"
          description={
            isUrdu ? "براہ کرم انتظار کریں..." : "Please wait while we load your exams."
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className={cn("text-base font-semibold", isUrdu && "font-urdu")}>
              {isUrdu ? "آپ کے تفویض شدہ مضامین" : "Your Assigned Exam Subjects"}
            </h3>
            <p className={cn("text-sm text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu
                ? "آپ صرف انہی مضامین کے امتحانی نمبر درج کر سکتے ہیں جو آپ کو تفویض ہیں۔"
                : "Classes and subjects you teach — marks entry is restricted to these subjects."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{assignment.system}</Badge>
                <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
              </div>
              <p className={cn("mt-2 text-sm font-medium", isUrdu && "font-urdu")}>
                {placementLabelForClasses(assignment, isUrdu)}
              </p>
              <p className="text-xs text-muted-foreground">
                {assignment.subjectName ?? assignment.subjectCode ?? (isUrdu ? "کوئی مضمون نہیں" : "No subject")}
              </p>
            </div>
          ))}
          {data.assignments.length === 0 && (
            <p className={cn("text-sm text-muted-foreground py-4 text-center sm:col-span-2", isUrdu && "font-urdu")}>
              {isUrdu ? "کوئی مضمون تفویض نہیں ہے۔" : "No assigned subjects found."}
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className={cn("text-base font-semibold", isUrdu && "font-urdu")}>
          {isUrdu ? "امتحانی سیشنز" : "Exam Sessions"}
        </h3>
        <p className={cn("text-sm text-muted-foreground", isUrdu && "font-urdu")}>
          {isUrdu
            ? "نمبر درج کرنے اور نتائج دیکھنے کے لیے سیشن منتخب کریں۔"
            : "Available exam sessions for marks entry and grading."}
        </p>
        {data.sessions.length === 0 ? (
          <p className={cn("mt-4 text-sm text-muted-foreground", isUrdu && "font-urdu")}>
            {isUrdu ? "کوئی امتحانی سیشن دستیاب نہیں ہے۔" : "No exams available."}
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.sessions.map((session) => (
              <div key={session.id} className="rounded-md border p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{session.name}</p>
                    <Badge variant="outline">{session.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{session.academicYear}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.startDate} - {session.endDate}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t flex justify-end">
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      to="/school/exams/$id/marks"
                      params={{ id: session.id }}
                    >
                      <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                      {isUrdu ? "نمبر درج کریں" : "Enter Marks"}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AttendanceTab({
  assignments,
  isUrdu,
}: {
  assignments: TeacherAssignment[];
  isUrdu: boolean;
}) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedId, setSelectedId] = useState<string>(assignments[0]?.id ?? "");
  const [date, setDate] = useState<string>(todayStr);
  const [roster, setRoster] = useState<AttendanceRosterPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const selected = useMemo(
    () => assignments.find((a) => a.id === selectedId) ?? assignments[0] ?? null,
    [assignments, selectedId],
  );

  const loadRoster = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      let data: AttendanceRosterPayload;
      if (selected.system === "school") {
        if (!selected.schoolClassId || !selected.schoolSectionId) {
          setRoster(null);
          return;
        }
        data = await getSchoolAttendanceRoster({
          date,
          classId: selected.schoolClassId,
          sectionId: selected.schoolSectionId,
        });
      } else {
        if (!selected.institutionId || !selected.madrassaSubcategoryId) {
          setRoster(null);
          return;
        }
        data = await getMadrassaAttendanceRoster({
          date,
          institutionId: selected.institutionId,
          subcategoryId: selected.madrassaSubcategoryId,
        });
      }
      setRoster(data);
      const initialMarks: Record<string, AttendanceStatus> = {};
      const initialNotes: Record<string, string> = {};
      for (const s of data.students) {
        if (s.attendance) {
          initialMarks[s.id] = s.attendance.status;
          if (s.attendance.notes) initialNotes[s.id] = s.attendance.notes;
        }
      }
      setMarks(initialMarks);
      setNotes(initialNotes);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load attendance roster");
      setRoster(null);
    } finally {
      setLoading(false);
    }
  }, [date, selected]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSetNote = (studentId: string, note: string) => {
    setNotes((prev) => ({ ...prev, [studentId]: note }));
  };

  const handleMarkAllPresent = () => {
    if (!roster) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const s of roster.students) {
      next[s.id] = "present";
    }
    setMarks(next);
  };

  const handleClear = () => {
    setMarks({});
    setNotes({});
  };

  const handleSave = async () => {
    if (!selected || !roster) return;
    setSaving(true);
    try {
      const rows: AttendanceMarkRow[] = roster.students
        .map((s) => ({
          studentId: s.id,
          enrollmentId: s.enrollmentId,
          status: marks[s.id] ?? ("present" as AttendanceStatus),
          notes: notes[s.id] || undefined,
        }))
        .filter((r) => r.status !== undefined);

      if (selected.system === "school") {
        await markSchoolAttendance({
          date,
          classId: selected.schoolClassId!,
          sectionId: selected.schoolSectionId!,
          rows,
        });
      } else {
        await markMadrassaAttendance({
          date,
          institutionId: selected.institutionId,
          subcategoryId: selected.madrassaSubcategoryId!,
          rows,
        });
      }
      toast.success(isUrdu ? "حاضری محفوظ کر دی گئی" : "Attendance saved successfully");
      await loadRoster();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (assignments.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={CalendarCheck}
          heading={isUrdu ? "کوئی تفویض شدہ کلاس نہیں" : "No assignments available for attendance"}
          headingUrdu="کوئی تفویض شدہ کلاس نہیں"
          description={
            isUrdu
              ? "حاضری لگانے کے لیے آپ کو کسی کلاس کا تفویض ہونا ضروری ہے۔"
              : "You must be assigned to at least one class to mark attendance."
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Class Selection & Date Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className={cn("text-sm font-semibold", isUrdu && "font-urdu")}>
              {isUrdu ? "کلاس حاضری لگائیں" : "Mark Class Attendance"}
            </h3>
            <p className={cn("text-xs text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu
                ? "روزانہ حاضری صرف پہلے پیریڈ کا استاد ایک بار لگا سکتا ہے۔"
                : "Daily attendance is taken once daily by the designated 1st period teacher."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 w-36 text-xs font-mono"
            />
          </div>
        </div>

        {/* Assigned Class Pills */}
        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t">
          {assignments.map((assignment) => {
            const active = (selected?.id ?? "") === assignment.id;
            return (
              <button
                key={assignment.id}
                type="button"
                onClick={() => setSelectedId(assignment.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted text-muted-foreground border-border",
                )}
              >
                <Badge variant={active ? "outline" : "secondary"} className="text-[10px] py-0">
                  {assignment.system}
                </Badge>
                <span className={cn(isUrdu && "font-urdu")}>
                  {placementLabel(assignment, isUrdu)}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Roster & Attendance Marker */}
      {selected && (
        <AttendanceMarker
          title={placementLabel(selected, isUrdu)}
          subtitle={
            isUrdu
              ? `تاریخ: ${date} · تعلیمی سال: ${selected.academicYear}`
              : `Date: ${date} · Academic Year: ${selected.academicYear}`
          }
          roster={roster}
          loading={loading}
          saving={saving}
          marks={marks}
          notes={notes}
          onSetStatus={handleSetStatus}
          onSetNote={handleSetNote}
          onMarkAllPresent={handleMarkAllPresent}
          onClear={handleClear}
          onSave={() => void handleSave()}
        />
      )}
    </div>
  );
}

function ReportsTab({
  data,
  isUrdu,
}: {
  data: Awaited<ReturnType<typeof getMyTeacherReports>> | null;
  isUrdu: boolean;
}) {
  if (!data) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          heading={isUrdu ? "رپورٹس لوڈ ہو رہی ہیں" : "Reports loading"}
          headingUrdu="رپورٹس لوڈ ہو رہی ہیں"
          description={
            isUrdu ? "براہ کرم انتظار کریں..." : "Please wait while we load your reports."
          }
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <Card className="p-4">
        <p className={cn("text-xs uppercase tracking-wide text-muted-foreground", isUrdu && "font-urdu")}>
          {isUrdu ? "کل کلاسز" : "Total Classes"}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{data.totalClasses}</p>
      </Card>
      <Card className="p-4">
        <p className={cn("text-xs uppercase tracking-wide text-muted-foreground", isUrdu && "font-urdu")}>
          {isUrdu ? "اسکول کلاسز" : "School"}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{data.totalSchool}</p>
      </Card>
      <Card className="p-4">
        <p className={cn("text-xs uppercase tracking-wide text-muted-foreground", isUrdu && "font-urdu")}>
          {isUrdu ? "مدرسہ کلاسز" : "Madrassa"}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{data.totalMadrassa}</p>
      </Card>
    </div>
  );
}

function ProfileTab({
  profile,
  account,
  isUrdu,
}: {
  profile: TeacherDetail["profile"];
  account: TeacherDetail["account"];
  isUrdu: boolean;
}) {
  return (
    <Card className="p-5">
      <h3 className={cn("text-base font-semibold", isUrdu && "font-urdu")}>
        {isUrdu ? "آپ کی پروفائل" : "Your Profile"}
      </h3>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Info
          label={isUrdu ? "نام" : "Name"}
          value={profile.name ?? account.name}
        />
        <Info label={isUrdu ? "ای میل" : "Email"} value={account.email} />
        <Info
          label={isUrdu ? "نظام (Scope)" : "System Scope"}
          value={profile.systemScope}
        />
        <Info
          label={isUrdu ? "عہدہ" : "Designation"}
          value={profile.designation ?? "-"}
        />
        <Info
          label={isUrdu ? "شمولیت کی تاریخ" : "Joined"}
          value={profile.joinedAt ?? "-"}
        />
        <Info
          label={isUrdu ? "حالت" : "Status"}
          value={profile.employmentStatus ?? "-"}
        />
      </div>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function ShortcutButtons({
  assignment,
  isUrdu,
}: {
  assignment: TeacherAssignment | TeacherTimetablePeriod;
  isUrdu: boolean;
}) {
  const attendanceUrl = assignment.system === "school" ? "/school/attendance" : "/madrassa/attendance";
  const examsUrl = assignment.system === "school" ? "/school/exams" : "/madrassa/exams";

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" asChild>
        <Link to={attendanceUrl}>
          <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
          {isUrdu ? "حاضری" : "Attendance"}
        </Link>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <Link to={examsUrl}>
          <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
          {isUrdu ? "امتحانات" : "Exams"}
        </Link>
      </Button>
    </div>
  );
}

function placementLabelForClasses(assignment: TeacherClassAssignment, isUrdu: boolean) {
  if (assignment.system === "school") {
    const className = assignment.schoolClassName ?? assignment.schoolClassId ?? "Class";
    const sectionName = assignment.schoolSectionName ?? assignment.schoolSectionId ?? "Section";
    return isUrdu ? `${className} · سیکشن ${sectionName}` : `${className} · Section ${sectionName}`;
  }
  const categoryName = assignment.madrassaCategoryName ?? assignment.madrassaCategoryId ?? "Category";
  const subcategoryName = assignment.madrassaSubcategoryName ?? assignment.madrassaSubcategoryId ?? "Darja";
  return `${categoryName} · ${subcategoryName}`;
}

function placementLabel(
  assignment: TeacherAssignment | TeacherTimetablePeriod,
  isUrdu: boolean,
) {
  if (assignment.system === "school") {
    const classId = assignment.schoolClassId ?? "Class";
    const sectionId = assignment.schoolSectionId ?? "Section";
    return isUrdu ? `اسکول · ${classId} / ${sectionId}` : `School · ${classId} / ${sectionId}`;
  }
  const categoryId = assignment.madrassaCategoryId ?? "Category";
  const subcategoryId = assignment.madrassaSubcategoryId ?? "Darja";
  return isUrdu ? `مدرسہ · ${categoryId} / ${subcategoryId}` : `Madrassa · ${categoryId} / ${subcategoryId}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
