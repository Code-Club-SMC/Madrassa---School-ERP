import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ClipboardList,
  FileText,
  Grid3x3,
  Plus,
  Printer,
  Trash2,
  Users,
  Search,
  School,
  GraduationCap,
  Award,
  CheckCircle2,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  BookOpen,
  CalendarDays,
  Eye,
  X,
  Filter,
} from "lucide-react";
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

export function cleanExamName(name: string): string {
  if (!name) return "";
  return name
    .replace(/\s*-\s*demo_[a-zA-Z0-9_-]+/gi, "")
    .replace(/\s*-\s*sc_[a-zA-Z0-9_-]+/gi, "")
    .replace(/\s*-\s*[A-Z]{2,4}_[a-zA-Z0-9_-]+/g, "")
    .replace(/\s*-\s*none$/i, "")
    .trim();
}

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
  institutionId: string;
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
    name: "",
    nameUrdu: "",
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
    const prefix = gender === "male" ? "qasmia" : "zainab";

    if (system === "school") {
      return new Set(["school", "all", `${prefix}-school`, `${prefix}-both`]);
    }

    if (system === "madrassa") {
      return new Set(["madrassa", "all", `${prefix}-madrassa`, `${prefix}-both`]);
    }

    return new Set([
      "school",
      "madrassa",
      "all",
      `${prefix}-school`,
      `${prefix}-madrassa`,
      `${prefix}-both`,
    ]);
  }, [system, gender]);

  const visibleTeachers = useMemo(() => {
    return teachers.filter((teacher) => allowedTeacherSystemScopes.has(teacher.systemScope));
  }, [teachers, allowedTeacherSystemScopes]);

  const loadOptions = useCallback(async () => {
    const institutionId = gender === "male" ? "al_qasim_academy" : "jamia_zainab_banat";
    const next = await loadAcademicOptions(undefined, institutionId);
    setOptions(next);
  }, [system, gender]);

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
    if (!form.name.trim() || !form.nameUrdu.trim()) {
      toast.error("Name and Urdu name are required");
      return;
    }

    try {
      await createExamSubject({
        system,
        schoolClassId: system === "school" ? targetScopeId : undefined,
        madrassaSubcategoryId: system === "madrassa" ? targetScopeId : undefined,
        name: form.name,
        nameUrdu: form.nameUrdu,
        totalMarks: form.totalMarks,
        passingMarks: form.passingMarks,
        displayOrder: subjects.length + 1,
        teacherId: form.teacherId || undefined,
      });
      toast.success("Subject created");
      setOpen(false);
      setForm({ name: "", nameUrdu: "", totalMarks: 100, passingMarks: 33, scopeId: targetScopeId, teacherId: "" });
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
              <TableHead>Teacher</TableHead>
              <TableHead className="text-end">Marks</TableHead>
              <TableHead className="text-end">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">Loading subjects...</TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">No subjects configured for this scope.</TableCell>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examPayload, academicPayload] = await Promise.all([
        listExamSessions({ system, section: system === "madrassa" ? gender : undefined }),
        loadAcademicOptions(system === "madrassa" ? gender : undefined, undefined),
      ]);
      setExams(examPayload.exams);
      setOptions(academicPayload);
      setForm((current) => seedExamForm(current, academicPayload, system));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load exams");
    } finally {
      setLoading(false);
    }
  }, [system, gender]);

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

  const uniqueTerms = useMemo(() => {
    return Array.from(new Set(exams.map((e) => cleanExamName(e.name)))).filter(Boolean);
  }, [exams]);

  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(exams.map((e) => e.groupLabel))).filter(Boolean);
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const cleanName = cleanExamName(exam.name).toLowerCase();
      const rawName = exam.name.toLowerCase();
      const urduName = (exam.nameUrdu || "").toLowerCase();
      const groupLabel = (exam.groupLabel || "").toLowerCase();
      const academicYear = (exam.academicYear || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      if (q) {
        const matches =
          cleanName.includes(q) ||
          rawName.includes(q) ||
          urduName.includes(q) ||
          groupLabel.includes(q) ||
          academicYear.includes(q);
        if (!matches) return false;
      }

      if (selectedTerm !== "all" && cleanExamName(exam.name) !== selectedTerm) {
        return false;
      }

      if (selectedClass !== "all" && exam.groupLabel !== selectedClass) {
        return false;
      }

      if (selectedStatus !== "all" && exam.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [exams, searchQuery, selectedTerm, selectedClass, selectedStatus]);

  const stats = useMemo(() => {
    const totalSessions = exams.length;
    const totalStudents = exams.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);
    const publishedCount = exams.filter((e) => e.status === "published").length;
    const totalClasses = new Set(exams.map((e) => e.groupLabel)).size;
    return { totalSessions, totalStudents, publishedCount, totalClasses };
  }, [exams]);

  async function handleCreate() {
    if (!form.name || !form.nameUrdu || !form.startDate || !form.endDate) {
      toast.error("Exam name and dates are required");
      return;
    }

    try {
      if (system === "school") {
        const activeClasses = options.classes.filter((item) => item.active);
        if (activeClasses.length === 0) {
          toast.error("No active classes found for this school");
          return;
        }

        for (const schoolClass of activeClasses) {
          const classSubjects = await listExamSubjects({
            system: "school",
            schoolClassId: schoolClass.id,
            madrassaSubcategoryId: undefined,
            active: true,
          });

          await createExamSession({
            system: "school",
            schoolClassId: schoolClass.id,
            schoolSectionId: undefined,
            madrassaCategoryId: undefined,
            madrassaSubcategoryId: undefined,
            subjectIds: classSubjects.subjects.map((subject) => subject.id),
            type: form.type,
            name: form.name,
            nameUrdu: form.nameUrdu,
            startDate: form.startDate,
            endDate: form.endDate,
          });
        }
      } else {
        const activeCategories = options.categories.filter((item) => item.active);
        if (activeCategories.length === 0) {
          toast.error("No active categories found for madrassa");
          return;
        }

        for (const category of activeCategories) {
          const activeSubcategories = category.subcategories.filter((item) => item.active);
          if (activeSubcategories.length === 0) continue;

          for (const subcategory of activeSubcategories) {
            const categorySubjects = await listExamSubjects({
              system: "madrassa",
              schoolClassId: undefined,
              madrassaSubcategoryId: subcategory.id,
              active: true,
            });

            await createExamSession({
              system: "madrassa",
              schoolClassId: undefined,
              schoolSectionId: undefined,
              madrassaCategoryId: category.id,
              madrassaSubcategoryId: subcategory.id,
              subjectIds: categorySubjects.subjects.map((subject) => subject.id),
              type: form.type,
              name: form.name,
              nameUrdu: form.nameUrdu,
              startDate: form.startDate,
              endDate: form.endDate,
            });
          }
        }
      }

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
    <div className="space-y-6">
      <PageHeader
        title={title}
        titleUrdu={titleUrdu}
        description="Internal exam sessions, subjects, marks, DMCs, seating plans, and published results."
        actions={
          <Button size="sm" className="gap-1.5 shadow-xs" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New Exam
          </Button>
        }
      />

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border border-border/70 bg-card/60 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Exam Sessions</p>
            <p className="font-heading text-xl font-bold mt-1 tabular-nums">{stats.totalSessions}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stats.totalClasses} classes active</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <ClipboardList className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 border border-border/70 bg-card/60 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Examinees</p>
            <p className="font-heading text-xl font-bold mt-1 text-primary tabular-nums">{stats.totalStudents}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Enrolled candidates</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 border border-border/70 bg-card/60 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Published Status</p>
            <p className="font-heading text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.publishedCount} / {stats.totalSessions}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Results & DMCs ready</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 border border-border/70 bg-card/60 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Academic Terms</p>
            <p className="font-heading text-xl font-bold mt-1 tabular-nums">{uniqueTerms.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Evaluation cycles</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Layers className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filter and Control Toolbar */}
      <Card className="p-4 border border-border/70 bg-card/50 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam name, class, year..."
              className="ps-9 pe-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Term filter */}
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-9 text-xs w-[170px]">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exam Terms</SelectItem>
                {uniqueTerms.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class filter */}
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>

            {/* View mode toggle */}
            <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/30">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 cursor-pointer"
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 cursor-pointer"
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter badge indicators */}
        {(searchQuery || selectedTerm !== "all" || selectedClass !== "all" || selectedStatus !== "all") && (
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50 text-xs">
            <span className="text-muted-foreground">
              Showing <strong className="text-foreground">{filteredExams.length}</strong> of{" "}
              {exams.length} exams matching filters
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedTerm("all");
                setSelectedClass("all");
                setSelectedStatus("all");
              }}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          </div>
        )}
      </Card>

      {/* Content area */}
      {loading ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          Loading examinations...
        </Card>
      ) : filteredExams.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h4 className="font-semibold text-base">No examinations found</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {exams.length === 0
              ? "No exam sessions have been created yet. Click 'New Exam' to schedule one."
              : "No exam sessions match your active search and filter criteria."}
          </p>
          {(searchQuery || selectedTerm !== "all" || selectedClass !== "all" || selectedStatus !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedTerm("all");
                setSelectedClass("all");
                setSelectedStatus("all");
              }}
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <ExamTableView exams={filteredExams} onDelete={setDeleteTarget} />
      )}

      <ResponsiveDialog
        title="Create Exam"
        description="Create an internal exam from the selected academic scope."
        open={open}
        onOpenChange={setOpen}
        icon={ClipboardList}
        className="sm:max-w-3xl"
      >
        <div className="grid gap-4 p-1">
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
                  {(system === "school" ? ["quarterly", "halfyearly", "annual"] : ["sahmahi", "salanah"]).map((type) => (
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
              <TableRow><TableCell colSpan={4}>Loading report...</TableCell></TableRow>
            ) : !report || report.rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-muted-foreground">No published results found.</TableCell></TableRow>
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

function ExamTableView({
  exams,
  onDelete,
}: {
  exams: ExamSession[];
  onDelete?: (exam: ExamSession) => void;
}) {
  return (
    <Card className="overflow-hidden border border-border/70 shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold text-xs">Exam Title</TableHead>
              <TableHead className="font-semibold text-xs">Class / Group</TableHead>
              <TableHead className="font-semibold text-xs">Academic Year</TableHead>
              <TableHead className="font-semibold text-xs">Date Range</TableHead>
              <TableHead className="font-semibold text-xs text-center">Subjects</TableHead>
              <TableHead className="font-semibold text-xs text-center">Students</TableHead>
              <TableHead className="font-semibold text-xs text-center">Status</TableHead>
              <TableHead className="font-semibold text-xs text-end pe-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-foreground">{cleanExamName(exam.name)}</p>
                      <p className="font-urdu text-[11px] text-muted-foreground">{exam.nameUrdu}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1 font-semibold text-xs py-0.5 px-2 bg-primary/10 text-primary border border-primary/20">
                    <School className="h-3 w-3" />
                    {exam.groupLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{exam.academicYear}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
                </TableCell>
                <TableCell className="text-center font-medium text-xs">
                  {exam.subjects.length}
                </TableCell>
                <TableCell className="text-center font-semibold text-xs">
                  {exam.studentCount}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn("capitalize text-[10px] font-medium px-2 py-0.5", statusTone[exam.status])}
                  >
                    {exam.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-end pe-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <ExamCardLinks exam={exam} />
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(exam)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function ExamCard({ exam, onDelete }: { exam: ExamSession; onDelete?: (exam: ExamSession) => void }) {
  const cleanTitle = cleanExamName(exam.name);
  return (
    <Card className="flex flex-col p-5 border border-border/70 hover:border-primary/40 hover:shadow-md transition-all duration-200 group bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-base tracking-tight truncate group-hover:text-primary transition-colors">
              {cleanTitle}
            </h4>
            <p className="font-urdu text-xs text-muted-foreground mt-0.5 truncate">
              {exam.nameUrdu}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn("capitalize text-[11px] font-medium px-2 py-0.5 flex items-center gap-1.5", statusTone[exam.status])}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                exam.status === "published"
                  ? "bg-emerald-500"
                  : exam.status === "active"
                  ? "bg-sky-500"
                  : exam.status === "locked"
                  ? "bg-amber-500"
                  : "bg-slate-400",
              )}
            />
            {exam.status}
          </Badge>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={() => onDelete(exam)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/60">
        <Badge
          variant="secondary"
          className="gap-1 font-semibold text-xs py-0.5 px-2 bg-primary/10 text-primary border border-primary/20"
        >
          <School className="h-3 w-3" />
          {exam.groupLabel}
        </Badge>
        <Badge variant="outline" className="text-xs text-muted-foreground py-0.5 px-2">
          <Calendar className="h-3 w-3 me-1 opacity-70" />
          {exam.academicYear}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3.5 text-xs">
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            Schedule
          </p>
          <p className="font-medium text-foreground mt-0.5 truncate">
            {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Candidates
          </p>
          <p className="font-semibold text-foreground mt-0.5">
            {exam.studentCount} Students
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Subjects
          </p>
          <p className="font-semibold text-foreground mt-0.5">
            {exam.subjects.length} Subjects
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Award className="h-3 w-3" />
            Lock Status
          </p>
          <p className="font-medium text-foreground mt-0.5">
            {exam.subjects.every((s) => s.locked) ? "Locked" : "Open for Marks"}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-3 gap-2">
        <ExamCardLinks exam={exam} />
      </div>
    </Card>
  );
}

function ExamCardLinks({ exam }: { exam: ExamSession }) {
  if (exam.system === "school") {
    return (
      <>
        <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs h-8">
          <Link to="/school/exams/$id" params={{ id: exam.id }}>
            <Eye className="h-3.5 w-3.5" /> Detail
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs h-8">
          <Link to="/school/exams/$id/seating" params={{ id: exam.id }}>
            <Grid3x3 className="h-3.5 w-3.5" /> Seating
          </Link>
        </Button>
        <Button asChild size="sm" className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs">
          <Link to="/school/exams/$id/results" params={{ id: exam.id }}>
            <Award className="h-3.5 w-3.5" /> Marks
          </Link>
        </Button>
      </>
    );
  }
  return (
    <>
      <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs h-8">
        <Link to="/madrassa/exams/$id" params={{ id: exam.id }}>
          <Eye className="h-3.5 w-3.5" /> Detail
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs h-8">
        <Link to="/madrassa/exams/$id/seating" params={{ id: exam.id }}>
          <Grid3x3 className="h-3.5 w-3.5" /> Seating
        </Link>
      </Button>
      <Button asChild size="sm" className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs">
        <Link to="/madrassa/exams/$id/marks" params={{ id: exam.id }}>
          <Award className="h-3.5 w-3.5" /> Marks
        </Link>
      </Button>
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

async function loadAcademicOptions(section?: string, institutionId?: string): Promise<AcademicOptions> {
  const categoriesUrl = section
    ? `/api/academic/madrassa/categories?section=${section}`
    : "/api/academic/madrassa/categories";
  const classesUrl = institutionId
    ? `/api/academic/school/classes?institutionId=${institutionId}`
    : "/api/academic/school/classes";
  const [institutionsPayload, programsPayload, classesPayload, categoriesPayload] = await Promise.all([
    requestJson<{ institutions: InstitutionOption[] }>("/api/academic/institutions"),
    requestJson<{ programs: ProgramOption[] }>("/api/academic/programs"),
    requestJson<{ classes: SchoolClassOption[] }>(classesUrl),
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
    form.sectionId || options.classes.find((item) => item.id === classId)?.sections?.find((item) => item.active)?.id || "";
  const categoryId = form.categoryId || options.categories.find((item) => item.active)?.id || "";
  const subcategoryId =
    form.subcategoryId ||
    options.categories.find((item) => item.id === categoryId)?.subcategories?.find((item) => item.active)?.id ||
    "";
  return { ...form, classId, sectionId, categoryId, subcategoryId };
}
