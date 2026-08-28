import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Calendar, ClipboardList, FileText, Grid3x3, Plus, Printer, Users } from "lucide-react";
import { toast } from "sonner";
import {
  createExamSession,
  createExamSubject,
  getExamReport,
  getExamSession,
  listExamSessions,
  listExamSubjects,
} from "@/components/exams/exam-api";
import type { ExamReportPayload, ExamSession, ExamSubject, ExamSystem } from "@/components/exams/exam-types";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  subcategories: Array<{ id: string; name: string; nameUrdu: string; active: boolean }>;
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
  const [options, setOptions] = useState<AcademicOptions>(emptyOptions);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
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
  });

  const loadOptions = useCallback(async () => {
    const next = await loadAcademicOptions();
    setOptions(next);
  }, [system]);

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
      });
      toast.success("Subject created");
      setOpen(false);
      setForm({ code: "", name: "", nameUrdu: "", group: "general", totalMarks: 100, passingMarks: 33, scopeId: targetScopeId });
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
              <TableHead className="text-end">Marks</TableHead>
              <TableHead className="text-end">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">Loading subjects...</TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">No subjects configured for this scope.</TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    <p className="font-medium">{subject.name}</p>
                    <p className="font-urdu text-sm text-muted-foreground">{subject.nameUrdu}</p>
                  </TableCell>
                  <TableCell className="font-mono">{subject.code}</TableCell>
                  <TableCell>{subject.group}</TableCell>
                  <TableCell className="text-end font-mono">
                    {subject.totalMarks} / {subject.passingMarks}
                  </TableCell>
                  <TableCell className="text-end">
                    <Badge variant={subject.active ? "secondary" : "outline"}>{subject.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              ))
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
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [options, setOptions] = useState<AcademicOptions>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
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
  const [availableSubjects, setAvailableSubjects] = useState<ExamSubject[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examPayload, academicPayload] = await Promise.all([listExamSessions(system), loadAcademicOptions()]);
      setExams(examPayload.exams);
      setOptions(academicPayload);
      setForm((current) => seedExamForm(current, academicPayload, system));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load exams");
    } finally {
      setLoading(false);
    }
  }, [system]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const scopeId = system === "school" ? form.classId : form.subcategoryId;
    if (!scopeId) {
      setAvailableSubjects([]);
      setForm((current) => ({ ...current, subjectId: "" }));
      return;
    }
    let cancelled = false;
    listExamSubjects({
      system,
      schoolClassId: system === "school" ? scopeId : undefined,
      madrassaSubcategoryId: system === "madrassa" ? scopeId : undefined,
      active: true,
    })
      .then((payload) => {
        if (cancelled) return;
        setAvailableSubjects(payload.subjects);
        setForm((current) => ({
          ...current,
          subjectId: payload.subjects.find((subject) => subject.id !== current.subjectId)?.id ?? payload.subjects[0]?.id ?? "",
        }));
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Could not load subjects");
      });
    return () => {
      cancelled = true;
    };
  }, [form.classId, form.subcategoryId, system]);

  async function handleCreate() {
    const scopeId = system === "school" ? form.classId : form.subcategoryId;
    if (!scopeId || !form.subjectId || !form.name || !form.nameUrdu || !form.startDate || !form.endDate) {
      toast.error("Exam name, class/darja, subject, and dates are required");
      return;
    }
    try {
      await createExamSession({
        system,
        schoolClassId: system === "school" ? form.classId : undefined,
        schoolSectionId: system === "school" ? form.sectionId : undefined,
        madrassaCategoryId: system === "madrassa" ? form.categoryId : undefined,
        madrassaSubcategoryId: system === "madrassa" ? form.subcategoryId : undefined,
        subjectIds: [form.subjectId],
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
          exams.map((exam) => <ExamCard key={exam.id} exam={exam} />)
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
          {system === "school" ? (
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category">
                <Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value, subcategoryId: "", subjectId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {options.categories.filter((item) => item.active).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Darja / Subcategory">
                <Select value={form.subcategoryId} onValueChange={(value) => setForm({ ...form, subcategoryId: value, subjectId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select darja" /></SelectTrigger>
                  <SelectContent>
                    {options.categories.find((item) => item.id === form.categoryId)?.subcategories.filter((item) => item.active).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Exam Name">
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Urdu Name">
              <Input dir="rtl" className="font-urdu" value={form.nameUrdu} onChange={(event) => setForm({ ...form, nameUrdu: event.target.value })} />
            </Field>
          </div>

          {(system === "school" ? form.classId : form.subcategoryId) && (
            <Field label="Subject">
              <Select value={form.subjectId} onValueChange={(value) => setForm({ ...form, subjectId: value })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} · {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(system === "school" ? ["monthly", "quarterly", "halfyearly", "annual"] : ["sahmahi", "nisfussana", "salanah"]).map((type) => (
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

function ExamCard({ exam }: { exam: ExamSession }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{exam.name}</p>
          <p className="font-urdu text-sm text-muted-foreground">{exam.nameUrdu}</p>
        </div>
        <Badge variant="outline" className={cn("capitalize", statusTone[exam.status])}>{exam.status}</Badge>
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

async function loadAcademicOptions(): Promise<AcademicOptions> {
  const [institutionsPayload, programsPayload, classesPayload, categoriesPayload] = await Promise.all([
    requestJson<{ institutions: InstitutionOption[] }>("/api/academic/institutions"),
    requestJson<{ programs: ProgramOption[] }>("/api/academic/programs"),
    requestJson<{ classes: SchoolClassOption[] }>("/api/academic/school/classes"),
    requestJson<{ categories: MadrassaCategoryOption[] }>("/api/academic/madrassa/categories"),
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
