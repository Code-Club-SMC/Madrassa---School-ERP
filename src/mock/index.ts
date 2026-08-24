// Centralized mock data for MSMIS — all UI surfaces source from here.
// Replace with TanStack Query hooks when backend is ready.
import { madrassaCategories as sharedMadrassaCategories } from "@/mock/categories";
import { schoolClasses } from "@/mock/classes";

export { schoolClasses };

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
  subcategories: Array<{
    id: string;
    name: string;
    nameUrdu: string;
    rollPrefix: string;
    count: number;
  }>;
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

export const madrassaCategories: MadrassaCategory[] = sharedMadrassaCategories;

const urduFirst = [
  "محمد",
  "احمد",
  "علی",
  "حسن",
  "حسین",
  "بلال",
  "اسامہ",
  "زید",
  "عمر",
  "ابراہیم",
  "فاطمہ",
  "عائشہ",
  "خدیجہ",
  "مریم",
  "زینب",
];
const urduLast = ["خان", "رضا", "احمد", "اسلم", "حسین", "اقبال", "صدیقی", "ملک"];
const engNames = [
  "Muhammad Khan",
  "Ahmad Raza",
  "Ali Hassan",
  "Bilal Iqbal",
  "Usama Malik",
  "Zaid Siddiqui",
  "Fatima Aslam",
  "Ayesha Hussain",
  "Mariam Khan",
  "Zainab Raza",
];

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
    rollNo:
      sys === "madrassa"
        ? `${sub.rollPrefix}-${(101 + i).toString().padStart(3, "0")}`
        : `SCH-${2024000 + i}`,
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
  {
    id: "u1",
    name: "Super Admin",
    email: "admin@msmis.pk",
    role: "super_admin",
    status: "active",
    createdBy: "system",
    createdAt: "2024-01-01",
  },
  {
    id: "u2",
    name: "Hafiz Bilal",
    email: "bilal@msmis.pk",
    role: "admin",
    status: "active",
    createdBy: "Super Admin",
    createdAt: "2024-03-12",
  },
  {
    id: "u3",
    name: "Ustad Imran",
    email: "imran@msmis.pk",
    role: "teacher",
    status: "active",
    createdBy: "Hafiz Bilal",
    createdAt: "2024-04-20",
  },
  {
    id: "u4",
    name: "Parent Iqbal",
    email: "iqbal@gmail.com",
    role: "parent",
    status: "active",
    createdBy: "Hafiz Bilal",
    createdAt: "2024-08-08",
  },
  {
    id: "u5",
    name: "Ustaad Saleem",
    email: "saleem@msmis.pk",
    role: "teacher",
    status: "inactive",
    createdBy: "Super Admin",
    createdAt: "2023-11-15",
  },
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
  {
    id: "T1",
    name: "Hafiz Bilal",
    nameUrdu: "حافظ بلال",
    subject: "Hifz",
    system: "madrassa",
    phone: "0300-1234567",
    joinedAt: "2022-04-01",
  },
  {
    id: "T2",
    name: "Maulana Imran",
    nameUrdu: "مولانا عمران",
    subject: "Alimiyat",
    system: "madrassa",
    phone: "0301-2345678",
    joinedAt: "2021-08-15",
  },
  {
    id: "T3",
    name: "Sir Adeel",
    nameUrdu: "سر عدیل",
    subject: "Mathematics",
    system: "school",
    phone: "0302-3456789",
    joinedAt: "2023-01-10",
  },
  {
    id: "T4",
    name: "Miss Ayesha",
    nameUrdu: "مس عائشہ",
    subject: "English",
    system: "school",
    phone: "0303-4567890",
    joinedAt: "2022-11-22",
  },
  {
    id: "T5",
    name: "Qari Saleem",
    nameUrdu: "قاری سلیم",
    subject: "Tajweed",
    system: "madrassa",
    phone: "0304-5678901",
    joinedAt: "2020-06-05",
  },
];

export const recentActivity: ActivityEvent[] = [
  {
    id: "e1",
    type: "admission",
    title: "New admission — Muhammad Khan",
    titleUrdu: "نیا داخلہ — محمد خان",
    at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "e2",
    type: "fee",
    title: "Fee received — PKR 4,500 from Bilal Iqbal",
    titleUrdu: "فیس وصول — PKR 4,500",
    at: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
  },
  {
    id: "e3",
    type: "attendance",
    title: "Attendance marked for Hifz Intermediate",
    titleUrdu: "حاضری مکمل — حفظ درمیانی",
    at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "e4",
    type: "exam",
    title: "Mid-term results published — Class 4",
    titleUrdu: "نتائج جاری — جماعت چہارم",
    at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "e5",
    type: "admission",
    title: "Application APP-2410 accepted",
    titleUrdu: "درخواست منظور — APP-2410",
    at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "e6",
    type: "fee",
    title: "PKR 8,000 collected from Ayesha Hussain",
    titleUrdu: "فیس وصول — PKR 8,000",
    at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: "e7",
    type: "attendance",
    title: "Daily attendance closed — School wing",
    titleUrdu: "روزانہ حاضری بند — اسکول",
    at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "e8",
    type: "admission",
    title: "New parent account created",
    titleUrdu: "نیا والدین اکاؤنٹ",
    at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
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
  Array.from({ length: 7 }).map((_, i) => ({
    x: i,
    y: 20 + Math.round(Math.sin(i + seed) * 8 + seed),
  }));

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
  nameEnglish: "Jamia Qasimia Tando Pakistan",
  nameUrdu: "جامعہ قاسمیہ ٹنڈوپاکستان",
  motto: "علم نور ہے",
};

// ---------- Attendance ----------
export type AttendanceStatus = "present" | "absent" | "late";
export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
};

export function generateAttendance(studentId: string, days = 90): AttendanceRecord[] {
  const out: AttendanceRecord[] = [];
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() === 5) continue; // skip Fridays
    const r = Math.random();
    out.push({
      id: `att-${studentId}-${i}`,
      studentId,
      date: d.toISOString().slice(0, 10),
      status: r > 0.14 ? "present" : r > 0.07 ? "late" : "absent",
    });
  }
  return out;
}

// ---------- Fees ----------
export type FeeStatus = "paid" | "unpaid" | "partial" | "waived" | "overdue";
export type FeeRecord = {
  id: string;
  studentId: string;
  rollNo: string;
  nameUrdu: string;
  subgroup: string;
  monthlyFee: number;
  paidAmount: number;
  paidOn: string | null;
  month: string;
  status: FeeStatus;
};

export const feeRecords: FeeRecord[] = students.slice(0, 24).map((s, i) => {
  const paid = i % 7 === 0 ? 0 : i % 5 === 0 ? Math.round(s.monthlyFee / 2) : s.monthlyFee;
  const status: FeeStatus =
    paid === 0 ? (i % 3 === 0 ? "overdue" : "unpaid") : paid < s.monthlyFee ? "partial" : "paid";
  return {
    id: `fee-${s.id}`,
    studentId: s.id,
    rollNo: s.rollNo,
    nameUrdu: s.nameUrdu,
    subgroup: s.subcategoryId ?? s.classId ?? "—",
    monthlyFee: s.monthlyFee,
    paidAmount: paid,
    paidOn: paid > 0 ? new Date(Date.now() - i * 86400000).toISOString() : null,
    month: new Date().toISOString().slice(0, 7),
    status,
  };
});

// ---------- Exams ----------
export type ExamStatus = "upcoming" | "active" | "completed";
export type ExamSubject = {
  id: string;
  name: string;
  nameUrdu: string;
  totalMarks: number;
  passingMarks: number;
};
export type ExamSeries = {
  id: string;
  name: string;
  nameUrdu: string;
  type: "quarterly" | "midyear" | "annual";
  status: ExamStatus;
  startDate: string;
  endDate: string;
  subjects: ExamSubject[];
};

export const examSeries: ExamSeries[] = [
  {
    id: "exam-q1-2025",
    name: "Quarterly · Q1 2025",
    nameUrdu: "سہ ماہی امتحان",
    type: "quarterly",
    status: "completed",
    startDate: "2025-03-10",
    endDate: "2025-03-22",
    subjects: [
      { id: "sub-1", name: "Urdu", nameUrdu: "اردو", totalMarks: 100, passingMarks: 40 },
      { id: "sub-2", name: "English", nameUrdu: "انگریزی", totalMarks: 100, passingMarks: 40 },
      { id: "sub-3", name: "Mathematics", nameUrdu: "حساب", totalMarks: 100, passingMarks: 40 },
      { id: "sub-4", name: "Islamiyat", nameUrdu: "اسلامیات", totalMarks: 100, passingMarks: 40 },
      { id: "sub-5", name: "Science", nameUrdu: "سائنس", totalMarks: 100, passingMarks: 40 },
    ],
  },
  {
    id: "exam-mid-2025",
    name: "Mid-Year 2025",
    nameUrdu: "نیم سالہ امتحان",
    type: "midyear",
    status: "active",
    startDate: "2025-06-10",
    endDate: "2025-06-25",
    subjects: [
      { id: "sub-6", name: "Urdu", nameUrdu: "اردو", totalMarks: 100, passingMarks: 40 },
      { id: "sub-7", name: "English", nameUrdu: "انگریزی", totalMarks: 100, passingMarks: 40 },
      { id: "sub-8", name: "Mathematics", nameUrdu: "حساب", totalMarks: 100, passingMarks: 40 },
    ],
  },
  {
    id: "exam-annual-2025",
    name: "Annual 2025",
    nameUrdu: "سالانہ امتحان",
    type: "annual",
    status: "upcoming",
    startDate: "2025-12-01",
    endDate: "2025-12-18",
    subjects: [],
  },
];

export function generateResults(seriesId: string, schoolOnly = true) {
  const series = examSeries.find((s) => s.id === seriesId);
  if (!series || series.subjects.length === 0) return [];
  return students
    .filter((s) => (schoolOnly ? s.system === "school" : true))
    .slice(0, 18)
    .map((s, i) => {
      const marks = series.subjects.map((sub) =>
        Math.round(
          sub.passingMarks + Math.random() * (sub.totalMarks - sub.passingMarks - 5 + (i % 3) * 10),
        ),
      );
      const total = marks.reduce((a, b) => a + b, 0);
      const max = series.subjects.reduce((a, b) => a + b.totalMarks, 0);
      const pct = (total / max) * 100;
      const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "F";
      return { student: s, marks, total, max, pct, grade };
    });
}

// ---------- Finance ----------
export type FinanceType = "income" | "expense";
export type FinanceCategory = "fees" | "donation" | "charity" | "inventory" | "salary" | "misc";
export type FinanceRecord = {
  id: string;
  date: string;
  type: FinanceType;
  category: FinanceCategory;
  categoryUrdu: string;
  description: string;
  amount: number;
  source: string;
  system: System;
};

const financeCats: { c: FinanceCategory; u: string }[] = [
  { c: "fees", u: "فیس" },
  { c: "donation", u: "عطیہ" },
  { c: "charity", u: "صدقات" },
  { c: "inventory", u: "سامان" },
  { c: "salary", u: "تنخواہ" },
  { c: "misc", u: "متفرق" },
];

export const financeRecords: FinanceRecord[] = Array.from({ length: 32 }).map((_, i) => {
  const isIncome = i % 3 !== 0;
  const cat = financeCats[i % financeCats.length];
  const system: System = i % 3 === 0 ? "school" : i % 3 === 1 ? "madrassa" : "both";
  return {
    id: `fin-${i}`,
    date: new Date(Date.now() - i * 86400000 * 3).toISOString().slice(0, 10),
    type: isIncome ? "income" : "expense",
    category: cat.c,
    categoryUrdu: cat.u,
    description: isIncome
      ? "Monthly collection / donation received"
      : "Operating expense / inventory purchase",
    amount: isIncome ? 15000 + (i % 6) * 5000 : 4000 + (i % 5) * 2500,
    source: isIncome ? (i % 2 ? "Fee Module" : "Donation") : "Vendor",
    system,
  };
});

export const incomeVsExpense = Array.from({ length: 12 }).map((_, i) => {
  const m = new Date();
  m.setMonth(m.getMonth() - (11 - i));
  return {
    month: m.toLocaleString("en-US", { month: "short" }),
    income: 85000 + Math.round(Math.sin(i) * 15000 + i * 3000),
    expense: 60000 + Math.round(Math.cos(i) * 12000 + i * 1500),
    schoolIncome: 50000 + Math.round(Math.sin(i) * 9000 + i * 1800),
    madrassaIncome: 35000 + Math.round(Math.sin(i + 1) * 7000 + i * 1100),
    schoolExpense: 36000 + Math.round(Math.cos(i) * 7000 + i * 900),
    madrassaExpense: 24000 + Math.round(Math.cos(i + 1) * 5000 + i * 650),
  };
});

// ---------- Inventory ----------
export type InventoryItem = {
  id: string;
  name: string;
  nameUrdu: string;
  category: string;
  quantity: number;
  unit: string;
  type: "purchased" | "donated" | "gift";
  value: number;
  lowStockThreshold: number;
};

export const inventoryItems: InventoryItem[] = [
  {
    id: "inv-1",
    name: "Quran (Hardcover)",
    nameUrdu: "قرآن مجید",
    category: "Books",
    quantity: 18,
    unit: "copies",
    type: "donated",
    value: 12000,
    lowStockThreshold: 20,
  },
  {
    id: "inv-2",
    name: "Notebooks",
    nameUrdu: "کاپیاں",
    category: "Stationery",
    quantity: 240,
    unit: "pcs",
    type: "purchased",
    value: 24000,
    lowStockThreshold: 100,
  },
  {
    id: "inv-3",
    name: "Pens (Blue)",
    nameUrdu: "نیلے قلم",
    category: "Stationery",
    quantity: 8,
    unit: "boxes",
    type: "purchased",
    value: 4800,
    lowStockThreshold: 10,
  },
  {
    id: "inv-4",
    name: "Prayer Mats",
    nameUrdu: "جانمازیں",
    category: "Mosque",
    quantity: 65,
    unit: "pcs",
    type: "donated",
    value: 32500,
    lowStockThreshold: 30,
  },
  {
    id: "inv-5",
    name: "White Boards",
    nameUrdu: "وائٹ بورڈ",
    category: "Classroom",
    quantity: 12,
    unit: "pcs",
    type: "purchased",
    value: 18000,
    lowStockThreshold: 5,
  },
  {
    id: "inv-6",
    name: "Markers",
    nameUrdu: "مارکر",
    category: "Stationery",
    quantity: 4,
    unit: "boxes",
    type: "gift",
    value: 1600,
    lowStockThreshold: 6,
  },
  {
    id: "inv-7",
    name: "Tasbeeh",
    nameUrdu: "تسبیح",
    category: "Mosque",
    quantity: 180,
    unit: "pcs",
    type: "donated",
    value: 9000,
    lowStockThreshold: 50,
  },
  {
    id: "inv-8",
    name: "Sport Equipment",
    nameUrdu: "کھیلوں کا سامان",
    category: "Sports",
    quantity: 22,
    unit: "sets",
    type: "purchased",
    value: 44000,
    lowStockThreshold: 10,
  },
];

// ---------- Announcements ----------
export type Announcement = {
  id: string;
  title: string;
  titleUrdu: string;
  body: string;
  bodyUrdu: string;
  date: string;
  audience: "all" | "parents" | "teachers";
};

export const announcements: Announcement[] = [
  {
    id: "n1",
    title: "Eid Holidays Notice",
    titleUrdu: "عید کی چھٹیوں کا اعلان",
    body: "Institution will remain closed from 1st to 5th Shawwal.",
    bodyUrdu: "ادارہ یکم تا 5 شوال بند رہے گا۔",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    audience: "all",
  },
  {
    id: "n2",
    title: "Mid-Year Exam Schedule",
    titleUrdu: "نیم سالہ امتحان کا شیڈول",
    body: "Mid-year examinations begin on 10th June. Datesheet attached.",
    bodyUrdu: "نیم سالہ امتحانات 10 جون سے شروع ہوں گے۔",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    audience: "parents",
  },
  {
    id: "n3",
    title: "Parent–Teacher Meeting",
    titleUrdu: "والدین اور اساتذہ کی نشست",
    body: "PTM scheduled for Saturday 11 AM in the main hall.",
    bodyUrdu: "ہفتہ کے دن صبح 11 بجے مین ہال میں۔",
    date: new Date(Date.now() - 86400000 * 8).toISOString(),
    audience: "parents",
  },
  {
    id: "n4",
    title: "Donation Drive",
    titleUrdu: "عطیات کی مہم",
    body: "Help us furnish the new Hifz wing.",
    bodyUrdu: "نئے حفظ ونگ کی تکمیل میں ہمارا ساتھ دیں۔",
    date: new Date(Date.now() - 86400000 * 12).toISOString(),
    audience: "all",
  },
];

// ---------- Parents / Children link ----------
export const mockChildren = students.slice(0, 3);
