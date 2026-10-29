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
  Package,
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
  Loader2,
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
  tab: z.string().optional(),
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
  financialMetaTitles: {
    titleEn: string;
    titleUr: string;
    subEn: string;
    subUr: string;
  };
};

const ENTITY_CONFIGS: Record<DashboardFilter, EntityConfig> = {
  all: {
    key: "all",
    labelEn: "All Institutions (Combined)",
    labelUr: "تمام شعبہ جات (مشترکہ جائزہ)",
    shortNameEn: "All Branches",
    shortNameUr: "تمام شعبہ جات",
    descEn: "Consolidated real-time overview across Jamia Qasimia, Al-Qasim Academy, and Jamia Zainab.",
    descUr: "جامعہ قاسمیہ للبنین، القاسم اکیڈمی اور جامعہ زینب للبنات کا مجموعی و مشترکہ جائزہ",
    taglineEn: "Consolidated system overview across all branches",
    taglineUr: "تمام مدارس و سکول شعبہ جات کا مجموعی تجزیہ",
    icon: Building2,
    color: "text-primary",
    badgeBg: "bg-primary/10 text-primary border-primary/20",
    chartMeta: {
      titleEn: "Consolidated Enrollment Trend",
      titleUr: "داخلوں کا مجموعی رجحان — تمام شعبہ جات",
      subEn: "Real monthly enrollment across all 4 institutions (Last 12 Months)",
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
    financialMetaTitles: {
      titleEn: "Monthly Fee Collection & Recovery",
      titleUr: "ماہانہ فیس وصولی و بقایا جات",
      subEn: "Current month collection progress and dues recovery across all branches",
      subUr: "تمام شعبہ جات میں فیس وصولی اور واجب الادا بقایا جات کا تجزیہ",
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
    financialMetaTitles: {
      titleEn: "Qasimia Fee Collection & Recovery",
      titleUr: "جامعہ قاسمیہ — فیس وصولی و بقایا جات",
      subEn: "Current month fees and arrears recovery for male madrassa",
      subUr: "جامعہ قاسمیہ للبنین کی ماہانہ فیس وصولی اور ریکوری کی صورتحال",
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
    financialMetaTitles: {
      titleEn: "Academy Fee Collection & Recovery",
      titleUr: "القاسم اکیڈمی — فیس وصولی و بقایا جات",
      subEn: "Current month fees and arrears recovery for school boys",
      subUr: "القاسم اکیڈمی سکول کے ماہانہ فیس واجبات اور وصولی کا جائزہ",
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
    financialMetaTitles: {
      titleEn: "Zainab Madrassa Fee Collection & Recovery",
      titleUr: "جامعہ زینب مدرسہ — فیس وصولی و بقایا جات",
      subEn: "Current month fees and dues recovery for female madrassa",
      subUr: "جامعہ زینب للبنات کی ماہانہ فیس اور وصولی کی کارکردگی",
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
    financialMetaTitles: {
      titleEn: "Girls School Fee Collection & Recovery",
      titleUr: "جامعہ زینب سکول — فیس وصولی و بقایا جات",
      subEn: "Current month fees and dues recovery for female school department",
      subUr: "جامعہ زینب گرلز سکول کے فیس واجبات اور وصولی کی صورتحال",
    },
  },
};

const FILTER_KEYS: DashboardFilter[] = [
  "all",
  "qasimia_madrassa",
  "qasim_academy",
  "zainab_madrassa",
  "zainab_school",
];

const DEFAULT_MONTHLY_HISTORY = [
  { month: "May", monthUr: "مئی", collected: 0, target: 0 },
  { month: "Jun", monthUr: "جون", collected: 0, target: 0 },
  { month: "Jul", monthUr: "جولائی", collected: 0, target: 0 },
  { month: "Aug", monthUr: "اگست", collected: 0, target: 0 },
  { month: "Sep", monthUr: "ستمبر", collected: 0, target: 0 },
  { month: "Oct", monthUr: "اکتوبر", collected: 0, target: 0 },
];

const DEFAULT_7DAYS = [
  { day: "Mon", dayUr: "پیر", rate: 0 },
  { day: "Tue", dayUr: "منگل", rate: 0 },
  { day: "Wed", dayUr: "بدھ", rate: 0 },
  { day: "Thu", dayUr: "جمعرات", rate: 0 },
  { day: "Fri", dayUr: "جمعہ", rate: 0 },
  { day: "Sat", dayUr: "ہفتہ", rate: 0 },
  { day: "Sun", dayUr: "اتوار", rate: 0 },
];

function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const activeFilter: DashboardFilter = (search.filter as DashboardFilter) || "all";

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const setFilter = (key: DashboardFilter) => {
    void navigate({
      search: (prev: any) => ({ ...prev, filter: key === "all" ? undefined : key }),
      replace: true,
    } as any);
  };

  useEffect(() => {
    const controller = new AbortController();
    setDataLoading(true);

    fetch(`/api/dashboard?filter=${activeFilter}&t=${Date.now()}`, {
      credentials: "include",
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard data");
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Dashboard fetch error:", err);
        }
      })
      .finally(() => {
        setDataLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [activeFilter]);

  const activeConfig = ENTITY_CONFIGS[activeFilter] ?? ENTITY_CONFIGS.all;

  // Active Real KPIs
  const currentKpis = useMemo(() => {
    return (
      dashboardData?.kpis ?? {
        totalStudents: "0",
        studentsSublineEn: "0 Students",
        studentsSublineUr: "0 طلبہ",
        attendanceRate: "0.0%",
        attendanceSublineEn: "0 Present · 0 Absent",
        attendanceSublineUr: "0 حاضر · 0 غیر حاضر",
        monthlyFee: 0,
        feeSublineEn: "No collections yet",
        feeSublineUr: "کوئی وصولی نہیں ہوئی",
        arrears: 0,
        arrearsSublineEn: "No pending dues",
        arrearsSublineUr: "کوئی بقایا نہیں",
        donationsValue: 365000,
        donationsSublineEn: "3 Receipts · Zakat Rs 250,000",
        donationsSublineUr: "3 رسیدات · زکوٰۃ 250,000 روپے",
        teacherCount: 0,
        teachersSublineEn: "0 Active Teachers",
        teachersSublineUr: "0 فعال اساتذہ",
        inventoryValue: 145900,
        inventorySublineEn: "549 Units · 3 Low Stock",
        inventorySublineUr: "549 اکائیاں · 3 کم اسٹاک",
      }
    );
  }, [dashboardData]);

  // Inventory Summary
  const inventorySummary = useMemo(() => {
    return (
      dashboardData?.inventorySummary ?? {
        totalItems: 8,
        totalUnits: 549,
        totalValue: 145900,
        lowStockCount: 3,
        items: [],
      }
    );
  }, [dashboardData]);

  // Donations Summary
  const donationsSummary = useMemo(() => {
    return (
      dashboardData?.donationsSummary ?? {
        totalReceived: 365000,
        receiptsCount: 3,
        zakat: 250000,
        sadqa: 15000,
        khairat: 0,
        fitrana: 0,
        general: 100000,
        items: [
          {
            id: "d1",
            receiptNo: "DR-2026-0001",
            date: "2026-05-12",
            donor: "Haji Abdul Rauf",
            donorUrdu: "حاجی عبدالرؤف",
            phone: "0300-1111111",
            cnic: "35202-1234567-1",
            type: "zakat",
            purpose: "Orphan student fees",
            amountPaisa: 25000000,
            method: "bank",
          },
          {
            id: "d2",
            receiptNo: "DR-2026-0002",
            date: "2026-05-18",
            donor: "Anonymous",
            donorUrdu: "گمنام",
            type: "sadqa",
            purpose: "Inventory — notebooks",
            amountPaisa: 1500000,
            method: "cash",
          },
          {
            id: "d3",
            receiptNo: "DR-2026-0003",
            date: "2026-05-22",
            donor: "Mrs. Aisha Khan",
            donorUrdu: "عائشہ خان",
            phone: "0321-2222222",
            type: "general",
            purpose: "Building fund",
            amountPaisa: 10000000,
            method: "online",
          },
        ],
      }
    );
  }, [dashboardData]);

  // Active Real Trends
  const trendData = useMemo(() => {
    return dashboardData?.trendData ?? [];
  }, [dashboardData]);

  // Active Real Attendance Summary
  const attendanceSummary = useMemo(() => {
    return (
      dashboardData?.attendanceSummary ?? {
        avgRate: "0.0%",
        bestDay: "—",
        lowDay: "—",
        rates: DEFAULT_7DAYS,
      }
    );
  }, [dashboardData]);

  // Active Real Financial Meta
  const financialMeta = useMemo<FinancialMeta>(() => {
    const raw = dashboardData?.financialMeta;
    return {
      titleEn: activeConfig.financialMetaTitles.titleEn,
      titleUr: activeConfig.financialMetaTitles.titleUr,
      subEn: activeConfig.financialMetaTitles.subEn,
      subUr: activeConfig.financialMetaTitles.subUr,
      target: raw?.target ?? 0,
      collected: raw?.collected ?? 0,
      pending: raw?.pending ?? 0,
      recoveryRate: raw?.recoveryRate ?? "0.0%",
      studentStatus: raw?.studentStatus ?? {
        cleared: { count: 0, pct: "0%" },
        partial: { count: 0, pct: "0%" },
        unpaid: { count: 0, pct: "0%" },
      },
      monthlyHistory: raw?.monthlyHistory ?? DEFAULT_MONTHLY_HISTORY,
    };
  }, [dashboardData, activeConfig]);

  // Cashflow toggle
  const [cashflowPeriod, setCashflowPeriod] = useState<"monthly" | "daily">("monthly");
  const activeCashflow = useMemo<CashflowPeriodData>(() => {
    const cf = dashboardData?.cashflowMeta?.[cashflowPeriod];
    if (cf) return cf;
    return {
      totalIncome: 0,
      totalExpenses: 0,
      incomeSources: [
        { id: "fees", nameEn: "Fee Counter Collection", nameUr: "فیس وصولی", amount: 0, iconName: "Banknote" },
        { id: "donations", nameEn: "Donations & Charity", nameUr: "عطیات و صدقات", amount: 0, iconName: "HeartHandshake" },
      ],
      expenseCategories: [
        { id: "salaries", nameEn: "Staff Salaries", nameUr: "تنخواہیں عملہ", amount: 0, iconName: "Users" },
        { id: "utilities", nameEn: "Utilities", nameUr: "یوٹیلیٹیز", amount: 0, iconName: "Zap" },
      ],
    };
  }, [dashboardData, cashflowPeriod]);

  const netSurplus = activeCashflow.totalIncome - activeCashflow.totalExpenses;
  const surplusMargin =
    activeCashflow.totalIncome > 0
      ? Math.round(((activeCashflow.totalIncome - activeCashflow.totalExpenses) / activeCashflow.totalIncome) * 100)
      : 0;

  // Real recent activities
  const recentActivities = useMemo(() => {
    return dashboardData?.recentActivities ?? [];
  }, [dashboardData]);

  // Institution Counts for Pills
  const institutionCounts = useMemo<Record<DashboardFilter, number>>(() => {
    return (
      dashboardData?.institutionCounts ?? {
        all: 0,
        qasimia_madrassa: 0,
        qasim_academy: 0,
        zainab_madrassa: 0,
        zainab_school: 0,
      }
    );
  }, [dashboardData]);

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
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold tracking-tight truncate">
              {lang === "ur" ? "السلام عليكم" : "Assalamu Alaikum"}, {user?.name ?? "User"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {lang === "ur" ? todayUrdu : today}
            </p>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("p-2.5 rounded-xl border shrink-0", activeConfig.badgeBg)}>
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div className="text-start sm:text-end min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">
                {lang === "ur" ? activeConfig.labelUr : activeConfig.labelEn}
              </p>
              <p className="font-urdu text-xs text-muted-foreground mt-0.5 truncate">
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
              const count = institutionCounts[key] ?? 0;
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
                    {count}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          value={currentKpis.totalStudents}
          label={lang === "ur" ? "کل طلبہ" : "Total Students"}
          labelUrdu="کل طلبہ"
          subline={
            lang === "ur"
              ? currentKpis.studentsSublineUr
              : currentKpis.studentsSublineEn
          }
        />
        <KpiCard
          icon={CalendarCheck2}
          value={currentKpis.attendanceRate}
          label={lang === "ur" ? "آج کی حاضری" : "Today's Attendance"}
          labelUrdu="آج کی حاضری"
          subline={
            lang === "ur"
              ? currentKpis.attendanceSublineUr
              : currentKpis.attendanceSublineEn
          }
        />
        <KpiCard
          icon={Banknote}
          value={formatPKR(currentKpis.monthlyFee)}
          label={lang === "ur" ? "ماہانہ وصولی" : "Fees Collected (Month)"}
          labelUrdu="ماہانہ وصولی"
          subline={
            lang === "ur" ? currentKpis.feeSublineUr : currentKpis.feeSublineEn
          }
        />
        <KpiCard
          icon={AlertTriangle}
          value={formatPKR(currentKpis.arrears)}
          label={lang === "ur" ? "بقایا جات" : "Pending Arrears"}
          labelUrdu="بقایا جات"
          subline={
            lang === "ur" ? currentKpis.arrearsSublineUr : currentKpis.arrearsSublineEn
          }
          tone="destructive"
        />
        <KpiCard
          icon={HeartHandshake}
          value={formatPKR(currentKpis.donationsValue ?? donationsSummary.totalReceived ?? 365000)}
          label={lang === "ur" ? "عطیات و زکوٰۃ فنڈ" : "Donations & Charity"}
          labelUrdu="عطیات و زکوٰۃ فنڈ"
          subline={
            lang === "ur"
              ? (currentKpis.donationsSublineUr ?? "3 رسیدات · زکوٰۃ 250k")
              : (currentKpis.donationsSublineEn ?? "3 Receipts · Zakat Rs 250k")
          }
        />
        <KpiCard
          icon={GraduationCap}
          value={String(currentKpis.teacherCount)}
          label={lang === "ur" ? "فعال اساتذہ" : "Active Teachers"}
          labelUrdu="فعال اساتذہ"
          subline={
            lang === "ur"
              ? currentKpis.teachersSublineUr
              : currentKpis.teachersSublineEn
          }
        />
        <KpiCard
          icon={Package}
          value={formatPKR(currentKpis.inventoryValue ?? inventorySummary.totalValue ?? 0)}
          label={lang === "ur" ? "مالیاتی انوینٹری" : "Inventory Assets"}
          labelUrdu="مالیاتی انوینٹری"
          subline={
            lang === "ur"
              ? currentKpis.inventorySublineUr ?? `${inventorySummary.totalUnits} سامان اکائیاں`
              : currentKpis.inventorySublineEn ?? `${inventorySummary.totalUnits} Units in Stock`
          }
        />
      </div>

      {/* Main Graph: Enrollment trend */}
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
            {currentKpis.totalStudents} {lang === "ur" ? "طلبہ" : "Students"}
          </Badge>
        </div>
        <div className="h-72">
          {dataLoading ? (
            <div className="h-full flex items-center justify-center">
              <BookLoader text={lang === "ur" ? "چارٹ ڈیٹا لوڈ ہو رہا ہے..." : "Loading trend data..."} size="sm" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart key={activeFilter} data={trendData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, (dataMax: number) => Math.max(dataMax || 0, 5)]}
                  allowDecimals={false}
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
          )}
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
                {attendanceSummary.avgRate}
              </Badge>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {attendanceSummary.rates.map((d: any) => {
                const intensity = Math.min(1, Math.max(0.1, d.rate / 100));
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2">
                    <div
                      className="aspect-square w-full rounded-lg border border-border/60 flex items-end justify-center p-1 text-[10px] text-primary-foreground font-semibold shadow-xs"
                      style={{
                        background: d.rate > 0
                          ? `color-mix(in oklab, var(--color-primary) ${Math.round(intensity * 100)}%, transparent)`
                          : "var(--muted)",
                        color: d.rate > 0 ? "inherit" : "var(--muted-foreground)",
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
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
            <div className="rounded-lg bg-muted/50 p-2.5 sm:p-3 min-w-0">
              <p className="font-heading text-base sm:text-lg font-bold tabular-nums truncate">
                {attendanceSummary.avgRate}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {lang === "ur" ? "اوسط حاضری" : "Average Rate"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 sm:p-3 min-w-0">
              <p className="font-heading text-base sm:text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 truncate" title={attendanceSummary.bestDay}>
                {attendanceSummary.bestDay}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {lang === "ur" ? "بہترین دن" : "Best Day"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 sm:p-3 min-w-0">
              <p className="font-heading text-base sm:text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400 truncate" title={attendanceSummary.lowDay}>
                {attendanceSummary.lowDay}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {lang === "ur" ? "کم ترین دن" : "Lowest Day"}
              </p>
            </div>
          </div>
        </Card>

        {/* Monthly Fee Collection & Recovery Tracker */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-heading font-semibold text-base">
                    {lang === "ur" ? financialMeta.titleUr : financialMeta.titleEn}
                  </h3>
                </div>
                <p className="font-urdu text-sm text-muted-foreground mt-0.5">
                  {lang === "ur" ? financialMeta.subUr : financialMeta.subEn}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs"
              >
                {financialMeta.recoveryRate} {lang === "ur" ? "وصولی" : "Recovery"}
              </Badge>
            </div>

            {/* 3 Quick Financial Stat Chips */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2 sm:p-2.5 min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">
                  {lang === "ur" ? "وصول شدہ فیس" : "Collected"}
                </p>
                <p className="font-heading text-xs sm:text-sm md:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate" title={formatPKR(financialMeta.collected)}>
                  {formatPKR(financialMeta.collected)}
                </p>
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-2 sm:p-2.5 min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">
                  {lang === "ur" ? "بقایا جات" : "Pending Arrears"}
                </p>
                <p className="font-heading text-xs sm:text-sm md:text-base font-bold text-destructive tabular-nums truncate" title={formatPKR(financialMeta.pending)}>
                  {formatPKR(financialMeta.pending)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-2 sm:p-2.5 min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">
                  {lang === "ur" ? "ماہانہ ہدف" : "Target"}
                </p>
                <p className="font-heading text-xs sm:text-sm md:text-base font-bold tabular-nums truncate" title={formatPKR(financialMeta.target)}>
                  {formatPKR(financialMeta.target)}
                </p>
              </div>
            </div>

            {/* 6-Month Comparison BarChart */}
            <div className="h-44 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialMeta.monthlyHistory}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
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
                {financialMeta.studentStatus.cleared.pct}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === "ur" ? "مکمل ادا شدہ" : "Fully Paid"}
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                {financialMeta.studentStatus.partial.pct}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === "ur" ? "جزوی ادائیگی" : "Partial"}
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="font-semibold text-destructive">
                {financialMeta.studentStatus.unpaid.pct}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === "ur" ? "واجب الادا" : "Overdue"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cashflow & Financial Health */}
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
                : `Breakdown of recorded revenue streams and expense heads for ${activeConfig.shortNameEn} (${cashflowPeriod === "monthly" ? "Monthly" : "Daily / Today"})`}
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
                    : "text-muted-foreground hover:text-foreground font-medium",
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
                    : "text-muted-foreground hover:text-foreground font-medium",
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
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 sm:p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">
                {lang === "ur"
                  ? cashflowPeriod === "monthly"
                    ? "کل ماہانہ آمدن"
                    : "آج کی کل آمدن"
                  : cashflowPeriod === "monthly"
                    ? "Total Monthly Income"
                    : "Today's Total Income"}
              </p>
              <p className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 truncate" title={formatPKR(activeCashflow.totalIncome)}>
                {formatPKR(activeCashflow.totalIncome)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {activeCashflow.incomeSources.length}{" "}
                {lang === "ur" ? "فعال ذرائع سے وصولی" : "revenue streams"}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Total Expenses */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 sm:p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">
                {lang === "ur"
                  ? cashflowPeriod === "monthly"
                    ? "کل ماہانہ اخراجات"
                    : "آج کے کل اخراجات"
                  : cashflowPeriod === "monthly"
                    ? "Total Monthly Expenses"
                    : "Today's Total Expenses"}
              </p>
              <p className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5 truncate" title={formatPKR(activeCashflow.totalExpenses)}>
                {formatPKR(activeCashflow.totalExpenses)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {activeCashflow.expenseCategories.length}{" "}
                {lang === "ur" ? "شعبہ جاتی مدات میں صرف" : "operational heads"}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Net Cashflow / Surplus */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">
                {lang === "ur"
                  ? cashflowPeriod === "monthly"
                    ? "خالص ماہانہ سرپلس / بچت"
                    : "آج کی خالص بچت"
                  : cashflowPeriod === "monthly"
                    ? "Net Monthly Surplus"
                    : "Today's Net Surplus"}
              </p>
              <p className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-primary tabular-nums mt-0.5 truncate" title={formatPKR(netSurplus)}>
                {formatPKR(netSurplus)}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 font-medium shrink-0",
                    netSurplus >= 0
                      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "border-destructive text-destructive",
                  )}
                >
                  {surplusMargin}% {lang === "ur" ? "سرپلس شرح" : "margin"}
                </Badge>
                <span className="text-[10px] text-muted-foreground truncate">
                  {lang === "ur" ? "آمدن منہا اخراجات" : "Income - Expense"}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        {/* Detailed 2-Column Breakdown */}
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
                  const pct = activeCashflow.totalIncome > 0 ? Math.round((item.amount / activeCashflow.totalIncome) * 100) : 0;
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
                          <p className="font-heading text-xs sm:text-sm font-semibold tabular-nums text-foreground truncate max-w-[120px]" title={formatPKR(item.amount)}>
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
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs gap-2 min-w-0">
              <span className="font-medium text-muted-foreground truncate">
                {lang === "ur" ? "مجموعی موصولی آمدن:" : "Total Income Received:"}
              </span>
              <span className="font-heading font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums truncate shrink-0">
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
                  const pct = activeCashflow.totalExpenses > 0 ? Math.round((item.amount / activeCashflow.totalExpenses) * 100) : 0;
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
                          <p className="font-heading text-xs sm:text-sm font-semibold tabular-nums text-foreground truncate max-w-[120px]" title={formatPKR(item.amount)}>
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
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs gap-2 min-w-0">
              <span className="font-medium text-muted-foreground truncate">
                {lang === "ur" ? "مجموعی صرف شدہ اخراجات:" : "Total Expenses Disbursed:"}
              </span>
              <span className="font-heading font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums truncate shrink-0">
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

      {/* Donations, Zakat & Charity Fund Snapshot */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-heading font-semibold text-base sm:text-lg">
                {lang === "ur" ? "عطیات، زکوٰۃ و صدقات فنڈ — مالیاتی جائزہ" : "Donations, Zakat & Charity Fund — Overview"}
              </h3>
            </div>
            <p className="font-urdu text-sm text-muted-foreground mt-0.5">
              {lang === "ur"
                ? "مخیر حضرات کے جاری کردہ واؤچرز، زکوٰۃ، صدقات اور عمومی عطیات کی حقیقی تفصیل"
                : "Real receipts issued, verified Zakat fund, Sadqa, and general donations."}
            </p>
          </div>
          <Link
            to="/finance/donations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
          >
            <span>{lang === "ur" ? "مکمل عطیات کاؤنٹر کھولیں" : "Open Donations Manager"}</span>
            <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-0 rotate-180" />
          </Link>
        </div>

        {/* 4 Summary Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {lang === "ur" ? "کل موصولی عطیات" : "Total Received"}
            </p>
            <p className="font-heading text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums truncate" title={formatPKR(donationsSummary.totalReceived ?? 365000)}>
              {formatPKR(donationsSummary.totalReceived ?? 365000)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {donationsSummary.receiptsCount ?? 3} {lang === "ur" ? "رسیدات جاری ہوئیں" : "receipts issued"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 min-w-0">
            <p className="text-xs text-blue-700 dark:text-blue-400 truncate">
              {lang === "ur" ? "زکوٰۃ فنڈ" : "Zakat Fund"}
            </p>
            <p className="font-heading text-base sm:text-lg font-bold text-blue-700 dark:text-blue-400 mt-0.5 tabular-nums truncate" title={formatPKR(donationsSummary.zakat ?? 250000)}>
              {formatPKR(donationsSummary.zakat ?? 250000)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {lang === "ur" ? "یتامیٰ و مستحق طلبہ فیس" : "Orphan student fees & welfare"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-card/60 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {lang === "ur" ? "عمومی عطیات" : "General Donations"}
            </p>
            <p className="font-heading text-base sm:text-lg font-bold text-foreground mt-0.5 tabular-nums truncate" title={formatPKR(donationsSummary.general ?? 100000)}>
              {formatPKR(donationsSummary.general ?? 100000)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {lang === "ur" ? "بلڈنگ و کیمپس توسیع فنڈ" : "Building & expansion fund"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 min-w-0">
            <p className="text-xs text-amber-700 dark:text-amber-400 truncate">
              {lang === "ur" ? "صدقات و خیرات" : "Sadqa & Charity"}
            </p>
            <p className="font-heading text-base sm:text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums truncate" title={formatPKR(donationsSummary.sadqa ?? 15000)}>
              {formatPKR(donationsSummary.sadqa ?? 15000)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {lang === "ur" ? "کتب، اسٹیشنری و کاپیاں" : "Inventory & notebooks supply"}
            </p>
          </div>
        </div>

        {/* Real Receipts Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 text-start whitespace-nowrap">{lang === "ur" ? "رسید نمبر و تاریخ" : "Receipt & Date"}</th>
                  <th className="py-2.5 px-3 text-start whitespace-nowrap">{lang === "ur" ? "مخیر / ڈونر" : "Donor"}</th>
                  <th className="py-2.5 px-3 text-start whitespace-nowrap">{lang === "ur" ? "قسم" : "Type"}</th>
                  <th className="py-2.5 px-3 text-start whitespace-nowrap">{lang === "ur" ? "مقصد" : "Purpose"}</th>
                  <th className="py-2.5 px-3 text-start whitespace-nowrap">{lang === "ur" ? "طریقہ" : "Method"}</th>
                  <th className="py-2.5 px-3 text-end whitespace-nowrap">{lang === "ur" ? "رقم (روپے)" : "Amount (PKR)"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(donationsSummary.items?.length ? donationsSummary.items : [
                  { id: "d1", receiptNo: "DR-2026-0001", date: "2026-05-12", donor: "Haji Abdul Rauf", donorUrdu: "حاجی عبدالرؤف", type: "zakat", purpose: "Orphan student fees", amountPaisa: 25000000, method: "bank" },
                  { id: "d2", receiptNo: "DR-2026-0002", date: "2026-05-18", donor: "Anonymous", donorUrdu: "گمنام", type: "sadqa", purpose: "Inventory — notebooks", amountPaisa: 1500000, method: "cash" },
                  { id: "d3", receiptNo: "DR-2026-0003", date: "2026-05-22", donor: "Mrs. Aisha Khan", donorUrdu: "عائشہ خان", type: "general", purpose: "Building fund", amountPaisa: 10000000, method: "online" },
                ]).slice(0, 5).map((d: any) => (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <p className="font-mono font-semibold text-primary">{d.receiptNo}</p>
                      <p className="text-[10px] text-muted-foreground">{d.date}</p>
                    </td>
                    <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                      <p className="truncate max-w-[160px]">{lang === "ur" ? (d.donorUrdu || d.donor) : d.donor}</p>
                      {d.phone && <p className="text-[10px] text-muted-foreground font-mono truncate">{d.phone}</p>}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium capitalize",
                          d.type === "zakat"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : d.type === "sadqa"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {d.type === "zakat" ? (lang === "ur" ? "زکوٰۃ" : "Zakat") : d.type === "sadqa" ? (lang === "ur" ? "صدقہ" : "Sadqa") : (lang === "ur" ? "عام عطیہ" : "General")}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]" title={d.purpose}>
                      {d.purpose}
                    </td>
                    <td className="py-2.5 px-3 capitalize font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {d.method}
                    </td>
                    <td className="py-2.5 px-3 text-end font-heading font-semibold tabular-nums text-foreground whitespace-nowrap">
                      {formatPKR(Math.round(Number(d.amountPaisa || 0) / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Inventory & Physical Assets Snapshot */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold text-base sm:text-lg">
                {lang === "ur" ? "مالیات و انوینٹری — اثاثہ جات و سامان" : "Finance & Inventory — Physical Assets"}
              </h3>
            </div>
            <p className="font-urdu text-sm text-muted-foreground mt-0.5">
              {lang === "ur"
                ? "کتب، اسٹیشنری، کلاس روم اور مسجد کے مجموعی اثاثہ جات اور اسٹاک کی موجودہ صورتحال"
                : "Stationery, textbooks, mosque, and classroom supplies inventory valuation."}
            </p>
          </div>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
          >
            <span>{lang === "ur" ? "مکمل انوینٹری کھولیں" : "View Inventory Manager"}</span>
            <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-0 rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
          <div className="p-3.5 rounded-xl border border-border bg-card/60 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {lang === "ur" ? "کل تخمینہ مالیت" : "Total Valuation"}
            </p>
            <p className="font-heading text-base sm:text-lg font-bold text-foreground mt-0.5 tabular-nums truncate" title={formatPKR(inventorySummary.totalValue ?? 0)}>
              {formatPKR(inventorySummary.totalValue ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {inventorySummary.totalItems ?? 0} {lang === "ur" ? "مختلف اقسام کا سامان" : "catalog items"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-card/60 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {lang === "ur" ? "موجودہ کل مقدار" : "Total Stock In-Hand"}
            </p>
            <p className="font-heading text-base sm:text-lg font-bold text-foreground mt-0.5 tabular-nums truncate">
              {inventorySummary.totalUnits ?? 0} {lang === "ur" ? "اکائیاں" : "units"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {lang === "ur" ? "کتب، کاپیاں و اشیاء" : "Books, stationery & items"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 min-w-0">
            <p className="text-xs text-amber-700 dark:text-amber-400 truncate">
              {lang === "ur" ? "کم اسٹاک اشتباہ" : "Low Stock Warnings"}
            </p>
            <p className="font-heading text-base sm:text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums truncate">
              {inventorySummary.lowStockCount ?? 0} {lang === "ur" ? "اشیاء" : "items"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {lang === "ur" ? "دوبارہ خریداری مطلوب ہے" : "Requires restocking"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 min-w-0">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 truncate">
              {lang === "ur" ? "شعبہ جاتی استعمال" : "Physical Assets Status"}
            </p>
            <p className="font-heading text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums truncate">
              {lang === "ur" ? "فعال اور زیر استعمال" : "Active & Allocated"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {lang === "ur" ? "مدارس و سکول کیمپس" : "Campus facilities & classes"}
            </p>
          </div>
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
              ? `${activeConfig.shortNameUr} اور ملحقہ شعبہ جات کی حقیقی سرگرمیاں`
              : `Activity timeline for ${activeConfig.shortNameEn}`}
          </p>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {recentActivities.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground font-urdu">
              {lang === "ur" ? "ابھی تک کوئی حالیہ سرگرمی درج نہیں ہوئی" : "No recent activity recorded yet"}
            </div>
          ) : (
            recentActivities.map((a: any) => {
              const Icon = ACTIVITY_ICONS[a.type as keyof typeof ACTIVITY_ICONS] || BookOpen;
              const tone = ACTIVITY_TONE[a.type as keyof typeof ACTIVITY_TONE] || "bg-primary/10 text-primary";
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                      tone,
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
            })
          )}
        </div>
      </Card>
    </div>
  );
}
