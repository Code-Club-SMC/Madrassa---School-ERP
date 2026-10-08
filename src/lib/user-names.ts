import type { UserRole } from "@/types";

export const KNOWN_URDU_NAMES: Record<string, string> = {
  "Maulana Abdul Rehman": "مولانا عبدالرحمٰن",
  "Ustad Muhammad Yasin": "استاد محمد یاسین",
  "Qaria Sakina Noor": "قاریہ سکینہ نور",
  "Nadeem Ahmad": "ندیم احمد",
  "Sadia Iqbal": "سعدیہ اقبال",
  "Kamran Shah": "کامران شاہ",
  "Rehana Kausar": "ریحانہ کوثر",
  "Bilal Ahmed": "بلال احمد",
  "Haji Ghulam Abbas": "حاجی غلام عباس",
  "Zarina Bibi": "زرینہ بی بی",
  "Shabana Kausar": "شبانہ کوثر",
  "Rabia Noor": "رابعہ نور",
  "Amna Aslam": "آمنہ اسلم",
  "Super Admin": "سپر ایڈمن",
  "Admin": "ایڈمن",
  "Mufti Abdul Rahman": "مفتی عبدالرحمن",
  "Hafiz Bilal Ahmad": "حافظ بلال احمد",
  "Maulana Imran Hussain": "مولانا عمران حسین",
  "Sir Adeel Akhtar": "سر عدیل اختر",
  "Miss Ayesha Tariq": "مس عائشہ طارق",
  "Qari Saleem Raza": "قاری سلیم رضا",
  "Sir Faisal Khan": "سر فیصل خان",
  "Zainab Bibi": "زینب بی بی",
  "Tariq Mehmood": "طارق محمود",
  "Farooq Ahmad": "فاروق احمد",
  "Sohail Abbas": "سہیل عباس",
  "Iqbal Hussain": "اقبال حسین",
  "Muhammad Aslam": "محمد اسلم",
  "Ustaad Naeem": "استاد نعیم",
  "Hina Siddiqui": "حنا صدیقی",
  "Fatima Khan": "فاطمہ خان",
  "Ustaad Tariq Mehmood": "استاد طارق محمود",
  "Mufti Zubair": "مفتی زبیر",
  "Sajid Mehmood": "ساجد محمود",
  "Hafiz Junaid": "حافظ جنید",
  "Dr. Saeed Ahmed": "ڈاکٹر سعید احمد",
  "Nadia Pervaiz": "نادیہ پرویز",
  "Muhammad Saeed Khan": "محمد سعید خان",
  "Abdul Rehman Siddiqui": "عبدالرحمٰن صدیقی",
  "Fatima Zahra": "فاطمہ زہرا",
  "Ayesha Tariq": "عائشہ طارق",
  "Khalid Mahmood": "خالد محمود",
  "Saima Malik": "صائمہ ملک",
  "Imran Hassan Qureshi": "عمران حسن قریشی",
  "Nadia Raza": "نادیہ رضا",
  "Tariq Iqbal": "طارق اقبال",
  "Usman Awan": "عثمان اعوان",
  "Rashid Sheikh": "راشد شیخ",
};

export const KNOWN_EN_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(KNOWN_URDU_NAMES).map(([en, ur]) => [ur, en]),
);

export function isUrduScript(str: string): boolean {
  return /[\u0600-\u06FF]/.test(str);
}

export function getUserDisplayName(
  u?: { name?: string | null; nameUrdu?: string | null } | null,
  lang: "ur" | "en" = "en",
): string {
  if (!u) return "";
  const name = (typeof u.name === "string" ? u.name.trim() : "") || "";
  const nameUrdu = (typeof u.nameUrdu === "string" ? u.nameUrdu.trim() : "") || "";

  if (lang === "ur") {
    if (nameUrdu) return nameUrdu;
    if (name && KNOWN_URDU_NAMES[name]) return KNOWN_URDU_NAMES[name];
    return name;
  }

  // English mode
  if (name && !isUrduScript(name)) return name;
  if (name && KNOWN_EN_NAMES[name]) return KNOWN_EN_NAMES[name];
  if (nameUrdu && KNOWN_EN_NAMES[nameUrdu]) return KNOWN_EN_NAMES[nameUrdu];
  return name || nameUrdu;
}

export function getUserInitials(
  u?: { name?: string | null; nameUrdu?: string | null } | null,
  lang: "ur" | "en" = "en",
): string {
  const display = getUserDisplayName(u, lang);
  if (!display) return "—";
  return display.slice(0, 2);
}

export const ROLE_LABELS: Record<string, { en: string; ur: string }> = {
  super_admin: { en: "Super Admin", ur: "سپر ایڈمن" },
  admin: { en: "Admin", ur: "ایڈمن" },
  admission_admin: { en: "Admission Admin", ur: "داخلہ ایڈمن" },
  academic_admin: { en: "Academic Admin", ur: "تعلیمی ایڈمن" },
  finance_admin: { en: "Finance Admin", ur: "مالی ایڈمن" },
  hr_admin: { en: "HR Admin", ur: "ایچ آر ایڈمن" },
  reports_admin: { en: "Reports Admin", ur: "رپورٹس ایڈمن" },
  principal: { en: "Principal", ur: "پرنسپل" },
  hr_manager: { en: "HR Manager", ur: "ایچ آر منیجر" },
  accountant: { en: "Accountant", ur: "اکاؤنٹنٹ" },
  librarian: { en: "Librarian", ur: "لائبریرین" },
  receptionist: { en: "Receptionist", ur: "استقبالیہ" },
  teacher: { en: "Teacher", ur: "استاد" },
  staff: { en: "Staff", ur: "عملہ" },
  parent: { en: "Parent", ur: "والدین" },
  user: { en: "User", ur: "صارف" },
};

export const ACCESS_LABELS: Record<string, { en: string; ur: string }> = {
  school: { en: "School", ur: "اسکول" },
  madrassa: { en: "Madrassa", ur: "مدرسہ" },
  both: { en: "Both", ur: "دونوں" },
};

export const STATUS_LABELS: Record<string, { en: string; ur: string }> = {
  active: { en: "Active", ur: "فعال" },
  inactive: { en: "Inactive", ur: "غیر فعال" },
};

