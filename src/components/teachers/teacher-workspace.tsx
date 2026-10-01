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
  Trash2,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CredentialsOverlay } from "@/features/users/credentials-display";
import { formatDate, formatPKR } from "@/lib/formatters";
import { AddTeacherDialog } from "./add-teacher-dialog";
import { deleteTeacher, listTeachers, setTeacherActive } from "./teacher-api";
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
  switch (systemScope) {
    case "all":
      return "All";
    case "school":
      return "School";
    case "madrassa":
      return "Madrassa";
    case "qasmia-both":
      return "All Qasim (Both)";
    case "qasmia-madrassa":
      return "Qasim Madrassa";
    case "qasmia-school":
      return "Qasim School";
    case "zainab-both":
      return "All Zainab (Both)";
    case "zainab-madrassa":
      return "Zainab Madrassa";
    case "zainab-school":
      return "Zainab School";
    default:
      return systemScope;
  }
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
  const [deleteTarget, setDeleteTarget] = useState<TeacherListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTeacher(deleteTarget.id);
      setTeachers((current) => current.filter((teacher) => teacher.id !== deleteTarget.id));
      toast.success("Teacher deleted");
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Could not delete teacher");
    } finally {
      setDeleting(false);
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
                <SelectItem value="all">All</SelectItem>
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
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[220px]">Teacher — استاد</TableHead>
                <TableHead className="min-w-[160px]">Email</TableHead>
                <TableHead className="hidden md:table-cell min-w-[130px]">Designation</TableHead>
                <TableHead className="hidden md:table-cell min-w-[110px]">System</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[150px]">Qualification</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[110px]">Joined</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[110px] text-end">Salary</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="w-[190px] text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                          {initials(teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{teacher.name}</p>
                        {teacher.nameUrdu && (
                          <p dir="rtl" lang="ur" className="truncate text-xs font-urdu text-muted-foreground">
                            {teacher.nameUrdu}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="truncate text-xs text-muted-foreground">{teacher.email}</p>
                    {teacher.phone && <p className="truncate text-xs text-muted-foreground">{teacher.phone}</p>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{teacher.designation}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {systemLabel(teacher.systemScope)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {teacher.qualification ? (
                      <Badge variant="secondary" className="max-w-full truncate">
                        {teacher.qualification}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{formatDate(teacher.joinedAt)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-end font-mono text-sm">
                    {formatPKR(teacher.baseMonthlySalaryPaisa)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={teacher.employmentStatus} showUrdu={false} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
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
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        aria-label="Delete teacher"
                        onClick={() => setDeleteTarget(teacher)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teacher profile, assignments, timetable, and linked login account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
