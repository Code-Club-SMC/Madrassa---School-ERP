import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Eye, EyeOff, Loader2, ShieldCheck, GraduationCap, Users as UsersIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateSecurePassword } from "@/lib/generate-password";
import { ROLE_DEFAULTS } from "@/lib/permissions/role-defaults";
import { countCustomizations, totalGrantedActions } from "@/lib/permissions/utils";
import type { UserPermissions } from "@/lib/permissions/module-registry";
import { PermissionMatrix, PermissionSummary } from "./permission-matrix";
import type { User, UserRole } from "@/types";

export type StepperRole = "admin" | "teacher" | "parent";

type Prefill = {
  role?: StepperRole;
  linkedTeacherId?: string;
  nameUrdu?: string;
  name?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode?: "create" | "edit";
  initial?: User | null;
  prefill?: Prefill | null;
  onCreate?: (user: User & { _password: string }) => void;
  onUpdate?: (user: User) => void;
};

const ROLE_OPTIONS: { value: StepperRole; urdu: string; english: string; tagline: string; icon: typeof ShieldCheck }[] = [
  { value: "admin", urdu: "منتظم", english: "Admin", tagline: "Manages all institutional operations", icon: ShieldCheck },
  { value: "teacher", urdu: "استاد", english: "Teacher", tagline: "Access to assigned subjects and classes", icon: GraduationCap },
  { value: "parent", urdu: "والدین", english: "Parent", tagline: "Parent portal access only", icon: UsersIcon },
];

export function CreateUserStepper({ open, onOpenChange, mode = "create", initial, prefill, onCreate, onUpdate }: Props) {
  const isEdit = mode === "edit" && !!initial;

  // Step 1
  const [nameUrdu, setNameUrdu] = useState(initial?.nameUrdu ?? prefill?.nameUrdu ?? "");
  const [nameEnglish, setNameEnglish] = useState(initial?.name ?? prefill?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [cnic, setCnic] = useState(initial?.cnic ?? "");

  // Step 2
  const [role, setRole] = useState<StepperRole>(
    (initial?.role as StepperRole) ?? prefill?.role ?? "teacher",
  );
  const [systemAccess, setSystemAccess] = useState<"madrassa" | "school" | "both">(
    initial?.systemAccess ?? "both",
  );
  const [mustChange, setMustChange] = useState(initial?.mustChangePassword ?? true);
  const [linkedTeacherId, setLinkedTeacherId] = useState<string | undefined>(
    initial?.linkedTeacherId ?? prefill?.linkedTeacherId,
  );

  // Step 3
  const [permissions, setPermissions] = useState<UserPermissions>(
    initial?.permissions ?? (role === "parent" ? {} : ROLE_DEFAULTS[role]),
  );

  // Reset permissions when role changes (create mode only)
  useEffect(() => {
    if (isEdit) return;
    setPermissions(role === "parent" ? {} : ROLE_DEFAULTS[role]);
  }, [role, isEdit]);

  // Generate password once per dialog open
  const [password] = useState<string>(() => generateSecurePassword());
  const [revealPwd, setRevealPwd] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Reset state when dialog re-opens
  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  const isParent = role === "parent";
  const totalSteps = isParent ? 3 : 4;
  const stepOrder = isParent ? [1, 2, 4] : [1, 2, 3, 4];
  const stepIdx = stepOrder.indexOf(step);

  const customizations = useMemo(
    () => (isParent ? 0 : countCustomizations(permissions, ROLE_DEFAULTS[role])),
    [permissions, role, isParent],
  );

  function next() {
    if (step === 1) {
      if (!nameUrdu.trim()) return toast.error("نام (اردو) درج کریں · Enter Urdu name");
      if (!email.trim() || !/.+@.+\..+/.test(email)) return toast.error("درست ای میل درج کریں · Enter valid email");
    }
    const nextIdx = Math.min(stepIdx + 1, stepOrder.length - 1);
    setStep(stepOrder[nextIdx]);
  }
  function prev() {
    const prevIdx = Math.max(stepIdx - 1, 0);
    setStep(stepOrder[prevIdx]);
  }

  function submit() {
    setSubmitting(true);
    setTimeout(() => {
      if (isEdit && initial) {
        const updated: User = {
          ...initial,
          name: nameEnglish || nameUrdu,
          nameUrdu,
          email,
          phone,
          cnic,
          systemAccess,
          mustChangePassword: mustChange,
          linkedTeacherId,
          permissions: isParent ? {} : permissions,
        };
        onUpdate?.(updated);
        toast.success("تبدیلیاں محفوظ ہو گئیں · Changes saved");
      } else {
        const username = email.split("@")[0];
        const created: User & { _password: string } = {
          id: `u${Date.now()}`,
          name: nameEnglish || nameUrdu,
          nameUrdu,
          email,
          username,
          role: role as UserRole,
          status: "active",
          phone,
          cnic,
          systemAccess,
          mustChangePassword: mustChange,
          linkedTeacherId,
          permissions: isParent ? {} : permissions,
          createdBy: "current",
          createdAt: new Date().toISOString(),
          _password: password,
        };
        onCreate?.(created);
      }
      setSubmitting(false);
      onOpenChange(false);
    }, 400);
  }

  const stepDefs = [
    { n: 1, urdu: "شناخت", english: "Identity" },
    { n: 2, urdu: "کردار", english: "Role" },
    { n: 3, urdu: "اجازتیں", english: "Permissions" },
    { n: 4, urdu: "جائزہ", english: "Review" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
        {/* Header / stepper */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-urdu text-2xl font-bold leading-loose" dir="rtl" lang="ur">
                {isEdit ? "صارف میں ترمیم" : "نیا صارف بنائیں"}
              </h2>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">
                {isEdit ? "Edit User" : "Create New User"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stepDefs.map((s, i) => {
              const skipped = isParent && s.n === 3;
              const active = step === s.n;
              const done = stepOrder.indexOf(s.n) >= 0 && stepOrder.indexOf(s.n) < stepIdx;
              return (
                <div key={s.n} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 flex-1 min-w-0 transition-all",
                    active && "border-primary bg-primary/5",
                    done && "border-chart-1 bg-chart-1/5",
                    skipped && "opacity-30",
                  )}>
                    <div className={cn(
                      "h-6 w-6 rounded-full grid place-items-center text-[11px] font-semibold shrink-0",
                      active && "bg-primary text-primary-foreground",
                      done && "bg-chart-1 text-white",
                      !active && !done && "bg-muted text-muted-foreground",
                    )}>
                      {done ? <Check className="h-3 w-3" /> : s.n}
                    </div>
                    <div className="min-w-0">
                      <p className="font-urdu text-sm leading-tight truncate" dir="rtl" lang="ur">{s.urdu}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{s.english}</p>
                    </div>
                  </div>
                  {i < stepDefs.length - 1 && <div className="h-px w-2 bg-border" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body (scrollable) */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <BilingualLabel urdu="مکمل نام (اردو)" english="Full Name in Urdu" required>
                  <Input value={nameUrdu} onChange={(e) => setNameUrdu(e.target.value)} dir="rtl" lang="ur" className="font-urdu" placeholder="استاد محمد بلال" />
                </BilingualLabel>
              </div>
              <div className="md:col-span-2">
                <BilingualLabel urdu="مکمل نام (انگریزی)" english="Full Name in English">
                  <Input value={nameEnglish} onChange={(e) => setNameEnglish(e.target.value)} placeholder="Ustad Muhammad Bilal" />
                </BilingualLabel>
              </div>
              <BilingualLabel urdu="ای میل" english="Email Address" required>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@msmis.pk" disabled={isEdit} />
              </BilingualLabel>
              <BilingualLabel urdu="فون نمبر" english="Phone Number">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0312-3456789" />
              </BilingualLabel>
              <div className="md:col-span-2">
                <BilingualLabel urdu="شناختی کارڈ نمبر" english="CNIC">
                  <Input value={cnic} onChange={(e) => setCnic(formatCnic(e.target.value))} placeholder="17301-1234567-1" />
                </BilingualLabel>
              </div>

              {!isEdit && (
                <div className="md:col-span-2 rounded-xl bg-muted/40 border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-urdu text-sm font-semibold leading-loose" dir="rtl" lang="ur">خودکار پاس ورڈ</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Auto-generated Password</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm bg-background rounded-md border border-border px-3 py-2 break-all">
                      {revealPwd ? password : "•".repeat(password.length)}
                    </div>
                    <Button type="button" size="icon" variant="outline" onClick={() => setRevealPwd((v) => !v)} aria-label="Show/hide">
                      {revealPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => { navigator.clipboard?.writeText(password); toast.success("کاپی ہو گیا · Copied"); }} aria-label="Copy">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    <span className="font-urdu" dir="rtl" lang="ur">یہ پاس ورڈ صرف ایک بار دکھایا جائے گا</span>
                    {" · "}This password is shown only once — save it before proceeding.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-urdu text-lg font-bold leading-loose" dir="rtl" lang="ur">کردار منتخب کریں</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Select Role</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = role === opt.value;
                  const locked = isEdit; // cannot change role in edit mode
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={locked && !active}
                      onClick={() => !locked && setRole(opt.value)}
                      className={cn(
                        "text-start p-4 rounded-xl border-2 transition-all",
                        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                        locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <Icon className={cn("h-6 w-6 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                      <p className="font-urdu text-base font-bold leading-loose" dir="rtl" lang="ur">{opt.urdu}</p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">{opt.english}</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-snug">{opt.tagline}</p>
                    </button>
                  );
                })}
              </div>

              {!isParent && (
                <div>
                  <BilingualLabel urdu="سسٹم رسائی" english="System Access" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(["madrassa", "school", "both"] as const).map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setSystemAccess(v)}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 text-sm transition-all",
                          systemAccess === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40",
                        )}
                      >
                        <span className="font-urdu" dir="rtl" lang="ur">
                          {v === "madrassa" ? "مدرسہ" : v === "school" ? "اسکول" : "دونوں"}
                        </span>
                        <span className="ms-2 text-xs text-muted-foreground">
                          {v === "madrassa" ? "Madrassa" : v === "school" ? "School" : "Both"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-urdu text-sm font-medium leading-loose" dir="rtl" lang="ur">پہلے لاگ ان پر پاس ورڈ تبدیل کریں</Label>
                    <p className="text-[11px] text-muted-foreground">Require password change on first login</p>
                  </div>
                  <Switch checked={mustChange} onCheckedChange={setMustChange} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && !isParent && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-urdu text-lg font-bold leading-loose" dir="rtl" lang="ur">اجازتیں</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                    Permissions · Role defaults pre-loaded for {role}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {customizations > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-300/40 dark:bg-amber-950/40 dark:text-amber-300">
                      {customizations} customizations
                    </Badge>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => setPermissions(ROLE_DEFAULTS[role])}>
                    <span className="font-urdu">ڈیفالٹ پر واپس</span>
                    <span className="ms-1.5 text-xs text-muted-foreground">Reset</span>
                  </Button>
                </div>
              </div>
              <PermissionMatrix value={permissions} onChange={setPermissions} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Card className="p-5">
                <h4 className="font-urdu text-base font-bold leading-loose mb-3" dir="rtl" lang="ur">ذاتی معلومات</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Field label="Name (Urdu)" value={nameUrdu} />
                  <Field label="Name (English)" value={nameEnglish || "—"} />
                  <Field label="Email" value={email} />
                  <Field label="Phone" value={phone || "—"} />
                  <Field label="CNIC" value={cnic || "—"} />
                </dl>
              </Card>
              <Card className="p-5">
                <h4 className="font-urdu text-base font-bold leading-loose mb-3" dir="rtl" lang="ur">کردار و رسائی</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-sm"><span className="font-urdu">{ROLE_OPTIONS.find(r => r.value === role)?.urdu}</span></Badge>
                  {!isParent && (
                    <Badge variant="outline" className="text-sm">{systemAccess}</Badge>
                  )}
                  {mustChange && <Badge variant="outline">Force pwd change</Badge>}
                </div>
              </Card>
              {!isParent && (
                <Card className="p-5">
                  <h4 className="font-urdu text-base font-bold leading-loose mb-1" dir="rtl" lang="ur">اجازتوں کا خلاصہ</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Permissions Summary</p>
                  <div className="flex gap-4 text-sm mb-3 flex-wrap">
                    <span><strong>{Object.values(permissions).filter((p) => p?.view).length}</strong> modules</span>
                    <span><strong>{totalGrantedActions(permissions)}</strong> actions granted</span>
                    <span><strong>{customizations}</strong> customizations</span>
                  </div>
                  <PermissionSummary value={permissions} />
                </Card>
              )}
              {!isEdit && (
                <Card className="p-5 bg-amber-50 dark:bg-amber-950/30 border-amber-300/40">
                  <h4 className="font-urdu text-base font-bold leading-loose mb-1" dir="rtl" lang="ur">یہ اسناد محفوظ کریں</h4>
                  <p className="text-xs text-muted-foreground mb-3">Save these credentials — they will not be shown again.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm bg-background rounded border border-border px-3 py-2">{email}</code>
                    <code className="flex-1 font-mono text-sm bg-background rounded border border-border px-3 py-2">{password}</code>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card px-6 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={prev} disabled={stepIdx === 0} className="gap-1.5">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            <span className="font-urdu">پچھلا</span>
          </Button>
          {step !== 4 ? (
            <Button onClick={next} className="gap-1.5">
              <span className="font-urdu">اگلا</span>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="gap-1.5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="font-urdu">{isEdit ? "تبدیلیاں محفوظ کریں" : "صارف بنائیں"}</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  const parts = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter(Boolean);
  return parts.join("-");
}