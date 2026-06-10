import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase, GraduationCap, ShieldUser, HandCoins, CalendarDays,
  PlaneTakeoff, Building2, ArrowLeft, Users as UsersIcon, TrendingUp, Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHR } from "@/stores/hr-store";
import { teachers as allTeachers } from "@/mock/teachers";
import { users as allUsers } from "@/mock/users";
import { formatPKR } from "@/lib/format";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/hr/")({
  component: HRHub,
});

type ModCard = {
  to: string;
  icon: typeof Briefcase;
  urdu: string;
  english: string;
  description: string;
  count: string;
  accent: string;
};

function HRHub() {
  const { staff, payrollProfiles, leaves, departments } = useHR();

  const activeStaff = staff.filter((s) => s.status === "active").length;
  const activeTeachers = allTeachers.filter((t) => t.active).length;
  const activeUsers = allUsers.filter((u) => u.status === "active").length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;

  const monthlyPayroll = useMemo(
    () => payrollProfiles.reduce(
      (sum, p) => sum + p.basicSalary + p.hra + p.transportAllowance + p.medicalAllowance - p.eobi - p.incomeTax,
      0,
    ),
    [payrollProfiles],
  );

  const modules: ModCard[] = [
    { to: "/hr/staff", icon: Briefcase, urdu: "عملہ", english: "Staff Directory", description: "All non-teaching & teaching staff records, onboarding, profiles.", count: `${staff.length} total`, accent: "from-sky-500/15 to-sky-500/0 text-sky-600" },
    { to: "/teachers", icon: GraduationCap, urdu: "اساتذہ", english: "Teachers", description: "Academic staff across Madrassa and School systems.", count: `${activeTeachers} active`, accent: "from-emerald-500/15 to-emerald-500/0 text-emerald-600" },
    { to: "/users", icon: ShieldUser, urdu: "صارف اکاؤنٹس", english: "User Accounts & Permissions", description: "Login accounts, roles, granular module permissions.", count: `${activeUsers} active`, accent: "from-violet-500/15 to-violet-500/0 text-violet-600" },
    { to: "/hr/payroll", icon: HandCoins, urdu: "تنخواہ", english: "Payroll", description: "Generate, approve, and disburse monthly salaries.", count: formatPKR(monthlyPayroll) + "/mo", accent: "from-amber-500/15 to-amber-500/0 text-amber-600" },
    { to: "/hr/attendance", icon: CalendarDays, urdu: "حاضری عملہ", english: "Staff Attendance", description: "Daily check-in/out, leave-aware attendance log.", count: `${staff.length} tracked`, accent: "from-cyan-500/15 to-cyan-500/0 text-cyan-600" },
    { to: "/hr/leave", icon: PlaneTakeoff, urdu: "چھٹیاں", english: "Leave Management", description: "Leave requests, approvals, and balances.", count: `${pendingLeaves} pending`, accent: "from-rose-500/15 to-rose-500/0 text-rose-600" },
    { to: "/hr/departments", icon: Building2, urdu: "شعبہ جات", english: "Departments", description: "Organizational units and reporting structure.", count: `${departments.length} units`, accent: "from-fuchsia-500/15 to-fuchsia-500/0 text-fuchsia-600" },
  ];

  const kpis = [
    { label: "Total Workforce", urdu: "کل عملہ", value: staff.length + activeTeachers, icon: UsersIcon, hint: `${activeStaff + activeTeachers} active` },
    { label: "User Accounts", urdu: "صارف اکاؤنٹس", value: allUsers.length, icon: ShieldUser, hint: `${activeUsers} active` },
    { label: "Monthly Payroll", urdu: "ماہانہ تنخواہ", value: formatPKR(monthlyPayroll), icon: Wallet, hint: `${payrollProfiles.length} profiles` },
    { label: "Pending Leaves", urdu: "زیرِ التواء چھٹیاں", value: pendingLeaves, icon: TrendingUp, hint: `${leaves.length} total` },
  ];

  return (
    <div>
      <PageHeader
        title="HR Management"
        titleUrdu="انسانی وسائل کا انتظام"
        description="Unified hub for staff, teachers, user accounts, payroll, attendance, and leave."
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-urdu text-sm text-muted-foreground leading-tight" dir="rtl" lang="ur">{k.urdu}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1">{k.label}</p>
                <p className="font-heading text-2xl font-bold truncate">{k.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{k.hint}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <k.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Module cards */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-urdu text-lg font-semibold" dir="rtl" lang="ur">شعبے</p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Modules</p>
        </div>
        <Badge variant="outline" className="text-[10px]">{modules.length} modules</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${m.accent} flex items-center justify-center`}>
                <m.icon className="h-5 w-5" />
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition" />
            </div>
            <div>
              <p className="font-urdu text-xl font-semibold leading-tight" dir="rtl" lang="ur">{m.urdu}</p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-0.5">{m.english}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{m.description}</p>
            <Badge variant="secondary" className="self-start text-[10px] font-mono">{m.count}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}