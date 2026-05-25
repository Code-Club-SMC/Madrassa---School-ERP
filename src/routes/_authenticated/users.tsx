import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Copy, Check, Eye, EyeOff, ShieldAlert, KeyRound, Trash2, Shield, X as XIcon, Users2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { users as seedUsers, currentUser, type User, type UserRole } from "@/mock";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

type Perm = "view" | "edit" | "none";
type ModuleRow = { en: string; ur: string; perms: Record<UserRole, Perm> };

const PERMISSIONS: ModuleRow[] = [
  { en: "Dashboard", ur: "ڈیش بورڈ", perms: { super_admin: "edit", admin: "edit", teacher: "view", parent: "view" } },
  { en: "Students", ur: "طلبہ", perms: { super_admin: "edit", admin: "edit", teacher: "view", parent: "none" } },
  { en: "Admissions", ur: "داخلے", perms: { super_admin: "edit", admin: "edit", teacher: "none", parent: "none" } },
  { en: "Attendance", ur: "حاضری", perms: { super_admin: "edit", admin: "edit", teacher: "edit", parent: "view" } },
  { en: "Fees & Payments", ur: "فیس", perms: { super_admin: "edit", admin: "edit", teacher: "none", parent: "view" } },
  { en: "Concessions", ur: "رعایات", perms: { super_admin: "edit", admin: "edit", teacher: "none", parent: "none" } },
  { en: "Exams & Marks", ur: "امتحانات", perms: { super_admin: "edit", admin: "edit", teacher: "edit", parent: "view" } },
  { en: "Results & DMCs", ur: "نتائج", perms: { super_admin: "edit", admin: "edit", teacher: "view", parent: "view" } },
  { en: "Hifz Tracker", ur: "حفظ ٹریکر", perms: { super_admin: "edit", admin: "edit", teacher: "edit", parent: "view" } },
  { en: "Teachers & Salaries", ur: "اساتذہ و تنخواہ", perms: { super_admin: "edit", admin: "edit", teacher: "none", parent: "none" } },
  { en: "Inventory", ur: "انوینٹری", perms: { super_admin: "edit", admin: "edit", teacher: "none", parent: "none" } },
  { en: "Finance & Donations", ur: "مالیات", perms: { super_admin: "edit", admin: "edit", teacher: "none", parent: "none" } },
  { en: "Reports", ur: "رپورٹس", perms: { super_admin: "edit", admin: "view", teacher: "view", parent: "none" } },
  { en: "Website CMS", ur: "ویب سائٹ", perms: { super_admin: "edit", admin: "edit", teacher: "none", parent: "none" } },
  { en: "Message Templates", ur: "پیغام سانچے", perms: { super_admin: "edit", admin: "edit", teacher: "none", parent: "none" } },
  { en: "User Accounts", ur: "صارفین", perms: { super_admin: "edit", admin: "none", teacher: "none", parent: "none" } },
  { en: "Backup & Restore", ur: "بیک اپ", perms: { super_admin: "edit", admin: "none", teacher: "none", parent: "none" } },
  { en: "Audit Log", ur: "آڈٹ لاگ", perms: { super_admin: "view", admin: "none", teacher: "none", parent: "none" } },
];

const ROLE_LABELS: Record<UserRole, { en: string; ur: string }> = {
  super_admin: { en: "Super Admin", ur: "سپر ایڈمن" },
  admin: { en: "Admin", ur: "ایڈمن" },
  teacher: { en: "Teacher", ur: "استاد" },
  parent: { en: "Parent", ur: "والدین" },
};

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function UsersPage() {
  const [list, setList] = useState<User[]>(seedUsers);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [creds, setCreds] = useState<{ name: string; email: string; password: string } | null>(null);

  if (currentUser.role !== "super_admin") {
    return (
      <div>
        <PageHeader title="User Management" titleUrdu="صارف انتظام" />
        <EmptyState
          icon={ShieldAlert}
          heading="Access denied"
          headingUrdu="رسائی محدود ہے"
          description="Only Super Admins can manage user accounts."
        />
      </div>
    );
  }

  const filtered = useMemo(
    () => list.filter((u) => (roleFilter === "all" || u.role === roleFilter) && (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))),
    [list, q, roleFilter],
  );

  const onCreate = (u: { name: string; email: string; role: UserRole }) => {
    const password = genPassword();
    const next: User = { id: `u${Date.now()}`, ...u, status: "active", createdBy: currentUser.name, createdAt: new Date().toISOString().slice(0, 10) };
    setList((l) => [next, ...l]);
    setAddOpen(false);
    setCreds({ name: u.name, email: u.email, password });
    toast.success("Account created · اکاؤنٹ بن گیا");
  };

  const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div>
      <PageHeader
        title="User Management"
        titleUrdu="صارف انتظام"
        description="Create accounts, reset passwords, and inspect what each role can see across the system."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add User</span>
            <span className="font-urdu text-xs">نیا صارف</span>
          </Button>
        }
      />

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts" className="gap-1.5"><Users2 className="h-3.5 w-3.5" />Accounts</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Role Permissions</TabsTrigger>
        </TabsList>

      <TabsContent value="accounts">
      <Card className="p-4 mb-4 mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="pe-9" />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "all")}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin · سپر ایڈمن</SelectItem>
              <SelectItem value="admin">Admin · ایڈمن</SelectItem>
              <SelectItem value="teacher">Teacher · استاد</SelectItem>
              <SelectItem value="parent">Parent · والدین</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-[120px] text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12"><EmptyState icon={Search} heading="No users found" headingUrdu="کوئی صارف نہیں ملا" /></TableCell></TableRow>
            ) : filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9"><AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials(u.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="text-sm font-medium">{u.name}</p><p className="text-[11px] text-muted-foreground md:hidden">{u.email}</p></div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell><StatusBadge status={u.role} /></TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground"><div>{formatDate(u.createdAt)}</div><div>by {u.createdBy}</div></TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="Reset password" aria-label="Reset password" onClick={() => setCreds({ name: u.name, email: u.email, password: genPassword() })}><KeyRound className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Delete" aria-label="Delete" disabled={u.id === currentUser.id} onClick={() => { setList((l) => l.filter((x) => x.id !== u.id)); toast.success("Account removed"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      </TabsContent>

      <TabsContent value="permissions">
        <Card className="p-4 mt-3 mb-3 bg-primary/5 border-primary/20">
          <p className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Role Permission Matrix · کرداروں کا اختیارات کا نقشہ</p>
          <p className="text-xs text-muted-foreground mt-1">A clear, auditable view of which modules each role can access. Changes here are enforced at the route level on next sign-in.</p>
        </Card>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Module</TableHead>
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <TableHead key={r} className="text-center">
                    <p className="text-xs">{ROLE_LABELS[r].en}</p>
                    <p className="font-urdu text-[11px] text-muted-foreground">{ROLE_LABELS[r].ur}</p>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS.map((m) => (
                <TableRow key={m.en}>
                  <TableCell><p className="text-sm font-medium">{m.en}</p><p className="font-urdu text-xs text-muted-foreground">{m.ur}</p></TableCell>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <TableCell key={r} className="text-center">
                      <PermBadge p={m.perms[r]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><PermBadge p="edit" />Full edit access</span>
          <span className="flex items-center gap-1.5"><PermBadge p="view" />View-only</span>
          <span className="flex items-center gap-1.5"><PermBadge p="none" />Hidden / blocked</span>
        </div>
      </TabsContent>
      </Tabs>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onCreate={onCreate} />
      <CredentialsDialog creds={creds} onClose={() => setCreds(null)} />
    </div>
  );
}

function PermBadge({ p }: { p: Perm }) {
  if (p === "edit") return <Badge className="bg-chart-1/15 text-chart-1 border-0 gap-1 text-[10px]"><Check className="h-3 w-3" />Edit</Badge>;
  if (p === "view") return <Badge className="bg-primary/15 text-primary border-0 gap-1 text-[10px]"><Eye className="h-3 w-3" />View</Badge>;
  return <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px]"><XIcon className="h-3 w-3" />—</Badge>;
}

function AddUserDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (u: { name: string; email: string; role: UserRole }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("teacher");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add User <span className="font-urdu text-base text-muted-foreground ms-2">نیا صارف</span></DialogTitle>
          <DialogDescription>A secure password will be auto-generated and shown once for handoff.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <BilingualLabel urdu="نام" english="Full name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmed Khan" /></BilingualLabel>
          <BilingualLabel urdu="ای میل" english="Email" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ahmed@msmis.pk" /></BilingualLabel>
          <BilingualLabel urdu="کردار" english="Role" required>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin · ایڈمن</SelectItem>
                <SelectItem value="teacher">Teacher · استاد</SelectItem>
                <SelectItem value="parent">Parent · والدین</SelectItem>
              </SelectContent>
            </Select>
          </BilingualLabel>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name || !email} onClick={() => { onCreate({ name, email, role }); setName(""); setEmail(""); setRole("teacher"); }}>Create Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CredentialsDialog({ creds, onClose }: { creds: { name: string; email: string; password: string } | null; onClose: () => void }) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!creds) return null;
  const copy = () => {
    navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`);
    setCopied(true);
    toast.success("Credentials copied");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Dialog open={!!creds} onOpenChange={(v) => { if (!v) { onClose(); setReveal(false); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Credentials <span className="font-urdu text-base text-muted-foreground ms-1">پاس ورڈ</span></DialogTitle>
          <DialogDescription className="font-urdu">یہ پاس ورڈ صرف ایک بار ظاہر ہوگا۔ صارف کو محفوظ طریقے سے دیں۔</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-muted/60 border border-border p-4 space-y-3 font-mono text-sm">
          <div><span className="text-xs text-muted-foreground block mb-1">Name</span>{creds.name}</div>
          <div><span className="text-xs text-muted-foreground block mb-1">Email</span>{creds.email}</div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1"><span className="text-xs text-muted-foreground block mb-1">Password</span>{reveal ? creds.password : "•".repeat(creds.password.length)}</div>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setReveal((r) => !r)} aria-label={reveal ? "Hide password" : "Show password"}>{reveal ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={copy} className="gap-1.5">{copied ? <Check className="h-3.5 w-3.5 text-chart-1" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}</Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
