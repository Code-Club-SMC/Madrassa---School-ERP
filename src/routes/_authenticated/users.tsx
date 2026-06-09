import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, ShieldAlert, KeyRound, Trash2, Eye, MoreHorizontal, UserCheck, UserX, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/chart-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { users as seedUsers } from "@/mock/users";
import { currentUser } from "@/mock";
import type { User, UserRole } from "@/types";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { CreateUserStepper } from "@/features/users/create-user-stepper";
import { CredentialsOverlay } from "@/features/users/credentials-display";
import { UserDetailSheet } from "@/features/users/user-detail-sheet";
import { generateSecurePassword } from "@/lib/generate-password";
import { Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const [list, setList] = useState<User[]>(seedUsers);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [creds, setCreds] = useState<{ nameUrdu: string; nameEnglish: string; email: string; role: string; password: string } | null>(null);

  if (currentUser.role !== "super_admin") {
    return (
      <div>
        <PageHeader title="User Management" titleUrdu="صارف انتظام" />
        <EmptyState icon={ShieldAlert} heading="Access denied" headingUrdu="رسائی محدود ہے" description="Only Super Admins can manage user accounts." />
      </div>
    );
  }

  const filtered = useMemo(
    () => list.filter((u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (statusFilter === "all" || u.status === statusFilter) &&
      (!q || u.name.toLowerCase().includes(q.toLowerCase()) || (u.nameUrdu ?? "").includes(q) || u.email.toLowerCase().includes(q.toLowerCase())),
    ),
    [list, q, roleFilter, statusFilter],
  );

  const stats = useMemo(() => ({
    total: list.filter((u) => u.status === "active").length,
    admins: list.filter((u) => u.role === "admin" || u.role === "super_admin").length,
    teachers: list.filter((u) => u.role === "teacher").length,
    neverLogged: list.filter((u) => !u.lastLoginAt).length,
  }), [list]);

  function handleCreate(u: User & { _password: string }) {
    const { _password, ...user } = u;
    setList((l) => [user, ...l]);
    setCreds({
      nameUrdu: user.nameUrdu ?? user.name,
      nameEnglish: user.name,
      email: user.email,
      role: user.role,
      password: _password,
    });
  }

  function handleUpdate(u: User) {
    setList((l) => l.map((x) => (x.id === u.id ? u : x)));
    setEditUser(null);
  }

  function handleDeactivate(u: User) {
    const nextStatus = u.status === "active" ? "inactive" : "active";
    setList((l) => l.map((x) => (x.id === u.id ? { ...x, status: nextStatus } : x)));
    toast.success(nextStatus === "active" ? "اکاؤنٹ فعال ہو گیا · Activated" : "اکاؤنٹ غیر فعال ہو گیا · Deactivated");
  }

  function confirmReset() {
    if (!resetUser) return;
    const pwd = generateSecurePassword();
    setList((l) => l.map((x) => (x.id === resetUser.id ? { ...x, mustChangePassword: true } : x)));
    setCreds({
      nameUrdu: resetUser.nameUrdu ?? resetUser.name,
      nameEnglish: resetUser.name,
      email: resetUser.email,
      role: resetUser.role,
      password: pwd,
    });
    setResetUser(null);
  }

  function confirmDelete() {
    if (!deleteUser || deleteConfirm !== deleteUser.email) return;
    setList((l) => l.filter((x) => x.id !== deleteUser.id));
    toast.success("صارف حذف کر دیا گیا · User deleted");
    setDeleteUser(null);
    setDeleteConfirm("");
  }

  const initials = (u: User) => (u.nameUrdu ?? u.name).slice(0, 2);

  return (
    <div>
      <PageHeader
        title="User Management"
        titleUrdu="صارف انتظام"
        description="Manage system users, roles, and module permissions."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="font-urdu">نیا صارف</span>
            <span className="text-xs opacity-80">New User</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard labelUrdu="کل فعال صارفین" label="Total Active Users" value={String(stats.total)} />
        <KpiCard labelUrdu="منتظمین" label="Admins" value={String(stats.admins)} />
        <KpiCard labelUrdu="اساتذہ" label="Teachers" value={String(stats.teachers)} />
        <KpiCard labelUrdu="کبھی لاگ ان نہیں" label="Never Logged In" value={String(stats.neverLogged)} />
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="نام یا ای میل تلاش کریں · Search name or email" className="pe-9" />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "all")}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles · تمام</SelectItem>
              <SelectItem value="super_admin">Super Admin · سپر ایڈمن</SelectItem>
              <SelectItem value="admin">Admin · ایڈمن</SelectItem>
              <SelectItem value="teacher">Teacher · استاد</SelectItem>
              <SelectItem value="parent">Parent · والدین</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All · تمام</SelectItem>
              <SelectItem value="active">Active · فعال</SelectItem>
              <SelectItem value="inactive">Inactive · غیر فعال</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead><span className="font-urdu">صارف</span> · User</TableHead>
              <TableHead><span className="font-urdu">کردار</span> · Role</TableHead>
              <TableHead className="hidden md:table-cell"><span className="font-urdu">رسائی</span> · Access</TableHead>
              <TableHead className="hidden lg:table-cell"><span className="font-urdu">آخری لاگ ان</span> · Last Login</TableHead>
              <TableHead><span className="font-urdu">کیفیت</span> · Status</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12">
                <EmptyState icon={Users2} heading="No users match your filters" headingUrdu="کوئی صارف نہیں ملا" description="Adjust your search or filters." />
              </TableCell></TableRow>
            ) : filtered.map((u) => (
              <TableRow key={u.id} className={u.status === "inactive" ? "opacity-60" : ""}>
                <TableCell>
                  <button className="flex items-center gap-3 text-start" onClick={() => setDetailUser(u)}>
                    <Avatar className="h-9 w-9"><AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials(u)}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <p className="font-urdu text-sm font-medium leading-tight" dir="rtl" lang="ur">{u.nameUrdu ?? u.name}</p>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                  </button>
                </TableCell>
                <TableCell><StatusBadge status={u.role} /></TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground capitalize">{u.systemAccess ?? "—"}</TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : <span className="italic">Never · کبھی نہیں</span>}
                </TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailUser(u)}><Eye className="h-3.5 w-3.5 me-2" /><span className="font-urdu">تفصیل</span><span className="ms-1.5 text-xs text-muted-foreground">View</span></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditUser(u)}><Pencil className="h-3.5 w-3.5 me-2" /><span className="font-urdu">ترمیم</span><span className="ms-1.5 text-xs text-muted-foreground">Edit</span></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setResetUser(u)}><KeyRound className="h-3.5 w-3.5 me-2" /><span className="font-urdu">پاس ورڈ ری سیٹ</span></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeactivate(u)} disabled={u.id === currentUser.id}>
                        {u.status === "active" ? <><UserX className="h-3.5 w-3.5 me-2" /><span className="font-urdu">غیر فعال کریں</span></> : <><UserCheck className="h-3.5 w-3.5 me-2" /><span className="font-urdu">فعال کریں</span></>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" disabled={u.id === currentUser.id} onClick={() => { setDeleteUser(u); setDeleteConfirm(""); }}>
                        <Trash2 className="h-3.5 w-3.5 me-2" /><span className="font-urdu">حذف کریں</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CreateUserStepper open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
      <CreateUserStepper open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)} mode="edit" initial={editUser} onUpdate={handleUpdate} />
      <UserDetailSheet user={detailUser} onClose={() => setDetailUser(null)} />
      <CredentialsOverlay creds={creds} onClose={() => setCreds(null)} />

      {/* Reset password dialog */}
      <Dialog open={!!resetUser} onOpenChange={(v) => !v && setResetUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              <span className="font-urdu block leading-loose" dir="rtl" lang="ur">پاس ورڈ ری سیٹ</span>
              <span className="text-sm text-muted-foreground font-normal block mt-0.5">Reset Password</span>
            </DialogTitle>
            <DialogDescription>
              A new secure password will be generated. The user must change it on next login.
            </DialogDescription>
          </DialogHeader>
          {resetUser && (
            <div className="text-sm border border-border rounded-lg p-3 bg-muted/40">
              <p className="font-urdu text-base" dir="rtl" lang="ur">{resetUser.nameUrdu ?? resetUser.name}</p>
              <p className="text-xs text-muted-foreground">{resetUser.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}><span className="font-urdu">منسوخ</span></Button>
            <Button onClick={confirmReset}><span className="font-urdu">ری سیٹ کریں</span></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteUser} onOpenChange={(v) => !v && setDeleteUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <span className="font-urdu block leading-loose text-destructive" dir="rtl" lang="ur">صارف حذف کریں</span>
              <span className="text-sm text-muted-foreground font-normal block mt-0.5">Delete User · This action is permanent</span>
            </DialogTitle>
            <DialogDescription>
              Type the user's email to confirm permanent deletion.
            </DialogDescription>
          </DialogHeader>
          {deleteUser && (
            <div className="space-y-3">
              <p className="text-sm font-mono bg-muted/40 rounded p-2">{deleteUser.email}</p>
              <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={deleteUser.email} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}><span className="font-urdu">منسوخ</span></Button>
            <Button variant="destructive" disabled={!deleteUser || deleteConfirm !== deleteUser.email} onClick={confirmDelete}><span className="font-urdu">مستقل حذف کریں</span></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
