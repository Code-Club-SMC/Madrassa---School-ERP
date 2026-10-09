import { Link, useNavigate } from "@tanstack/react-router";
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
  Building2,
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

export type GroupedExam = {
  key: string;
  primaryId: string;
  name: string;
  cleanTitle: string;
  nameUrdu: string;
  academicYear: string;
  type: string;
  system: ExamSystem;
  institutionId: string | null;
  institutionName: string | null;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "locked" | "published";
  sessions: ExamSession[];
  totalClasses: number;
  totalStudents: number;
  totalSubjects: number;
  classLabels: string[];
  allLocked: boolean;
};

export function groupExamSessions(sessions: ExamSession[]): GroupedExam[] {
  const map = new Map<string, ExamSession[]>();

  for (const session of sessions) {
    const cleanName = cleanExamName(session.name).toLowerCase();
    const key = `${cleanName}::${session.academicYear}::${session.type}::${session.institutionId || ""}::${session.startDate}::${session.endDate}`;
    const list = map.get(key) || [];
    list.push(session);
    map.set(key, list);
  }

  const result: GroupedExam[] = [];

  for (const [key, groupSessions] of map.entries()) {
    const first = groupSessions[0];
    const totalStudents = groupSessions.reduce((acc, s) => acc + (s.studentCount || 0), 0);
    const totalSubjects = groupSessions.reduce((acc, s) => acc + (s.subjects?.length || 0), 0);
    const classLabels = Array.from(new Set(groupSessions.map((s) => s.groupLabel).filter(Boolean)));

    let status: "draft" | "active" | "locked" | "published" = "draft";
    if (groupSessions.every((s) => s.status === "published")) {
      status = "published";
    } else if (groupSessions.every((s) => s.status === "locked" || s.status === "published")) {
      status = "locked";
    } else if (groupSessions.some((s) => s.status === "active" || s.status === "locked" || s.status === "published")) {
      status = "active";
    }

    const allLocked = groupSessions.every(
      (s) => s.subjects && s.subjects.length > 0 && s.subjects.every((sub) => sub.locked),
    );

    result.push({
      key,
      primaryId: first.id,
      name: first.name,
      cleanTitle: cleanExamName(first.name),
      nameUrdu: first.nameUrdu,
      academicYear: first.academicYear,
      type: first.type,
      system: first.system,
      institutionId: first.institutionId,
      institutionName: first.institutionName,
      startDate: first.startDate,
      endDate: first.endDate,
      status,
      sessions: groupSessions,
      totalClasses: groupSessions.length,
      totalStudents,
      totalSubjects,
      classLabels,
      allLocked,
    });
  }

  return result;
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
    const next = await loadAcademicOptions(system === "madrassa" ? gender : undefined, institutionId);
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
  const [deleteTarget, setDeleteTarget] = useState<GroupedExam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [form, setForm] = useState({
    classId: "all",
    sectionId: "",
    categoryId: "all",
    subcategoryId: "all",
    subjectId: "",
    type: system === "school" ? "quarterly" : "salanah",
    name: "",
    nameUrdu: "",
    startDate: "",
    endDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const activeInstitution = useMemo(() => {
    if (system === "school") {
      return gender === "male"
        ? {
            id: "al_qasim_academy",
            name: "Al-Qasim Academy",
            nameUrdu: "القاسم اکیڈمی (بنین)",
            campus: "Boys Campus",
            campusUrdu: "شعبہ بنین",
            icon: "🕌",
          }
        : {
            id: "jamia_zainab_banat",
            name: "Jamia Zainab School",
            nameUrdu: "جامعہ زینب (بنات)",
            campus: "Girls Campus",
            campusUrdu: "شعبہ بنات",
            icon: "🌙",
          };
    } else {
      return gender === "male"
        ? {
            id: "jamia_qasmia_baneen",
            name: "Jamia Qasmia Lil-Baneen",
            nameUrdu: "جامعہ قاسمیہ للبنین",
            campus: "Boys Campus",
            campusUrdu: "شعبہ بنین",
            icon: "🕌",
          }
        : {
            id: "jamia_zainab_banat",
            name: "Jamia Zainab Lil-Banat",
            nameUrdu: "جامعہ زینب للبنات",
            campus: "Girls Campus",
            campusUrdu: "شعبہ بنات",
            icon: "🌙",
          };
    }
  }, [system, gender]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examPayload, academicPayload] = await Promise.all([
        listExamSessions({
          system,
          section: gender,
          institutionId: activeInstitution.id,
        }),
        loadAcademicOptions(
          system === "madrassa" ? gender : undefined,
          system === "school" ? activeInstitution.id : undefined,
        ),
      ]);
      setExams(examPayload.exams);
      setOptions(academicPayload);
      setForm((current) => seedExamForm(current, academicPayload, system));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load exams");
    } finally {
      setLoading(false);
    }
  }, [system, gender, activeInstitution.id]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await Promise.all(deleteTarget.sessions.map((s) => deleteExamSession(s.id)));
      toast.success(
        `Deleted examination "${deleteTarget.cleanTitle}" and all ${deleteTarget.sessions.length} class sessions`,
      );
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

  const groupedExams = useMemo(() => {
    return groupExamSessions(exams);
  }, [exams]);

  const uniqueTerms = useMemo(() => {
    return Array.from(new Set(groupedExams.map((e) => e.cleanTitle))).filter(Boolean);
  }, [groupedExams]);

  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(exams.map((e) => e.groupLabel))).filter(Boolean);
  }, [exams]);

  const filteredGroups = useMemo(() => {
    return groupedExams.filter((group) => {
      const cleanName = group.cleanTitle.toLowerCase();
      const rawName = group.name.toLowerCase();
      const urduName = (group.nameUrdu || "").toLowerCase();
      const academicYear = (group.academicYear || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      if (q) {
        const matches =
          cleanName.includes(q) ||
          rawName.includes(q) ||
          urduName.includes(q) ||
          academicYear.includes(q) ||
          group.classLabels.some((lbl) => lbl.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (selectedTerm !== "all" && group.cleanTitle !== selectedTerm) {
        return false;
      }

      if (selectedClass !== "all" && !group.classLabels.includes(selectedClass)) {
        return false;
      }

      if (selectedStatus !== "all" && group.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [groupedExams, searchQuery, selectedTerm, selectedClass, selectedStatus]);

  const stats = useMemo(() => {
    const totalExamEvents = groupedExams.length;
    const totalSessions = exams.length;
    const totalStudents = exams.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);
    const publishedCount = groupedExams.filter((e) => e.status === "published").length;
    const totalClasses = new Set(exams.map((e) => e.groupLabel)).size;
    return { totalExamEvents, totalSessions, totalStudents, publishedCount, totalClasses };
  }, [groupedExams, exams]);

  async function handleCreate() {
    if (!form.name.trim() || !form.nameUrdu.trim() || !form.startDate || !form.endDate) {
      toast.error("Exam name, Urdu name, and dates are required");
      return;
    }

    setSubmitting(true);
    try {
      if (system === "school") {
        const targetClasses =
          form.classId && form.classId !== "all"
            ? options.classes.filter((item) => item.id === form.classId && item.active)
            : options.classes.filter((item) => item.active);

        if (targetClasses.length === 0) {
          toast.error(`No active classes found for ${activeInstitution.name}`);
          return;
        }

        let createdCount = 0;
        for (const schoolClass of targetClasses) {
          const classSubjects = await listExamSubjects({
            system: "school",
            schoolClassId: schoolClass.id,
            madrassaSubcategoryId: undefined,
            active: true,
          });

          await createExamSession({
            system: "school",
            institutionId: activeInstitution.id,
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
          createdCount++;
        }

        toast.success(`Created ${createdCount} exam session${createdCount > 1 ? "s" : ""}`);
      } else {
        let targetCategories = options.categories.filter((item) => item.active);
        if (form.categoryId && form.categoryId !== "all") {
          targetCategories = targetCategories.filter((item) => item.id === form.categoryId);
        }

        if (targetCategories.length === 0) {
          toast.error(`No active categories found for ${activeInstitution.name}`);
          return;
        }

        let createdCount = 0;
        for (const category of targetCategories) {
          let targetSubcategories = category.subcategories.filter((item) => item.active);
          if (form.subcategoryId && form.subcategoryId !== "all") {
            targetSubcategories = targetSubcategories.filter((item) => item.id === form.subcategoryId);
          }
          if (targetSubcategories.length === 0) continue;

          for (const subcategory of targetSubcategories) {
            const categorySubjects = await listExamSubjects({
              system: "madrassa",
              schoolClassId: undefined,
              madrassaSubcategoryId: subcategory.id,
              active: true,
            });

            await createExamSession({
              system: "madrassa",
              institutionId: activeInstitution.id,
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
            createdCount++;
          }
        }

        if (createdCount === 0) {
          toast.error("No classes found to create exams for");
          return;
        }

        toast.success(`Created ${createdCount} exam session${createdCount > 1 ? "s" : ""}`);
      }

      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create exam");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <PageHeader
          title={`${activeInstitution.name} — Examinations`}
          titleUrdu={`${activeInstitution.nameUrdu} — امتحانات`}
          description={`Internal exam sessions, subjects, marks, DMCs, seating plans, and published results for ${activeInstitution.name} (${activeInstitution.campus}).`}
          actions={
            <Button
              size="sm"
              className="gap-1.5 shadow-xs"
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  categoryId: "all",
                  subcategoryId: "all",
                  classId: "all",
                }));
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Exam
            </Button>
          }
        />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs w-fit text-primary font-medium shadow-2xs">
          <span className="text-sm">{activeInstitution.icon}</span>
          <span>
            Active Institution: <strong className="font-semibold">{activeInstitution.name}</strong> ({activeInstitution.campus})
          </span>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border border-border/70 bg-card/60 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Exam Events</p>
            <p className="font-heading text-xl font-bold mt-1 tabular-nums">{stats.totalExamEvents}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stats.totalSessions} class sessions ({stats.totalClasses} classes)</p>
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
              {stats.publishedCount} / {stats.totalExamEvents}
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
              Showing <strong className="text-foreground">{filteredGroups.length}</strong> of{" "}
              {groupedExams.length} examinations matching filters
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
      ) : filteredGroups.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h4 className="font-semibold text-base">No examinations found for {activeInstitution.name}</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {groupedExams.length === 0
              ? `No exam events have been scheduled yet for ${activeInstitution.name} (${activeInstitution.campus}). Click 'New Exam' to schedule one.`
              : "No exam sessions match your active search and filter criteria."}
          </p>
          {searchQuery || selectedTerm !== "all" || selectedClass !== "all" || selectedStatus !== "all" ? (
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
          ) : (
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="mt-4 text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              New Exam
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <GroupedExamCard key={group.key} exam={group} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <GroupedExamTableView exams={filteredGroups} onDelete={setDeleteTarget} />
      )}

      <ResponsiveDialog
        title="Create Exam"
        description={`Create internal exam sessions for ${activeInstitution.name} (${activeInstitution.campus}).`}
        open={open}
        onOpenChange={setOpen}
        icon={ClipboardList}
        className="sm:max-w-3xl"
      >
        <div className="grid gap-4 p-1">
          {/* Active Institution Badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <span className="text-xl">{activeInstitution.icon}</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                {activeInstitution.name}
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                  {activeInstitution.campus}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground font-urdu" dir="rtl">
                {activeInstitution.nameUrdu} ({activeInstitution.campusUrdu})
              </p>
            </div>
          </div>

          {/* Academic Scope Selection */}
          {system === "madrassa" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category · شعبہ">
                <Select
                  value={form.categoryId || "all"}
                  onValueChange={(val) => setForm({ ...form, categoryId: val, subcategoryId: "all" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">تمام شعبہ جات (All Categories)</SelectItem>
                    {options.categories
                      .filter((c) => c.active)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} {cat.nameUrdu ? `· ${cat.nameUrdu}` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Darja / Class · درجہ">
                <Select
                  value={form.subcategoryId || "all"}
                  onValueChange={(val) => setForm({ ...form, subcategoryId: val })}
                  disabled={!form.categoryId || form.categoryId === "all"}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        form.categoryId === "all"
                          ? "All Classes in All Categories"
                          : "All Classes in this Category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">اس شعبے کے تمام درجات (All Classes in Category)</SelectItem>
                    {options.categories
                      .find((c) => c.id === form.categoryId)
                      ?.subcategories.filter((s) => s.active)
                      .map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name} {sub.nameUrdu ? `· ${sub.nameUrdu}` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : (
            <Field label="Class · جماعت">
              <Select
                value={form.classId || "all"}
                onValueChange={(val) => setForm({ ...form, classId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام جماعتیں (All Classes)</SelectItem>
                  {options.classes
                    .filter((c) => c.active)
                    .map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.nameUrdu ? `· ${cls.nameUrdu}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Exam Name & Urdu Name */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Exam Name (English)">
              <Input
                value={form.name}
                placeholder={system === "school" ? "Annual Examination 2026" : "Annual Examination 2026"}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Exam Name (Urdu)">
              <Input
                dir="rtl"
                className="font-urdu"
                placeholder={system === "school" ? "سالانہ امتحان ۲۰۲۶" : "سالانہ امتحان ۲۰۲۶"}
                value={form.nameUrdu}
                onChange={(event) => setForm({ ...form, nameUrdu: event.target.value })}
              />
            </Field>
          </div>

          {/* Exam Type & Dates */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type · نوعیت امتحان">
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(system === "school"
                    ? [
                        { value: "quarterly", label: "سہ ماہی (Quarterly)" },
                        { value: "halfyearly", label: "شش ماہی (Half-Yearly)" },
                        { value: "annual", label: "سالانہ (Annual)" },
                        { value: "monthly", label: "ماہانہ (Monthly)" },
                      ]
                    : [
                        { value: "sahmahi", label: "سہ ماہی (First Term)" },
                        { value: "salanah", label: "سالانہ (Annual)" },
                      ]
                  ).map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date">
                <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              </Field>
              <Field label="End Date">
                <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" disabled={submitting} onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={submitting} onClick={() => void handleCreate()}>
              {submitting ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Examination</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.cleanTitle}&rdquo;? This action cannot be undone and will permanently delete this examination across all {deleteTarget?.totalClasses} participating {deleteTarget?.totalClasses === 1 ? "class" : "classes"}, including associated marks, seating plans, and published results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : `Delete All ${deleteTarget?.totalClasses ?? 1} Class Sessions`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ExamDetailWorkspace({ examId, system }: { examId: string; system: ExamSystem }) {
  const { gender } = useSystem();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamSession | null>(null);
  const [siblingSessions, setSiblingSessions] = useState<ExamSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(examId);
  const [loading, setLoading] = useState(true);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<ExamSession | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  const loadExamAndSiblings = useCallback(async () => {
    setLoading(true);
    try {
      const primaryPayload = await getExamSession(examId);
      const primary = primaryPayload.exam;
      setExam(primary);

      const listPayload = await listExamSessions({
        system,
        section: gender,
        institutionId: primary.institutionId || undefined,
      });

      const primaryClean = cleanExamName(primary.name).toLowerCase();
      const siblings = listPayload.exams.filter(
        (s) =>
          cleanExamName(s.name).toLowerCase() === primaryClean &&
          s.academicYear === primary.academicYear &&
          s.type === primary.type &&
          (s.institutionId === primary.institutionId || !primary.institutionId),
      );

      if (!siblings.some((s) => s.id === primary.id)) {
        siblings.unshift(primary);
      }

      setSiblingSessions(siblings);
      setSelectedSessionId((current) => {
        if (current && siblings.some((s) => s.id === current)) return current;
        return primary.id;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load exam");
    } finally {
      setLoading(false);
    }
  }, [examId, system, gender]);

  useEffect(() => {
    void loadExamAndSiblings();
  }, [loadExamAndSiblings]);

  const handleDeleteSession = async () => {
    if (!deleteSessionTarget) return;
    setDeletingSession(true);
    try {
      await deleteExamSession(deleteSessionTarget.id);
      toast.success(`Removed ${deleteSessionTarget.groupLabel} from this examination`);

      const remaining = siblingSessions.filter((s) => s.id !== deleteSessionTarget.id);
      setDeleteSessionTarget(null);

      if (remaining.length === 0) {
        void navigate({ to: system === "school" ? "/school/exams" : "/madrassa/exams" });
        return;
      }

      setSiblingSessions(remaining);
      if (selectedSessionId === deleteSessionTarget.id) {
        setSelectedSessionId(remaining[0].id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete class session");
    } finally {
      setDeletingSession(false);
    }
  };

  const currentSession = useMemo(() => {
    return siblingSessions.find((s) => s.id === selectedSessionId) || exam;
  }, [siblingSessions, selectedSessionId, exam]);

  const aggregateStats = useMemo(() => {
    const totalClasses = siblingSessions.length;
    const totalStudents = siblingSessions.reduce((acc, s) => acc + (s.studentCount || 0), 0);
    const totalSubjects = siblingSessions.reduce((acc, s) => acc + (s.subjects?.length || 0), 0);
    const allLocked = siblingSessions.every(
      (s) => s.subjects && s.subjects.length > 0 && s.subjects.every((sub) => sub.locked),
    );
    return { totalClasses, totalStudents, totalSubjects, allLocked };
  }, [siblingSessions]);

  if (loading) return <Card className="p-8 text-center text-sm text-muted-foreground">Loading examination details...</Card>;
  if (!exam || !currentSession) return <Card className="p-8 text-center text-sm text-destructive">Examination not found.</Card>;

  return (
    <div className="space-y-6">
      <BackLink system={system} examId={examId} />

      <PageHeader
        title={cleanExamName(exam.name)}
        titleUrdu={exam.nameUrdu}
        description={`${exam.institutionName ? `${exam.institutionName} · ` : ""}${exam.academicYear} · ${formatDate(exam.startDate)} – ${formatDate(exam.endDate)} · ${aggregateStats.totalClasses} ${aggregateStats.totalClasses === 1 ? "Class" : "Classes"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 shadow-xs" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print Date Sheet
            </Button>
            <Badge
              variant="outline"
              className={cn("capitalize text-xs font-medium px-2.5 py-1", statusTone[exam.status])}
            >
              {exam.status}
            </Badge>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          icon={Calendar}
          label="Examination Schedule"
          value={`${formatDate(exam.startDate)} – ${formatDate(exam.endDate)}`}
        />
        <Stat
          icon={Layers}
          label="Participating Classes"
          value={`${aggregateStats.totalClasses} ${aggregateStats.totalClasses === 1 ? "Class" : "Classes"}`}
        />
        <Stat
          icon={Users}
          label="Total Candidates"
          value={`${aggregateStats.totalStudents} Students`}
        />
        <Stat
          icon={Award}
          label="Total Subjects"
          value={`${aggregateStats.totalSubjects} Subjects`}
        />
      </div>

      {/* Participating Classes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Participating Classes · شامل درجات و جماعتیں
            </h3>
            <Badge variant="secondary" className="text-xs py-0 px-2 font-semibold bg-primary/10 text-primary">
              {siblingSessions.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Click any class to view its timetable, or use quick actions below.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {siblingSessions.map((session) => {
            const isSelected = session.id === currentSession.id;
            return (
              <Card
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={cn(
                  "p-4 border transition-all cursor-pointer flex flex-col justify-between gap-3 text-start",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border/70 bg-card hover:border-primary/40 hover:shadow-2xs",
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">
                        {session.groupLabel}
                      </h4>
                      <p className="text-xs text-muted-foreground font-urdu mt-0.5 truncate">
                        {session.nameUrdu}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("capitalize text-[10px] px-1.5 py-0.5", statusTone[session.status])}
                      >
                        {session.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionTarget(session);
                        }}
                        title={`Remove ${session.groupLabel} from exam`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <strong className="text-foreground font-semibold">{session.studentCount}</strong> Students
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <strong className="text-foreground font-semibold">{session.subjects.length}</strong> Subjects
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <ClassActionLinks session={session} system={system} />
                  <Button
                    size="sm"
                    variant={isSelected ? "secondary" : "ghost"}
                    className="h-7 text-xs px-2"
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    {isSelected ? "Active View" : "Timetable"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Selected Class Timetable & Subjects */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/70 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <span>{currentSession.groupLabel}</span>
                <Badge variant="outline" className="text-[11px] font-normal py-0">
                  {currentSession.subjects.length} subjects
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Class examination timetable, marks status, and schedule
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ClassActionLinks session={currentSession} system={system} />
          </div>
        </div>

        <Card className="overflow-hidden border border-border/70 shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs font-semibold">Subject</TableHead>
                <TableHead className="text-xs font-semibold">Exam Date</TableHead>
                <TableHead className="text-xs font-semibold">Exam Time</TableHead>
                <TableHead className="text-end text-xs font-semibold">Total / Passing</TableHead>
                <TableHead className="text-end text-xs font-semibold">Status</TableHead>
                <TableHead className="text-end text-xs font-semibold pe-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSession.subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No subjects configured for {currentSession.groupLabel}.
                  </TableCell>
                </TableRow>
              ) : (
                currentSession.subjects.map((subject) => (
                  <TableRow key={subject.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <p className="font-medium text-xs text-foreground">{subject.name}</p>
                      <p className="font-urdu text-[11px] text-muted-foreground">{subject.nameUrdu}</p>
                    </TableCell>
                    <TableCell className="text-xs">{subject.examDate ? formatDate(subject.examDate) : "-"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {[subject.startTime, subject.endTime].filter(Boolean).join(" - ") || "-"}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs">
                      {subject.totalMarks} / {subject.passingMarks}
                    </TableCell>
                    <TableCell className="text-end">
                      <Badge variant={subject.locked ? "secondary" : "outline"} className="text-[10px]">
                        {subject.locked ? "Locked" : "Open"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end pe-4">
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary hover:text-primary">
                        <Link
                          to={system === "school" ? "/school/exams/$id/results" : "/madrassa/exams/$id/marks"}
                          params={{ id: currentSession.id }}
                        >
                          Marks →
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Delete Single Class Dialog */}
      <AlertDialog
        open={!!deleteSessionTarget}
        onOpenChange={(open) => !open && setDeleteSessionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Class from Examination</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &ldquo;{deleteSessionTarget?.groupLabel}&rdquo; from this examination? This will delete the session and associated marks for this class only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSession}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={deletingSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSession ? "Removing..." : "Remove Class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function ClassActionLinks({ session, system }: { session: ExamSession; system: ExamSystem }) {
  if (system === "school") {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2 gap-1">
          <Link to="/school/exams/$id/seating" params={{ id: session.id }}>
            <Grid3x3 className="h-3 w-3" /> Seating
          </Link>
        </Button>
        <Button asChild size="sm" className="h-7 text-xs px-2 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs">
          <Link to="/school/exams/$id/results" params={{ id: session.id }}>
            <Award className="h-3 w-3" /> Marks
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2 gap-1">
        <Link to="/madrassa/exams/$id/seating" params={{ id: session.id }}>
          <Grid3x3 className="h-3 w-3" /> Seating
        </Link>
      </Button>
      <Button asChild size="sm" className="h-7 text-xs px-2 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs">
        <Link to="/madrassa/exams/$id/marks" params={{ id: session.id }}>
          <Award className="h-3 w-3" /> Marks
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2 gap-1">
        <Link to="/madrassa/exams/$id/results" params={{ id: session.id }}>
          <FileText className="h-3 w-3" /> Results
        </Link>
      </Button>
    </div>
  );
}

function GroupedExamTableView({
  exams,
  onDelete,
}: {
  exams: GroupedExam[];
  onDelete?: (exam: GroupedExam) => void;
}) {
  return (
    <Card className="overflow-hidden border border-border/70 shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold text-xs">Exam Title</TableHead>
              <TableHead className="font-semibold text-xs text-center">Classes</TableHead>
              <TableHead className="font-semibold text-xs">Academic Year</TableHead>
              <TableHead className="font-semibold text-xs">Date Range</TableHead>
              <TableHead className="font-semibold text-xs text-center">Total Subjects</TableHead>
              <TableHead className="font-semibold text-xs text-center">Total Students</TableHead>
              <TableHead className="font-semibold text-xs text-center">Status</TableHead>
              <TableHead className="font-semibold text-xs text-end pe-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((exam) => {
              const detailPath =
                exam.system === "school"
                  ? `/school/exams/${exam.primaryId}`
                  : `/madrassa/exams/${exam.primaryId}`;
              return (
                <TableRow key={exam.key} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{exam.cleanTitle}</p>
                        <p className="font-urdu text-[11px] text-muted-foreground">{exam.nameUrdu}</p>
                        {exam.institutionName && (
                          <p className="text-[10px] text-muted-foreground/80 mt-0.5 flex items-center gap-1 font-medium">
                            <Building2 className="h-2.5 w-2.5 opacity-70" />
                            {exam.institutionName}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="gap-1 font-semibold text-xs py-0.5 px-2 bg-primary/10 text-primary border border-primary/20">
                      <Layers className="h-3 w-3" />
                      {exam.totalClasses} {exam.totalClasses === 1 ? "Class" : "Classes"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{exam.academicYear}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
                  </TableCell>
                  <TableCell className="text-center font-medium text-xs">
                    {exam.totalSubjects}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-xs">
                    {exam.totalStudents}
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
                      <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                        <Link to={detailPath as any}>
                          <Eye className="h-3.5 w-3.5" /> Detail
                        </Link>
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(exam)}
                          title="Delete Exam"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function GroupedExamCard({
  exam,
  onDelete,
}: {
  exam: GroupedExam;
  onDelete?: (exam: GroupedExam) => void;
}) {
  const detailPath =
    exam.system === "school"
      ? `/school/exams/${exam.primaryId}`
      : `/madrassa/exams/${exam.primaryId}`;

  return (
    <Card className="flex flex-col p-5 border border-border/70 hover:border-primary/40 hover:shadow-md transition-all duration-200 group bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-base tracking-tight truncate group-hover:text-primary transition-colors">
              {exam.cleanTitle}
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
              title="Delete Exam"
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
          <Layers className="h-3 w-3" />
          {exam.totalClasses} {exam.totalClasses === 1 ? "Class" : "Classes"}
        </Badge>
        {exam.institutionName && (
          <Badge variant="outline" className="text-xs text-muted-foreground py-0.5 px-2 gap-1">
            <Building2 className="h-3 w-3 opacity-70" />
            {exam.institutionName}
          </Badge>
        )}
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
            {exam.totalStudents} Students
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Subjects
          </p>
          <p className="font-semibold text-foreground mt-0.5">
            {exam.totalSubjects} Subjects
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Award className="h-3 w-3" />
            Status
          </p>
          <p className="font-medium text-foreground mt-0.5">
            {exam.allLocked ? "Locked" : "Open for Marks"}
          </p>
        </div>
      </div>

      {exam.classLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 items-center">
          {exam.classLabels.slice(0, 3).map((lbl, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium"
            >
              {lbl}
            </span>
          ))}
          {exam.classLabels.length > 3 && (
            <span className="text-[11px] text-muted-foreground font-medium">
              +{exam.classLabels.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border/60">
        <Button asChild size="sm" className="w-full gap-1.5 text-xs h-8.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-medium">
          <Link to={detailPath as any}>
            <Eye className="h-3.5 w-3.5" /> View Exam & Participating Classes ({exam.totalClasses})
          </Link>
        </Button>
      </div>
    </Card>
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
}>(form: T, _options: AcademicOptions, _system: ExamSystem): T {
  const classId = form.classId || "all";
  const sectionId = form.sectionId || "";
  const categoryId = form.categoryId || "all";
  const subcategoryId = form.subcategoryId || "all";
  return { ...form, classId, sectionId, categoryId, subcategoryId };
}
