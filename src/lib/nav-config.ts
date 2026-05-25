import {
  LayoutDashboard,
  FileSignature,
  Users2,
  CalendarCheck,
  Banknote,
  Layers,
  BookOpen,
  Library,
  CalendarClock,
  GraduationCap,
  ClipboardList,
  IdCard,
  BarChart3,
  Package,
  Wallet,
  HeartHandshake,
  Settings,
  ShieldUser,
  ShieldCheck,
  CalendarX,
  CalendarRange,
  Globe,
  School,
  BookMarked,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export type NavItem = {
  url: string;
  icon: LucideIcon;
  en: string;
  ur: string;
  roles?: UserRole[]; // omit = any authenticated role
  group: "global" | "madrassa" | "school" | "shared" | "admin";
};

const ANY_STAFF: UserRole[] = ["super_admin", "admin", "teacher"];
const ADMINS: UserRole[] = ["super_admin", "admin"];

export const navItems: NavItem[] = [
  // ---------- GLOBAL ----------
  { group: "global", url: "/dashboard", icon: LayoutDashboard, en: "Dashboard", ur: "ڈیش بورڈ", roles: ANY_STAFF },
  { group: "global", url: "/admission", icon: FileSignature, en: "Admission", ur: "داخلہ", roles: ADMINS },

  // ---------- MADRASSA ----------
  { group: "madrassa", url: "/madrassa/students", icon: Users2, en: "Students", ur: "طلبہ", roles: ANY_STAFF },
  { group: "madrassa", url: "/madrassa/attendance", icon: CalendarCheck, en: "Attendance", ur: "حاضری", roles: ANY_STAFF },
  { group: "madrassa", url: "/madrassa/exams", icon: GraduationCap, en: "Exams", ur: "امتحانات", roles: ANY_STAFF },
  { group: "madrassa", url: "/madrassa/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: ADMINS },
  { group: "madrassa", url: "/madrassa/classes", icon: BookOpen, en: "Daraja", ur: "درجات", roles: ADMINS },
  { group: "madrassa", url: "/madrassa/subjects", icon: Library, en: "Subjects", ur: "مضامین", roles: ADMINS },
  { group: "madrassa", url: "/madrassa/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: ANY_STAFF },
  { group: "madrassa", url: "/madrassa/categories", icon: Layers, en: "Categories", ur: "اقسام", roles: ADMINS },

  // ---------- SCHOOL ----------
  { group: "school", url: "/school/students", icon: Users2, en: "Students", ur: "طلبہ", roles: ANY_STAFF },
  { group: "school", url: "/school/attendance", icon: CalendarCheck, en: "Attendance", ur: "حاضری", roles: ANY_STAFF },
  { group: "school", url: "/school/exams", icon: ClipboardList, en: "Examinations", ur: "امتحانات", roles: ANY_STAFF },
  { group: "school", url: "/school/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: ADMINS },
  { group: "school", url: "/school/classes", icon: School, en: "Classes", ur: "جماعتیں", roles: ADMINS },
  { group: "school", url: "/school/subjects", icon: BookMarked, en: "Subjects", ur: "مضامین", roles: ADMINS },
  { group: "school", url: "/school/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: ANY_STAFF },

  // ---------- SHARED ----------
  { group: "shared", url: "/teachers", icon: GraduationCap, en: "Teachers", ur: "اساتذہ", roles: ADMINS },
  { group: "shared", url: "/id-cards", icon: IdCard, en: "ID Cards", ur: "شناختی کارڈ", roles: ADMINS },
  { group: "shared", url: "/reports", icon: BarChart3, en: "Reports", ur: "رپورٹس", roles: ANY_STAFF },
  { group: "shared", url: "/inventory", icon: Package, en: "Inventory", ur: "انوینٹری", roles: ADMINS },
  { group: "shared", url: "/finance", icon: Wallet, en: "Finance", ur: "مالیات", roles: ADMINS },
  { group: "shared", url: "/parents", icon: HeartHandshake, en: "Parents Portal", ur: "والدین", roles: ADMINS },

  // ---------- ADMIN (bottom-pinned) ----------
  { group: "admin", url: "/holidays", icon: CalendarX, en: "Holidays", ur: "تعطیلات", roles: ADMINS },
  { group: "admin", url: "/settings/academic-year", icon: CalendarRange, en: "Academic Year", ur: "تعلیمی سال", roles: ADMINS },
  { group: "admin", url: "/settings/website", icon: Globe, en: "Website CMS", ur: "ویب سائٹ", roles: ADMINS },
  { group: "admin", url: "/users", icon: ShieldUser, en: "Users", ur: "صارفین", roles: ["super_admin"] },
  { group: "admin", url: "/audit", icon: ShieldCheck, en: "Audit Log", ur: "آڈٹ لاگ", roles: ["super_admin"] },
  { group: "admin", url: "/settings", icon: Settings, en: "Settings", ur: "ترتیبات", roles: ADMINS },
];

export function visibleFor(role: UserRole | undefined, group: NavItem["group"]) {
  return navItems.filter((i) => i.group === group && (!i.roles || (role && i.roles.includes(role))));
}

export const PAGE_TITLES: Record<string, { en: string; ur: string }> = Object.fromEntries(
  navItems.map((i) => [i.url, { en: i.en, ur: i.ur }]),
);

// Extra non-nav titles
Object.assign(PAGE_TITLES, {
  "/admission/new": { en: "New Admission", ur: "نیا داخلہ" },
  "/admission/queue": { en: "Application Queue", ur: "درخواستوں کی قطار" },
});