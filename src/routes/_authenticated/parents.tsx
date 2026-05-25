import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HeartHandshake, Users2, Bell, Wallet, ClipboardList, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { students } from "@/mock/students";
import { feeRecords } from "@/mock";
import { formatPKR, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/parents")({
  component: ParentsPortal,
});

function ParentsPortal() {
  const [tab, setTab] = useState<"dashboard" | "fees" | "attendance" | "results">("dashboard");
  // Simulated logged-in parent: Iqbal Hussain — children S1000 + S1003
  const myChildren = students.filter((s) => ["S1000", "S1003"].includes(s.id));
  const myFees = feeRecords.filter((f) => myChildren.some((c) => c.id === f.studentId));

  return (
    <div>
      <PageHeader
        title="Parents Portal"
        titleUrdu="والدین پورٹل"
        description="View your children's attendance, fees, results and notices in one place."
        actions={<Button size="sm" variant="outline" className="gap-1.5"><Bell className="h-3.5 w-3.5" />3 Notices</Button>}
      />

      <Card className="p-5 mb-4 flex items-center gap-4 bg-primary/5 border-primary/20">
        <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"><HeartHandshake className="h-7 w-7" /></div>
        <div>
          <p className="text-xs text-muted-foreground">Welcome, Wali · خوش آمدید</p>
          <p className="font-urdu text-xl font-bold">اقبال حسین</p>
          <p className="text-xs text-muted-foreground mt-0.5">Guardian to {myChildren.length} student{myChildren.length === 1 ? "" : "s"}</p>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="fees">Fees · فیس</TabsTrigger>
          <TabsTrigger value="attendance">Attendance · حاضری</TabsTrigger>
          <TabsTrigger value="results">Results · نتائج</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            {myChildren.map((c) => (
              <Card key={c.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-heading font-bold flex items-center justify-center">{c.name.split(" ")[0][0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-urdu text-base font-semibold leading-tight">{c.nameUrdu}</p>
                    <p className="text-xs text-muted-foreground">Roll {c.rollNo}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">{c.system}</Badge>
                  </div>
                </div>
                {c.hifzJuzCompleted !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Hifz · حفظ</span><span className="font-mono">{c.hifzJuzCompleted}/30</span></div>
                    <Progress value={(c.hifzJuzCompleted / 30) * 100} />
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Link to="/students/$id" params={{ id: c.id }} className="flex-1"><Button size="sm" variant="outline" className="w-full">Profile</Button></Link>
                  <Button size="sm" className="flex-1 gap-1.5"><Wallet className="h-3.5 w-3.5" />Pay</Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 mt-4">
            <div className="flex items-center gap-2 mb-3"><Bell className="h-4 w-4 text-primary" /><h3 className="font-heading font-semibold text-sm">Latest Notices · اعلانات</h3></div>
            <div className="space-y-2 text-sm">
              {[
                { en: "Parent-teacher meeting on Friday, 2 PM", ur: "والدین و اساتذہ کی میٹنگ — جمعہ، دوپہر ۲ بجے" },
                { en: "Mid-term exam date sheet posted", ur: "ششماہی امتحان کی تاریخیں جاری کر دی گئی ہیں" },
                { en: "Eid holidays: 7 days starting Ramadan 29", ur: "عید کی تعطیلات — ۲۹ رمضان سے ۷ دن" },
              ].map((n, i) => (
                <div key={i} className="p-3 rounded-lg border border-border text-xs">
                  <p>{n.en}</p>
                  <p className="font-urdu text-sm mt-0.5">{n.ur}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card className="overflow-hidden mt-3">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Student</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-end">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {myFees.map((f) => {
                  const child = myChildren.find((c) => c.id === f.studentId)!;
                  return (
                    <TableRow key={f.id}>
                      <TableCell><p className="font-urdu text-sm">{child.nameUrdu}</p><p className="text-xs text-muted-foreground">{child.rollNo}</p></TableCell>
                      <TableCell className="font-mono text-xs">{f.month}</TableCell>
                      <TableCell className="font-mono">{formatPKR(f.monthlyFee)}</TableCell>
                      <TableCell><Badge variant={f.status === "paid" ? "default" : f.status === "overdue" ? "destructive" : "secondary"}>{f.status}</Badge></TableCell>
                      <TableCell className="text-end">{f.status !== "paid" && <Button size="sm" className="gap-1.5"><Wallet className="h-3.5 w-3.5" />Pay Now</Button>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            {myChildren.map((c) => (
              <Card key={c.id} className="p-4">
                <p className="font-urdu text-base font-semibold mb-3">{c.nameUrdu}</p>
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`aspect-square rounded-md text-[10px] flex items-center justify-center font-mono ${i % 13 === 0 ? "bg-destructive/20 text-destructive" : i % 7 === 0 ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"}`}>{i + 1}</div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5"><ClipboardList className="h-3 w-3" />{Math.round((1 - 1 / 13) * 100)}% present this month</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results">
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            {myChildren.map((c) => (
              <Card key={c.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-urdu text-base font-semibold">{c.nameUrdu}</p>
                  <Badge variant="outline" className="gap-1"><GraduationCap className="h-3 w-3" />Mid-term</Badge>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-end">Marks</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {[["Quran/قرآن", 85], ["Urdu/اردو", 78], ["Math/ریاضی", 72], ["English", 80]].map(([s, m]) => (
                      <TableRow key={s as string}><TableCell className="text-sm">{s}</TableCell><TableCell className="text-end font-mono text-sm">{m}/100</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button size="sm" variant="outline" className="w-full">Download DMC</Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { Users2 };