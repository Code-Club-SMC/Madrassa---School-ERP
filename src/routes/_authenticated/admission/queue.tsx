import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Check, X, Eye, Inbox, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatDate, relativeTime } from "@/lib/format";
import { toast } from "sonner";
import { CredentialsOverlay } from "@/features/users/credentials-display";

export const Route = createFileRoute("/_authenticated/admission/queue")({
  component: QueuePage,
});

type ApplicationStatus =
  | "pending"
  | "under_review"
  | "interview_scheduled"
  | "documents_pending"
  | "waitlisted"
  | "accepted"
  | "rejected";

type Application = {
  id: string;
  refNo: string;
  name: string;
  nameUrdu: string;
  system: "madrassa" | "school";
  categoryOrClass: string;
  phone: string;
  guardianName?: string;
  guardianPhone?: string | null;
  guardianCnic?: string | null;
  guardianEmail?: string | null;
  submittedAt: string;
  status: ApplicationStatus;
};

type QueueTab = "pending" | "accepted" | "rejected";
type ParentCreds = {
  nameUrdu: string;
  nameEnglish: string;
  email: string;
  username?: string;
  role: string;
  password: string;
};
type AcceptWarning = {
  code: "parent_account_failed";
  message: string;
  metadata?: {
    username?: string;
    reason?: string;
  };
};
type GuardianSuggestion = {
  id: string;
  name: string;
  nameUrdu: string | null;
  cnic: string | null;
  phone: string | null;
  email: string | null;
  linkedUserId: string | null;
  students: Array<{ id: string; name: string; nameUrdu: string; rollNo: string | null }>;
};

const openStatuses: ApplicationStatus[] = [
  "pending",
  "under_review",
  "interview_scheduled",
  "documents_pending",
  "waitlisted",
];

function QueuePage() {
  const [list, setList] = useState<Application[]>([]);
  const [tab, setTab] = useState<QueueTab>("pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [view, setView] = useState<Application | null>(null);
  const [accepting, setAccepting] = useState<Application | null>(null);
  const [createParentAccount, setCreateParentAccount] = useState(false);
  const [guardianSuggestions, setGuardianSuggestions] = useState<GuardianSuggestion[]>([]);
  const [selectedGuardianId, setSelectedGuardianId] = useState<string | null>(null);
  const [selectedSiblingIds, setSelectedSiblingIds] = useState<string[]>([]);
  const [reject, setReject] = useState<Application | null>(null);
  const [reason, setReason] = useState("");
  const [creds, setCreds] = useState<ParentCreds | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admission/applications", { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "درخواستیں لوڈ نہیں ہو سکیں");
      setList(payload.applications ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "درخواستیں لوڈ نہیں ہو سکیں");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const counts = useMemo(
    () => ({
      pending: list.filter((a) => openStatuses.includes(a.status)).length,
      accepted: list.filter((a) => a.status === "accepted").length,
      rejected: list.filter((a) => a.status === "rejected").length,
    }),
    [list],
  );

  const filtered = useMemo(
    () =>
      list.filter((a) => {
        const inTab = tab === "pending" ? openStatuses.includes(a.status) : a.status === tab;
        const matchesQuery =
          !q ||
          a.name.toLowerCase().includes(q.toLowerCase()) ||
          a.nameUrdu.includes(q) ||
          a.refNo.toLowerCase().includes(q.toLowerCase());
        return inTab && matchesQuery;
      }),
    [list, tab, q],
  );

  const openAcceptDialog = async (application: Application) => {
    setAccepting(application);
    setCreateParentAccount(true);
    setGuardianSuggestions([]);
    setSelectedGuardianId(null);
    setSelectedSiblingIds([]);

    if (!application.guardianCnic && !application.guardianPhone && !application.phone) return;

    try {
      const response = await fetch("/api/admission/guardian-suggestions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guardianCnic: application.guardianCnic ?? undefined,
          guardianPhone: application.guardianPhone ?? application.phone,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "ممکنہ سرپرست لوڈ نہیں ہو سکے");

      const suggestions: GuardianSuggestion[] = payload.guardians ?? [];
      setGuardianSuggestions(suggestions);
      if (suggestions.length === 1) setSelectedGuardianId(suggestions[0].id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ممکنہ سرپرست لوڈ نہیں ہو سکے");
    }
  };

  const confirmAccept = async () => {
    if (!accepting) return;
    setActionPending(true);
    try {
      const response = await fetch(`/api/admission/applications/${accepting.id}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          createParentAccount,
          guardianId: selectedGuardianId ?? undefined,
          siblingStudentIds: selectedSiblingIds,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "درخواست منظور نہیں ہو سکی");

      await loadApplications();
      setView(null);
      setAccepting(null);
      if (payload.parentCredentials) setCreds(payload.parentCredentials);
      const warnings: AcceptWarning[] = payload.warnings ?? [];
      const parentWarning = warnings.find((warning) => warning.code === "parent_account_failed");

      toast.success(`داخلہ منظور ہوا — رول ${payload.student?.rollNo ?? "جاری ہو گیا"}`);

      if (parentWarning) {
        toast.warning(parentWarning.message, {
          description: [parentWarning.metadata?.username, parentWarning.metadata?.reason].filter(Boolean).join(" · "),
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "درخواست منظور نہیں ہو سکی");
    } finally {
      setActionPending(false);
    }
  };

  const doReject = async () => {
    if (!reject) return;
    setActionPending(true);
    try {
      const response = await fetch(`/api/admission/applications/${reject.id}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "درخواست مسترد نہیں ہو سکی");

      await loadApplications();
      toast.error(`درخواست مسترد ہو گئی — ${reject.refNo}`, { description: reason });
      setReject(null);
      setReason("");
      setView(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "درخواست مسترد نہیں ہو سکی");
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div dir="rtl" lang="ur">
      <PageHeader title="آن لائن درخواستیں" titleUrdu="آن لائن درخواستیں" description="عوامی پورٹل سے جمع کرائی گئی داخلہ درخواستوں کا جائزہ لیں۔" />

      <Card className="p-3 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as QueueTab)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">کھلی درخواستیں <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full px-1.5">{counts.pending}</span></TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">منظور شدہ <span className="text-[10px] bg-chart-1/15 text-chart-5 dark:text-chart-1 rounded-full px-1.5">{counts.accepted}</span></TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">مسترد شدہ <span className="text-[10px] bg-destructive/10 text-destructive rounded-full px-1.5">{counts.rejected}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="درخواست نمبر یا نام تلاش کریں" className="pe-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[130px]">درخواست نمبر</TableHead>
              <TableHead>درخواست گزار</TableHead>
              <TableHead className="hidden md:table-cell">نظام / جماعت</TableHead>
              <TableHead className="hidden lg:table-cell">فون</TableHead>
              <TableHead>جمع کرائی</TableHead>
              <TableHead className="text-end">عمل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  درخواستیں لوڈ ہو رہی ہیں...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12"><EmptyState icon={Inbox} heading="کوئی درخواست نہیں" headingUrdu="کوئی درخواست نہیں" description={tab === "pending" ? "اس وقت کوئی کھلی درخواست موجود نہیں۔" : "اس خانے میں کوئی درخواست موجود نہیں۔"} /></TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => setView(a)}>
                <TableCell className="font-mono text-xs">{a.refNo}</TableCell>
                <TableCell>
                  <p className="font-urdu text-sm leading-tight">{a.nameUrdu}</p>
                  <p className="text-xs text-muted-foreground">{a.name}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <p className="text-sm">{systemLabel(a.system)}</p>
                  <p className="font-urdu text-xs text-muted-foreground">{a.categoryOrClass}</p>
                </TableCell>
                <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{a.phone}</TableCell>
                <TableCell>
                  <p className="text-xs">{formatDate(a.submittedAt)}</p>
                  <p className="text-[11px] text-muted-foreground">{relativeTime(a.submittedAt)}</p>
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  {openStatuses.includes(a.status) ? (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setView(a)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => void openAcceptDialog(a)}><Check className="h-3.5 w-3.5" />منظور</Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive border-destructive/30" onClick={() => setReject(a)}><X className="h-3.5 w-3.5" />مسترد</Button>
                    </div>
                  ) : (
                    <StatusBadge status={a.status} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <SheetContent className="sm:max-w-md">
          {view && (
            <>
              <SheetHeader>
                <SheetTitle className="font-heading">{view.refNo}</SheetTitle>
                <SheetDescription className="font-urdu text-base text-foreground">{view.nameUrdu}</SheetDescription>
              </SheetHeader>
                <div className="p-4 space-y-3 text-sm">
                  <Row urdu="انگریزی نام" value={view.name} />
                  <Row urdu="نظام" value={systemLabel(view.system)} />
                  <Row urdu="قسم" value={view.categoryOrClass} />
                  <Row urdu="فون" value={view.phone} mono />
                  <Row urdu="جمع کرائی" value={formatDate(view.submittedAt)} />
                <div className="pt-2"><StatusBadge status={view.status} /></div>
              </div>
              {openStatuses.includes(view.status) && (
                <div className="p-4 border-t border-border flex gap-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => void openAcceptDialog(view)}><Check className="h-4 w-4" />منظور کریں</Button>
                  <Button variant="outline" className="flex-1 text-destructive border-destructive/30 gap-1.5" onClick={() => setReject(view)}><X className="h-4 w-4" />مسترد کریں</Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!accepting} onOpenChange={(v) => { if (!v) setAccepting(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-urdu">درخواست منظور کریں</DialogTitle>
            <DialogDescription className="font-urdu">داخلہ منظور کرنے سے طالب علم، داخلہ ریکارڈ، اور سرپرست لنک بنے گا۔</DialogDescription>
          </DialogHeader>
          {guardianSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="font-urdu text-xs font-medium text-muted-foreground">ممکنہ سرپرست</p>
              {guardianSuggestions.map((guardian) => (
                <div key={guardian.id} className="rounded-lg border border-border p-3">
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={selectedGuardianId === guardian.id}
                      onCheckedChange={(value) => setSelectedGuardianId(value === true ? guardian.id : null)}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{guardian.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {[guardian.phone, guardian.cnic, guardian.linkedUserId ? "والدین لاگ اِن منسلک ہے" : null].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </label>
                  {guardian.students.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                      <p className="font-urdu text-xs text-muted-foreground">بہن بھائی کی تصدیق کریں</p>
                      {guardian.students.map((student) => (
                        <label key={student.id} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={selectedSiblingIds.includes(student.id)}
                            onCheckedChange={(value) =>
                              setSelectedSiblingIds((current) =>
                                value === true
                                  ? [...new Set([...current, student.id])]
                                  : current.filter((id) => id !== student.id),
                              )
                            }
                          />
                          <span className="font-urdu">{student.nameUrdu || student.name}</span>
                          {student.rollNo && <span className="font-mono text-muted-foreground">{student.rollNo}</span>}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <Checkbox checked={createParentAccount} onCheckedChange={(v) => setCreateParentAccount(v === true)} />
            <span>
              والدین کا لاگ اِن بنائیں
              <span className="block text-xs text-muted-foreground">لاگ اِن آئی ڈی سرپرست کے نام سے بنے گی۔ ناکامی کی صورت میں داخلہ پھر بھی منظور ہو جائے گا۔</span>
            </span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccepting(null)} disabled={actionPending}>منسوخ</Button>
            <Button onClick={confirmAccept} disabled={actionPending}>
              {actionPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              منظوری دیں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reject} onOpenChange={(v) => { if (!v) { setReject(null); setReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-urdu">درخواست مسترد کریں</DialogTitle>
            <DialogDescription className="font-urdu">براہِ کرم وجہ درج کریں — درخواست گزار کو دکھائی جائے گی۔</DialogDescription>
          </DialogHeader>
          <Textarea className="font-urdu" placeholder="وجہ لکھیں..." value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReject(null); setReason(""); }} disabled={actionPending}>منسوخ</Button>
            <Button variant="destructive" onClick={doReject} disabled={actionPending || !reason.trim()}>
              {actionPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              مسترد کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialsOverlay creds={creds} onClose={() => setCreds(null)} />
    </div>
  );
}

function Row({ urdu, value, mono }: { urdu: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
      <div><p className="font-urdu text-sm">{urdu}</p></div>
      <p className={mono ? "font-mono text-end" : "text-end capitalize"}>{value}</p>
    </div>
  );
}

function systemLabel(system: Application["system"]) {
  return system === "madrassa" ? "مدرسہ" : "سکول";
}
