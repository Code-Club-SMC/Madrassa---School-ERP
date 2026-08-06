import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMyTeacherDashboard } from "./teacher-api";
import type { TeacherAssignment, TeacherTimetablePeriod } from "./teacher-types";

type TeacherDashboardPayload = Awaited<ReturnType<typeof getMyTeacherDashboard>>;

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyTeacherDashboard()
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load teacher dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const today = new Date().getDay();
  const todayPeriods = useMemo(
    () =>
      (data?.timetable ?? [])
        .filter((period) => period.weekday === today && period.active)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [data?.timetable, today],
  );

  if (loading) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
        Loading teacher dashboard...
      </Card>
    );
  }

  if (!data) {
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
    <div className="space-y-5">
      <PageHeader
        title="Teacher Dashboard"
        titleUrdu="استاد ڈیش بورڈ"
        description="Your assignments, timetable, and student attendance shortcuts."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={BookOpen} label="Active Assignments" value={data.assignments.length} />
        <Metric icon={CalendarClock} label="Weekly Periods" value={data.timetable.length} />
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

          {data.assignments.length === 0 ? (
            <p className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">No active assignments yet.</p>
          ) : (
            <div className="space-y-2">
              {data.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{assignment.system}</Badge>
                    <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
                  </div>
                  <p className="text-sm font-medium">{placementLabel(assignment)}</p>
                  <div className="mt-3">
                    <ShortcutButtons assignment={assignment} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
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
