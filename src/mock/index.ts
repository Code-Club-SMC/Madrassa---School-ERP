// Centralized mock data for MSMIS — all UI surfaces source from here.
// Replace with TanStack Query hooks when backend is ready.

export type System = "madrassa" | "school" | "both";
export type Gender = "male" | "female";
export type StudentStatus = "active" | "inactive" | "graduated" | "dropout" | "transferred";
export type UserRole = "super_admin" | "admin" | "teacher" | "parent";
export type UserStatus = "active" | "inactive";
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type MadrassaCategory = {
  id: string;
  name: string;
  nameUrdu: string;
  subcategories: Array<{ id: string; name: string; nameUrdu: string; rollPrefix: string; count: number }>;
};

export type Student = {
  id: string;
  rollNo: string;
  name: string;
  nameUrdu: string;
  gender: Gender;
  dob: string;
  address: string;
  system: System;
  categoryId?: string;
  subcategoryId?: string;
  classId?: string;
  section?: string;
  monthlyFee: number;
  status: StudentStatus;
  admissionDate: string;
  guardianName: string;
  guardianNameUrdu: string;
  guardianPhone: string;
  guardianCnic: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdBy: string;
  createdAt: string;
};

export type Application = {
  id: string;
  refNo: string;
  name: string;
  nameUrdu: string;
  system: System;
  categoryOrClass: string;
  phone: string;
  submittedAt: string;
  status: ApplicationStatus;
};

export type Teacher = {
  id: string;
  name: string;
  nameUrdu: string;
  subject: string;
  system: System;
  phone: string;
  joinedAt: string;
};

export type ActivityEvent = {
  id: string;
  type: "admission" | "fee" | "exam" | "attendance";
  title: string;
  titleUrdu: string;
  at: string;
};

export const madrassaCategories: MadrassaCategory[] = [
  {
    id: "hifz",
    name: "Hifz",
    nameUrdu: "حفظ",
    subcategories: [
      { id: "hifz-1", name: "Hifz Beginner", nameUrdu: "حفظ ابتدائی", rollPrefix: "HB", count: 48 },
      { id: "hifz-2", name: "Hifz Intermediate", nameUrdu: "حفظ درمیانی", rollPrefix: "HI", count: 36 },
      { id: "hifz-3", name: "Hifz Advanced", nameUrdu: "حفظ منتہی", rollPrefix: "HA", count: 22 },
    ],
  },
  {
    id: "nazira",
    name: "Nazira",
    nameUrdu: "ناظرہ",
    subcategories: [
      { id: "naz-1", name: "Qaida", nameUrdu: "قاعدہ", rollPrefix: "QD", count: 62 },
      { id: "naz-2", name: "Nazira Quran", nameUrdu: "ناظرہ قرآن", rollPrefix: "NZ", count: 84 },
    ],
  },
  {
    id: "alimiyat",
    name: "Alimiyat",
    nameUrdu: "عالمیہ",
    subcategories: [
      { id: "ali-1", name: "Year 1", nameUrdu: "درجہ اولیٰ", rollPrefix: "A1", count: 18 },
      { id: "ali-2", name: "Year 2", nameUrdu: "درجہ ثانیہ", rollPrefix: "A2", count: 14 },
    ],
  },
];

export const schoolClasses = [
  { id: "kg", name: "KG", nameUrdu: "نرسری" },
  { id: "c1", name: "Class 1", nameUrdu: "جماعت اول" },
  { id: "c2", name: "Class 2", nameUrdu: "جماعت دوم" },
  { id: "c3", name: "Class 3", nameUrdu: "جماعت سوم" },
  { id: "c4", name: "Class 4", nameUrdu: "جماعت چہارم" },
  { id: "c5", name: "Class 5", nameUrdu: "جماعت پنجم" },
];

const urduFirst = ["محمد", "احمد", "علی", "حسن", "حسین", "بلال", "اسامہ", "زید", "عمر", "ابراہیم", "فاطمہ", "عائشہ", "خدیجہ", "مریم", "زینب"];
const urduLast = ["خان", "رضا", "احمد", "اسلم", "حسین", "اقبال", "صدیقی", "ملک"];
const engNames = ["Muhammad Khan", "Ahmad Raza", "Ali Hassan", "Bilal Iqbal", "Usama Malik", "Zaid Siddiqui", "Fatima Aslam", "Ayesha Hussain", "Mariam Khan", "Zainab Raza"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export const students: Student[] = Array.from({ length: 48 }).map((_, i) => {
  const sys: System = i % 3 === 0 ? "school" : "madrassa";
  const gender: Gender = i % 4 === 0 ? "female" : "male";
  const cat = pick(madrassaCategories, i);
  const sub = pick(cat.subcategories, i);
  const cls = pick(schoolClasses, i);
  return {
    id: `S${1000 + i}`,
    rollNo: sys === "madrassa" ? `${sub.rollPrefix}-${(101 + i).toString().padStart(3, "0")}` : `SCH-${(2024000 + i)}`,
    name: pick(engNames, i),
    nameUrdu: `${pick(urduFirst, i)} ${pick(urduLast, i)}`,
    gender,
    dob: new Date(2010 + (i % 8), i % 12, (i % 27) + 1).toISOString(),
    address: `House #${i + 1}, Street ${(i % 20) + 1}, Lahore`,
    system: sys,
    categoryId: sys === "madrassa" ? cat.id : undefined,
    subcategoryId: sys === "madrassa" ? sub.id : undefined,
    classId: sys === "school" ? cls.id : undefined,
    section: sys === "school" ? (i % 2 ? "A" : "B") : undefined,
    monthlyFee: sys === "madrassa" ? 500 + (i % 4) * 250 : 2500 + (i % 4) * 500,
    status: i % 17 === 0 ? "graduated" : i % 23 === 0 ? "inactive" : "active",
    admissionDate: new Date(2023, i % 12, (i % 27) + 1).toISOString(),
    guardianName: `Father of ${pick(engNames, i)}`,
    guardianNameUrdu: `والد ${pick(urduFirst, i)}`,
    guardianPhone: `0300-${(1000000 + i * 1234).toString().slice(0, 7)}`,
    guardianCnic: `35202-${(1000000 + i * 4321).toString().slice(0, 7)}-${(i % 9) + 1}`,
  };
});

export const users: User[] = [
  { id: "u1", name: "Super Admin", email: "admin@msmis.pk", role: "super_admin", status: "active", createdBy: "system", createdAt: "2024-01-01" },
  { id: "u2", name: "Hafiz Bilal", email: "bilal@msmis.pk", role: "admin", status: "active", createdBy: "Super Admin", createdAt: "2024-03-12" },
  { id: "u3", name: "Ustad Imran", email: "imran@msmis.pk", role: "teacher", status: "active", createdBy: "Hafiz Bilal", createdAt: "2024-04-20" },
  { id: "u4", name: "Parent Iqbal", email: "iqbal@gmail.com", role: "parent", status: "active", createdBy: "Hafiz Bilal", createdAt: "2024-08-08" },
  { id: "u5", name: "Ustaad Saleem", email: "saleem@msmis.pk", role: "teacher", status: "inactive", createdBy: "Super Admin", createdAt: "2023-11-15" },
];

export const applications: Application[] = Array.from({ length: 14 }).map((_, i) => ({
  id: `A${i}`,
  refNo: `APP-${(2400 + i).toString()}`,
  name: pick(engNames, i + 3),
  nameUrdu: `${pick(urduFirst, i + 2)} ${pick(urduLast, i + 1)}`,
  system: pick(["madrassa", "school", "both"] as System[], i),
  categoryOrClass: i % 2 ? "حفظ ابتدائی" : "جماعت سوم",
  phone: `0301-${(1000000 + i * 9999).toString().slice(0, 7)}`,
  submittedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  status: i < 6 ? "pending" : i < 10 ? "accepted" : "rejected",
}));

export const teachers: Teacher[] = [
  { id: "T1", name: "Hafiz Bilal", nameUrdu: "حافظ بلال", subject: "Hifz", system: "madrassa", phone: "0300-1234567", joinedAt: "2022-04-01" },
  { id: "T2", name: "Maulana Imran", nameUrdu: "مولانا عمران", subject: "Alimiyat", system: "madrassa", phone: "0301-2345678", joinedAt: "2021-08-15" },
  { id: "T3", name: "Sir Adeel", nameUrdu: "سر عدیل", subject: "Mathematics", system: "school", phone: "0302-3456789", joinedAt: "2023-01-10" },
  { id: "T4", name: "Miss Ayesha", nameUrdu: "مس عائشہ", subject: "English", system: "school", phone: "0303-4567890", joinedAt: "2022-11-22" },
  { id: "T5", name: "Qari Saleem", nameUrdu: "قاری سلیم", subject: "Tajweed", system: "madrassa", phone: "0304-5678901", joinedAt: "2020-06-05" },
];

export const recentActivity: ActivityEvent[] = [
  { id: "e1", type: "admission", title: "New admission — Muhammad Khan", titleUrdu: "نیا داخلہ — محمد خان", at: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: "e2", type: "fee", title: "Fee received — PKR 4,500 from Bilal Iqbal", titleUrdu: "فیس وصول — PKR 4,500", at: new Date(Date.now() - 1000 * 60 * 48).toISOString() },
  { id: "e3", type: "attendance", title: "Attendance marked for Hifz Intermediate", titleUrdu: "حاضری مکمل — حفظ درمیانی", at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: "e4", type: "exam", title: "Mid-term results published — Class 4", titleUrdu: "نتائج جاری — جماعت چہارم", at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: "e5", type: "admission", title: "Application APP-2410 accepted", titleUrdu: "درخواست منظور — APP-2410", at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: "e6", type: "fee", title: "PKR 8,000 collected from Ayesha Hussain", titleUrdu: "فیس وصول — PKR 8,000", at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString() },
  { id: "e7", type: "attendance", title: "Daily attendance closed — School wing", titleUrdu: "روزانہ حاضری بند — اسکول", at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString() },
  { id: "e8", type: "admission", title: "New parent account created", titleUrdu: "نیا والدین اکاؤنٹ", at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

export const enrollmentTrend = Array.from({ length: 12 }).map((_, i) => {
  const m = new Date();
  m.setMonth(m.getMonth() - (11 - i));
  return {
    month: m.toLocaleString("en-US", { month: "short" }),
    madrassa: 240 + Math.round(Math.sin(i / 2) * 28 + i * 6),
    school: 180 + Math.round(Math.cos(i / 2) * 22 + i * 4),
  };
});

export const categoryDistribution = madrassaCategories.flatMap((c) =>
  c.subcategories.map((s) => ({ name: s.nameUrdu, value: s.count })),
);

export const sparkline = (seed: number) =>
  Array.from({ length: 7 }).map((_, i) => ({ x: i, y: 20 + Math.round(Math.sin(i + seed) * 8 + seed) }));

export const attendanceLast7 = Array.from({ length: 7 }).map((_, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  rate: 78 + ((i * 5 + 11) % 18),
}));

export const currentUser = {
  id: "u1",
  name: "Super Admin",
  email: "admin@msmis.pk",
  role: "super_admin" as UserRole,
  initials: "SA",
};

export const institution = {
  nameEnglish: "Jamia Anwar-ul-Quran",
  nameUrdu: "جامعہ انوار القرآن",
  motto: "علم نور ہے",
};