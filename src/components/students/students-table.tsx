import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Download,
  Eye,
  Filter,
  LogOut,
  MoreHorizontal,
  Search,
  Trash2,
  UserCog,
  Users2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StudentDetailsSheet } from "./student-details-sheet";
import type { StudentListItem, StudentStatus, StudentSystem } from "./student-types";

type Props = { system: StudentSystem; section?: "male" | "female" };

type SchoolClassOption = {
  id: string;
  name: string;
  nameUrdu: string;
};

type MadrassaCategoryOption = {
  id: string;
  name: string;
  nameUrdu: string;
  subcategories: Array<{
    id: string;
    name: string;
    nameUrdu: string;
  }>;
};

const pageSize = 10;

export function StudentsTable({ system, section }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StudentStatus>("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClassOption[]>([]);
  const [madrassaCategories, setMadrassaCategories] = useState<MadrassaCategoryOption[]>([]);

  const loadGroups = useCallback(async () => {
    try {
      let url = "/api/academic/madrassa/categories";
      if (system === "school") {
        url = "/api/academic/school/classes";
      } else if (section) {
        const params = new URLSearchParams();
        params.set("section", section);
        url = `/api/academic/madrassa/categories?${params.toString()}`;
      }
      const response = await fetch(url, { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load filters");
      if (system === "school") setSchoolClasses(payload.classes ?? []);
      else setMadrassaCategories(payload.categories ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load filters");
    }
  }, [system, section]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        system,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query.trim()) params.set("q", query.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (groupFilter !== "all") {
        if (system === "school") params.set("classId", groupFilter);
        else params.set("subcategoryId", groupFilter);
      }
      if (system === "madrassa" && section) params.set("section", section);

      const response = await fetch(`/api/students?${params.toString()}`, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load students");
      setStudents(payload.students ?? []);
      setTotal(Number(payload.pagination?.total ?? 0));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load students");
      setStudents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [groupFilter, page, query, statusFilter, system, section]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/students/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete student");
      toast.success(`${deleteTarget.name} deleted successfully`);
      setDeleteTarget(null);
      await loadStudents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete student");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const groupOptions = useMemo(() => {
    if (system === "school") {
      return schoolClasses.map((item) => ({
        id: item.id,
        name: item.name,
        nameUrdu: item.nameUrdu,
      }));
    }
    return madrassaCategories.flatMap((category) =>
      category.subcategories.map((item) => ({
        id: item.id,
        name: `${category.name} · ${item.name}`,
        nameUrdu: `${category.nameUrdu} · ${item.nameUrdu}`,
      })),
    );
  }, [madrassaCategories, schoolClasses, system]);

  const initials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="نام، رول نمبر، یا فون نمبر سے تلاش کریں…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="pe-9 font-urdu text-sm"
            />
          </div>

          <Select
            value={groupFilter}
            onValueChange={(value) => {
              setGroupFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder={system === "madrassa" ? "Darja" : "Class"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {system === "madrassa" ? "All Darjat — تمام" : "All Classes — تمام"}
              </SelectItem>
              {groupOptions.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  <span className="font-urdu">{group.nameUrdu}</span>
                  <span className="text-muted-foreground ms-2 text-xs">{group.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as "all" | StudentStatus);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active — فعال</SelectItem>
              <SelectItem value="inactive">Inactive — غیر فعال</SelectItem>
              <SelectItem value="graduated">Graduated — فارغ</SelectItem>
              <SelectItem value="dropout">Dropout — تارک</SelectItem>
              <SelectItem value="transferred">Transferred — منتقل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>
          Showing <span className="font-medium text-foreground">{students.length}</span> of{" "}
          <span className="font-medium text-foreground">{total}</span> students
        </p>
        <p className="font-urdu text-sm">کل: {total}</p>
      </div>

<div className="rounded-lg border bg-card overflow-hidden">
  <div className="overflow-x-auto">
    <Table className="w-full">
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="min-w-[100px]">Roll #</TableHead>
          <TableHead className="min-w-[200px]">Student — طالبِ علم</TableHead>
          <TableHead className="hidden md:table-cell min-w-[150px]">Father — والد</TableHead>
          <TableHead className="hidden md:table-cell min-w-[150px]">
            {system === "madrassa" ? "Darja" : "Class"}
          </TableHead>
          <TableHead className="w-[50px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
    <TableBody>
      {loading ? (
        <TableRow>
          <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
            Loading students...
          </TableCell>
        </TableRow>
      ) : students.length === 0 ? (
        <TableRow>
          <TableCell colSpan={5} className="py-12">
            <EmptyState
              icon={Users2}
              heading="No students found"
              headingUrdu="کوئی طالبِ علم نہیں ملا"
              description="Accepted admissions create student records. Adjust filters or start a new admission."
              action={{
                label: "New Admission",
                onClick: () => void navigate({ to: "/admission/new" }),
              }}
            />
          </TableCell>
        </TableRow>
      ) : (
        students.map((student) => (
          <TableRow
            key={student.id}
            className="cursor-pointer"
            onClick={() => setSelected(student)}
          >
            <TableCell className="font-mono text-sm font-medium whitespace-nowrap">
              {student.rollNo}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-bold",
                      student.gender === "female"
                        ? "bg-pink-500/10 text-pink-700 dark:text-pink-300"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {initials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-urdu text-sm leading-tight truncate">
                    {student.nameUrdu}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{student.name}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-urdu text-sm truncate">
                  {student.fatherNameUrdu || student.fatherName}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {student.fatherName}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-urdu text-sm truncate">{student.groupLabel}</span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {student.groupEnglish}
                  {student.section ? ` · ${student.section}` : ""}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelected(student)}>
                    <Eye className="h-4 w-4 me-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteTarget(student)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    Delete Student
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <StudentDetailsSheet student={selected} onClose={() => setSelected(null)} />

      <ResponsiveDialog
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteTarget?.nameUrdu || deleteTarget?.name}? This will mark the student as inactive and end their current enrollment.`}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon={Trash2}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This action will:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Mark the student as inactive</li>
            <li>End the current enrollment</li>
            <li>Record this action in the event log</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Student"}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  </div>
  );
}

function StatusDialog({
  student,
  onClose,
  onSaved,
}: {
  student: StudentListItem | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [choice, setChoice] = useState<StudentStatus>("active");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (student) {
      setChoice(student.status);
      setReason("");
    }
  }, [student]);

  const save = async () => {
    if (!student) return;
    if (choice !== "active" && !reason.trim()) {
      toast.error("Reason is required for non-active status");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/students/${student.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: choice, reason: reason.trim() || undefined }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update student status");
      toast.success(`${student.name} marked as ${choice}`);
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update student status");
    } finally {
      setPending(false);
    }
  };

  return (
    <ResponsiveDialog
      title={`Update Status${student ? ` — ${student.name}` : ""}`}
      description="Change a student's lifecycle status and record the reason in the event log."
      open={!!student}
      onOpenChange={(open) => !open && onClose()}
      icon={UserCog}
    >
      <div className="space-y-3 text-sm">
        <Label>Status · حالت</Label>
        <Select value={choice} onValueChange={(value) => setChoice(value as StudentStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active — فعال</SelectItem>
            <SelectItem value="inactive">Inactive — غیر فعال</SelectItem>
            <SelectItem value="transferred">Transferred — منتقل</SelectItem>
            <SelectItem value="dropout">Dropout — تعلیم چھوڑ دی</SelectItem>
            <SelectItem value="graduated">Graduated — فارغ التحصیل</SelectItem>
          </SelectContent>
        </Select>
        <Label>Reason · وجہ</Label>
        <Textarea
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason, transfer destination, leaving certificate #"
        />
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
