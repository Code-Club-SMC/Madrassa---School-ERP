import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, Loader2, Plus, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTeacherTimetablePeriod,
  setTeacherTimetablePeriodActive,
} from "./teacher-api";
import type { TeacherAssignment, TeacherDetail, TeacherTimetablePeriod } from "./teacher-types";

type Props = {
  teacher: TeacherDetail;
  onChange: (teacher: TeacherDetail) => void;
};

const weekdays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function TeacherTimetableManager({ teacher, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState("");
  const [weekday, setWeekday] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [disablePeriod, setDisablePeriod] = useState<TeacherTimetablePeriod | null>(null);

  const activeAssignments = useMemo(
    () => teacher.assignments.filter((assignment) => assignment.active),
    [teacher.assignments],
  );

  const selectedAssignment = activeAssignments.find((assignment) => assignment.id === assignmentId);

  const periodsByDay = useMemo(
    () =>
      weekdays.map((day) => ({
        ...day,
        periods: teacher.timetable
          .filter((period) => period.weekday === day.value)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      })),
    [teacher.timetable],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAssignment) {
      toast.error("Select an active assignment");
      return;
    }

    const form = new FormData(event.currentTarget);
    const startTime = String(form.get("startTime") ?? "");
    const endTime = String(form.get("endTime") ?? "");
    if (!startTime || !endTime || startTime >= endTime) {
      toast.error("Start time must be before end time");
      return;
    }

    setSubmitting(true);
    try {
      const nextTeacher = await createTeacherTimetablePeriod(teacher.profile.id, {
        assignmentId: selectedAssignment.id,
        system: selectedAssignment.system,
        institutionId: selectedAssignment.institutionId,
        programId: selectedAssignment.programId,
        schoolClassId: selectedAssignment.schoolClassId,
        schoolSectionId: selectedAssignment.schoolSectionId,
        madrassaCategoryId: selectedAssignment.madrassaCategoryId,
        madrassaSubcategoryId: selectedAssignment.madrassaSubcategoryId,
        subjectId: selectedAssignment.subjectId,
        academicYear: selectedAssignment.academicYear,
        weekday: Number(weekday),
        startTime,
        endTime,
        room: optional(form.get("room")),
      });
      onChange(nextTeacher);
      toast.success("Timetable period added");
      event.currentTarget.reset();
      setAssignmentId("");
      setWeekday("1");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add timetable period");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDisable() {
    if (!disablePeriod) return;
    setSubmitting(true);
    try {
      const nextTeacher = await setTeacherTimetablePeriodActive(
        teacher.profile.id,
        disablePeriod.id,
        false,
      );
      onChange(nextTeacher);
      toast.success("Timetable period disabled");
      setDisablePeriod(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disable timetable period");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Timetable</h2>
          <p className="text-sm text-muted-foreground">
            {teacher.timetable.filter((period) => period.active).length} active periods
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)} disabled={activeAssignments.length === 0}>
          <Plus className="h-4 w-4" />
          Add Period
        </Button>
      </div>

      {teacher.timetable.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            heading="No timetable periods"
            headingUrdu="کوئی پیریڈ نہیں"
            description="Add an assignment first, then create timetable periods from it."
          />
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {periodsByDay.map((day) => (
            <Card key={day.value} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{day.label}</h3>
                <Badge variant="outline">{day.periods.length}</Badge>
              </div>
              {day.periods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No periods</p>
              ) : (
                <div className="space-y-2">
                  {day.periods.map((period) => (
                    <div key={period.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold">
                              {period.startTime} - {period.endTime}
                            </span>
                            <StatusBadge status={period.active ? "active" : "inactive"} showUrdu={false} />
                          </div>
                          <p className="mt-1 truncate text-sm">{periodLabel(period)}</p>
                          <p className="text-xs text-muted-foreground">
                            {period.room ? `Room ${period.room}` : "No room"} · {period.academicYear}
                          </p>
                        </div>
                        {period.active && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setDisablePeriod(period)}
                            aria-label="Disable period"
                          >
                            <PowerOff className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Add Timetable Period"
        description="Create a timetable period from an active teacher assignment."
        icon={CalendarClock}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-1">
          <Field label="Assignment">
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignment" />
              </SelectTrigger>
              <SelectContent>
                {activeAssignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignmentLabel(assignment)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Weekday">
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekdays.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Start">
              <Input name="startTime" type="time" required />
            </Field>
            <Field label="End">
              <Input name="endTime" type="time" required />
            </Field>
          </div>
          <Field label="Room / location">
            <Input name="room" placeholder="Room 4" />
          </Field>
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Period
            </Button>
          </div>
        </form>
      </ResponsiveDialog>

      <AlertDialog open={!!disablePeriod} onOpenChange={(open) => !open && setDisablePeriod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable timetable period?</AlertDialogTitle>
            <AlertDialogDescription>
              This keeps the timetable record for history but removes it from the active schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDisable()} disabled={submitting}>
              {submitting ? "Disabling..." : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function assignmentLabel(assignment: TeacherAssignment) {
  const placement =
    assignment.system === "school"
      ? `${assignment.schoolClassId ?? "class"} / ${assignment.schoolSectionId ?? "section"}`
      : `${assignment.madrassaCategoryId ?? "category"} / ${assignment.madrassaSubcategoryId ?? "darja"}`;
  return `${assignment.system} · ${placement} · ${assignment.academicYear}`;
}

function periodLabel(period: TeacherTimetablePeriod) {
  const placement =
    period.system === "school"
      ? `${period.schoolClassId ?? "class"} / ${period.schoolSectionId ?? "section"}`
      : `${period.madrassaCategoryId ?? "category"} / ${period.madrassaSubcategoryId ?? "darja"}`;
  return `${period.system} · ${placement}`;
}
