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
  ScrollText,
  Globe2,
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
                <span>{isUr ? "لاگ ان کریں" : "Login"}</span>
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
                    {isUr ? "لاگ ان" : "Login"}
                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Institutional Vision & Objectives (Aims & Objectives) Section */}
      <section className="py-16 md:py-20 bg-primary/5 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-3 py-1 px-3 border-primary/30 text-primary bg-primary/10">
              <ScrollText className="h-3.5 w-3.5 me-1.5" />
              {isUr ? "نصب العین و اغراض و مقاصد" : "Charter, Vision & Mission"}
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              {isUr ? (
                <span className="font-urdu block leading-tight text-primary">
                  جامعہ کا نصب العین (اغراض و مقاصد)
                </span>
              ) : (
                <span>Institutional Vision, Aims & Objectives</span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
              {isUr
                ? "قرآن و سنت کی عملی ترویج، بصیرت افروز علماء کی تیاری، عربی و انگریزی زبانوں پر عبور اور جدید علمی تقاضوں سے ہم آہنگی ہمارے بنیادی اہداف ہیں۔"
                : "Continuous dedication to Quranic scholarship, nurturing visionary leaders, global language fluency (Arabic & English), and addressing contemporary challenges with academic excellence."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card className="p-6 border-border hover:border-primary/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1">
                  {isUr ? "قرآن و حدیث کی عملی ترویج" : "Practical Quran & Hadith Education"}
                </h3>
                <p className="font-urdu text-xs text-muted-foreground mb-2">تعلیماتِ نبوی کا عملی نفاذ</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isUr
                    ? "قرآن وحدیث کی تعلیمات کو مسلمانوں کی عملی زندگی میں لانے اور مزید ترویج واشاعت کے لیے ہمہ وقت کوشاں رہنا۔"
                    : "Bringing Quranic and Prophetic teachings into the practical daily life of the Muslim Ummah."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-primary">
                {isUr ? "مقصد #۱" : "Objective #1"}
              </div>
            </Card>

            <Card className="p-6 border-border hover:border-primary/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1">
                  {isUr ? "صاحبِ بصیرت علماء کی تیاری" : "Visionary Islamic Scholarship"}
                </h3>
                <p className="font-urdu text-xs text-muted-foreground mb-2">عصری شعور اور فقہی بصیرت</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isUr
                    ? "عصری ضرورتوں کو سمجھ کر مسلمانوں کی دینی رہنمائی کرنے والے صاحبِ بصیرت، محقق اور باعمل علماء تیار کرنا۔"
                    : "Imparting research-driven education to nurture scholars who understand contemporary realities and guide society."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-primary">
                {isUr ? "مقصد #۲" : "Objective #2"}
              </div>
            </Card>

            <Card className="p-6 border-border hover:border-primary/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1">
                  {isUr ? "تخصص فی العلوم اور صحافت و معیشت" : "Postgraduate Specialization & Leadership"}
                </h3>
                <p className="font-urdu text-xs text-muted-foreground mb-2">تفسیر، حدیث، افتاء، سیاسیات و معاشیات</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isUr
                    ? "فضلاء کو تفسیر، حدیث، فقہ و قضاء اور سیاسیات، اقتصادیات و صحافت میں اعلیٰ تربیت دینا تاکہ وہ ہر شعبہ میں خدمات انجام دیں۔"
                    : "Advanced Takhassus along with specialized training in economics, politics, and journalism for multi-disciplinary impact."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-primary">
                {isUr ? "مقصد #۳" : "Objective #3"}
              </div>
            </Card>

            <Card className="p-6 border-border hover:border-primary/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Globe2 className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1">
                  {isUr ? "عربی و انگریزی زبانوں میں مہارت" : "Arabic & English Global Communication"}
                </h3>
                <p className="font-urdu text-xs text-muted-foreground mb-2">عالمی زبانیں اور جدید وسائل تعلیم</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isUr
                    ? "بیرونی دنیا کے ساتھ رابطے کی دونوں بڑی زبانوں عربی و انگریزی کی اعلیٰ تعلیم اور جدید وسائلِ تعلیم سے روشناس کرانا۔"
                    : "Intensive training in Arabic and English alongside modern educational technologies for global engagement."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-primary">
                {isUr ? "مقصد #۴" : "Objective #4"}
              </div>
            </Card>

            <Card className="p-6 border-border hover:border-primary/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Users2 className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1">
                  {isUr ? "خواتین میں تعلیمات اور عالمات کی تیاری" : "Female Scholarship & Islamic Education"}
                </h3>
                <p className="font-urdu text-xs text-muted-foreground mb-2">شعبہ بنات اور فاضلات کی تربیت</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isUr
                    ? "خواتین میں قرآن و حدیث کی تعلیمات کو عام کرنے اور ان کی علمی ضروریات پوری کرنے کے لیے صحیح الفکر عالمات و فاضلات تیار کرنا۔"
                    : "Preparing upright, qualified female Islamic scholars (Alimat) to educate and inspire women in society."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-primary">
                {isUr ? "مقصد #۷" : "Objective #7"}
              </div>
            </Card>

            <Card className="p-6 border-border hover:border-primary/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1">
                  {isUr ? "ریسرچ، فکری دفاع اور جدید تدریس" : "Academic Research & Modern Pedagogy"}
                </h3>
                <p className="font-urdu text-xs text-muted-foreground mb-2">الحاد و فتنوں کا تعاقب اور جدید وسائل</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isUr
                    ? "الحاد کے فکری حملوں کو روکنے کے لیے ریسرچ اداروں کا قیام، اور ابلاغ و تفہیم میں جدید تعلیمی وسائل کا بھرپور استعمال۔"
                    : "Establishing research institutions to counter modern intellectual fallacies, utilizing cutting-edge educational tools."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-primary">
                {isUr ? "مقاصد #۹ و #۱۰" : "Objectives #9 & #10"}
              </div>
            </Card>
          </div>

          <div className="mt-10 text-center">
            <Button asChild size="lg" className="gap-2 font-medium shadow-sm">
              <Link to="/website/about">
                <ScrollText className="h-4 w-4" />
                <span>
                  {isUr
                    ? "تمام ۱۰ بنیادی اغراض و مقاصد اور اصل دستاویز دیکھیں"
                    : "View All 10 Institutional Objectives & Scanned Documents"}
                </span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
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
