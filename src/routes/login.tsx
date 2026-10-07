
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, School, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-context";
import { DraggableLanguageToggle } from "@/components/app/draggable-language-toggle";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

const institutionUnits = [
  "جامعہ قاسمیہ للبنین",
  "جامعہ زینب للبنات",
  "القاسم اکیڈمی",
  "شعبہ سکول معاونت",
];

function LoginPage() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const auth = useAuth();
  const { redirect } = Route.useSearch();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      setError(
        lang === "ur"
          ? "براہِ کرم لاگ اِن معلومات اور پاس ورڈ درج کریں"
          : "Please enter your username/email and password",
      );
      return;
    }

    setSubmitting(true);
    try {
      const user = await auth.login({
        identifier: trimmed,
        password,
      });

      const role = user.role;
      let destination = redirect;
      if (!destination) {
        if (role === "parent") destination = "/parents";
        else if (role === "teacher") destination = "/dashboard";
        else if (role === "admission_admin") destination = "/admission";
        else if (role === "academic_admin") destination = "/madrassa/students";
        else if (role === "finance_admin" || role === "accountant") destination = "/finance";
        else if (role === "hr_admin" || role === "hr_manager") destination = "/hr";
        else if (role === "reports_admin") destination = "/reports";
        else destination = "/dashboard";
      }

      navigate({ to: destination });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "ur"
            ? "لاگ اِن نہیں ہو سکا، دوبارہ کوشش کریں"
            : "Login failed, please check your credentials and try again",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f7fbfa] text-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.9fr)]">
      <main
        className="flex min-h-dvh items-center justify-center px-5 py-10"
        dir={lang === "ur" ? "rtl" : "ltr"}
        lang={lang}
      >
        <div className="w-full max-w-[430px] space-y-8">
          <div className="space-y-3 text-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <School className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className={cn("text-3xl font-bold", lang === "ur" ? "font-urdu leading-loose" : "")}>
                {lang === "ur" ? "خوش آمدید" : "Welcome"}
              </p>
              <p className={cn("text-sm text-muted-foreground", lang === "ur" ? "font-urdu" : "")}>
                {lang === "ur"
                  ? "اپنے اکاؤنٹ (ایڈمن، استاد، یا سرپرست) میں داخل ہونے کے لیے معلومات درج کریں"
                  : "Sign in with your username/email and password (Admin, Teacher, or Parent)"}
              </p>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-xl border border-border bg-background p-6 shadow-sm"
          >
            <div className="space-y-2 text-start">
              <label htmlFor="identifier" className={cn("text-sm font-medium", lang === "ur" ? "font-urdu" : "")}>
                {lang === "ur" ? "ای میل یا یوزر نیم" : "Email or Username"}
              </label>
              <Input
                id="identifier"
                dir="ltr"
                type="text"
                autoComplete="username"
                placeholder={lang === "ur" ? "admin, teacher1@demo.local, parent1@demo.local" : "admin, teacher1@demo.local, parent1@demo.local"}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="h-11 text-left"
              />
            </div>

            <div className="space-y-2 text-start">
              <label htmlFor="password" className={cn("text-sm font-medium", lang === "ur" ? "font-urdu" : "")}>
                {lang === "ur" ? "پاس ورڈ" : "Password"}
              </label>
              <Input
                id="password"
                dir="ltr"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-11 text-left"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="text-start">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription className={lang === "ur" ? "font-urdu" : ""}>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className={cn("h-11 w-full gap-2 text-base", lang === "ur" ? "font-urdu" : "font-medium")}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {lang === "ur" ? "داخل ہوں" : "Sign In"}
            </Button>

            <div className="pt-2 border-t border-border/60">
              <Link
                to="/very/secret/data"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{lang === "ur" ? "🔑 ٹیسٹنگ اکاؤنٹس اور پاس ورڈز (/very/secret/data)" : "🔑 View All Test Accounts & Passwords (/very/secret/data)"}</span>
              </Link>
            </div>
          </form>

          <div className="space-y-4 text-center">
            <p className={cn("text-sm text-muted-foreground", lang === "ur" ? "font-urdu leading-loose" : "")}>
              {lang === "ur"
                ? "پاس ورڈ بھولنے پر دفتر یا منتظم سے رابطہ کریں"
                : "Contact the office or administrator if you forgot your password"}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link
                to="/apply"
                className={cn("font-medium text-primary underline-offset-4 hover:underline", lang === "ur" ? "font-urdu" : "")}
              >
                {lang === "ur" ? "آن لائن داخلہ درخواست" : "Online Admission Application"}
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link
                to="/"
                className={cn("text-muted-foreground hover:text-foreground underline-offset-4 hover:underline", lang === "ur" ? "font-urdu" : "")}
              >
                {lang === "ur" ? "مرکزی ویب سائٹ" : "Public Website"}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <aside
        className="relative hidden min-h-dvh overflow-hidden bg-primary text-primary-foreground lg:flex"
        dir={lang === "ur" ? "rtl" : "ltr"}
        lang={lang}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-xl flex-col justify-center px-12">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg border border-primary-foreground/25 bg-primary-foreground/10">
            <School className="h-7 w-7" />
          </div>
          <p className="font-urdu text-4xl font-bold leading-loose">
            {lang === "ur" ? "مدرسہ مینجمنٹ سسٹم" : "Madrassa Management System"}
          </p>
          <p className="font-urdu mt-3 max-w-md text-base leading-loose text-primary-foreground/75">
            {lang === "ur"
              ? "داخلہ، طلبہ، والدین، حاضری، فیس، امتحانات، اور مقامی اطلاعات کے لیے مرکزی نظام"
              : "Centralized system for admissions, students, parents, attendance, fees, exams, and local communications"}
          </p>

          <div className="mt-10 grid gap-3">
            {institutionUnits.map((name) => (
              <div
                key={name}
                className="rounded-lg border border-primary-foreground/18 bg-primary-foreground/8 px-4 py-3"
              >
                <p className="font-urdu text-base leading-loose">{name}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-urdu text-xs text-primary-foreground/45">
          {lang === "ur"
            ? "نظام برائے تعلیمی و انتظامی امور"
            : "System for educational and administrative affairs"}
        </p>
      </aside>
      <DraggableLanguageToggle className="fixed bottom-4 end-4 z-40" />
    </div>
  );
}
