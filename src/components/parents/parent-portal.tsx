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
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/language-context";
import { formatDate, formatPKR, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getGuardianDashboard, listGuardianAccounts, parentKeys } from "./parent-api";
import type { GuardianAccount, ParentStudent } from "./parent-types";

export function ParentPortal() {
  const { user } = useAuth();
  if (user?.role === "parent") return <GuardianSelfPortal />;
  return <GuardianAccountsWorkspace />;
}

function GuardianSelfPortal() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
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

  if (dashboardQuery.isLoading) {
    return <LoadingPanel label={isUrdu ? "والدین پورٹل لوڈ ہو رہا ہے..." : "Loading Parent Portal..."} />;
  }

  if (dashboardQuery.isError) {
    return (
      <EmptyState
        icon={HeartHandshake}
        heading={isUrdu ? "پورٹل دستیاب نہیں" : "Portal unavailable"}
        headingUrdu="پورٹل دستیاب نہیں"
        description={
          dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : isUrdu
              ? "سرپرست کی معلومات لوڈ نہیں ہو سکیں۔"
              : "Could not load guardian information."
        }
      />
    );
  }

  if (!payload || payload.students.length === 0) {
    return (
      <div>
        <PageHeader
          title="Parent Portal"
          titleUrdu="والدین پورٹل"
          description="Connected students, fee dues, attendance, results, and alerts."
          descriptionUrdu="منسلک طلبہ، واجبات، حاضری، نتائج، اور اطلاعات۔"
        />
        <EmptyState
          icon={Users2}
          heading={isUrdu ? "کوئی طالب علم منسلک نہیں" : "No student linked"}
          headingUrdu="کوئی طالب علم منسلک نہیں"
          description={
            isUrdu
              ? "یہ والدین اکاؤنٹ فعال ہے، مگر ابھی کوئی طالب علم منسلک نہیں۔"
              : "This parent account is active, but no student is linked yet."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5" dir={isUrdu ? "rtl" : "ltr"} lang={lang}>
      <PageHeader
        title="Parent Portal"
        titleUrdu="والدین پورٹل"
        description="Connected students, fee dues, attendance, exam results, and notifications."
        descriptionUrdu="منسلک طلبہ، واجبات، حاضری، نتائج، اور اطلاعات۔"
        actions={
          <Badge
            variant={payload.summary.unreadNotifications > 0 ? "default" : "secondary"}
            className="gap-1.5"
          >
            <Bell className="h-3.5 w-3.5" />
            {payload.summary.unreadNotifications} {isUrdu ? "غیر پڑھی" : "unread"}
          </Badge>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <MetricCard
          icon={Users2}
          label={isUrdu ? "طلبہ" : "Students"}
          value={payload.summary.studentCount.toString()}
        />
        <MetricCard
          icon={Wallet}
          label={isUrdu ? "واجب الادا" : "Outstanding Dues"}
          value={formatMoney(payload.summary.totalOutstandingPaisa)}
        />
        <MetricCard
          icon={CalendarCheck}
          label={isUrdu ? "حاضری کی شرح" : "Attendance Rate"}
          value={
            payload.summary.averageAttendanceRate === null
              ? "—"
              : `${payload.summary.averageAttendanceRate}%`
          }
        />
        <MetricCard
          icon={Bell}
          label={isUrdu ? "غیر پڑھی اطلاعات" : "Unread Alerts"}
          value={payload.summary.unreadNotifications.toString()}
        />
      </div>

      {/* Linked Students Switcher */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {payload.students.map((student) => {
          const active = activeStudent?.id === student.id;
          const primaryName = isUrdu ? (student.nameUrdu || student.name) : (student.name || student.nameUrdu);
          return (
            <button
              key={student.id}
              onClick={() => setActiveStudentId(student.id)}
              className={cn(
                "min-w-[200px] sm:min-w-[220px] rounded-xl border p-3 text-start transition-all",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card hover:bg-muted text-card-foreground",
              )}
            >
              <p className={cn("text-base font-semibold leading-normal truncate", isUrdu && "font-urdu")}>
                {primaryName}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs truncate",
                  active ? "text-primary-foreground/80" : "text-muted-foreground",
                  isUrdu && "font-urdu"
                )}
              >
                {isUrdu
                  ? `رول ${student.enrollment.rollNo} · ${student.enrollment.groupLabel}`
                  : `Roll ${student.enrollment.rollNo} · ${student.enrollment.groupLabel}`}
              </p>
            </button>
          );
        })}
      </div>

      {activeStudent && <ParentStudentPanel student={activeStudent} isUrdu={isUrdu} />}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className={cn("text-sm font-semibold", isUrdu && "font-urdu")}>
              {isUrdu ? "حالیہ اطلاعات" : "Recent Notifications"}
            </h2>
          </div>
          <div className="space-y-2">
            {payload.notifications.slice(0, 6).map((notification) => (
              <div key={notification.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
                  </div>
                  {!notification.read && <Badge className="shrink-0">{isUrdu ? "نئی" : "New"}</Badge>}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {relativeTime(notification.createdAt)}
                </p>
              </div>
            ))}
            {payload.notifications.length === 0 && (
              <p className={cn("py-8 text-center text-sm text-muted-foreground", isUrdu && "font-urdu")}>
                {isUrdu ? "ابھی کوئی اطلاع موجود نہیں۔" : "No notifications available."}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <h2 className={cn("text-sm font-semibold", isUrdu && "font-urdu")}>
              {isUrdu ? "سرپرست پروفائل" : "Guardian Profile"}
            </h2>
          </div>
          <div className="space-y-3">
            {payload.guardians.map((guardian) => {
              const guardianPrimaryName = isUrdu ? (guardian.nameUrdu || guardian.name) : (guardian.name || guardian.nameUrdu);
              const guardianSecondaryName = isUrdu
                ? (guardian.name !== guardian.nameUrdu ? guardian.name : null)
                : (guardian.nameUrdu && guardian.nameUrdu !== guardian.name ? guardian.nameUrdu : null);

              return (
                <div key={guardian.id} className="rounded-md border border-border p-3">
                  <p className={cn("font-medium", isUrdu && "font-urdu")}>{guardianPrimaryName}</p>
                  {guardianSecondaryName && (
                    <p className={cn("text-xs text-muted-foreground", !isUrdu && "font-urdu")}>
                      ({guardianSecondaryName})
                    </p>
                  )}
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <span>{guardian.phone ?? (isUrdu ? "فون موجود نہیں" : "No phone")}</span>
                    <span>{guardian.email ?? (isUrdu ? "ای میل موجود نہیں" : "No email")}</span>
                    <span>{guardian.address ?? (isUrdu ? "پتہ موجود نہیں" : "No address")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ParentStudentPanel({ student, isUrdu }: { student: ParentStudent; isUrdu: boolean }) {
  const attendanceRate = student.attendance.attendanceRate ?? 0;
  const primaryName = isUrdu ? (student.nameUrdu || student.name) : (student.name || student.nameUrdu);
  const secondaryName = isUrdu
    ? (student.name && student.name !== student.nameUrdu ? student.name : null)
    : (student.nameUrdu && student.nameUrdu !== student.name ? student.nameUrdu : null);

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-xl font-bold leading-normal", isUrdu && "font-urdu")}>
              {primaryName}
            </p>
            {secondaryName && (
              <span className={cn("text-sm text-muted-foreground", !isUrdu && "font-urdu")}>
                ({secondaryName})
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.enrollment.institutionName} · {student.enrollment.groupLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {isUrdu ? `رول ${student.enrollment.rollNo}` : `Roll ${student.enrollment.rollNo}`}
          </Badge>
          <Badge variant={student.status === "active" ? "default" : "outline"}>
            {statusLabel(student.status, isUrdu)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList>
          <TabsTrigger value="overview">{isUrdu ? "خلاصہ" : "Overview"}</TabsTrigger>
          <TabsTrigger value="timeline">{isUrdu ? "ٹائم لائن" : "Timeline"}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4 shadow-none">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <h3 className={cn("text-sm font-semibold", isUrdu && "font-urdu")}>
                  {isUrdu ? "فیس واجبات" : "Fee Dues"}
                </h3>
              </div>
              <p className="text-2xl font-bold font-mono">{formatMoney(student.fees.outstandingPaisa)}</p>
              <p className={cn("text-xs text-muted-foreground mt-0.5", isUrdu && "font-urdu")}>
                {isUrdu ? "باقی واجب الادا رقم" : "Remaining balance"}
              </p>
              <div className={cn("mt-3 text-xs text-muted-foreground", isUrdu && "font-urdu")}>
                {isUrdu
                  ? `کل ${formatMoney(student.fees.totalChargedPaisa)} میں سے ${formatMoney(student.fees.totalPaidPaisa)} ادا ہوئے`
                  : `Paid ${formatMoney(student.fees.totalPaidPaisa)} of total ${formatMoney(student.fees.totalChargedPaisa)}`}
              </div>
            </Card>

            <Card className="p-4 shadow-none">
              <div className="mb-3 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <h3 className={cn("text-sm font-semibold", isUrdu && "font-urdu")}>
                  {isUrdu ? "حاضری" : "Attendance"}
                </h3>
              </div>
              <p className="text-2xl font-bold font-mono">
                {student.attendance.attendanceRate === null
                  ? "—"
                  : `${student.attendance.attendanceRate}%`}
              </p>
              <Progress value={attendanceRate} className="mt-2" />
              <p className={cn("mt-3 text-xs text-muted-foreground", isUrdu && "font-urdu")}>
                {isUrdu
                  ? `حاضر ${student.attendance.present} · تاخیر ${student.attendance.late} · غیر حاضر ${student.attendance.absent}`
                  : `Present ${student.attendance.present} · Late ${student.attendance.late} · Absent ${student.attendance.absent}`}
              </p>
            </Card>

            <Card className="p-4 shadow-none sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h3 className={cn("text-sm font-semibold", isUrdu && "font-urdu")}>
                  {isUrdu ? "تازہ نتیجہ" : "Latest Result"}
                </h3>
              </div>
              {student.latestResult ? (
                <>
                  <p className="text-2xl font-bold">{student.latestResult.grade}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.latestResult.examName} · {student.latestResult.percentage.toFixed(1)}%
                  </p>
                  <p className={cn("mt-3 text-xs text-muted-foreground font-mono", isUrdu && "font-urdu")}>
                    {isUrdu ? `نمبر ${student.latestResult.obtainedMarks}/${student.latestResult.totalMarks}` : `Marks ${student.latestResult.obtainedMarks}/${student.latestResult.totalMarks}`}
                  </p>
                </>
              ) : (
                <p className={cn("py-6 text-sm text-muted-foreground text-center", isUrdu && "font-urdu")}>
                  {isUrdu ? "ابھی کوئی شائع شدہ نتیجہ موجود نہیں۔" : "No published exam result yet."}
                </p>
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
                      {isUrdu
                        ? urduMessageOrFallback(event.message, eventTypeLabel(event.type, true))
                        : event.message ?? eventTypeLabel(event.type, false)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {eventTypeLabel(event.type, isUrdu)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground font-mono">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {student.timeline.length === 0 && (
              <p className={cn("py-8 text-center text-sm text-muted-foreground", isUrdu && "font-urdu")}>
                {isUrdu ? "ابھی کوئی ٹائم لائن واقعہ موجود نہیں۔" : "No timeline events recorded yet."}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function GuardianAccountsWorkspace() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [status, setStatus] = useState<"all" | "linked" | "unlinked">("all");
  const [q, setQ] = useState("");
  const params = useMemo(() => ({ status, q: q.trim() || undefined }), [q, status]);
  const accountsQuery = useQuery({
    queryKey: parentKeys.guardianAccounts(params),
    queryFn: () => listGuardianAccounts(params),
    staleTime: 20_000,
  });

  return (
    <div className="space-y-5" dir={isUrdu ? "rtl" : "ltr"} lang={lang}>
      <PageHeader
        title="Guardian Accounts"
        titleUrdu="والدین پورٹل"
        description="Guardian accounts, parent portal logins, and connected students."
        descriptionUrdu="سرپرست اکاؤنٹس، والدین لاگ اِن، اور منسلک طلبہ۔"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={Users2}
          label={isUrdu ? "کل سرپرست" : "Total Guardians"}
          value={(accountsQuery.data?.summary.total ?? 0).toString()}
        />
        <MetricCard
          icon={UserRound}
          label={isUrdu ? "منسلک لاگ اِن" : "Linked Accounts"}
          value={(accountsQuery.data?.summary.linked ?? 0).toString()}
        />
        <MetricCard
          icon={Bell}
          label={isUrdu ? "بغیر لاگ اِن" : "Unlinked Accounts"}
          value={(accountsQuery.data?.summary.unlinked ?? 0).toString()}
        />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <TabsList>
              <TabsTrigger value="all">{isUrdu ? "سب" : "All"}</TabsTrigger>
              <TabsTrigger value="linked">{isUrdu ? "منسلک" : "Linked"}</TabsTrigger>
              <TabsTrigger value="unlinked">{isUrdu ? "غیر منسلک" : "Unlinked"}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full md:w-80">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pe-9"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={isUrdu ? "سرپرست یا طالب علم تلاش کریں..." : "Search guardian or student..."}
            />
          </div>
        </div>

        {accountsQuery.isLoading ? (
          <LoadingPanel label={isUrdu ? "سرپرست اکاؤنٹس لوڈ ہو رہے ہیں..." : "Loading guardian accounts..."} compact />
        ) : accountsQuery.isError ? (
          <EmptyState
            icon={HeartHandshake}
            heading={isUrdu ? "سرپرست لوڈ نہیں ہو سکے" : "Could not load guardians"}
            headingUrdu="سرپرست لوڈ نہیں ہو سکے"
            description={
              accountsQuery.error instanceof Error
                ? accountsQuery.error.message
                : isUrdu
                  ? "درخواست ناکام ہو گئی۔"
                  : "Request failed."
            }
          />
        ) : (
          <GuardianAccountTable guardians={accountsQuery.data?.guardians ?? []} isUrdu={isUrdu} />
        )}
      </Card>
    </div>
  );
}

function GuardianAccountTable({
  guardians,
  isUrdu,
}: {
  guardians: GuardianAccount[];
  isUrdu: boolean;
}) {
  if (guardians.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        heading={isUrdu ? "کوئی سرپرست نہیں ملا" : "No guardians found"}
        headingUrdu="کوئی سرپرست نہیں ملا"
        description={
          isUrdu
            ? "فلٹر تبدیل کریں یا طالب علم پروفائل سے سرپرست منسلک کریں۔"
            : "Adjust filters or link guardians from student profile."
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{isUrdu ? "سرپرست" : "Guardian"}</TableHead>
            <TableHead>{isUrdu ? "والدین اکاؤنٹ" : "Parent Account"}</TableHead>
            <TableHead>{isUrdu ? "منسلک طلبہ" : "Linked Students"}</TableHead>
            <TableHead className="text-end">{isUrdu ? "عمل" : "Action"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guardians.map((guardian) => {
            const firstStudent = guardian.students[0] ?? null;
            const guardianPrimaryName = isUrdu ? (guardian.nameUrdu || guardian.name) : (guardian.name || guardian.nameUrdu);
            const guardianSecondaryName = isUrdu
              ? (guardian.name !== guardian.nameUrdu ? guardian.name : null)
              : (guardian.nameUrdu && guardian.nameUrdu !== guardian.name ? guardian.nameUrdu : null);

            return (
              <TableRow key={guardian.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className={cn("font-medium", isUrdu && "font-urdu")}>{guardianPrimaryName}</p>
                    {guardianSecondaryName && (
                      <p className={cn("text-xs text-muted-foreground", !isUrdu && "font-urdu")}>
                        ({guardianSecondaryName})
                      </p>
                    )}
                    <p className="font-mono text-xs text-muted-foreground">
                      {guardian.phone ?? (isUrdu ? "فون نہیں" : "No phone")}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {guardian.userId ? (
                    <div>
                      <Badge variant="default">{isUrdu ? "منسلک" : "Linked"}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {guardian.parentUserUsername ?? (isUrdu ? "لاگ اِن فعال ہے" : "Active Login")}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="destructive">{isUrdu ? "غیر منسلک" : "Unlinked"}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {guardian.students.slice(0, 3).map((student) => {
                      const studentName = isUrdu ? (student.nameUrdu || student.name) : (student.name || student.nameUrdu);
                      return (
                        <p key={student.id} className="text-xs">
                          <span className={cn(isUrdu && "font-urdu")}>{studentName}</span>
                          <span className="text-muted-foreground ms-1">
                            · {isUrdu ? `رول ${student.rollNo ?? "—"}` : `Roll ${student.rollNo ?? "—"}`} · {student.relation ?? (isUrdu ? "سرپرست" : "Guardian")}
                          </span>
                        </p>
                      );
                    })}
                    {guardian.students.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        {isUrdu ? `مزید ${guardian.students.length - 3}` : `+${guardian.students.length - 3} more`}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-end">
                  {firstStudent ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/students/$id" params={{ id: firstStudent.id }}>
                        {isUrdu ? "طالب علم کھولیں" : "View Student"}
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {isUrdu ? "کوئی طالب علم منسلک نہیں" : "No students"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
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
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold truncate">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
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

function statusLabel(status: string, isUrdu: boolean) {
  if (!isUrdu) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
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

function eventTypeLabel(type: string, isUrdu: boolean) {
  if (!isUrdu) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
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
