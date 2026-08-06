import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Eye,
  GraduationCap,
  IdCard,
  Loader2,
  Plus,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CredentialsOverlay } from "@/features/users/credentials-display";
import { formatDate, formatPKR } from "@/lib/formatters";
import { AddTeacherDialog } from "./add-teacher-dialog";
import { listTeachers, setTeacherActive } from "./teacher-api";
import type { TeacherCredentials, TeacherListItem, TeacherSystemScope } from "./teacher-types";

type StatusFilter = "all" | "active" | "inactive";
type SystemFilter = "all" | TeacherSystemScope;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function systemLabel(systemScope: TeacherSystemScope) {
  if (systemScope === "both") return "Both systems";
  return systemScope === "madrassa" ? "Madrassa" : "School";
}

export function TeacherWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [systemScope, setSystemScope] = useState<SystemFilter>("all");
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [credentials, setCredentials] = useState<TeacherCredentials | null>(null);
  const [actionTeacher, setActionTeacher] = useState<TeacherListItem | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ status, systemScope });
      if (query.trim()) params.set("q", query.trim());
      const rows = await listTeachers(params);
      setTeachers(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load teachers";
      setTeachers([]);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [query, status, systemScope]);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  const activeCount = useMemo(
    () => teachers.filter((teacher) => teacher.employmentStatus === "active").length,
    [teachers],
  );

  async function handleCreated(creds: TeacherCredentials) {
    setCredentials(creds);
    await loadTeachers();
  }

  async function confirmStatusChange() {
    if (!actionTeacher) return;
    const nextActive = actionTeacher.employmentStatus !== "active";
    setSubmittingStatus(true);
    try {
      const detail = await setTeacherActive(actionTeacher.id, nextActive);
      setTeachers((current) =>
        current.map((teacher) =>
          teacher.id === actionTeacher.id
            ? {
                ...teacher,
                employmentStatus: detail.profile.employmentStatus,
              }
            : teacher,
        ),
      );
      toast.success(nextActive ? "Teacher activated" : "Teacher deactivated");
      setActionTeacher(null);
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "Could not update teacher");
    } finally {
      setSubmittingStatus(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers"
        titleUrdu="اساتذہ"
        description={`${activeCount} active teacher${activeCount === 1 ? "" : "s"} across madrassa and school systems.`}
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      <Card className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, designation..."
              className="pe-9"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={systemScope} onValueChange={(value) => setSystemScope(value as SystemFilter)}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="System" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All systems</SelectItem>
                <SelectItem value="both">Both systems</SelectItem>
                <SelectItem value="madrassa">Madrassa</SelectItem>
                <SelectItem value="school">School</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadTeachers()}
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
          Loading teachers...
        </Card>
      ) : teachers.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            heading={error ? "Could not load teachers" : "No teachers found"}
            headingUrdu={error ? "اساتذہ لوڈ نہیں ہوئے" : "کوئی استاد نہیں"}
            description={error ?? "Create a teacher from this screen to generate the linked login account."}
            action={error ? { label: "Retry", onClick: () => void loadTeachers() } : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="p-4 transition-colors hover:border-primary/40">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                    {initials(teacher.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{teacher.name}</p>
                  {teacher.nameUrdu && (
                    <p dir="rtl" lang="ur" className="truncate text-sm font-urdu text-muted-foreground">
                      {teacher.nameUrdu}
                    </p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">{teacher.email}</p>
                </div>
                <StatusBadge status={teacher.employmentStatus} showUrdu={false} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Info label="Designation" value={teacher.designation} />
                <Info label="System" value={systemLabel(teacher.systemScope)} />
                <Info label="Joined" value={formatDate(teacher.joinedAt)} />
                <Info label="Salary" value={formatPKR(teacher.baseMonthlySalaryPaisa)} mono />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {teacher.qualification && (
                  <Badge variant="secondary" className="max-w-full truncate">
                    {teacher.qualification}
                  </Badge>
                )}
                {teacher.phone && <Badge variant="outline">{teacher.phone}</Badge>}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild aria-label="View profile">
                    <Link to="/teachers/$id" params={{ id: teacher.id }}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild aria-label="ID card">
                    <Link to="/id-cards">
                      <IdCard className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Timetable" asChild>
                    <Link to="/teachers/$id" params={{ id: teacher.id }}>
                      <CalendarDays className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant={teacher.employmentStatus === "active" ? "outline" : "secondary"}
                  className="gap-1.5"
                  onClick={() => setActionTeacher(teacher)}
                >
                  {teacher.employmentStatus === "active" ? (
                    <UserX className="h-3.5 w-3.5" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                  {teacher.employmentStatus === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddTeacherDialog open={addOpen} onOpenChange={setAddOpen} onCreated={handleCreated} />
      <CredentialsOverlay creds={credentials} onClose={() => setCredentials(null)} />

      <AlertDialog open={!!actionTeacher} onOpenChange={(open) => !open && setActionTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTeacher?.employmentStatus === "active" ? "Deactivate teacher?" : "Activate teacher?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTeacher?.employmentStatus === "active"
                ? "This disables the teacher login and deactivates assignments and timetable periods."
                : "This reactivates the teacher profile and login account. Assignments can be restored separately if needed."}
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

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 truncate text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
