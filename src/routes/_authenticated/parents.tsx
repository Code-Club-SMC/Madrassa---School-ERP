import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HeartHandshake, Users2, Bell, Wallet, ClipboardList, GraduationCap, MessageSquareText, Send, Download, Check, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { students } from "@/mock/students";
import { feeRecords } from "@/mock";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/parents")({
  component: ParentsPortal,
});

function ParentsPortal() {
  const [tab, setTab] = useState<"dashboard" | "fees" | "attendance" | "results">("dashboard");
  // Simulated logged-in parent: Iqbal Hussain — children S1000 + S1003
  const myChildren = students.filter((s) => ["S1000", "S1003"].includes(s.id));
  const myFees = feeRecords.filter((f) => myChildren.some((c) => c.id === f.studentId));
  const [activeChildId, setActiveChildId] = useState<string>(myChildren[0]?.id ?? "");
  const [messages, setMessages] = useState<{ id: string; from: "parent" | "teacher"; text: string; at: string }[]>([
    { id: "m1", from: "teacher", text: "Assalam-u-Alaikum — Ahmad's sabaq this week was strong. Mashallah.", at: "10:32 AM" },
    { id: "m2", from: "parent", text: "JazakAllah ustaad. Will he need extra revision for Juz 7?", at: "10:48 AM" },
    { id: "m3", from: "teacher", text: "Yes, please review Surah Anfal again at home. We'll test on Thursday.", at: "11:02 AM" },
  ]);
  const [draft, setDraft] = useState("");
  const activeChild = myChildren.find((c) => c.id === activeChildId) ?? myChildren[0];

  const childFees = useMemo(() => myFees.filter((f) => f.studentId === activeChildId), [myFees, activeChildId]);
  const unpaidTotal = useMemo(() => childFees.filter((f) => f.status !== "paid").reduce((sum, f) => sum + (f.monthlyFee - 0), 0), [childFees]);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { id: `m${Date.now()}`, from: "parent", text: draft, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setDraft("");
    toast.success("Message sent to teacher");
  };

  return (
    <div>
      <PageHeader
        title="Parents Portal"
        titleUrdu="والدین پورٹل"
        description="View your children's attendance, fees, results and notices in one place."
        actions={<Button size="sm" variant="outline" className="gap-1.5"><Bell className="h-3.5 w-3.5" />3 Notices</Button>}
      />

      <Card className="p-5 mb-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4 mb-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"><HeartHandshake className="h-7 w-7" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Welcome, Wali · خوش آمدید</p>
            <p className="font-urdu text-xl font-bold">اقبال حسین</p>
            <p className="text-xs text-muted-foreground mt-0.5">Guardian to {myChildren.length} student{myChildren.length === 1 ? "" : "s"}</p>
          </div>
          {unpaidTotal > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
              <p className="font-semibold">{formatPKR(unpaidTotal)} pending</p>
              <p className="text-[10px]">for {activeChild?.name}</p>
            </div>
          )}
        </div>
        {/* Child switcher */}
        <div className="flex gap-2 flex-wrap">
          {myChildren.map((c) => {
            const active = c.id === activeChildId;
            return (
              <button key={c.id} onClick={() => setActiveChildId(c.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${active ? "border-primary bg-primary text-primary-foreground shadow" : "border-border bg-background hover:border-primary/40"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${active ? "bg-primary-foreground text-primary" : "bg-primary/10 text-primary"}`}>{c.name.split(" ")[0][0]}</div>
                <div className="text-start">
                  <p className={`font-urdu text-sm leading-tight ${active ? "" : ""}`}>{c.nameUrdu}</p>
                  <p className={`text-[10px] ${active ? "opacity-80" : "text-muted-foreground"}`}>Roll {c.rollNo} · {c.system}</p>
                </div>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
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
            {activeChild && (
              <Card key={activeChild.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-heading font-bold flex items-center justify-center">{activeChild.name.split(" ")[0][0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-urdu text-base font-semibold leading-tight">{activeChild.nameUrdu}</p>
                    <p className="text-xs text-muted-foreground">Roll {activeChild.rollNo}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">{activeChild.system}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Link to="/students/$id" params={{ id: activeChild.id }} className="flex-1"><Button size="sm" variant="outline" className="w-full">Profile</Button></Link>
                  <Button size="sm" className="flex-1 gap-1.5"><Wallet className="h-3.5 w-3.5" />Pay</Button>
                </div>
              </Card>
            )}
            {/* Message thread with teacher */}
            <Card className="p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <MessageSquareText className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-semibold text-sm">Message Ustaad · استاد سے رابطہ</h3>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px] mb-3 pr-1">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === "parent" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${m.from === "parent" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p>{m.text}</p>
                      <p className={`text-[10px] mt-1 ${m.from === "parent" ? "opacity-70" : "text-muted-foreground"}`}>{m.at}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" className="h-9 text-sm" />
                <Button size="icon" className="h-9 w-9" onClick={send}><Send className="h-4 w-4" /></Button>
              </div>
            </Card>
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
          <Card className="p-4 mt-3 mb-3 bg-muted/40">
            <p className="text-xs text-muted-foreground">Showing fee history for · <span className="font-urdu text-sm font-semibold text-foreground">{activeChild?.nameUrdu}</span> ({activeChild?.rollNo})</p>
          </Card>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Student</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-end">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {childFees.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No fee records yet for this child.</TableCell></TableRow>
                )}
                {childFees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell><p className="font-urdu text-sm">{activeChild?.nameUrdu}</p><p className="text-xs text-muted-foreground">{activeChild?.rollNo}</p></TableCell>
                    <TableCell className="font-mono text-xs">{f.month}</TableCell>
                    <TableCell className="font-mono">{formatPKR(f.monthlyFee)}</TableCell>
                    <TableCell><Badge variant={f.status === "paid" ? "default" : f.status === "overdue" ? "destructive" : "secondary"}>{f.status}</Badge></TableCell>
                    <TableCell className="text-end">
                      {f.status !== "paid" ? <Button size="sm" className="gap-1.5"><Wallet className="h-3.5 w-3.5" />Pay Now</Button>
                        : <Button size="sm" variant="ghost" className="gap-1.5"><Download className="h-3.5 w-3.5" />Receipt</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          {activeChild && (
            <div className="mt-3">
              <Card className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <p className="font-urdu text-lg font-semibold leading-tight">{activeChild.nameUrdu}</p>
                    <p className="text-xs text-muted-foreground">{activeChild.name} · Roll {activeChild.rollNo}</p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" />Present</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/40" />Late</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/30 border border-destructive/40" />Absent</span>
                  </div>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`aspect-square rounded-md text-[10px] flex items-center justify-center font-mono ${i % 13 === 0 ? "bg-destructive/20 text-destructive" : i % 7 === 0 ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"}`}>{i + 1}</div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border">
                  <div><p className="text-[10px] text-muted-foreground flex items-center gap-1"><CalendarCheck className="h-3 w-3" />Present</p><p className="font-heading text-xl font-bold text-chart-1">25</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Late</p><p className="font-heading text-xl font-bold text-amber-600 dark:text-amber-400">3</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Absent</p><p className="font-heading text-xl font-bold text-destructive">2</p></div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5"><ClipboardList className="h-3 w-3" />83% present this month · ماہانہ حاضری 83٪</p>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {activeChild && (
            <div className="mt-3">
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-urdu text-lg font-semibold leading-tight">{activeChild.nameUrdu}</p>
                    <p className="text-xs text-muted-foreground">{activeChild.name}</p>
                  </div>
                  <Badge variant="outline" className="gap-1"><GraduationCap className="h-3 w-3" />Mid-term</Badge>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-end">Marks</TableHead><TableHead className="text-end">Grade</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {[["Quran · قرآن", 85, "A"], ["Urdu · اردو", 78, "B"], ["Math · ریاضی", 72, "B"], ["English", 80, "A"], ["Islamiat · اسلامیات", 88, "A1"]].map(([s, m, g]) => (
                      <TableRow key={s as string}>
                        <TableCell className="text-sm">{s}</TableCell>
                        <TableCell className="text-end font-mono text-sm">{m}/100</TableCell>
                        <TableCell className="text-end"><Badge variant="secondary" className="font-mono text-[10px]">{g}</Badge></TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell className="text-sm font-bold">Total · کل</TableCell>
                      <TableCell className="text-end font-mono text-sm font-bold text-primary">403/500 (80.6%)</TableCell>
                      <TableCell className="text-end"><Badge className="bg-chart-1/15 text-chart-1 border-0 text-[10px]">Grade A</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5"><Download className="h-3.5 w-3.5" />Download DMC</Button>
                  <Button size="sm" className="flex-1 gap-1.5">View All Exams</Button>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { Users2 };