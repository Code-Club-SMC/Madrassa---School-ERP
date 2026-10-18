import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { PermissionMatrix } from "./permission-matrix";
import { resolveDisplayPerms } from "./resolve-perms";
import { formatDate } from "@/lib/format";
import type { User } from "@/types";
import { toast } from "sonner";
import { Copy, Check, Eye, EyeOff, KeyRound, Pencil, CheckCircle2, RefreshCw } from "lucide-react";

import { useLanguage } from "@/components/language-context";
import { getUserDisplayName, getUserInitials, ROLE_LABELS, ACCESS_LABELS, STATUS_LABELS } from "@/lib/user-names";
import { resolveUserPassword } from "@/lib/user-passwords";
import { generateSecurePassword } from "@/lib/generate-password";

type Props = { user: User | null; onClose: () => void; onUserUpdated?: (user: User) => void };

export function UserDetailSheet({ user, onClose, onUserUpdated }: Props) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [customPassword, setCustomPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);

  useEffect(() => {
    setIsEditingPassword(false);
    setCustomPassword("");
    setCurrentPassword(user?.initialPassword || null);
  }, [user?.id, user?.initialPassword]);

  if (!user) return null;
  const initials = getUserInitials(user, lang);
  const perms = resolveDisplayPerms(user);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(isUrdu ? `${label} کاپی ہو گیا` : `${label} copied to clipboard!`, { duration: 1800 });
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const resolved = resolveUserPassword(user);
  const realPassword = currentPassword || user.initialPassword || resolved.password;
  const isSavedPassword = Boolean(currentPassword || user.initialPassword || resolved.isRealPassword);

  const handleSavePassword = async () => {
    const pwdToSave = customPassword.trim();
    if (pwdToSave.length < 6) {
      toast.error(isUrdu ? "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے" : "Password must be at least 6 characters");
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: pwdToSave, mustChangePassword: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Failed to update password");
      }
      const updatedUser: User = { ...user, initialPassword: pwdToSave };
      setCurrentPassword(pwdToSave);
      setIsEditingPassword(false);
      setShowPassword(true);
      toast.success(isUrdu ? "پاس ورڈ کامیابی سے تبدیل ہو گیا!" : "Password updated successfully!");
      onUserUpdated?.(updatedUser);
    } catch (err: any) {
      toast.error(err?.message || (isUrdu ? "پاس ورڈ تبدیل نہیں ہو سکا" : "Failed to update password"));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Sheet open={!!user} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" side="right">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-2xl">
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle>
                <span
                  className={isUrdu ? "font-urdu text-xl block leading-loose" : "font-sans text-xl font-bold block"}
                  dir={isUrdu ? "rtl" : "ltr"}
                  lang={lang}
                >
                  {getUserDisplayName(user, lang)}
                </span>
              </SheetTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <StatusBadge status={user.role || "teacher"} />
                <StatusBadge status={user.status || "active"} />
                {user.systemAccess && (
                  <Badge variant="outline">
                    {isUrdu ? ACCESS_LABELS[user.systemAccess]?.ur ?? user.systemAccess : ACCESS_LABELS[user.systemAccess]?.en ?? user.systemAccess}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList>
            <TabsTrigger value="details">{isUrdu ? "تفصیل" : "Details"}</TabsTrigger>
            <TabsTrigger value="perms">{isUrdu ? "اجازتیں" : "Permissions"}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <dl className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {/* Email row with Copy */}
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  {isUrdu ? (
                    <p className="font-urdu text-sm leading-loose" dir="rtl" lang="ur">ای میل</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-medium font-mono select-all truncate">{user.email || "—"}</span>
                  {user.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => copyToClipboard(user.email, isUrdu ? "ای میل" : "Email", "email")}
                      title={isUrdu ? "ای میل کاپی کریں" : "Copy email"}
                    >
                      {copiedKey === "email" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Real Password row */}
              <div className="flex flex-col gap-2.5 px-4 py-3 bg-muted/25">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary shrink-0" />
                    {isUrdu ? (
                      <p className="font-urdu text-sm leading-loose" dir="rtl" lang="ur">اصل لاگ ان پاس ورڈ</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Real Login Password</p>
                    )}
                    {isSavedPassword ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] px-1.5 py-0 h-4">
                        {isUrdu ? "فعال لاگ ان پاس ورڈ" : "Active Password"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[9px] px-1.5 py-0 h-4">
                        {isUrdu ? "مخصوص پاس ورڈ" : "Unique Password"}
                      </Badge>
                    )}
                  </div>
                  {!isEditingPassword && user.role !== "super_admin" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setCustomPassword(realPassword);
                        setIsEditingPassword(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      <span>{isUrdu ? "تبدیل کریں" : "Change"}</span>
                    </Button>
                  )}
                </div>

                {!isEditingPassword ? (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="px-3 py-1 rounded bg-background border border-border font-mono text-sm font-semibold select-all">
                        {showPassword ? realPassword : "•".repeat(Math.min(realPassword.length, 12))}
                      </code>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        title={showPassword ? (isUrdu ? "پاس ورڈ چھپائیں" : "Hide password") : (isUrdu ? "پاس ورڈ دیکھیں" : "Show password")}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(realPassword, isUrdu ? "پاس ورڈ" : "Password", "password")}
                        title={isUrdu ? "پاس ورڈ کاپی کریں" : "Copy password"}
                      >
                        {copiedKey === "password" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/60 bg-background/60 p-2.5 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder={isUrdu ? "نیا پاس ورڈ درج کریں" : "Enter new password"}
                        className="h-8 font-mono text-xs flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs px-2 shrink-0 gap-1"
                        onClick={() => setCustomPassword(generateSecurePassword())}
                        title={isUrdu ? "نیا محفوظ پاس ورڈ بنائیں" : "Generate secure password"}
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>{isUrdu ? "نیا بنائیں" : "Random"}</span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setIsEditingPassword(false)}
                        disabled={isSavingPassword}
                      >
                        {isUrdu ? "منسوخ" : "Cancel"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs px-3 gap-1 bg-primary text-primary-foreground"
                        onClick={handleSavePassword}
                        disabled={isSavingPassword || !customPassword.trim()}
                      >
                        {isSavingPassword ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        <span>{isUrdu ? "محفوظ کریں" : "Save Password"}</span>
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                  {isUrdu
                    ? "یہ اصل پاس ورڈ پورٹل لاگ ان (/login) پر فوری کام کرتا ہے۔"
                    : "This real password works immediately on the portal login screen (/login)."}
                </p>
              </div>

              <Row urdu="فون" en="Phone" value={user.phone ?? "—"} />
              <Row urdu="شناختی کارڈ" en="CNIC" value={maskCnic(user.cnic)} />
              <Row
                urdu="کردار"
                en="Role"
                value={(isUrdu ? ROLE_LABELS[user.role]?.ur : ROLE_LABELS[user.role]?.en) ?? user.role ?? "—"}
              />
              <Row
                urdu="سسٹم رسائی"
                en="System Access"
                value={isUrdu ? (ACCESS_LABELS[user.systemAccess ?? ""]?.ur ?? user.systemAccess ?? "—") : (ACCESS_LABELS[user.systemAccess ?? ""]?.en ?? user.systemAccess ?? "—")}
              />
              <Row
                urdu="آخری لاگ ان"
                en="Last Login"
                value={user.lastLoginAt ? formatDate(user.lastLoginAt) : (isUrdu ? "کبھی نہیں" : "Never")}
              />
              <Row
                urdu="بنانے والا"
                en="Created By"
                value={user.createdBy ? `${user.createdBy} · ${formatDate(user.createdAt)}` : (user.createdAt ? formatDate(user.createdAt) : "—")}
              />
              <Row
                urdu="کیفیت"
                en="Status"
                value={(isUrdu ? STATUS_LABELS[user.status ?? ""]?.ur : STATUS_LABELS[user.status ?? ""]?.en) ?? user.status ?? "—"}
              />
            </dl>
          </TabsContent>

          <TabsContent value="perms" className="mt-4">
            <PermissionMatrix value={perms} readOnly />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Row({ urdu, en, value }: { urdu: string; en: string; value: string }) {
  const { lang } = useLanguage();
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        {lang === "ur" ? (
          <p className="font-urdu text-sm leading-loose" dir="rtl" lang="ur">{urdu}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{en}</p>
        )}
      </div>
      <p className="text-sm font-medium text-end break-all">{value}</p>
    </div>
  );
}

function maskCnic(c?: string) {
  if (!c) return "—";
  const str = String(c);
  const last = str.slice(-1);
  return `XXXXX-XXXXXXX-${last}`;
}