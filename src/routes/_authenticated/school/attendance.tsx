import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Calendar, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";
import {
  getSchoolAttendanceRoster,
  markSchoolAttendance,
} from "@/components/attendance/attendance-api";
import { AttendanceMarker } from "@/components/attendance/attendance-marker";
import type {
  AttendanceMarkRow,
  AttendanceRosterPayload,
  AttendanceStatus,
} from "@/components/attendance/attendance-types";

type SchoolClassOption = {
  id: string;
  name: string;
  nameUrdu: string;
};

export const Route = createFileRoute("/_authenticated/school/attendance")({
  component: SchoolAttendancePage,
});

function SchoolAttendancePage() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [classes, setClasses] = useState<SchoolClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("A");
  const [date, setDate] = useState(todayStr);

  const [roster, setRoster] = useState<AttendanceRosterPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/academic/school/classes", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const list: SchoolClassOption[] = data.classes ?? [];
        setClasses(list);
        if (list[0]?.id) setClassId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadRoster = useCallback(async () => {
    if (!classId || !sectionId) return;
    setLoading(true);
    try {
      const data = await getSchoolAttendanceRoster({
        date,
        classId,
        sectionId,
      });
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
      toast.error(err instanceof Error ? err.message : "Could not load school roster");
      setRoster(null);
    } finally {
      setLoading(false);
    }
  }, [classId, date, sectionId]);

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
    if (!classId || !sectionId || !roster) return;
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

      await markSchoolAttendance({
        date,
        classId,
        sectionId,
        rows,
      });
      toast.success(isUrdu ? "حاضری کامیابی سے محفوظ ہو گئی" : "Attendance saved successfully");
      await loadRoster();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const currentClass = classes.find((c) => c.id === classId);
  const classLabel = currentClass
    ? isUrdu
      ? `${currentClass.nameUrdu || currentClass.name} · سیکشن ${sectionId}`
      : `${currentClass.name} · Section ${sectionId}`
    : "School Attendance";

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Attendance"
        titleUrdu="حاضری — اسکول"
        description="Daily student attendance marking. Attendance is taken once daily by the designated 1st period teacher."
        descriptionUrdu="روزانہ طلبہ کی حاضری۔ روزانہ حاضری صرف پہلے پیریڈ کا متعین استاد ایک بار لگا سکتا ہے۔"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports/attendance">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              {isUrdu ? "رپورٹس و تجزیات" : "Attendance Reports"}
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <div>
            <label className={cn("text-xs text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu ? "تاریخ" : "Date"}
            </label>
            <div className="relative mt-1">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className={cn("text-xs text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu ? "کلاس" : "Class"}
            </label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder={isUrdu ? "کلاس منتخب کریں" : "Select class"} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className={cn(isUrdu && "font-urdu")}>
                      {isUrdu ? (c.nameUrdu || c.name) : c.name}
                    </span>
                    {c.nameUrdu && c.nameUrdu !== c.name && (
                      <span className={cn("text-muted-foreground ms-2 text-xs", !isUrdu && "font-urdu")}>
                        ({isUrdu ? c.name : c.nameUrdu})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={cn("text-xs text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu ? "سیکشن" : "Section"}
            </label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="mt-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {isUrdu ? `سیکشن ${s}` : `Section ${s}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 w-full text-xs"
              onClick={() => void loadRoster()}
              disabled={loading}
            >
              {loading ? (isUrdu ? "لوڈ ہو رہا ہے..." : "Loading...") : (isUrdu ? "روستر تازہ کریں" : "Refresh Roster")}
            </Button>
          </div>
        </div>
      </Card>

      <AttendanceMarker
        title={classLabel}
        subtitle={
          isUrdu
            ? `تاریخ: ${date} · اسکول نظام`
            : `Date: ${date} · School System`
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
    </div>
  );
}
