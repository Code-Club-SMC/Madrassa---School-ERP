import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StudentProfilePayload } from "@/components/students/student-types";

type Props = {
  profile: StudentProfilePayload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved: () => Promise<void> | void;
};

type InstitutionOption = {
  id: string;
  name: string;
  nameUrdu: string;
  section: string | null;
  active: boolean;
};

type ProgramOption = {
  id: string;
  institutionId: string;
  name: string;
  nameUrdu: string;
  system: "school" | "school_support" | "madrassa";
  active: boolean;
};

type SchoolClassOption = {
  id: string;
  name: string;
  nameUrdu: string;
  active: boolean;
  sections: Array<{ id: string; name: string; active: boolean }>;
};

type MadrassaCategoryOption = {
  id: string;
  name: string;
  nameUrdu: string;
  active: boolean;
  subcategories: Array<{
    id: string;
    name: string;
    nameUrdu: string;
    darja: string | null;
    active: boolean;
  }>;
};

const NO_SECTION = "__none";
const SCHOOL_SUPPORT_CLASS_IDS = new Set(["nursery", "kg", "c1", "c2", "c3", "c4", "c5"]);

export function MoveEnrollmentDialog({ profile, open, onOpenChange, onMoved }: Props) {
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClassOption[]>([]);
  const [madrassaCategories, setMadrassaCategories] = useState<MadrassaCategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [institutionId, setInstitutionId] = useState("");
  const [programId, setProgramId] = useState("");
  const [schoolClassId, setSchoolClassId] = useState("");
  const [schoolSectionId, setSchoolSectionId] = useState("");
  const [madrassaSubcategoryId, setMadrassaSubcategoryId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentEnrollment = useMemo(
    () => profile.enrollments.find((item) => item.endedAt === null) ?? profile.enrollments[0],
    [profile.enrollments],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadOptions() {
      setLoading(true);
      try {
        const [institutionResponse, programResponse, classResponse, categoryResponse] = await Promise.all([
          fetch("/api/academic/institutions", { credentials: "include" }),
          fetch("/api/academic/programs", { credentials: "include" }),
          fetch("/api/academic/school/classes", { credentials: "include" }),
          fetch("/api/academic/madrassa/categories", { credentials: "include" }),
        ]);

        const [institutionPayload, programPayload, classPayload, categoryPayload] = await Promise.all([
          institutionResponse.json().catch(() => ({})),
          programResponse.json().catch(() => ({})),
          classResponse.json().catch(() => ({})),
          categoryResponse.json().catch(() => ({})),
        ]);

        if (!institutionResponse.ok) throw new Error(institutionPayload.error || "Could not load institutions");
        if (!programResponse.ok) throw new Error(programPayload.error || "Could not load programs");
        if (!classResponse.ok) throw new Error(classPayload.error || "Could not load school classes");
        if (!categoryResponse.ok) throw new Error(categoryPayload.error || "Could not load madrassa categories");

        if (!cancelled) {
          setInstitutions(institutionPayload.institutions ?? []);
          setPrograms(programPayload.programs ?? []);
          setSchoolClasses(classPayload.classes ?? []);
          setMadrassaCategories(categoryPayload.categories ?? []);
        }
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Could not load academic options");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !currentEnrollment) return;
    setInstitutionId(currentEnrollment.institutionId);
    setProgramId(currentEnrollment.programId);
    setSchoolClassId(currentEnrollment.schoolClassId ?? "");
    setSchoolSectionId(currentEnrollment.schoolSectionId ?? "");
    setMadrassaSubcategoryId(currentEnrollment.madrassaSubcategoryId ?? "");
    setReason("");
  }, [currentEnrollment, open]);

  const selectedProgram = programs.find((program) => program.id === programId);
  const selectedProgramSystem =
    selectedProgram?.system ?? (programId === currentEnrollment?.programId ? currentEnrollment?.programSystem : undefined);
  const isMadrassa = selectedProgramSystem === "madrassa";
  const hasProgram = Boolean(programId && selectedProgramSystem);

  const availableInstitutions = institutions.filter((institution) => institution.active);
  const availablePrograms = programs.filter((program) => program.institutionId === institutionId && program.active);
  const availableSchoolClasses = schoolClasses.filter((schoolClass) => {
    if (!schoolClass.active) return false;
    if (selectedProgram?.system !== "school_support") return true;
    return SCHOOL_SUPPORT_CLASS_IDS.has(schoolClass.id);
  });
  const availableSubcategories = madrassaCategories.flatMap((category) =>
    category.subcategories
      .filter((subcategory) => category.active && subcategory.active)
      .map((subcategory) => ({
        ...subcategory,
        categoryName: category.name,
        categoryNameUrdu: category.nameUrdu,
      })),
  );
  const selectedClass = schoolClasses.find((schoolClass) => schoolClass.id === schoolClassId);
  const availableSections = selectedClass?.sections.filter((section) => section.active) ?? [];

  const canSubmit =
    Boolean(currentEnrollment) &&
    Boolean(institutionId) &&
    Boolean(programId) &&
    (isMadrassa ? Boolean(madrassaSubcategoryId) : Boolean(schoolClassId)) &&
    Boolean(reason.trim()) &&
    !loading &&
    !submitting;

  function handleInstitutionChange(value: string) {
    setInstitutionId(value);
    setProgramId("");
    setSchoolClassId("");
    setSchoolSectionId("");
    setMadrassaSubcategoryId("");
  }

  function handleProgramChange(value: string) {
    const program = programs.find((item) => item.id === value);
    setProgramId(value);
    setSchoolClassId("");
    setSchoolSectionId("");
    setMadrassaSubcategoryId("");

    if (program?.system === "madrassa") {
      setSchoolClassId("");
      setSchoolSectionId("");
    } else {
      setMadrassaSubcategoryId("");
    }
  }

  async function submitMove() {
    if (!currentEnrollment || !canSubmit) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/students/${profile.student.id}/enrollments/move`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enrollmentId: currentEnrollment.id,
          institutionId,
          programId,
          schoolClassId: isMadrassa ? null : schoolClassId || null,
          schoolSectionId: isMadrassa ? null : schoolSectionId || null,
          madrassaSubcategoryId: isMadrassa ? madrassaSubcategoryId || null : null,
          reason: reason.trim(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not move enrollment");

      toast.success("Enrollment moved", { description: "Academic placement updated." });
      await onMoved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not move enrollment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog
      title="Move Enrollment"
      description="Update the student's current academic placement and record the reason."
      open={open}
      onOpenChange={onOpenChange}
      icon={ArrowRightLeft}
      className="sm:max-w-[680px]"
    >
      <div className="max-h-[calc(100vh-9rem)] space-y-5 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
        {currentEnrollment ? (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground">Current placement</p>
            <p className="mt-1 font-medium">{currentEnrollment.institutionName}</p>
            <p className="text-xs text-muted-foreground">
              {currentEnrollment.programName} /{" "}
              {currentEnrollment.schoolClassName ?? currentEnrollment.madrassaSubcategoryName ?? "No class selected"}
              {currentEnrollment.schoolSectionName ? ` / ${currentEnrollment.schoolSectionName}` : ""}
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            No enrollment is available to move.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Institution">
            <Select value={institutionId} onValueChange={handleInstitutionChange} disabled={loading || submitting}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading institutions..." : "Select institution"} />
              </SelectTrigger>
              <SelectContent>
                {availableInstitutions.map((institution) => (
                  <SelectItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Program">
            <Select value={programId} onValueChange={handleProgramChange} disabled={!institutionId || loading || submitting}>
              <SelectTrigger>
                <SelectValue placeholder={institutionId ? "Select program" : "Select institution first"} />
              </SelectTrigger>
              <SelectContent>
                {availablePrograms.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {isMadrassa ? (
            <Field label="Madrassa subcategory">
              <Select
                value={madrassaSubcategoryId}
                onValueChange={setMadrassaSubcategoryId}
                disabled={!hasProgram || loading || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={hasProgram ? "Select darja" : "Select program first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name} ({subcategory.categoryName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <>
              <Field label="School class">
                <Select
                  value={schoolClassId}
                  onValueChange={(value) => {
                    setSchoolClassId(value);
                    setSchoolSectionId("");
                  }}
                  disabled={!hasProgram || loading || submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={hasProgram ? "Select class" : "Select program first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSchoolClasses.map((schoolClass) => (
                      <SelectItem key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Section">
                <Select
                  value={schoolSectionId || NO_SECTION}
                  onValueChange={(value) => setSchoolSectionId(value === NO_SECTION ? "" : value)}
                  disabled={!schoolClassId || loading || submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={schoolClassId ? "Select section" : "Select class first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SECTION}>No section</SelectItem>
                    {availableSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
        </div>

        <Field label="Reason">
          <Textarea
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason for moving this enrollment"
            disabled={submitting}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submitMove} disabled={!canSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Moving..." : "Move Enrollment"}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
