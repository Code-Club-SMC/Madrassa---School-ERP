import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { BookOpen, Loader2, Plus, Trash2 } from "lucide-react";
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
  createTeacherAssignment,
  listAcademicOptions,
  listTeacherSubjects,
  setTeacherAssignmentActive,
} from "./teacher-api";
import type {
  ExamSubjectOption,
  TeacherAssignment,
  TeacherDetail,
  TeacherSystem,
} from "./teacher-types";

type AcademicOptions = Awaited<ReturnType<typeof listAcademicOptions>>;

type Props = {
  teacher: TeacherDetail;
  onChange: (teacher: TeacherDetail) => void;
};

const currentAcademicYear = String(new Date().getFullYear());

export function TeacherAssignmentManager({ teacher, onChange }: Props) {
  const [options, setOptions] = useState<AcademicOptions | null>(null);
  const [subjects, setSubjects] = useState<ExamSubjectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [system, setSystem] = useState<TeacherSystem>("school");
  const [institutionId, setInstitutionId] = useState("");
  const [programId, setProgramId] = useState("");
  const [schoolClassId, setSchoolClassId] = useState("");
  const [schoolSectionId, setSchoolSectionId] = useState("");
  const [madrassaCategoryId, setMadrassaCategoryId] = useState("");
  const [madrassaSubcategoryId, setMadrassaSubcategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("none");
  const [removeAssignment, setRemoveAssignment] = useState<TeacherAssignment | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingOptions(true);
    listAcademicOptions()
      .then((nextOptions) => {
        if (active) setOptions(nextOptions);
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load assignment options");
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const programs = useMemo(
    () =>
      (options?.programs ?? []).filter(
        (program) =>
          program.system === system &&
          (!institutionId || program.institutionId === institutionId) &&
          program.active !== false,
      ),
    [institutionId, options?.programs, system],
  );

  const selectedClass = useMemo(
    () => options?.schoolClasses.find((schoolClass) => schoolClass.id === schoolClassId),
    [options?.schoolClasses, schoolClassId],
  );

  const selectedCategory = useMemo(
    () => options?.madrassaCategories.find((category) => category.id === madrassaCategoryId),
    [madrassaCategoryId, options?.madrassaCategories],
  );

  useEffect(() => {
    let active = true;
    const canLoad =
      (system === "school" && !!schoolClassId) ||
      (system === "madrassa" && !!madrassaSubcategoryId);

    setSubjectId("none");
    if (!canLoad) {
      setSubjects([]);
      return;
    }

    listTeacherSubjects({
      system,
      schoolClassId: system === "school" ? schoolClassId : undefined,
      madrassaSubcategoryId: system === "madrassa" ? madrassaSubcategoryId : undefined,
    })
      .then((nextSubjects) => {
        if (active) setSubjects(nextSubjects);
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load subjects");
      });

    return () => {
      active = false;
    };
  }, [madrassaSubcategoryId, schoolClassId, system]);

  function resetPlacement(nextSystem: TeacherSystem) {
    setSystem(nextSystem);
    setInstitutionId("");
    setProgramId("");
    setSchoolClassId("");
    setSchoolSectionId("");
    setMadrassaCategoryId("");
    setMadrassaSubcategoryId("");
    setSubjectId("none");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!institutionId || !programId) {
      toast.error("Institution and program are required");
      return;
    }
    if (system === "school" && (!schoolClassId || !schoolSectionId)) {
      toast.error("Class and section are required");
      return;
    }
    if (system === "madrassa" && (!madrassaCategoryId || !madrassaSubcategoryId)) {
      toast.error("Category and darja are required");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const nextTeacher = await createTeacherAssignment(teacher.profile.id, {
        system,
        institutionId,
        programId,
        schoolClassId: system === "school" ? schoolClassId : null,
        schoolSectionId: system === "school" ? schoolSectionId : null,
        madrassaCategoryId: system === "madrassa" ? madrassaCategoryId : null,
        madrassaSubcategoryId: system === "madrassa" ? madrassaSubcategoryId : null,
        subjectId: subjectId === "none" ? null : subjectId,
        academicYear: String(form.get("academicYear") || currentAcademicYear),
        effectiveFrom: optional(form.get("effectiveFrom")),
        effectiveTo: optional(form.get("effectiveTo")),
      });
      onChange(nextTeacher);
      toast.success("Assignment added");
      event.currentTarget.reset();
      resetPlacement("school");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add assignment");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRemove() {
    if (!removeAssignment) return;
    setSubmitting(true);
    try {
      const nextTeacher = await setTeacherAssignmentActive(
        teacher.profile.id,
        removeAssignment.id,
        false,
      );
      onChange(nextTeacher);
      toast.success("Assignment removed");
      setRemoveAssignment(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove assignment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Assignments</h2>
          <p className="text-sm text-muted-foreground">
            {teacher.assignments.filter((assignment) => assignment.active).length} active
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Assignment
        </Button>
      </div>

      {teacher.assignments.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            heading="No assignments"
            headingUrdu="کوئی ذمہ داری نہیں"
            description="Assignments added here control teacher workload and attendance access."
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {teacher.assignments.map((assignment) => (
            <Card key={assignment.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{assignment.system}</Badge>
                    <StatusBadge status={assignment.active ? "active" : "inactive"} showUrdu={false} />
                    <span className="text-xs text-muted-foreground">{assignment.academicYear}</span>
                  </div>
                  <p className="text-sm font-medium">{placementLabel(assignment, options)}</p>
                  <p className="text-xs text-muted-foreground">
                    {subjectLabel(assignment.subjectId, subjects) ?? "No subject selected"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Effective {assignment.effectiveFrom ?? "now"} to {assignment.effectiveTo ?? "open ended"}
                  </p>
                </div>
                {assignment.active && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setRemoveAssignment(assignment)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Add Assignment"
        description="Assign this teacher to a school section or madrassa darja."
        icon={BookOpen}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-1">
          {loadingOptions ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
              Loading academic options...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="System">
                  <Select value={system} onValueChange={(value) => resetPlacement(value as TeacherSystem)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="madrassa">Madrassa</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Institution">
                  <Select value={institutionId} onValueChange={setInstitutionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {(options?.institutions ?? []).map((institution) => (
                        <SelectItem key={institution.id} value={institution.id}>
                          {institution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Program">
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {system === "school" ? (
                  <>
                    <Field label="Class">
                      <Select
                        value={schoolClassId}
                        onValueChange={(value) => {
                          setSchoolClassId(value);
                          setSchoolSectionId("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {(options?.schoolClasses ?? []).map((schoolClass) => (
                            <SelectItem key={schoolClass.id} value={schoolClass.id}>
                              {schoolClass.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Section">
                      <Select value={schoolSectionId} onValueChange={setSchoolSectionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedClass?.sections ?? []).map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Category">
                      <Select
                        value={madrassaCategoryId}
                        onValueChange={(value) => {
                          setMadrassaCategoryId(value);
                          setMadrassaSubcategoryId("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {(options?.madrassaCategories ?? []).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Darja">
                      <Select value={madrassaSubcategoryId} onValueChange={setMadrassaSubcategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select darja" />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedCategory?.subcategories ?? []).map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </>
                )}

                <Field label="Subject">
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subject</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.code} · {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Academic year">
                  <Input name="academicYear" defaultValue={currentAcademicYear} required />
                </Field>
                <Field label="Effective from">
                  <Input name="effectiveFrom" type="date" />
                </Field>
                <Field label="Effective to">
                  <Input name="effectiveTo" type="date" />
                </Field>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Assignment
                </Button>
              </div>
            </>
          )}
        </form>
      </ResponsiveDialog>

      <AlertDialog open={!!removeAssignment} onOpenChange={(open) => !open && setRemoveAssignment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the assignment inactive and disables timetable periods connected to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmRemove()} disabled={submitting}>
              {submitting ? "Removing..." : "Remove"}
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

function placementLabel(assignment: TeacherAssignment, options: AcademicOptions | null) {
  const institution = options?.institutions.find((item) => item.id === assignment.institutionId);
  const program = options?.programs.find((item) => item.id === assignment.programId);

  if (assignment.system === "school") {
    const schoolClass = options?.schoolClasses.find((item) => item.id === assignment.schoolClassId);
    const section = schoolClass?.sections.find((item) => item.id === assignment.schoolSectionId);
    return [institution?.name, program?.name, schoolClass?.name, section?.name].filter(Boolean).join(" · ");
  }

  const category = options?.madrassaCategories.find((item) => item.id === assignment.madrassaCategoryId);
  const subcategory = category?.subcategories?.find((item) => item.id === assignment.madrassaSubcategoryId);
  return [institution?.name, program?.name, category?.name, subcategory?.name].filter(Boolean).join(" · ");
}

function subjectLabel(subjectId: string | null, subjects: ExamSubjectOption[]) {
  if (!subjectId) return null;
  const subject = subjects.find((item) => item.id === subjectId);
  return subject ? `${subject.code} · ${subject.name}` : subjectId;
}
