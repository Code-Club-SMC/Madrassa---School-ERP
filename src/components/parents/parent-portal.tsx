import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarCheck,
  GraduationCap,
  HeartHandshake,
  Loader2,
  Search,
  UserRound,
  Users2,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import { formatDate, formatPKR, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getGuardianDashboard, listGuardianAccounts, parentKeys } from "./parent-api";
import type { GuardianAccount, ParentStudent } from "./parent-types";

export function ParentPortal() {
  const { user } = useSession();
  if (user?.role === "parent") return <GuardianSelfPortal />;
  return <GuardianAccountsWorkspace />;
}

function GuardianSelfPortal() {
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const dashboardQuery = useQuery({
    queryKey: parentKeys.dashboard(),
    queryFn: getGuardianDashboard,
    staleTime: 30_000,
  });

  const payload = dashboardQuery.data;
  const activeStudent =
    payload?.students.find((student) => student.id === activeStudentId) ??
    payload?.students[0] ??
    null;

  if (dashboardQuery.isLoading) return <LoadingPanel label="والدین پورٹل لوڈ ہو رہا ہے" />;
  if (dashboardQuery.isError) {
    return (
      <EmptyState
        icon={HeartHandshake}
        heading="پورٹل دستیاب نہیں"
        headingUrdu="پورٹل دستیاب نہیں"
        description={
          dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : "سرپرست کی معلومات لوڈ نہیں ہو سکیں۔"
        }
      />
    );
  }

  if (!payload || payload.students.length === 0) {
    return (
      <div>
        <PageHeader
          title="والدین پورٹل"
          titleUrdu="والدین پورٹل"
          description="منسلک طلبہ، واجبات، حاضری، نتائج، اور اطلاعات۔"
        />
        <EmptyState
          icon={Users2}
          heading="کوئی طالب علم منسلک نہیں"
          headingUrdu="کوئی طالب علم منسلک نہیں"
          description="یہ والدین اکاؤنٹ فعال ہے، مگر ابھی کوئی طالب علم منسلک نہیں۔"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl" lang="ur">
      <PageHeader
        title="والدین پورٹل"
        titleUrdu="والدین پورٹل"
        description="منسلک طلبہ، واجبات، حاضری، نتائج، اور اطلاعات۔"
        actions={
          <Badge
            variant={payload.summary.unreadNotifications > 0 ? "default" : "secondary"}
            className="gap-1.5"
          >
            <Bell className="h-3.5 w-3.5" />
            {payload.summary.unreadNotifications} غیر پڑھی
          </Badge>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          icon={Users2}
          label="طلبہ"
          value={payload.summary.studentCount.toString()}
        />
        <MetricCard
          icon={Wallet}
          label="واجب الادا"
          value={formatMoney(payload.summary.totalOutstandingPaisa)}
        />
        <MetricCard
          icon={CalendarCheck}
          label="حاضری"
          value={
            payload.summary.averageAttendanceRate === null
              ? "—"
              : `${payload.summary.averageAttendanceRate}%`
          }
        />
        <MetricCard
          icon={Bell}
          label="غیر پڑھی"
          value={payload.summary.unreadNotifications.toString()}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {payload.students.map((student) => {
          const active = activeStudent?.id === student.id;
          return (
            <button
              key={student.id}
              onClick={() => setActiveStudentId(student.id)}
              className={cn(
                "min-w-[220px] rounded-md border p-3 text-start transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              <p className="font-urdu text-base font-semibold leading-tight">{student.nameUrdu}</p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  active ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                رول {student.enrollment.rollNo} · {student.enrollment.groupLabel}
              </p>
            </button>
          );
        })}
      </div>

      {activeStudent && <ParentStudentPanel student={activeStudent} />}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-urdu text-sm font-semibold">حالیہ اطلاعات</h2>
          </div>
          <div className="space-y-2">
            {payload.notifications.slice(0, 6).map((notification) => (
              <div key={notification.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
                  </div>
                  {!notification.read && <Badge className="shrink-0">نئی</Badge>}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {relativeTime(notification.createdAt)}
                </p>
              </div>
            ))}
            {payload.notifications.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">ابھی کوئی اطلاع موجود نہیں۔</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <h2 className="font-urdu text-sm font-semibold">سرپرست پروفائل</h2>
          </div>
          <div className="space-y-3">
            {payload.guardians.map((guardian) => (
              <div key={guardian.id} className="rounded-md border border-border p-3">
                <p className="font-medium">{guardian.name}</p>
                {guardian.nameUrdu && (
                  <p className="font-urdu text-sm text-muted-foreground">{guardian.nameUrdu}</p>
                )}
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                  <span>{guardian.phone ?? "فون موجود نہیں"}</span>
                  <span>{guardian.email ?? "ای میل موجود نہیں"}</span>
                  <span>{guardian.address ?? "پتہ موجود نہیں"}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ParentStudentPanel({ student }: { student: ParentStudent }) {
  const attendanceRate = student.attendance.attendanceRate ?? 0;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-urdu text-xl font-bold leading-tight">{student.nameUrdu}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.name} · {student.enrollment.institutionName} · {student.enrollment.groupLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">رول {student.enrollment.rollNo}</Badge>
          <Badge variant={student.status === "active" ? "default" : "outline"}>
            {statusLabel(student.status)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList>
          <TabsTrigger value="overview">خلاصہ</TabsTrigger>
          <TabsTrigger value="timeline">ٹائم لائن</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-4 shadow-none">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <h3 className="font-urdu text-sm font-semibold">فیس</h3>
              </div>
              <p className="text-2xl font-bold">{formatMoney(student.fees.outstandingPaisa)}</p>
              <p className="text-xs text-muted-foreground">باقی واجبات</p>
              <div className="mt-3 text-xs text-muted-foreground">
                کل {formatMoney(student.fees.totalChargedPaisa)} میں سے {formatMoney(student.fees.totalPaidPaisa)} ادا ہوئے
              </div>
            </Card>

            <Card className="p-4 shadow-none">
              <div className="mb-3 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <h3 className="font-urdu text-sm font-semibold">حاضری</h3>
              </div>
              <p className="text-2xl font-bold">
                {student.attendance.attendanceRate === null
                  ? "—"
                  : `${student.attendance.attendanceRate}%`}
              </p>
              <Progress value={attendanceRate} className="mt-2" />
              <p className="mt-3 text-xs text-muted-foreground">
                حاضر {student.attendance.present} · تاخیر {student.attendance.late} · غیر حاضر {student.attendance.absent}
              </p>
            </Card>

            <Card className="p-4 shadow-none">
              <div className="mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h3 className="font-urdu text-sm font-semibold">تازہ نتیجہ</h3>
              </div>
              {student.latestResult ? (
                <>
                  <p className="text-2xl font-bold">{student.latestResult.grade}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.latestResult.examName} · {student.latestResult.percentage.toFixed(1)}%
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    نمبر {student.latestResult.obtainedMarks}/{student.latestResult.totalMarks}
                  </p>
                </>
              ) : (
                <p className="py-6 text-sm text-muted-foreground">ابھی کوئی شائع شدہ نتیجہ موجود نہیں۔</p>
              )}
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <div className="space-y-2">
            {student.timeline.map((event) => (
              <div key={event.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {urduMessageOrFallback(event.message, eventTypeLabel(event.type))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {eventTypeLabel(event.type)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {student.timeline.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                ابھی کوئی ٹائم لائن واقعہ موجود نہیں۔
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function GuardianAccountsWorkspace() {
  const [status, setStatus] = useState<"all" | "linked" | "unlinked">("all");
  const [q, setQ] = useState("");
  const params = useMemo(() => ({ status, q: q.trim() || undefined }), [q, status]);
  const accountsQuery = useQuery({
    queryKey: parentKeys.guardianAccounts(params),
    queryFn: () => listGuardianAccounts(params),
    staleTime: 20_000,
  });

  return (
    <div className="space-y-5" dir="rtl" lang="ur">
      <PageHeader
        title="والدین پورٹل"
        titleUrdu="والدین پورٹل"
        description="سرپرست اکاؤنٹس، والدین لاگ اِن، اور منسلک طلبہ۔"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          icon={Users2}
          label="سرپرست"
          value={(accountsQuery.data?.summary.total ?? 0).toString()}
        />
        <MetricCard
          icon={UserRound}
          label="منسلک"
          value={(accountsQuery.data?.summary.linked ?? 0).toString()}
        />
        <MetricCard
          icon={Bell}
          label="لاگ اِن باقی"
          value={(accountsQuery.data?.summary.unlinked ?? 0).toString()}
        />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <TabsList>
              <TabsTrigger value="all">سب</TabsTrigger>
              <TabsTrigger value="linked">منسلک</TabsTrigger>
              <TabsTrigger value="unlinked">غیر منسلک</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full md:w-80">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pe-9"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="سرپرست یا طالب علم تلاش کریں"
            />
          </div>
        </div>

        {accountsQuery.isLoading ? (
          <LoadingPanel label="سرپرست اکاؤنٹس لوڈ ہو رہے ہیں" compact />
        ) : accountsQuery.isError ? (
          <EmptyState
            icon={HeartHandshake}
            heading="سرپرست لوڈ نہیں ہو سکے"
            headingUrdu="سرپرست لوڈ نہیں ہو سکے"
            description={
              accountsQuery.error instanceof Error ? accountsQuery.error.message : "درخواست ناکام ہو گئی۔"
            }
          />
        ) : (
          <GuardianAccountTable guardians={accountsQuery.data?.guardians ?? []} />
        )}
      </Card>
    </div>
  );
}

function GuardianAccountTable({ guardians }: { guardians: GuardianAccount[] }) {
  if (guardians.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        heading="کوئی سرپرست نہیں ملا"
        headingUrdu="کوئی سرپرست نہیں ملا"
        description="فلٹر تبدیل کریں یا طالب علم پروفائل سے سرپرست منسلک کریں۔"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>سرپرست</TableHead>
          <TableHead>والدین اکاؤنٹ</TableHead>
          <TableHead>طلبہ</TableHead>
          <TableHead className="text-end">عمل</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {guardians.map((guardian) => {
          const firstStudent = guardian.students[0] ?? null;
          return (
            <TableRow key={guardian.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{guardian.name}</p>
                  {guardian.nameUrdu && (
                    <p className="font-urdu text-xs text-muted-foreground">{guardian.nameUrdu}</p>
                  )}
                  <p className="font-mono text-xs text-muted-foreground">
                    {guardian.phone ?? "فون موجود نہیں"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {guardian.userId ? (
                  <div>
                    <Badge>منسلک</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {guardian.parentUserUsername ?? "لاگ اِن موجود ہے"}
                    </p>
                  </div>
                ) : (
                  <Badge variant="destructive">غیر منسلک</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {guardian.students.slice(0, 3).map((student) => (
                    <p key={student.id} className="text-xs">
                      {student.nameUrdu || student.name} · رول {student.rollNo ?? "—"} ·{" "}
                      {student.relation ?? "سرپرست"}
                    </p>
                  ))}
                  {guardian.students.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      مزید {guardian.students.length - 3}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-end">
                {firstStudent ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/students/$id" params={{ id: firstStudent.id }}>
                      طالب علم کھولیں
                    </Link>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">کوئی طالب علم منسلک نہیں</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function LoadingPanel({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-sm text-muted-foreground",
        compact ? "py-10" : "py-24",
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "فعال",
    inactive: "غیر فعال",
    graduated: "فارغ التحصیل",
    dropout: "تارک",
    transferred: "منتقل",
    pending: "زیر غور",
  };
  return labels[status] ?? status;
}

function eventTypeLabel(type: string) {
  const labels: Record<string, string> = {
    admission_accepted: "داخلہ منظور ہوا",
    parent_account_created: "والدین لاگ اِن بنا",
    parent_account_failed: "والدین لاگ اِن نہیں بن سکا",
    student_updated: "طالب علم کی معلومات تبدیل ہوئیں",
    status_changed: "حالت تبدیل ہوئی",
    guardian_linked: "سرپرست منسلک ہوا",
    guardian_updated: "سرپرست کی معلومات تبدیل ہوئیں",
    sibling_linked: "بہن بھائی منسلک ہوا",
    sibling_removed: "بہن بھائی ہٹایا گیا",
    enrollment_moved: "تعلیمی جگہ تبدیل ہوئی",
    fee_charge_created: "فیس چارج بنی",
    fee_payment_recorded: "فیس ادائیگی درج ہوئی",
    fee_charge_reversed: "فیس چارج واپس ہوئی",
    fee_payment_reversed: "فیس ادائیگی واپس ہوئی",
    fee_refund_recorded: "فیس ریفنڈ درج ہوا",
    fee_adjustment_recorded: "فیس ایڈجسٹمنٹ درج ہوئی",
    attendance_absent_marked: "غیر حاضری درج ہوئی",
    attendance_late_marked: "تاخیر درج ہوئی",
    attendance_leave_marked: "رخصت درج ہوئی",
    attendance_corrected: "حاضری درست ہوئی",
    exam_result_published: "نتیجہ شائع ہوا",
    exam_result_failed: "نتیجہ ناکام ہوا",
    exam_dmc_generated: "ڈی ایم سی بنی",
  };
  return labels[type] ?? "واقعہ";
}

function urduMessageOrFallback(message: string | null | undefined, fallback: string) {
  const trimmed = message?.trim();
  if (!trimmed) return fallback;
  return /[\u0600-\u06ff]/.test(trimmed) ? trimmed : fallback;
}

function formatMoney(paisa: number) {
  return formatPKR(Math.round(paisa / 100));
}
