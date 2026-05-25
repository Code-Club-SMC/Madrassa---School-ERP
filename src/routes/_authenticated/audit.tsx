import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search, ShieldCheck, User as UserIcon, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { auditLog } from "@/mock/audit-log";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/audit")({
  component: AuditPage,
});

// Map action prefix to a tone + readable label
const ACTION_META: Record<string, { label: string; urdu: string; tone: string }> = {
  student:    { label: "Student",    urdu: "طالبعلم",    tone: "bg-[oklch(0.92_0.07_200)] text-[oklch(0.32_0.14_200)] dark:bg-[oklch(0.32_0.08_200)] dark:text-[oklch(0.88_0.07_200)] border-[oklch(0.80_0.12_200)]" },
  fee:        { label: "Finance",    urdu: "مالیات",     tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-300/50" },
  exam:       { label: "Exam",       urdu: "امتحان",     tone: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border-purple-300/50" },
  attendance: { label: "Attendance", urdu: "حاضری",      tone: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-300/50" },
  user:       { label: "User",       urdu: "صارف",       tone: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-300/50" },
  hifz:       { label: "Hifz",       urdu: "حفظ",        tone: "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 border-teal-300/50" },
  concession: { label: "Concession", urdu: "رعایت",     tone: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300 border-pink-300/50" },
  inventory:  { label: "Inventory",  urdu: "انوینٹری",  tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border-indigo-300/50" },
  salary:     { label: "Salary",     urdu: "تنخواہ",     tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-300/50" },
  promotion:  { label: "Promotion",  urdu: "ترقی",       tone: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300 border-cyan-300/50" },
  website:    { label: "Website",    urdu: "ویب سائٹ",  tone: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-300 border-fuchsia-300/50" },
  holiday:    { label: "Holiday",    urdu: "چھٹی",       tone: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-rose-300/50" },
  exit:       { label: "Exit",       urdu: "اخراج",      tone: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300 border-orange-300/50" },
  auth:       { label: "Auth",       urdu: "لاگ ان",     tone: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-300/50" },
};

function meta(action: string) {
  const prefix = action.split(".")[0];
  return ACTION_META[prefix] ?? { label: prefix, urdu: prefix, tone: "bg-muted text-muted-foreground border-border" };
}

function AuditPage() {
  const [q, setQ] = useState("");
  const [actor, setActor] = useState<string>("all");
  const [actionType, setActionType] = useState<string>("all");
  const [days, setDays] = useState<string>("30");

  const actors = useMemo(() => Array.from(new Set(auditLog.map((a) => a.userName))), []);
  const actionTypes = useMemo(() => Array.from(new Set(auditLog.map((a) => a.action.split(".")[0]))), []);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - parseInt(days, 10) * 86400000;
    return auditLog
      .filter((a) => new Date(a.at).getTime() >= cutoff)
      .filter((a) => actor === "all" || a.userName === actor)
      .filter((a) => actionType === "all" || a.action.startsWith(actionType))
      .filter((a) => !q || `${a.action} ${a.userName} ${a.entity} ${a.entityId} ${a.details ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [q, actor, actionType, days]);

  function exportCsv() {
    const rows = [
      ["timestamp", "actor", "action", "entity", "entityId", "details"],
      ...filtered.map((a) => [a.at, a.userName, a.action, a.entity, a.entityId, a.details ?? ""]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} entries`);
  }

  return (
    <div>
      <PageHeader
        title="Audit Log"
        titleUrdu="آڈٹ لاگ"
        description="Every significant action — admissions, fees, exams, settings — is recorded here for accountability and Wifaq / government compliance."
        actions={<Button size="sm" className="gap-1.5" onClick={exportCsv}><Download className="h-3.5 w-3.5" />Export CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total entries" urdu="کل اندراجات" value={filtered.length} icon={ShieldCheck} />
        <Stat label="Active users" urdu="فعال صارفین" value={new Set(filtered.map((a) => a.userId)).size} icon={UserIcon} />
        <Stat label="Action types" urdu="اعمال کی اقسام" value={new Set(filtered.map((a) => a.action.split(".")[0])).size} icon={ShieldCheck} />
        <Stat label="Period (days)" urdu="مدت" value={days} icon={Calendar} />
      </div>

      <Card className="p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_140px] gap-2">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, actor, entity…" className="pe-9" />
          </div>
          <Select value={actor} onValueChange={setActor}>
            <SelectTrigger><SelectValue placeholder="Actor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actors</SelectItem>
              {actors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger><SelectValue placeholder="Action type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actionTypes.map((t) => <SelectItem key={t} value={t}>{ACTION_META[t]?.label ?? t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="3650">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="hidden md:table-cell">Details</TableHead>
              <TableHead className="text-end">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12"><EmptyState icon={ShieldCheck} heading="No audit entries" headingUrdu="کوئی اندراج نہیں" /></TableCell></TableRow>
            ) : filtered.map((a, i) => {
              const m = meta(a.action);
              return (
                <TableRow key={a.id} className="align-top">
                  <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px] capitalize", m.tone)}>{m.label}</Badge>
                      <span className="font-mono text-xs">{a.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{a.userName}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{a.userId}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{a.entity}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{a.entityId}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[280px] truncate" title={a.details}>{a.details}</TableCell>
                  <TableCell className="text-end font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(a.at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Stat({ label, urdu, value, icon: Icon }: { label: string; urdu: string; value: number | string; icon: React.ElementType }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-urdu text-xs text-muted-foreground" dir="rtl">{urdu}</p>
          <p className="font-heading text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    </Card>
  );
}