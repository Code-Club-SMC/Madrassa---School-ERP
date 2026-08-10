import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, School, UserRound, UsersRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-context";
import { DraggableLanguageToggle } from "@/components/app/draggable-language-toggle";
import { useCustomAuth } from "@/lib/custom-auth-client";
import { toAppUser } from "@/lib/auth-session";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

type LoginMode = "staff" | "parent";

const institutionUnits = [
  "جامعہ قاسمیہ للبنین",
  "جامعہ زینب للبنات",
  "القاسم اکیڈمی",
  "شعبہ سکول معاونت",
];

function LoginPage() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const auth = useCustomAuth();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<LoginMode>("staff");
  const [staffEmail, setStaffEmail] = useState("");
  const [parentUsername, setParentUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const identifier = mode === "staff" ? staffEmail.trim() : parentUsername.trim().toLowerCase();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!identifier || !password) {
      setError(
        lang === "ur"
          ? "براہِ کرم لاگ اِن معلومات اور پاس ورڈ درج کریں"
          : "Please enter your login credentials and password",
      );
      return;
    }

    setSubmitting(true);
    try {
      const user = await auth.login({
        email: identifier.toLowerCase(),
        password,
      });

      const role = user.role;

      if (mode === "parent" && role !== "parent") {
        await auth.logout();
        setError(lang === "ur" ? "یہ والدین کا اکاؤنٹ نہیں ہے" : "This is not a parent account");
        return;
      }

      if (mode === "staff" && role === "parent") {
        await auth.logout();
        setError(
          lang === "ur"
            ? "والدین کے لیے والدین والا لاگ اِن استعمال کریں"
            : "Use the parent login for parent accounts",
        );
        return;
      }

      navigate({ to: redirect ?? (role === "parent" ? "/parents" : "/dashboard") });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "ur"
            ? "لاگ اِن نہیں ہو سکا، دوبارہ کوشش کریں"
            : "Login failed, please try again",
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
          <div className="space-y-3 text-right">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <School className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-urdu text-3xl font-bold leading-loose">
                {lang === "ur" ? "خوش آمدید" : "Welcome"}
              </p>
              <p className="font-urdu text-sm text-muted-foreground">
                {lang === "ur"
                  ? "اپنے اکاؤنٹ میں داخل ہونے کے لیے درست طریقہ منتخب کریں"
                  : "Select the correct method to log into your account"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background p-1.5 shadow-sm">
            <ModeButton
              active={mode === "staff"}
              icon={UsersRound}
              label={lang === "ur" ? "عملہ" : "Staff"}
              onClick={() => {
                setMode("staff");
                setError(null);
              }}
            />
            <ModeButton
              active={mode === "parent"}
              icon={UserRound}
              label={lang === "ur" ? "والدین" : "Parents"}
              onClick={() => {
                setMode("parent");
                setError(null);
              }}
            />
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-xl border border-border bg-background p-6 shadow-sm"
          >
            <div className="space-y-2 text-right">
              <label htmlFor="identifier" className="font-urdu text-sm font-medium">
                {mode === "staff"
                  ? lang === "ur"
                    ? "ای میل"
                    : "Email"
                  : lang === "ur"
                    ? "لاگ اِن آئی ڈی"
                    : "Login ID"}
              </label>
              <Input
                id="identifier"
                dir="ltr"
                type={mode === "staff" ? "email" : "text"}
                inputMode={mode === "staff" ? "email" : "text"}
                autoComplete={mode === "staff" ? "email" : "username"}
                placeholder={mode === "staff" ? "name@example.com" : "muhammad.yousaf4821"}
                value={mode === "staff" ? staffEmail : parentUsername}
                onChange={(event) =>
                  mode === "staff"
                    ? setStaffEmail(event.target.value)
                    : setParentUsername(event.target.value)
                }
                className="h-11 text-left"
              />
            </div>

            <div className="space-y-2 text-right">
              <label htmlFor="password" className="font-urdu text-sm font-medium">
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
              <Alert variant="destructive" className="text-right">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-urdu">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full gap-2 font-urdu text-base"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {lang === "ur" ? "داخل ہوں" : "Sign In"}
            </Button>
          </form>

          <div className="space-y-4 text-center">
            <p className="font-urdu text-sm leading-loose text-muted-foreground">
              {lang === "ur"
                ? "پاس ورڈ بھولنے پر دفتر یا منتظم سے رابطہ کریں"
                : "Contact the office or administrator if you forgot your password"}
            </p>
            <Link
              to="/apply"
              className="font-urdu text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {lang === "ur" ? "آن لائن داخلہ درخواست" : "Online Admission Application"}
            </Link>
          </div>
          <DraggableLanguageToggle className="fixed bottom-4 end-4" />
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
    </div>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof UsersRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-11 items-center justify-center gap-2 rounded-lg font-urdu text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
