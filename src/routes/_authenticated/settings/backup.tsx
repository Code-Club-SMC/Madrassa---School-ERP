import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DatabaseBackup, Download, Upload, CloudUpload, Calendar, Check, AlertTriangle, FileArchive, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings/backup")({
  component: BackupPage,
});

type Backup = { id: string; at: string; sizeMb: number; type: "auto" | "manual"; storage: "local" | "cloud"; ok: boolean };

const SEED: Backup[] = [
  { id: "b1", at: "2026-05-25T03:00:00Z", sizeMb: 42.7, type: "auto", storage: "cloud", ok: true },
  { id: "b2", at: "2026-05-24T03:00:00Z", sizeMb: 42.3, type: "auto", storage: "cloud", ok: true },
  { id: "b3", at: "2026-05-23T14:22:00Z", sizeMb: 41.9, type: "manual", storage: "local", ok: true },
  { id: "b4", at: "2026-05-23T03:00:00Z", sizeMb: 41.7, type: "auto", storage: "cloud", ok: true },
  { id: "b5", at: "2026-05-22T03:00:00Z", sizeMb: 41.2, type: "auto", storage: "cloud", ok: false },
];

function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>(SEED);
  const [autoBackup, setAutoBackup] = useState(true);
  const [schedule, setSchedule] = useState("daily-3am");
  const [retention, setRetention] = useState("30");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const run = (type: "manual") => {
    setBusy(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setBusy(false);
          setBackups((b) => [{ id: `b${Date.now()}`, at: new Date().toISOString(), sizeMb: 43.1, type, storage: "cloud", ok: true }, ...b]);
          toast.success("Backup completed · بیک اپ مکمل");
          return 0;
        }
        return p + 12;
      });
    }, 220);
  };

  return (
    <div>
      <PageHeader title="Backup & Restore" titleUrdu="بیک اپ اور بحالی" description="Protect institutional data — students, fees, exams, finance — with automatic encrypted backups." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 lg:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"><DatabaseBackup className="h-7 w-7" /></div>
            <div className="flex-1">
              <h2 className="font-heading text-lg font-bold">Last backup completed successfully</h2>
              <p className="font-urdu text-sm text-muted-foreground">آخری بیک اپ کامیابی سے مکمل ہوا</p>
              <p className="text-xs text-muted-foreground mt-1.5">{formatDate(backups[0].at)} · {backups[0].sizeMb} MB · stored on encrypted cloud</p>
              {busy && <div className="mt-3"><Progress value={progress} className="h-2" /><p className="text-[10px] text-muted-foreground mt-1">Backing up… {progress}%</p></div>}
            </div>
            <Button className="gap-1.5" onClick={() => run("manual")} disabled={busy}><CloudUpload className="h-4 w-4" />Backup Now</Button>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-muted-foreground mb-1">DATABASE SIZE</p>
          <p className="font-heading text-3xl font-bold">43.1 <span className="text-base text-muted-foreground">MB</span></p>
          <div className="mt-3 space-y-1.5 text-xs">
            <Row label="Students & Guardians" value="12.4 MB" />
            <Row label="Fees & Finance" value="8.7 MB" />
            <Row label="Exams & Results" value="14.1 MB" />
            <Row label="Attachments" value="7.9 MB" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Automatic Schedule · خودکار شیڈول</p>
          <p className="text-xs text-muted-foreground mb-4">Backups run automatically and uploaded to encrypted cloud storage.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm">Enable automatic backups</span><Switch checked={autoBackup} onCheckedChange={setAutoBackup} /></div>
            <BilingualLabel urdu="فریکوینسی" english="Frequency">
              <Select value={schedule} onValueChange={setSchedule} disabled={!autoBackup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="daily-3am">Daily at 3:00 AM</SelectItem>
                  <SelectItem value="daily-mid">Daily at midnight</SelectItem>
                  <SelectItem value="weekly">Weekly (Sunday 2 AM)</SelectItem>
                </SelectContent>
              </Select>
            </BilingualLabel>
            <BilingualLabel urdu="مدت" english="Retention (days)"><Input type="number" value={retention} onChange={(e) => setRetention(e.target.value)} /></BilingualLabel>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Upload className="h-4 w-4 text-primary" />Restore from Backup · بحالی</p>
          <p className="text-xs text-muted-foreground mb-4">Upload a .msmis-backup file or pick a snapshot below to roll back the entire database.</p>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
            <FileArchive className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Drop backup file here</p>
            <p className="text-[11px] text-muted-foreground">.msmis-backup · max 500 MB</p>
          </div>
          <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /><span><b>Warning:</b> Restoring will overwrite all current data. An automatic safety backup is taken first.</span>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold">Backup History · بیک اپ کی تاریخ</p>
          <Badge variant="outline">{backups.length} snapshots</Badge>
        </div>
        <div className="divide-y divide-border">
          {backups.map((b) => (
            <div key={b.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${b.ok ? "bg-chart-1/15 text-chart-1" : "bg-destructive/15 text-destructive"}`}>
                {b.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{formatDate(b.at, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                <p className="text-[11px] text-muted-foreground">{b.sizeMb} MB · {b.storage === "cloud" ? "☁ Cloud" : "💾 Local"} · {b.type === "auto" ? "Scheduled" : "Manual"}</p>
              </div>
              <Badge variant={b.type === "auto" ? "secondary" : "default"} className="text-[10px]">{b.type}</Badge>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Download" aria-label="Download"><Download className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Restore" aria-label="Restore" onClick={() => toast.warning("Restore requires Super Admin confirmation")}><RotateCcw className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono">{value}</span></div>;
}