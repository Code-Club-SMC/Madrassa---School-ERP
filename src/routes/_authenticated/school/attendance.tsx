import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import {
  getSchoolAttendanceRoster,
  markSchoolAttendance,
} from "@/components/attendance/attendance-api";
import { AttendanceMarker } from "@/components/attendance/attendance-marker";
import type {
  AttendanceRosterPayload,
  AttendanceStatus,
} from "@/components/attendance/attendance-types";
import { PageHeader } from "@/components/shared/page-header";
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

export const Route = createFileRoute("/_authenticated/school/attendance")({
  component: AttendancePage,
});

type SchoolSectionOption = {
  id: string;
  classId: string;
  name: string;
  active: boolean;
  enrollmentCount: number;
};

type SchoolClassOption = {
  id: string;
  name: string;
  nameUrdu: string;
  active: boolean;
  enrollmentCount: number;
  sections: SchoolSectionOption[];
};

type SchoolClassesPayload = {
  classes?: SchoolClassOption[];
  error?: string;
};

const today = formatLocalDate(new Date());

function AttendancePage() {
  const [date, setDate] = useState(today);
  const [classes, setClasses] = useState<SchoolClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roster, setRoster] = useState<AttendanceRosterPayload | null>(null);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const activeClasses = useMemo(() => classes.filter((item) => item.active), [classes]);
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId) ?? null,
    [classId, classes],
  );
  const availableSections = useMemo(
    () => selectedClass?.sections.filter((section) => section.active) ?? [],
    [selectedClass],
  );
  const selectedSection = useMemo(
    () => availableSections.find((section) => section.id === sectionId) ?? null,
    [availableSections, sectionId],
  );

  const initializeMarks = useCallback((payload: AttendanceRosterPayload) => {
    const nextMarks: Record<string, AttendanceStatus> = {};
    const nextNotes: Record<string, string> = {};

    for (const student of payload.students) {
      if (!student.attendance) continue;
      nextMarks[student.id] = student.attendance.status;
      if (student.attendance.notes) nextNotes[student.id] = student.attendance.notes;
    }

    setMarks(nextMarks);
    setNotes(nextNotes);
  }, []);

  const loadClasses = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const payload = await requestJson<SchoolClassesPayload>("/api/academic/school/classes");
      const nextClasses = payload.classes ?? [];
      setClasses(nextClasses);
      setClassId((current) => {
        if (current && nextClasses.some((item) => item.id === current && item.active)) return current;
        return nextClasses.find((item) => item.active)?.id ?? "";
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load school classes");
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    setSectionId((current) => {
      if (current && availableSections.some((section) => section.id === current)) return current;
      return availableSections[0]?.id ?? "";
    });
  }, [availableSections]);

  useEffect(() => {
    if (!date || !classId || !sectionId) {
      setRoster(null);
      setMarks({});
      setNotes({});
      return;
    }

    let cancelled = false;

    async function loadRoster() {
      setLoadingRoster(true);
      try {
        const payload = await getSchoolAttendanceRoster({ date, classId, sectionId });
        if (cancelled) return;
        setRoster(payload);
        initializeMarks(payload);
      } catch (error) {
        if (!cancelled) {
          setRoster(null);
          setMarks({});
          setNotes({});
          toast.error(error instanceof Error ? error.message : "Could not load attendance roster");
        }
      } finally {
        if (!cancelled) setLoadingRoster(false);
      }
    }

    void loadRoster();

    return () => {
      cancelled = true;
    };
  }, [classId, date, initializeMarks, sectionId]);

  const markerTitle = selectedClass
    ? `${selectedClass.name} ${selectedSection ? `- Section ${selectedSection.name}` : ""}`
    : "School Attendance";
  const markerSubtitle = selectedClass
    ? `${selectedClass.nameUrdu} · ${date} · ${selectedSection?.enrollmentCount ?? 0} active enrollments`
    : "Select a class and section to load students.";

  function handleClassChange(nextClassId: string) {
    const nextClass = classes.find((item) => item.id === nextClassId);
    const nextSection = nextClass?.sections.find((section) => section.active);
    setClassId(nextClassId);
    setSectionId(nextSection?.id ?? "");
  }

  function handleMarkAllPresent() {
    if (!roster) return;
    const nextMarks: Record<string, AttendanceStatus> = {};
    for (const student of roster.students) nextMarks[student.id] = "present";
    setMarks(nextMarks);
  }

  function handleClear() {
    setMarks({});
    setNotes({});
  }

  function handleSetStatus(studentId: string, status: AttendanceStatus) {
    setMarks((current) => ({ ...current, [studentId]: status }));
  }

  function handleSetNote(studentId: string, note: string) {
    setNotes((current) => ({ ...current, [studentId]: note }));
  }

  async function handleSave() {
    if (!roster || !classId || !sectionId) return;

    const rows = roster.students
      .map((student) => {
        const status = marks[student.id];
        if (!status) return null;

        return {
          studentId: student.id,
          enrollmentId: student.enrollmentId,
          status,
          notes: notes[student.id]?.trim() || undefined,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length === 0) {
      toast.error("Mark at least one student before saving");
      return;
    }

    setSaving(true);
    try {
      const payload = await markSchoolAttendance({ date, classId, sectionId, rows });
      setRoster(payload);
      initializeMarks(payload);
      toast.success("Attendance saved", {
        description: `${payload.summary.marked}/${payload.summary.total} students marked`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="School Attendance"
        titleUrdu="حاضری — اسکول"
        description="Mark daily attendance from active school enrollments."
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(160px,220px)_minmax(220px,1fr)_minmax(180px,260px)]">
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Date
            </Label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              Class
            </Label>
            <Select
              value={classId}
              onValueChange={handleClassChange}
              disabled={loadingOptions || activeClasses.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingOptions ? "Loading classes..." : "Select class"} />
              </SelectTrigger>
              <SelectContent>
                {activeClasses.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="font-urdu">{item.nameUrdu}</span>
                    <span className="ms-2 text-xs text-muted-foreground">
                      {item.name} · {item.enrollmentCount} students
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Section</Label>
            <Select
              value={sectionId}
              onValueChange={setSectionId}
              disabled={loadingOptions || availableSections.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedClass && availableSections.length === 0
                      ? "No active sections"
                      : "Select section"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    Section {section.name}
                    <span className="ms-2 text-xs text-muted-foreground">
                      {section.enrollmentCount} students
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <AttendanceMarker
        title={markerTitle}
        subtitle={markerSubtitle}
        roster={roster}
        loading={loadingOptions || loadingRoster}
        saving={saving}
        marks={marks}
        notes={notes}
        onSetStatus={handleSetStatus}
        onSetNote={handleSetNote}
        onMarkAllPresent={handleMarkAllPresent}
        onClear={handleClear}
        onSave={handleSave}
      />
    </div>
  );
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload as T;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
