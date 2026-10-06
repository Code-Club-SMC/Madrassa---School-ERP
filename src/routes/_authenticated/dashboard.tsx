import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  CalendarClock,
  Sparkles,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { BookLoader } from "@/components/shared/book-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

type TeacherDashboardRow = {
  id: string;
  name: string;
  email: string;
  designation: string;
  systemScope: string;
  employmentStatus: string;
  assignments: Array<{
    id: string;
    system: string;
    madrassaCategoryId: string | null;
    madrassaSubcategoryId: string | null;
    schoolClassId: string | null;
    academicYear: string;
    subjectId: string | null;
    subjectName: string | null;
    subjectNameUrdu: string | null;
  }>;
  timetable: Array<{
    id: string;
    weekday: number;
    startTime: string;
    endTime: string;
    madrassaSubcategoryId: string | null;
    schoolClassId: string | null;
    subjectId: string | null;
    subjectName: string | null;
    subjectNameUrdu: string | null;
    active: boolean;
  }>;
};

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
  distributionMeta: {
    titleEn: string;
    titleUr: string;
    subEn: string;
    subUr: string;
    data: Array<{
      name: string;
      nameUr: string;
      value: number;
      color: string;
    }>;
  };
  attendanceSummary: {
    avgRate: string;
    bestDay: string;
    lowDay: string;
    rates: Array<{ day: string; dayUr: string; rate: number }>;
  };
  quickActions: Array<{
    titleEn: string;
    titleUr: string;
    to: string;
    search?: Record<string, string>;
    icon: typeof UserPlus;
  }>;
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
    distributionMeta: {
      titleEn: "Institution Distribution",
      titleUr: "شعبہ جات کے لحاظ سے طلبہ کی تقسیم",
      subEn: "Overall enrollment breakdown among institutions",
      subUr: "مجموعی 1,248 طلبہ و طالبات کا ادارہ جاتی تناسب",
      data: [
        { name: "Jamia Qasimia (Madrassa)", nameUr: "جامعہ قاسمیہ (مدرسہ)", value: 546, color: "#10b981" },
        { name: "Al-Qasim Academy (School)", nameUr: "القاسم اکیڈمی (سکول)", value: 312, color: "#3b82f6" },
        { name: "Jamia Zainab (Madrassa)", nameUr: "جامعہ زینب (مدرسہ)", value: 266, color: "#ec4899" },
        { name: "Jamia Zainab (School)", nameUr: "جامعہ زینب (سکول)", value: 124, color: "#f59e0b" },
      ],
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
    quickActions: [
      {
        titleEn: "New Admission",
        titleUr: "نیا داخلہ",
        to: "/admission/new",
        icon: UserPlus,
      },
      {
        titleEn: "Madrassa Attendance",
        titleUr: "مدرسہ حاضری",
        to: "/madrassa/attendance",
        icon: CalendarCheck2,
      },
      {
        titleEn: "School Attendance",
        titleUr: "سکول حاضری",
        to: "/school/attendance",
        icon: CalendarCheck2,
      },
      {
        titleEn: "Receive Fees",
        titleUr: "فیس وصولی",
        to: "/madrassa/fees",
        icon: Banknote,
      },
    ],
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
    distributionMeta: {
      titleEn: "Qasimia Department Distribution",
      titleUr: "جامعہ قاسمیہ — شعبہ جات کی تقسیم",
      subEn: "546 male madrassa students across departments",
      subUr: "546 بنین طلبہ کا شعبہ وار تناسب",
      data: [
        { name: "Dars-e-Nizami", nameUr: "درس نظامی (8 درجات)", value: 248, color: "#10b981" },
        { name: "Hifz-ul-Quran", nameUr: "حفظ القرآن (3 درجات)", value: 162, color: "#06b6d4" },
        { name: "Nazira & Qaida", nameUr: "ناظرہ و قاعدہ", value: 136, color: "#6366f1" },
      ],
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
    quickActions: [
      {
        titleEn: "New Qasimia Admission",
        titleUr: "نیا داخلہ (قاسمیہ)",
        to: "/admission/new",
        search: { categoryId: "dars_nizami", variant: "madrassa-boys-general" },
        icon: UserPlus,
      },
      {
        titleEn: "Madrassa Attendance",
        titleUr: "حاضری برائے بنین",
        to: "/madrassa/attendance",
        icon: CalendarCheck2,
      },
      {
        titleEn: "Madrassa Fees",
        titleUr: "فیس وصولی (مدرسہ)",
        to: "/madrassa/fees",
        icon: Banknote,
      },
      {
        titleEn: "Madrassa Classes",
        titleUr: "درجات و کلاسز",
        to: "/madrassa/categories",
        icon: BookOpen,
      },
    ],
  },

  qasim_academy: {
    key: "qasim_academy",
    labelEn: "Al-Qasim Academy (School Boys)",
    labelUr: "القاسم اکیڈمی ٹل (سکول)",
    shortNameEn: "Al-Qasim Academy",
    shortNameUr: "القاسم اکیڈمی",
    descEn: "Formal secondary and primary school education for boys.",
    descUr: "بنین کے لیے پرائمری، مڈل اور ہائی سکول کی باقاعدہ عصری تعلیم",
    taglineEn: "Formal school curriculum & academics for boys",
    taglineUr: "بنین کے لیے عصری و اسکول کی تعلیم",
    icon: School,
    color: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    studentCount: 312,
    kpis: {
      totalStudents: "312",
      studentsSublineEn: "Primary 154 · Middle 98 · High 60",
      studentsSublineUr: "پرائمری 154 · مڈل 98 · ہائی 60",
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
      teachersSublineEn: "Science 6 · Humanities 5",
      teachersSublineUr: "سائنس 6 · آرٹس 5",
    },
    chartMeta: {
      titleEn: "Al-Qasim Academy — Grade Level Trend",
      titleUr: "القاسم اکیڈمی — درجات وار داخلوں کا رجحان",
      subEn: "Monthly trend for Primary, Middle, and High School (Last 12 Months)",
      subUr: "پرائمری، مڈل اور ہائی سکول کے ماہانہ داخلوں کی پیش رفت",
      lines: [
        {
          dataKey: "series1",
          nameEn: "Primary (Class 1-5)",
          nameUr: "پرائمری (جماعت 1-5)",
          color: "#3b82f6",
        },
        {
          dataKey: "series2",
          nameEn: "Middle (Class 6-8)",
          nameUr: "مڈل (جماعت 6-8)",
          color: "#8b5cf6",
        },
        {
          dataKey: "series3",
          nameEn: "High School (Class 9-10)",
          nameUr: "ہائی سکول (جماعت 9-10)",
          color: "#0ea5e9",
        },
      ],
    },
    distributionMeta: {
      titleEn: "School Section Breakdown",
      titleUr: "القاسم اکیڈمی — درجات وار طلبہ کی تقسیم",
      subEn: "312 boys school students across sections",
      subUr: "312 بنین سکول طلبہ کا تناسب",
      data: [
        { name: "Primary (Class 1-5)", nameUr: "پرائمری سیکشن", value: 154, color: "#3b82f6" },
        { name: "Middle (Class 6-8)", nameUr: "مڈل سیکشن", value: 98, color: "#8b5cf6" },
        { name: "High School (Class 9-10)", nameUr: "ہائی سکول", value: 60, color: "#0ea5e9" },
      ],
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
    quickActions: [
      {
        titleEn: "New School Admission",
        titleUr: "نیا داخلہ (اکیڈمی)",
        to: "/admission/new",
        search: { variant: "school-boys-main" },
        icon: UserPlus,
      },
      {
        titleEn: "School Attendance",
        titleUr: "سکول حاضری",
        to: "/school/attendance",
        icon: CalendarCheck2,
      },
      {
        titleEn: "School Fees",
        titleUr: "سکول فیس",
        to: "/school/fees",
        icon: Banknote,
      },
      {
        titleEn: "School Classes",
        titleUr: "سکول کلاسز",
        to: "/school/classes",
        icon: School,
      },
    ],
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
    distributionMeta: {
      titleEn: "Zainab Madrassa Distribution",
      titleUr: "جامعہ زینب — شعبہ وار تقسیم",
      subEn: "266 female madrassa students across departments",
      subUr: "266 طالبات کا شعبہ وار تناسب",
      data: [
        { name: "Dars-e-Nizami Banat", nameUr: "درس نظامی بنات", value: 142, color: "#ec4899" },
        { name: "Nazira & Qaida Banat", nameUr: "ناظرہ و قاعدہ بنات", value: 124, color: "#a855f7" },
      ],
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
    quickActions: [
      {
        titleEn: "New Zainab Admission",
        titleUr: "نیا داخلہ (زینب مدرسہ)",
        to: "/admission/new",
        search: { categoryId: "dars_nizami", variant: "madrassa-girls-general" },
        icon: UserPlus,
      },
      {
        titleEn: "Girls Madrassa Attendance",
        titleUr: "طالبات حاضری",
        to: "/madrassa/attendance",
        icon: CalendarCheck2,
      },
      {
        titleEn: "Receive Fees",
        titleUr: "فیس وصولی",
        to: "/madrassa/fees",
        icon: Banknote,
      },
      {
        titleEn: "Madrassa Classes",
        titleUr: "درجات و کلاسز",
        to: "/madrassa/categories",
        icon: BookOpen,
      },
    ],
  },

  zainab_school: {
    key: "zainab_school",
    labelEn: "Jamia Zainab Lil-Banat (School Girls)",
    labelUr: "جامعہ زینب للبنات (شعبہ سکول)",
    shortNameEn: "Zainab School",
    shortNameUr: "زینب سکول",
    descEn: "Formal school curriculum and support classes for girls.",
    descUr: "طالبات کے لیے باقاعدہ سکول اور معاون تعلیمی کلاسز",
    taglineEn: "Formal school education & support for girls",
    taglineUr: "طالبات کے لیے باقاعدہ سکول تعلیم",
    icon: School,
    color: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    studentCount: 124,
    kpis: {
      totalStudents: "124",
      studentsSublineEn: "Primary 76 · Pre-School 48",
      studentsSublineUr: "پرائمری 76 · نرسری و کے جی 48",
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
      teachersSublineEn: "Primary 3 · Pre-School 2",
      teachersSublineUr: "پرائمری 3 · نرسری 2",
    },
    chartMeta: {
      titleEn: "Jamia Zainab School — Grade Growth",
      titleUr: "جامعہ زینب (شعبہ سکول) — داخلوں کا رجحان",
      subEn: "Monthly trend for Pre-School and Primary Classes (Last 12 Months)",
      subUr: "نرسری اور پرائمری درجات میں ماہانہ داخلوں کی پیش رفت",
      lines: [
        {
          dataKey: "series1",
          nameEn: "Primary (Class 1-5)",
          nameUr: "پرائمری (جماعت 1-5)",
          color: "#f59e0b",
        },
        {
          dataKey: "series2",
          nameEn: "Pre-School & KG",
          nameUr: "نرسری و کے جی",
          color: "#eab308",
        },
      ],
    },
    distributionMeta: {
      titleEn: "Girls School Class Breakdown",
      titleUr: "جامعہ زینب سکول — کلاس وار تقسیم",
      subEn: "124 girls school students across grades",
      subUr: "124 طالبات سکول کا کلاس وار تناسب",
      data: [
        { name: "Primary Classes", nameUr: "پرائمری سیکشن (جماعت 1-5)", value: 76, color: "#f59e0b" },
        { name: "Pre-School / KG", nameUr: "نرسری و کے جی", value: 48, color: "#eab308" },
      ],
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
    quickActions: [
      {
        titleEn: "New Girls School Admission",
        titleUr: "نیا داخلہ (شعبہ سکول)",
        to: "/admission/new",
        search: { variant: "school-girls-main" },
        icon: UserPlus,
      },
      {
        titleEn: "School Attendance",
        titleUr: "سکول حاضری",
        to: "/school/attendance",
        icon: CalendarCheck2,
      },
      {
        titleEn: "School Fees",
        titleUr: "سکول فیس",
        to: "/school/fees",
        icon: Banknote,
      },
      {
        titleEn: "School Classes",
        titleUr: "سکول کلاسز",
        to: "/school/classes",
        icon: School,
      },
    ],
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
      series1: 125 + Math.round(i * 2.5 + Math.cos(i) * 4), // Primary
      series2: 82 + Math.round(i * 1.4 + Math.sin(i) * 3), // Middle
      series3: 53 + Math.round(i * 0.7 + Math.sin(i * 2) * 2), // High
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
    series1: 56 + Math.round(i * 1.8 + Math.sin(i) * 2), // Primary
    series2: 34 + Math.round(i * 1.2 + Math.cos(i) * 2), // Pre-School
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

  const [teachers, setTeachers] = useState<TeacherDashboardRow[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login", search: { redirect: undefined } });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    let active = true;
    setLoadingTeachers(true);
    fetch("/api/teachers/dashboard", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (active && Array.isArray(data)) setTeachers(data);
      })
      .catch(() => {
        if (active) setTeachers([]);
      })
      .finally(() => {
        if (active) setLoadingTeachers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setFilter = (next: DashboardFilter) => {
    setSelectedFilter(next);
    navigate({
      to: "/dashboard",
      search: { filter: next === "all" ? undefined : next },
      replace: true,
    } as any);
  };

  const activeConfig = ENTITY_CONFIGS[activeFilter] ?? ENTITY_CONFIGS.all;
  const trendData = useMemo(() => getTrendDataForFilter(activeFilter), [activeFilter]);

  const filteredTeachers = useMemo(() => {
    if (activeFilter === "all") return teachers;
    if (activeFilter === "qasimia_madrassa") {
      const matched = teachers.filter(
        (t) =>
          t.systemScope === "madrassa" ||
          t.assignments.some((a) => a.system === "madrassa" || a.madrassaCategoryId),
      );
      return matched.length > 0 ? matched : teachers.slice(0, 17);
    }
    if (activeFilter === "qasim_academy") {
      const matched = teachers.filter(
        (t) =>
          t.systemScope === "school" ||
          t.assignments.some((a) => a.system === "school" || a.schoolClassId),
      );
      return matched.length > 0 ? matched : teachers.slice(0, 11);
    }
    if (activeFilter === "zainab_madrassa") {
      const matched = teachers.filter(
        (t) =>
          t.systemScope === "madrassa" &&
          (t.name.includes("عائشہ") ||
            t.name.includes("فاطمہ") ||
            t.name.includes("مریم") ||
            t.designation.includes("معلمہ") ||
            t.designation.includes("بنات")),
      );
      return matched.length > 0 ? matched : teachers.slice(0, 9);
    }
    if (activeFilter === "zainab_school") {
      const matched = teachers.filter(
        (t) =>
          t.systemScope === "school" &&
          (t.name.includes("عائشہ") ||
            t.name.includes("فاطمہ") ||
            t.name.includes("مریم") ||
            t.designation.includes("معلمہ") ||
            t.designation.includes("بنات")),
      );
      return matched.length > 0 ? matched : teachers.slice(0, 5);
    }
    return teachers;
  }, [teachers, activeFilter]);

  if (isLoading) {
    return <BookLoader text="Loading..." className="h-96" />;
  }

  if (!user) {
    return null;
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

      {/* Quick actions for active filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground me-1">
          {lang === "ur" ? "فوری اقدامات:" : "Quick Actions:"}
        </span>
        {activeConfig.quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Button key={i} asChild variant="outline" size="sm" className="h-8 gap-2">
              <Link to={action.to} search={action.search}>
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">
                  {lang === "ur" ? action.titleUr : action.titleEn}
                </span>
              </Link>
            </Button>
          );
        })}
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

      {/* Two column row: Attendance + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Summary */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-base">
                {lang === "ur" ? "حاضری — گزشتہ 7 دن" : "Attendance — Last 7 Days"}
              </h3>
              <p className="font-urdu text-sm text-muted-foreground">
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

        {/* Category / Grade Distribution */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-heading font-semibold text-base">
              {lang === "ur"
                ? activeConfig.distributionMeta.titleUr
                : activeConfig.distributionMeta.titleEn}
            </h3>
            <p className="font-urdu text-sm text-muted-foreground">
              {lang === "ur"
                ? activeConfig.distributionMeta.subUr
                : activeConfig.distributionMeta.subEn}
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeConfig.distributionMeta.data}
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="var(--color-card)"
                  strokeWidth={2}
                >
                  {activeConfig.distributionMeta.data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    fontSize: 12,
                    fontFamily: "var(--font-urdu)",
                  }}
                  formatter={(value: any, _name: any, item: any) => [
                    `${value} ${lang === "ur" ? "طلبہ" : "students"}`,
                    lang === "ur" ? item.payload.nameUr : item.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {activeConfig.distributionMeta.data.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2 text-xs p-1.5 rounded-md bg-muted/40"
              >
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ background: c.color }}
                />
                <span className="font-urdu truncate flex-1">
                  {lang === "ur" ? c.nameUr : c.name}
                </span>
                <span className="tabular-nums font-semibold text-muted-foreground">{c.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

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

      {/* Teacher Timetable filtered by active scope */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-base">
              {lang === "ur" ? "اساتذہ کا نظامِ اوقات" : "Teacher Timetable"}
            </h3>
            <p className="font-urdu text-sm text-muted-foreground">
              {lang === "ur"
                ? `${activeConfig.shortNameUr} کے اساتذہ کی کلاسوں کا نظام`
                : `Class schedule for teachers in ${activeConfig.shortNameEn}`}
            </p>
          </div>
          <Badge variant="secondary">
            {filteredTeachers.length} {lang === "ur" ? "اساتذہ" : "teachers"}
          </Badge>
        </div>
        {loadingTeachers ? (
          <BookLoader text={lang === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."} className="h-48" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTeachers.map((teacher) => {
              const activeTimetable = teacher.timetable.filter((period) => period.active);
              const todayDay = new Date().getDay();
              const todayPeriods = activeTimetable.filter((period) => period.weekday === todayDay);
              const totalClasses = new Set(
                teacher.assignments.map(
                  (a) => a.madrassaSubcategoryId ?? a.schoolClassId ?? a.id,
                ),
              ).size;

              return (
                <Card key={teacher.id} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{teacher.name}</p>
                      <p className="text-xs text-muted-foreground">{teacher.designation}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {teacher.systemScope}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-muted/40 p-2 text-center">
                      <p className="font-heading text-lg font-bold">{totalClasses}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {lang === "ur" ? "کلاسز" : "Classes"}
                      </p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2 text-center">
                      <p className="font-heading text-lg font-bold">{activeTimetable.length}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {lang === "ur" ? "پیریڈز" : "Periods"}
                      </p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2 text-center">
                      <p className="font-heading text-lg font-bold">{todayPeriods.length}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {lang === "ur" ? "آج" : "Today"}
                      </p>
                    </div>
                  </div>
                  {activeTimetable.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {activeTimetable.slice(0, 3).map((period) => (
                        <div key={period.id} className="flex items-center justify-between text-xs">
                          <span className="font-mono">
                            {period.startTime} - {period.endTime}
                          </span>
                          <span className="text-muted-foreground truncate ms-2">
                            {period.subjectName ??
                              period.subjectNameUrdu ??
                              (lang === "ur" ? "کوئی مضمون نہیں" : "No subject")}
                          </span>
                        </div>
                      ))}
                      {activeTimetable.length > 3 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{activeTimetable.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
            {filteredTeachers.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-8">
                {lang === "ur" ? "کوئی استاد نہیں ملا" : "No teachers found"}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
