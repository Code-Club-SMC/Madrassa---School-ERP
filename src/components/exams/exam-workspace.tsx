import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Calendar, ClipboardList, FileText, Grid3x3, Plus, Printer, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  createExamSession,
  createExamSubject,
  deleteExamSession,
  getExamReport,
  getExamSession,
  listExamSessions,
  listExamSubjects,
} from "@/components/exams/exam-api";
import type { ExamReportPayload, ExamSession, ExamSubject, ExamSystem } from "@/components/exams/exam-types";
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
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useSystem } from "@/components/system-context";

type InstitutionOption = {
  id: string;
  name: string;
  nameUrdu: string;
  system: string;
  active: boolean;
};

type ProgramOption = {
  id: string;
  institutionId: string;
  name: string;
  nameUrdu: string;
  system: string;
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
  subcategories: Array<{ id: string; name: string; nameUrdu: string; active: boolean; section?: string }>;
};

type AcademicOptions = {
  institutions: InstitutionOption[];
  programs: ProgramOption[];
  classes: SchoolClassOption[];
  categories: MadrassaCategoryOption[];
};

const emptyOptions: AcademicOptions = { institutions: [], programs: [], classes: [], categories: [] };

const statusTone: Record<string, string> = {
  draft: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300",
  active: "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300",
  locked: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  published:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
};

export function ExamSubjectWorkspace({ system }: { system: ExamSystem }) {
  const { gender } = useSystem();
  const [options, setOptions] = useState<AcademicOptions>(emptyOptions);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; systemScope: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    nameUrdu: "",
    group: "general",
    totalMarks: 100,
    passingMarks: 33,
    scopeId: "",
    teacherId: "",
  });

  const scopeSection = useMemo(() => {
    if (system !== "madrassa" || !form.scopeId) return null;
    for (const category of options.categories) {
      const subcategory = category.subcategories.find((s) => s.id === form.scopeId);
      if (subcategory) return subcategory.section ?? null;
    }
    return null;
  }, [system, form.scopeId, options.categories]);

  const allowedTeacherSystemScopes = useMemo(() => {
    const section = scopeSection ?? gender;
    if (section === "male") {
      if (system === "madrassa") {
        return new Set(["madrassa", "both", "all", "qasmia-madrassa", "qasmia-both", "qasmia-school", "school"]);
      }
      return new Set(["school", "both", "all", "qasmia-school", "qasmia-both", "qasmia-madrassa", "madrassa"]);
    }
    if (system === "madrassa") {
      return new Set(["madrassa", "both", "all", "zainab-madrassa", "zainab-both", "zainab-school", "school"]);
    }
    return new Set(["school", "both", "all", "zainab-school", "zainab-both", "zainab-madrassa", "madrassa"]);
  }, [system, gender, scopeSection]);

  const visibleTeachers = useMemo(() => {
    return teachers.filter((teacher) => allowedTeacherSystemScopes.has(teacher.systemScope));
  }, [teachers, allowedTeacherSystemScopes]);

  const loadOptions = useCallback(async () => {
    const next = await loadAcademicOptions();
    setOptions(next);
  }, [system]);

  const loadTeachers = useCallback(async () => {
    try {
      const response = await fetch("/api/teachers?all=true", { credentials: "include" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        console.error("[exam-workspace] teachers fetch failed", response.status, payload);
        setTeachers([]);
        return;
      }
      const data = await response.json();
      const list = Array.isArray(data)
        ? data.map((t: any) => ({ id: t.id, name: t.name, systemScope: t.systemScope }))
        : (data.teachers ?? []).map((t: any) => ({ id: t.id, name: t.name, systemScope: t.systemScope }));
      setTeachers(list);
    } catch {
      // ignore teacher load errors
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await listExamSubjects({
        system,
        schoolClassId: system === "school" ? form.scopeId || undefined : undefined,
        madrassaSubcategoryId: system === "madrassa" ? form.scopeId || undefined : undefined,
      });
      setSubjects(payload.subjects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load subjects");
    } finally {
      setLoading(false);
    }
  }, [system, form.scopeId]);

  useEffect(() => {
    void loadOptions().catch((error) => toast.error(error instanceof Error ? error.message : "Could not load options"));
  }, [loadOptions]);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  async function handleCreate() {
    const targetScopeId = form.scopeId;
    if (!targetScopeId) {
      toast.error(system === "school" ? "Select a class first" : "Select a darja first");
      return;
    }
    if (!form.code.trim() || !form.name.trim() || !form.nameUrdu.trim()) {
      toast.error("Code, name, and Urdu name are required");
      return;
    }

    try {
      await createExamSubject({
        system,
        schoolClassId: system === "school" ? targetScopeId : undefined,
        madrassaSubcategoryId: system === "madrassa" ? targetScopeId : undefined,
        code: form.code,
        name: form.name,
        nameUrdu: form.nameUrdu,
        group: form.group,
        totalMarks: form.totalMarks,
        passingMarks: form.passingMarks,
        displayOrder: subjects.length + 1,
        teacherId: form.teacherId || undefined,
      });
      toast.success("Subject created");
      setOpen(false);
      setForm({ code: "", name: "", nameUrdu: "", group: "general", totalMarks: 100, passingMarks: 33, scopeId: targetScopeId, teacherId: "" });
      await loadSubjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create subject");
    }
  }

  return (
    <div>
      <PageHeader
        title={system === "school" ? "School Subjects" : "Madrassa Subjects"}
        titleUrdu={system === "school" ? "اسکول کے مضامین" : "مدرسہ کے مضامین"}
        description="Subjects are scoped to the class or darja used by internal exams."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Select value={form.scopeId} onValueChange={(value) => setForm({ ...form, scopeId: value })}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue placeholder={system === "school" ? "All classes" : "All darjas"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{system === "school" ? "All Classes" : "All Darjas"}</SelectItem>
            {system === "school"
              ? options.classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.nameUrdu}
                  </SelectItem>
                ))
              : options.categories.flatMap((category) =>
                  category.subcategories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {category.name} · {item.name}
                    </SelectItem>
                  )),
                )}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-end">Marks</TableHead>
              <TableHead className="text-end">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">Loading subjects...</TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">No subjects configured for this scope.</TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => {
                const teacher = subject.teacherId ? teachers.find((t) => t.id === subject.teacherId) : null;
                return (
                  <TableRow key={subject.id}>
                    <TableCell>
                      <p className="font-medium">{subject.name}</p>
                      <p className="font-urdu text-sm text-muted-foreground">{subject.nameUrdu}</p>
                    </TableCell>
                    <TableCell className="font-mono">{subject.code}</TableCell>
                    <TableCell>{subject.group}</TableCell>
                    <TableCell>{teacher ? teacher.name : "-"}</TableCell>
                    <TableCell className="text-end font-mono">
                      {subject.totalMarks} / {subject.passingMarks}
                    </TableCell>
                    <TableCell className="text-end">
                      <Badge variant={subject.active ? "secondary" : "outline"}>{subject.active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <ResponsiveDialog
        title="Add Subject"
        description="Create a subject for the selected exam scope."
        open={open}
        onOpenChange={setOpen}
        icon={ClipboardList}
      >
        <div className="grid gap-4 p-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code">
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </Field>
            <Field label="Group">
              <Input value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Urdu Name">
              <Input dir="rtl" className="font-urdu" value={form.nameUrdu} onChange={(event) => setForm({ ...form, nameUrdu: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Total Marks">
              <Input type="number" value={form.totalMarks} onChange={(event) => setForm({ ...form, totalMarks: Number(event.target.value) })} />
            </Field>
            <Field label="Passing Marks">
              <Input type="number" value={form.passingMarks} onChange={(event) => setForm({ ...form, passingMarks: Number(event.target.value) })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={system === "school" ? "Class" : "Darja / Subcategory"}>
              <Select value={form.scopeId} onValueChange={(value) => setForm({ ...form, scopeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={system === "school" ? "Select class" : "Select darja"} />
                </SelectTrigger>
                <SelectContent>
                  {system === "school"
                    ? options.classes.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} · {item.nameUrdu}
                        </SelectItem>
                      ))
                    : options.categories.flatMap((category) =>
                        category.subcategories.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {category.name} · {item.name}
                          </SelectItem>
                        )),
                      )}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assigned Teacher">
              <Select value={form.teacherId} onValueChange={(value) => setForm({ ...form, teacherId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No teacher</SelectItem>
                  {visibleTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreate()}>Create</Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}

export function ExamWorkspace({ system }: { system: ExamSystem }) {
  const { gender } = useSystem();
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [options, setOptions] = useState<AcademicOptions>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExamSession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    examSystem: system,
    classId: "",
    sectionId: "",
    categoryId: "",
    subcategoryId: "",
    subjectId: "",
    type: system === "school" ? "quarterly" : "salanah",
    name: "",
    nameUrdu: "",
    startDate: "",
    endDate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const currentSystem = form.examSystem;
      const [examPayload, academicPayload] = await Promise.all([
        listExamSessions(currentSystem, currentSystem === "madrassa" ? gender : undefined),
        loadAcademicOptions(currentSystem === "madrassa" ? gender : undefined),
      ]);
      setExams(examPayload.exams);
      setOptions(academicPayload);
      setForm((current) => seedExamForm({ ...current, examSystem: currentSystem }, academicPayload, currentSystem));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load exams");
    } finally {
      setLoading(false);
    }
  }, [form.examSystem, gender]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExamSession(deleteTarget.id);
      toast.success("Exam deleted");
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete exam");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    const currentSystem = form.examSystem;
    const scopeId = currentSystem === "school" ? form.classId : form.subcategoryId;
    if (!scopeId || !form.name || !form.nameUrdu || !form.startDate || !form.endDate) {
      toast.error("Exam name, class/darja, and dates are required");
      return;
    }

    let subjectIds = [form.subjectId].filter(Boolean);
    if (subjectIds.length === 0) {
      try {
        const payload = await listExamSubjects({
          system: currentSystem,
          schoolClassId: currentSystem === "school" ? scopeId : undefined,
          madrassaSubcategoryId: currentSystem === "madrassa" ? scopeId : undefined,
          active: true,
        });
        subjectIds = payload.subjects.map((subject) => subject.id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load subjects for exam");
        return;
      }
    }

    try {
      await createExamSession({
        system: currentSystem,
        schoolClassId: currentSystem === "school" ? form.classId : undefined,
        schoolSectionId: currentSystem === "school" ? form.sectionId : undefined,
        madrassaCategoryId: currentSystem === "madrassa" ? form.categoryId : undefined,
        madrassaSubcategoryId: currentSystem === "madrassa" ? form.subcategoryId : undefined,
        subjectIds,
        type: form.type,
        name: form.name,
        nameUrdu: form.nameUrdu,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      toast.success("Exam created");
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create exam");
    }
  }

  const title = system === "school" ? "School Examinations" : "Madrassa Examinations";
  const titleUrdu = system === "school" ? "امتحانات — اسکول" : "امتحانات — مدرسہ";

  return (
    <div>
      <PageHeader
        title={title}
        titleUrdu={titleUrdu}
        description="Internal exam sessions, subjects, marks, DMCs, seating plans, and published results."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New Exam
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Card className="p-5 text-sm text-muted-foreground">Loading exams...</Card>
        ) : exams.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground">No exams have been created yet.</Card>
        ) : (
          exams.map((exam) => <ExamCard key={exam.id} exam={exam} onDelete={setDeleteTarget} />)
        )}
      </div>

      <ResponsiveDialog
        title="Create Exam"
        description="Create an internal exam from the selected academic scope."
        open={open}
        onOpenChange={setOpen}
        icon={ClipboardList}
        className="sm:max-w-3xl"
      >
        <div className="grid gap-4 p-1">
          <Field label="System">
            <RadioGroup
              value={form.examSystem}
              onValueChange={(value) => setForm({ ...form, examSystem: value as ExamSystem, classId: "", sectionId: "", categoryId: "", subcategoryId: "", subjectId: "" })}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="school" id="system-school" />
                <Label htmlFor="system-school" className="text-sm cursor-pointer">School</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="madrassa" id="system-madrassa" />
                <Label htmlFor="system-madrassa" className="text-sm cursor-pointer">Madrassa</Label>
              </div>
            </RadioGroup>
          </Field>

          {form.examSystem === "school" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Class">
                <Select value={form.classId} onValueChange={(value) => setForm({ ...form, classId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {options.classes.filter((item) => item.active).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Section">
                <Select value={form.sectionId} onValueChange={(value) => setForm({ ...form, sectionId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {options.classes.find((item) => item.id === form.classId)?.sections.filter((item) => item.active).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : (
              <Field label="Category">
                <RadioGroup
                  value={form.categoryId}
                  onValueChange={(value) => {
                    const firstSubcategory = options.categories.find((item) => item.id === value)?.subcategories.find((item) => item.active)?.id || "";
                    setForm({ ...form, categoryId: value, subcategoryId: firstSubcategory, subjectId: "" });
                  }}
                  className="flex flex-wrap gap-4"
                >
                  {options.categories.filter((item) => item.active).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <RadioGroupItem value={item.id} id={`category-${item.id}`} />
                      <Label htmlFor={`category-${item.id}`} className="text-sm cursor-pointer">
                        {item.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </Field>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Exam Name">
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Urdu Name">
              <Input dir="rtl" className="font-urdu" value={form.nameUrdu} onChange={(event) => setForm({ ...form, nameUrdu: event.target.value })} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(form.examSystem === "school" ? ["monthly", "quarterly", "halfyearly", "annual"] : ["sahmahi", "salanah"]).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start">
                <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              </Field>
              <Field label="End">
                <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreate()}>Create Exam</Button>
          </div>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone and will remove all associated marks, results, and seating data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ExamDetailWorkspace({ examId, system }: { examId: string; system: ExamSystem }) {
  const [exam, setExam] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getExamSession(examId)
      .then((payload) => {
        if (!cancelled) setExam(payload.exam);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Could not load exam");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [examId]);

  if (loading) return <Card className="p-6 text-sm text-muted-foreground">Loading exam...</Card>;
  if (!exam) return <Card className="p-6 text-sm text-destructive">Exam not found.</Card>;

  return (
    <div>
      <BackLink system={system} examId={examId} />
      <PageHeader
        title={exam.name}
        titleUrdu={exam.nameUrdu}
        description={`${exam.groupLabel} · ${formatDate(exam.startDate)} - ${formatDate(exam.endDate)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print Date Sheet
            </Button>
            <ExamActionLinks exam={exam} />
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Calendar} label="Dates" value={`${formatDate(exam.startDate)} - ${formatDate(exam.endDate)}`} />
        <Stat icon={Grid3x3} label="Subjects" value={String(exam.subjects.length)} />
        <Stat icon={Users} label="Students" value={String(exam.studentCount)} />
        <Stat icon={FileText} label="Status" value={exam.status} />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-end">Marks</TableHead>
              <TableHead className="text-end">Lock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exam.subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>
                  <p className="font-medium">{subject.name}</p>
                  <p className="font-urdu text-sm text-muted-foreground">{subject.nameUrdu}</p>
                </TableCell>
                <TableCell>{subject.examDate ? formatDate(subject.examDate) : "-"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {[subject.startTime, subject.endTime].filter(Boolean).join(" - ") || "-"}
                </TableCell>
                <TableCell className="text-end font-mono">
                  {subject.totalMarks} / {subject.passingMarks}
                </TableCell>
                <TableCell className="text-end">
                  <Badge variant={subject.locked ? "secondary" : "outline"}>{subject.locked ? "Locked" : "Open"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export function ExamReportWorkspace() {
  const [system, setSystem] = useState<ExamSystem | "both">("both");
  const [report, setReport] = useState<ExamReportPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await getExamReport({ system }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load exam report");
    } finally {
      setLoading(false);
    }
  }, [system]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Exam Results Report"
        titleUrdu="نتائج کی رپورٹ"
        description="Published internal exam results, positions, fail list, and grade distribution."
        actions={
          <div className="flex gap-2">
            <Select value={system} onValueChange={(value) => setSystem(value as ExamSystem | "both")}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both systems</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="madrassa">Madrassa</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Candidates" value={String(report?.summary.total ?? 0)} />
        <Stat icon={BarChart3} label="Pass Rate" value={`${report?.summary.passRate ?? 0}%`} />
        <Stat icon={ClipboardList} label="Average" value={`${report?.summary.averagePercentage ?? 0}%`} />
        <Stat icon={FileText} label="Failures" value={String(report?.summary.fail ?? 0)} />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-end">Marks</TableHead>
              <TableHead className="text-end">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6}>Loading report...</TableCell></TableRow>
            ) : !report || report.rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No published results found.</TableCell></TableRow>
            ) : (
              report.rows.map((row) => (
                <TableRow key={`${row.examId}:${row.studentId}`}>
                  <TableCell className="font-mono">{row.position ?? "-"}</TableCell>
                  <TableCell>
                    <p className="font-medium">{row.studentName}</p>
                    <p className="font-urdu text-sm text-muted-foreground">{row.studentNameUrdu}</p>
                  </TableCell>
                  <TableCell>
                    <p>{row.examName}</p>
                    <p className="font-urdu text-sm text-muted-foreground">{row.examNameUrdu}</p>
                  </TableCell>
                  <TableCell>{row.groupLabel}</TableCell>
                  <TableCell className="text-end font-mono">
                    {row.obtainedMarks}/{row.totalMarks} · {row.percentage.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-end">
                    <Badge variant={row.status === "pass" ? "secondary" : "destructive"}>{row.grade}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ExamCard({ exam, onDelete }: { exam: ExamSession; onDelete?: (exam: ExamSession) => void }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{exam.name}</p>
          <p className="font-urdu text-sm text-muted-foreground">{exam.nameUrdu}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("capitalize", statusTone[exam.status])}>{exam.status}</Badge>
          {onDelete && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => onDelete(exam)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-4 flex-1 space-y-2 text-sm">
        <Row label="Group" value={exam.groupLabel} />
        <Row label="Academic Year" value={exam.academicYear} />
        <Row label="Dates" value={`${formatDate(exam.startDate)} - ${formatDate(exam.endDate)}`} />
        <Row label="Subjects" value={String(exam.subjects.length)} />
        <Row label="Students" value={String(exam.studentCount)} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <ExamCardLinks exam={exam} />
      </div>
    </Card>
  );
}

function ExamCardLinks({ exam }: { exam: ExamSession }) {
  if (exam.system === "school") {
    return (
      <>
        <Button asChild size="sm" variant="outline"><Link to="/school/exams/$id" params={{ id: exam.id }}>Detail</Link></Button>
        <Button asChild size="sm" variant="outline"><Link to="/school/exams/$id/seating" params={{ id: exam.id }}>Seating</Link></Button>
        <Button asChild size="sm" variant="outline"><Link to="/school/exams/$id/results" params={{ id: exam.id }}>Marks</Link></Button>
      </>
    );
  }
  return (
    <>
      <Button asChild size="sm" variant="outline"><Link to="/madrassa/exams/$id" params={{ id: exam.id }}>Detail</Link></Button>
      <Button asChild size="sm" variant="outline"><Link to="/madrassa/exams/$id/seating" params={{ id: exam.id }}>Seating</Link></Button>
      <Button asChild size="sm" variant="outline"><Link to="/madrassa/exams/$id/marks" params={{ id: exam.id }}>Marks</Link></Button>
    </>
  );
}

function ExamActionLinks({ exam }: { exam: ExamSession }) {
  if (exam.system === "school") {
    return (
      <>
        <Button asChild size="sm" variant="outline"><Link to="/school/exams/$id/seating" params={{ id: exam.id }}>Seating</Link></Button>
        <Button asChild size="sm"><Link to="/school/exams/$id/results" params={{ id: exam.id }}>Marks</Link></Button>
      </>
    );
  }
  return (
    <>
      <Button asChild size="sm" variant="outline"><Link to="/madrassa/exams/$id/seating" params={{ id: exam.id }}>Seating</Link></Button>
      <Button asChild size="sm"><Link to="/madrassa/exams/$id/marks" params={{ id: exam.id }}>Marks</Link></Button>
      <Button asChild size="sm" variant="outline"><Link to="/madrassa/exams/$id/results" params={{ id: exam.id }}>Results</Link></Button>
    </>
  );
}

function BackLink({ system, examId }: { system: ExamSystem; examId: string }) {
  const label = "Back to exams";
  if (system === "school") {
    return (
      <Link to="/school/exams" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        {label}
      </Link>
    );
  }
  return (
    <Link to="/madrassa/exams" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
      {label}
      <span className="sr-only">{examId}</span>
    </Link>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 truncate font-heading text-base font-bold">{value}</p>
        </div>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

async function loadAcademicOptions(section?: string): Promise<AcademicOptions> {
  const categoriesUrl = section
    ? `/api/academic/madrassa/categories?section=${section}`
    : "/api/academic/madrassa/categories";
  const [institutionsPayload, programsPayload, classesPayload, categoriesPayload] = await Promise.all([
    requestJson<{ institutions: InstitutionOption[] }>("/api/academic/institutions"),
    requestJson<{ programs: ProgramOption[] }>("/api/academic/programs"),
    requestJson<{ classes: SchoolClassOption[] }>("/api/academic/school/classes"),
    requestJson<{ categories: MadrassaCategoryOption[] }>(categoriesUrl),
  ]);
  return {
    institutions: institutionsPayload.institutions,
    programs: programsPayload.programs,
    classes: classesPayload.classes,
    categories: categoriesPayload.categories,
  };
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload as T;
}

function seedExamForm<T extends {
  classId: string;
  sectionId: string;
  categoryId: string;
  subcategoryId: string;
}>(form: T, options: AcademicOptions, system: ExamSystem): T {
  const classId = form.classId || options.classes.find((item) => item.active)?.id || "";
  const sectionId =
    form.sectionId || options.classes.find((item) => item.id === classId)?.sections.find((item) => item.active)?.id || "";
  const categoryId = form.categoryId || options.categories.find((item) => item.active)?.id || "";
  const subcategoryId =
    form.subcategoryId ||
    options.categories.find((item) => item.id === categoryId)?.subcategories.find((item) => item.active)?.id ||
    "";
  return { ...form, classId, sectionId, categoryId, subcategoryId };
}
