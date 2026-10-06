import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, ShieldAlert, KeyRound, Trash2, Eye, MoreHorizontal, UserCheck, UserX, Pencil, Loader2, Users2 } from "lucide-react";
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
import type { User, UserRole } from "@/types";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { CreateUserStepper } from "@/features/users/create-user-stepper";
import { CredentialsOverlay } from "@/features/users/credentials-display";
import { UserDetailSheet } from "@/features/users/user-detail-sheet";
import { generateSecurePassword } from "@/lib/generate-password";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/language-context";
import { getUserDisplayName, getUserInitials, ACCESS_LABELS } from "@/lib/user-names";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const { user: currentUser, isLoading: sessionLoading } = useAuth();
  const [list, setList] = useState<User[]>(seedUsers);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [creds, setCreds] = useState<{ nameUrdu: string; nameEnglish: string; email: string; role: string; password: string } | null>(null);

  const filtered = useMemo(
    () =>
      list.filter((u) => {
        const displayName = getUserDisplayName(u, lang).toLowerCase();
        const query = q.toLowerCase();
        return (
          (roleFilter === "all" || u.role === roleFilter) &&
          (statusFilter === "all" || u.status === statusFilter) &&
          (!q ||
            u.name.toLowerCase().includes(query) ||
            (u.nameUrdu ?? "").toLowerCase().includes(query) ||
            displayName.includes(query) ||
            u.email.toLowerCase().includes(query))
        );
      }),
    [list, q, roleFilter, statusFilter, lang],
  );

  const stats = useMemo(
    () => ({
      total: list.filter((u) => u.status === "active").length,
      admins: list.filter((u) => u.role === "admin" || u.role === "super_admin").length,
      teachers: list.filter((u) => u.role === "teacher").length,
      neverLogged: list.filter((u) => !u.lastLoginAt).length,
    }),
    [list],
  );

  const roleBreakdown = useMemo(() => {
    const roles: { role: UserRole; urdu: string; en: string }[] = [
      { role: "super_admin", urdu: "سپر ایڈمن", en: "Super Admin" },
      { role: "admin", urdu: "ایڈمن", en: "Admin" },
      { role: "principal", urdu: "پرنسپل", en: "Principal" },
      { role: "hr_manager", urdu: "ایچ آر منیجر", en: "HR Manager" },
      { role: "accountant", urdu: "اکاؤنٹنٹ", en: "Accountant" },
      { role: "librarian", urdu: "لائبریرین", en: "Librarian" },
      { role: "receptionist", urdu: "استقبالیہ", en: "Receptionist" },
      { role: "teacher", urdu: "استاد", en: "Teacher" },
      { role: "staff", urdu: "عملہ", en: "Staff" },
      { role: "parent", urdu: "والدین", en: "Parent" },
    ];
    return roles.map((r) => ({ ...r, count: list.filter((u) => u.role === r.role).length }));
  }, [list]);

  useEffect(() => {
    if (currentUser?.role !== "super_admin") return;

    let active = true;
    setLoadingUsers(true);

    api<{ users: User[] }>("/api/users")
      .then((result) => {
        if (!active) return;
        setList(result.users);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.message ?? "Could not load users");
      })
      .finally(() => {
        if (active) setLoadingUsers(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.role]);

  async function handleCreate(u: User & { _password: string }) {
    const { _password, ...user } = u;
    if (user.role === "super_admin") {
      toast.error("Use the super admin setup API for this role");
      throw new Error("Super admin creation is not allowed from user management");
    }

    try {
      const result = await api<{ user: User }>("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          password: _password,
        }),
      });

      const savedUser: User = {
        ...user,
        id: result.user.id,
        createdAt: result.user.createdAt ?? user.createdAt,
      };

      setList((l) => [savedUser, ...l]);
      setCreds({
        nameUrdu: savedUser.nameUrdu ?? savedUser.name,
        nameEnglish: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        password: _password,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create user");
    }
  }

  async function handleUpdate(u: User) {
    const previous = list.find((x) => x.id === u.id);
    if (previous?.role === "super_admin" || u.role === "super_admin") {
      toast.error("Use the dedicated super admin API for this account");
      throw new Error("Super admin updates are not allowed from user management");
    }

    try {
      await api(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(u),
      });

      setList((l) => l.map((x) => (x.id === u.id ? u : x)));
      setEditUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update user");
    }
  }

  async function handleDeactivate(u: User) {
    if (u.role === "super_admin") {
      toast.error("The super admin cannot be deactivated from user management");
      return;
    }

    const nextStatus = u.status === "active" ? "inactive" : "active";
    try {
      await api(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      setList((l) => l.map((x) => (x.id === u.id ? { ...x, status: nextStatus } : x)));
      toast.success(
        isUrdu
          ? nextStatus === "active"
            ? "اکاؤنٹ فعال ہو گیا"
            : "اکاؤنٹ غیر فعال ہو گیا"
          : nextStatus === "active"
            ? "Account activated"
            : "Account deactivated",
      );
    } catch {}
  }

  async function confirmReset() {
    if (!resetUser) return;
    if (resetUser.role === "super_admin") {
      toast.error("Use the super admin recovery API for this account");
      setResetUser(null);
      return;
    }

    const pwd = generateSecurePassword();
    try {
      await api(`/api/users/${resetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd, mustChangePassword: true }),
      });

      setList((l) => l.map((x) => (x.id === resetUser.id ? { ...x, mustChangePassword: true } : x)));
      setCreds({
        nameUrdu: resetUser.nameUrdu ?? resetUser.name,
        nameEnglish: resetUser.name,
        email: resetUser.email,
        role: resetUser.role,
        password: pwd,
      });
      setResetUser(null);
    } catch {}
  }

  async function confirmDelete() {
    if (!deleteUser || deleteConfirm !== deleteUser.email) return;
    if (deleteUser.role === "super_admin") {
      toast.error("The super admin cannot be deleted");
      setDeleteUser(null);
      setDeleteConfirm("");
      return;
    }

    try {
      await api(`/api/users/${deleteUser.id}`, { method: "DELETE" });
      setList((l) => l.filter((x) => x.id !== deleteUser.id));
      toast.success(isUrdu ? "صارف حذف کر دیا گیا" : "User deleted");
      setDeleteUser(null);
      setDeleteConfirm("");
    } catch {}
  }

  const accessLabel = (acc?: string) => {
    if (!acc) return "—";
    return isUrdu ? ACCESS_LABELS[acc]?.ur ?? acc : ACCESS_LABELS[acc]?.en ?? acc;
  };

  if (sessionLoading || !currentUser) {
    return (
      <div>
        <PageHeader title="User Management" titleUrdu="صارف انتظام" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isUrdu ? "سیشن لوڈ ہو رہا ہے..." : "Loading session..."}
        </div>
      </div>
    );
  }

  if (currentUser.role !== "super_admin") {
    return (
      <div>
        <PageHeader title="User Management" titleUrdu="صارف انتظام" />
        <EmptyState
          icon={ShieldAlert}
          heading="Access denied"
          headingUrdu="رسائی محدود ہے"
          description={isUrdu ? "صرف سپر ایڈمن صارفین کے اکاؤنٹس کا انتظام کر سکتے ہیں۔" : "Only Super Admins can manage user accounts."}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        titleUrdu="صارف انتظام"
        description="Manage system users, roles, and module permissions."
        descriptionUrdu="سسٹم صارفین، کرداروں اور ماڈیول کی اجازتوں کا انتظام کریں۔"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>{isUrdu ? "نیا صارف" : "New User"}</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard labelUrdu="کل فعال صارفین" label="Total Active Users" value={String(stats.total)} />
        <KpiCard labelUrdu="منتظمین" label="Admins" value={String(stats.admins)} />
        <KpiCard labelUrdu="اساتذہ" label="Teachers" value={String(stats.teachers)} />
        <KpiCard labelUrdu="کبھی لاگ ان نہیں" label="Never Logged In" value={String(stats.neverLogged)} />
      </div>

      {/* Role breakdown chips */}
      <Card className="p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {isUrdu ? (
              <span className="font-urdu text-sm normal-case" dir="rtl" lang="ur">
                کرداروں کے مطابق تقسیم
              </span>
            ) : (
              <span>Distribution by Role</span>
            )}
          </p>
          {loadingUsers && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isUrdu ? "ہم آہنگی ہو رہی ہے..." : "Syncing"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs transition ${roleFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
          >
            {isUrdu ? "سب" : "All"} · {list.length}
          </button>
          {roleBreakdown.filter((r) => r.count > 0).map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => setRoleFilter(r.role)}
              className={`rounded-full border px-3 py-1 text-xs transition ${roleFilter === r.role ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
            >
              <span>{isUrdu ? r.urdu : r.en}</span> · <span className="font-mono">{r.count}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isUrdu ? "نام یا ای میل تلاش کریں..." : "Search name or email..."}
              className="pe-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "all")}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isUrdu ? "تمام کردار" : "All Roles"}</SelectItem>
              {roleBreakdown.map((r) => (
                <SelectItem key={r.role} value={r.role}>
                  {isUrdu ? r.urdu : r.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isUrdu ? "تمام کیفیات" : "All Statuses"}</SelectItem>
              <SelectItem value="active">{isUrdu ? "فعال" : "Active"}</SelectItem>
              <SelectItem value="inactive">{isUrdu ? "غیر فعال" : "Inactive"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{isUrdu ? "صارف" : "User"}</TableHead>
              <TableHead>{isUrdu ? "کردار" : "Role"}</TableHead>
              <TableHead className="hidden md:table-cell">{isUrdu ? "رسائی" : "Access"}</TableHead>
              <TableHead className="hidden lg:table-cell">{isUrdu ? "آخری لاگ ان" : "Last Login"}</TableHead>
              <TableHead>{isUrdu ? "کیفیت" : "Status"}</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <EmptyState
                    icon={Users2}
                    heading={isUrdu ? "کوئی صارف نہیں ملا" : "No users match your filters"}
                    headingUrdu="کوئی صارف نہیں ملا"
                    description={isUrdu ? "تلاش یا فلٹرز کو تبدیل کر کے دیکھیں۔" : "Adjust your search or filters."}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id} className={u.status === "inactive" ? "opacity-60" : ""}>
                  <TableCell>
                    <button className="flex items-center gap-3 text-start" onClick={() => setDetailUser(u)}>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {getUserInitials(u, lang)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p
                          className={isUrdu ? "font-urdu text-sm font-medium leading-tight" : "text-sm font-medium leading-tight font-sans"}
                          dir={isUrdu ? "rtl" : "ltr"}
                          lang={lang}
                        >
                          {getUserDisplayName(u, lang)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell><StatusBadge status={u.role} /></TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {accessLabel(u.systemAccess)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : <span className="italic">{isUrdu ? "کبھی نہیں" : "Never"}</span>}
                  </TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailUser(u)}>
                          <Eye className="h-3.5 w-3.5 me-2" />
                          <span>{isUrdu ? "تفصیل" : "View"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={u.role === "super_admin"} onClick={() => setEditUser(u)}>
                          <Pencil className="h-3.5 w-3.5 me-2" />
                          <span>{isUrdu ? "ترمیم" : "Edit"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={u.role === "super_admin"} onClick={() => setResetUser(u)}>
                          <KeyRound className="h-3.5 w-3.5 me-2" />
                          <span>{isUrdu ? "پاس ورڈ ری سیٹ" : "Reset Password"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeactivate(u)} disabled={u.id === currentUser?.id || u.role === "super_admin"}>
                          {u.status === "active" ? (
                            <>
                              <UserX className="h-3.5 w-3.5 me-2" />
                              <span>{isUrdu ? "غیر فعال کریں" : "Deactivate"}</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5 me-2" />
                              <span>{isUrdu ? "فعال کریں" : "Activate"}</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={u.id === currentUser?.id || u.role === "super_admin"}
                          onClick={() => {
                            setDeleteUser(u);
                            setDeleteConfirm("");
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 me-2" />
                          <span>{isUrdu ? "حذف کریں" : "Delete"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
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
            <DialogTitle>{isUrdu ? "پاس ورڈ ری سیٹ" : "Reset Password"}</DialogTitle>
            <DialogDescription>
              {isUrdu
                ? "نیا محفوظ پاس ورڈ تیار کیا جائے گا۔ صارف کو اگلی بار لاگ ان کرنے پر اسے تبدیل کرنا ہوگا۔"
                : "A new secure password will be generated. The user must change it on next login."}
            </DialogDescription>
          </DialogHeader>
          {resetUser && (
            <div className="text-sm border border-border rounded-lg p-3 bg-muted/40">
              <p
                className={isUrdu ? "font-urdu text-base" : "font-sans font-medium"}
                dir={isUrdu ? "rtl" : "ltr"}
                lang={lang}
              >
                {getUserDisplayName(resetUser, lang)}
              </p>
              <p className="text-xs text-muted-foreground">{resetUser.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              {isUrdu ? "منسوخ" : "Cancel"}
            </Button>
            <Button onClick={confirmReset}>
              {isUrdu ? "ری سیٹ کریں" : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteUser} onOpenChange={(v) => !v && setDeleteUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {isUrdu ? "صارف حذف کریں" : "Delete User"}
            </DialogTitle>
            <DialogDescription>
              {isUrdu
                ? "مستقل حذف کرنے کی تصدیق کے لیے صارف کا ای میل درج کریں۔"
                : "Type the user's email to confirm permanent deletion."}
            </DialogDescription>
          </DialogHeader>
          {deleteUser && (
            <div className="space-y-3">
              <p className="text-sm font-mono bg-muted/40 rounded p-2">{deleteUser.email}</p>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={deleteUser.email}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              {isUrdu ? "منسوخ" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              disabled={!deleteUser || deleteConfirm !== deleteUser.email}
              onClick={confirmDelete}
            >
              {isUrdu ? "مستقل حذف کریں" : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
