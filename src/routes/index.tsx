import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  School,
  GraduationCap,
  BookOpen,
  Users2,
  FileSignature,
  LogIn,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ExternalLink,
  Award,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-context";
import { DraggableLanguageToggle } from "@/components/app/draggable-language-toggle";
import { PublicHeader } from "@/components/website/public-header";
import { PublicFooter } from "@/components/website/public-footer";
import { institution } from "@/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: `${institution.nameEnglish} — Jamia Qasimia & Al-Qasim Educational Complex`,
      },
      {
        name: "description",
        content:
          "Consolidated Islamic & Modern Educational Complex featuring Jamia Qasmia Baneen, Jamia Zainab Banat, Al-Qasim Academy, and Al-Zainab School.",
      },
    ],
  }),
  component: PublicRootWebsite,
});

const CAMPUSES = [
  {
    id: "qasmia-madrassa",
    titleEn: "Jamia Qasmia Baneen",
    titleUr: "جامعہ قاسمیہ بنین (مدرسہ بوائز)",
    categoryEn: "Boys Islamic Madrassa",
    categoryUr: "شعبہ علومِ اسلامیہ برائے طلبہ",
    system: "madrassa",
    gender: "boys",
    taglineEn: "Comprehensive Wifaq-ul-Madaris curriculum from Hifz to Dars-e-Nizami.",
    taglineUr: "حفظ القرآن، ناظرہ، اور درسِ نظامی وفاق المدارس کے منظور شدہ نصاب کے مطابق۔",
    highlightsEn: [
      "Hifz-ul-Quran with Tajweed",
      "8-Year Dars-e-Nizami (Aalim Course)",
      "Takhassus (Specialization in Fiqh & Hadith)",
      "Boarding facilities & Daily Halqa",
    ],
    highlightsUr: [
      "تجوید و حسن قرات کے ساتھ حفظ القرآن",
      "درس نظامی (عالمیت و فضیلت کورس)",
      "تخصص فی الفقہ والحدیث",
      "رہائشی سہولیات و روزانہ حلقہ جات",
    ],
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  {
    id: "zainab-madrassa",
    titleEn: "Jamia Zainab Banat",
    titleUr: "جامعہ زینب بنات (مدرسہ گرلز)",
    categoryEn: "Girls Islamic Madrassa",
    categoryUr: "شعبہ علومِ اسلامیہ برائے طالبات",
    system: "madrassa",
    gender: "girls",
    taglineEn: "Dedicated female Islamic scholarship and Tarbiyah in a safe, purdah campus.",
    taglineUr: "طالبات کے لیے شرعی و محفوظ ماحول میں مکمل دینی تعلیم اور اخلاقی تربیت۔",
    highlightsEn: [
      "Tajweed-o-Qiraat & Nazira",
      "Dars-e-Nizami for Female Scholars (Aalima)",
      "Short Tarbiyah & Tajweed courses",
      "100% Female instructional faculty",
    ],
    highlightsUr: [
      "تجوید و قراءت اور ناظرہ قرآن",
      "مکمل درس نظامی (فاضلہ کورس برائے طالبات)",
      "مختصر تربیتی و فہم دین کورسز",
      "مکمل خواتین اساتذہ و پردہ دار ماحول",
    ],
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  {
    id: "qasim-school",
    titleEn: "Al-Qasim Academy",
    titleUr: "القاسم اکیڈمی (اسکول بوائز)",
    categoryEn: "Boys Modern School",
    categoryUr: "جدید عصری اسکول برائے طلبہ",
    system: "school",
    gender: "boys",
    taglineEn: "BISE affiliated contemporary school curriculum with strong Islamic ethics.",
    taglineUr: "انگریزی و اردو میڈیم جدید تعلیم مع اخلاقی و دینی تربیت۔",
    highlightsEn: [
      "Pre-Primary through Matric & Secondary",
      "Science, Computer Labs & STEM education",
      "Character development & Sports facilities",
      "Board Examination (BISE) distinction tracks",
    ],
    highlightsUr: [
      "پری پرائمری تا میٹرک اور ثانوی تعلیم",
      "سائنس و کمپیوٹر لیب اور جدید طریقہ تدریس",
      "اخلاقی تربیت، اسپورٹس اور غیر نصابی سرگرمیاں",
      "بورڈ امتحانات میں شاندار پوزیشنز",
    ],
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  {
    id: "zainab-school",
    titleEn: "Al-Zainab School",
    titleUr: "الزینب اسکول (اسکول گرلز)",
    categoryEn: "Girls Modern School",
    categoryUr: "جدید عصری اسکول برائے طالبات",
    system: "school",
    gender: "girls",
    taglineEn: "Modern education for female students fostering academic excellence and modesty.",
    taglineUr: "طالبات کے لیے جدید تعلیمی معیار، اعلیٰ اخلاقی اقدار اور محفوظ کیمپس۔",
    highlightsEn: [
      "Playgroup to Secondary & Matric",
      "Interactive smart classrooms & Arts",
      "Female faculty and secure campus",
      "Equal emphasis on academics and character",
    ],
    highlightsUr: [
      "پلے گروپ تا دہم (میٹرک بورڈ)",
      "سمارٹ کلاس رومز اور جدید لیبارٹری",
      "تجربہ کار خواتین فیکلٹی اور محفوظ ماحول",
      "عصری تعلیم کے ساتھ اسلامی اقدار پر توجہ",
    ],
    badgeColor: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
];

const METRICS = [
  { value: "4", labelEn: "Campuses & Institutions", labelUr: "کیمپسز و ادارے" },
  { value: "1,200+", labelEn: "Enrolled Students", labelUr: "زیرِ تعلیم طلبہ و طالبات" },
  { value: "65+", labelEn: "Dedicated Faculty", labelUr: "ماہر اساتذہ و معلمات" },
  { value: "100%", labelEn: "Wifaq & Board Success", labelUr: "وفاق و بورڈ نتائج" },
];

function PublicRootWebsite() {
  const { lang, setLang } = useLanguage();
  const isUr = lang === "ur";

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Top Announcements & Quick Banner */}
      <div className="bg-primary/10 border-b border-primary/20 text-xs py-1.5 px-4 text-center">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span className="font-urdu font-medium">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          <span className="text-muted-foreground">•</span>
          <span>
            {isUr
              ? "تعلیمی سال 2026 کے داخلے شروع ہیں — جامعہ قاسمیہ، جامعہ زینب، القاسم اکیڈمی، الزینب اسکول"
              : "Admissions Open for Academic Session 2026 — Jamia Qasmia, Jamia Zainab, Al-Qasim Academy & Al-Zainab School"}
          </span>
          <Link
            to="/apply"
            className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {isUr ? "آن لائن داخلہ فارم" : "Apply Now"}
          </Link>
        </p>
      </div>

      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <Badge variant="outline" className="mb-4 py-1 px-3 gap-1.5 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isUr ? "تعلیمی و تربیتی ادارہ — دینی و عصری علوم" : "Islamic Scholarship & Modern Education"}
          </Badge>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            {isUr ? (
              <span className="font-urdu leading-tight block">
                دینی و عصری علوم کا ایک منفرد اور جامع مرکز
              </span>
            ) : (
              <span>Nurturing Scholars, Shaping the Future</span>
            )}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isUr
              ? "جامعہ قاسمیہ بنین، جامعہ زینب بنات، القاسم اکیڈمی، اور الزینب اسکول کے زیرِ انتظام معیاری حفظ، درسِ نظامی، اور جدید اسکول تعلیم۔"
              : "Integrated Islamic and modern education across 4 dedicated campuses — Jamia Qasmia, Jamia Zainab, Al-Qasim Academy, and Al-Zainab School."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 font-medium shadow-md">
              <Link to="/login">
                <LogIn className="h-4 w-4" />
                <span>{isUr ? "پورٹل لاگ ان کریں" : "Login to Portal"}</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/apply">
                <FileSignature className="h-4 w-4" />
                <span>{isUr ? "آن لائن داخلہ فارم" : "Online Admission"}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          {/* Quick Metrics */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-border/60">
            {METRICS.map((m) => (
              <div key={m.labelEn} className="p-4 rounded-xl bg-card border border-border/60 shadow-xs">
                <p className="font-heading text-2xl md:text-3xl font-bold text-primary">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isUr ? m.labelUr : m.labelEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Dedicated Campuses Section */}
      <section id="campuses" className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-2">
            {isUr ? "شعبہ جات و شاخیں" : "Our Institutions"}
          </Badge>
          <h2 className="font-heading text-3xl font-bold">
            {isUr ? "ہمارے چار ممتاز کیمپسز" : "Four Specialized Campuses"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isUr
              ? "طلبہ اور طالبات کے لیے الگ الگ دینی مدارس اور عصری اسکولز کی مکمل تفصیلات"
              : "Dedicated madrassas and modern schools tailored for male and female students."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {CAMPUSES.map((c) => (
            <Card
              key={c.id}
              className="p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow border-border"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="outline" className={c.badgeColor}>
                    {isUr ? c.categoryUr : c.categoryEn}
                  </Badge>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                    {c.system} • {c.gender}
                  </span>
                </div>

                <h3 className="font-heading text-2xl font-bold text-foreground">
                  {isUr ? c.titleUr : c.titleEn}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isUr ? c.titleEn : c.titleUr}
                </p>

                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {isUr ? c.taglineUr : c.taglineEn}
                </p>

                <div className="mt-5 space-y-2">
                  {(isUr ? c.highlightsUr : c.highlightsEn).map((h) => (
                    <div key={h} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between gap-3">
                <Link to="/apply">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <FileSignature className="h-3.5 w-3.5" />
                    {isUr ? "اس شاخ میں داخلہ لیں" : "Apply to this Branch"}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="sm" variant="ghost" className="gap-1 text-xs text-primary">
                    {isUr ? "پورٹل رسائی" : "Portal"}
                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-2">
              {isUr ? "ڈیجیٹل پورٹلز" : "Digital Portals"}
            </Badge>
            <h2 className="font-heading text-3xl font-bold">
              {isUr ? "والدین، اساتذہ اور انتظامیہ پورٹلز" : "Connected Portals for Everyone"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {isUr
                ? "تمام صارفین کے لیے ایک ہی یونیفائیڈ لاگ ان۔ آپ کا ای میل یا یوزر نیم خودکار طور پر آپ کا پورٹل کھولے گا۔"
                : "One unified login for all users. Simply enter your credentials to open your dedicated workspace."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Users2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold">
                {isUr ? "والدین پورٹل" : "Parent Portal"}
              </h3>
              <p className="font-urdu text-sm text-muted-foreground">والدین و سرپرست</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {isUr
                  ? "اپنے بچوں کی روزانہ حاضری، فیس واؤچرز اور بقایاجات، امتحانی نتائج اور ادارے کی اطلاعات دیکھیں اور ڈاؤنلوڈ کریں۔"
                  : "Track daily attendance, fee dues and receipts, quarterly/annual exam cards, and institutional announcements in real time."}
              </p>
              <div className="mt-5">
                <Link to="/login">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                    <LogIn className="h-3.5 w-3.5" />
                    {isUr ? "والدین لاگ ان" : "Parent Login"}
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold">
                {isUr ? "استاد پورٹل" : "Teacher Portal"}
              </h3>
              <p className="font-urdu text-sm text-muted-foreground">اساتذہ و معلمات</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {isUr
                  ? "روزانہ ٹائم ٹیبل پیریڈز، کلاس لسٹیں، طالب علموں کے امتحانی نمبرات درج کریں اور حاضری کی تصدیق کریں۔"
                  : "View active class timetable, submit exam marks, manage subject allocations, and track academic progress."}
              </p>
              <div className="mt-5">
                <Link to="/login">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                    <LogIn className="h-3.5 w-3.5" />
                    {isUr ? "استاد لاگ ان" : "Teacher Login"}
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold">
                {isUr ? "انتظامی پورٹلز" : "Administrative Workspaces"}
              </h3>
              <p className="font-urdu text-sm text-muted-foreground">ایڈمشن، فنانس، ایچ آر، اکیڈمکس</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {isUr
                  ? "سپر ایڈمن اور ذیلی ایڈمنز (داخلہ، تعلیمی امور، مالیات، ملازمین و رپورٹس) کے لیے مخصوص مکمل کنٹرول پینل۔"
                  : "Dedicated role-based panels for Super Admin, Admission, Academics, Finance, HR, and Institutional Audits."}
              </p>
              <div className="mt-5">
                <Link to="/login">
                  <Button size="sm" className="w-full gap-1.5 text-xs">
                    <LogIn className="h-3.5 w-3.5" />
                    {isUr ? "انتظامیہ لاگ ان" : "Admin Login"}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Online Admission CTA Banner */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="font-urdu text-xl opacity-90">تعلیمی سال 2026 کے داخلے جاری ہیں</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mt-2">
              Join Our Prestigious Educational Community
            </h2>
            <p className="text-xs sm:text-sm opacity-80 mt-3 leading-relaxed">
              Complete the digital admission form online in 3 simple steps, or visit our administration office for walk-in guidance.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" variant="secondary" className="gap-2 font-medium">
                <Link to="/apply">
                  <FileSignature className="h-4 w-4" />
                  <span>{isUr ? "آن لائن درخواست فارم پُر کریں" : "Apply Online Now"}</span>
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
              >
                <Link to="/website/contact">
                  <span>{isUr ? "دفتری معلومات اور رابطہ" : "Contact Admissions Office"}</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />

      <DraggableLanguageToggle />
    </div>
  );
}
