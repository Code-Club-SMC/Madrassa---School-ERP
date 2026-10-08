import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/change-password")({
  component: ChangePassword,
});

function strengthOf(pw: string) {
  let s = 0;
  if (pw.length >= 8) s += 25;
  if (/[A-Z]/.test(pw)) s += 20;
  if (/[a-z]/.test(pw)) s += 20;
  if (/[0-9]/.test(pw)) s += 20;
  if (/[^A-Za-z0-9]/.test(pw)) s += 15;
  return Math.min(100, s);
}

function ChangePassword() {
  const navigate = useNavigate();
  const { changePassword, user } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const s = strengthOf(pw);
  const tone = s < 40 ? "bg-destructive" : s < 75 ? "bg-amber-500" : "bg-emerald-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPw) {
      setError("Please enter your current password");
      return;
    }
    if (pw.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: pw });
      toast.success("Password updated successfully");
      navigate({ to: "/settings/account" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update password";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-muted/30 flex items-start justify-center pt-16 px-4 pb-12">
      <Card className="w-full max-w-md shadow-md border-border/80">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings/account" className="text-xs text-muted-foreground gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Settings</span>
                </Link>
              </Button>
            </div>
            <CardTitle className="font-heading text-xl">Set New Password</CardTitle>
            <CardDescription className="font-urdu text-sm" dir="rtl" lang="ur">
              نیا پاس ورڈ مرتب کریں اور اپنے اکاؤنٹ کو محفوظ رکھیں
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}

            <BilingualLabel urdu="موجودہ پاس ورڈ" english="Current Password" htmlFor="curr">
              <Input
                id="curr"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                required
              />
            </BilingualLabel>

            <BilingualLabel urdu="نیا پاس ورڈ" english="New Password" htmlFor="new">
              <Input
                id="new"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                required
              />
            </BilingualLabel>

            {pw && (
              <div>
                <Progress value={s} className={`h-1.5 [&>div]:${tone}`} />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Strength: {s < 40 ? "Weak" : s < 75 ? "Medium" : "Strong"}
                </p>
              </div>
            )}

            <BilingualLabel urdu="پاس ورڈ کی تصدیق" english="Confirm Password" htmlFor="conf">
              <Input
                id="conf"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </BilingualLabel>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !currentPw || !pw || pw !== confirm}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span className="font-urdu">تبدیل کریں</span>
                  <span className="ms-2 text-xs opacity-80">Update password</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}