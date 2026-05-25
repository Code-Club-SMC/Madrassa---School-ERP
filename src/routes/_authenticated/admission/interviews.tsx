import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, FileCheck2, ListChecks, Clock, MapPin, ChevronLeft, ArrowUpRight, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { applications } from "@/mock";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admission/interviews")({
  component: InterviewsPage,
});

type Slot = { id: string; appId: string; date: string; time: string; interviewer: string; room: string; status: "scheduled" | "completed" | "no_show" };

type Doc = { key: string; en: string; ur: string; required: boolean };
const CHECKLIST: Doc[] = [
  { key: "bform", en: "B-Form / Birth Certificate", ur: "ب فارم / پیدائش سرٹیفکیٹ", required: true },
  { key: "cnic", en: "Guardian CNIC Copy", ur: "والد/والدہ کا شناختی کارڈ", required: true },
  { key: "photos", en: "2 Passport Photos", ur: "2 پاسپورٹ سائز تصاویر", required: true },
  { key: "prev_result", en: "Previous Result Card", ur: "پچھلا نتیجہ", required: false },
  { key: "tc", en: "Transfer Certificate (if any)", ur: "ٹرانسفر سرٹیفکیٹ", required: false },
  { key: "medical", en: "Medical Fitness Form", ur: "میڈیکل فٹنس فارم", required: false },
  { key: "address", en: "Address Proof (Bill copy)", ur: "پتہ تصدیق (بل کاپی)", required: true },
];

const INTERVIEWERS = ["Maulana Imran Hussain", "Mufti Tariq Saeed", "Mrs. Saira Tariq", "Principal — Hafiz Bilal"];
const ROOMS = ["Conference Room A", "Principal's Office", "Library Room 2"];

function InterviewsPage() {
  const accepted = applications.filter((a) => a.status === "accepted");
  const pending = applications.filter((a) => a.status === "pending");

  const [slots, setSlots] = useState<Slot[]>(() => pending.slice(0, 3).map((a, i) => ({
    id: `s${i}`, appId: a.id, date: new Date(Date.now() + (i + 1) * 86400e3).toISOString().slice(0, 10),
    time: ["10:00", "11:30", "14:00"][i], interviewer: INTERVIEWERS[i % INTERVIEWERS.length], room: ROOMS[i % ROOMS.length], status: "scheduled" as const,
  })));
  const [activeDoc, setActiveDoc] = useState<string>(pending[0]?.id ?? "");
  const [docState, setDocState] = useState<Record<string, Record<string, boolean>>>({});
  const [waitlist, setWaitlist] = useState<{ appId: string; rank: number; reason: string }[]>(
    pending.slice(3, 7).map((a, i) => ({ appId: a.id, rank: i + 1, reason: i === 0 ? "Awaiting seat in Daraja Awwal" : "Pending document verification" })),
  );

  const docsForActive = docState[activeDoc] ?? {};
  const verified = CHECKLIST.filter((d) => d.required).every((d) => docsForActive[d.key]);

  const promote = (appId: string) => {
    setWaitlist((w) => w.filter((x) => x.appId !== appId));
    toast.success("Promoted to active intake — roll number assigned", { description: "ویٹ لسٹ سے فعال داخلوں میں منتقل" });
  };

  return (
    <div>
      <Link to="/admission" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />Admission Hub
      </Link>
      <PageHeader
        title="Interviews, Documents & Waitlist"
        titleUrdu="انٹرویو، دستاویزات اور انتظار"
        description="Schedule interviews, verify required documents, and manage the waitlist for capped classes."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat icon={CalendarClock} en="Scheduled" ur="مقررہ" v={slots.filter((s) => s.status === "scheduled").length} />
        <Stat icon={FileCheck2} en="Pending Docs" ur="دستاویزات کمی" v={pending.length} />
        <Stat icon={ListChecks} en="On Waitlist" ur="انتظار میں" v={waitlist.length} tone="text-amber-600 dark:text-amber-400" />
        <Stat icon={User} en="Accepted YTD" ur="منظور شدہ" v={accepted.length} tone="text-chart-1" />
      </div>

      <Tabs defaultValue="interviews">
        <TabsList>
          <TabsTrigger value="interviews"><CalendarClock className="h-3.5 w-3.5 me-1.5" />Schedule</TabsTrigger>
          <TabsTrigger value="docs"><FileCheck2 className="h-3.5 w-3.5 me-1.5" />Document Verification</TabsTrigger>
          <TabsTrigger value="waitlist"><ListChecks className="h-3.5 w-3.5 me-1.5" />Waitlist</TabsTrigger>
        </TabsList>

        {/* SCHEDULE */}
        <TabsContent value="interviews">
          <Card className="overflow-hidden mt-3">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <p className="text-sm font-semibold">Upcoming Interviews</p>
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={() => { const a = pending.find((x) => !slots.some((s) => s.appId === x.id)); if (!a) return toast.info("All pending applicants are scheduled"); setSlots((s) => [...s, { id: `s${Date.now()}`, appId: a.id, date: new Date(Date.now() + 5 * 86400e3).toISOString().slice(0, 10), time: "10:00", interviewer: INTERVIEWERS[0], room: ROOMS[0], status: "scheduled" }]); toast.success("Slot created"); }}>
                <CalendarClock className="h-3.5 w-3.5" />New Slot
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Applicant</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Interviewer</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((s) => {
                  const a = applications.find((x) => x.id === s.appId);
                  if (!a) return null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell><p className="font-urdu text-sm font-semibold leading-tight">{a.nameUrdu}</p><p className="text-[11px] text-muted-foreground">{a.refNo} · {a.system}</p></TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Input type="date" value={s.date} onChange={(e) => setSlots((p) => p.map((x) => x.id === s.id ? { ...x, date: e.target.value } : x))} className="h-8 w-[140px] text-xs" />
                          <Input type="time" value={s.time} onChange={(e) => setSlots((p) => p.map((x) => x.id === s.id ? { ...x, time: e.target.value } : x))} className="h-8 w-[100px] text-xs" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={s.interviewer} onValueChange={(v) => setSlots((p) => p.map((x) => x.id === s.id ? { ...x, interviewer: v } : x))}>
                          <SelectTrigger className="h-8 text-xs w-[180px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{INTERVIEWERS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={s.room} onValueChange={(v) => setSlots((p) => p.map((x) => x.id === s.id ? { ...x, room: v } : x))}>
                          <SelectTrigger className="h-8 text-xs w-[170px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{ROOMS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {s.status === "scheduled" && <Badge className="bg-primary/15 text-primary border-0">Scheduled</Badge>}
                        {s.status === "completed" && <Badge className="bg-chart-1/15 text-chart-1 border-0">Completed</Badge>}
                        {s.status === "no_show" && <Badge variant="destructive">No-show</Badge>}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => { setSlots((p) => p.map((x) => x.id === s.id ? { ...x, status: "completed" } : x)); toast.success("Marked completed"); }}>Done</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => { toast.success("SMS reminder sent to " + a.phone); }}><Phone className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* DOCS */}
        <TabsContent value="docs">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 mt-3">
            <Card className="p-2 space-y-1 h-fit">
              {pending.slice(0, 6).map((a) => (
                <button key={a.id} onClick={() => setActiveDoc(a.id)} className={`w-full text-start p-3 rounded-lg transition-colors ${activeDoc === a.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}>
                  <p className="font-urdu text-sm font-semibold leading-tight">{a.nameUrdu}</p>
                  <p className="text-[11px] text-muted-foreground">{a.refNo}</p>
                </button>
              ))}
            </Card>
            <Card className="p-5">
              {(() => {
                const a = applications.find((x) => x.id === activeDoc);
                if (!a) return <p className="text-sm text-muted-foreground">Select an applicant from the left.</p>;
                return (
                  <>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="font-heading text-lg font-bold">{a.name} <span className="font-urdu text-base text-muted-foreground ms-2">{a.nameUrdu}</span></h3>
                        <p className="text-xs text-muted-foreground">{a.refNo} · {a.system} · {a.categoryOrClass}</p>
                      </div>
                      {verified ? <Badge className="bg-chart-1/15 text-chart-1 border-0">All required documents verified</Badge> : <Badge variant="outline">Awaiting documents</Badge>}
                    </div>
                    <div className="space-y-2">
                      {CHECKLIST.map((d) => {
                        const checked = !!docsForActive[d.key];
                        return (
                          <label key={d.key} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? "border-chart-1/40 bg-chart-1/5" : "border-border hover:bg-muted/40"}`}>
                            <Checkbox checked={checked} onCheckedChange={(v) => setDocState((p) => ({ ...p, [activeDoc]: { ...p[activeDoc], [d.key]: !!v } }))} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{d.en} {d.required && <span className="text-destructive ms-1">*</span>}</p>
                              <p className="font-urdu text-sm text-muted-foreground">{d.ur}</p>
                            </div>
                            <Badge variant={d.required ? "default" : "secondary"} className="text-[10px]">{d.required ? "Required" : "Optional"}</Badge>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => toast.success("Document checklist sent to " + a.phone)}>Send Reminder</Button>
                      <Button size="sm" disabled={!verified} onClick={() => toast.success(`${a.name} cleared for admission`)}>Approve Documents</Button>
                    </div>
                  </>
                );
              })()}
            </Card>
          </div>
        </TabsContent>

        {/* WAITLIST */}
        <TabsContent value="waitlist">
          <Card className="overflow-hidden mt-3">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <p className="text-sm font-semibold">Waitlist · انتظار کی فہرست</p>
              <p className="text-xs text-muted-foreground">Ordered by rank · promote when seat opens</p>
            </div>
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead className="w-[60px]">Rank</TableHead><TableHead>Applicant</TableHead><TableHead>Preference</TableHead><TableHead>Reason</TableHead><TableHead className="text-end">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {waitlist.map((w) => {
                  const a = applications.find((x) => x.id === w.appId);
                  if (!a) return null;
                  return (
                    <TableRow key={w.appId}>
                      <TableCell><Badge variant="outline" className="font-mono">#{w.rank}</Badge></TableCell>
                      <TableCell><p className="font-urdu text-sm font-semibold leading-tight">{a.nameUrdu}</p><p className="text-[11px] text-muted-foreground">{a.refNo} · {formatDate(a.submittedAt)}</p></TableCell>
                      <TableCell><p className="text-sm">{a.categoryOrClass}</p></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.reason}</TableCell>
                      <TableCell className="text-end"><Button size="sm" variant="outline" className="gap-1.5 h-7 text-[10px]" onClick={() => promote(w.appId)}><ArrowUpRight className="h-3 w-3" />Promote</Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon: Icon, en, ur, v, tone }: { icon: typeof CalendarClock; en: string; ur: string; v: number; tone?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{en} · <span className="font-urdu">{ur}</span></div>
      <p className={`font-heading text-2xl font-bold mt-1 ${tone ?? ""}`}>{v}</p>
    </Card>
  );
}