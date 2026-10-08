import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Users,
  CalendarCheck2,
  Banknote,
  AlertTriangle,
  GraduationCap,
  UserPlus,
  ChevronLeft,
  BookOpen,
  School,
  Building2,
  TrendingUp,
  Filter,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  HeartHandshake,
  ShieldCheck,
  Store,
  Utensils,
  Layers,
  Zap,
  Wrench,
  FileText,
  HeartPulse,
  MoreHorizontal,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { BookLoader } from "@/components/shared/book-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPKR, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/language-context";
import { sparkline } from "@/mock";

export type DashboardFilter =
  | "all"
  | "qasimia_madrassa"
  | "qasim_academy"
  | "zainab_madrassa"
  | "zainab_school";

const searchSchema = z.object({
  filter: z
    .enum(["all", "qasimia_madrassa", "qasim_academy", "zainab_madrassa", "zainab_school"])
    .optional(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: searchSchema,
  component: DashboardPage,
});

const ACTIVITY_ICONS = {
  admission: UserPlus,
  fee: Banknote,
  attendance: CalendarCheck2,
  exam: BookOpen,
} as const;

const ACTIVITY_TONE = {
  admission: "bg-primary/10 text-primary",
  fee: "bg-chart-1/15 text-chart-5 dark:text-chart-1",
  attendance: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  exam: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
} as const;


type FinancialSourceIcon =
  | "Banknote"
  | "HeartHandshake"
  | "ShieldCheck"
  | "Store"
  | "Utensils"
  | "BookOpen"
  | "Layers"
  | "Users"
  | "Zap"
  | "Wrench"
  | "FileText"
  | "HeartPulse"
  | "MoreHorizontal";

type FinancialBreakdownItem = {
  id: string;
  nameEn: string;
  nameUr: string;
  amount: number;
  iconName: FinancialSourceIcon;
};

type CashflowPeriodData = {
  totalIncome: number;
  totalExpenses: number;
  incomeSources: FinancialBreakdownItem[];
  expenseCategories: FinancialBreakdownItem[];
};

type CashflowMeta = {
  monthly: CashflowPeriodData;
  daily: CashflowPeriodData;
};

function getFinanceIcon(name: FinancialSourceIcon) {
  switch (name) {
    case "Banknote":
      return Banknote;
    case "HeartHandshake":
      return HeartHandshake;
    case "ShieldCheck":
      return ShieldCheck;
    case "Store":
      return Store;
    case "Utensils":
      return Utensils;
    case "BookOpen":
      return BookOpen;
    case "Layers":
      return Layers;
    case "Users":
      return Users;
    case "Zap":
      return Zap;
    case "Wrench":
      return Wrench;
    case "FileText":
      return FileText;
    case "HeartPulse":
      return HeartPulse;
    case "MoreHorizontal":
      return MoreHorizontal;
    default:
      return Banknote;
  }
}

type FinancialMeta = {
  titleEn: string;
  titleUr: string;
  subEn: string;
  subUr: string;
  target: number;
  collected: number;
  pending: number;
  recoveryRate: string;
  studentStatus: {
    cleared: { count: number; pct: string };
    partial: { count: number; pct: string };
    unpaid: { count: number; pct: string };
  };
  monthlyHistory: Array<{
    month: string;
    monthUr: string;
    collected: number;
    target: number;
  }>;
};

type EntityConfig = {
  key: DashboardFilter;
  labelEn: string;
  labelUr: string;
  shortNameEn: string;
  shortNameUr: string;
  descEn: string;
  descUr: string;
  taglineEn: string;
  taglineUr: string;
  icon: typeof Building2;
  color: string;
  badgeBg: string;
  studentCount: number;
  kpis: {
    totalStudents: string;
    studentsSublineEn: string;
    studentsSublineUr: string;
    attendanceRate: string;
    attendanceSublineEn: string;
    attendanceSublineUr: string;
    monthlyFee: number;
    feeSublineEn: string;
    feeSublineUr: string;
    arrears: number;
    arrearsSublineEn: string;
    arrearsSublineUr: string;
    teacherCount: number;
    teachersSublineEn: string;
    teachersSublineUr: string;
  };
  chartMeta: {
    titleEn: string;
    titleUr: string;
    subEn: string;
    subUr: string;
    lines: Array<{
      dataKey: string;
      nameEn: string;
      nameUr: string;
      color: string;
    }>;
  };
  financialMeta: FinancialMeta;
  cashflowMeta: CashflowMeta;
  attendanceSummary: {
    avgRate: string;
    bestDay: string;
    lowDay: string;
    rates: Array<{ day: string; dayUr: string; rate: number }>;
  };
};

const ENTITY_CONFIGS: Record<DashboardFilter, EntityConfig> = {
  all: {
    key: "all",
    labelEn: "All Institutions (Combined)",
    labelUr: "تمام شعبہ جات (مشترکہ جائزہ)",
    shortNameEn: "All Branches",
    shortNameUr: "تمام شعبہ جات",
    descEn: "Consolidated overview across Jamia Qasimia, Al-Qasim Academy, and Jamia Zainab.",
    descUr: "جامعہ قاسمیہ للبنین، القاسم اکیڈمی اور جامعہ زینب للبنات کا مجموعی و مشترکہ جائزہ",
    taglineEn: "Consolidated system overview across all branches",
    taglineUr: "تمام مدارس و سکول شعبہ جات کا مجموعی تجزیہ",
    icon: Building2,
    color: "text-primary",
    badgeBg: "bg-primary/10 text-primary border-primary/20",
    studentCount: 1248,
    kpis: {
      totalStudents: "1,248",
      studentsSublineEn: "Madrassa 812 · School 436",
      studentsSublineUr: "مدرسہ 812 · اسکول 436",
      attendanceRate: "94.2%",
      attendanceSublineEn: "1,176 Present · 72 Absent",
      attendanceSublineUr: "1,176 حاضر · 72 غیر حاضر",
      monthlyFee: 1842000,
      feeSublineEn: "+8.6% vs last month",
      feeSublineUr: "+8.6% پچھلے مہینے سے",
      arrears: 214500,
      arrearsSublineEn: "-2.1% recovered this week",
      arrearsSublineUr: "-2.1% وصولی کی شرح",
      teacherCount: 42,
      teachersSublineEn: "Madrassa 26 · School 16",
      teachersSublineUr: "مدرسہ 26 · اسکول 16",
    },
    chartMeta: {
      titleEn: "Consolidated Enrollment Trend",
      titleUr: "داخلوں کا مجموعی رجحان — تمام شعبہ جات",
      subEn: "Comparative monthly growth across all 4 institutions (Last 12 Months)",
      subUr: "گزشتہ 12 ماہ میں تمام چاروں شعبوں کے داخلوں کا تقابلی جائزہ",
      lines: [
        {
          dataKey: "qasimiaMadrassa",
          nameEn: "Jamia Qasimia (Madrassa)",
          nameUr: "جامعہ قاسمیہ (مدرسہ)",
          color: "#10b981",
        },
        {
          dataKey: "qasimAcademy",
          nameEn: "Al-Qasim Academy (School)",
          nameUr: "القاسم اکیڈمی (سکول)",
          color: "#3b82f6",
        },
        {
          dataKey: "zainabMadrassa",
          nameEn: "Jamia Zainab (Madrassa)",
          nameUr: "جامعہ زینب (مدرسہ)",
          color: "#ec4899",
        },
        {
          dataKey: "zainabSchool",
          nameEn: "Jamia Zainab (School)",
          nameUr: "جامعہ زینب (سکول)",
          color: "#f59e0b",
        },
      ],
    },
    financialMeta: {
      titleEn: "Monthly Fee Collection & Recovery",
      titleUr: "ماہانہ فیس وصولی و بقایا جات",
      subEn: "Current month collection progress and dues recovery across all branches",
      subUr: "تمام شعبہ جات میں فیس وصولی اور واجب الادا بقایا جات کا تجزیہ",
      target: 2056500,
      collected: 1842000,
      pending: 214500,
      recoveryRate: "89.6%",
      studentStatus: {
        cleared: { count: 842, pct: "68%" },
        partial: { count: 268, pct: "21%" },
        unpaid: { count: 138, pct: "11%" },
      },
      monthlyHistory: [
        { month: "May", monthUr: "مئی", collected: 1720000, target: 1900000 },
        { month: "Jun", monthUr: "جون", collected: 1780000, target: 1950000 },
        { month: "Jul", monthUr: "جولائی", collected: 1810000, target: 2000000 },
        { month: "Aug", monthUr: "اگست", collected: 1830000, target: 2020000 },
        { month: "Sep", monthUr: "ستمبر", collected: 1820000, target: 2040000 },
        { month: "Oct", monthUr: "اکتوبر", collected: 1842000, target: 2056500 },
      ],
    },
    cashflowMeta: {
      monthly: {
        totalIncome: 3200000,
        totalExpenses: 2205000,
        incomeSources: [
          { id: "fees", nameEn: "Student Tuition & Admission Fees", nameUr: "فیس طلباء و داخلہ جات", amount: 1842000, iconName: "Banknote" },
          { id: "donations", nameEn: "Donations & General Atiyaat", nameUr: "عطیات و عمومی امداد", amount: 620000, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Zakat & Sadaqat Fund", nameUr: "زکوٰۃ و صدقات فنڈ", amount: 380000, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Waqf / Shop & Property Rent", nameUr: "وقف املاک و دکانوں کا کرایہ", amount: 175000, iconName: "Store" },
          { id: "mess", nameEn: "Hostel & Food / Mess Fund", nameUr: "طعام و ہاسٹل فنڈ", amount: 110000, iconName: "Utensils" },
          { id: "books", nameEn: "Books, Stationery & Uniform", nameUr: "کتب، یونیفارم و درسی سامان", amount: 48000, iconName: "BookOpen" },
          { id: "other", nameEn: "Other / Misc Revenue", nameUr: "دیگر متفرق آمدن", amount: 25000, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Teacher & Staff Salaries", nameUr: "اساتذہ و عملہ کی تنخواہیں", amount: 1480000, iconName: "Users" },
          { id: "utilities", nameEn: "Utilities (Electricity, Gas, Water)", nameUr: "یوٹیلیٹی بلز (بجلی، گیس، پانی)", amount: 245000, iconName: "Zap" },
          { id: "mess", nameEn: "Kitchen, Ration & Mess Supplies", nameUr: "طعام، راشن و باورچی خانہ", amount: 215000, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Building Repairs & Maintenance", nameUr: "مرمت و عمارت کی دیکھ بھال", amount: 110000, iconName: "Wrench" },
          { id: "stationery", nameEn: "Stationery, Printing & Exams", nameUr: "سٹیشنری، پرنٹنگ و امتحانی اخراجات", amount: 65000, iconName: "FileText" },
          { id: "welfare", nameEn: "Student Welfare & Medical Aid", nameUr: "طلبہ امداد و طبی سہولیات", amount: 55000, iconName: "HeartPulse" },
          { id: "misc", nameEn: "General Admin & Miscellaneous", nameUr: "دیگر انتظامی و متفرق اخراجات", amount: 35000, iconName: "MoreHorizontal" },
        ],
      },
      daily: {
        totalIncome: 120200,
        totalExpenses: 44400,
        incomeSources: [
          { id: "fees", nameEn: "Today's Fee Counter Collection", nameUr: "آج کی کاؤنٹر فیس وصولی", amount: 68000, iconName: "Banknote" },
          { id: "donations", nameEn: "Daily Donations & Walk-in Charity", nameUr: "روزانہ عطیات و دستی امداد", amount: 24000, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Zakat & Sadaqat Receipts", nameUr: "زکوٰۃ و صدقات کی رسیدیں", amount: 15000, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Shop Rent Daily Share", nameUr: "دکانوں کے یومیہ کرایہ تناسب", amount: 5800, iconName: "Store" },
          { id: "mess", nameEn: "Canteen & Daily Food Token", nameUr: "کینٹین و طعام ٹوکن وصولی", amount: 3700, iconName: "Utensils" },
          { id: "books", nameEn: "Bookshop & Stationary Sale", nameUr: "کتب و سٹیشنری کی فروخت", amount: 2500, iconName: "BookOpen" },
          { id: "other", nameEn: "Miscellaneous Cash Receipts", nameUr: "دیگر متفرق نقد وصولیاں", amount: 1200, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Daily Wages & Staff Allowances", nameUr: "یومیہ اجرت و عارضی عملہ", amount: 8500, iconName: "Users" },
          { id: "utilities", nameEn: "Generator Fuel & Utilities", nameUr: "جنریٹر ایندھن و یوٹیلیٹیز", amount: 9200, iconName: "Zap" },
          { id: "mess", nameEn: "Fresh Milk, Vegetables & Food", nameUr: "دودھ، سبزی و تازہ راشن", amount: 14800, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Urgent Plumbing & Electrical", nameUr: "فوری مرمت و پلمبنگ", amount: 4500, iconName: "Wrench" },
          { id: "stationery", nameEn: "Daily Photocopy & Test Papers", nameUr: "فوٹو کاپی و ٹیسٹ پرنٹنگ", amount: 2400, iconName: "FileText" },
          { id: "welfare", nameEn: "Emergency Student First-Aid", nameUr: "ہنگامی ادویات و طبی امداد", amount: 3200, iconName: "HeartPulse" },
          { id: "misc", nameEn: "Daily Tea, Cleaning & Logistics", nameUr: "چائے، صفائی و متفرق اخراجات", amount: 1800, iconName: "MoreHorizontal" },
        ],
      },
    },
    attendanceSummary: {
      avgRate: "94.2%",
      bestDay: "Wed · 96.5%",
      lowDay: "Sat · 91.2%",
      rates: [
        { day: "Mon", dayUr: "پیر", rate: 93 },
        { day: "Tue", dayUr: "منگل", rate: 95 },
        { day: "Wed", dayUr: "بدھ", rate: 97 },
        { day: "Thu", dayUr: "جمعرات", rate: 94 },
        { day: "Fri", dayUr: "جمعہ", rate: 96 },
        { day: "Sat", dayUr: "ہفتہ", rate: 91 },
        { day: "Sun", dayUr: "اتوار", rate: 94 },
      ],
    },
  },

  qasimia_madrassa: {
    key: "qasimia_madrassa",
    labelEn: "Jamia Qasimia Lil-Baneen (Madrassa)",
    labelUr: "جامعہ قاسمیہ للبنین (مدرسہ)",
    shortNameEn: "Qasimia Madrassa",
    shortNameUr: "قاسمیہ مدرسہ",
    descEn: "Islamic education, Dars-e-Nizami, Hifz, and Nazira branches for boys.",
    descUr: "درس نظامی، حفظ القرآن اور ناظرہ کے شعبہ جات برائے بنین",
    taglineEn: "Religious education & Quranic memorization for boys",
    taglineUr: "بنین کے لیے دینی تعلیم و تدریس",
    icon: BookOpen,
    color: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    studentCount: 546,
    kpis: {
      totalStudents: "546",
      studentsSublineEn: "Nizami 248 · Hifz 162 · Nazira 136",
      studentsSublineUr: "درس نظامی 248 · حفظ 162 · ناظرہ 136",
      attendanceRate: "95.8%",
      attendanceSublineEn: "523 Present · 23 Absent",
      attendanceSublineUr: "523 حاضر · 23 غیر حاضر",
      monthlyFee: 785000,
      feeSublineEn: "+6.4% vs last month",
      feeSublineUr: "+6.4% پچھلے مہینے سے",
      arrears: 84000,
      arrearsSublineEn: "90% recovery achieved",
      arrearsSublineUr: "90% وصولی مکمل",
      teacherCount: 17,
      teachersSublineEn: "Nizami 9 · Hifz 5 · Nazira 3",
      teachersSublineUr: "نظامی 9 · حفظ 5 · ناظرہ 3",
    },
    chartMeta: {
      titleEn: "Jamia Qasimia — Department Growth",
      titleUr: "جامعہ قاسمیہ — شعبہ وار داخلوں کا رجحان",
      subEn: "Monthly trend for Dars-e-Nizami, Hifz, and Nazira (Last 12 Months)",
      subUr: "درس نظامی، حفظ القرآن اور ناظرہ میں ماہانہ داخلوں کی پیش رفت",
      lines: [
        {
          dataKey: "series1",
          nameEn: "Dars-e-Nizami",
          nameUr: "درس نظامی",
          color: "#10b981",
        },
        {
          dataKey: "series2",
          nameEn: "Hifz-ul-Quran",
          nameUr: "حفظ القرآن",
          color: "#06b6d4",
        },
        {
          dataKey: "series3",
          nameEn: "Nazira & Qaida",
          nameUr: "ناظرہ و قاعدہ",
          color: "#6366f1",
        },
      ],
    },
    financialMeta: {
      titleEn: "Qasimia Fee Collection & Recovery",
      titleUr: "جامعہ قاسمیہ — فیس وصولی و بقایا جات",
      subEn: "Current month fees and arrears recovery for male madrassa",
      subUr: "جامعہ قاسمیہ للبنین کی ماہانہ فیس وصولی اور ریکوری کی صورتحال",
      target: 869000,
      collected: 785000,
      pending: 84000,
      recoveryRate: "90.3%",
      studentStatus: {
        cleared: { count: 382, pct: "70%" },
        partial: { count: 112, pct: "21%" },
        unpaid: { count: 52, pct: "9%" },
      },
      monthlyHistory: [
        { month: "May", monthUr: "مئی", collected: 735000, target: 810000 },
        { month: "Jun", monthUr: "جون", collected: 750000, target: 825000 },
        { month: "Jul", monthUr: "جولائی", collected: 762000, target: 840000 },
        { month: "Aug", monthUr: "اگست", collected: 770000, target: 850000 },
        { month: "Sep", monthUr: "ستمبر", collected: 778000, target: 860000 },
        { month: "Oct", monthUr: "اکتوبر", collected: 785000, target: 869000 },
      ],
    },
    cashflowMeta: {
      monthly: {
        totalIncome: 1530000,
        totalExpenses: 984000,
        incomeSources: [
          { id: "fees", nameEn: "Dars-e-Nizami & Hifz Fees", nameUr: "درس نظامی و حفظ فیس", amount: 785000, iconName: "Banknote" },
          { id: "donations", nameEn: "Jamia Qasimia Donations", nameUr: "جامعہ قاسمیہ عمومی عطیات", amount: 340000, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Zakat & Sadaqat (Madrassa)", nameUr: "زکوٰۃ و صدقات برائے طلبہ", amount: 215000, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Madrassa Waqf Shops Rent", nameUr: "وقف دکانوں کا کرایہ", amount: 95000, iconName: "Store" },
          { id: "mess", nameEn: "Kitchen & Dining Fund", nameUr: "طعام و باورچی خانہ فنڈ", amount: 65000, iconName: "Utensils" },
          { id: "books", nameEn: "Syllabus Books & Registration", nameUr: "درسی کتب و رجسٹریشن", amount: 18000, iconName: "BookOpen" },
          { id: "other", nameEn: "Other Receipts", nameUr: "متفرق وصولی", amount: 12000, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Madrassa Teachers & Staff", nameUr: "اساتذہ و عملہ مدرسہ تنخواہیں", amount: 620000, iconName: "Users" },
          { id: "utilities", nameEn: "Hostel & Mosque Utilities", nameUr: "مسجد و ہاسٹل بجلی/گیس بلز", amount: 105000, iconName: "Zap" },
          { id: "mess", nameEn: "Student Food & Ration", nameUr: "طلبہ کا راشن و طعام", amount: 135000, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Building & Mosque Maintenance", nameUr: "مسجد و عمارت کی دیکھ بھال", amount: 48000, iconName: "Wrench" },
          { id: "stationery", nameEn: "Registers, Tests & Exam Papers", nameUr: "رجسٹرز، ٹیسٹ و امتحانی کاغذ", amount: 22000, iconName: "FileText" },
          { id: "welfare", nameEn: "Mustahiq Students Stipend", nameUr: "مستحق طلبہ کی کفالت و امداد", amount: 38000, iconName: "HeartPulse" },
          { id: "misc", nameEn: "Guest Hospitality & Misc", nameUr: "مہمان نوازی و متفرق انتظامی", amount: 16000, iconName: "MoreHorizontal" },
        ],
      },
      daily: {
        totalIncome: 56000,
        totalExpenses: 22800,
        incomeSources: [
          { id: "fees", nameEn: "Madrassa Fee Receipts", nameUr: "مدرسہ فیس وصولی", amount: 26000, iconName: "Banknote" },
          { id: "donations", nameEn: "Daily Cash Donations", nameUr: "روزانہ نقد عطیات", amount: 14000, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Zakat Tokens & Sadaqah", nameUr: "زکوٰۃ و صدقات رسیدات", amount: 9000, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Waqf Daily Share", nameUr: "وقف یومیہ حصہ", amount: 3200, iconName: "Store" },
          { id: "mess", nameEn: "Hostel Food Contribution", nameUr: "طعام فنڈ وصولی", amount: 2200, iconName: "Utensils" },
          { id: "books", nameEn: "Book Sales", nameUr: "کتب کی فروخت", amount: 1000, iconName: "BookOpen" },
          { id: "other", nameEn: "Misc Receipts", nameUr: "متفرق وصولیاں", amount: 600, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Support Staff Daily Wages", nameUr: "ملازمین کی یومیہ اجرت", amount: 3500, iconName: "Users" },
          { id: "utilities", nameEn: "Mosque / Hostel Fuel", nameUr: "جنریٹر ایندھن و گیس", amount: 4200, iconName: "Zap" },
          { id: "mess", nameEn: "Daily Fresh Ration & Milk", nameUr: "تازہ سبزی، دودھ و راشن", amount: 9200, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Minor Hardware & Plumbing", nameUr: "پلمبنگ و الیکٹرک مرمت", amount: 2100, iconName: "Wrench" },
          { id: "stationery", nameEn: "Daily Notes & Copies", nameUr: "روزانہ فوٹو کاپی", amount: 800, iconName: "FileText" },
          { id: "welfare", nameEn: "Student Emergency Clinic", nameUr: "طالب علم کلینک ادویات", amount: 2100, iconName: "HeartPulse" },
          { id: "misc", nameEn: "Hospitality & Cleanliness", nameUr: "صفائی و مہمانداری", amount: 900, iconName: "MoreHorizontal" },
        ],
      },
    },
    attendanceSummary: {
      avgRate: "95.8%",
      bestDay: "Tue · 97.8%",
      lowDay: "Sat · 93.4%",
      rates: [
        { day: "Mon", dayUr: "پیر", rate: 95 },
        { day: "Tue", dayUr: "منگل", rate: 98 },
        { day: "Wed", dayUr: "بدھ", rate: 96 },
        { day: "Thu", dayUr: "جمعرات", rate: 96 },
        { day: "Fri", dayUr: "جمعہ", rate: 97 },
        { day: "Sat", dayUr: "ہفتہ", rate: 93 },
        { day: "Sun", dayUr: "اتوار", rate: 95 },
      ],
    },
  },

  qasim_academy: {
    key: "qasim_academy",
    labelEn: "Al-Qasim Academy (School Boys)",
    labelUr: "القاسم اکیڈمی ٹل (سکول)",
    shortNameEn: "Al-Qasim Academy",
    shortNameUr: "القاسم اکیڈمی",
    descEn: "Formal education and curriculum for boys school.",
    descUr: "بنین کے لیے سکول کی باقاعدہ تعلیم و تدریس",
    taglineEn: "Formal school curriculum & academics for boys",
    taglineUr: "بنین کے لیے عصری و اسکول کی تعلیم",
    icon: School,
    color: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    studentCount: 312,
    kpis: {
      totalStudents: "312",
      studentsSublineEn: "312 Students · School Section",
      studentsSublineUr: "312 طلبہ · شعبہ سکول",
      attendanceRate: "92.6%",
      attendanceSublineEn: "289 Present · 23 Absent",
      attendanceSublineUr: "289 حاضر · 23 غیر حاضر",
      monthlyFee: 562000,
      feeSublineEn: "+11.2% vs last month",
      feeSublineUr: "+11.2% پچھلے مہینے سے",
      arrears: 72500,
      arrearsSublineEn: "88% recovery rate",
      arrearsSublineUr: "88% وصولی کی شرح",
      teacherCount: 11,
      teachersSublineEn: "11 School Teachers",
      teachersSublineUr: "11 اساتذہ سکول",
    },
    chartMeta: {
      titleEn: "Al-Qasim Academy — School Enrollment Trend",
      titleUr: "القاسم اکیڈمی — داخلوں کا رجحان",
      subEn: "Monthly enrollment growth for School Department (Last 12 Months)",
      subUr: "شعبہ سکول میں ماہانہ داخلوں کی مجموعی پیش رفت",
      lines: [
        {
          dataKey: "series1",
          nameEn: "School Enrolled",
          nameUr: "شعبہ سکول داخلے",
          color: "#3b82f6",
        },
        {
          dataKey: "series2",
          nameEn: "New Monthly Admissions",
          nameUr: "نئے داخلے",
          color: "#8b5cf6",
        },
      ],
    },
    financialMeta: {
      titleEn: "Academy Fee Collection & Recovery",
      titleUr: "القاسم اکیڈمی — فیس وصولی و بقایا جات",
      subEn: "Current month fees and arrears recovery for school boys",
      subUr: "القاسم اکیڈمی سکول کے ماہانہ فیس واجبات اور وصولی کا جائزہ",
      target: 634500,
      collected: 562000,
      pending: 72500,
      recoveryRate: "88.6%",
      studentStatus: {
        cleared: { count: 215, pct: "69%" },
        partial: { count: 65, pct: "21%" },
        unpaid: { count: 32, pct: "10%" },
      },
      monthlyHistory: [
        { month: "May", monthUr: "مئی", collected: 510000, target: 580000 },
        { month: "Jun", monthUr: "جون", collected: 528000, target: 595000 },
        { month: "Jul", monthUr: "جولائی", collected: 540000, target: 610000 },
        { month: "Aug", monthUr: "اگست", collected: 551000, target: 620000 },
        { month: "Sep", monthUr: "ستمبر", collected: 555000, target: 628000 },
        { month: "Oct", monthUr: "اکتوبر", collected: 562000, target: 634500 },
      ],
    },
    cashflowMeta: {
      monthly: {
        totalIncome: 785000,
        totalExpenses: 657000,
        incomeSources: [
          { id: "fees", nameEn: "School Tuition & Exam Fees", nameUr: "سکول ماہانہ ٹیوشن و امتحانی فیس", amount: 562000, iconName: "Banknote" },
          { id: "donations", nameEn: "Academy Support Grants", nameUr: "اکیڈمی گرانٹس و معاونت", amount: 110000, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Orphan Education Scholarships", nameUr: "یتیم و نادار طلبہ تعلیمی فنڈ", amount: 35000, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Facility Usage Share", nameUr: "سکول املاک کا حصہ", amount: 30000, iconName: "Store" },
          { id: "mess", nameEn: "Canteen & Transport Charges", nameUr: "کینٹین و ٹرانسپورٹ واجبات", amount: 22000, iconName: "Utensils" },
          { id: "books", nameEn: "Uniform, Notebooks & Books", nameUr: "یونیفارم، کاپیاں و درسی کتب", amount: 20000, iconName: "BookOpen" },
          { id: "other", nameEn: "Sports & Club Fees", nameUr: "کھیل و دیگر فیس", amount: 6000, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "School Teachers & Staff Salaries", nameUr: "سکول اساتذہ و سٹاف تنخواہیں", amount: 480000, iconName: "Users" },
          { id: "utilities", nameEn: "School Utilities & Internet", nameUr: "بجلی، گیس، پانی و انٹرنیٹ", amount: 75000, iconName: "Zap" },
          { id: "mess", nameEn: "Science Lab & Canteen Supplies", nameUr: "سائنس لیب و کینٹین اخراجات", amount: 20000, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Desks, Whiteboards & Classrooms", nameUr: "ڈیسک، وائٹ بورڈز و کلاس رومز", amount: 32000, iconName: "Wrench" },
          { id: "stationery", nameEn: "Exam Papers, Worksheets & Print", nameUr: "امتحانی پرچے، ورک شیٹس و پرنٹنگ", amount: 28000, iconName: "FileText" },
          { id: "welfare", nameEn: "Fee Concession & Student Support", nameUr: "فیس رعایت و طالب علم وظائف", amount: 12000, iconName: "HeartPulse" },
          { id: "misc", nameEn: "School Events & Operations", nameUr: "تقاریب، مقابلے و دفتری اخراجات", amount: 10000, iconName: "MoreHorizontal" },
        ],
      },
      daily: {
        totalIncome: 30600,
        totalExpenses: 11000,
        incomeSources: [
          { id: "fees", nameEn: "School Cash Counter Fees", nameUr: "سکول کاؤنٹر نقد فیس", amount: 22000, iconName: "Banknote" },
          { id: "donations", nameEn: "Alumni & Parent Contributions", nameUr: "والدین کی معاونت", amount: 4000, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Student Aid Donations", nameUr: "طالب علم امداد عطیات", amount: 1500, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Daily Facility Share", nameUr: "یومیہ حصہ", amount: 1000, iconName: "Store" },
          { id: "mess", nameEn: "School Canteen Sales", nameUr: "سکول کینٹین آمدن", amount: 800, iconName: "Utensils" },
          { id: "books", nameEn: "Stationery & Badges", nameUr: "سٹیشنری و بیجز", amount: 1000, iconName: "BookOpen" },
          { id: "other", nameEn: "Admission Form Sales", nameUr: "داخلہ فارم کی فروخت", amount: 300, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Daily Assistant Wages", nameUr: "معاون عملہ کی یومیہ اجرت", amount: 2500, iconName: "Users" },
          { id: "utilities", nameEn: "Power & Computer Lab Fuel", nameUr: "بجلی و کمپیوٹر لیب ایندھن", amount: 2800, iconName: "Zap" },
          { id: "mess", nameEn: "Daily Canteen Restocking", nameUr: "کینٹین راشن", amount: 2200, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Furniture & Door Repairs", nameUr: "فرنیچر و دروازوں کی مرمت", amount: 1400, iconName: "Wrench" },
          { id: "stationery", nameEn: "Daily Tests & Printing Paper", nameUr: "روزانہ ٹیسٹ پیپرز و پرنٹنگ", amount: 1100, iconName: "FileText" },
          { id: "welfare", nameEn: "Student First-Aid Box", nameUr: "فرسٹ ایڈ باکس اخراجات", amount: 600, iconName: "HeartPulse" },
          { id: "misc", nameEn: "Sanitation & Cleaning", nameUr: "صفائی و متفرق ضروریات", amount: 400, iconName: "MoreHorizontal" },
        ],
      },
    },
    attendanceSummary: {
      avgRate: "92.6%",
      bestDay: "Mon · 95.1%",
      lowDay: "Thu · 90.2%",
      rates: [
        { day: "Mon", dayUr: "پیر", rate: 95 },
        { day: "Tue", dayUr: "منگل", rate: 93 },
        { day: "Wed", dayUr: "بدھ", rate: 94 },
        { day: "Thu", dayUr: "جمعرات", rate: 90 },
        { day: "Fri", dayUr: "جمعہ", rate: 93 },
        { day: "Sat", dayUr: "ہفتہ", rate: 91 },
        { day: "Sun", dayUr: "اتوار", rate: 92 },
      ],
    },
  },

  zainab_madrassa: {
    key: "zainab_madrassa",
    labelEn: "Jamia Zainab Lil-Banat (Madrassa Girls)",
    labelUr: "جامعہ زینب للبنات (مدرسہ)",
    shortNameEn: "Zainab Madrassa",
    shortNameUr: "زینب مدرسہ",
    descEn: "Islamic education, Dars-e-Nizami, and Nazira branches for girls.",
    descUr: "طالبات کے لیے درس نظامی اور ناظرہ قرآن کے شعبہ جات",
    taglineEn: "Religious education & Dars-e-Nizami for girls",
    taglineUr: "طالبات کے لیے دینی تعلیم و تربیت",
    icon: BookOpen,
    color: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    studentCount: 266,
    kpis: {
      totalStudents: "266",
      studentsSublineEn: "Dars-e-Nizami 142 · Nazira 124",
      studentsSublineUr: "درس نظامی 142 · ناظرہ 124",
      attendanceRate: "94.0%",
      attendanceSublineEn: "250 Present · 16 Absent",
      attendanceSublineUr: "250 حاضر · 16 غیر حاضر",
      monthlyFee: 345000,
      feeSublineEn: "+5.8% vs last month",
      feeSublineUr: "+5.8% پچھلے مہینے سے",
      arrears: 38000,
      arrearsSublineEn: "94% recovery rate",
      arrearsSublineUr: "94% وصولی کی شرح",
      teacherCount: 9,
      teachersSublineEn: "Nizami Banat 6 · Nazira 3",
      teachersSublineUr: "نظامی معلمات 6 · ناظرہ 3",
    },
    chartMeta: {
      titleEn: "Jamia Zainab — Department Growth",
      titleUr: "جامعہ زینب — شعبہ جات کے داخلوں کا رجحان",
      subEn: "Monthly trend for Girls Dars-e-Nizami and Nazira (Last 12 Months)",
      subUr: "درس نظامی بنات اور ناظرہ میں ماہانہ داخلوں کی پیش رفت",
      lines: [
        {
          dataKey: "series1",
          nameEn: "Dars-e-Nizami (Girls)",
          nameUr: "درس نظامی بنات",
          color: "#ec4899",
        },
        {
          dataKey: "series2",
          nameEn: "Nazira & Qaida",
          nameUr: "ناظرہ و قاعدہ بنات",
          color: "#a855f7",
        },
      ],
    },
    financialMeta: {
      titleEn: "Zainab Madrassa Fee Collection & Recovery",
      titleUr: "جامعہ زینب مدرسہ — فیس وصولی و بقایا جات",
      subEn: "Current month fees and dues recovery for female madrassa",
      subUr: "جامعہ زینب للبنات کی ماہانہ فیس اور وصولی کی کارکردگی",
      target: 383000,
      collected: 345000,
      pending: 38000,
      recoveryRate: "90.1%",
      studentStatus: {
        cleared: { count: 188, pct: "71%" },
        partial: { count: 54, pct: "20%" },
        unpaid: { count: 24, pct: "9%" },
      },
      monthlyHistory: [
        { month: "May", monthUr: "مئی", collected: 322000, target: 355000 },
        { month: "Jun", monthUr: "جون", collected: 330000, target: 362000 },
        { month: "Jul", monthUr: "جولائی", collected: 336000, target: 370000 },
        { month: "Aug", monthUr: "اگست", collected: 340000, target: 375000 },
        { month: "Sep", monthUr: "ستمبر", collected: 342000, target: 380000 },
        { month: "Oct", monthUr: "اکتوبر", collected: 345000, target: 383000 },
      ],
    },
    cashflowMeta: {
      monthly: {
        totalIncome: 619000,
        totalExpenses: 383000,
        incomeSources: [
          { id: "fees", nameEn: "Girls Dars-e-Nizami Fees", nameUr: "درس نظامی بنات فیس", amount: 345000, iconName: "Banknote" },
          { id: "donations", nameEn: "Banat Madrassa Donations", nameUr: "جامعہ زینب عطیات و خیرات", amount: 120000, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Zakat for Talibaat Fund", nameUr: "طالبات زکوٰۃ و صدقات فنڈ", amount: 95000, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Rental Property Share", nameUr: "کرایہ جاتی آمدن حصہ", amount: 32000, iconName: "Store" },
          { id: "mess", nameEn: "Girls Hostel Mess Fund", nameUr: "بنات ہاسٹل و طعام فنڈ", amount: 15000, iconName: "Utensils" },
          { id: "books", nameEn: "Islamic Books & Hijabs", nameUr: "دینی کتب و حجاب سیٹ", amount: 7000, iconName: "BookOpen" },
          { id: "other", nameEn: "Other Receipts", nameUr: "دیگر وصولیاں", amount: 5000, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Female Teachers & Staff", nameUr: "معلمات و عملہ بنات کی تنخواہیں", amount: 255000, iconName: "Users" },
          { id: "utilities", nameEn: "Banat Campus Utilities", nameUr: "کیمپس بجلی، گیس و پانی", amount: 45000, iconName: "Zap" },
          { id: "mess", nameEn: "Kitchen & Hostel Food", nameUr: "طعام و ہاسٹل راشن", amount: 42000, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Pardah & Building Maintenance", nameUr: "پردہ و عمارت کی دیکھ بھال", amount: 20000, iconName: "Wrench" },
          { id: "stationery", nameEn: "Registers, Tests & Stationery", nameUr: "رجسٹرز و امتحانی کاغذ", amount: 10000, iconName: "FileText" },
          { id: "welfare", nameEn: "Talibaat Health & Medical Aid", nameUr: "طالبات طبی و ویلفیئر فنڈ", amount: 5000, iconName: "HeartPulse" },
          { id: "misc", nameEn: "Campus Security & Cleanliness", nameUr: "سیکیورٹی، صفائی و متفرق", amount: 6000, iconName: "MoreHorizontal" },
        ],
      },
      daily: {
        totalIncome: 22300,
        totalExpenses: 6800,
        incomeSources: [
          { id: "fees", nameEn: "Counter Fees Collected", nameUr: "کاؤنٹر فیس وصولی", amount: 12500, iconName: "Banknote" },
          { id: "donations", nameEn: "Female Donors Charity", nameUr: "خواتین عطیات و امداد", amount: 4200, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Talibaat Zakat Receipts", nameUr: "زکوٰۃ رسیدات", amount: 3500, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Daily Rent Share", nameUr: "یومیہ کرایہ حصہ", amount: 1100, iconName: "Store" },
          { id: "mess", nameEn: "Hostel Meal Tokens", nameUr: "کھانا ٹوکن", amount: 500, iconName: "Utensils" },
          { id: "books", nameEn: "Islamic Books Sold", nameUr: "کتب فروخت", amount: 300, iconName: "BookOpen" },
          { id: "other", nameEn: "Misc Receipts", nameUr: "متفرق وصولی", amount: 200, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Daily Cleaning Staff Wages", nameUr: "صفائی عملہ یومیہ اجرت", amount: 1500, iconName: "Users" },
          { id: "utilities", nameEn: "Gas & Backup Electricity", nameUr: "گیس سلنڈر و یو پی ایس ایندھن", amount: 1400, iconName: "Zap" },
          { id: "mess", nameEn: "Fresh Milk & Vegetables", nameUr: "تازہ دودھ و سبزیاں", amount: 2400, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Door Latches & Locks", nameUr: "تالے و فوری مرمت", amount: 600, iconName: "Wrench" },
          { id: "stationery", nameEn: "Daily Homework Copies", nameUr: "کاپیاں و پرنٹنگ", amount: 300, iconName: "FileText" },
          { id: "welfare", nameEn: "Emergency First Aid", nameUr: "ہنگامی ادویات", amount: 300, iconName: "HeartPulse" },
          { id: "misc", nameEn: "Daily Cleaning Chemicals", nameUr: "فنائل و صفائی سامان", amount: 300, iconName: "MoreHorizontal" },
        ],
      },
    },
    attendanceSummary: {
      avgRate: "94.0%",
      bestDay: "Wed · 96.2%",
      lowDay: "Sat · 91.5%",
      rates: [
        { day: "Mon", dayUr: "پیر", rate: 94 },
        { day: "Tue", dayUr: "منگل", rate: 95 },
        { day: "Wed", dayUr: "بدھ", rate: 96 },
        { day: "Thu", dayUr: "جمعرات", rate: 93 },
        { day: "Fri", dayUr: "جمعہ", rate: 95 },
        { day: "Sat", dayUr: "ہفتہ", rate: 92 },
        { day: "Sun", dayUr: "اتوار", rate: 93 },
      ],
    },
  },

  zainab_school: {
    key: "zainab_school",
    labelEn: "Jamia Zainab Lil-Banat (School Girls)",
    labelUr: "جامعہ زینب للبنات (شعبہ سکول)",
    shortNameEn: "Zainab School",
    shortNameUr: "زینب سکول",
    descEn: "Formal education and curriculum for girls school.",
    descUr: "طالبات کے لیے باقاعدہ سکول کی تعلیم و تربیت",
    taglineEn: "Formal school education for girls",
    taglineUr: "طالبات کے لیے باقاعدہ سکول تعلیم",
    icon: School,
    color: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    studentCount: 124,
    kpis: {
      totalStudents: "124",
      studentsSublineEn: "124 Students · School Section",
      studentsSublineUr: "124 طالبات · شعبہ سکول",
      attendanceRate: "91.9%",
      attendanceSublineEn: "114 Present · 10 Absent",
      attendanceSublineUr: "114 حاضر · 10 غیر حاضر",
      monthlyFee: 150000,
      feeSublineEn: "+7.2% vs last month",
      feeSublineUr: "+7.2% پچھلے مہینے سے",
      arrears: 20000,
      arrearsSublineEn: "88% recovery rate",
      arrearsSublineUr: "88% وصولی کی شرح",
      teacherCount: 5,
      teachersSublineEn: "5 School Teachers",
      teachersSublineUr: "5 معلمات سکول",
    },
    chartMeta: {
      titleEn: "Jamia Zainab School — Enrollment Trend",
      titleUr: "جامعہ زینب (شعبہ سکول) — داخلوں کا رجحان",
      subEn: "Monthly enrollment growth for Girls School (Last 12 Months)",
      subUr: "طالبات کے شعبہ سکول میں ماہانہ داخلوں کی مجموعی پیش رفت",
      lines: [
        {
          dataKey: "series1",
          nameEn: "School Enrolled",
          nameUr: "شعبہ سکول داخلے",
          color: "#f59e0b",
        },
        {
          dataKey: "series2",
          nameEn: "New Monthly Admissions",
          nameUr: "نئے داخلے",
          color: "#eab308",
        },
      ],
    },
    financialMeta: {
      titleEn: "Girls School Fee Collection & Recovery",
      titleUr: "جامعہ زینب سکول — فیس وصولی و بقایا جات",
      subEn: "Current month fees and dues recovery for female school department",
      subUr: "جامعہ زینب گرلز سکول کے فیس واجبات اور وصولی کی صورتحال",
      target: 170000,
      collected: 150000,
      pending: 20000,
      recoveryRate: "88.2%",
      studentStatus: {
        cleared: { count: 82, pct: "66%" },
        partial: { count: 26, pct: "21%" },
        unpaid: { count: 16, pct: "13%" },
      },
      monthlyHistory: [
        { month: "May", monthUr: "مئی", collected: 136000, target: 155000 },
        { month: "Jun", monthUr: "جون", collected: 141000, target: 160000 },
        { month: "Jul", monthUr: "جولائی", collected: 145000, target: 164000 },
        { month: "Aug", monthUr: "اگست", collected: 147000, target: 166000 },
        { month: "Sep", monthUr: "ستمبر", collected: 148000, target: 168000 },
        { month: "Oct", monthUr: "اکتوبر", collected: 150000, target: 170000 },
      ],
    },
    cashflowMeta: {
      monthly: {
        totalIncome: 266000,
        totalExpenses: 183000,
        incomeSources: [
          { id: "fees", nameEn: "Girls School Monthly Fees", nameUr: "شعبہ سکول طالبات فیس", amount: 150000, iconName: "Banknote" },
          { id: "donations", nameEn: "School Sponsors & Grants", nameUr: "سکول سپانسرز و عطیات", amount: 50000, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Girls Education Support", nameUr: "طالبات تعلیم امدادی فنڈ", amount: 35000, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Premises Rent Share", nameUr: "کرایہ جاتی آمدن حصہ", amount: 18000, iconName: "Store" },
          { id: "mess", nameEn: "Activity & Refreshment Fund", nameUr: "سرگرمیاں و ریفریشمنٹ فنڈ", amount: 8000, iconName: "Utensils" },
          { id: "books", nameEn: "Curriculum Books & Folders", nameUr: "درسی کتب و سٹیشنری", amount: 3000, iconName: "BookOpen" },
          { id: "other", nameEn: "Admission Processing", nameUr: "داخلہ فارم فیس", amount: 2000, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "School Mistresses & Staff", nameUr: "سکول ٹیچرز و ملازمین تنخواہیں", amount: 125000, iconName: "Users" },
          { id: "utilities", nameEn: "Classroom Utilities", nameUr: "کلاس رومز بجلی و پانی بلز", amount: 20000, iconName: "Zap" },
          { id: "mess", nameEn: "Refreshments & Events", nameUr: "طلبہ ریفریشمنٹ و کینٹین", amount: 18000, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Desks & Whiteboard Upkeep", nameUr: "بینچز و وائٹ بورڈ دیکھ بھال", amount: 10000, iconName: "Wrench" },
          { id: "stationery", nameEn: "Question Papers & Folders", nameUr: "پرچہ جات، ٹیسٹ و پرنٹنگ", amount: 5000, iconName: "FileText" },
          { id: "welfare", nameEn: "Student Books Assistance", nameUr: "ضرورت مند طالبات امداد", amount: 2000, iconName: "HeartPulse" },
          { id: "misc", nameEn: "Office Supplies & Misc", nameUr: "دفتری سامان و متفرق", amount: 3000, iconName: "MoreHorizontal" },
        ],
      },
      daily: {
        totalIncome: 11300,
        totalExpenses: 3800,
        incomeSources: [
          { id: "fees", nameEn: "Today's School Fee Receipts", nameUr: "آج کی فیس وصولی", amount: 7500, iconName: "Banknote" },
          { id: "donations", nameEn: "Parent Voluntary Gifts", nameUr: "والدین کی طرف سے تعاون", amount: 1800, iconName: "HeartHandshake" },
          { id: "zakat", nameEn: "Scholarship Receipts", nameUr: "وظیفہ فنڈ", amount: 1000, iconName: "ShieldCheck" },
          { id: "waqf", nameEn: "Facility Rent", nameUr: "کرایہ حصہ", amount: 500, iconName: "Store" },
          { id: "mess", nameEn: "Snack / Canteen Sales", nameUr: "کینٹین", amount: 200, iconName: "Utensils" },
          { id: "books", nameEn: "Notebook Sales", nameUr: "کاپیاں", amount: 200, iconName: "BookOpen" },
          { id: "other", nameEn: "Forms", nameUr: "فارمز", amount: 100, iconName: "Layers" },
        ],
        expenseCategories: [
          { id: "salaries", nameEn: "Daily Attendant Wages", nameUr: "یومیہ اجرت", amount: 1000, iconName: "Users" },
          { id: "utilities", nameEn: "Daily Power & Water", nameUr: "بجلی و پانی", amount: 800, iconName: "Zap" },
          { id: "mess", nameEn: "Daily Refreshment", nameUr: "ریفریشمنٹ", amount: 1000, iconName: "Utensils" },
          { id: "maintenance", nameEn: "Classroom Repairs", nameUr: "مرمت", amount: 400, iconName: "Wrench" },
          { id: "stationery", nameEn: "Paper Photocopying", nameUr: "فوٹو کاپی", amount: 200, iconName: "FileText" },
          { id: "welfare", nameEn: "Student Bandages & Aid", nameUr: "مرہم پٹی و دوا", amount: 200, iconName: "HeartPulse" },
          { id: "misc", nameEn: "Tea & Cleaning", nameUr: "چائے و صفائی", amount: 200, iconName: "MoreHorizontal" },
        ],
      },
    },
    attendanceSummary: {
      avgRate: "91.9%",
      bestDay: "Tue · 94.8%",
      lowDay: "Thu · 89.4%",
      rates: [
        { day: "Mon", dayUr: "پیر", rate: 92 },
        { day: "Tue", dayUr: "منگل", rate: 95 },
        { day: "Wed", dayUr: "بدھ", rate: 93 },
        { day: "Thu", dayUr: "جمعرات", rate: 89 },
        { day: "Fri", dayUr: "جمعہ", rate: 92 },
        { day: "Sat", dayUr: "ہفتہ", rate: 90 },
        { day: "Sun", dayUr: "اتوار", rate: 92 },
      ],
    },
  },
};

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

// 12-month data sets for each filter
function getTrendDataForFilter(filter: DashboardFilter) {
  if (filter === "all") {
    return MONTHS.map((month, i) => ({
      month,
      qasimiaMadrassa: 480 + Math.round(i * 5.8 + Math.sin(i / 2) * 12),
      qasimAcademy: 260 + Math.round(i * 4.6 + Math.cos(i / 2) * 9),
      zainabMadrassa: 220 + Math.round(i * 4.1 + Math.sin(i / 2 + 1) * 8),
      zainabSchool: 90 + Math.round(i * 3.0 + Math.cos(i / 2 + 1) * 5),
    }));
  }

  if (filter === "qasimia_madrassa") {
    return MONTHS.map((month, i) => ({
      month,
      series1: 215 + Math.round(i * 2.9 + Math.sin(i) * 5), // Dars-e-Nizami
      series2: 140 + Math.round(i * 1.9 + Math.cos(i) * 4), // Hifz
      series3: 125 + Math.round(i * 1.0 + Math.sin(i * 1.5) * 3), // Nazira
    }));
  }

  if (filter === "qasim_academy") {
    return MONTHS.map((month, i) => ({
      month,
      series1: 260 + Math.round(i * 4.6 + Math.cos(i / 2) * 9), // School Enrolled
      series2: 18 + Math.round(Math.sin(i) * 5 + i * 0.8), // New Admissions
    }));
  }

  if (filter === "zainab_madrassa") {
    return MONTHS.map((month, i) => ({
      month,
      series1: 118 + Math.round(i * 2.1 + Math.sin(i) * 4), // Nizami Banat
      series2: 102 + Math.round(i * 1.9 + Math.cos(i) * 3), // Nazira Banat
    }));
  }

  // zainab_school
  return MONTHS.map((month, i) => ({
    month,
    series1: 90 + Math.round(i * 3.0 + Math.cos(i / 2 + 1) * 5), // School Enrolled
    series2: 8 + Math.round(Math.sin(i) * 2 + i * 0.4), // New Admissions
  }));
}

const FILTER_KEYS: DashboardFilter[] = [
  "all",
  "qasimia_madrassa",
  "qasim_academy",
  "zainab_madrassa",
  "zainab_school",
];

function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [selectedFilter, setSelectedFilter] = useState<DashboardFilter>(search.filter || "all");
  const activeFilter: DashboardFilter = selectedFilter;
  const setFilter = (key: DashboardFilter) => {
    setSelectedFilter(key);
    void navigate({
      search: (prev: any) => ({ ...prev, filter: key === "all" ? undefined : key }),
      replace: true,
    } as any);
  };

  const activeConfig = ENTITY_CONFIGS[activeFilter] ?? ENTITY_CONFIGS.all;
  const trendData = useMemo(() => getTrendDataForFilter(activeFilter), [activeFilter]);

  const [cashflowPeriod, setCashflowPeriod] = useState<"monthly" | "daily">("monthly");
  const activeCashflow = activeConfig.cashflowMeta[cashflowPeriod];
  const netSurplus = activeCashflow.totalIncome - activeCashflow.totalExpenses;
  const surplusMargin = Math.round(
    ((activeCashflow.totalIncome - activeCashflow.totalExpenses) / (activeCashflow.totalIncome || 1)) * 100,
  );

  useEffect(() => {
    if (!user) return;
    if (user.role === "finance_admin" || user.role === "accountant") {
      void navigate({ to: "/finance", replace: true });
    } else if (user.role === "admission_admin") {
      void navigate({ to: "/admission", replace: true });
    } else if (user.role === "academic_admin") {
      void navigate({ to: "/madrassa/students", replace: true });
    } else if (user.role === "hr_admin" || user.role === "hr_manager") {
      void navigate({ to: "/hr", replace: true });
    } else if (user.role === "reports_admin") {
      void navigate({ to: "/reports", replace: true });
    } else if (user.role === "parent") {
      void navigate({ to: "/parents", replace: true });
    }
  }, [user, navigate]);

  if (isLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  if (!user) {
    return null;
  }

  if (user.role === "finance_admin" || user.role === "accountant") {
    return <BookLoader text={lang === "ur" ? "مالیات ڈیش بورڈ لوڈ ہو رہا ہے..." : "Redirecting to Finance Dashboard..."} className="h-96" />;
  }
  if (user.role === "admission_admin") {
    return <BookLoader text={lang === "ur" ? "داخلہ ڈیش بورڈ لوڈ ہو رہا ہے..." : "Redirecting to Admission Dashboard..."} className="h-96" />;
  }
  if (user.role === "academic_admin") {
    return <BookLoader text={lang === "ur" ? "تعلیمی ڈیش بورڈ لوڈ ہو رہا ہے..." : "Redirecting to Academic Dashboard..."} className="h-96" />;
  }
  if (user.role === "hr_admin" || user.role === "hr_manager") {
    return <BookLoader text={lang === "ur" ? "ایچ آر ڈیش بورڈ لوڈ ہو رہا ہے..." : "Redirecting to HR Dashboard..."} className="h-96" />;
  }
  if (user.role === "reports_admin") {
    return <BookLoader text={lang === "ur" ? "رپورٹس ڈیش بورڈ لوڈ ہو رہا ہے..." : "Redirecting to Reports Dashboard..."} className="h-96" />;
  }
  if (user.role === "parent") {
    return <BookLoader text={lang === "ur" ? "والدین پورٹل لوڈ ہو رہا ہے..." : "Redirecting to Parent Portal..."} className="h-96" />;
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todayUrdu = new Intl.DateTimeFormat("ur-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const ActiveIcon = activeConfig.icon;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {lang === "ur" ? "السلام عليكم" : "Assalamu Alaikum"}, {user?.name ?? "User"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lang === "ur" ? todayUrdu : today}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl border", activeConfig.badgeBg)}>
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div className="text-start sm:text-end">
              <p className="font-semibold text-sm leading-tight">
                {lang === "ur" ? activeConfig.labelUr : activeConfig.labelEn}
              </p>
              <p className="font-urdu text-xs text-muted-foreground mt-0.5">
                {lang === "ur" ? activeConfig.taglineUr : activeConfig.taglineEn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Entity Filter Selector Bar */}
      <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>{lang === "ur" ? "شعبہ / ادارہ فلٹر کریں:" : "Institution Filter:"}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {FILTER_KEYS.map((key) => {
              const cfg = ENTITY_CONFIGS[key];
              const isSelected = activeFilter === key;
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer select-none",
                    isSelected
                      ? cn("shadow-xs font-semibold border", cfg.badgeBg)
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{lang === "ur" ? cfg.shortNameUr : cfg.shortNameEn}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full tabular-nums",
                      isSelected ? "bg-background/80" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {cfg.studentCount}
                  </span>
                  {isSelected && <Check className="h-3 w-3 ms-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page header with active filter scope */}
      <PageHeader
        title={lang === "ur" ? activeConfig.labelUr : activeConfig.labelEn}
        titleUrdu={activeConfig.labelUr}
        description={lang === "ur" ? activeConfig.descUr : activeConfig.descEn}
        descriptionUrdu={activeConfig.descUr}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={Users}
          value={activeConfig.kpis.totalStudents}
          label={lang === "ur" ? "کل طلبہ" : "Total Students"}
          labelUrdu="کل طلبہ"
          subline={
            lang === "ur"
              ? activeConfig.kpis.studentsSublineUr
              : activeConfig.kpis.studentsSublineEn
          }
          trend={{ direction: "up", value: lang === "ur" ? "+3.2% اس ماہ" : "+3.2% this month" }}
          sparkline={sparkline(1)}
        />
        <KpiCard
          icon={CalendarCheck2}
          value={activeConfig.kpis.attendanceRate}
          label={lang === "ur" ? "آج کی حاضری" : "Today's Attendance"}
          labelUrdu="آج کی حاضری"
          subline={
            lang === "ur"
              ? activeConfig.kpis.attendanceSublineUr
              : activeConfig.kpis.attendanceSublineEn
          }
          trend={{ direction: "up", value: lang === "ur" ? "+1.4% کل سے" : "+1.4% vs yesterday" }}
          sparkline={sparkline(2)}
        />
        <KpiCard
          icon={Banknote}
          value={formatPKR(activeConfig.kpis.monthlyFee)}
          label={lang === "ur" ? "ماہانہ وصولی" : "Fees Collected (Month)"}
          labelUrdu="ماہانہ وصولی"
          subline={
            lang === "ur" ? activeConfig.kpis.feeSublineUr : activeConfig.kpis.feeSublineEn
          }
          trend={{
            direction: "up",
            value: lang === "ur" ? "+8.6% پچھلے مہینے سے" : "+8.6% vs last month",
          }}
          sparkline={sparkline(3)}
        />
        <KpiCard
          icon={AlertTriangle}
          value={formatPKR(activeConfig.kpis.arrears)}
          label={lang === "ur" ? "بقایا جات" : "Pending Arrears"}
          labelUrdu="بقایا جات"
          subline={
            lang === "ur" ? activeConfig.kpis.arrearsSublineUr : activeConfig.kpis.arrearsSublineEn
          }
          tone="destructive"
          trend={{ direction: "down", value: lang === "ur" ? "-2.1% وصول ہوا" : "-2.1% recovered" }}
          sparkline={sparkline(4)}
        />
        <KpiCard
          icon={GraduationCap}
          value={String(activeConfig.kpis.teacherCount)}
          label={lang === "ur" ? "فعال اساتذہ" : "Active Teachers"}
          labelUrdu="فعال اساتذہ"
          subline={
            lang === "ur"
              ? activeConfig.kpis.teachersSublineUr
              : activeConfig.kpis.teachersSublineEn
          }
          sparkline={sparkline(5)}
        />
      </div>

      {/* Main Graph: Enrollment trend (broad details when 'all', specialized when filtered) */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-semibold text-base">
                {lang === "ur" ? activeConfig.chartMeta.titleUr : activeConfig.chartMeta.titleEn}
              </h3>
            </div>
            <p className="font-urdu text-sm text-muted-foreground mt-0.5">
              {lang === "ur" ? activeConfig.chartMeta.subUr : activeConfig.chartMeta.subEn}
            </p>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto text-xs py-1 px-2.5">
            {lang === "ur" ? activeConfig.shortNameUr : activeConfig.shortNameEn} ·{" "}
            {activeConfig.kpis.totalStudents} {lang === "ur" ? "طلبہ" : "Students"}
          </Badge>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              {activeConfig.chartMeta.lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={lang === "ur" ? line.nameUr : line.nameEn}
                  stroke={line.color}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two column row: Attendance Summary & Monthly Fee Recovery Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Summary */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-base">
                    {lang === "ur" ? "حاضری — گزشتہ 7 دن" : "Attendance — Last 7 Days"}
                  </h3>
                </div>
                <p className="font-urdu text-sm text-muted-foreground mt-0.5">
                  {lang === "ur"
                    ? `${activeConfig.shortNameUr} کی ہفتہ وار حاضری کا جائزہ`
                    : `Weekly attendance for ${activeConfig.shortNameEn}`}
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {activeConfig.attendanceSummary.avgRate}
              </Badge>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {activeConfig.attendanceSummary.rates.map((d) => {
                const intensity = Math.min(1, Math.max(0.2, d.rate / 100));
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2">
                    <div
                      className="aspect-square w-full rounded-lg border border-border/60 flex items-end justify-center p-1 text-[10px] text-primary-foreground font-semibold shadow-xs"
                      style={{
                        background: `color-mix(in oklab, var(--color-primary) ${Math.round(intensity * 100)}%, transparent)`,
                      }}
                    >
                      {d.rate}%
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {lang === "ur" ? d.dayUr : d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-heading text-lg font-bold tabular-nums">
                {activeConfig.attendanceSummary.avgRate}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {lang === "ur" ? "اوسط حاضری" : "Average Rate"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-heading text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {activeConfig.attendanceSummary.bestDay}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {lang === "ur" ? "بہترین دن" : "Best Day"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-heading text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {activeConfig.attendanceSummary.lowDay}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {lang === "ur" ? "کم ترین دن" : "Lowest Day"}
              </p>
            </div>
          </div>
        </Card>

        {/* Monthly Fee Collection & Recovery Tracker (Replaced redundant distribution pie chart) */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-heading font-semibold text-base">
                    {lang === "ur"
                      ? activeConfig.financialMeta.titleUr
                      : activeConfig.financialMeta.titleEn}
                  </h3>
                </div>
                <p className="font-urdu text-sm text-muted-foreground mt-0.5">
                  {lang === "ur"
                    ? activeConfig.financialMeta.subUr
                    : activeConfig.financialMeta.subEn}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs"
              >
                {activeConfig.financialMeta.recoveryRate} {lang === "ur" ? "وصولی" : "Recovery"}
              </Badge>
            </div>

            {/* 3 Quick Financial Stat Chips */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                <p className="text-[10px] text-muted-foreground truncate">
                  {lang === "ur" ? "وصول شدہ فیس" : "Collected"}
                </p>
                <p className="font-heading text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatPKR(activeConfig.financialMeta.collected)}
                </p>
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-2.5">
                <p className="text-[10px] text-muted-foreground truncate">
                  {lang === "ur" ? "بقایا جات" : "Pending Arrears"}
                </p>
                <p className="font-heading text-sm sm:text-base font-bold text-destructive tabular-nums">
                  {formatPKR(activeConfig.financialMeta.pending)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                <p className="text-[10px] text-muted-foreground truncate">
                  {lang === "ur" ? "ماہانہ ہدف" : "Target"}
                </p>
                <p className="font-heading text-sm sm:text-base font-bold tabular-nums">
                  {formatPKR(activeConfig.financialMeta.target)}
                </p>
              </div>
            </div>

            {/* 6-Month Comparison BarChart */}
            <div className="h-44 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeConfig.financialMeta.monthlyHistory}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                    width={34}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)",
                      fontSize: 12,
                    }}
                    formatter={(val: any, name: any) => [
                      formatPKR(Number(val)),
                      name === "collected"
                        ? lang === "ur"
                          ? "وصول شدہ"
                          : "Collected"
                        : lang === "ur"
                          ? "ہدف"
                          : "Target",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar
                    dataKey="collected"
                    name={lang === "ur" ? "وصول شدہ فیس" : "Collected Fee"}
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="target"
                    name={lang === "ur" ? "ماہانہ ہدف" : "Monthly Target"}
                    fill="#94a3b8"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student Payment Status Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center text-xs">
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                {activeConfig.financialMeta.studentStatus.cleared.pct}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === "ur" ? "مکمل ادا شدہ" : "Fully Paid"}
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                {activeConfig.financialMeta.studentStatus.partial.pct}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === "ur" ? "جزوی ادائیگی" : "Partial"}
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="font-semibold text-destructive">
                {activeConfig.financialMeta.studentStatus.unpaid.pct}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === "ur" ? "واجب الادا" : "Overdue"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cashflow & Financial Health: Income Sources & Operational Expenses (Month / Daily toggle) */}
      <Card className="p-5 overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold text-lg">
                {lang === "ur" ? "آمدن کے تمام ذرائع اور اخراجات" : "Income Sources & Operational Expenses"}
              </h3>
            </div>
            <p className="font-urdu text-sm text-muted-foreground mt-0.5">
              {lang === "ur"
                ? `${activeConfig.shortNameUr} کے تمام مالیاتی ذرائع اور شعبہ جاتی اخراجات کا تقابلی جائزہ (${cashflowPeriod === "monthly" ? "ماہانہ" : "روزانہ / آج"})`
                : `Comprehensive breakdown of all revenue sources and expense heads for ${activeConfig.shortNameEn} (${cashflowPeriod === "monthly" ? "Monthly" : "Daily / Today"})`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Period Toggle */}
            <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl border border-border/70">
              <button
                type="button"
                onClick={() => setCashflowPeriod("monthly")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                  cashflowPeriod === "monthly"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                )}
              >
                <span>{lang === "ur" ? "اس ماہ (ماہانہ)" : "This Month (Monthly)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setCashflowPeriod("daily")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                  cashflowPeriod === "daily"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                )}
              >
                <span>{lang === "ur" ? "آج کا دن (روزانہ)" : "Today (Daily)"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Top Summary Highlight Chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
          {/* Total Income */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {lang === "ur"
                  ? cashflowPeriod === "monthly"
                    ? "کل ماہانہ آمدن"
                    : "آج کی کل آمدن"
                  : cashflowPeriod === "monthly"
                  ? "Total Monthly Income"
                  : "Today's Total Income"}
              </p>
              <p className="font-heading text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {formatPKR(activeCashflow.totalIncome)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {activeCashflow.incomeSources.length}{" "}
                {lang === "ur" ? "فعال ذرائع سے وصولی" : "active revenue streams"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </div>

          {/* Total Expenses */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {lang === "ur"
                  ? cashflowPeriod === "monthly"
                    ? "کل ماہانہ اخراجات"
                    : "آج کے کل اخراجات"
                  : cashflowPeriod === "monthly"
                  ? "Total Monthly Expenses"
                  : "Today's Total Expenses"}
              </p>
              <p className="font-heading text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">
                {formatPKR(activeCashflow.totalExpenses)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {activeCashflow.expenseCategories.length}{" "}
                {lang === "ur" ? "شعبہ جاتی مدات میں صرف" : "operational heads"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>

          {/* Net Cashflow / Surplus */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {lang === "ur"
                  ? cashflowPeriod === "monthly"
                    ? "خالص ماہانہ سرپلس / بچت"
                    : "آج کی خالص بچت"
                  : cashflowPeriod === "monthly"
                  ? "Net Monthly Surplus"
                  : "Today's Net Surplus"}
              </p>
              <p className="font-heading text-xl sm:text-2xl font-bold text-primary tabular-nums mt-1">
                {formatPKR(netSurplus)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 font-medium",
                    netSurplus >= 0
                      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "border-destructive text-destructive"
                  )}
                >
                  {surplusMargin}% {lang === "ur" ? "سرپلس شرح" : "margin"}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {lang === "ur" ? "آمدن منہا اخراجات" : "Income - Expense"}
                </span>
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Detailed 2-Column Breakdown: Left = Income Sources, Right = Expense Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          {/* Income Sources Column */}
          <div className="rounded-xl border border-border p-4 bg-card/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-heading font-semibold text-sm">
                    {lang === "ur" ? "تمام ذرائع سے آمدنی" : "Income from All Sources"}
                  </h4>
                </div>
                <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  {activeCashflow.incomeSources.length} {lang === "ur" ? "ذرائع" : "Sources"}
                </Badge>
              </div>

              <div className="space-y-3">
                {activeCashflow.incomeSources.map((item) => {
                  const Icon = getFinanceIcon(item.iconName);
                  const pct = Math.round((item.amount / (activeCashflow.totalIncome || 1)) * 100);
                  return (
                    <div key={item.id} className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {lang === "ur" ? item.nameUr : item.nameEn}
                            </p>
                            <p className="font-urdu text-[10px] text-muted-foreground truncate">
                              {lang === "ur" ? item.nameEn : item.nameUr}
                            </p>
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="font-heading text-xs sm:text-sm font-semibold tabular-nums text-foreground">
                            {formatPKR(item.amount)}
                          </p>
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                            {pct}%
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {lang === "ur" ? "مجموعی موصولی آمدن:" : "Total Income Received:"}
              </span>
              <span className="font-heading font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatPKR(activeCashflow.totalIncome)}
              </span>
            </div>
          </div>

          {/* Expense Categories Column */}
          <div className="rounded-xl border border-border p-4 bg-card/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <h4 className="font-heading font-semibold text-sm">
                    {lang === "ur" ? "شعبہ جاتی اخراجات" : "Operational Expenses by Head"}
                  </h4>
                </div>
                <Badge variant="outline" className="text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10">
                  {activeCashflow.expenseCategories.length} {lang === "ur" ? "مدات" : "Heads"}
                </Badge>
              </div>

              <div className="space-y-3">
                {activeCashflow.expenseCategories.map((item) => {
                  const Icon = getFinanceIcon(item.iconName);
                  const pct = Math.round((item.amount / (activeCashflow.totalExpenses || 1)) * 100);
                  return (
                    <div key={item.id} className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {lang === "ur" ? item.nameUr : item.nameEn}
                            </p>
                            <p className="font-urdu text-[10px] text-muted-foreground truncate">
                              {lang === "ur" ? item.nameEn : item.nameUr}
                            </p>
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="font-heading text-xs sm:text-sm font-semibold tabular-nums text-foreground">
                            {formatPKR(item.amount)}
                          </p>
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                            {pct}%
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {lang === "ur" ? "مجموعی صرف شدہ اخراجات:" : "Total Expenses Disbursed:"}
              </span>
              <span className="font-heading font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
                {formatPKR(activeCashflow.totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Navigation Link */}
        <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {lang === "ur"
              ? "تفصیلی مالیاتی رجسٹر، عطیات واؤچرز اور واؤچر پرنٹنگ کے لیے مالیات سیکشن ملاحظہ فرمائیں۔"
              : "For ledger entries, donor receipts, and financial voucher prints, visit the Finance module."}
          </p>
          <Link
            to="/finance"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
          >
            <span>{lang === "ur" ? "مالیات ڈیش بورڈ کھولیں" : "Open Finance Dashboard"}</span>
            <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-0 rotate-180" />
          </Link>
        </div>
      </Card>

      {/* Recent activity */}
      <Card className="overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="font-heading font-semibold text-base">
            {lang === "ur" ? "حالیہ سرگرمیاں" : "Recent Activity"}
          </h3>
          <p className="font-urdu text-sm text-muted-foreground">
            {lang === "ur"
              ? `${activeConfig.shortNameUr} اور ملحقہ شعبہ جات کی سرگرمیاں`
              : `Activity timeline for ${activeConfig.shortNameEn}`}
          </p>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {[
            {
              id: "act-1",
              type: "admission" as const,
              title: "New student admitted into Dars-e-Nizami Ula",
              titleUrdu: "درس نظامی اولیٰ میں نئے طالب علم کا داخلہ",
              at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            },
            {
              id: "act-2",
              type: "fee" as const,
              title: "Fee voucher collected for Nazira Grade 2",
              titleUrdu: "ناظرہ درجہ دوم کی ماہانہ فیس وصول ہوئی",
              at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            },
            {
              id: "act-3",
              type: "attendance" as const,
              title: "Morning assembly attendance marked (95.8%)",
              titleUrdu: "صبح کی اسمبلی کی حاضری مکمل (95.8%)",
              at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
            },
            {
              id: "act-4",
              type: "exam" as const,
              title: "Mid-Term assessment results uploaded",
              titleUrdu: "ششم ماہی امتحانات کے نتائج شائع کر دیے گئے",
              at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
            },
          ].map((a) => {
            const Icon = ACTIVITY_ICONS[a.type];
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                    ACTIVITY_TONE[a.type],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="font-urdu text-xs text-muted-foreground truncate">{a.titleUrdu}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
                  {relativeTime(a.at)}
                </p>
                <ChevronLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
}
