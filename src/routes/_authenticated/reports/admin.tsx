import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Printer,
  FileSpreadsheet,
  Shield,
  Activity,
  UserCheck,
  Lock,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from "@/lib/chart-theme";
import { useEffect, useState, useMemo } from "react";
import type { AuditEntry } from "@/types";
import { auditLog as INITIAL_AUDIT_LOG } from "@/mock/audit-log";
import { users as INITIAL_USERS } from "@/mock/users";
import { downloadCsv, printHtml, tableHtml, kpiHtml } from "@/lib/export";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports/admin")({
  component: AdminReport,
});

function AdminReport() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [userList, setUserList] = useState<
    Array<{ id: string; name: string; role: string; status: string }>
  >(() => INITIAL_USERS);

  const [logs, setLogs] = useState<AuditEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("msmis_audit_log");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_AUDIT_LOG;
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");

  const loadData = async (showToast = false) => {
    setLoading(true);
    try {
      const [auditRes, usersRes] = await Promise.allSettled([
        fetch("/api/admin/audit-logs", { credentials: "include" }),
        fetch("/api/users", { credentials: "include" }),
      ]);

      if (auditRes.status === "fulfilled" && auditRes.value.ok) {
        const data = await auditRes.value.json().catch(() => null);
        if (data?.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          setLogs(data.logs);
          try {
            localStorage.setItem("msmis_audit_log", JSON.stringify(data.logs));
          } catch {}
        }
      }

      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const udata = await usersRes.value.json().catch(() => null);
        const list = Array.isArray(udata) ? udata : udata?.users ?? [];
        if (list.length > 0) {
          setUserList(list);
        }
      }

      if (showToast) {
        toast.success(
          isUrdu
            ? "انتظامی رپورٹ کا ڈیٹا اپ ڈیٹ کر دیا گیا"
            : "Administrative report data refreshed",
        );
      }
    } catch {
      // Fallback state is already populated
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered logs based on search and module
  const filteredLogs = useMemo(() => {
    return logs.filter((a) => {
      const mod = a.action.split(".")[0]?.toLowerCase() ?? "";
      if (selectedModule !== "all" && mod !== selectedModule) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        a.userName.toLowerCase().includes(query) ||
        a.action.toLowerCase().includes(query) ||
        a.entity.toLowerCase().includes(query) ||
        a.entityId.toLowerCase().includes(query) ||
        (a.details && a.details.toLowerCase().includes(query))
      );
    });
  }, [logs, selectedModule, searchQuery]);

  // Group by action prefix (module)
  const byModule = new Map<string, number>();
  const byUser = new Map<string, number>();
  const byAction = new Map<string, number>();
  const byDay = new Map<string, number>();

  for (const a of logs) {
    const mod = a.action.split(".")[0];
    byModule.set(mod, (byModule.get(mod) ?? 0) + 1);
    byUser.set(a.userName, (byUser.get(a.userName) ?? 0) + 1);
    byAction.set(a.action, (byAction.get(a.action) ?? 0) + 1);
    const day = a.at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const moduleData = [...byModule.entries()].map(([name, value], i) => ({
    name,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const userData = [...byUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([user, count]) => ({ user, count }));

  const actionData = [...byAction.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([action, count]) => ({ action, count }));

  const trendData = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count }));

  const activeUsers = userList.filter((u) => u.status === "active").length;
  const adminUsers = userList.filter(
    (u) => u.role === "admin" || u.role === "super_admin",
  ).length;
  const loginEvents = logs.filter(
    (a) =>
      a.action.startsWith("auth.") ||
      a.action.includes("login") ||
      a.action.includes("user"),
  ).length;

  const availableModules = useMemo(() => {
    return Array.from(byModule.keys()).sort();
  }, [byModule]);

  const getModuleBadgeVariant = (action: string) => {
    const mod = action.split(".")[0];
    switch (mod) {
      case "donation":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      case "leave":
        return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
      case "student":
      case "admission":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "fee":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "inventory":
        return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
      case "auth":
      case "user":
        return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Link
        to="/reports"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        {isUrdu ? "رپورٹس پر واپس جائیں" : "Reports"}
      </Link>

      <PageHeader
        title="Administrative Report"
        titleUrdu="انتظامی رپورٹ"
        description="Audit log, role activity, security events, and system changes across all modules."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => loadData(true)}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              {isUrdu ? "ریفریش" : "Refresh"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                printHtml(
                  "Administrative Report",
                  `<h1>Administrative Report</h1><div class="urdu">انتظامی رپورٹ</div>
                <div>${kpiHtml([
                  { label: "Total Events", value: logs.length },
                  { label: "Active Users", value: activeUsers },
                  { label: "Admin Users", value: adminUsers },
                  { label: "Auth Events", value: loginEvents },
                ])}</div>
                ${tableHtml(
                  ["When", "User", "Action", "Entity", "Details"],
                  filteredLogs.map((a) => [
                    new Date(a.at).toLocaleString(),
                    a.userName,
                    a.action,
                    `${a.entity} ${a.entityId}`,
                    a.details || "—",
                  ]),
                )}`,
                )
              }
            >
              <Printer className="h-3.5 w-3.5" />
              {isUrdu ? "پرنٹ" : "Print"}
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() =>
                downloadCsv(
                  "administrative-report",
                  ["When", "User", "Action", "Entity", "EntityId", "Details"],
                  filteredLogs.map((a) => [
                    a.at,
                    a.userName,
                    a.action,
                    a.entity,
                    a.entityId,
                    a.details || "",
                  ]),
                )
              }
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {isUrdu ? "ایکسل ڈاونلوڈ" : "Excel"}
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total Events"
          labelUrdu="کل واقعات"
          value={logs.length}
        />
        <KpiCard
          label="Active Users"
          labelUrdu="فعال صارفین"
          value={activeUsers}
          accent="success"
        />
        <KpiCard
          label="Admin Accounts"
          labelUrdu="منتظم اکاؤنٹس"
          value={adminUsers}
        />
        <KpiCard
          label="Auth & Security"
          labelUrdu="سیکیورٹی اور لاگ ان"
          value={loginEvents}
          accent="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard
          title="Activity Timeline"
          titleUrdu="سرگرمی کا رجحان"
          className="lg:col-span-2"
          bodyClassName="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                dataKey="count"
                name="Events"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Activity by Module"
          titleUrdu="ماڈیول وار سرگرمی"
          bodyClassName="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={moduleData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={85}
                paddingAngle={2}
              >
                {moduleData.map((m, i) => (
                  <Cell key={i} fill={m.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  color: "var(--foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard
          title="Top Active Users"
          titleUrdu="سب سے فعال صارفین"
          bodyClassName="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={userData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 80, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis
                type="category"
                dataKey="user"
                tick={AXIS_TICK}
                stroke="var(--border)"
                width={100}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="count"
                fill={CHART_COLORS[0]}
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top Actions"
          titleUrdu="بار بار ہونے والے اعمال"
          bodyClassName="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={actionData}
              margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="action"
                tick={{ ...AXIS_TICK, fontSize: 10 }}
                stroke="var(--border)"
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="count"
                fill={CHART_COLORS[2]}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Audit Trail Table with Search & Module Filter */}
      <Card className="p-5">
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3
              className={cn(
                "font-semibold text-base flex items-center gap-2",
                isUrdu ? "font-urdu text-lg" : "font-heading",
              )}
            >
              <Activity className="h-4 w-4 text-primary" />
              {isUrdu ? "آڈٹ ٹریل اور انتظامی سرگرمیاں" : "Audit Trail & System Activities"}
            </h3>
            <p className={cn("text-xs text-muted-foreground mt-0.5", isUrdu && "font-urdu")}>
              {isUrdu
                ? `دکھائے جا رہے ہیں: ${filteredLogs.length} از ${logs.length} ریکارڈز`
                : `Showing ${filteredLogs.length} of ${logs.length} administrative events`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={isUrdu ? "تلاش کریں (صارف، عمل، ماڈیول)..." : "Search audit trail..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-8 h-9 text-xs"
              />
            </div>

            <div className="w-[160px]">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue
                    placeholder={isUrdu ? "تمام ماڈیولز" : "All Modules"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {isUrdu ? "تمام ماڈیولز (All)" : "All Modules"}
                  </SelectItem>
                  {availableModules.map((m) => (
                    <SelectItem key={m} value={m}>
                      <span className="capitalize">{m}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs">
              <Shield className="h-3 w-3 text-primary" />
              {isUrdu ? "محفوظ آڈٹ لاگ" : "Secure Log"}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-44 text-xs font-semibold">
                  {isUrdu ? "وقت و تاریخ" : "When"}
                </TableHead>
                <TableHead className="w-40 text-xs font-semibold">
                  {isUrdu ? "صارف" : "User"}
                </TableHead>
                <TableHead className="w-36 text-xs font-semibold">
                  {isUrdu ? "کارروائی" : "Action"}
                </TableHead>
                <TableHead className="w-40 text-xs font-semibold">
                  {isUrdu ? "ماڈیول / اینٹیٹی" : "Entity"}
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  {isUrdu ? "تفصیلات" : "Details"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-sm text-muted-foreground"
                  >
                    {isUrdu
                      ? "کوئی متعلقہ آڈٹ ریکارڈ نہیں ملا"
                      : "No matching audit records found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {new Date(a.at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {a.userName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10.5px] px-2 py-0.5 border font-semibold",
                          getModuleBadgeVariant(a.action),
                        )}
                      >
                        {a.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {a.entity}
                      </span>{" "}
                      · {a.entityId}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.details || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4 flex items-start gap-3">
          <UserCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                isUrdu && "font-urdu text-base",
              )}
            >
              {isUrdu ? "صارفین کے سیشنز" : "User Sessions"}
            </p>
            <p
              className={cn(
                "text-xs text-muted-foreground mt-1",
                isUrdu && "font-urdu",
              )}
            >
              {isUrdu
                ? "تمام سیشنز تصدیق شدہ ہیں اور یوزر مینجمنٹ پیج سے منسوخ کیے جا سکتے ہیں۔"
                : "All sessions are signed and revocable from the user management page."}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-start gap-3">
          <Lock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                isUrdu && "font-urdu text-base",
              )}
            >
              {isUrdu ? "کرداروں کی اجازتیں" : "Role Permissions"}
            </p>
            <p
              className={cn(
                "text-xs text-muted-foreground mt-1",
                isUrdu && "font-urdu",
              )}
            >
              {isUrdu
                ? "ہر سرور باؤنڈری پر کردار پر مبنی رسائی کنٹرول نافذ ہے۔"
                : "Role-based access controls enforced on every server boundary."}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                isUrdu && "font-urdu text-base",
              )}
            >
              {isUrdu ? "بیک اپس اور تحفظ" : "Backups & Security"}
            </p>
            <p
              className={cn(
                "text-xs text-muted-foreground mt-1",
                isUrdu && "font-urdu",
              )}
            >
              {isUrdu
                ? "30 دن کے لیے محفوظ شدہ روزانہ خفیہ محفوظ بیک اپ اسنیپ شاٹس۔"
                : "Daily encrypted snapshots retained for 30 days."}
            </p>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-5">
        <h3
          className={cn(
            "font-semibold text-sm mb-3",
            isUrdu ? "font-urdu text-base" : "font-heading",
          )}
        >
          {isUrdu ? "اہم انتظامی نکات" : "Administrative Insights"}
        </h3>
        <ul
          className={cn(
            "text-sm space-y-2 list-disc ps-5 text-muted-foreground",
            isUrdu && "font-urdu",
          )}
        >
          {logs.length === 0 ? (
            <li>
              {isUrdu
                ? "ابھی کوئی آڈٹ ریکارڈ موجود نہیں ہے۔"
                : "No administrative events have been recorded yet."}
            </li>
          ) : isUrdu ? (
            <>
              <li>
                <span className="font-semibold text-foreground">
                  {byModule.size}
                </span>{" "}
                ماڈیولز میں{" "}
                <span className="font-semibold text-foreground">
                  {logs.length}
                </span>{" "}
                سرگرمیاں ریکارڈ کی گئی ہیں۔
              </li>
              <li>
                سب سے زیادہ فعال صارف:{" "}
                <span className="font-semibold text-foreground">
                  {userData[0]?.user ?? "—"}
                </span>{" "}
                ({userData[0]?.count ?? 0} کارروائیاں)۔
              </li>
              <li>
                سب سے عام کارروائی:{" "}
                <span className="font-semibold text-foreground">
                  {actionData[0]?.action ?? "—"}
                </span>{" "}
                ({actionData[0]?.count ?? 0} مرتبہ)۔
              </li>
            </>
          ) : (
            <>
              <li>
                <span className="font-semibold text-foreground">
                  {logs.length}
                </span>{" "}
                events recorded across{" "}
                <span className="font-semibold text-foreground">
                  {byModule.size}
                </span>{" "}
                modules.
              </li>
              <li>
                Most active user:{" "}
                <span className="font-semibold text-foreground">
                  {userData[0]?.user ?? "—"}
                </span>{" "}
                with {userData[0]?.count ?? 0} actions.
              </li>
              <li>
                Most frequent action:{" "}
                <span className="font-semibold text-foreground">
                  {actionData[0]?.action ?? "—"}
                </span>{" "}
                ({actionData[0]?.count ?? 0} occurrences).
              </li>
            </>
          )}
        </ul>
      </Card>
    </div>
  );
}
