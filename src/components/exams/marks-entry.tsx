import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Lock, Printer, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { DmcView } from "@/components/exams/dmc-view";
import {
  getDmc,
  getExamSession,
  getMarksEntry,
  lockExamSubject,
  publishExam,
  saveMarks,
} from "@/components/exams/exam-api";
import type { DmcPayload, ExamAttendanceStatus, ExamSession, MarksEntryPayload } from "@/components/exams/exam-types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Props = {
  examId: string;
  system: "school" | "madrassa";
  readOnly?: boolean;
};

type DraftMark = {
  attendanceStatus: ExamAttendanceStatus;
  obtainedMarks: string;
  notes: string;
};

export function MarksEntry({ examId, system, readOnly }: Props) {
  const [exam, setExam] = useState<ExamSession | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [payload, setPayload] = useState<MarksEntryPayload | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftMark>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [dmc, setDmc] = useState<DmcPayload | null>(null);

  const loadExam = useCallback(async () => {
    const next = await getExamSession(examId);
    setExam(next.exam);
    setSubjectId((current) => current || next.exam.subjects[0]?.id || "");
  }, [examId]);

  const loadMarks = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const next = await getMarksEntry(examId, subjectId);
      setPayload(next);
      setDrafts(
        Object.fromEntries(
          next.students.map((student) => [
            student.id,
            {
              attendanceStatus: student.mark?.attendanceStatus ?? "present",
              obtainedMarks: student.mark?.obtainedMarks === null || student.mark?.obtainedMarks === undefined
                ? ""
                : String(student.mark.obtainedMarks),
              notes: student.mark?.notes ?? "",
            },
          ]),
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load marks");
    } finally {
      setLoading(false);
    }
  }, [examId, subjectId]);

  useEffect(() => {
    void loadExam().catch((error) => toast.error(error instanceof Error ? error.message : "Could not load exam"));
  }, [loadExam]);

  useEffect(() => {
    void loadMarks();
  }, [loadMarks]);

  const subject = useMemo(() => exam?.subjects.find((item) => item.id === subjectId) ?? null, [exam, subjectId]);
  const stats = useMemo(() => {
    const students = payload?.students ?? [];
    const total = students.length;
    let entered = 0;
    let pass = 0;
    for (const student of students) {
      const draft = drafts[student.id];
      const mark = Number(draft?.obtainedMarks ?? "");
      if (draft?.attendanceStatus !== "present" || draft.obtainedMarks !== "") entered += 1;
      if (draft?.attendanceStatus === "present" && subject && mark >= subject.passingMarks) pass += 1;
    }
    return { total, entered, pass, fail: Math.max(0, entered - pass) };
  }, [drafts, payload?.students, subject]);

  async function handleSave() {
    if (!payload || !subject || readOnly) return;
    setSaving(true);
    try {
      const next = await saveMarks(examId, {
        examSubjectId: subject.id,
        rows: payload.students.map((student) => {
          const draft = drafts[student.id] ?? { attendanceStatus: "present", obtainedMarks: "", notes: "" };
          return {
            studentId: student.id,
            enrollmentId: student.enrollmentId,
            attendanceStatus: draft.attendanceStatus,
            obtainedMarks: draft.attendanceStatus === "present" ? Number(draft.obtainedMarks || 0) : null,
            notes: draft.notes || undefined,
          };
        }),
      });
      setPayload(next);
      toast.success("Marks saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save marks");
    } finally {
      setSaving(false);
    }
  }

  async function handleLock() {
    if (!subject) return;
    try {
      const next = await lockExamSubject(examId, subject.id);
      setExam(next.exam);
      setConfirmLock(false);
      toast.success("Subject locked");
      await loadMarks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not lock subject");
    }
  }

  async function handlePublish() {
    try {
      const next = await publishExam(examId);
      setExam(next.exam);
      setConfirmPublish(false);
      toast.success("Exam published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish exam");
    }
  }

  async function openDmc(studentId: string) {
    try {
      setDmc(await getDmc(examId, studentId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load DMC");
    }
  }

  if (!exam) return <Card className="p-6 text-sm text-muted-foreground">Loading exam...</Card>;

  return (
    <div>
      <BackLink system={system} examId={examId} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-urdu text-[28px] font-bold leading-tight">{readOnly ? "نتائج" : "نمبر درج کریں"}</h1>
          <p className="font-heading text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {readOnly ? "Exam Results" : "Mark Entry"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {exam.name} · {exam.groupLabel} · {exam.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print
          </Button>
          {!readOnly && (
            <>
              <Button size="sm" variant="outline" disabled={!subject || subject.locked || saving} onClick={() => void handleSave()}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save
              </Button>
              <Button size="sm" variant="outline" disabled={!subject || subject.locked} onClick={() => setConfirmLock(true)}>
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Lock Subject
              </Button>
              <Button size="sm" disabled={exam.status === "published"} onClick={() => setConfirmPublish(true)}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Publish
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-3 lg:col-span-2">
          <p className="mb-1.5 text-xs text-muted-foreground">Subject</p>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {exam.subjects.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} · {item.nameUrdu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
        <Stat label="Roster" value={`${stats.total}`} />
        <Stat label="Entered" value={`${stats.entered}/${stats.total}`} />
        <Stat label="Pass / Fail" value={`${stats.pass}/${stats.fail}`} />
      </div>

      {subject?.locked && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          This subject is locked. Marks are read-only.
        </div>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Marks</TableHead>
              <TableHead className="text-end">Result</TableHead>
              <TableHead className="text-end">DMC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6}>Loading marks...</TableCell></TableRow>
            ) : !payload || payload.students.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No active students in this exam roster.</TableCell></TableRow>
            ) : (
              payload.students.map((student) => {
                const draft = drafts[student.id] ?? { attendanceStatus: "present", obtainedMarks: "", notes: "" };
                const mark = Number(draft.obtainedMarks || 0);
                const pass = draft.attendanceStatus === "present" && subject ? mark >= subject.passingMarks : false;
                const disabled = readOnly || subject?.locked || exam.status === "published";
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs">{student.rollNo}</TableCell>
                    <TableCell>
                      <p className="font-medium">{student.name}</p>
                      <p className="font-urdu text-sm text-muted-foreground">{student.nameUrdu}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={draft.attendanceStatus}
                        disabled={disabled}
                        onValueChange={(value) => updateDraft(student.id, { attendanceStatus: value as ExamAttendanceStatus })}
                      >
                        <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="leave">Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-end">
                      <Input
                        type="number"
                        min={0}
                        max={subject?.totalMarks ?? 100}
                        disabled={disabled || draft.attendanceStatus !== "present"}
                        className="ml-auto h-8 w-20 text-end font-mono"
                        value={draft.obtainedMarks}
                        onChange={(event) => updateDraft(student.id, { obtainedMarks: event.target.value })}
                      />
                    </TableCell>
                    <TableCell className="text-end">
                      <Badge variant={pass ? "secondary" : "destructive"} className={cn(draft.attendanceStatus !== "present" && "capitalize")}>
                        {draft.attendanceStatus === "present" ? (pass ? "Pass" : "Fail") : draft.attendanceStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        disabled={exam.status !== "published"}
                        onClick={() => void openDmc(student.id)}
                        aria-label="Open DMC"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={confirmLock} onOpenChange={setConfirmLock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock this subject?</AlertDialogTitle>
            <AlertDialogDescription>
              Marks for this subject become read-only. Publishing requires all subjects to be locked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleLock()}>Lock Subject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish exam results?</AlertDialogTitle>
            <AlertDialogDescription>
              Published results are used for DMCs, student timelines, reports, and annual transcripts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handlePublish()}>Publish Results</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResponsiveDialog
        title="Detailed Marks Certificate"
        description="Print-ready DMC generated from published results."
        open={!!dmc}
        onOpenChange={(open) => !open && setDmc(null)}
        icon={FileText}
        className="sm:max-w-4xl"
      >
        {dmc && <DmcView data={dmc} />}
      </ResponsiveDialog>
    </div>
  );

  function updateDraft(studentId: string, patch: Partial<DraftMark>) {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        attendanceStatus: current[studentId]?.attendanceStatus ?? "present",
        obtainedMarks: current[studentId]?.obtainedMarks ?? "",
        notes: current[studentId]?.notes ?? "",
        ...patch,
      },
    }));
  }
}

function BackLink({ system, examId }: { system: "school" | "madrassa"; examId: string }) {
  if (system === "school") {
    return (
      <Link to="/school/exams/$id" params={{ id: examId }} className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        Back to exam
      </Link>
    );
  }
  return (
    <Link to="/madrassa/exams/$id" params={{ id: examId }} className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
      Back to exam
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-bold">{value}</p>
    </Card>
  );
}
