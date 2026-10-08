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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";
import {
  getMadrassaAttendanceRoster,
  markMadrassaAttendance,
} from "@/components/attendance/attendance-api";
import { AttendanceMarker } from "@/components/attendance/attendance-marker";
import type {
  AttendanceMarkRow,
  AttendanceRosterPayload,
  AttendanceStatus,
} from "@/components/attendance/attendance-types";

type InstitutionOption = {
  id: string;
  name: string;
  nameUrdu: string;
};

type MadrassaCategory = {
  id: string;
  name: string;
  nameUrdu: string;
  subcategories: Array<{
    id: string;
    name: string;
    nameUrdu: string;
  }>;
};

export const Route = createFileRoute("/_authenticated/madrassa/attendance")({
  component: MadrassaAttendancePage,
});

function MadrassaAttendancePage() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [categories, setCategories] = useState<MadrassaCategory[]>([]);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [date, setDate] = useState(todayStr);

  const [roster, setRoster] = useState<AttendanceRosterPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/academic/institutions", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const list: InstitutionOption[] = d.institutions ?? [];
          setInstitutions(list);
          if (list[0]?.id) setInstitutionId(list[0].id);
        }),
      fetch("/api/academic/madrassa/categories", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const cats: MadrassaCategory[] = d.categories ?? [];
          setCategories(cats);
          const firstSub = cats.flatMap((c) => c.subcategories)[0]?.id;
          if (firstSub) setSubcategoryId(firstSub);
        }),
    ]).catch(() => {});
  }, []);

  const loadRoster = useCallback(async () => {
    if (!institutionId || !subcategoryId) return;
    setLoading(true);
    try {
      const data = await getMadrassaAttendanceRoster({
        date,
        institutionId,
        subcategoryId,
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
      toast.error(err instanceof Error ? err.message : "Could not load madrassa roster");
      setRoster(null);
    } finally {
      setLoading(false);
    }
  }, [date, institutionId, subcategoryId]);

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
    if (!institutionId || !subcategoryId || !roster) return;
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

      await markMadrassaAttendance({
        date,
        institutionId,
        subcategoryId,
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

  const currentSub = categories
    .flatMap((c) => c.subcategories.map((s) => ({ ...s, categoryName: c.name, categoryNameUrdu: c.nameUrdu })))
    .find((s) => s.id === subcategoryId);

  const darjaLabel = currentSub
    ? isUrdu
      ? `${currentSub.categoryNameUrdu || currentSub.categoryName} · ${currentSub.nameUrdu || currentSub.name}`
      : `${currentSub.categoryName} · ${currentSub.name}`
    : "Madrassa Attendance";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Madrassa Attendance"
        titleUrdu="حاضری — مدرسہ"
        description="Daily darja attendance marking. Attendance is taken once daily by the designated 1st period teacher."
        descriptionUrdu="روزانہ درجات کی حاضری۔ روزانہ حاضری صرف پہلے پیریڈ کا متعین استاد ایک بار لگا سکتا ہے۔"
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
              {isUrdu ? "ادارہ" : "Institution"}
            </label>
            <Select value={institutionId} onValueChange={setInstitutionId}>
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder={isUrdu ? "ادارہ منتخب کریں" : "Select institution"} />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    <span className={cn(isUrdu && "font-urdu")}>
                      {isUrdu ? (i.nameUrdu || i.name) : i.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={cn("text-xs text-muted-foreground", isUrdu && "font-urdu")}>
              {isUrdu ? "درجہ (شعبہ)" : "Darja (Subcategory)"}
            </label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId}>
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder={isUrdu ? "درجہ منتخب کریں" : "Select darja"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {categories.map((cat) => (
                  <SelectGroup key={cat.id}>
                    <SelectLabel className={cn("text-xs font-semibold text-primary/80 px-2 py-1 bg-muted/40", isUrdu && "font-urdu")}>
                      {isUrdu ? (cat.nameUrdu || cat.name) : cat.name}
                    </SelectLabel>
                    {cat.subcategories.map((sub) => {
                      const subPrimary = isUrdu ? (sub.nameUrdu || sub.name) : (sub.name || sub.nameUrdu);
                      const subSecondary = isUrdu
                        ? (sub.name && sub.name !== sub.nameUrdu ? sub.name : null)
                        : (sub.nameUrdu && sub.nameUrdu !== sub.name ? sub.nameUrdu : null);

                      return (
                        <SelectItem key={sub.id} value={sub.id}>
                          <span className={cn(isUrdu && "font-urdu")}>{subPrimary}</span>
                          {subSecondary && (
                            <span className={cn("text-muted-foreground ms-2 text-xs", !isUrdu && "font-urdu")}>
                              ({subSecondary})
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
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
        title={darjaLabel}
        subtitle={
          isUrdu
            ? `تاریخ: ${date} · مدرسہ نظام`
            : `Date: ${date} · Madrassa System`
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
