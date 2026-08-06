import { useMemo } from "react";
import { CalendarMinus, Check, Clock, Save, X, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  AttendanceRosterPayload,
  AttendanceRosterStudent,
  AttendanceStatus,
} from "./attendance-types";

type AttendanceMarkerProps = {
  title: string;
  subtitle: string;
  roster: AttendanceRosterPayload | null;
  loading: boolean;
  saving: boolean;
  marks: Record<string, AttendanceStatus>;
  notes: Record<string, string>;
  onSetStatus: (studentId: string, status: AttendanceStatus) => void;
  onSetNote: (studentId: string, note: string) => void;
  onMarkAllPresent: () => void;
  onClear: () => void;
  onSave: () => void;
};

const statusOptions = [
  {
    value: "present",
    label: "Present",
    shortLabel: "P",
    icon: Check,
    className: "text-emerald-700 hover:text-emerald-800 dark:text-emerald-300",
    activeClassName:
      "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950",
  },
  {
    value: "absent",
    label: "Absent",
    shortLabel: "A",
    icon: X,
    className: "text-destructive hover:text-destructive",
    activeClassName: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  {
    value: "late",
    label: "Late",
    shortLabel: "L",
    icon: Clock,
    className: "text-amber-700 hover:text-amber-800 dark:text-amber-300",
    activeClassName:
      "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:text-white dark:text-amber-950",
  },
  {
    value: "leave",
    label: "Leave",
    shortLabel: "LV",
    icon: CalendarMinus,
    className: "text-sky-700 hover:text-sky-800 dark:text-sky-300",
    activeClassName:
      "border-sky-600 bg-sky-600 text-white hover:bg-sky-700 hover:text-white dark:border-sky-500 dark:bg-sky-500 dark:text-sky-950",
  },
] satisfies Array<{
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  className: string;
  activeClassName: string;
}>;

export function AttendanceMarker({
  title,
  subtitle,
  roster,
  loading,
  saving,
  marks,
  notes,
  onSetStatus,
  onSetNote,
  onMarkAllPresent,
  onClear,
  onSave,
}: AttendanceMarkerProps) {
  const counts = useMemo(() => {
    const next = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      unmarked: roster?.students.length ?? 0,
    };

    if (!roster) return next;

    for (const student of roster.students) {
      const status = marks[student.id];
      if (!status) continue;
      next[status] += 1;
      next.unmarked -= 1;
    }

    next.unmarked = Math.max(next.unmarked, 0);
    return next;
  }, [marks, roster]);

  const canUseRoster = Boolean(roster) && !loading;
  const students = roster?.students ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!canUseRoster || students.length === 0 || saving}
              onClick={onMarkAllPresent}
            >
              <Check className="h-4 w-4" />
              Mark All Present
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canUseRoster || students.length === 0 || saving}
              onClick={onClear}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={!roster || saving}
              onClick={onSave}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <AttendanceCount label="Present" value={counts.present} tone="present" />
          <AttendanceCount label="Absent" value={counts.absent} tone="absent" />
          <AttendanceCount label="Late" value={counts.late} tone="late" />
          <AttendanceCount label="Leave" value={counts.leave} tone="leave" />
          <AttendanceCount label="Unmarked" value={counts.unmarked} />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading attendance roster...</div>
      ) : !roster ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Select a date and group to load the attendance roster.
        </div>
      ) : students.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No active students exist for this attendance target.
        </div>
      ) : (
        <div className="divide-y">
          {students.map((student) => (
            <AttendanceStudentRow
              key={student.enrollmentId}
              student={student}
              status={marks[student.id]}
              note={notes[student.id] ?? ""}
              saving={saving}
              onSetStatus={onSetStatus}
              onSetNote={onSetNote}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function AttendanceStudentRow({
  student,
  status,
  note,
  saving,
  onSetStatus,
  onSetNote,
}: {
  student: AttendanceRosterStudent;
  status?: AttendanceStatus;
  note: string;
  saving: boolean;
  onSetStatus: (studentId: string, status: AttendanceStatus) => void;
  onSetNote: (studentId: string, note: string) => void;
}) {
  return (
    <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(180px,260px)] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {studentInitials(student.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              {student.rollNo || "No roll"}
            </Badge>
            <p className="truncate font-urdu text-sm font-semibold leading-tight" dir="rtl" lang="ur">
              {student.nameUrdu || student.name}
            </p>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {student.name} · {student.fatherName || "Father not recorded"}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {student.groupLabel} · Admission {student.admissionNo || "N/A"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 lg:justify-end">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const active = status === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              size="icon"
              title={option.label}
              aria-label={`${option.label} ${student.name}`}
              aria-pressed={active}
              disabled={saving}
              className={cn(
                "h-8 w-9 rounded-md",
                active ? option.activeClassName : option.className,
              )}
              onClick={() => onSetStatus(student.id, option.value)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="sr-only">{option.shortLabel}</span>
            </Button>
          );
        })}
      </div>

      <Input
        value={note}
        onChange={(event) => onSetNote(student.id, event.target.value)}
        placeholder="Optional note"
        disabled={saving}
        className="h-8 text-xs"
      />
    </div>
  );
}

function AttendanceCount({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: AttendanceStatus;
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-mono text-lg font-semibold",
          tone === "present" && "text-emerald-700 dark:text-emerald-300",
          tone === "absent" && "text-destructive",
          tone === "late" && "text-amber-700 dark:text-amber-300",
          tone === "leave" && "text-sky-700 dark:text-sky-300",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function studentInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST"
  );
}
