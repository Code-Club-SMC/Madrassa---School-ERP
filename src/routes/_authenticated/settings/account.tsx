"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  UserCheck,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Building2,
  Languages,
  Sun,
  Moon,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Calendar,
  BadgeCheck,
  Save,
  Edit3,
  Loader2,
  IdCard,
  Briefcase,
  ShieldAlert,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "@/components/theme-provider";
import { institution } from "@/mock";
import { cn } from "@/lib/utils";

type AccountSearch = {
  tab?: "profile" | "security" | "preferences" | "session";
};

export const Route = createFileRoute("/_authenticated/settings/account")({
  validateSearch: (search: Record<string, unknown>): AccountSearch => ({
    tab: (search.tab as AccountSearch["tab"]) || "profile",
  }),
  component: AccountSettingsPage,
});

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function roleLabel(role: string, lang: "ur" | "en") {
  const isUrdu = lang === "ur";
  switch (role) {
    case "super_admin":
      return { en: "Super Administrator", ur: "سپروائزری ایڈمنسٹریٹر", badgeClass: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800" };
    case "admin":
      return { en: "Campus Administrator", ur: "کیمپس ایڈمنسٹریٹر", badgeClass: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" };
    case "finance_admin":
      return { en: "Finance Officer", ur: "مالیاتی افسر", badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" };
    case "academic_admin":
      return { en: "Academic In-Charge", ur: "تعلیمی ناظم", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" };
    case "teacher":
      return { en: "Faculty Teacher", ur: "استاد / مدرس", badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:indigo-blue-800" };
    case "parent":
      return { en: "Guardian / Parent", ur: "والد / سرپرست", badgeClass: "bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-800" };
    default:
      return { en: role.replace("_", " "), ur: role, badgeClass: "bg-muted text-muted-foreground" };
  }
}

function calculateStrength(pw: string) {
  let score = 0;
  if (!pw) return { score: 0, label: "Empty", color: "bg-muted" };
  if (pw.length >= 8) score += 25;
  if (pw.length >= 12) score += 10;
  if (/[A-Z]/.test(pw)) score += 20;
  if (/[a-z]/.test(pw)) score += 15;
  if (/[0-9]/.test(pw)) score += 15;
  if (/[^A-Za-z0-9]/.test(pw)) score += 15;

  score = Math.min(score, 100);
  if (score < 40) return { score, label: "Weak", labelUrdu: "کمزور", color: "bg-destructive" };
  if (score < 75) return { score, label: "Medium", labelUrdu: "درمیانہ", color: "bg-amber-500" };
  return { score, label: "Strong", labelUrdu: "مضبوط", color: "bg-emerald-500" };
}

function AccountSettingsPage() {
  const { tab = "profile" } = Route.useSearch();
  const [activeTab, setActiveTab] = useState<string>(tab);
  const { user, logout, changePassword, updateProfile } = useAuth();
  const { lang, setLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const isUrdu = lang === "ur";

  // Edit profile state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editNameUrdu, setEditNameUrdu] = useState(user?.nameUrdu || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editCnic, setEditCnic] = useState(user?.cnic || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Sign out state
  const [isSigningOut, setIsSigningOut] = useState(false);

  const roleInfo = roleLabel(user?.role ?? "user", lang);
  const strength = calculateStrength(newPassword);

  const handleOpenEdit = () => {
    setEditName(user?.name || "");
    setEditNameUrdu(user?.nameUrdu || "");
    setEditPhone(user?.phone || "");
    setEditCnic(user?.cnic || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error(isUrdu ? "نام لکھنا لازمی ہے" : "Name cannot be empty");
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        nameUrdu: editNameUrdu.trim() || undefined,
        phone: editPhone.trim() || undefined,
        cnic: editCnic.trim() || undefined,
      });
      toast.success(
        isUrdu ? "پروفائل کامیابی سے محفوظ ہو گئی" : "Profile updated successfully",
      );
      setIsEditDialogOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isUrdu
            ? "پروفائل اپ ڈیٹ نہیں ہو سکی"
            : "Failed to update profile",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError(isUrdu ? "موجودہ پاس ورڈ درج کریں" : "Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(
        isUrdu ? "نیا پاس ورڈ کم از کم 6 حروف پر مشتمل ہونا چاہیے" : "New password must be at least 6 characters",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(
        isUrdu ? "نیا پاس ورڈ اور تصدیقی پاس ورڈ مماثل نہیں ہیں" : "New password and confirmation do not match",
      );
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success(
        isUrdu ? "پاس ورڈ کامیابی کے ساتھ تبدیل ہو گیا" : "Password updated successfully",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isUrdu
            ? "پاس ورڈ تبدیل کرنے میں خرابی پیش آئی"
            : "Failed to update password";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Account & Security"
        titleUrdu="اکاؤنٹ اور سیکیورٹی ترتیبات"
        description="Manage your identity credentials, login security, personal information, and user interface preferences."
        descriptionUrdu="اپنے صارف کی شناخت، سیکیورٹی، ذاتی تفصیلات، اور ترجیحات کا انتظام کریں۔"
      />

      {/* Profile Summary Hero Card */}
      <Card className="overflow-hidden border-border/80 shadow-sm bg-gradient-to-br from-card via-card to-muted/20">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-primary/10 shadow-md shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl font-bold">
                {initials(user?.name ?? "MS")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {user?.name ?? "Signed In User"}
                </h2>
                <Badge variant="outline" className={cn("text-xs font-semibold py-0.5 px-2", roleInfo.badgeClass)}>
                  {isUrdu ? roleInfo.ur : roleInfo.en}
                </Badge>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3 me-1 inline" />
                  {isUrdu ? "فعال" : "Active"}
                </Badge>
              </div>

              {user?.nameUrdu && (
                <p className="font-urdu text-sm sm:text-base text-muted-foreground" dir="rtl" lang="ur">
                  {user.nameUrdu}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 opacity-70" />
                  {user?.email}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5 opacity-70" />
                    {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 opacity-70" />
                  <span className={isUrdu ? "font-urdu" : ""}>
                    {isUrdu ? institution.nameUrdu : institution.nameEnglish}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleOpenEdit} className="gap-2 shadow-xs">
                  <Edit3 className="h-4 w-4" />
                  <span>{isUrdu ? "پروفائل ترمیم کریں" : "Edit Profile"}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{isUrdu ? "پروفائل کی تفصیلات میں تبدیلی" : "Update Profile Details"}</DialogTitle>
                  <DialogDescription>
                    {isUrdu
                      ? "اپنا نام، اردو نام اور رابطہ نمبر درست کریں۔"
                      : "Modify your display name, Urdu name, and contact details."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name">{isUrdu ? "پورا نام (انگریزی)" : "Full Name (English)"}</Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Abir Afridi"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name-urdu" className="font-urdu">
                      {isUrdu ? "پورا نام (اردو میں)" : "Full Name (Urdu)"}
                    </Label>
                    <Input
                      id="edit-name-urdu"
                      value={editNameUrdu}
                      onChange={(e) => setEditNameUrdu(e.target.value)}
                      placeholder="مثال: مولانا محمد قاسم"
                      dir="rtl"
                      lang="ur"
                      className="font-urdu"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone">{isUrdu ? "موبائل فون نمبر" : "Phone Number"}</Label>
                    <Input
                      id="edit-phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="0300-1234567"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-cnic">{isUrdu ? "قومی شناختی کارڈ (CNIC)" : "National CNIC"}</Label>
                    <Input
                      id="edit-cnic"
                      value={editCnic}
                      onChange={(e) => setEditCnic(e.target.value)}
                      placeholder="17301-1234567-1"
                    />
                  </div>
                  <DialogFooter className="pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditDialogOpen(false)}
                      disabled={isSavingProfile}
                    >
                      {isUrdu ? "منسوخ" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={isSavingProfile} className="gap-2">
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{isUrdu ? "محفوظ کیا جا رہا ہے..." : "Saving..."}</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>{isUrdu ? "تبدیلیاں محفوظ کریں" : "Save Changes"}</span>
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5 shadow-xs">
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{isUrdu ? "سائن آؤٹ" : "Sign Out"}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{isUrdu ? "کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟" : "Confirm Sign Out"}</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isUrdu
                      ? "آپ کا موجودہ لاگ ان سیشن ختم ہو جائے گا اور آپ کو لاگ ان صفحہ پر بھیج دیا جائے گا۔"
                      : "Your current session token will be cleared and you will be returned to the login screen."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{isUrdu ? "منسوخ کریں" : "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSignOut}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                    ) : (
                      <LogOut className="h-4 w-4 me-1.5" />
                    )}
                    <span>{isUrdu ? "ہاں، سائن آؤٹ کریں" : "Sign Out"}</span>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-muted/60 border border-border/60">
          <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
            <UserCheck className="h-4 w-4" />
            <span>{isUrdu ? "پروفائل کی تفصیلات" : "Profile Details"}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs sm:text-sm">
            <KeyRound className="h-4 w-4" />
            <span>{isUrdu ? "پاس ورڈ و سیکیورٹی" : "Security & Password"}</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 text-xs sm:text-sm">
            <Languages className="h-4 w-4" />
            <span>{isUrdu ? "ظاہری وضع و زبان" : "Preferences"}</span>
          </TabsTrigger>
          <TabsTrigger value="session" className="gap-2 text-xs sm:text-sm">
            <ShieldAlert className="h-4 w-4" />
            <span>{isUrdu ? "سیشن اور لاگ آؤٹ" : "Session & Logout"}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Profile Details */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <span>{isUrdu ? "بنیادی شناختی معلومات" : "Identity Information"}</span>
                </CardTitle>
                <CardDescription>
                  {isUrdu ? "ادارے کے ریکارڈ میں درج شدہ ذاتی تفصیلات" : "Institutional user profile and contact credentials"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{isUrdu ? "نام (انگریزی)" : "Full Name"}</span>
                  <span className="font-medium text-foreground">{user?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{isUrdu ? "نام (اردو)" : "Name (Urdu)"}</span>
                  <span className="font-urdu font-medium text-foreground" dir="rtl" lang="ur">
                    {user?.nameUrdu || (isUrdu ? "درج نہیں" : "Not specified")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{isUrdu ? "ای میل / یوزرنیم" : "Email / Username"}</span>
                  <span className="font-mono text-xs text-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{isUrdu ? "موبائل فون" : "Phone Number"}</span>
                  <span className="text-foreground">{user?.phone || (isUrdu ? "درج نہیں" : "Not specified")}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">{isUrdu ? "قومی شناختی کارڈ" : "CNIC Number"}</span>
                  <span className="font-mono text-xs text-foreground">
                    {user?.cnic || (isUrdu ? "درج نہیں" : "Not specified")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>{isUrdu ? "عہدہ اور اختیارات" : "Role & Organization Scope"}</span>
                </CardTitle>
                <CardDescription>
                  {isUrdu ? "سسٹم میں تفویض کردہ اختیارات اور برانچ" : "System access permission boundaries and assigned scope"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{isUrdu ? "سسٹم کردار" : "Assigned Role"}</span>
                  <Badge variant="outline" className={cn("text-xs font-semibold py-0.5 px-2", roleInfo.badgeClass)}>
                    {isUrdu ? roleInfo.ur : roleInfo.en}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{isUrdu ? "سسٹم رسائی دائرہ" : "System Access"}</span>
                  <span className="font-medium text-foreground">
                    {user?.systemAccess === "madrassa"
                      ? isUrdu
                        ? "صرف مدرسہ"
                        : "Madrassa Only"
                      : user?.systemAccess === "school"
                        ? isUrdu
                          ? "صرف اسکول"
                          : "School Only"
                        : isUrdu
                          ? "مدرسہ و اسکول (مشترکہ)"
                          : "Combined (Madrassa & School)"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{isUrdu ? "شعبہ / ڈیپارٹمنٹ" : "Department"}</span>
                  <span className="text-foreground">{user?.department || (isUrdu ? "عام انتظامیہ" : "General Administration")}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{isUrdu ? "عہدہ" : "Designation"}</span>
                  <span className="text-foreground">{user?.designation || (isUrdu ? "ایڈمنسٹریٹر" : "Administrator")}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">{isUrdu ? "اکاؤنٹ کی حیثیت" : "Account Status"}</span>
                  <span className="inline-flex items-center text-emerald-600 font-medium text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 me-1.5 animate-pulse" />
                    {isUrdu ? "فعال اور تصدیق شدہ" : "Active & Verified"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Security & Password */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>{isUrdu ? "پاس ورڈ تبدیل کریں" : "Change Password"}</span>
                </CardTitle>
                <CardDescription>
                  {isUrdu
                    ? "اپنے اکاؤنٹ کے تحفظ کے لیے مضبوط پاس ورڈ استعمال کریں"
                    : "Ensure your account is protected with a unique and complex password"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleChangePassword}>
                <CardContent className="space-y-4">
                  {passwordError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="current-pw">{isUrdu ? "موجودہ پاس ورڈ" : "Current Password"}</Label>
                    <div className="relative">
                      <Input
                        id="current-pw"
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="pe-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-pw">{isUrdu ? "نیا پاس ورڈ" : "New Password"}</Label>
                    <div className="relative">
                      <Input
                        id="new-pw"
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="pe-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{isUrdu ? "پاس ورڈ کی مضبوطی" : "Strength"}</span>
                          <span className={cn("font-semibold", strength.score >= 75 ? "text-emerald-600" : strength.score >= 40 ? "text-amber-600" : "text-destructive")}>
                            {isUrdu ? strength.labelUrdu : strength.label}
                          </span>
                        </div>
                        <Progress value={strength.score} className={cn("h-1.5", `[&>div]:${strength.color}`)} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pw">{isUrdu ? "نئے پاس ورڈ کی تصدیق" : "Confirm New Password"}</Label>
                    <div className="relative">
                      <Input
                        id="confirm-pw"
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="pe-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button type="submit" disabled={isUpdatingPassword || !currentPassword || !newPassword} className="gap-2">
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{isUrdu ? "تبدیل کیا جا رہا ہے..." : "Updating Password..."}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>{isUrdu ? "پاس ورڈ تبدیل کریں" : "Update Password"}</span>
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card className="border-border/80 shadow-xs bg-muted/20">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{isUrdu ? "سیکیورٹی کے معیارات" : "Security Standards"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{isUrdu ? "پاس ورڈ میں کم از کم 8 حروف شامل کریں" : "At least 8 characters in length"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{isUrdu ? "بڑے اور چھوٹے انگریزی حروف کا امتزاج" : "Combination of uppercase and lowercase letters"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{isUrdu ? "اعداد (0-9) اور خاص علامات (!@#$)" : "Incorporate numerals and special symbols"}</span>
                </div>
                <div className="pt-3 border-t border-border/60">
                  <p className="leading-relaxed">
                    {isUrdu
                      ? "تمام پاس ورڈز محفوظ طریقے سے bcrypt الگورتھم کے ساتھ ہیش کیے جاتے ہیں اور سیشن HMAC-SHA256 کے ساتھ محفوظ ہیں۔"
                      : "Passwords are cryptographic bcrypt hashes. Active browser sessions are signed with HMAC-SHA256 tokens."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: Preferences & Interface */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Languages className="h-4 w-4 text-primary" />
                  <span>{isUrdu ? "سسٹم کی بنیادی زبان" : "System Language"}</span>
                </CardTitle>
                <CardDescription>
                  {isUrdu ? "پورے سافٹ ویئر کا یوزر انٹرفیس اردو یا انگریزی میں تبدیل کریں" : "Switch user interface between Urdu and English"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  onClick={() => setLang("ur")}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                    lang === "ur"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🇵🇰</span>
                    <div>
                      <p className="font-urdu font-semibold text-base leading-tight">اردو (Urdu)</p>
                      <p className="text-xs text-muted-foreground">دائیں سے بائیں (RTL) مکمل اردو ترجمہ</p>
                    </div>
                  </div>
                  {lang === "ur" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>

                <div
                  onClick={() => setLang("en")}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                    lang === "en"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🇬🇧</span>
                    <div>
                      <p className="font-semibold text-sm leading-tight">English</p>
                      <p className="text-xs text-muted-foreground">Left-to-right (LTR) standard English</p>
                    </div>
                  </div>
                  {lang === "en" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                  <span>{isUrdu ? "رنگین تھیم" : "Color Theme"}</span>
                </CardTitle>
                <CardDescription>
                  {isUrdu ? "روشن یا تاریک موڈ کا انتخاب کریں" : "Toggle between Light and Dark interface appearance"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  onClick={() => {
                    if (theme !== "light") toggleTheme();
                  }}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                    theme === "light"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{isUrdu ? "روشن موڈ (Light)" : "Light Mode"}</p>
                      <p className="text-xs text-muted-foreground">{isUrdu ? "دن کے وقت استعمال کے لیے موزوں" : "Best for daytime and well-lit spaces"}</p>
                    </div>
                  </div>
                  {theme === "light" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>

                <div
                  onClick={() => {
                    if (theme !== "dark") toggleTheme();
                  }}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                    theme === "dark"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{isUrdu ? "تاریک موڈ (Dark)" : "Dark Mode"}</p>
                      <p className="text-xs text-muted-foreground">{isUrdu ? "آنکھوں کی حفاظت اور رات کا استعمال" : "Easier on eyes in dim environments"}</p>
                    </div>
                  </div>
                  {theme === "dark" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: Session & Danger Zone */}
        <TabsContent value="session" className="space-y-6">
          <Card className="border-border/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{isUrdu ? "موجودہ فعال سیشن" : "Active Web Session"}</span>
              </CardTitle>
              <CardDescription>
                {isUrdu ? "آپ کے موجودہ براؤزر کنکشن کی تفصیلات" : "Information about this active browser login instance"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">{isUrdu ? "سیشن اسٹیٹس" : "Session State"}</span>
                <span className="inline-flex items-center text-emerald-600 font-medium text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 me-1.5 animate-pulse" />
                  {isUrdu ? "محفوظ سیشن فعال ہے" : "Encrypted & Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">{isUrdu ? "ادارہ / برانچ" : "Institution Instance"}</span>
                <span className={cn("font-medium", isUrdu && "font-urdu")} dir={isUrdu ? "rtl" : "ltr"}>
                  {isUrdu ? institution.nameUrdu : institution.nameEnglish}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">{isUrdu ? "سیشن میعاد" : "Cookie Expiration"}</span>
                <span className="text-muted-foreground text-xs">{isUrdu ? "7 دن خودکار تجدید" : "7 days with rolling renewal"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                <span>{isUrdu ? "سسٹم سے سائن آؤٹ کریں" : "Sign Out of MSMIS"}</span>
              </CardTitle>
              <CardDescription className="text-destructive/80">
                {isUrdu
                  ? "سائن آؤٹ کرنے سے آپ کی تمام موجودہ اسکرینیں اور سیشن کوکیز ختم ہو جائیں گی۔ دوبارہ داخلے کے لیے نیا پاس ورڈ درکار ہوگا۔"
                  : "Logging out clears all authentication cookies and securely ends your session across all tabs in this browser."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>{isUrdu ? "ابھی سائن آؤٹ کریں" : "Sign Out Now"}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      <span>{isUrdu ? "سائن آؤٹ کی تصدیق" : "Confirm Sign Out"}</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isUrdu
                        ? "کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟ آپ کا سیشن ختم ہو جائے گا اور آپ لاگ ان اسکرین پر واپس آ جائیں گے۔"
                        : "Are you sure you want to log out? Your session will end immediately and you will return to the login screen."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{isUrdu ? "منسوخ" : "Cancel"}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSignOut}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? (
                        <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                      ) : (
                        <LogOut className="h-4 w-4 me-1.5" />
                      )}
                      <span>{isUrdu ? "سائن آؤٹ کریں" : "Sign Out"}</span>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

