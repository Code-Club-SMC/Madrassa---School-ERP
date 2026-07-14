import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Check, X, Eye, Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { applications as seed, type Application, type ApplicationStatus } from "@/mock";
import { formatDate, relativeTime } from "@/lib/format";
import { toast } from "sonner";
import { CredentialsOverlay } from "@/features/users/credentials-display";

export const Route = createFileRoute("/_authenticated/admission/queue")({
  component: QueuePage,
});

function QueuePage() {
  const [list, setList] = useState<Application[]>(seed);
  const [tab, setTab] = useState<ApplicationStatus>("pending");
  const [q, setQ] = useState("");
  const [view, setView] = useState<Application | null>(null);
  const [reject, setReject] = useState<Application | null>(null);
  const [reason, setReason] = useState("");
  const [creds, setCreds] = useState<{ nameUrdu: string; nameEnglish: string; email: string; role: string; password: string } | null>(null);

  const counts = useMemo(() => ({
    pending: list.filter((a) => a.status === "pending").length,
    accepted: list.filter((a) => a.status === "accepted").length,
    rejected: list.filter((a) => a.status === "rejected").length,
  }), [list]);

  const filtered = useMemo(
    () => list.filter((a) => a.status === tab && (!q || a.name.toLowerCase().includes(q.toLowerCase()) || a.nameUrdu.includes(q) || a.refNo.toLowerCase().includes(q.toLowerCase()))),
    [list, tab, q],
  );

  const accept = (a: Application) => {
    const rollPrefix = a.system === "school" ? "SCH" : "MAD";
    const rollNo = `${rollPrefix}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setList((l) => l.map((x) => (x.id === a.id ? { ...x, status: "accepted" } : x)));
    setView(null);
    setCreds({
      nameUrdu: a.nameUrdu,
      nameEnglish: a.name,
      email: `${a.refNo.toLowerCase()}@parents.msmis.pk`,
      role: "parent",
      password: Math.random().toString(36).slice(2, 12),
    });
    toast.success(`Accepted — Roll ${rollNo} assigned`, { description: "داخلہ منظور ہوا" });
  };

  const doReject = () => {
    if (!reject) return;
    setList((l) => l.map((x) => (x.id === reject.id ? { ...x, status: "rejected" } : x)));
    toast.error(`Rejected — ${reject.refNo}`, { description: reason || "Reason not provided" });
    setReject(null);
    setReason("");
    setView(null);
  };

  return (
    <div>
      <PageHeader title="Application Queue" titleUrdu="آن لائن درخواستیں" description="Review online admission applications submitted through the public portal." />

      <Card className="p-3 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ApplicationStatus)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">Pending <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full px-1.5">{counts.pending}</span></TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">Accepted <span className="text-[10px] bg-chart-1/15 text-chart-5 dark:text-chart-1 rounded-full px-1.5">{counts.accepted}</span></TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">Rejected <span className="text-[10px] bg-destructive/10 text-destructive rounded-full px-1.5">{counts.rejected}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ref, name…" className="pe-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[110px]">Ref #</TableHead>
              <TableHead>Applicant — درخواست گزار</TableHead>
              <TableHead className="hidden md:table-cell">System / Class</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12"><EmptyState icon={Inbox} heading="Inbox zero" headingUrdu="کوئی درخواست نہیں" description={tab === "pending" ? "All caught up — no pending applications." : `No ${tab} applications.`} /></TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => setView(a)}>
                <TableCell className="font-mono text-xs">{a.refNo}</TableCell>
                <TableCell>
                  <p className="font-urdu text-sm leading-tight">{a.nameUrdu}</p>
                  <p className="text-xs text-muted-foreground">{a.name}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <p className="text-sm capitalize">{a.system}</p>
                  <p className="font-urdu text-xs text-muted-foreground">{a.categoryOrClass}</p>
                </TableCell>
                <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{a.phone}</TableCell>
                <TableCell>
                  <p className="text-xs">{formatDate(a.submittedAt)}</p>
                  <p className="text-[11px] text-muted-foreground">{relativeTime(a.submittedAt)}</p>
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  {a.status === "pending" ? (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setView(a)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => accept(a)}><Check className="h-3.5 w-3.5" />Accept</Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive border-destructive/30" onClick={() => setReject(a)}><X className="h-3.5 w-3.5" />Reject</Button>
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
                <Row label="English Name" urdu="انگریزی نام" value={view.name} />
                <Row label="System" urdu="نظام" value={view.system} />
                <Row label="Category / Class" urdu="قسم" value={view.categoryOrClass} />
                <Row label="Phone" urdu="فون" value={view.phone} mono />
                <Row label="Submitted" urdu="جمع کرائی" value={formatDate(view.submittedAt)} />
                <div className="pt-2"><StatusBadge status={view.status} /></div>
              </div>
              {view.status === "pending" && (
                <div className="p-4 border-t border-border flex gap-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => accept(view)}><Check className="h-4 w-4" />Accept · منظور</Button>
                  <Button variant="outline" className="flex-1 text-destructive border-destructive/30 gap-1.5" onClick={() => setReject(view)}><X className="h-4 w-4" />Reject · مسترد</Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!reject} onOpenChange={(v) => { if (!v) { setReject(null); setReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription className="font-urdu">براہِ کرم وجہ درج کریں — درخواست گزار کو دکھائی جائے گی۔</DialogDescription>
          </DialogHeader>
          <Textarea className="font-urdu" placeholder="وجہ لکھیں…" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReject(null); setReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={doReject}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialsOverlay creds={creds} onClose={() => setCreds(null)} />
    </div>
  );
}

function Row({ label, urdu, value, mono }: { label: string; urdu: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
      <div><p className="font-urdu text-sm">{urdu}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>
      <p className={mono ? "font-mono text-end" : "text-end capitalize"}>{value}</p>
    </div>
  );
}
