import { Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  GraduationCap,
  IdCard,
  Loader2,
  Mail,
  Pencil,
  Printer,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ResponsiveSheet } from "@/components/custom/responsive-sheet";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatPKR } from "@/lib/formatters";
import { TeacherAssignmentManager } from "./teacher-assignment-manager";
import { getTeacher, setTeacherActive, updateTeacher } from "./teacher-api";
import { TeacherTimetableManager } from "./teacher-timetable-manager";
import type {
  TeacherDetail,
  TeacherPaymentMethod,
  TeacherSystemScope,
} from "./teacher-types";

type TeacherProfileTab = "overview" | "assignments" | "timetable" | "salary" | "account";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fallback(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

export function TeacherProfileWorkspace() {
  const { id } = useParams({ from: "/_authenticated/teachers/$id" });
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TeacherProfileTab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const loadTeacher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTeacher(await getTeacher(id));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load teacher";
      setError(message);
      setTeacher(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTeacher();
  }, [loadTeacher]);

  const display = useMemo(() => {
    if (!teacher) return null;
    const name = teacher.profile.name ?? teacher.account.name;
    return {
      name,
      nameUrdu: teacher.profile.nameUrdu ?? teacher.account.nameUrdu ?? null,
      email: teacher.profile.email ?? teacher.account.email,
      phone: teacher.profile.phone ?? teacher.account.phone ?? null,
      cnic: teacher.profile.cnic ?? teacher.account.cnic ?? null,
      initials: initials(name),
    };
  }, [teacher]);

  async function confirmStatusChange() {
    if (!teacher) return;
    const nextActive = teacher.profile.employmentStatus !== "active";
    setSubmittingStatus(true);
    try {
      const nextTeacher = await setTeacherActive(teacher.profile.id, nextActive);
      setTeacher(nextTeacher);
      toast.success(nextActive ? "Teacher activated" : "Teacher deactivated");
      setStatusConfirmOpen(false);
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "Could not update teacher");
    } finally {
      setSubmittingStatus(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
        Loading teacher profile...
      </Card>
    );
  }

  if (!teacher || !display) {
    return (
      <Card>
        <EmptyState
          icon={GraduationCap}
          heading="Teacher unavailable"
          headingUrdu="استاد دستیاب نہیں"
          description={error ?? "The teacher profile could not be loaded."}
          action={{ label: "Retry", onClick: () => void loadTeacher() }}
        />
      </Card>
    );
  }

  const isActive = teacher.profile.employmentStatus === "active";

  return (
    <div className="space-y-4">
      <Link
        to="/teachers"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        All teachers
      </Link>

      <PageHeader
        title={display.name}
        titleUrdu={display.nameUrdu ?? "استاد پروفائل"}
        description={`${teacher.profile.designation} · ${fallback(teacher.profile.qualification)}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to="/id-cards">
                <IdCard className="h-3.5 w-3.5" />
                ID Card
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              variant={isActive ? "destructive" : "secondary"}
              className="gap-1.5"
              onClick={() => setStatusConfirmOpen(true)}
            >
              {isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
              {isActive ? "Deactivate" : "Activate"}
            </Button>
          </>
        }
      />

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar className="h-20 w-20 rounded-2xl">
              <AvatarFallback className="rounded-2xl bg-primary/10 text-2xl font-semibold text-primary">
                {display.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">{display.name}</p>
              {display.nameUrdu && (
                <p dir="rtl" lang="ur" className="truncate font-urdu text-xl font-semibold text-muted-foreground">
                  {display.nameUrdu}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={teacher.profile.employmentStatus} showUrdu={false} />
                <Badge variant="secondary">{teacher.profile.systemScope}</Badge>
                <Badge variant="outline">{teacher.profile.designation}</Badge>
              </div>
            </div>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[360px]">
            <Summary icon={Mail} label="Email" value={display.email} />
            <Summary icon={Shield} label="Account" value={teacher.account.banned ? "Banned" : teacher.account.status ?? "Active"} />
            <Summary icon={Banknote} label="Salary" value={formatPKR(teacher.profile.baseMonthlySalaryPaisa)} />
            <Summary icon={CalendarClock} label="Joined" value={formatDate(teacher.profile.joinedAt)} />
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TeacherProfileTab)}>
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="salary">Salary Info</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Info label="Designation" value={teacher.profile.designation} />
              <Info label="Qualification" value={fallback(teacher.profile.qualification)} />
              <Info label="Qualification Urdu" value={fallback(teacher.profile.qualificationUrdu)} urdu />
              <Info label="Phone" value={fallback(display.phone)} />
              <Info label="CNIC" value={fallback(display.cnic)} mono />
              <Info label="Gender" value={fallback(teacher.profile.gender)} />
              <Info label="Address" value={fallback(teacher.profile.address)} wide />
              <Info label="Notes" value={fallback(teacher.profile.notes)} wide />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <TeacherAssignmentManager teacher={teacher} onChange={setTeacher} />
        </TabsContent>

        <TabsContent value="timetable" className="mt-4">
          <TeacherTimetableManager teacher={teacher} onChange={setTeacher} />
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Salary Info</h2>
                <p className="text-sm text-muted-foreground">Input-only compensation profile.</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Info label="Base monthly salary" value={formatPKR(teacher.profile.baseMonthlySalaryPaisa)} mono />
              <Info label="Payment method" value={teacher.profile.paymentMethod} />
              <Info label="Salary effective date" value={teacher.profile.salaryEffectiveDate ? formatDate(teacher.profile.salaryEffectiveDate) : "-"} />
              <Info label="Bank name" value={fallback(teacher.profile.bankName)} />
              <Info label="Bank account / IBAN" value={fallback(teacher.profile.bankAccount)} mono wide />
              <Info label="Salary notes" value={fallback(teacher.profile.salaryNotes)} wide />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Account</h2>
                <p className="text-sm text-muted-foreground">Better Auth identity linked to this profile.</p>
              </div>
              <Button
                variant={isActive ? "destructive" : "secondary"}
                size="sm"
                className="gap-1.5"
                onClick={() => setStatusConfirmOpen(true)}
              >
                {isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                {isActive ? "Disable Login" : "Activate Login"}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="User ID" value={teacher.account.id} mono />
              <Info label="Email" value={teacher.account.email} />
              <Info label="Account status" value={teacher.account.status ?? "active"} />
              <Info label="Banned" value={teacher.account.banned ? "Yes" : "No"} />
              <Info label="Profile ID" value={teacher.profile.id} mono />
              <Info label="Profile status" value={teacher.profile.employmentStatus} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <TeacherEditSheet
        teacher={teacher}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={setTeacher}
      />

      <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isActive ? "Deactivate teacher?" : "Activate teacher?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? "This disables the teacher login and deactivates assignments and timetable periods."
                : "This restores the teacher profile and login account. Inactive assignments can be restored separately if needed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmStatusChange()} disabled={submittingStatus}>
              {submittingStatus ? "Saving..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TeacherEditSheet({
  teacher,
  open,
  onOpenChange,
  onUpdated,
}: {
  teacher: TeacherDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (teacher: TeacherDetail) => void;
}) {
  const [systemScope, setSystemScope] = useState<TeacherSystemScope>(teacher.profile.systemScope);
  const [paymentMethod, setPaymentMethod] = useState<TeacherPaymentMethod>(teacher.profile.paymentMethod);
  const [gender, setGender] = useState(teacher.profile.gender ?? "none");
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSystemScope(teacher.profile.systemScope);
    setPaymentMethod(teacher.profile.paymentMethod);
    setGender(teacher.profile.gender ?? "none");
    setDirty(false);
  }, [open, teacher.profile.gender, teacher.profile.paymentMethod, teacher.profile.systemScope]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const salaryRupees = Number(form.get("baseMonthlySalary") || 0);
      const nextTeacher = await updateTeacher(teacher.profile.id, {
        systemScope,
        gender: gender === "none" ? undefined : gender,
        designation: String(form.get("designation") ?? "").trim(),
        qualification: optional(form.get("qualification")),
        qualificationUrdu: optional(form.get("qualificationUrdu")),
        address: optional(form.get("address")),
        joinedAt: String(form.get("joinedAt") ?? ""),
        baseMonthlySalaryPaisa: Math.round((Number.isFinite(salaryRupees) ? salaryRupees : 0) * 100),
        bankName: optional(form.get("bankName")),
        bankAccount: optional(form.get("bankAccount")),
        paymentMethod,
        salaryEffectiveDate: optional(form.get("salaryEffectiveDate")),
        salaryNotes: optional(form.get("salaryNotes")),
        notes: optional(form.get("notes")),
      });
      onUpdated(nextTeacher);
      setDirty(false);
      onOpenChange(false);
      toast.success("Teacher profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update teacher");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Teacher"
      description="Update profile and salary information."
      icon={Pencil}
      isDirty={dirty && !submitting}
      className="sm:min-w-[720px]"
    >
      <form onSubmit={handleSubmit} onChange={() => setDirty(true)} className="space-y-5 pt-4">
        <section className="grid gap-4 md:grid-cols-2">
          <Field label="System scope">
            <Select
              value={systemScope}
              onValueChange={(value) => {
                setSystemScope(value as TeacherSystemScope);
                setDirty(true);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both systems</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="madrassa">Madrassa</SelectItem>
                <SelectItem value="qasmia-both">All Qasim (Both)</SelectItem>
                <SelectItem value="qasmia-madrassa">Qasim Madrassa</SelectItem>
                <SelectItem value="qasmia-school">Qasim School</SelectItem>
                <SelectItem value="zainab-both">All Zainab (Both)</SelectItem>
                <SelectItem value="zainab-madrassa">Zainab Madrassa</SelectItem>
                <SelectItem value="zainab-school">Zainab School</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Gender">
            <Select
              value={gender}
              onValueChange={(value) => {
                setGender(value);
                setDirty(true);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Designation">
            <Input name="designation" defaultValue={teacher.profile.designation} required />
          </Field>
          <Field label="Joined at">
            <Input name="joinedAt" type="date" defaultValue={teacher.profile.joinedAt} required />
          </Field>
          <Field label="Qualification">
            <Input name="qualification" defaultValue={teacher.profile.qualification ?? ""} />
          </Field>
          <Field label="Qualification in Urdu">
            <Input
              name="qualificationUrdu"
              defaultValue={teacher.profile.qualificationUrdu ?? ""}
              dir="rtl"
              lang="ur"
              className="font-urdu"
            />
          </Field>
          <Field label="Address">
            <Input name="address" defaultValue={teacher.profile.address ?? ""} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" defaultValue={teacher.profile.notes ?? ""} rows={3} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4 border-t pt-4 md:grid-cols-2">
          <Field label="Base monthly salary">
            <Input
              name="baseMonthlySalary"
              type="number"
              min={0}
              step={1}
              defaultValue={Math.round(teacher.profile.baseMonthlySalaryPaisa / 100)}
            />
          </Field>
          <Field label="Payment method">
            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value as TeacherPaymentMethod);
                setDirty(true);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Bank name">
            <Input name="bankName" defaultValue={teacher.profile.bankName ?? ""} />
          </Field>
          <Field label="Bank account / IBAN">
            <Input name="bankAccount" defaultValue={teacher.profile.bankAccount ?? ""} />
          </Field>
          <Field label="Salary effective date">
            <Input name="salaryEffectiveDate" type="date" defaultValue={teacher.profile.salaryEffectiveDate ?? ""} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Salary notes">
              <Textarea name="salaryNotes" defaultValue={teacher.profile.salaryNotes ?? ""} rows={3} />
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" className="gap-2" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </ResponsiveSheet>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm">{value}</p>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono,
  urdu,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  urdu?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        dir={urdu ? "rtl" : undefined}
        lang={urdu ? "ur" : undefined}
        className={`mt-0.5 text-sm ${mono ? "font-mono" : ""} ${urdu ? "font-urdu" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
