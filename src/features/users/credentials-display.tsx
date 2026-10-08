import { useState } from "react";
import { CheckCircle2, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Creds = {
  nameUrdu: string;
  nameEnglish: string;
  email?: string;
  username?: string;
  role: string;
  password: string;
};

import { useLanguage } from "@/components/language-context";
import { ROLE_LABELS } from "@/lib/user-names";

export function CredentialsOverlay({
  creds,
  onClose,
  onViewUser,
}: {
  creds: Creds | null;
  onClose: () => void;
  onViewUser?: () => void;
}) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [reveal, setReveal] = useState(false);
  if (!creds) return null;
  const isParent = creds.role === "parent";
  const loginId = isParent ? creds.username : creds.email;

  const copyAll = () => {
    const text = isUrdu
      ? [
          "لاگ اِن معلومات",
          `نام: ${creds.nameUrdu || creds.nameEnglish}`,
          `${isParent ? "لاگ اِن آئی ڈی" : "ای میل"}: ${loginId ?? ""}`,
          `پاس ورڈ: ${creds.password}`,
          `لنک: ${typeof window !== "undefined" ? window.location.origin + "/login" : "/login"}`,
        ].join("\n")
      : [
          "Login Credentials",
          `Name: ${creds.nameEnglish || creds.nameUrdu}`,
          `${isParent ? "Login ID" : "Email"}: ${loginId ?? ""}`,
          `Password: ${creds.password}`,
          `Link: ${typeof window !== "undefined" ? window.location.origin + "/login" : "/login"}`,
        ].join("\n");
    navigator.clipboard?.writeText(text);
    toast.success(isUrdu ? "لاگ اِن معلومات کاپی ہو گئیں" : "Login credentials copied");
  };

  const displayName = isUrdu
    ? creds.nameUrdu || creds.nameEnglish
    : creds.nameEnglish || creds.nameUrdu;

  const roleText = (ROLE_LABELS[creds.role as keyof typeof ROLE_LABELS]
    ? isUrdu
      ? ROLE_LABELS[creds.role as keyof typeof ROLE_LABELS].ur
      : ROLE_LABELS[creds.role as keyof typeof ROLE_LABELS].en
    : creds.role);

  return (
    <Dialog open={!!creds} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <DialogTitle asChild>
              <h3 className={isUrdu ? "font-urdu text-xl font-bold leading-loose" : "text-lg font-bold"} dir={isUrdu ? "rtl" : "ltr"}>
                {isUrdu ? "صارف کامیابی سے بن گیا" : "User Created Successfully"}
              </h3>
            </DialogTitle>
            <DialogDescription className={isUrdu ? "font-urdu" : "text-sm"}>
              {isUrdu ? "لاگ اِن معلومات محفوظ کر لیں" : "Save the login credentials securely"}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-muted/40 divide-y divide-border text-sm">
          <Row label={isUrdu ? "نام" : "Name"} value={displayName} />
          <Row label={isParent ? (isUrdu ? "لاگ اِن آئی ڈی" : "Login ID") : (isUrdu ? "ای میل" : "Email")} value={loginId ?? ""} mono />
          <Row label={isUrdu ? "کردار" : "Role"} value={roleText} />
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                {isUrdu ? "پاس ورڈ" : "Password"}
              </p>
              <p className="font-mono text-sm break-all">{reveal ? (creds.password || "") : "•".repeat(creds.password ? creds.password.length : 8)}</p>
            </div>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setReveal((v) => !v)} aria-label="Toggle password">
              {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300/40 px-3 py-2 flex items-start gap-2">
          <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs leading-snug font-medium" dir={isUrdu ? "rtl" : "ltr"}>
              {isUrdu ? "یہ پاس ورڈ دوبارہ نہیں دکھایا جائے گا" : "This password will not be shown again."}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5" dir={isUrdu ? "rtl" : "ltr"}>
              {isUrdu ? "اسے ابھی محفوظ کر لیں۔" : "Make sure to copy and save it now."}
            </p>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2 sm:justify-end">
          <Button variant="outline" onClick={copyAll} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            <span>{isUrdu ? "تمام کاپی کریں" : "Copy All"}</span>
          </Button>
          {onViewUser && (
            <Button variant="outline" onClick={onViewUser}>
              <span>{isUrdu ? "صارف دیکھیں" : "View User"}</span>
            </Button>
          )}
          <Button onClick={onClose}>
            <span>{isUrdu ? "بند کریں" : "Close"}</span>
          </Button>
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
