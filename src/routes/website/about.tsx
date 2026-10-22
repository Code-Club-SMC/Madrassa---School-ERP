import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Award,
  Globe2,
  Tv,
  HeartHandshake,
  Users,
  ShieldCheck,
  Compass,
  Laptop,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Languages,
  ScrollText,
  ArrowRight,
  Printer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/components/language-context";
import { institution } from "@/mock";

export const Route = createFileRoute("/website/about")({
  head: () => ({
    meta: [
      {
        title: `About Us & Institutional Objectives — ${institution.nameEnglish}`,
      },
      {
        name: "description",
        content:
          "Institutional vision, aims, and objectives: Quranic education, contemporary scholarship, global languages, media literacy, female education, and research institutions.",
      },
      {
        property: "og:title",
        content: "جامعہ کا نصب العین (اغراض و مقاصد) — Aims & Objectives",
      },
    ],
  }),
  component: AboutPage,
});

export interface JamiaObjective {
  id: number;
  urduNumber: string;
  categoryEn: string;
  categoryUr: string;
  titleEn: string;
  titleUr: string;
  textUrdu: string;
  textEnglish: string;
  icon: typeof BookOpen;
  pageNumber: number;
}

const OBJECTIVES: JamiaObjective[] = [
  {
    id: 1,
    urduNumber: "۱",
    categoryEn: "Core Teachings",
    categoryUr: "تعلیماتِ قرآن و سنت",
    titleEn: "Practical Application & Dissemination of Quran & Sunnah",
    titleUr: "قرآن و حدیث کی عملی ترویج و اشاعت",
    textUrdu: "قرآن وحدیث کی تعلیمات کو مسلمانوں کی عملی زندگی میں لانے اور مزید ترویج واشاعت کے لیے ہمہ وقت کوشاں رہنا۔",
    textEnglish:
      "To remain constantly dedicated to bringing the teachings of the Holy Quran and Hadith into the practical daily lives of Muslims and actively working towards their wider dissemination and propagation.",
    icon: BookOpen,
    pageNumber: 1,
  },
  {
    id: 2,
    urduNumber: "۲",
    categoryEn: "Scholarly Education",
    categoryUr: "علمی و تحقیقی قیادت",
    titleEn: "Nurturing Visionary & Scholarly Leadership",
    titleUr: "صاحبِ بصیرت علماء کی تیاری",
    textUrdu:
      "جدید دور کے علمی تقاضوں کو مدنظر رکھتے ہوئے اپنے طلبہ کو قرآن وحدیث اور فقہ وعقائد کی ایسی جامع، مکمل اور محققانہ تعلیم دینا جس کے نتیجے میں عصری ضرورتوں کو سمجھ کر مسلمانوں کی دینی رہنمائی کرنے والے صاحب بصیرت علماء پیدا ہوں۔",
    textEnglish:
      "In light of the academic and intellectual demands of the modern era, to impart comprehensive, complete, and research-oriented education in Quran, Hadith, Fiqh (jurisprudence), and Creed, cultivating visionary scholars capable of understanding contemporary realities and providing authoritative religious guidance to the Ummah.",
    icon: GraduationCap,
    pageNumber: 1,
  },
  {
    id: 3,
    urduNumber: "۳",
    categoryEn: "Specialization (Takhassus)",
    categoryUr: "تخصص اور متنوع میدانوں میں خدمات",
    titleEn: "Postgraduate Specialization & Interdisciplinary Leadership",
    titleUr: "تخصص فی العلوم اور قومی و ملی خدمات",
    textUrdu:
      "علومِ دینیہ کی عمومی تکمیل کے بعد ہر سال فضلاء کی ایک جماعت منتخب کر کے انہیں تفسیر، حدیث، فقہ وقضاء، دعوت وارشاد اور دیگر علوم میں تخصص کروانا ۔ نیز سیاسیات، اقتصادیات اور صحافت کے شعبوں کے لیے فضلاء کو خصوصی تربیت دینا تاکہ ان شعبوں کے ساتھ ساتھ مختلف شعبہ ہائے زندگی میں فضلاء جامعہ دینی وملی خدمات انجام دے سکیں۔",
    textEnglish:
      "Following the completion of general Islamic sciences, to select a distinguished cohort of graduates annually for advanced postgraduate specialization (Takhassus) in Tafseer, Hadith, Islamic Jurisprudence & Judiciary (Fiqh & Qadha), Da'wah & Guidance, and related disciplines. Furthermore, to provide specialized training in political science, economics, and journalism so that Jamia alumni can render profound religious, social, and national services across diverse walks of life.",
    icon: Award,
    pageNumber: 1,
  },
  {
    id: 4,
    urduNumber: "۴",
    categoryEn: "Global Languages",
    categoryUr: "عالمی زبانیں و جدید ذرائع",
    titleEn: "Arabic & English Proficiency with Modern Educational Tools",
    titleUr: "عربی و انگریزی زبانوں اور جدید ذرائع پر عبور",
    textUrdu:
      "بیرونی دنیا کے ساتھ رابطے کی دونوں بڑی زبانوں عربی و انگریزی کی تعلیم پر خصوصی توجہ دینا اور جدید وسائل تعلیم سے روشناس کرانا۔",
    textEnglish:
      "To place special emphasis on mastering the two principal languages of global engagement—Arabic and English—while introducing students to modern educational resources and contemporary learning tools.",
    icon: Globe2,
    pageNumber: 1,
  },
  {
    id: 5,
    urduNumber: "۵",
    categoryEn: "Media & Da'wah",
    categoryUr: "ابلاغ، صحافت و ترجمانی",
    titleEn: "Articulate Representation via Print & Electronic Media",
    titleUr: "پرنٹ و الیکٹرانک میڈیا پر اسلام کی صحیح ترجمانی",
    textUrdu: "پرنٹ والیکٹرانک میڈیا پر اسلام کی صحیح ترجمانی کے لیے طلبہ کی تحریری و تقریری صلاحیتوں کی آبیاری کرنا۔",
    textEnglish:
      "To cultivate and sharpen students' written and oratory skills to accurately, articulately, and convincingly represent Islam across print, broadcast, and digital media platforms.",
    icon: Tv,
    pageNumber: 1,
  },
  {
    id: 6,
    urduNumber: "۶",
    categoryEn: "Youth & Society",
    categoryUr: "نوجوان نسل و اسلامی معاشرت",
    titleEn: "Inculcating Authentic Creed & Islamic Character in Youth",
    titleUr: "نوجوانوں میں صحیح عقائد اور اسلامی اخلاق کا فروغ",
    textUrdu:
      "نوجوان طبقے کے اذہان میں صحیح اسلامی عقائد راسخ کرنے اور ان میں اسلامی اخلاق اور طرزِ معاشرت عام کرنے کی سعی و کوشش کرنا۔",
    textEnglish:
      "To firmly instill sound Islamic beliefs into the minds of the younger generation and vigorously promote exemplary Islamic morals, ethics, and constructive social conduct.",
    icon: HeartHandshake,
    pageNumber: 1,
  },
  {
    id: 7,
    urduNumber: "۷",
    categoryEn: "Women's Education",
    categoryUr: "شعبہ تعلیمِ نسواں",
    titleEn: "Empowering Female Islamic Scholarship (Alimat & Fadhilat)",
    titleUr: "خواتین کے لیے صحیح الفکر عالمات و فاضلات کی تیاری",
    textUrdu:
      "خواتین میں قرآن وحدیث کی تعلیمات کو عام کرنے اور ان کی دینی وعلمی ضروریات پوری کرنے کے لیے صحیح الفکر عالمات وفاضلات تیار کرنا۔",
    textEnglish:
      "To educate and prepare intellectually sound, upright female Islamic scholars (Alimat & Fadhilat) to disseminate the teachings of the Quran and Hadith among women and cater to their spiritual, scholarly, and moral needs.",
    icon: Users,
    pageNumber: 2,
  },
  {
    id: 8,
    urduNumber: "۸",
    categoryEn: "Islamic Heritage",
    categoryUr: "اسلامی تہذیب و ثقافت",
    titleEn: "Preservation & Promotion of Islamic Culture & Heritage",
    titleUr: "اسلامی تہذیب و ثقافت کا تحفظ اور فروغ",
    textUrdu: "اسلامی تہذیب و ثقافت کی بقا اور ترویج کے لیے کوشش کرنا۔",
    textEnglish:
      "To strive tirelessly for the preservation, survival, and proactive promotion of authentic Islamic culture and civilizational values.",
    icon: ShieldCheck,
    pageNumber: 2,
  },
  {
    id: 9,
    urduNumber: "۹",
    categoryEn: "Research & Defense",
    categoryUr: "تحقیق، ریسرچ اور فکری دفاع",
    titleEn: "Countering Contemporary Ideologies & Research Centers",
    titleUr: "جدید فتنوں و الحاد کا علمی مقابلہ اور ریسرچ کا قیام",
    textUrdu:
      "جدید فتنوں کے علمی تعاقب اور الحاد وبے دینی کی فکری یلغار کو روکنے کے لیے تحقیق و ریسرچ کے اداروں کے قیام کے ساتھ ساتھ بہترین رجال کار کی فراہمی۔",
    textEnglish:
      "To establish dedicated research and academic centers staffed with accomplished scholars and thinkers to intellectually counter modern tribulations (Fitnas) and resist the ideological onslaught of atheism, secularism, and irreligion.",
    icon: Compass,
    pageNumber: 2,
  },
  {
    id: 10,
    urduNumber: "۱۰",
    categoryEn: "Modern Pedagogy",
    categoryUr: "جدید اسالیبِ تدریس",
    titleEn: "Modern Pedagogical Methods & Instructional Technology",
    titleUr: "جدید طریقۂ تدریس اور ابلاغی وسائل کا استعمال",
    textUrdu: "تعلیم و تدریس کے جدید طریقوں سے آگاہی اور ابلاغ و تفہیم میں جدید وسائل تعلیم کا استعمال۔",
    textEnglish:
      "To foster thorough awareness of contemporary teaching methodologies and actively leverage modern educational technology and multimedia tools in instruction and communication.",
    icon: Laptop,
    pageNumber: 2,
  },
];

function AboutPage() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [viewMode, setViewMode] = useState<"bilingual" | "urdu" | "english">("bilingual");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [selectedScanPage, setSelectedScanPage] = useState<1 | 2>(1);

  const categories = [
    { id: "all", labelEn: "All Objectives", labelUr: "تمام مقاصد (۱۰)" },
    { id: "core", labelEn: "Quran & Sunnah", labelUr: "قرآن و سنت" },
    { id: "scholarship", labelEn: "Higher Scholarship", labelUr: "علم و تخصص" },
    { id: "languages", labelEn: "Languages & Media", labelUr: "زبانیں و میڈیا" },
    { id: "society", labelEn: "Youth & Women", labelUr: "نوجوان و خواتین" },
    { id: "research", labelEn: "Research & Pedagogy", labelUr: "ریسرچ و جدید تعلیم" },
  ];

  const filteredObjectives = OBJECTIVES.filter((obj) => {
    // category filter
    if (activeCategory === "core" && obj.id !== 1) return false;
    if (activeCategory === "scholarship" && ![2, 3].includes(obj.id)) return false;
    if (activeCategory === "languages" && ![4, 5].includes(obj.id)) return false;
    if (activeCategory === "society" && ![6, 7, 8].includes(obj.id)) return false;
    if (activeCategory === "research" && ![9, 10].includes(obj.id)) return false;

    // text search
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      obj.titleEn.toLowerCase().includes(q) ||
      obj.titleUr.includes(q) ||
      obj.textEnglish.toLowerCase().includes(q) ||
      obj.textUrdu.includes(q) ||
      obj.categoryEn.toLowerCase().includes(q) ||
      obj.categoryUr.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-border bg-muted/40 py-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="hover:text-primary transition-colors">
              {isUrdu ? "ہوم" : "Home"}
            </Link>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            <span className="text-foreground font-medium">
              {isUrdu ? "جامعہ کا تعارف و نصب العین" : "About & Institutional Vision"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => {
                setSelectedScanPage(1);
                setScanModalOpen(true);
              }}
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>{isUrdu ? "اصل دستاویز دیکھیں" : "View Original Scans"}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 print:hidden"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{isUrdu ? "پرنٹ کریں" : "Print"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <Badge
            variant="outline"
            className="mb-4 py-1.5 px-4 gap-2 border-primary/30 bg-primary/5 text-primary text-xs uppercase tracking-wider font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>جامعہ کا دستور و نصب العین • Institutional Charter & Vision</span>
          </Badge>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {isUrdu ? (
              <span className="font-urdu leading-relaxed block text-primary">
                جامعہ کا نصب العین (اغراض و مقاصد)
              </span>
            ) : (
              <span>Institutional Vision, Aims & Objectives</span>
            )}
          </h1>

          <p className="font-urdu text-xl md:text-2xl text-muted-foreground mt-3 font-medium">
            (اغراض و مقاصد — جامعہ عثمانیہ و ملحقہ تعلیمی شعبہ جات)
          </p>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {isUrdu
              ? "جامعہ کے قیام کا بنیادی مقصد قرآن و سنت کی عملی ترویج، بصیرت افروز علماء و محققین کی تیاری، جدید عصری تقاضوں سے ہم آہنگی، اور امت کی ہمہ جہت فکری و عملی رہنمائی ہے۔"
              : "The foundational charter and guiding principles of our institution: dedicated to Quranic scholarship, contemporary academic excellence, multilingual fluency, ethical youth grooming, and modern pedagogical development."}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <Card className="p-4 border-border/70 bg-card/60 backdrop-blur">
              <p className="text-2xl font-bold font-heading text-primary">10</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isUrdu ? "بنیادی اغراض و مقاصد" : "Core Objectives"}
              </p>
            </Card>
            <Card className="p-4 border-border/70 bg-card/60 backdrop-blur">
              <p className="text-2xl font-bold font-heading text-primary">2</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isUrdu ? "عالمی زبانیں (عربی و انگریزی)" : "Global Languages (Arabic/English)"}
              </p>
            </Card>
            <Card className="p-4 border-border/70 bg-card/60 backdrop-blur">
              <p className="text-2xl font-bold font-heading text-primary">100%</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isUrdu ? "دینی و عصری ہم آہنگی" : "Islamic & Modern Integration"}
              </p>
            </Card>
            <Card className="p-4 border-border/70 bg-card/60 backdrop-blur">
              <p className="text-2xl font-bold font-heading text-primary">تخصص</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isUrdu ? "اعلیٰ تحقیق و ریسرچ" : "Advanced Specialization"}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content & Objectives List */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Controls Bar: Language Mode + Category Pills + Search */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-2xl border border-border">
            {/* View Mode Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border">
              <Languages className="h-4 w-4 ms-2 text-primary shrink-0" />
              <button
                type="button"
                onClick={() => setViewMode("bilingual")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  viewMode === "bilingual"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isUrdu ? "مشترکہ (Urdu + English)" : "Bilingual View"}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("urdu")}
                className={`px-3 py-1.5 text-xs font-medium font-urdu rounded-lg transition-all ${
                  viewMode === "urdu"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                صرف اردو
              </button>
              <button
                type="button"
                onClick={() => setViewMode("english")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  viewMode === "english"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                English Only
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isUrdu ? "مقاصد میں تلاش کریں..." : "Search objectives..."}
                className="ps-9 h-9 text-xs rounded-xl bg-background"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full border transition-all ${
                  activeCategory === c.id
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {isUrdu ? c.labelUr : c.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Objectives Cards Grid */}
        <div className="space-y-5">
          {filteredObjectives.map((obj) => {
            const IconComponent = obj.icon;
            return (
              <Card
                key={obj.id}
                id={`objective-${obj.id}`}
                className="p-6 md:p-7 border-border hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden group"
              >
                {/* Background Number Watermark */}
                <span className="absolute end-4 -bottom-6 font-urdu text-8xl font-black text-muted/20 select-none pointer-events-none group-hover:text-primary/10 transition-colors">
                  {obj.urduNumber}
                </span>

                <div className="flex items-start gap-4">
                  {/* Objective Number & Icon Badge */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-xs">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="mt-2 text-xs font-mono font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                      #{obj.id}
                    </span>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 space-y-4">
                    {/* Header line: Category + Page Tag */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs bg-muted/50 border-border">
                          {isUrdu ? obj.categoryUr : obj.categoryEn}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {isUrdu
                            ? `دستاویز صفحہ نمبر ${obj.pageNumber === 1 ? "۵" : "۶"}`
                            : `Original Document Page ${obj.pageNumber}`}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1"
                        onClick={() => {
                          setSelectedScanPage(obj.pageNumber as 1 | 2);
                          setScanModalOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        <span>{isUrdu ? "اصل عکس" : "View Scan"}</span>
                      </Button>
                    </div>

                    {/* Bilingual Layout / Single View based on viewMode */}
                    {viewMode === "bilingual" && (
                      <div className="grid md:grid-cols-2 gap-6 pt-2 border-t border-border/60">
                        {/* Urdu Column */}
                        <div className="bg-primary/5 rounded-2xl p-4 md:p-5 border border-primary/10 space-y-2 text-right" dir="rtl">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-primary font-urdu">
                              {obj.categoryUr}
                            </span>
                            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-urdu font-bold text-sm flex items-center justify-center">
                              {obj.urduNumber}
                            </span>
                          </div>
                          <h3 className="font-urdu text-lg sm:text-xl font-bold text-foreground leading-snug">
                            {obj.titleUr}
                          </h3>
                          <p className="font-urdu text-base sm:text-lg text-foreground/90 leading-relaxed pt-1">
                            {obj.textUrdu}
                          </p>
                        </div>

                        {/* English Column */}
                        <div className="bg-muted/30 rounded-2xl p-4 md:p-5 border border-border/80 space-y-2">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                              {obj.categoryEn}
                            </span>
                            <span className="h-6 w-6 rounded-full bg-muted text-foreground font-mono font-bold text-xs flex items-center justify-center">
                              {obj.id}
                            </span>
                          </div>
                          <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">
                            {obj.titleEn}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                            {obj.textEnglish}
                          </p>
                        </div>
                      </div>
                    )}

                    {viewMode === "urdu" && (
                      <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 space-y-3 text-right" dir="rtl">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-primary font-urdu">
                            {obj.categoryUr}
                          </span>
                          <span className="h-7 w-7 rounded-full bg-primary/10 text-primary font-urdu font-bold text-base flex items-center justify-center">
                            ({obj.urduNumber})
                          </span>
                        </div>
                        <h3 className="font-urdu text-xl font-bold text-foreground leading-relaxed">
                          {obj.titleUr}
                        </h3>
                        <p className="font-urdu text-lg sm:text-xl text-foreground leading-loose pt-1">
                          {obj.textUrdu}
                        </p>
                      </div>
                    )}

                    {viewMode === "english" && (
                      <div className="bg-muted/30 rounded-2xl p-5 border border-border space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                            {obj.categoryEn}
                          </span>
                          <span className="h-7 w-7 rounded-full bg-muted text-foreground font-mono font-bold text-sm flex items-center justify-center">
                            #{obj.id}
                          </span>
                        </div>
                        <h3 className="font-heading text-lg font-bold text-foreground">
                          {obj.titleEn}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {obj.textEnglish}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredObjectives.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
              <ScrollText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">
                {isUrdu ? "کوئی مقصد نہیں ملا" : "No matching objectives found"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isUrdu ? "براہ کرم تلاش کے الفاظ تبدیل کریں" : "Please try a different search query"}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 text-xs"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                {isUrdu ? "فلٹرز ختم کریں" : "Reset Filters"}
              </Button>
            </div>
          )}
        </div>

        {/* Original Document Scans Showcase Section */}
        <section className="mt-16 pt-12 border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge variant="outline" className="mb-2">
              {isUrdu ? "تاریخی وثیقہ و اصل ریکارڈ" : "Archival Document"}
            </Badge>
            <h2 className="font-heading text-2xl font-bold">
              {isUrdu ? "اصل مطبوعہ دستاویزات (اسکین شدہ)" : "Original Scanned Document Pages"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isUrdu
                ? "جامعہ کے سرکاری مطبوعہ دستور و قواعد کے اصل صفحات کے عکس"
                : "Official published charter and objectives scanned directly from institutional archives."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Page 1 Card */}
            <Card className="overflow-hidden border-border hover:shadow-md transition-shadow">
              <div className="relative group aspect-[3/4] bg-muted/40 overflow-hidden flex items-center justify-center border-b border-border">
                <img
                  src="/about/vision-page-1.jpeg"
                  alt="جامعہ کا نصب العین - صفحہ ۱"
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 text-xs shadow-md"
                    onClick={() => {
                      setSelectedScanPage(1);
                      setScanModalOpen(true);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{isUrdu ? "بڑا کر کے دیکھیں" : "View Full Size"}</span>
                  </Button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {isUrdu ? "صفحہ نمبر ۵ · مقاصد ۱ تا ۶" : "Page 5 · Objectives 1 to 6"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-urdu">
                    جامعہ کا نصب العین (اغراض و مقاصد)
                  </p>
                </div>
                <a
                  href="/about/vision-page-1.jpeg"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>{isUrdu ? "کھولیں" : "Open"}</span>
                </a>
              </div>
            </Card>

            {/* Page 2 Card */}
            <Card className="overflow-hidden border-border hover:shadow-md transition-shadow">
              <div className="relative group aspect-[3/4] bg-muted/40 overflow-hidden flex items-center justify-center border-b border-border">
                <img
                  src="/about/vision-page-2.jpeg"
                  alt="جامعہ کا نصب العین - صفحہ ۲"
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 text-xs shadow-md"
                    onClick={() => {
                      setSelectedScanPage(2);
                      setScanModalOpen(true);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{isUrdu ? "بڑا کر کے دیکھیں" : "View Full Size"}</span>
                  </Button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {isUrdu ? "صفحہ نمبر ۶ · مقاصد ۷ تا ۱۰" : "Page 6 · Objectives 7 to 10"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-urdu">
                    خواتین، ریسرچ، اور جدید اسالیبِ تدریس
                  </p>
                </div>
                <a
                  href="/about/vision-page-2.jpeg"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>{isUrdu ? "کھولیں" : "Open"}</span>
                </a>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Banner to Apply or Explore Campuses */}
        <div className="mt-16 rounded-3xl bg-muted/60 border border-border p-8 md:p-10 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="font-heading text-2xl font-bold">
              {isUrdu
                ? "جامعہ کے تعلیمی سفر کا حصہ بنیں"
                : "Experience Our Vision in Action"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isUrdu
                ? "جامعہ قاسمیہ بنین، جامعہ زینب بنات، القاسم اکیڈمی، اور الزینب اسکول میں داخلے کھلے ہیں۔ آن لائن درخواست جمع کروائیں۔"
                : "Admissions are open across our boys and girls madrassas and modern schools. Explore our campuses or begin an online application today."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="default" className="gap-2 text-xs">
                <Link to="/apply">
                  <span>{isUrdu ? "آن لائن داخلہ فارم" : "Apply Online"}</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="gap-2 text-xs">
                <a href="/#campuses">
                  <span>{isUrdu ? "کیمپسز اور شعبہ جات دیکھیں" : "Explore Campuses"}</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox / Modal for Scanned Document Pages */}
      <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-base sm:text-lg font-heading">
                {isUrdu
                  ? `اصل دستاویز — صفحہ ${selectedScanPage === 1 ? "۵ (مقاصد ۱ تا ۶)" : "۶ (مقاصد ۷ تا ۱۰)"}`
                  : `Original Document Scan — Page ${selectedScanPage}`}
              </DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={selectedScanPage === 1 ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setSelectedScanPage(1)}
                >
                  {isUrdu ? "صفحہ ۵" : "Page 1"}
                </Button>
                <Button
                  size="sm"
                  variant={selectedScanPage === 2 ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setSelectedScanPage(2)}
                >
                  {isUrdu ? "صفحہ ۶" : "Page 2"}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-2 flex items-center justify-center">
            <img
              src={
                selectedScanPage === 1
                  ? "/about/vision-page-1.jpeg"
                  : "/about/vision-page-2.jpeg"
              }
              alt="Archival document scan"
              className="max-h-[70vh] w-auto object-contain rounded-lg shadow-xs"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isUrdu
                ? "جامعہ عثمانیہ پشاور — دستور و اغراض و مقاصد"
                : "Official Charter & Objectives Record"}
            </span>
            <a
              href={
                selectedScanPage === 1
                  ? "/about/vision-page-1.jpeg"
                  : "/about/vision-page-2.jpeg"
              }
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <ExternalLink className="h-3 w-3" />
              <span>{isUrdu ? "مکمل تصویر نئی ونڈو میں کھولیں" : "Open Full Image"}</span>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

