import { useState } from "react";
import { CheckCircle2, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Creds = { nameUrdu: string; nameEnglish: string; email: string; role: string; password: string };

export function CredentialsOverlay({
  creds,
  onClose,
  onViewUser,
}: {
  creds: Creds | null;
  onClose: () => void;
  onViewUser?: () => void;
}) {
  const [reveal, setReveal] = useState(false);
  if (!creds) return null;

  const copyAll = () => {
    const text = `MSMIS Login Credentials\nName: ${creds.nameUrdu} (${creds.nameEnglish})\nEmail: ${creds.email}\nPassword: ${creds.password}\nLogin URL: ${typeof window !== "undefined" ? window.location.origin + "/login" : "/login"}`;
    navigator.clipboard?.writeText(text);
    toast.success("اسناد کاپی ہو گئیں · Credentials copied");
  };

  return (
    <Dialog open={!!creds} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <DialogTitle asChild>
              <h3 className="font-urdu text-xl font-bold leading-loose" dir="rtl" lang="ur">
                صارف کامیابی سے بن گیا
              </h3>
            </DialogTitle>
            <DialogDescription>User Created Successfully</DialogDescription>
          </div>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-muted/40 divide-y divide-border text-sm">
          <Row label="نام / Name" value={`${creds.nameUrdu} · ${creds.nameEnglish}`} />
          <Row label="ای میل / Email" value={creds.email} mono />
          <Row label="کردار / Role" value={creds.role} />
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">پاس ورڈ / Password</p>
              <p className="font-mono text-sm break-all">{reveal ? creds.password : "•".repeat(creds.password.length)}</p>
            </div>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setReveal((v) => !v)} aria-label="Toggle password">
              {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300/40 px-3 py-2 flex items-start gap-2">
          <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-urdu text-xs leading-loose" dir="rtl" lang="ur">یہ پاس ورڈ دوبارہ نہیں دکھایا جائے گا</p>
            <p className="text-[11px] text-muted-foreground">This password will not be shown again — note it now.</p>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2 sm:justify-end">
          <Button variant="outline" onClick={copyAll} className="gap-1.5"><Copy className="h-3.5 w-3.5" /><span className="font-urdu">تمام کاپی کریں</span></Button>
          {onViewUser && <Button variant="outline" onClick={onViewUser}><span className="font-urdu">صارف دیکھیں</span></Button>}
          <Button onClick={onClose}><span className="font-urdu">بند کریں</span></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
      <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{label}</span>
      <span className={mono ? "font-mono text-sm" : "text-sm font-medium"}>{value}</span>
    </div>
  );
}