import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  Users2,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StudentDetailsSheet } from "./student-details-sheet";
import { AddStudentDialog } from "./add-student-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  students as allStudents,
  madrassaCategories,
  schoolClasses,
  type Student,
  type System,
} from "@/mock";
import { formatPKR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = { system: Extract<System, "madrassa" | "school"> };

export function StudentsTable({ system }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Student | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [data, setData] = useState<Student[]>(allStudents);
  const [promoteFor, setPromoteFor] = useState<Student | null>(null);
  const [exitFor, setExitFor] = useState<Student | null>(null);

  const groups = system === "madrassa" ? madrassaCategories : null;

  const filtered = useMemo(() => {
    return data.filter((s) => {
      if (s.system !== system) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (groupFilter !== "all") {
        if (system === "madrassa" && s.categoryId !== groupFilter) return false;
        if (system === "school" && s.classId !== groupFilter) return false;
      }
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.nameUrdu.includes(query) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.guardianPhone.includes(query)
      );
    });
  }, [data, system, query, statusFilter, groupFilter]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = (id: string) => {
    setData((d) => d.filter((s) => s.id !== id));
    setSelected(null);
  };

  const handleAdd = (s: Student) => {
    setData((d) => [s, ...d]);
  };

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="نام، رول نمبر، یا فون نمبر سے تلاش کریں…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="pe-9 font-urdu text-sm"
            />
          </div>

          <Select
            value={groupFilter}
            onValueChange={(v) => {
              setGroupFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder={system === "madrassa" ? "Category" : "Class"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {system === "madrassa" ? "All Categories — تمام" : "All Classes — تمام"}
              </SelectItem>
              {groups
                ? groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="font-urdu">{g.nameUrdu}</span>
                      <span className="text-muted-foreground ms-2 text-xs">{g.name}</span>
                    </SelectItem>
                  ))
                : schoolClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-urdu">{c.nameUrdu}</span>
                      <span className="text-muted-foreground ms-2 text-xs">{c.name}</span>
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active — فعال</SelectItem>
              <SelectItem value="inactive">Inactive — غیر فعال</SelectItem>
              <SelectItem value="graduated">Graduated — فارغ</SelectItem>
              <SelectItem value="transferred">Transferred — منتقل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Count strip */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>
          Showing <span className="font-medium text-foreground">{pageData.length}</span> of{" "}
          <span className="font-medium text-foreground">{filtered.length}</span> students
        </p>
        <p className="font-urdu text-sm">کل: {filtered.length}</p>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[60px]">Roll #</TableHead>
              <TableHead>Student — طالبِ علم</TableHead>
              <TableHead className="hidden md:table-cell">
                {system === "madrassa" ? "Category" : "Class"}
              </TableHead>
              <TableHead className="hidden lg:table-cell">Guardian — والد</TableHead>
              <TableHead className="text-end">Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <EmptyState
                    icon={Users2}
                    heading="No students found"
                    headingUrdu="کوئی طالبِ علم نہیں ملا"
                    description="Try adjusting your filters or add a new student."
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((s) => {
                const group =
                  system === "madrassa"
                    ? madrassaCategories.find((c) => c.id === s.categoryId)
                    : schoolClasses.find((c) => c.id === s.classId);
                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.rollNo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className={cn(
                              "text-xs font-bold",
                              s.gender === "female"
                                ? "bg-pink-500/10 text-pink-700 dark:text-pink-300"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {initials(s.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-urdu text-sm leading-tight truncate">
                            {s.nameUrdu}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{s.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {group && (
                        <div className="flex flex-col leading-tight">
                          <span className="font-urdu text-sm">{group.nameUrdu}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {group.name}
                            {s.section ? ` · ${s.section}` : ""}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col leading-tight">
                        <span className="font-urdu text-sm">{s.guardianNameUrdu}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {s.guardianPhone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end font-mono text-sm">
                      {formatPKR(s.monthlyFee)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setSelected(s)}>
                            <Eye className="h-3.5 w-3.5 me-2" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/students/$id" params={{ id: s.id }}>
                              <Eye className="h-3.5 w-3.5 me-2" /> Open profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-3.5 w-3.5 me-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setPromoteFor(s)}>
                            <TrendingUp className="h-3.5 w-3.5 me-2" /> Promote / Demote
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setExitFor(s)}>
                            <LogOut className="h-3.5 w-3.5 me-2" /> Withdraw / Exit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 me-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <StudentDetailsSheet
        student={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
      />
      <AddStudentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        system={system}
        onAdd={handleAdd}
      />

      <PromoteDialog
        student={promoteFor}
        onClose={() => setPromoteFor(null)}
        onConfirm={(status) => {
          if (!promoteFor) return;
          setData((p) => p.map((x) => x.id === promoteFor.id ? { ...x, status } : x));
          toast.success(`${promoteFor.name} marked as ${status}`);
          setPromoteFor(null);
        }}
      />
      <ExitDialog
        student={exitFor}
        onClose={() => setExitFor(null)}
        onConfirm={(status) => {
          if (!exitFor) return;
          setData((p) => p.map((x) => x.id === exitFor.id ? { ...x, status } : x));
          toast.success(`${exitFor.name} marked as ${status}`);
          setExitFor(null);
        }}
      />
    </div>
  );
}

function PromoteDialog({ student, onClose, onConfirm }: { student: Student | null; onClose: () => void; onConfirm: (s: Student["status"]) => void }) {
  const [choice, setChoice] = useState<"active" | "inactive">("active");
  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Promote / Demote — {student?.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <Label>Action · کارروائی</Label>
          <Select value={choice} onValueChange={(v) => setChoice(v as typeof choice)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">⬆ Promote to next class/darja</SelectItem>
              <SelectItem value="inactive">⬇ Demote — repeat current</SelectItem>
            </SelectContent>
          </Select>
          <Label>Reason · وجہ (optional)</Label>
          <Textarea rows={2} placeholder="Performance, attendance, exam result…" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(choice)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExitDialog({ student, onClose, onConfirm }: { student: Student | null; onClose: () => void; onConfirm: (s: Student["status"]) => void }) {
  const [choice, setChoice] = useState<Student["status"]>("transferred");
  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Withdraw / Exit — {student?.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <Label>Exit type · قسمِ اخراج</Label>
          <Select value={choice} onValueChange={(v) => setChoice(v as Student["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="transferred">Transferred — منتقل</SelectItem>
              <SelectItem value="dropout">Dropout — تعلیم چھوڑ دی</SelectItem>
              <SelectItem value="graduated">Graduated — فارغ التحصیل</SelectItem>
              <SelectItem value="inactive">Inactive — غیر فعال</SelectItem>
            </SelectContent>
          </Select>
          <Label>Notes · وضاحت</Label>
          <Textarea rows={3} placeholder="Reason, transfer destination, leaving certificate #" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(choice)}>Mark Exit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}