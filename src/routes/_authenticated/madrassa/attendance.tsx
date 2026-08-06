import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Landmark } from "lucide-react";
import { toast } from "sonner";
import {
  getMadrassaAttendanceRoster,
  markMadrassaAttendance,
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

export const Route = createFileRoute("/_authenticated/madrassa/attendance")({
  component: AttendancePage,
});

type InstitutionOption = {
  id: string;
  name: string;
  nameUrdu: string;
  system: string;
  section: string | null;
  active: boolean;
};

type MadrassaSubcategoryOption = {
  id: string;
  categoryId: string;
  name: string;
  nameUrdu: string;
  darja: string | null;
  active: boolean;
  enrollmentCount: number;
  qasmiaCount: number;
  zainabCount: number;
};

type MadrassaCategoryOption = {
  id: string;
  name: string;
  nameUrdu: string;
  active: boolean;
  subcategories: MadrassaSubcategoryOption[];
};

type InstitutionsPayload = {
  institutions?: InstitutionOption[];
  error?: string;
};

type MadrassaCategoriesPayload = {
  categories?: MadrassaCategoryOption[];
  error?: string;
};

const today = formatLocalDate(new Date());

function AttendancePage() {
  const [date, setDate] = useState(today);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [categories, setCategories] = useState<MadrassaCategoryOption[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roster, setRoster] = useState<AttendanceRosterPayload | null>(null);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const madrassaInstitutions = useMemo(
    () => institutions.filter((item) => item.active && item.system === "madrassa"),
    [institutions],
  );
  const subcategoryOptions = useMemo(
    () =>
      categories.flatMap((category) =>
        category.subcategories
          .filter((subcategory) => category.active && subcategory.active)
          .map((subcategory) => ({
            ...subcategory,
            categoryName: category.name,
            categoryNameUrdu: category.nameUrdu,
          })),
      ),
    [categories],
  );
  const selectedInstitution = useMemo(
    () => madrassaInstitutions.find((item) => item.id === institutionId) ?? null,
    [institutionId, madrassaInstitutions],
  );
  const selectedSubcategory = useMemo(
    () => subcategoryOptions.find((item) => item.id === subcategoryId) ?? null,
    [subcategoryId, subcategoryOptions],
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

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [institutionPayload, categoryPayload] = await Promise.all([
        requestJson<InstitutionsPayload>("/api/academic/institutions"),
        requestJson<MadrassaCategoriesPayload>("/api/academic/madrassa/categories"),
      ]);

      const nextInstitutions = institutionPayload.institutions ?? [];
      const nextCategories = categoryPayload.categories ?? [];
      const nextMadrassaInstitutions = nextInstitutions.filter(
        (item) => item.active && item.system === "madrassa",
      );
      const nextSubcategories = nextCategories.flatMap((category) =>
        category.subcategories.filter((subcategory) => category.active && subcategory.active),
      );

      setInstitutions(nextInstitutions);
      setCategories(nextCategories);
      setInstitutionId((current) => {
        if (current && nextMadrassaInstitutions.some((item) => item.id === current)) return current;
        return nextMadrassaInstitutions[0]?.id ?? "";
      });
      setSubcategoryId((current) => {
        if (current && nextSubcategories.some((item) => item.id === current)) return current;
        return nextSubcategories[0]?.id ?? "";
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load madrassa options");
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!date || !institutionId || !subcategoryId) {
      setRoster(null);
      setMarks({});
      setNotes({});
      return;
    }

    let cancelled = false;

    async function loadRoster() {
      setLoadingRoster(true);
      try {
        const payload = await getMadrassaAttendanceRoster({ date, institutionId, subcategoryId });
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
  }, [date, initializeMarks, institutionId, subcategoryId]);

  const markerTitle =
    selectedInstitution && selectedSubcategory
      ? `${selectedInstitution.name} - ${selectedSubcategory.name}`
      : "Madrassa Attendance";
  const markerSubtitle =
    selectedInstitution && selectedSubcategory
      ? `${selectedInstitution.nameUrdu} · ${selectedSubcategory.nameUrdu} · ${date} · ${institutionCountLabel(
          selectedInstitution.id,
          selectedSubcategory,
        )}`
      : "Select a madrassa and darja to load students.";

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
    if (!roster || !institutionId || !subcategoryId) return;

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
      const payload = await markMadrassaAttendance({ date, institutionId, subcategoryId, rows });
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
        title="Madrassa Attendance"
        titleUrdu="مدرسہ کی حاضری"
        description="Mark daily attendance from active madrassa enrollments."
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(160px,220px)_minmax(220px,1fr)_minmax(220px,1fr)]">
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Date
            </Label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Landmark className="h-3.5 w-3.5" />
              Madrassa
            </Label>
            <Select
              value={institutionId}
              onValueChange={setInstitutionId}
              disabled={loadingOptions || madrassaInstitutions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingOptions ? "Loading madrassas..." : "Select madrassa"} />
              </SelectTrigger>
              <SelectContent>
                {madrassaInstitutions.map((institution) => (
                  <SelectItem key={institution.id} value={institution.id}>
                    <span className="font-urdu">{institution.nameUrdu}</span>
                    <span className="ms-2 text-xs text-muted-foreground">{institution.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Darja
            </Label>
            <Select
              value={subcategoryId}
              onValueChange={setSubcategoryId}
              disabled={loadingOptions || subcategoryOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingOptions ? "Loading darjat..." : "Select darja"} />
              </SelectTrigger>
              <SelectContent>
                {subcategoryOptions.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    <span className="font-urdu">{subcategory.nameUrdu}</span>
                    <span className="ms-2 text-xs text-muted-foreground">
                      {subcategory.categoryName} · {subcategory.name}
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

function institutionCountLabel(
  institutionId: string,
  subcategory: MadrassaSubcategoryOption,
) {
  if (institutionId === "jamia_qasmia_baneen") return `${subcategory.qasmiaCount} active enrollments`;
  if (institutionId === "jamia_zainab_banat") return `${subcategory.zainabCount} active enrollments`;
  return `${subcategory.enrollmentCount} active enrollments`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
