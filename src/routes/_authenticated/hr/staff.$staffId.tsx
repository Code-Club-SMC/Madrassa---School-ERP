import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useHR } from "@/stores/hr-store";

export const Route = createFileRoute("/_authenticated/hr/staff/$staffId")({
  component: StaffProfile,
});

function StaffProfile() {
  const { staffId } = useParams({ from: "/_authenticated/hr/staff/$staffId" });
  const { staff, payrollProfiles, payslips, attendance, leaves, loans } = useHR();
  const s = staff.find((x) => x.id === staffId);

  if (!s) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold">Staff member not found</p>
        <p className="text-sm text-muted-foreground mt-1">ID: {staffId}</p>
        <Button asChild className="mt-4"><Link to="/hr/staff">Back to staff list</Link></Button>
      </div>
    );
  }

  const profile = payrollProfiles.find((p) => p.staffId === s.id);
  const mySlips = payslips.filter((p) => p.staffId === s.id);
  const myLeaves = leaves.filter((l) => l.staffId === s.id);
  const myLoans = loans.filter((l) => l.staffId === s.id);
  const att = attendance.filter((a) => a.staffId === s.id);
  const counts = att.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {});

  const initials = s.fullName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const allowances = profile ? profile.hra + profile.transportAllowance + profile.medicalAllowance : 0;
  const gross = profile ? profile.basicSalary + allowances : 0;
  const deductions = profile ? profile.eobi + profile.incomeTax : 0;
  const net = gross - deductions;

  return (
    <div>
      <Link to="/hr/staff" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />All staff</Link>
      <PageHeader title={s.fullName} titleUrdu={s.designation} description={`${s.staffType} · ${s.department} · ${s.id}`} />

      <Card className="p-5 mb-4 flex items-center gap-4">
        <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback></Avatar>
        <div className="flex-1">
          <p className="font-heading text-xl font-bold">{s.fullName}</p>
          <p className="text-sm text-muted-foreground">{s.designation} · {s.department}</p>
          <div className="mt-1 flex gap-2 flex-wrap">
            <Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize">{s.status.replace("_", " ")}</Badge>
            <Badge variant="outline" className="capitalize">{s.employmentType}</Badge>
            <Badge variant="outline" className="capitalize">{s.module}</Badge>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="p-4"><h3 className="font-semibold mb-2 text-sm">Personal</h3>
            <Row k="CNIC" v={s.cnic} /><Row k="DOB" v={s.dob} /><Row k="Gender" v={s.gender} /><Row k="Phone" v={s.phone} /><Row k="Emergency" v={s.emergencyContact} /><Row k="Address" v={s.address} />
          </Card>
          <Card className="p-4"><h3 className="font-semibold mb-2 text-sm">Employment</h3>
            <Row k="Type" v={s.staffType} /><Row k="Department" v={s.department} /><Row k="Designation" v={s.designation} /><Row k="Employment" v={s.employmentType} /><Row k="Join Date" v={s.joinDate} /><Row k="Module" v={s.module} />
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          {profile ? (
            <Card className="p-5 grid sm:grid-cols-3 gap-3">
              <Stat label="Basic" value={profile.basicSalary} /><Stat label="Allowances" value={allowances} /><Stat label="Deductions" value={deductions} negative /><Stat label="Gross" value={gross} /><Stat label="Net" value={net} highlight />
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Bank</p><p className="text-sm font-medium mt-1">{profile.bankName} · {profile.accountNumber}</p></div>
            </Card>
          ) : <Card className="p-5 text-sm text-muted-foreground">No payroll profile.</Card>}
        </TabsContent>

        <TabsContent value="payslips" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Period</TableHead><TableHead className="text-end">Gross</TableHead><TableHead className="text-end">Deductions</TableHead><TableHead className="text-end">Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {mySlips.map((p) => <TableRow key={p.id}><TableCell>{p.month}/{p.year}</TableCell><TableCell className="text-end font-mono">{p.grossSalary.toLocaleString()}</TableCell><TableCell className="text-end font-mono">{p.totalDeductions.toLocaleString()}</TableCell><TableCell className="text-end font-mono font-semibold">{p.netSalary.toLocaleString()}</TableCell><TableCell><Badge variant={p.status === "paid" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></TableCell></TableRow>)}
                {mySlips.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm py-6 text-muted-foreground">No payslips.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {["present","absent","late","leave","half_day"].map((k) => <Card key={k} className="p-3"><p className="text-xs text-muted-foreground capitalize">{k.replace("_"," ")}</p><p className="font-heading text-xl font-bold">{counts[k] ?? 0}</p></Card>)}
          </div>
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <Card className="p-4">
            {myLoans.length === 0 ? <p className="text-sm text-muted-foreground">No loans.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead className="text-end">Amount</TableHead><TableHead className="text-end">Instalment</TableHead><TableHead className="text-end">Remaining</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{myLoans.map((l) => <TableRow key={l.id}><TableCell className="font-mono text-xs">{l.id}</TableCell><TableCell className="text-end font-mono">{l.amount.toLocaleString()}</TableCell><TableCell className="text-end font-mono">{l.monthlyInstalment.toLocaleString()}</TableCell><TableCell className="text-end font-mono">{l.remainingBalance.toLocaleString()}</TableCell><TableCell><Badge variant={l.status === "active" ? "default" : "secondary"}>{l.status}</Badge></TableCell></TableRow>)}</TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <Card className="p-4">
            {myLeaves.length === 0 ? <p className="text-sm text-muted-foreground">No leave history.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{myLeaves.map((l) => <TableRow key={l.id}><TableCell className="capitalize">{l.leaveType}</TableCell><TableCell>{l.fromDate}</TableCell><TableCell>{l.toDate}</TableCell><TableCell>{l.days}</TableCell><TableCell><Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge></TableCell></TableRow>)}</TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card className="p-5 text-sm text-muted-foreground">Documents (CNIC, Degree, Contract) — upload coming soon.</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between py-1 border-b border-border/40 last:border-0 text-sm"><span className="text-muted-foreground">{k}</span><span className="font-medium capitalize">{v}</span></div>;
}

function Stat({ label, value, negative, highlight }: { label: string; value: number; negative?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "bg-primary/5 border-primary/40" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-heading font-bold mt-1 ${highlight ? "text-xl text-primary" : "text-base"} ${negative ? "text-destructive" : ""}`}>PKR {value.toLocaleString()}</p>
    </div>
  );
}