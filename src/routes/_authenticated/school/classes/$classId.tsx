import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardList, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { BookLoader } from "@/components/shared/book-loader";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/hooks/use-auth";
import { createExamSubject, deleteExamSubject, listExamSubjects, updateExamSubject } from "@/components/exams/exam-api";
import type { ExamSubject } from "@/components/exams/exam-types";

export const Route = createFileRoute("/_authenticated/school/classes/$classId")({
  component: ClassDetailPage,
});

type Klass = {
  id: string;
  name: string;
  nameUrdu: string;
  level: string;
  govtEquivalent: string | null;
  gender: string | null;
  institutionId: string;
  active: boolean;
  enrollmentCount: number;
  sections: Array<{ id: string; name: string; group: string | null; active: boolean; enrollmentCount: number }>;
};

type AcademicYear = {
  id: string;
  name: string;
  system: "school" | "madrassa";
  status: "upcoming" | "active" | "locked" | "archived";
};

function ClassDetailPage() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const { classId } = Route.useParams();
  const { user, isLoading } = useAuth();
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";

  const t = useMemo(() => (en: string, ur: string) => (isUrdu ? ur : en), [isUrdu]);

  const [classData, setClassData] = useState<Klass | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; systemScope: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nameUrdu: "",
    totalMarks: 100,
    passingMarks: 33,
    teacherId: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    nameUrdu: "",
    totalMarks: 100,
    passingMarks: 33,
    active: true,
    teacherId: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<ExamSubject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const allowedTeacherSystemScopes = useMemo(() => {
    return new Set(["school", "both", "all", "qasmia-school", "qasmia-both", "qasmia-madrassa", "madrassa", "zainab-school", "zainab-both", "zainab-madrassa"]);
  }, []);

  const visibleTeachers = useMemo(() => {
    return teachers.filter((teacher) => allowedTeacherSystemScopes.has(teacher.systemScope));
  }, [teachers, allowedTeacherSystemScopes]);

  const tRef = useRef<((en: string, ur: string) => string)>((en: string, ur: string) => ur);
  tRef.current = t;

  const loadClass = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, yearsRes, teachersRes] = await Promise.all([
        fetch("/api/academic/school/classes", { credentials: "include" }),
        fetch("/api/academic-years", { credentials: "include" }),
        fetch("/api/teachers?all=true", { credentials: "include" }),
      ]);

      const classesPayload = await classesRes.json().catch(() => ({}));
      if (!classesRes.ok) throw new Error(classesPayload.error || "Could not load classes");

      const yearsPayload = await yearsRes.json().catch(() => ({}));
      if (!yearsRes.ok) throw new Error(yearsPayload.error || "Could not load academic years");

      const teachersPayload = await teachersRes.json().catch(() => ({}));
      if (teachersRes.ok) {
        const list = Array.isArray(teachersPayload)
          ? teachersPayload.map((t: any) => ({ id: t.id, name: t.name, systemScope: t.systemScope }))
          : (teachersPayload.teachers ?? []).map((t: any) => ({ id: t.id, name: t.name, systemScope: t.systemScope }));
        setTeachers(list);
      } else {
        console.error("[class-detail] teachers fetch failed", teachersRes.status, teachersPayload);
        setTeachers([]);
      }

      const allClasses = (classesPayload.classes ?? []) as Klass[];
      const found = allClasses.find((c: Klass) => c.id === classId);

      if (found) {
        setClassData(found);
      } else {
        toast.error(tRef.current("Class not found", "کلاس نہیں ملی"));
      }

      setYears((yearsPayload.years ?? []) as AcademicYear[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load class");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const loadSubjects = useCallback(async () => {
    if (!classId) return;
    setSubjectsLoading(true);
    try {
      const payload = await listExamSubjects({
        system: "school",
        schoolClassId: classId,
      });
      setSubjects(payload.subjects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load subjects");
    } finally {
      setSubjectsLoading(false);
    }
  }, [classId]);

  const openEdit = (subject: ExamSubject) => {
    setEditId(subject.id);
    setEditForm({
      name: subject.name,
      nameUrdu: subject.nameUrdu,
      totalMarks: subject.totalMarks,
      passingMarks: subject.passingMarks,
      active: subject.active,
      teacherId: subject.teacherId ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    if (!editForm.name.trim() || !editForm.nameUrdu.trim()) {
      toast.error(t("Name and Urdu name are required", "نام اور اردو نام درکار ہیں"));
      return;
    }

    setPending(true);
    try {
      await updateExamSubject(editId, {
        name: editForm.name,
        nameUrdu: editForm.nameUrdu,
        totalMarks: editForm.totalMarks,
        passingMarks: editForm.passingMarks,
        active: editForm.active,
        teacherId: editForm.teacherId || undefined,
      });
      toast.success(t("Subject updated", "مضمون اپ ڈیٹ ہو گیا"));
      setEditOpen(false);
      setEditId(null);
      await loadSubjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update subject");
    } finally {
      setPending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExamSubject(deleteTarget.id);
      toast.success(t("Subject deleted", "مضمون حذف ہو گیا"));
      setDeleteTarget(null);
      await loadSubjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete subject");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (subject: ExamSubject) => {
    setTogglingId(subject.id);
    try {
      await updateExamSubject(subject.id, { active: !subject.active });
      toast.success(t("Subject updated", "مضمون اپ ڈیٹ ہو گیا"));
      await loadSubjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update subject");
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    void loadClass();
  }, [loadClass]);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const selectedYear = useMemo(
    () => years.find((y) => y.system === "school" && y.status === "active"),
    [years],
  );

  const addSubject = async () => {
    if (!form.name.trim() || !form.nameUrdu.trim()) {
      toast.error(t("Name and Urdu name are required", "نام اور اردو نام درکار ہیں"));
      return;
    }

    setPending(true);
    try {
      await createExamSubject({
        system: "school",
        schoolClassId: classId,
        name: form.name,
        nameUrdu: form.nameUrdu,
        totalMarks: form.totalMarks,
        passingMarks: form.passingMarks,
        displayOrder: subjects.length + 1,
        teacherId: form.teacherId || undefined,
      });
      toast.success(t("Subject added", "مضمون شامل کر دیا گیا"));
      setOpen(false);
      setForm({ name: "", nameUrdu: "", totalMarks: 100, passingMarks: 33, teacherId: "" });
      await loadSubjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add subject");
    } finally {
      setPending(false);
    }
  };

  if (isLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-sm text-muted-foreground">{t("Class not found.", "کلاس نہیں ملی۔")}</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/school/classes" })}>
          {t("Back to classes", "جماعتوں میں واپس")}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isUrdu ? classData.nameUrdu : classData.name}
        titleUrdu={classData.nameUrdu}
        description={
          selectedYear
            ? t(`Subjects and details for ${selectedYear.name}`, `${selectedYear.name} کے مضامین اور تفصیلات`)
            : t("Subjects and class details", "مضامین اور کلاس کی تفصیلات")
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/school/classes" })}>
              {t("Back", "پیچھے")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("Add Subject", "مضمون شامل کریں")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{t("Total Subjects", "کل مضامین")}</p>
          <p className="font-heading text-2xl font-bold mt-1">{subjects.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{t("Total Enrollment", "کل داخلہ")}</p>
          <p className="font-heading text-2xl font-bold mt-1">{classData.enrollmentCount}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Subject", "مضمون")}</TableHead>
              <TableHead>{t("Teacher", "استاد")}</TableHead>
              <TableHead className="text-end">{t("Marks", "نمارات")}</TableHead>
              <TableHead className="text-end">{t("Status", "حالت")}</TableHead>
              <TableHead className="text-end">{t("Actions", "کارروائیاں")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjectsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">{t("Loading subjects...", "مضامین لوڈ ہو رہے ہیں...")}</TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">{t("No subjects found for this class.", "اس کلاس کے لیے کوئی مضمون نہیں ملا۔")}</TableCell>
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
                      <Badge variant={subject.active ? "secondary" : "outline"}>{subject.active ? t("Active", "فعال") : t("Inactive", "غیر فعال")}</Badge>
                    </TableCell>
                    <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(subject)}
                        disabled={pending || togglingId === subject.id}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleActive(subject)}
                        disabled={pending || togglingId === subject.id}
                      >
                        {subject.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(subject)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }            )
          )}
        </TableBody>
      </Table>
    </Card>

      <ResponsiveDialog
        title={t("Add Subject", "مضمون شامل کریں")}
        description={t("Create a subject for this class.", "اس کلاس کے لیے مضمون بنائیں۔")}
        open={open}
        onOpenChange={setOpen}
        icon={ClipboardList}
      >
        <div className="grid gap-4 p-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <BilingualLabel urdu="نام" english="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("Subject Name", "مضمون کا نام")}
              />
            </BilingualLabel>
            <BilingualLabel urdu="اردو نام" english="Urdu Name">
              <Input
                dir="rtl"
                lang="ur"
                className="font-urdu"
                value={form.nameUrdu}
                onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })}
                placeholder={t("Urdu Name", "اردو نام")}
              />
            </BilingualLabel>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <BilingualLabel urdu="کل نمبرات" english="Total Marks">
              <Input
                type="number"
                min={0}
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })}
              />
            </BilingualLabel>
             <BilingualLabel urdu="پاس نمبرات" english="Passing Marks">
               <Input
                 type="number"
                 min={0}
                 value={form.passingMarks}
                 onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })}
               />
             </BilingualLabel>
           </div>
           <div className="grid gap-3 sm:grid-cols-2">
             <BilingualLabel urdu="استاد" english="Teacher">
               <Select value={form.teacherId} onValueChange={(value) => setForm({ ...form, teacherId: value })}>
                 <SelectTrigger>
                   <SelectValue placeholder={t("Select teacher", "استاد منتخب کریں")} />
                 </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("No teacher", "کوئی استاد نہیں")}</SelectItem>
                    {visibleTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
               </Select>
             </BilingualLabel>
           </div>
           <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("Cancel", "منسوخ کریں")}
            </Button>
            <Button onClick={addSubject} disabled={pending}>
              {pending ? t("Adding...", "شامل ہو رہا ہے...") : t("Add", "شامل کریں")}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title={t("Edit Subject", "مضمون میں ترمیم")}
        description={t("Update subject details.", "مضمون کی تفصیلات اپ ڈیٹ کریں۔")}
        open={editOpen}
        onOpenChange={setEditOpen}
        icon={Pencil}
      >
        <div className="grid gap-4 p-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <BilingualLabel urdu="نام" english="Name">
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder={t("Subject Name", "مضمون کا نام")}
              />
            </BilingualLabel>
            <BilingualLabel urdu="اردو نام" english="Urdu Name">
              <Input
                dir="rtl"
                lang="ur"
                className="font-urdu"
                value={editForm.nameUrdu}
                onChange={(e) => setEditForm({ ...editForm, nameUrdu: e.target.value })}
                placeholder={t("Urdu Name", "اردو نام")}
              />
            </BilingualLabel>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <BilingualLabel urdu="کل نمبرات" english="Total Marks">
              <Input
                type="number"
                min={0}
                value={editForm.totalMarks}
                onChange={(e) => setEditForm({ ...editForm, totalMarks: Number(e.target.value) })}
              />
            </BilingualLabel>
            <BilingualLabel urdu="پاس نمبرات" english="Passing Marks">
              <Input
                type="number"
                min={0}
                value={editForm.passingMarks}
                onChange={(e) => setEditForm({ ...editForm, passingMarks: Number(e.target.value) })}
              />
            </BilingualLabel>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <BilingualLabel urdu="استاد" english="Teacher">
              <Select value={editForm.teacherId} onValueChange={(value) => setEditForm({ ...editForm, teacherId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select teacher", "استاد منتخب کریں")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("No teacher", "کوئی استاد نہیں")}</SelectItem>
                  {visibleTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </BilingualLabel>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t("Cancel", "منسوخ کریں")}
            </Button>
            <Button onClick={saveEdit} disabled={pending}>
              {pending ? t("Saving...", "محفوظ ہو رہا ہے...") : t("Save", "محفوظ کریں")}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete subject?", "مضمون حذف کریں؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action cannot be undone.", "یہ کارروائی واپس نہیں کی جا سکتی۔")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("Cancel", "منسوخ کریں")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? t("Deleting...", "حذف ہو رہا ہے...") : t("Delete", "حذف کریں")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function classPrefix(item: Klass) {
  const number = item.name.match(/\d+/)?.[0];
  if (number) return `G${number}`;
  return item.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
