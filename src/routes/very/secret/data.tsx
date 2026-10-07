import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldAlert,
  Copy,
  Check,
  LogIn,
  KeyRound,
  UserCheck,
  Search,
  School,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Users,
  GraduationCap,
  Calculator,
  UserCog,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { loginServer } from "@/lib/auth.server";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/very/secret/data")({
  head: () => ({
    meta: [
      { title: "Institutional Testing Credentials — Secret Directory" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SecretCredentialsPage,
});

type CredentialItem = {
  id: string;
  category: "super_admin" | "sub_admin" | "teacher" | "parent";
  role: string;
  roleTitleEn: string;
  roleTitleUr: string;
  nameEn: string;
  nameUr: string;
  email: string;
  password: string;
  detailsEn: string;
  detailsUr: string;
  targetUrl: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
};

const CREDENTIALS: CredentialItem[] = [
  // --- SUPER ADMIN ---
  {
    id: "sa-1",
    category: "super_admin",
    role: "super_admin",
    roleTitleEn: "Super Admin (Primary)",
    roleTitleUr: "سپر ایڈمن (مرکزی)",
    nameEn: "System Administrator",
    nameUr: "مرکزی سسٹم منتظم",
    email: "admin@example.com",
    password: "admin123",
    detailsEn: "Full access to all 4 campuses, all administrative modules, settings, and users.",
    detailsUr: "چاروں کیمپسز، تمام انتظامی شعبہ جات اور ترتیبات پر مکمل اختیارات۔",
    targetUrl: "/dashboard",
  },
  {
    id: "sa-2",
    category: "super_admin",
    role: "super_admin",
    roleTitleEn: "Super Admin (MSMIS Domain)",
    roleTitleUr: "سپر ایڈمن (ادارہ جاتی)",
    nameEn: "Super Admin",
    nameUr: "سپر ایڈمن",
    email: "admin@msmis.pk",
    password: "Admin@123",
    detailsEn: "Alternative institutional login credentials with full administrative control.",
    detailsUr: "مکمل اختیارات کے ساتھ متبادل ادارہ جاتی اکاؤنٹ۔",
    targetUrl: "/dashboard",
  },

  // --- SUB-ADMINS ---
  {
    id: "adm-1",
    category: "sub_admin",
    role: "admission_admin",
    roleTitleEn: "Admission Admin",
    roleTitleUr: "ایڈمیشن ایڈمن",
    nameEn: "Admission Office Head",
    nameUr: "نگرانِ شعبہ داخلہ",
    email: "admission@demo.local",
    password: "Admin@123",
    detailsEn: "Admission applications queue, walk-in student forms, interviews & ID cards generation.",
    detailsUr: "داخلہ درخواستیں، نئے داخلے، انٹرویوز اور شناختی کارڈز کا انتظام۔",
    targetUrl: "/admission",
  },
  {
    id: "acad-1",
    category: "sub_admin",
    role: "academic_admin",
    roleTitleEn: "Academic Admin",
    roleTitleUr: "تعلیمی ایڈمن",
    nameEn: "Academic Controller",
    nameUr: "نگرانِ تعلیمی امور",
    email: "academic@demo.local",
    password: "Admin@123",
    detailsEn: "Madrassa & School student records, Hifz tracking, classes, timetables, and exams workspace.",
    detailsUr: "طلبہ کے کوائف، حفظ ریکارڈ، کلاسز، ٹائم ٹیبل اور امتحانات کی نگرانی۔",
    targetUrl: "/madrassa/students",
  },
  {
    id: "fin-1",
    category: "sub_admin",
    role: "finance_admin",
    roleTitleEn: "Finance Admin",
    roleTitleUr: "مالیاتی ایڈمن",
    nameEn: "Finance Director / Accountant",
    nameUr: "محاسب / فنانس ڈائریکٹر",
    email: "finance@demo.local",
    password: "Admin@123",
    detailsEn: "Madrassa & School fee collection, discount concessions, donation receipts, and annual audit reports.",
    detailsUr: "فیس کی وصولی، رعایت، عطیات کی رسیدیں اور تفصیلی مالیاتی آڈٹ رپورٹس۔",
    targetUrl: "/finance",
  },
  {
    id: "hr-1",
    category: "sub_admin",
    role: "hr_admin",
    roleTitleEn: "HR Admin",
    roleTitleUr: "ایچ آر ایڈمن",
    nameEn: "HR & Staff Manager",
    nameUr: "نگرانِ عملہ و انسانی وسائل",
    email: "hr@demo.local",
    password: "Admin@123",
    detailsEn: "Staff directory, teachers, daily attendance (present/absent/leave), leaves, holidays, users & SMS templates.",
    detailsUr: "ملازمین، اساتذہ، روزانہ حاضری، چھٹیاں، تعطیلات، یوزر اکاؤنٹس اور ایس ایم ایس۔",
    targetUrl: "/hr",
  },
  {
    id: "rep-1",
    category: "sub_admin",
    role: "reports_admin",
    roleTitleEn: "Reports & Audit Admin",
    roleTitleUr: "رپورٹس و آڈٹ ایڈمن",
    nameEn: "Audit & Statistics Officer",
    nameUr: "افسر شماریات و آڈٹ",
    email: "reports@demo.local",
    password: "Admin@123",
    detailsEn: "Executive institutional analytics, attendance trends, exam results analysis, and multi-campus breakdowns.",
    detailsUr: "جامع ادارہ جاتی اعداد و شمار، حاضری کے رحجانات اور امتحانی نتائج کا تجزیہ۔",
    targetUrl: "/reports",
  },

  // --- TEACHERS ---
  {
    id: "t-1",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Madrassa Senior Teacher",
    roleTitleUr: "سینئر استاد (مدرسہ)",
    nameEn: "Maulana Abdul Rehman",
    nameUr: "مولانا عبدالرحمٰن",
    email: "teacher1@demo.local",
    password: "Teacher@123",
    detailsEn: "Jamia Qasmia Baneen • Subject: Quran & Tajweed • Full Teacher Portal.",
    detailsUr: "جامعہ قاسمیہ بنین • مضمون: قرآن و تجوید • استاد پورٹل۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-2",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Madrassa Teacher",
    roleTitleUr: "استاد درسِ نظامی",
    nameEn: "Ustad Muhammad Yasin",
    nameUr: "استاد محمد یاسین",
    email: "teacher2@demo.local",
    password: "Teacher@123",
    detailsEn: "Jamia Qasmia Baneen • Subject: Nahw (Arabic Grammar).",
    detailsUr: "جامعہ قاسمیہ بنین • مضمون: علم النحو۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-3",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Girls Madrassa Teacher",
    roleTitleUr: "معلمہ (مدرسہ گرلز)",
    nameEn: "Qaria Sakina Noor",
    nameUr: "قاریہ سکینہ نور",
    email: "teacher3@demo.local",
    password: "Teacher@123",
    detailsEn: "Jamia Zainab Lil-Banat • Subject: Tajweed & Qiraat.",
    detailsUr: "جامعہ زینب بنات • مضمون: تجوید و قراءت۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-4",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Boys School Teacher",
    roleTitleUr: "اسکول استاد (بوائز)",
    nameEn: "Nadeem Ahmad",
    nameUr: "ندیم احمد",
    email: "teacher4@demo.local",
    password: "Teacher@123",
    detailsEn: "Al-Qasim Academy • Subject: Mathematics (Classes 7-10).",
    detailsUr: "القاسم اکیڈمی • مضمون: ریاضی (جماعت ہفتم تا دہم)۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-5",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Boys School Teacher",
    roleTitleUr: "اسکول استاد (بوائز)",
    nameEn: "Sadia Iqbal",
    nameUr: "سعدیہ اقبال",
    email: "teacher5@demo.local",
    password: "Teacher@123",
    detailsEn: "Al-Qasim Academy • Subject: English Language & Literature.",
    detailsUr: "القاسم اکیڈمی • مضمون: انگریزی۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-6",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Boys School Science Teacher",
    roleTitleUr: "سائنس استاد (بوائز)",
    nameEn: "Kamran Shah",
    nameUr: "کامران شاہ",
    email: "teacher6@demo.local",
    password: "Teacher@123",
    detailsEn: "Al-Qasim Academy • Subject: General Science & Physics.",
    detailsUr: "القاسم اکیڈمی • مضمون: سائنس و طبیعیات۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-7",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Boys School Teacher",
    roleTitleUr: "اردو استاد (بوائز)",
    nameEn: "Rehana Kausar",
    nameUr: "ریحانہ کوثر",
    email: "teacher7@demo.local",
    password: "Teacher@123",
    detailsEn: "Al-Qasim Academy • Subject: Urdu & Social Studies.",
    detailsUr: "القاسم اکیڈمی • مضمون: اردو و معاشرتی علوم۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-8",
    category: "teacher",
    role: "principal",
    roleTitleEn: "Academy Principal",
    roleTitleUr: "پرنسپل اکیڈمی",
    nameEn: "Bilal Ahmed",
    nameUr: "بلال احمد",
    email: "teacher8@demo.local",
    password: "Teacher@123",
    detailsEn: "Al-Qasim Academy • Academic Head & Pakistan Studies Teacher.",
    detailsUr: "القاسم اکیڈمی • پرنسپل و نگرانِ نصاب۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-9",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Hadith Scholar",
    roleTitleUr: "شیخ الحدیث",
    nameEn: "Haji Ghulam Abbas",
    nameUr: "حاجی غلام عباس",
    email: "teacher9@demo.local",
    password: "Teacher@123",
    detailsEn: "Jamia Qasmia Baneen • Subject: Hadith Sharif & Usul.",
    detailsUr: "جامعہ قاسمیہ بنین • مضمون: حدیث شریف و اصول۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-10",
    category: "teacher",
    role: "accountant",
    roleTitleEn: "Campus Accountant",
    roleTitleUr: "کیمپس محاسب",
    nameEn: "Zarina Bibi",
    nameUr: "زرینہ بی بی",
    email: "teacher10@demo.local",
    password: "Teacher@123",
    detailsEn: "Jamia Zainab Lil-Banat • Accounts & Balaqi.",
    detailsUr: "جامعہ زینب بنات • اکاؤنٹنٹ و معلمہ۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-11",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Tajweed Teacher (Girls)",
    roleTitleUr: "معلمہ تجوید (گرلز)",
    nameEn: "Shabana Kausar",
    nameUr: "شبانہ کوثر",
    email: "teacher11@demo.local",
    password: "Teacher@123",
    detailsEn: "Jamia Zainab Lil-Banat • Subject: Tajweed & Nazira.",
    detailsUr: "جامعہ زینب بنات • مضمون: تجوید و ناظرہ۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-12",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Girls School Teacher",
    roleTitleUr: "اسکول معلمہ (گرلز)",
    nameEn: "Rabia Noor",
    nameUr: "رابعہ نور",
    email: "teacher12@demo.local",
    password: "Teacher@123",
    detailsEn: "Al-Zainab School • Subject: Urdu & Social Sciences.",
    detailsUr: "الزینب اسکول • مضمون: اردو و اسلامیات۔",
    targetUrl: "/dashboard",
  },
  {
    id: "t-13",
    category: "teacher",
    role: "teacher",
    roleTitleEn: "Girls School English Teacher",
    roleTitleUr: "انگریزی معلمہ (گرلز)",
    nameEn: "Amna Aslam",
    nameUr: "آمنہ اسلم",
    email: "teacher13@demo.local",
    password: "Teacher@123",
    detailsEn: "Al-Zainab School • Subject: English & Elementary Science.",
    detailsUr: "الزینب اسکول • مضمون: انگریزی و سائنس۔",
    targetUrl: "/dashboard",
  },

  // --- PARENTS ---
  {
    id: "p-1",
    category: "parent",
    role: "parent",
    roleTitleEn: "Parent / Guardian",
    roleTitleUr: "والد / سرپرست",
    nameEn: "Yusuf Qureshi (Parent of Zaid)",
    nameUr: "یوسف قریشی (والد زید قریشی)",
    email: "parent1@demo.local",
    password: "Parent@123",
    detailsEn: "Linked Student: Zaid Qureshi (Jamia Qasmia) • View live attendance, fee dues & exam results.",
    detailsUr: "منسلک طالب علم: زید قریشی • حاضری، واجبات اور نتائج کی براہ راست رسائی۔",
    targetUrl: "/parents",
  },
  {
    id: "p-2",
    category: "parent",
    role: "parent",
    roleTitleEn: "Parent / Guardian",
    roleTitleUr: "والد / سرپرست",
    nameEn: "Kashif Iqbal (Parent of Amna)",
    nameUr: "کاشف اقبال (والد آمنہ اقبال)",
    email: "parent2@demo.local",
    password: "Parent@123",
    detailsEn: "Linked Student: Amna Iqbal (Al-Zainab School) • Attendance & fee status.",
    detailsUr: "منسلک طالب علم: آمنہ اقبال (الزینب اسکول) • حاضری اور فیس کارڈ۔",
    targetUrl: "/parents",
  },
  {
    id: "p-3",
    category: "parent",
    role: "parent",
    roleTitleEn: "Parent / Guardian",
    roleTitleUr: "والد / سرپرست",
    nameEn: "Kashif Farooq (Parent of Zainab)",
    nameUr: "کاشف فاروق (والد زینب فاروق)",
    email: "parent3@demo.local",
    password: "Parent@123",
    detailsEn: "Linked Student: Zainab Farooq (Jamia Zainab Banat) • Madrassa progress & reports.",
    detailsUr: "منسلک طالب علم: زینب فاروق (جامعہ زینب بنات) • تعلیمی پیش رفت۔",
    targetUrl: "/parents",
  },
  {
    id: "p-4",
    category: "parent",
    role: "parent",
    roleTitleEn: "Parent / Guardian",
    roleTitleUr: "والد / سرپرست",
    nameEn: "Faisal Farooq (Parent of Sadia)",
    nameUr: "فیصل فاروق (والد سعدیہ فاروق)",
    email: "parent4@demo.local",
    password: "Parent@123",
    detailsEn: "Linked Student: Sadia Farooq (Al-Zainab School) • Fee receipts & report card.",
    detailsUr: "منسلک طالب علم: سعدیہ فاروق (الزینب اسکول) • رزلٹ کارڈ و فیس۔",
    targetUrl: "/parents",
  },
  {
    id: "p-5",
    category: "parent",
    role: "parent",
    roleTitleEn: "Parent / Guardian",
    roleTitleUr: "والد / سرپرست",
    nameEn: "Adnan Butt (Parent of Usman)",
    nameUr: "عدنان بٹ (والد عثمان بٹ)",
    email: "parent5@demo.local",
    password: "Parent@123",
    detailsEn: "Linked Student: Usman Butt (Al-Qasim Academy) • Attendance log & report cards.",
    detailsUr: "منسلک طالب علم: عثمان بٹ (القاسم اکیڈمی) • مکمل کارکردگی پورٹل۔",
    targetUrl: "/parents",
  },
];

function SecretCredentialsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loggingInId, setLoggingInId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`, { duration: 1800 });
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleQuickLogin = async (item: CredentialItem) => {
    setLoggingInId(item.id);
    try {
      await auth.login({
        identifier: item.email,
        password: item.password,
      });

      toast.success(`Logged in as ${item.nameEn} (${item.roleTitleEn})`);
      navigate({ to: item.targetUrl as never });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoggingInId(null);
    }
  };

  const filteredItems = CREDENTIALS.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.nameEn.toLowerCase().includes(q) ||
      item.nameUr.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.roleTitleEn.toLowerCase().includes(q) ||
      item.detailsEn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Top Banner */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-base leading-tight">
                  Secret Test Credentials Directory
                </h1>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] py-0 px-1.5">
                  Internal Test Data
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                /very/secret/data • Click "Quick Login" to instantly authenticate into any role
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <LogIn className="h-3.5 w-3.5" />
                Go to Login Page
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm" variant="ghost" className="text-xs">
                Public Website
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Info Notification */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3.5">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-semibold text-amber-700 dark:text-amber-300">
              Complete Pre-Configured Test Credentials
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Below is the comprehensive master table of all active accounts across Super Admin, Sub-Admins (Admission, Academic, Finance, HR, Reports), 13 Teachers (covering Jamia Qasmia, Jamia Zainab, Al-Qasim Academy, and Al-Zainab School), and 5 Parents with live student links.
              You can click <strong>Copy</strong> or use the <strong>Quick Login</strong> button to sign in directly without typing.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Tabs value={filter} onValueChange={setFilter} className="w-auto">
            <TabsList className="grid grid-cols-5 w-full sm:w-auto h-9">
              <TabsTrigger value="all" className="text-xs">
                All ({CREDENTIALS.length})
              </TabsTrigger>
              <TabsTrigger value="super_admin" className="text-xs">
                Super Admin (2)
              </TabsTrigger>
              <TabsTrigger value="sub_admin" className="text-xs">
                Sub-Admins (5)
              </TabsTrigger>
              <TabsTrigger value="teacher" className="text-xs">
                Teachers (13)
              </TabsTrigger>
              <TabsTrigger value="parent" className="text-xs">
                Parents (5)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative max-w-xs w-full">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isLoggingIn = loggingInId === item.id;
            const categoryBadge =
              item.category === "super_admin"
                ? "bg-red-500/10 text-red-600 border-red-500/20"
                : item.category === "sub_admin"
                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                : item.category === "teacher"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-purple-500/10 text-purple-600 border-purple-500/20";

            return (
              <Card
                key={item.id}
                className="p-5 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className={categoryBadge}>
                      {item.roleTitleEn}
                    </Badge>
                    <span className="font-urdu text-xs text-muted-foreground font-medium">
                      {item.roleTitleUr}
                    </span>
                  </div>

                  <h3 className="font-heading font-semibold text-base text-foreground leading-tight">
                    {item.nameEn}
                  </h3>
                  <p className="font-urdu text-xs text-muted-foreground mt-0.5">
                    {item.nameUr}
                  </p>

                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {item.detailsEn}
                  </p>

                  {/* Credentials Box */}
                  <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold">
                        Email / ID
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate select-all text-foreground font-medium">
                          {item.email}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => copyToClipboard(item.email, "Email", `email-${item.id}`)}
                          title="Copy email"
                        >
                          {copiedKey === `email-${item.id}` ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold">
                        Password
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="select-all text-foreground font-medium bg-background px-1.5 py-0.5 rounded border border-border/50">
                          {item.password}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() =>
                            copyToClipboard(item.password, "Password", `pwd-${item.id}`)
                          }
                          title="Copy password"
                        >
                          {copiedKey === `pwd-${item.id}` ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Target: <code className="text-primary">{item.targetUrl}</code>
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleQuickLogin(item)}
                    disabled={Boolean(loggingInId)}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    {isLoggingIn ? "Signing In..." : "Quick Login"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 sm:px-6 bg-card text-center text-xs text-muted-foreground mt-auto">
        <p>
          MSMIS Testing Directory • All accounts are configured with active permissions for comprehensive evaluation.
        </p>
      </footer>
    </div>
  );
}
