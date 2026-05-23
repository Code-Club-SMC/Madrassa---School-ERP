import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { School, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BilingualLabel } from "@/components/shared/bilingual-label";
import { institution } from "@/mock";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@msmis.pk");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password / ای میل اور پاس ورڈ درج کریں");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      navigate({ to: "/dashboard" });
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <div className="hidden lg:flex flex-col items-center justify-center bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="relative flex flex-col items-center text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center backdrop-blur">
            <School className="h-8 w-8 text-primary-foreground/90" />
          </div>
          <h1 className="font-urdu text-4xl font-bold leading-loose mt-6">{institution.nameUrdu}</h1>
          <p className="font-heading text-sm tracking-widest uppercase opacity-70 mt-1">{institution.nameEnglish}</p>
          <p className="font-urdu text-base text-primary-foreground/70 mt-6 leading-loose">{institution.motto}</p>
        </div>
        <p className="absolute bottom-6 text-xs font-heading text-primary-foreground/50 tracking-widest">MSMIS v1.0</p>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <School className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm">MSMIS</p>
              <p className="text-[10px] text-muted-foreground">Management System</p>
            </div>
          </div>

          <h2 className="font-heading text-2xl font-bold tracking-tight">Welcome Back</h2>
          <p className="font-urdu text-base text-muted-foreground mt-1">خوش آمدید — اپنے اکاؤنٹ میں داخل ہوں</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <BilingualLabel urdu="ای میل" english="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                placeholder="you@msmis.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </BilingualLabel>

            <BilingualLabel urdu="پاس ورڈ" english="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </BilingualLabel>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={submitting} className="w-full h-11">
              {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              <span className="font-urdu text-base">داخل ہوں</span>
              <span className="ms-2 text-xs opacity-80">Sign in</span>
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            Contact your administrator to reset your password
            <br />
            <span className="font-urdu text-sm">پاس ورڈ بھولنے پر ایڈمن سے رابطہ کریں</span>
          </p>

          <div className="mt-8 text-center">
            <Link to="/apply" className="text-xs text-primary hover:underline">
              <span className="font-urdu">آن لائن داخلہ درخواست</span>
              <span className="ms-2">· Apply Online</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}