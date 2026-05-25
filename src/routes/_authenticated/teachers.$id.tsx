import { createFileRoute, Link, useParams, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Phone, MapPin, CalendarCheck, Printer, Wallet, IdCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { teachersById, salarySlips } from "@/mock/teachers";
import { formatPKR, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/teachers/$id")({
  component: TeacherProfile,
});

const designationUrdu: Record<string, string> = {
  qari: "قاری", hafiz: "حافظ", mudarris: "مدرس", ustaad: "استاد",
  principal: "پرنسپل", subject_teacher: "مضمون استاد", sports: "کھیل", assistant: "معاون",
};

function TeacherProfile() {
  const { id } = useParams({ from: "/_authenticated/teachers/$id" });
  const t = teachersById[id];
  if (!t) throw notFound();
  const slips = salarySlips.filter((s) => s.teacherId === id);
  const [tab, setTab] = useState<"personal" | "attendance" | "salary">("personal");

  const initials = t.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const attendance = Array.from({ length: 20 }).map((_, i) => ({
    date: new Date(2026, 4, 25 - i).toISOString(),
    status: i % 11 === 0 ? "leave" : i % 7 === 0 ? "late" : "present",
  }));

  return (
    <div>
      <Link to="/teachers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />All teachers</Link>
      <PageHeader
        title={t.name}
        titleUrdu={t.nameUrdu}
        description={`${t.designation.replace("_", " ")} · ${t.qualification}`}
        actions={
          <div className="flex gap-2">
            <Link to="/id-cards"><Button variant="outline" size="sm" className="gap-1.5"><IdCard className="h-3.5 w-3.5" />ID Card</Button></Link>
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Print Profile</Button>
          </div>
        }
      />

      <Card className="p-5 mb-4 flex items-start gap-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary font-heading font-bold flex items-center justify-center text-2xl">{initials}</div>
        <div className="flex-1">
          <p className="font-urdu text-2xl font-bold leading-tight">{t.nameUrdu}</p>
          <p className="text-sm text-muted-foreground">{t.name}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary"><span className="font-urdu me-1">{designationUrdu[t.designation]}</span>· {t.designation.replace("_", " ")}</Badge>
            <Badge variant="outline" className="font-urdu">{t.system === "madrassa" ? "مدرسہ" : "اسکول"}</Badge>
            <Badge variant={t.active ? "default" : "destructive"}>{t.active ? "Active" : "Inactive"}</Badge>
          </div>
        </div>
        <div className="text-end text-xs space-y-1">
          <p className="flex items-center justify-end gap-1.5"><Phone className="h-3 w-3" /><span className="font-mono">{t.phone}</span></p>
          <p className="flex items-center justify-end gap-1.5"><MapPin className="h-3 w-3" />{t.address}</p>
          <p className="font-mono">CNIC: {t.cnic}</p>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="personal">Personal · ذاتی</TabsTrigger>
          <TabsTrigger value="attendance">Attendance · حاضری</TabsTrigger>
          <TabsTrigger value="salary">Salary · تنخواہ</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="p-5 mt-3 grid sm:grid-cols-2 gap-4 text-sm">
            <Info label="Qualification" labelUrdu="قابلیت" value={t.qualification} valueUrdu={t.qualificationUrdu} />
            <Info label="Joined" labelUrdu="تاریخ تقرر" value={formatDate(t.joinedAt)} />
            <Info label="Subjects" labelUrdu="مضامین" value={t.subjects.length === 0 ? "—" : t.subjects.map((s) => s.replace("sub-", "")).join(", ")} />
            <Info label="Bank" labelUrdu="بینک" value={t.bankName ?? "—"} />
            <Info label="Account" labelUrdu="کھاتہ" value={t.bankAccount ?? "—"} mono />
            <Info label="Monthly Salary" labelUrdu="ماہانہ تنخواہ" value={formatPKR(t.monthlySalaryPaisa / 100)} mono />
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold">Last 20 days</h3>
              <Button size="sm" variant="outline" className="gap-1.5"><CalendarCheck className="h-3.5 w-3.5" />Mark today</Button>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {attendance.map((a, i) => (
                <div key={i} className={`aspect-square rounded-md text-[10px] flex items-center justify-center font-mono ${a.status === "present" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : a.status === "late" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-blue-500/20 text-blue-700 dark:text-blue-300"}`}>{new Date(a.date).getDate()}</div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card className="overflow-hidden mt-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Month</TableHead><TableHead>Base</TableHead><TableHead>Allow.</TableHead><TableHead>Deduct.</TableHead><TableHead>Net</TableHead><TableHead>Paid On</TableHead><TableHead className="text-end">Payslip</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {slips.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.month}</TableCell>
                    <TableCell className="font-mono text-xs">{formatPKR(s.baseSalaryPaisa / 100)}</TableCell>
                    <TableCell className="font-mono text-xs text-emerald-700 dark:text-emerald-300">+{formatPKR(s.allowancesPaisa / 100)}</TableCell>
                    <TableCell className="font-mono text-xs text-destructive">-{formatPKR(s.deductionsPaisa / 100)}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold">{formatPKR(s.netPaisa / 100)}</TableCell>
                    <TableCell className="text-xs">{s.paidOn ? formatDate(s.paidOn) : <Badge variant="outline">Pending</Badge>}</TableCell>
                    <TableCell className="text-end">
                      <Dialog>
                        <DialogTrigger asChild><Button size="sm" variant="ghost" className="gap-1.5"><Wallet className="h-3.5 w-3.5" />View</Button></DialogTrigger>
                        <DialogContent className="print-target">
                          <DialogHeader><DialogTitle>Salary Slip · سیلری سلپ</DialogTitle></DialogHeader>
                          <div className="border-2 border-foreground p-4 text-sm">
                            <div className="text-center mb-3">
                              <p className="font-urdu text-lg font-bold">تنخواہ کی پرچی</p>
                              <p className="font-mono text-xs">Month: {s.month}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>Name:</div><div className="font-medium">{t.name}</div>
                              <div>Urdu:</div><div className="font-urdu">{t.nameUrdu}</div>
                              <div>Designation:</div><div>{t.designation}</div>
                              <div>CNIC:</div><div className="font-mono">{t.cnic}</div>
                            </div>
                            <div className="border-t border-foreground mt-3 pt-3 space-y-1 text-xs font-mono">
                              <Row k="Base Salary" v={formatPKR(s.baseSalaryPaisa / 100)} />
                              <Row k="Allowances" v={`+ ${formatPKR(s.allowancesPaisa / 100)}`} />
                              <Row k="Deductions" v={`- ${formatPKR(s.deductionsPaisa / 100)}`} />
                              <div className="border-t border-foreground pt-1 font-bold flex justify-between"><span>Net Payable</span><span>{formatPKR(s.netPaisa / 100)}</span></div>
                            </div>
                            <p className="text-[10px] text-center mt-4">Paid via {s.paymentMethod} · {s.paidOn ? formatDate(s.paidOn) : "Pending"}</p>
                          </div>
                          <Button size="sm" onClick={() => window.print()} className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, labelUrdu, value, valueUrdu, mono }: { label: string; labelUrdu: string; value: string; valueUrdu?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label} · <span className="font-urdu">{labelUrdu}</span></p>
      <p className={`text-sm mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
      {valueUrdu && <p className="font-urdu text-sm text-muted-foreground">{valueUrdu}</p>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span>{k}</span><span>{v}</span></div>;
}