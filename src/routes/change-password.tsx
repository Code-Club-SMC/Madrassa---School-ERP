import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { useState } from "react";

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
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const s = strengthOf(pw);
  const tone = s < 40 ? "bg-destructive" : s < 75 ? "bg-amber-500" : "bg-chart-1";

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center pt-24 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="font-heading">Set New Password</CardTitle>
          <p className="font-urdu text-sm text-muted-foreground">نیا پاس ورڈ مرتب کریں</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualLabel urdu="نیا پاس ورڈ" english="New Password" htmlFor="new">
            <Input id="new" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </BilingualLabel>
          <div>
            <Progress value={s} className={`h-1.5 [&>div]:${tone}`} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Strength: {s < 40 ? "Weak" : s < 75 ? "Medium" : "Strong"}
            </p>
          </div>
          <BilingualLabel urdu="پاس ورڈ کی تصدیق" english="Confirm Password" htmlFor="conf">
            <Input id="conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </BilingualLabel>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled={!pw || pw !== confirm}>
            <span className="font-urdu">تبدیل کریں</span>
            <span className="ms-2 text-xs opacity-80">Update password</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}