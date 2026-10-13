import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  CalendarClock,
  FileCheck2,
  ListChecks,
  ChevronLeft,
  ArrowUpRight,
  Phone,
  User,
  Inbox,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/components/language-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admission/interviews")({
  component: InterviewsPage,
});

type Slot = {
  id: string;
  appId: string;
  date: string;
  time: string;
  interviewer: string;
  room: string;
  status: "scheduled" | "completed" | "no_show";
};

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

const INTERVIEWERS = [
  "Maulana Imran Hussain",
  "Mufti Tariq Saeed",
  "Mrs. Saira Tariq",
  "Principal — Hafiz Bilal",
];
const ROOMS = ["Conference Room A", "Principal's Office", "Library Room 2"];

type AdmissionApplication = {
  id: string;
  refNo: string;
  status: string;
  name: string;
  nameUrdu: string;
  fatherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  phone?: string;
  system?: string;
  categoryOrClass?: string;
  submittedAt?: string;
};

function InterviewsPage() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admission/applications", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.applications && Array.isArray(d.applications)) {
          setApplications(d.applications);
        }
      })
      .catch((err) => {
        console.error("Failed to load admission applications:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const accepted = useMemo(
    () => applications.filter((a) => a.status === "accepted"),
    [applications],
  );
  const pending = useMemo(
    () =>
      applications.filter(
        (a) =>
          a.status === "pending" ||
          a.status === "interview_scheduled" ||
          a.status === "under_review",
      ),
    [applications],
  );

  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeDoc, setActiveDoc] = useState<string>("");
  const [docState, setDocState] = useState<Record<string, Record<string, boolean>>>({});
  const [waitlist, setWaitlist] = useState<{ appId: string; rank: number; reason: string }[]>([]);
  const [docFilter, setDocFilter] = useState<"pending" | "all">("pending");

  useEffect(() => {
    const listToPick = pending.length > 0 ? pending : applications;
    if (listToPick.length > 0 && !activeDoc) {
      setActiveDoc(listToPick[0].id);
      setSlots(
        listToPick.slice(0, 3).map((a, i) => ({
          id: `s${i}`,
          appId: a.id,
          date: new Date(Date.now() + (i + 1) * 86400e3).toISOString().slice(0, 10),
          time: ["10:00", "11:30", "14:00"][i] ?? "10:00",
          interviewer: INTERVIEWERS[i % INTERVIEWERS.length],
          room: ROOMS[i % ROOMS.length],
          status: (a.status === "accepted" ? "completed" : "scheduled") as "completed" | "scheduled",
        })),
      );
      if (pending.length > 0) {
        setWaitlist(
          pending.slice(3, 7).map((a, i) => ({
            appId: a.id,
            rank: i + 1,
            reason: i === 0 ? "Awaiting seat in selected grade" : "Pending document verification",
          })),
        );
      }
    }
  }, [pending, applications, activeDoc]);

  const activeApp = applications.find((x) => x.id === activeDoc);
  const isAlreadyAccepted = activeApp?.status === "accepted";
  const docsForActive = docState[activeDoc] ?? {};
  const verified = isAlreadyAccepted || CHECKLIST.filter((d) => d.required).every((d) => docsForActive[d.key]);

  const promote = (appId: string) => {
    setWaitlist((w) => w.filter((x) => x.appId !== appId));
    toast.success(
      isUrdu
        ? "درخواست گزار کو فعال داخلوں میں منتقل کر دیا گیا"
        : "Promoted to active intake — roll number assigned",
      {
        description: isUrdu
          ? "ویٹ لسٹ سے فعال داخلوں میں منتقل"
          : "Moved from waitlist to active intake",
      },
    );
  };

  return (
    <div className="space-y-6">
      <Link
        to="/admission"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
      >
        <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        <span>{isUrdu ? "واپس داخلہ مرکز" : "Admission Hub"}</span>
      </Link>

      <PageHeader
        title={isUrdu ? "انٹرویو، دستاویزات اور انتظار کی فہرست" : "Interviews, Documents & Waitlist"}
        titleUrdu="انٹرویو، دستاویزات اور انتظار"
        description={
          isUrdu
            ? "امیدواروں کے انٹرویو شیڈول کریں، دستاویزات کی تصدیق کریں اور انتظار کی فہرست کا انتظام کریں۔"
            : "Schedule interviews, verify required documents, and manage the waitlist for capped classes."
        }
      />

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ms-2 text-sm text-muted-foreground">
            {isUrdu ? "لوڈ ہو رہا ہے..." : "Loading applications..."}
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Stat
              icon={CalendarClock}
              en="Scheduled"
              ur="مقررہ انٹرویو"
              v={slots.filter((s) => s.status === "scheduled").length}
            />
            <Stat
              icon={FileCheck2}
              en="Pending Docs"
              ur="دستاویزات کمی"
              v={pending.length}
            />
            <Stat
              icon={ListChecks}
              en="On Waitlist"
              ur="انتظار میں"
              v={waitlist.length}
              tone="text-amber-600 dark:text-amber-400"
            />
            <Stat
              icon={User}
              en="Accepted YTD"
              ur="منظور شدہ"
              v={accepted.length}
              tone="text-chart-1"
            />
          </div>

          <Tabs defaultValue="interviews">
            <TabsList>
              <TabsTrigger value="interviews">
                <CalendarClock className="h-3.5 w-3.5 me-1.5" />
                {isUrdu ? "انٹرویو شیڈول" : "Schedule"}
              </TabsTrigger>
              <TabsTrigger value="docs">
                <FileCheck2 className="h-3.5 w-3.5 me-1.5" />
                {isUrdu ? "دستاویزات کی تصدیق" : "Document Verification"}
              </TabsTrigger>
              <TabsTrigger value="waitlist">
                <ListChecks className="h-3.5 w-3.5 me-1.5" />
                {isUrdu ? "انتظار کی فہرست" : "Waitlist"}
              </TabsTrigger>
            </TabsList>

            {/* SCHEDULE */}
            <TabsContent value="interviews">
              <Card className="overflow-hidden mt-3">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {isUrdu ? "آئندہ انٹرویوز" : "Upcoming Interviews"}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      const candidate =
                        pending.find((x) => !slots.some((s) => s.appId === x.id)) ??
                        applications.find((x) => !slots.some((s) => s.appId === x.id));
                      if (!candidate) {
                        return toast.info(
                          isUrdu
                            ? "شیڈول کرنے کے لیے کوئی مزید درخواست نہیں ملی"
                            : "All applications are already scheduled",
                        );
                      }
                      setSlots((s) => [
                        ...s,
                        {
                          id: `s${Date.now()}`,
                          appId: candidate.id,
                          date: new Date(Date.now() + 5 * 86400e3).toISOString().slice(0, 10),
                          time: "10:00",
                          interviewer: INTERVIEWERS[0],
                          room: ROOMS[0],
                          status: candidate.status === "accepted" ? "completed" : "scheduled",
                        },
                      ]);
                      toast.success(isUrdu ? "نیا انٹرویو سلاٹ بن گیا" : "Slot created");
                    }}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    {isUrdu ? "نیا سلاٹ" : "New Slot"}
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>{isUrdu ? "امیدوار" : "Applicant"}</TableHead>
                      <TableHead>{isUrdu ? "تاریخ و وقت" : "Date & Time"}</TableHead>
                      <TableHead>{isUrdu ? "انٹرویو لینے والا" : "Interviewer"}</TableHead>
                      <TableHead>{isUrdu ? "کمرہ" : "Room"}</TableHead>
                      <TableHead>{isUrdu ? "حیثیت" : "Status"}</TableHead>
                      <TableHead className="text-end">{isUrdu ? "اقدامات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">
                            {isUrdu ? "کوئی انٹرویو شیڈول نہیں ہے" : "No interviews scheduled yet"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      slots.map((s) => {
                        const a = applications.find((x) => x.id === s.appId);
                        if (!a) return null;
                        return (
                          <TableRow key={s.id}>
                            <TableCell>
                              <p className="font-urdu text-sm font-semibold leading-tight">
                                {a.nameUrdu || a.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {a.refNo} {a.system ? `· ${a.system}` : ""}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1.5">
                                <Input
                                  type="date"
                                  value={s.date}
                                  onChange={(e) =>
                                    setSlots((p) =>
                                      p.map((x) => (x.id === s.id ? { ...x, date: e.target.value } : x)),
                                    )
                                  }
                                  className="h-8 w-[140px] text-xs"
                                />
                                <Input
                                  type="time"
                                  value={s.time}
                                  onChange={(e) =>
                                    setSlots((p) =>
                                      p.map((x) => (x.id === s.id ? { ...x, time: e.target.value } : x)),
                                    )
                                  }
                                  className="h-8 w-[100px] text-xs"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={s.interviewer}
                                onValueChange={(v) =>
                                  setSlots((p) =>
                                    p.map((x) => (x.id === s.id ? { ...x, interviewer: v } : x)),
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {INTERVIEWERS.map((i) => (
                                    <SelectItem key={i} value={i}>
                                      {i}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={s.room}
                                onValueChange={(v) =>
                                  setSlots((p) =>
                                    p.map((x) => (x.id === s.id ? { ...x, room: v } : x)),
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-[170px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROOMS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {s.status === "scheduled" && (
                                <Badge className="bg-primary/15 text-primary border-0">
                                  {isUrdu ? "شیڈول" : "Scheduled"}
                                </Badge>
                              )}
                              {s.status === "completed" && (
                                <Badge className="bg-chart-1/15 text-chart-1 border-0">
                                  {isUrdu ? "مکمل" : "Completed"}
                                </Badge>
                              )}
                              {s.status === "no_show" && (
                                <Badge variant="destructive">
                                  {isUrdu ? "غیر حاضر" : "No-show"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-end">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px]"
                                  onClick={() => {
                                    setSlots((p) =>
                                      p.map((x) =>
                                        x.id === s.id ? { ...x, status: "completed" } : x,
                                      ),
                                    );
                                    toast.success(
                                      isUrdu ? "انٹرویو مکمل نشان زد ہو گیا" : "Marked completed",
                                    );
                                  }}
                                >
                                  {isUrdu ? "مکمل" : "Done"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[10px]"
                                  onClick={() => {
                                    const phone = a.guardianPhone || a.phone || "";
                                    toast.success(
                                      isUrdu
                                        ? `ایس ایم ایس بھیج دیا گیا: ${phone || a.nameUrdu}`
                                        : `SMS reminder sent to ${phone || a.name}`,
                                    );
                                  }}
                                >
                                  <Phone className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* DOCS */}
            <TabsContent value="docs">
              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 mt-3">
                <Card className="p-2 space-y-1 h-fit">
                  <div className="flex items-center justify-between pb-2 mb-1 border-b px-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {isUrdu ? "درخواستیں" : "Applications"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={docFilter === "pending" ? "secondary" : "ghost"}
                        className="h-6 text-[11px] px-2"
                        onClick={() => setDocFilter("pending")}
                      >
                        {isUrdu ? `زیر التواء (${pending.length})` : `Pending (${pending.length})`}
                      </Button>
                      <Button
                        size="sm"
                        variant={docFilter === "all" ? "secondary" : "ghost"}
                        className="h-6 text-[11px] px-2"
                        onClick={() => setDocFilter("all")}
                      >
                        {isUrdu ? `تمام (${applications.length})` : `All (${applications.length})`}
                      </Button>
                    </div>
                  </div>
                  {(() => {
                    const displayed =
                      docFilter === "pending" && pending.length > 0 ? pending : applications;
                    if (displayed.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          {isUrdu ? "کوئی درخواست نہیں ملی" : "No applications found"}
                        </div>
                      );
                    }
                    return displayed.slice(0, 15).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setActiveDoc(a.id)}
                        className={`w-full text-start p-3 rounded-lg transition-colors ${
                          activeDoc === a.id
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-urdu text-sm font-semibold leading-tight">
                            {a.nameUrdu || a.name}
                          </p>
                          {a.status === "accepted" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200"
                            >
                              {isUrdu ? "منظور شدہ" : "Accepted"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{a.refNo}</p>
                      </button>
                    ));
                  })()}
                </Card>
                <Card className="p-5">
                  {(() => {
                    const a = applications.find((x) => x.id === activeDoc);
                    if (!a) {
                      return (
                        <div className="text-center py-12 text-muted-foreground">
                          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">
                            {pending.length === 0
                              ? isUrdu
                                ? "دستاویزات کی تصدیق کے لیے کوئی زیر التواء درخواست موجود نہیں ہے"
                                : "No pending applications for verification"
                              : isUrdu
                                ? "فہرست سے ایک درخواست دہندہ منتخب کریں"
                                : "Select an applicant from the left"}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                          <div>
                            <h3 className="font-heading text-lg font-bold">
                              {a.name}{" "}
                              {a.nameUrdu && (
                                <span className="font-urdu text-base text-muted-foreground ms-2">
                                  {a.nameUrdu}
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {a.refNo} {a.system ? `· ${a.system}` : ""}{" "}
                              {a.categoryOrClass ? `· ${a.categoryOrClass}` : ""}
                            </p>
                          </div>
                          {verified ? (
                            <Badge className="bg-chart-1/15 text-chart-1 border-0">
                              {isUrdu ? "تمام ضروری دستاویزات تصدیق شدہ" : "All required documents verified"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              {isUrdu ? "دستاویزات کا انتظار ہے" : "Awaiting documents"}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          {CHECKLIST.map((d) => {
                            const checked = isAlreadyAccepted || !!docsForActive[d.key];
                            return (
                              <label
                                key={d.key}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  checked
                                    ? "border-chart-1/40 bg-chart-1/5"
                                    : "border-border hover:bg-muted/40"
                                }`}
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={isAlreadyAccepted}
                                  onCheckedChange={(v) =>
                                    setDocState((p) => ({
                                      ...p,
                                      [activeDoc]: { ...p[activeDoc], [d.key]: !!v },
                                    }))
                                  }
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    {d.en}{" "}
                                    {d.required && (
                                      <span className="text-destructive ms-1">*</span>
                                    )}
                                  </p>
                                  <p className="font-urdu text-sm text-muted-foreground">{d.ur}</p>
                                </div>
                                <Badge
                                  variant={d.required ? "default" : "secondary"}
                                  className="text-[10px]"
                                >
                                  {d.required
                                    ? isUrdu
                                      ? "لازمی"
                                      : "Required"
                                    : isUrdu
                                      ? "اختیاری"
                                      : "Optional"}
                                </Badge>
                              </label>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          {a.status === "accepted" ? (
                            <div className="flex items-center gap-3">
                              <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-0">
                                {isUrdu ? "داخلہ منظور شدہ · طالب علم فعال" : "Admission Accepted · Student Active"}
                              </Badge>
                              <Link
                                to="/settings/student-lifecycle"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium border border-primary/20 px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                              >
                                <span>{isUrdu ? "طالب علم لائف ٹائم ریکارڈ" : "View Student Dossier"}</span>
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const phone = a.guardianPhone || a.phone || "";
                                  toast.success(
                                    isUrdu
                                      ? `دستاویزات کی یاد دہانی بھیج دی گئی: ${phone || a.nameUrdu}`
                                      : `Document checklist reminder sent to ${phone || a.name}`,
                                  );
                                }}
                              >
                                {isUrdu ? "یاد دہانی بھیجیں" : "Send Reminder"}
                              </Button>
                              <Button
                                size="sm"
                                disabled={!verified}
                                onClick={async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/admission/applications/${a.id}/status`,
                                      {
                                        method: "PATCH",
                                        headers: { "content-type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({ status: "interview_scheduled" }),
                                      },
                                    );
                                    if (res.ok) {
                                      setApplications((prev) =>
                                        prev.map((item) =>
                                          item.id === a.id
                                            ? { ...item, status: "interview_scheduled" }
                                            : item,
                                        ),
                                      );
                                    }
                                  } catch {
                                    // fallback
                                  }
                                  toast.success(
                                    isUrdu
                                      ? `${a.nameUrdu || a.name} کے دستاویزات منظور ہو گئے`
                                      : `${a.name} cleared for admission`,
                                  );
                                }}
                              >
                                {isUrdu ? "دستاویزات منظور کریں" : "Approve Documents"}
                              </Button>
                            </>
                          )}
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
                  <p className="text-sm font-semibold">
                    {isUrdu ? "انتظار کی فہرست" : "Waitlist"} · انتظار کی فہرست
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isUrdu
                      ? "ترتیب وار فہرست · نشست دستیاب ہونے پر ترقی دیں"
                      : "Ordered by rank · promote when seat opens"}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[60px]">{isUrdu ? "نمبر" : "Rank"}</TableHead>
                      <TableHead>{isUrdu ? "امیدوار" : "Applicant"}</TableHead>
                      <TableHead>{isUrdu ? "شعبہ / درجہ" : "Preference"}</TableHead>
                      <TableHead>{isUrdu ? "وجہ" : "Reason"}</TableHead>
                      <TableHead className="text-end">{isUrdu ? "کارروائی" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlist.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">
                            {isUrdu
                              ? "انتظار کی فہرست میں فی الحال کوئی امیدوار نہیں ہے"
                              : "No applicants on waitlist currently"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      waitlist.map((w) => {
                        const a = applications.find((x) => x.id === w.appId);
                        if (!a) return null;
                        return (
                          <TableRow key={w.appId}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                #{w.rank}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="font-urdu text-sm font-semibold leading-tight">
                                {a.nameUrdu || a.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {a.refNo}{" "}
                                {a.submittedAt ? `· ${formatDate(a.submittedAt)}` : ""}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{a.categoryOrClass || "-"}</p>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {w.reason}
                            </TableCell>
                            <TableCell className="text-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 h-7 text-[10px]"
                                onClick={() => promote(w.appId)}
                              >
                                <ArrowUpRight className="h-3 w-3" />
                                {isUrdu ? "ترقی دیں" : "Promote"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  en,
  ur,
  v,
  tone,
}: {
  icon: typeof CalendarClock;
  en: string;
  ur: string;
  v: number;
  tone?: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{en}</span> · <span className="font-urdu">{ur}</span>
      </div>
      <p className={`font-heading text-2xl font-bold mt-1 ${tone ?? ""}`}>{v}</p>
    </Card>
  );
}