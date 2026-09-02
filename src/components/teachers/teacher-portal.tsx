import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, CalendarCheck, CalendarClock, ClipboardList, GraduationCap, Loader2, User, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeacherSidebar } from "./teacher-sidebar";
import { getMyTeacherDashboard, getMyTeacherClasses, getMyTeacherExams, getMyTeacherReports } from "./teacher-api";
import type { TeacherAssignment, TeacherClassAssignment, TeacherTimetablePeriod, TeacherDetail } from "./teacher-types";

type TeacherTab = "dashboard" | "classes" | "timetable" | "exams" | "attendance" | "reports" | "profile";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TeacherPortal() {
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
      getMyTeacherDashboard().then(setDashboard).catch((error) => {
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
        Loading teacher portal...
      </Card>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <EmptyState
          icon={GraduationCap}
          heading="Teacher profile not ready"
          headingUrdu="استاد پروفائل تیار نہیں"
          description="Ask an administrator to complete your teacher profile."
        />
      </Card>
    );
  }

  return (
    <div className="flex gap-6">
      <TeacherSidebar active={tab} onChange={setTab} />
      <div className="flex-1 min-w-0 space-y-5">
        {tab === "dashboard" && <DashboardView dashboard={dashboard} todayPeriods={todayPeriods} today={today} classAssignments={classes ?? []} />}
        {tab === "classes" && <ClassesTab assignments={classes ?? []} />}
        {tab === "timetable" && <TimetableTab periods={dashboard.timetable} />}
        {tab === "exams" && <ExamsTab data={exams} />}
        {tab === "attendance" && <AttendanceTab assignments={dashboard.assignments} />}
        {tab === "reports" && <ReportsTab data={reports} />}
        {tab === "profile" && <ProfileTab profile={dashboard.profile} account={dashboard.account} />}
      </div>
    </div>
  );
}

function DashboardView({
  dashboard,
  todayPeriods,
  today,
  classAssignments,
}: {
  dashboard: Awaited<ReturnType<typeof getMyTeacherDashboard>>;
  todayPeriods: TeacherTimetablePeriod[];
  today: number;
  classAssignments: Awaited<ReturnType<typeof getMyTeacherClasses>>;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={BookOpen} label="Active Classes" value={dashboard.assignments.length} />
        <Metric icon={CalendarClock} label="Weekly Periods" value={dashboard.timetable.length} />
        <Metric icon={CalendarCheck} label={`${weekdays[today]} Periods`} value={todayPeriods.length} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Today&apos;s Timetable</h2>
              <p className="text-sm text-muted-foreground">{weekdays[today]}</p>
            </div>
            <Badge variant="outline">{todayPeriods.length}</Badge>
          </div>
          {todayPeriods.length === 0 ? (
            <p className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">No active periods today.</p>
          ) : (
            <div className="space-y-2">
              {todayPeriods.map((period) => (
                <div key={period.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold">
                        {period.startTime} - {period.endTime}
                      </p>
                      <p className="text-sm">{placementLabel(period)}</p>
                      <p className="text-xs text-muted-foreground">{period.room ? `Room ${period.room}` : "No room"}</p>
                    </div>
                    <ShortcutButtons assignment={period} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Assigned Groups</h2>
            <p className="text-sm text-muted-foreground">Student attendance access is limited to these groups.</p>
          </div>
          {classAssignments.length === 0 ? (
            <p className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">No active assignments yet.</p>
          ) : (
            <div className="space-y-2">
              {classAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{assignment.system}</Badge>
                    <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
                  </div>
                  <p className="text-sm font-medium">{placementLabel(assignment)}</p>
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

function ClassesTab({ assignments }: { assignments: TeacherClassAssignment[] }) {
  if (assignments.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={GraduationCap}
          heading="No classes assigned"
          headingUrdu="کوئی کلاس تفویض نہیں"
          description="Your assigned classes will appear here once an administrator assigns them."
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge variant="secondary">{assignment.system}</Badge>
            <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
          </div>
          <p className="text-sm font-medium">{placementLabel(assignment)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Info label="Subject" value={assignment.subjectName ?? assignment.subjectCode ?? "-"} />
            <Info label="Institution" value={assignment.institutionName ?? "-"} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TimetableTab({ periods }: { periods: TeacherTimetablePeriod[] }) {
  const grouped = useMemo(() => {
    const map = new Map<number, TeacherTimetablePeriod[]>();
    for (const period of periods) {
      const list = map.get(period.weekday) ?? [];
      list.push(period);
      map.set(period.weekday, list);
    }
    return map;
  }, [periods]);

  return (
    <div className="grid gap-4">
      {weekdays.map((day, index) => {
        const dayPeriods = grouped.get(index) ?? [];
        return (
          <Card key={day} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{day}</h3>
              <Badge variant="outline">{dayPeriods.length}</Badge>
            </div>
            {dayPeriods.length === 0 ? (
              <p className="text-xs text-muted-foreground">No periods</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {dayPeriods.map((period) => (
                  <div key={period.id} className="rounded-md border p-3">
                    <p className="font-mono text-sm font-semibold">
                      {period.startTime} - {period.endTime}
                    </p>
                    <p className="text-sm">{placementLabel(period)}</p>
                    <p className="text-xs text-muted-foreground">{period.room ? `Room ${period.room}` : "No room"}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ExamsTab({ data }: { data: Awaited<ReturnType<typeof getMyTeacherExams>> | null }) {
  if (!data) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          heading="Exams loading"
          headingUrdu="امتحانات لوڈ ہو رہے ہیں"
          description="Please wait while we load your exams."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-base font-semibold">Your Assignments</h3>
        <p className="text-sm text-muted-foreground">Classes and subjects you teach.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{assignment.system}</Badge>
                <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{placementLabel(assignment)}</p>
              <p className="text-xs text-muted-foreground">
                {assignment.subjectName ?? assignment.subjectCode ?? "No subject"}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-base font-semibold">Exam Sessions</h3>
        <p className="text-sm text-muted-foreground">Exams available for marks entry.</p>
        {data.sessions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No exams available.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.sessions.map((session) => (
              <div key={session.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{session.name}</p>
                  <Badge variant="outline">{session.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{session.academicYear}</p>
                <p className="text-xs text-muted-foreground">
                  {session.startDate} - {session.endDate}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AttendanceTab({ assignments }: { assignments: TeacherAssignment[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold">Attendance</h3>
      <p className="text-sm text-muted-foreground">Mark and view attendance for your assigned classes.</p>
      {assignments.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No assignments available for attendance.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{assignment.system}</Badge>
                <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{placementLabel(assignment)}</p>
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <Link to={assignment.system === "school" ? "/school/attendance" : "/madrassa/attendance"}>
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Mark Attendance
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ReportsTab({ data }: { data: Awaited<ReturnType<typeof getMyTeacherReports>> | null }) {
  if (!data) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          heading="Reports loading"
          headingUrdu="رپورٹس لوڈ ہو رہی ہیں"
          description="Please wait while we load your reports."
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Classes</p>
        <p className="text-2xl font-semibold">{data.totalClasses}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">School</p>
        <p className="text-2xl font-semibold">{data.totalSchool}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Madrassa</p>
        <p className="text-2xl font-semibold">{data.totalMadrassa}</p>
      </Card>
    </div>
  );
}

function ProfileTab({ profile, account }: { profile: TeacherDetail["profile"]; account: TeacherDetail["account"] }) {
  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold">Your Profile</h3>
      <div className="mt-4 grid gap-3 text-sm">
        <Info label="Name" value={profile.name ?? account.name} />
        <Info label="Email" value={account.email} />
        <Info label="System Scope" value={profile.systemScope} />
        <Info label="Designation" value={profile.designation} />
        <Info label="Joined" value={profile.joinedAt} />
        <Info label="Status" value={profile.employmentStatus} />
      </div>
    </Card>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function ShortcutButtons({ assignment }: { assignment: TeacherAssignment | TeacherTimetablePeriod }) {
  const attendanceUrl = assignment.system === "school" ? "/school/attendance" : "/madrassa/attendance";
  const examsUrl = assignment.system === "school" ? "/school/exams" : "/madrassa/exams";

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" asChild>
        <Link to={attendanceUrl}>
          <CalendarCheck className="h-3.5 w-3.5" />
          Attendance
        </Link>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <Link to={examsUrl}>
          <ClipboardList className="h-3.5 w-3.5" />
          Exams
        </Link>
      </Button>
    </div>
  );
}

function placementLabel(assignment: TeacherAssignment | TeacherTimetablePeriod) {
  if (assignment.system === "school") {
    return `School · ${assignment.schoolClassId ?? "Class"} / ${assignment.schoolSectionId ?? "Section"}`;
  }
  return `Madrassa · ${assignment.madrassaCategoryId ?? "Category"} / ${assignment.madrassaSubcategoryId ?? "Darja"}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
