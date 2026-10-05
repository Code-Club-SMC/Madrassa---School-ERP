import {
  LayoutDashboard,
  FileSignature,
  Users2,
  CalendarCheck,
  Banknote,
  Layers,
  BookOpen,
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
  Briefcase,
  CalendarDays,
  PlaneTakeoff,
  Building2,
  Users,
  UserPlus,
  ListChecks,
  UserRoundCheck,
  Gauge,
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
  { group: "global", url: "/admission/new", icon: UserPlus, en: "New Admission", ur: "نیا داخلہ", roles: ADMINS },
  { group: "global", url: "/admission/queue", icon: ListChecks, en: "Application Queue", ur: "درخواستوں کی قطار", roles: ADMINS },
  { group: "global", url: "/admission/interviews", icon: UserRoundCheck, en: "Interviews", ur: "انٹرویو", roles: ADMINS },

  // ---------- MADRASSA ----------
  { group: "madrassa", url: "/madrassa/students", icon: Users2, en: "Students", ur: "طلبہ", roles: ANY_STAFF },
  { group: "madrassa", url: "/madrassa/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: ADMINS },
  { group: "madrassa", url: "/madrassa/categories", icon: BookOpen, en: "Categories", ur: "زمرے", roles: ADMINS },
  { group: "madrassa", url: "/madrassa/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: ANY_STAFF },
  { group: "madrassa", url: "/madrassa/hifz", icon: Sparkles, en: "Hifz Tracker", ur: "حفظ ٹریکر", roles: ANY_STAFF },
  { group: "madrassa", url: "/madrassa/exams", icon: GraduationCap, en: "Examinations", ur: "امتحانات", roles: ANY_STAFF },

  // ---------- SCHOOL ----------
  { group: "school", url: "/school/students", icon: Users2, en: "Students", ur: "طلبہ", roles: ANY_STAFF },
  { group: "school", url: "/school/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: ADMINS },
  { group: "school", url: "/school/classes", icon: School, en: "Classes", ur: "جماعتیں", roles: ADMINS },
  { group: "school", url: "/school/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: ANY_STAFF },
  { group: "school", url: "/school/exams", icon: GraduationCap, en: "Examinations", ur: "امتحانات", roles: ANY_STAFF },

  // ---------- SHARED ----------
  { group: "shared", url: "/id-cards", icon: IdCard, en: "ID Cards", ur: "شناختی کارڈ", roles: ADMINS },
  { group: "shared", url: "/reports", icon: BarChart3, en: "Reports", ur: "رپورٹس", roles: ANY_STAFF },
  { group: "shared", url: "/reports/monthly", icon: CalendarDays, en: "Monthly Report", ur: "ماہانہ رپورٹ", roles: ANY_STAFF },
  { group: "shared", url: "/reports/annual", icon: CalendarRange, en: "Annual Report", ur: "سالانہ رپورٹ", roles: ANY_STAFF },
  { group: "shared", url: "/reports/exams", icon: GraduationCap, en: "Exam Report", ur: "امتحانی رپورٹ", roles: ANY_STAFF },
  { group: "shared", url: "/reports/attendance", icon: CalendarCheck, en: "Attendance Report", ur: "حاضری رپورٹ", roles: ANY_STAFF },
  { group: "shared", url: "/reports/category", icon: Layers, en: "Category Report", ur: "زمرہ رپورٹ", roles: ANY_STAFF },
  { group: "shared", url: "/reports/admin", icon: Gauge, en: "Admin Report", ur: "ایڈمن رپورٹ", roles: ANY_STAFF },
  { group: "shared", url: "/inventory", icon: Package, en: "Inventory", ur: "انوینٹری", roles: ADMINS },
  { group: "shared", url: "/finance", icon: Wallet, en: "Finance", ur: "مالیات", roles: ADMINS },
  { group: "shared", url: "/finance/reports", icon: BarChart3, en: "Finance Reports", ur: "مالی رپورٹس", roles: ADMINS },
  { group: "shared", url: "/finance/donations", icon: Receipt, en: "Donations", ur: "عطیات", roles: ADMINS },
  { group: "shared", url: "/parents", icon: HeartHandshake, en: "Parents Portal", ur: "والدین", roles: PARENT_SAFE },
  { group: "shared", url: "/notifications", icon: Bell, en: "Notifications", ur: "اعلانات", roles: NOTIFICATION_ROLES },
  { group: "shared", url: "/settings/academic-year", icon: CalendarRange, en: "Academic Year", ur: "تعلیمی سال", roles: ADMINS },

  // ---------- HR MANAGEMENT (unified: Staff + Teachers + Users + Payroll) ----------
  { group: "shared", url: "/hr", icon: UsersRound, en: "HR Management", ur: "انسانی وسائل", roles: ADMINS },
  { group: "shared", url: "/teachers", icon: GraduationCap, en: "Teachers", ur: "اساتذہ", roles: TEACHER_MANAGERS },
  { group: "shared", url: "/teachers/salary", icon: Banknote, en: "Salary Slips", ur: "تنخواہ سلپ", roles: TEACHER_MANAGERS },
  { group: "shared", url: "/users", icon: ShieldUser, en: "User Accounts", ur: "صارفین", roles: ["super_admin"] },
  { group: "shared", url: "/hr/payroll", icon: HandCoins, en: "Payroll", ur: "تنخواہ", roles: ADMINS },
  { group: "shared", url: "/hr/attendance", icon: CalendarDays, en: "Staff Attendance", ur: "حاضری عملہ", roles: ADMINS },
  { group: "shared", url: "/hr/leave", icon: PlaneTakeoff, en: "Leave Mgmt", ur: "چھٹیاں", roles: ADMINS },

  // ---------- ADMIN (bottom-pinned) ----------
  { group: "admin", url: "/holidays", icon: CalendarX, en: "Holidays", ur: "تعطیلات", roles: ADMINS },
  { group: "admin", url: "/settings/concessions", icon: HandCoins, en: "Concessions", ur: "رعایات", roles: ADMINS },
  { group: "admin", url: "/settings/templates", icon: MessageSquareText, en: "Msg Templates", ur: "پیغام سانچے", roles: ADMINS },
  { group: "admin", url: "/settings/website", icon: Globe, en: "Website CMS", ur: "ویب سائٹ", roles: ADMINS },
  { group: "admin", url: "/settings", icon: Settings, en: "Settings", ur: "ترتیبات", roles: ADMINS },
];

// ---------------------------------------------------------------------------
// Parent / child navigation used by the two-pane sidebar.
// Every navItems entry must appear exactly once across these groups so no
// feature is dropped.
// ---------------------------------------------------------------------------

export type NavChild = {
  url: string;
  icon: LucideIcon;
  en: string;
  ur: string;
  roles?: UserRole[];
};

export type NavParent = {
  key: string;
  icon: LucideIcon;
  en: string;
  ur: string;
  /** Direct navigation target. Parents with children may omit it. */
  url?: string;
  roles?: UserRole[];
  /** When present, clicking the parent opens the child panel. */
  children?: NavChild[];
  /** Children are chosen by the active madrassa/school module. */
  moduleScoped?: boolean;
};

const MADRASSA_CHILDREN: NavChild[] = [
  { url: "/madrassa/students", icon: Users2, en: "Students", ur: "طلبہ", roles: ANY_STAFF },
  { url: "/madrassa/categories", icon: BookOpen, en: "Categories", ur: "زمرے", roles: ADMINS },
  { url: "/madrassa/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: ADMINS },
  { url: "/madrassa/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: ANY_STAFF },
  { url: "/madrassa/exams", icon: GraduationCap, en: "Examinations", ur: "امتحانات", roles: ANY_STAFF },
  { url: "/madrassa/hifz", icon: Sparkles, en: "Hifz Tracker", ur: "حفظ ٹریکر", roles: ANY_STAFF },
];

const SCHOOL_CHILDREN: NavChild[] = [
  { url: "/school/students", icon: Users2, en: "Students", ur: "طلبہ", roles: ANY_STAFF },
  { url: "/school/classes", icon: School, en: "Classes", ur: "جماعتیں", roles: ADMINS },
  { url: "/school/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: ADMINS },
  { url: "/school/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: ANY_STAFF },
  { url: "/school/exams", icon: GraduationCap, en: "Examinations", ur: "امتحانات", roles: ANY_STAFF },
];

export const navParents: NavParent[] = [
  {
    key: "dashboard",
    icon: LayoutDashboard,
    en: "Dashboard",
    ur: "ڈیش بورڈ",
    url: "/dashboard",
    roles: [...ANY_STAFF, "parent"],
  },
  {
    key: "academic",
    icon: GraduationCap,
    en: "Academic",
    ur: "تعلیمی",
    moduleScoped: true,
  },
  {
    key: "finance",
    icon: Wallet,
    en: "Finance",
    ur: "مالیات",
    roles: ADMINS,
    children: [
      { url: "/finance", icon: Wallet, en: "Overview", ur: "جائزہ", roles: ADMINS },
      { url: "/finance/reports", icon: BarChart3, en: "Finance Reports", ur: "مالی رپورٹس", roles: ADMINS },
      { url: "/finance/donations", icon: Receipt, en: "Donations", ur: "عطیات", roles: ADMINS },
      { url: "/inventory", icon: Package, en: "Inventory", ur: "انوینٹری", roles: ADMINS },
    ],
  },
  {
    key: "hr",
    icon: UsersRound,
    en: "HR",
    ur: "انسانی وسائل",
    roles: ADMINS,
    children: [
      { url: "/hr", icon: UsersRound, en: "Overview", ur: "جائزہ", roles: ADMINS },
      { url: "/hr/attendance", icon: CalendarDays, en: "Staff Attendance", ur: "حاضری عملہ", roles: ADMINS },
      { url: "/hr/leave", icon: PlaneTakeoff, en: "Leave Mgmt", ur: "چھٹیاں", roles: ADMINS },
      { url: "/hr/payroll", icon: HandCoins, en: "Payroll", ur: "تنخواہ", roles: ADMINS },
      { url: "/teachers", icon: GraduationCap, en: "Teachers", ur: "اساتذہ", roles: TEACHER_MANAGERS },
      { url: "/teachers/salary", icon: Banknote, en: "Salary Slips", ur: "تنخواہ سلپ", roles: TEACHER_MANAGERS },
      { url: "/users", icon: ShieldUser, en: "User Accounts", ur: "صارفین", roles: ["super_admin"] },
    ],
  },
  {
    key: "reports",
    icon: BarChart3,
    en: "Reports",
    ur: "رپورٹس",
    roles: ANY_STAFF,
    children: [
      { url: "/reports", icon: BarChart3, en: "Overview", ur: "جائزہ", roles: ANY_STAFF },
      { url: "/reports/monthly", icon: CalendarDays, en: "Monthly", ur: "ماہانہ", roles: ANY_STAFF },
      { url: "/reports/annual", icon: CalendarRange, en: "Annual", ur: "سالانہ", roles: ANY_STAFF },
      { url: "/reports/exams", icon: GraduationCap, en: "Exams", ur: "امتحانات", roles: ANY_STAFF },
      { url: "/reports/attendance", icon: CalendarCheck, en: "Attendance Report", ur: "حاضری رپورٹ", roles: ANY_STAFF },
      { url: "/reports/category", icon: Layers, en: "Category", ur: "زمرہ", roles: ANY_STAFF },
      { url: "/reports/admin", icon: Gauge, en: "Admin", ur: "ایڈمن", roles: ANY_STAFF },
    ],
  },
  {
    key: "admission",
    icon: FileSignature,
    en: "Admission",
    ur: "داخلہ",
    url: "/admission",
    roles: ADMINS,
    children: [
      { url: "/admission", icon: FileSignature, en: "Overview", ur: "جائزہ", roles: ADMINS },
      { url: "/admission/new", icon: UserPlus, en: "New Admission", ur: "نیا داخلہ", roles: ADMINS },
      { url: "/admission/queue", icon: ListChecks, en: "Application Queue", ur: "درخواستوں کی قطار", roles: ADMINS },
      { url: "/admission/interviews", icon: UserRoundCheck, en: "Interviews", ur: "انٹرویو", roles: ADMINS },
    ],
  },
  {
    key: "records",
    icon: HeartHandshake,
    en: "Records",
    ur: "ریکارڈ",
    roles: [...PARENT_SAFE, "teacher"],
    children: [
      { url: "/id-cards", icon: IdCard, en: "ID Cards", ur: "شناختی کارڈ", roles: ADMINS },
      { url: "/parents", icon: HeartHandshake, en: "Parents Portal", ur: "والدین", roles: PARENT_SAFE },
      { url: "/notifications", icon: Bell, en: "Notifications", ur: "اعلانات", roles: NOTIFICATION_ROLES },
    ],
  },
  {
    key: "settings",
    icon: Settings,
    en: "Settings",
    ur: "ترتیبات",
    roles: ADMINS,
    children: [
      { url: "/settings", icon: Settings, en: "Settings", ur: "ترتیبات", roles: ADMINS },
      { url: "/settings/academic-year", icon: CalendarRange, en: "Academic Year", ur: "تعلیمی سال", roles: ADMINS },
      { url: "/settings/concessions", icon: HandCoins, en: "Concessions", ur: "رعایات", roles: ADMINS },
      { url: "/settings/templates", icon: MessageSquareText, en: "Msg Templates", ur: "پیغام سانچے", roles: ADMINS },
      { url: "/settings/website", icon: Globe, en: "Website CMS", ur: "ویب سائٹ", roles: ADMINS },
      { url: "/holidays", icon: CalendarX, en: "Holidays", ur: "تعطیلات", roles: ADMINS },
    ],
  },
];

export function visibleFor(role: UserRole | undefined, group: NavItem["group"]): NavItem[] {
  return navItems.filter((i) => i.group === group && (!i.roles || (role && i.roles.includes(role))));
}

export function parentsFor(role: UserRole | undefined) {
  return navParents.filter((p) => !p.roles || (role && p.roles.includes(role)));
}

export function childrenFor(
  parent: NavParent,
  module: "madrassa" | "school",
  role: UserRole | undefined,
): NavChild[] {
  const children = parent.moduleScoped
    ? module === "madrassa"
      ? MADRASSA_CHILDREN
      : SCHOOL_CHILDREN
    : parent.children;
  if (!children) return [];
  return children.filter((c) => !c.roles || (role && c.roles.includes(role)));
}

export function findParentForPath(
  pathname: string,
  parents: NavParent[],
  module: "madrassa" | "school",
  role?: UserRole,
): NavParent | undefined {
  if (pathname === "/dashboard" || pathname === "/") {
    return parents.find((p) => p.key === "dashboard");
  }

  // 1. First, look for matching child items across parents
  for (const parent of parents) {
    const children = childrenFor(parent, module, role);
    const matchesChild = children.some((child) => {
      if (pathname === child.url) return true;
      return pathname.startsWith(child.url + "/");
    });
    if (matchesChild) return parent;
  }

  // 2. Next, check direct parent url
  for (const parent of parents) {
    if (parent.url) {
      if (pathname === parent.url || pathname.startsWith(parent.url + "/")) {
        return parent;
      }
    }
  }

  // 3. Fallback prefix checks
  if (pathname.startsWith("/madrassa") || pathname.startsWith("/school")) {
    return parents.find((p) => p.key === "academic");
  }
  if (pathname.startsWith("/finance") || pathname.startsWith("/inventory")) {
    return parents.find((p) => p.key === "finance");
  }
  if (pathname.startsWith("/hr") || pathname.startsWith("/teachers") || pathname.startsWith("/users")) {
    return parents.find((p) => p.key === "hr");
  }
  if (pathname.startsWith("/reports")) {
    return parents.find((p) => p.key === "reports");
  }
  if (pathname.startsWith("/admission")) {
    return parents.find((p) => p.key === "admission");
  }
  if (pathname.startsWith("/settings") || pathname.startsWith("/holidays")) {
    return parents.find((p) => p.key === "settings");
  }
  if (pathname.startsWith("/id-cards") || pathname.startsWith("/parents") || pathname.startsWith("/notifications")) {
    return parents.find((p) => p.key === "records");
  }

  return undefined;
}

export const PAGE_TITLES: Record<string, { en: string; ur: string }> = Object.fromEntries(
  navItems.map((i) => [i.url, { en: i.en, ur: i.ur }]),
);

Object.assign(PAGE_TITLES, {
  "/admission/new": { en: "New Admission", ur: "نیا داخلہ" },
  "/admission/queue": { en: "Application Queue", ur: "درخواستوں کی قطار" },
  "/admission/interviews": { en: "Interviews & Waitlist", ur: "انٹرویو" },
  "/teachers/salary": { en: "Salary Slips", ur: "تنخواہ سلپ" },
  "/finance/reports": { en: "Finance Reports", ur: "مالی رپورٹس" },
  "/finance/donations": { en: "Donations", ur: "عطیات" },
  "/settings/templates": { en: "Message Templates", ur: "پیغام سانچے" },
  "/reports/attendance": { en: "Attendance Report", ur: "حاضری رپورٹ" },
});