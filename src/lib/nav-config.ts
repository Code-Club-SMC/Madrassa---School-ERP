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
  UsersRound,
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
  Sparkles,
  Bell,
  HandCoins,
  Receipt,
  MessageSquareText,
  DatabaseBackup,
  Briefcase,
  CalendarDays,
  PlaneTakeoff,
  Building2,
  Users,
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
const TEACHER_MANAGERS: UserRole[] = ["super_admin", "admin", "principal", "hr_manager"];
const PARENT_SAFE: UserRole[] = ["super_admin", "admin", "parent"];
const NOTIFICATION_ROLES: UserRole[] = ["super_admin", "admin", "teacher", "parent"];

export const navItems: NavItem[] = [
  // ---------- GLOBAL ----------
  { group: "global", url: "/dashboard", icon: LayoutDashboard, en: "Dashboard", ur: "ڈیش بورڈ", roles: [...ANY_STAFF, "parent"] },
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
  { group: "madrassa", url: "/madrassa/hifz", icon: Sparkles, en: "Hifz Tracker", ur: "حفظ ٹریکر", roles: ANY_STAFF },
  { group: "madrassa", url: "/settings/academic-year", icon: CalendarRange, en: "Academic Year", ur: "تعلیمی سال", roles: ADMINS },

  // ---------- SCHOOL ----------
  { group: "school", url: "/school/students", icon: Users2, en: "Students", ur: "طلبہ", roles: ANY_STAFF },
  { group: "school", url: "/school/attendance", icon: CalendarCheck, en: "Attendance", ur: "حاضری", roles: ANY_STAFF },
  { group: "school", url: "/school/exams", icon: ClipboardList, en: "Examinations", ur: "امتحانات", roles: ANY_STAFF },
  { group: "school", url: "/school/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: ADMINS },
  { group: "school", url: "/school/classes", icon: School, en: "Classes", ur: "جماعتیں", roles: ADMINS },
  { group: "school", url: "/school/subjects", icon: BookMarked, en: "Subjects", ur: "مضامین", roles: ADMINS },
  { group: "school", url: "/school/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: ANY_STAFF },

  // ---------- SHARED ----------
  { group: "shared", url: "/id-cards", icon: IdCard, en: "ID Cards", ur: "شناختی کارڈ", roles: ADMINS },
  { group: "shared", url: "/reports", icon: BarChart3, en: "Reports", ur: "رپورٹس", roles: ANY_STAFF },
  { group: "shared", url: "/inventory", icon: Package, en: "Inventory", ur: "انوینٹری", roles: ADMINS },
  { group: "shared", url: "/finance", icon: Wallet, en: "Finance", ur: "مالیات", roles: ADMINS },
  { group: "shared", url: "/finance/reports", icon: BarChart3, en: "Finance Reports", ur: "مالی رپورٹس", roles: ADMINS },
  { group: "shared", url: "/finance/donations", icon: Receipt, en: "Donations", ur: "عطیات", roles: ADMINS },
  { group: "shared", url: "/parents", icon: HeartHandshake, en: "Parents Portal", ur: "والدین", roles: PARENT_SAFE },
  { group: "shared", url: "/notifications", icon: Bell, en: "Notifications", ur: "اعلانات", roles: NOTIFICATION_ROLES },

  // ---------- HR MANAGEMENT (unified: Staff + Teachers + Users + Payroll) ----------
  { group: "shared", url: "/hr", icon: UsersRound, en: "HR Management", ur: "انسانی وسائل", roles: ADMINS },
  { group: "shared", url: "/teachers", icon: GraduationCap, en: "Teachers", ur: "اساتذہ", roles: TEACHER_MANAGERS },
  { group: "shared", url: "/users", icon: ShieldUser, en: "User Accounts", ur: "صارفین", roles: ["super_admin"] },
  { group: "shared", url: "/hr/payroll", icon: HandCoins, en: "Payroll", ur: "تنخواہ", roles: ADMINS },
  { group: "shared", url: "/hr/attendance", icon: CalendarDays, en: "Staff Attendance", ur: "حاضری عملہ", roles: ADMINS },
  { group: "shared", url: "/hr/leave", icon: PlaneTakeoff, en: "Leave Mgmt", ur: "چھٹیاں", roles: ADMINS },
  { group: "shared", url: "/hr/departments", icon: Building2, en: "Departments", ur: "شعبہ جات", roles: ADMINS },

  // ---------- ADMIN (bottom-pinned) ----------
  { group: "admin", url: "/holidays", icon: CalendarX, en: "Holidays", ur: "تعطیلات", roles: ADMINS },
  { group: "admin", url: "/settings/concessions", icon: HandCoins, en: "Concessions", ur: "رعایات", roles: ADMINS },
  { group: "admin", url: "/settings/templates", icon: MessageSquareText, en: "Msg Templates", ur: "پیغام سانچے", roles: ADMINS },
  { group: "admin", url: "/settings/backup", icon: DatabaseBackup, en: "Backup", ur: "بیک اپ", roles: ["super_admin"] },
  { group: "admin", url: "/settings/website", icon: Globe, en: "Website CMS", ur: "ویب سائٹ", roles: ADMINS },
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
  "/teachers/salary": { en: "Salary Slips", ur: "تنخواہ سلپ" },
  "/finance/reports": { en: "Finance Reports", ur: "مالی رپورٹس" },
  "/finance/donations": { en: "Donations", ur: "عطیات" },
  "/admission/interviews": { en: "Interviews & Waitlist", ur: "انٹرویو" },
  "/settings/templates": { en: "Message Templates", ur: "پیغام سانچے" },
  "/settings/backup": { en: "Backup & Restore", ur: "بیک اپ" },
});
