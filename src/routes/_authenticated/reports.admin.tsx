import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, FileSpreadsheet, Shield, Activity, UserCheck, Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { ChartCard, KpiCard } from "@/components/shared/chart-card";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from "@/lib/chart-theme";
import { auditLog } from "@/mock/audit-log";
import { users } from "@/mock";
import { downloadCsv, printHtml, tableHtml, kpiHtml } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/reports/admin")({
  component: AdminReport,
});

function AdminReport() {
  // Group by action prefix (module)
  const byModule = new Map<string, number>();
  const byUser = new Map<string, number>();
  const byAction = new Map<string, number>();
  const byDay = new Map<string, number>();

  for (const a of auditLog) {
    const mod = a.action.split(".")[0];
    byModule.set(mod, (byModule.get(mod) ?? 0) + 1);
    byUser.set(a.userName, (byUser.get(a.userName) ?? 0) + 1);
    byAction.set(a.action, (byAction.get(a.action) ?? 0) + 1);
    const day = a.at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const moduleData = [...byModule.entries()].map(([name, value], i) => ({
    name, value, color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const userData = [...byUser.entries()].sort((a, b) => b[1] - a[1]).map(([user, count]) => ({ user, count }));
  const actionData = [...byAction.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([action, count]) => ({ action, count }));
  const trendData = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), count }));

  const activeUsers = users.filter((u) => u.status === "active").length;
  const adminUsers = users.filter((u) => u.role === "admin" || u.role === "super_admin").length;
  const loginEvents = auditLog.filter((a) => a.action.startsWith("auth.")).length;

  return (
    <div>
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />Reports
      </Link>
      <PageHeader
        title="Administrative Report"
        titleUrdu="انتظامی رپورٹ"
        description="Audit log, role activity, security events, and system changes across all modules."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printHtml(
              "Administrative Report",
              `<h1>Administrative Report</h1><div class="urdu">انتظامی رپورٹ</div>
              <div>${kpiHtml([
                { label: "Total Events", value: auditLog.length },
                { label: "Active Users", value: activeUsers },
                { label: "Admin Users", value: adminUsers },
              ])}</div>
              ${tableHtml(["When", "User", "Action", "Entity", "Details"], auditLog.map((a) => [new Date(a.at).toLocaleString(), a.userName, a.action, `${a.entity} ${a.entityId}`, a.details]))}`
            )}><Printer className="h-3.5 w-3.5" />Print</Button>
            <Button size="sm" className="gap-1.5" onClick={() => downloadCsv(
              "administrative-report",
              ["When", "User", "Action", "Entity", "EntityId", "Details"],
              auditLog.map((a) => [a.at, a.userName, a.action, a.entity, a.entityId, a.details]),
            )}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Events" labelUrdu="کل واقعات" value={auditLog.length} />
        <KpiCard label="Active Users" labelUrdu="فعال صارفین" value={activeUsers} accent="success" />
        <KpiCard label="Admin Accounts" labelUrdu="منتظم اکاؤنٹس" value={adminUsers} />
        <KpiCard label="Auth Events" labelUrdu="لاگ ان واقعات" value={loginEvents} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Activity Timeline" titleUrdu="سرگرمی کا رجحان" className="lg:col-span-2" bodyClassName="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line dataKey="count" name="Events" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Activity by Module" titleUrdu="ماڈیول وار سرگرمی" bodyClassName="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={moduleData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                {moduleData.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Top Active Users" titleUrdu="سب سے فعال صارفین" bodyClassName="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userData} layout="vertical" margin={{ top: 8, right: 16, left: 80, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={AXIS_TICK} stroke="var(--border)" />
              <YAxis type="category" dataKey="user" tick={AXIS_TICK} stroke="var(--border)" width={100} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Actions" titleUrdu="بار بار ہونے والے اعمال" bodyClassName="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={actionData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="action" tick={{ ...AXIS_TICK, fontSize: 10 }} stroke="var(--border)" angle={-30} textAnchor="end" height={60} />
              <YAxis tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="p-5 mb-4">
        <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Recent Audit Trail</h3>
            <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground leading-tight">حالیہ ریکارڈ</p>
          </div>
          <Badge variant="outline" className="gap-1.5"><Shield className="h-3 w-3" />Tamper-evident</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">When</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground font-mono">{new Date(a.at).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{a.userName}</TableCell>
                  <TableCell><Badge variant="secondary" className="font-mono text-[10px]">{a.action}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{a.entity} · {a.entityId}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <Card className="p-4 flex items-start gap-3">
          <UserCheck className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">User Sessions</p>
            <p dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">صارفین کے سیشنز</p>
            <p className="text-xs text-muted-foreground mt-1">All sessions are signed and revocable from the user management page.</p>
          </div>
        </Card>
        <Card className="p-4 flex items-start gap-3">
          <Lock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Role Permissions</p>
            <p dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">کرداروں کی اجازتیں</p>
            <p className="text-xs text-muted-foreground mt-1">Role-based access controls enforced on every server boundary.</p>
          </div>
        </Card>
        <Card className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Backups</p>
            <p dir="rtl" lang="ur" className="font-urdu text-xs text-muted-foreground">بیک اپس</p>
            <p className="text-xs text-muted-foreground mt-1">Daily encrypted snapshots retained for 30 days.</p>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-heading font-semibold text-sm mb-1">Insights</h3>
        <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground mb-3">اہم نکات</p>
        <ul className="text-sm space-y-2 list-disc ps-5 text-muted-foreground">
          <li><span className="font-semibold text-foreground">{auditLog.length}</span> events recorded across <span className="font-semibold text-foreground">{byModule.size}</span> modules.</li>
          <li>Most active user: <span className="font-semibold text-foreground">{userData[0]?.user}</span> with {userData[0]?.count} actions.</li>
          <li>Most frequent action: <span className="font-semibold text-foreground">{actionData[0]?.action}</span> ({actionData[0]?.count} occurrences).</li>
        </ul>
      </Card>
    </div>
  );
}