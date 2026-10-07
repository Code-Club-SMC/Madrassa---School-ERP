import {
  LayoutDashboard,
  FileSignature,
  Users2,
  CalendarCheck,
  Banknote,
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

const SUPER_ADMINS: UserRole[] = ["super_admin"];
const ADMINS: UserRole[] = ["super_admin", "admin"];
const ADMISSION_ROLES: UserRole[] = ["super_admin", "admin", "admission_admin"];
const ACADEMIC_ROLES: UserRole[] = ["super_admin", "admin", "academic_admin", "principal"];
const FINANCE_ROLES: UserRole[] = ["super_admin", "admin", "finance_admin", "accountant"];
const HR_ROLES: UserRole[] = ["super_admin", "admin", "hr_admin", "hr_manager", "principal"];
const REPORTS_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "reports_admin",
  "academic_admin",
  "finance_admin",
  "hr_admin",
  "principal",
  "teacher",
];
const TEACHER_MANAGERS: UserRole[] = ["super_admin", "admin", "hr_admin", "principal", "hr_manager"];
const ANY_STAFF: UserRole[] = [
  "super_admin",
  "admin",
  "admission_admin",
  "academic_admin",
  "finance_admin",
  "hr_admin",
  "reports_admin",
  "principal",
  "hr_manager",
  "accountant",
  "teacher",
  "staff",
];
const PARENT_SAFE: UserRole[] = ["super_admin", "admin", "parent"];
const NOTIFICATION_ROLES: UserRole[] = [...ANY_STAFF, "parent"];

export const navItems: NavItem[] = [
  // ---------- GLOBAL ----------
  { group: "global", url: "/dashboard", icon: LayoutDashboard, en: "Dashboard", ur: "ڈیش بورڈ", roles: [...ANY_STAFF, "parent"] },
  { group: "global", url: "/admission", icon: FileSignature, en: "Admission", ur: "داخلہ", roles: ADMISSION_ROLES },
  { group: "global", url: "/admission/new", icon: UserPlus, en: "New Admission", ur: "نیا داخلہ", roles: ADMISSION_ROLES },
  { group: "global", url: "/admission/queue", icon: ListChecks, en: "Application Queue", ur: "درخواستوں کی قطار", roles: ADMISSION_ROLES },
  { group: "global", url: "/admission/interviews", icon: UserRoundCheck, en: "Interviews", ur: "انٹرویو", roles: ADMISSION_ROLES },

  // ---------- MADRASSA ----------
  { group: "madrassa", url: "/madrassa/students", icon: Users2, en: "Students", ur: "طلبہ", roles: [...ACADEMIC_ROLES, "teacher"] },
  { group: "madrassa", url: "/madrassa/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: [...FINANCE_ROLES, ...ACADEMIC_ROLES] },
  { group: "madrassa", url: "/madrassa/categories", icon: BookOpen, en: "Categories", ur: "زمرے", roles: ACADEMIC_ROLES },
  { group: "madrassa", url: "/madrassa/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: [...ACADEMIC_ROLES, "teacher"] },
  { group: "madrassa", url: "/madrassa/exams", icon: GraduationCap, en: "Examinations", ur: "امتحانات", roles: [...ACADEMIC_ROLES, "teacher"] },

  // ---------- SCHOOL ----------
  { group: "school", url: "/school/students", icon: Users2, en: "Students", ur: "طلبہ", roles: [...ACADEMIC_ROLES, "teacher"] },
  { group: "school", url: "/school/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: [...FINANCE_ROLES, ...ACADEMIC_ROLES] },
  { group: "school", url: "/school/classes", icon: School, en: "Classes", ur: "جماعتیں", roles: ACADEMIC_ROLES },
  { group: "school", url: "/school/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: [...ACADEMIC_ROLES, "teacher"] },
  { group: "school", url: "/school/exams", icon: GraduationCap, en: "Examinations", ur: "امتحانات", roles: [...ACADEMIC_ROLES, "teacher"] },

  // ---------- SHARED ----------
  { group: "shared", url: "/id-cards", icon: IdCard, en: "ID Cards", ur: "شناختی کارڈ", roles: [...ADMISSION_ROLES, ...ACADEMIC_ROLES] },
  { group: "shared", url: "/reports", icon: BarChart3, en: "Reports", ur: "رپورٹس", roles: REPORTS_ROLES },
  { group: "shared", url: "/reports/monthly", icon: CalendarDays, en: "Monthly Report", ur: "ماہانہ رپورٹ", roles: REPORTS_ROLES },
  { group: "shared", url: "/reports/annual", icon: CalendarRange, en: "Annual Report", ur: "سالانہ رپورٹ", roles: REPORTS_ROLES },
  { group: "shared", url: "/reports/exams", icon: GraduationCap, en: "Exam Report", ur: "امتحانی رپورٹ", roles: REPORTS_ROLES },
  { group: "shared", url: "/reports/attendance", icon: CalendarCheck, en: "Attendance Report", ur: "حاضری رپورٹ", roles: REPORTS_ROLES },
  { group: "shared", url: "/reports/admin", icon: Gauge, en: "Admin Report", ur: "ایڈمن رپورٹ", roles: REPORTS_ROLES },
  { group: "shared", url: "/inventory", icon: Package, en: "Inventory", ur: "انوینٹری", roles: FINANCE_ROLES },
  { group: "shared", url: "/finance", icon: Wallet, en: "Finance", ur: "مالیات", roles: FINANCE_ROLES },
  { group: "shared", url: "/finance/reports", icon: BarChart3, en: "Finance Reports", ur: "مالی رپورٹس", roles: FINANCE_ROLES },
  { group: "shared", url: "/finance/donations", icon: Receipt, en: "Donation Receipts", ur: "عطیات کی رسیدیں", roles: FINANCE_ROLES },
  { group: "shared", url: "/settings/concessions", icon: HandCoins, en: "Fee Concessions", ur: "رعایات", roles: FINANCE_ROLES },
  { group: "shared", url: "/parents", icon: HeartHandshake, en: "Parents Portal", ur: "والدین", roles: PARENT_SAFE },
  { group: "shared", url: "/notifications", icon: Bell, en: "Notifications", ur: "اعلانات", roles: NOTIFICATION_ROLES },
  { group: "shared", url: "/settings/academic-year", icon: CalendarRange, en: "Academic Year", ur: "تعلیمی سال", roles: ACADEMIC_ROLES },

  // ---------- HR MANAGEMENT ----------
  { group: "shared", url: "/hr", icon: UsersRound, en: "HR Management", ur: "انسانی وسائل", roles: HR_ROLES },
  { group: "shared", url: "/teachers", icon: GraduationCap, en: "Teachers", ur: "اساتذہ", roles: TEACHER_MANAGERS },
  { group: "shared", url: "/teachers/salary", icon: Banknote, en: "Salary Slips", ur: "تنخواہ سلپ", roles: TEACHER_MANAGERS },
  { group: "shared", url: "/users", icon: ShieldUser, en: "User Accounts", ur: "صارفین", roles: SUPER_ADMINS },
  { group: "shared", url: "/hr/attendance", icon: CalendarDays, en: "Staff Attendance", ur: "حاضری عملہ", roles: HR_ROLES },
  { group: "shared", url: "/hr/leave", icon: PlaneTakeoff, en: "Leave Mgmt", ur: "چھٹیاں", roles: HR_ROLES },
  { group: "shared", url: "/holidays", icon: CalendarX, en: "Holidays", ur: "تعطیلات", roles: HR_ROLES },
  { group: "shared", url: "/settings/templates", icon: MessageSquareText, en: "SMS & Msg Templates", ur: "پیغام و ایس ایم ایس", roles: HR_ROLES },
  { group: "shared", url: "/settings/website", icon: Globe, en: "Website CMS", ur: "ویب سائٹ", roles: [...SUPER_ADMINS, "admin"] },
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
  { url: "/madrassa/students", icon: Users2, en: "Students", ur: "طلبہ", roles: [...ACADEMIC_ROLES, "teacher"] },
  { url: "/madrassa/categories", icon: BookOpen, en: "Categories", ur: "زمرے", roles: ACADEMIC_ROLES },
  { url: "/madrassa/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: [...FINANCE_ROLES, ...ACADEMIC_ROLES] },
  { url: "/madrassa/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: [...ACADEMIC_ROLES, "teacher"] },
  { url: "/madrassa/exams", icon: GraduationCap, en: "Examinations", ur: "امتحانات", roles: [...ACADEMIC_ROLES, "teacher"] },
  { url: "/settings/academic-year", icon: CalendarRange, en: "Academic Year", ur: "تعلیمی سال", roles: ACADEMIC_ROLES },
];

const SCHOOL_CHILDREN: NavChild[] = [
  { url: "/school/students", icon: Users2, en: "Students", ur: "طلبہ", roles: [...ACADEMIC_ROLES, "teacher"] },
  { url: "/school/classes", icon: School, en: "Classes", ur: "جماعتیں", roles: ACADEMIC_ROLES },
  { url: "/school/fees", icon: Banknote, en: "Fees", ur: "فیس", roles: [...FINANCE_ROLES, ...ACADEMIC_ROLES] },
  { url: "/school/timetable", icon: CalendarClock, en: "Timetable", ur: "نظامِ اوقات", roles: [...ACADEMIC_ROLES, "teacher"] },
  { url: "/school/exams", icon: GraduationCap, en: "Examinations", ur: "امتحانات", roles: [...ACADEMIC_ROLES, "teacher"] },
  { url: "/settings/academic-year", icon: CalendarRange, en: "Academic Year", ur: "تعلیمی سال", roles: ACADEMIC_ROLES },
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
    key: "admission",
    icon: FileSignature,
    en: "Admission",
    ur: "داخلہ",
    url: "/admission",
    roles: ADMISSION_ROLES,
    children: [
      { url: "/admission", icon: FileSignature, en: "Overview", ur: "جائزہ", roles: ADMISSION_ROLES },
      { url: "/admission/new", icon: UserPlus, en: "New Admission", ur: "نیا داخلہ", roles: ADMISSION_ROLES },
      { url: "/admission/queue", icon: ListChecks, en: "Application Queue", ur: "درخواستوں کی قطار", roles: ADMISSION_ROLES },
      { url: "/admission/interviews", icon: UserRoundCheck, en: "Interviews", ur: "انٹرویو", roles: ADMISSION_ROLES },
    ],
  },
  {
    key: "academic",
    icon: GraduationCap,
    en: "Academic",
    ur: "تعلیمی",
    moduleScoped: true,
    roles: [...ACADEMIC_ROLES, "teacher"],
  },
  {
    key: "finance",
    icon: Wallet,
    en: "Finance",
    ur: "مالیات",
    roles: FINANCE_ROLES,
    children: [
      { url: "/finance", icon: Wallet, en: "Overview", ur: "جائزہ", roles: FINANCE_ROLES },
      { url: "/finance/reports", icon: BarChart3, en: "Finance Reports", ur: "مالی رپورٹس", roles: FINANCE_ROLES },
      { url: "/finance/donations", icon: Receipt, en: "Donation Receipts", ur: "عطیات کی رسیدیں", roles: FINANCE_ROLES },
      { url: "/settings/concessions", icon: HandCoins, en: "Fee Concessions", ur: "رعایات", roles: FINANCE_ROLES },
      { url: "/inventory", icon: Package, en: "Inventory", ur: "انوینٹری", roles: FINANCE_ROLES },
    ],
  },
  {
    key: "hr",
    icon: UsersRound,
    en: "HR",
    ur: "انسانی وسائل",
    roles: HR_ROLES,
    children: [
      { url: "/hr", icon: UsersRound, en: "Overview", ur: "جائزہ", roles: HR_ROLES },
      { url: "/hr/attendance", icon: CalendarDays, en: "Staff Attendance", ur: "حاضری عملہ", roles: HR_ROLES },
      { url: "/hr/leave", icon: PlaneTakeoff, en: "Leave Mgmt", ur: "چھٹیاں", roles: HR_ROLES },
      { url: "/teachers", icon: GraduationCap, en: "Teachers", ur: "اساتذہ", roles: TEACHER_MANAGERS },
      { url: "/teachers/salary", icon: Banknote, en: "Salary Slips", ur: "تنخواہ سلپ", roles: TEACHER_MANAGERS },
      { url: "/users", icon: ShieldUser, en: "User Accounts", ur: "صارفین", roles: SUPER_ADMINS },
      { url: "/holidays", icon: CalendarX, en: "Holidays", ur: "تعطیلات", roles: HR_ROLES },
      { url: "/settings/templates", icon: MessageSquareText, en: "SMS & Msg Templates", ur: "پیغام و ایس ایم ایس", roles: HR_ROLES },
      { url: "/settings/website", icon: Globe, en: "Website CMS", ur: "ویب سائٹ", roles: [...SUPER_ADMINS, "admin"] },
    ],
  },
  {
    key: "reports",
    icon: BarChart3,
    en: "Reports",
    ur: "رپورٹس",
    roles: REPORTS_ROLES,
    children: [
      { url: "/reports", icon: BarChart3, en: "Overview", ur: "جائزہ", roles: REPORTS_ROLES },
      { url: "/reports/monthly", icon: CalendarDays, en: "Monthly", ur: "ماہانہ", roles: REPORTS_ROLES },
      { url: "/reports/annual", icon: CalendarRange, en: "Annual", ur: "سالانہ", roles: REPORTS_ROLES },
      { url: "/reports/exams", icon: GraduationCap, en: "Exams", ur: "امتحانات", roles: REPORTS_ROLES },
      { url: "/reports/attendance", icon: CalendarCheck, en: "Attendance Report", ur: "حاضری رپورٹ", roles: REPORTS_ROLES },
      { url: "/reports/admin", icon: Gauge, en: "Admin", ur: "ایڈمن", roles: REPORTS_ROLES },
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
  if (
    pathname.startsWith("/settings/academic-year") ||
    pathname.startsWith("/madrassa") ||
    pathname.startsWith("/school")
  ) {
    return parents.find((p) => p.key === "academic");
  }
  if (
    pathname.startsWith("/finance") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/settings/concessions")
  ) {
    return parents.find((p) => p.key === "finance");
  }
  if (
    pathname.startsWith("/hr") ||
    pathname.startsWith("/teachers") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/holidays") ||
    pathname.startsWith("/settings/templates") ||
    pathname.startsWith("/settings/website")
  ) {
    return parents.find((p) => p.key === "hr");
  }
  if (pathname.startsWith("/reports")) {
    return parents.find((p) => p.key === "reports");
  }
  if (pathname.startsWith("/admission")) {
    return parents.find((p) => p.key === "admission");
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
  "/finance/donations": { en: "Donation Receipts", ur: "عطیات کی رسیدیں" },
  "/settings/concessions": { en: "Fee Concessions", ur: "رعایات" },
  "/settings/templates": { en: "SMS & Msg Templates", ur: "پیغام و ایس ایم ایس" },
  "/settings/website": { en: "Website CMS", ur: "ویب سائٹ" },
  "/settings/academic-year": { en: "Academic Year", ur: "تعلیمی سال" },
  "/reports/attendance": { en: "Attendance Report", ur: "حاضری رپورٹ" },
});