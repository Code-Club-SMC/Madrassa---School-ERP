import { useMemo } from "react";
import { CalendarMinus, Check, Clock, Loader2, Lock, Save, ShieldAlert, X, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-context";
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
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

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

  const canMark = roster?.attendancePolicy ? roster.attendancePolicy.canMark : true;
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
              disabled={!canUseRoster || students.length === 0 || saving || !canMark}
              onClick={onMarkAllPresent}
            >
              <Check className="h-4 w-4" />
              {isUrdu ? "سب حاضر" : "Mark All Present"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canUseRoster || students.length === 0 || saving || !canMark}
              onClick={onClear}
            >
              {isUrdu ? "صاف کریں" : "Clear"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={!roster || saving || !canMark}
              onClick={onSave}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? (isUrdu ? "محفوظ ہو رہا ہے..." : "Saving...") : (isUrdu ? "حاضری محفوظ کریں" : "Save Attendance")}</span>
            </Button>
          </div>
        </div>

        {roster?.attendancePolicy && !canMark && (
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs uppercase tracking-wide">
                {isUrdu ? "حاضری مقفل ہے (حاضری صرف روزانہ ایک بار تفویض شدہ استاد لے سکتا ہے)" : "Attendance Locked — Daily Policy"}
              </p>
              <p className="mt-0.5 text-xs">
                {roster.attendancePolicy.lockReason ??
                  (roster.attendancePolicy.isAlreadyMarked
                    ? `Attendance for today has already been marked by ${roster.attendancePolicy.markedByName || "another teacher"}. Attendance cannot be marked twice.`
                    : `Daily attendance for this class must be taken by the 1st period teacher (${roster.attendancePolicy.designatedTeacherName || "designated teacher"}).`)}
              </p>
            </div>
          </div>
        )}

        {roster?.attendancePolicy?.isAlreadyMarked && canMark && (
          <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>
              {isUrdu
                ? `حاضری پہلے ہی درج ہو چکی ہے (${roster.attendancePolicy.markedByName ?? "ریکارڈ شدہ"})`
                : `Attendance recorded today by ${roster.attendancePolicy.markedByName ?? "teacher"}`}
            </span>
          </div>
        )}

        {roster?.attendancePolicy?.canMark && roster.attendancePolicy.designatedTeacherName && !roster.attendancePolicy.isAlreadyMarked && (
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-primary flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {isUrdu
                ? `پہلے پیریڈ کے تفویض شدہ استاد: ${roster.attendancePolicy.designatedTeacherName}`
                : `1st Period Designated Teacher: ${roster.attendancePolicy.designatedTeacherName}`}
            </span>
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <AttendanceCount label={isUrdu ? "حاضر" : "Present"} value={counts.present} tone="present" />
          <AttendanceCount label={isUrdu ? "غیر حاضر" : "Absent"} value={counts.absent} tone="absent" />
          <AttendanceCount label={isUrdu ? "دیر سے" : "Late"} value={counts.late} tone="late" />
          <AttendanceCount label={isUrdu ? "رخصت" : "Leave"} value={counts.leave} tone="leave" />
          <AttendanceCount label={isUrdu ? "باقی" : "Unmarked"} value={counts.unmarked} />
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
              canMark={canMark}
              isUrdu={isUrdu}
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
  canMark,
  isUrdu,
  onSetStatus,
  onSetNote,
}: {
  student: AttendanceRosterStudent;
  status?: AttendanceStatus;
  note: string;
  saving: boolean;
  canMark: boolean;
  isUrdu: boolean;
  onSetStatus: (studentId: string, status: AttendanceStatus) => void;
  onSetNote: (studentId: string, note: string) => void;
}) {
  const primaryName = isUrdu ? (student.nameUrdu || student.name) : (student.name || student.nameUrdu);
  const secondaryName = isUrdu
    ? (student.name && student.name !== student.nameUrdu ? student.name : null)
    : (student.nameUrdu && student.nameUrdu !== student.name ? student.nameUrdu : null);
  const fatherText = isUrdu
    ? (student.fatherNameUrdu || student.fatherName || "والد کا نام درج نہیں")
    : (student.fatherName || "Father not recorded");

  return (
    <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(180px,260px)] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {studentInitials(student.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              {student.rollNo || "No roll"}
            </Badge>
            <p className={cn("truncate text-sm font-semibold leading-normal", isUrdu && "font-urdu")} dir={isUrdu ? "rtl" : "ltr"}>
              {primaryName}
            </p>
            {secondaryName && (
              <span className={cn("truncate text-xs text-muted-foreground", !isUrdu && "font-urdu")}>
                ({secondaryName})
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {fatherText}
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
              disabled={saving || !canMark}
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
        placeholder={isUrdu ? "اختیاری نوٹ" : "Optional note"}
        disabled={saving || !canMark}
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
