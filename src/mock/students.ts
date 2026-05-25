import type { Darja, Gender, Section, Student, StudentStatus, System } from "@/types";
import { madrassaCategories, allSubcategories } from "@/mock/categories";
import { schoolClasses } from "@/mock/classes";

// 20 hand-curated Pakistani students spanning Madrassa tracks + School grades.
// Money is stored as PAISA (×100).

type Seed = {
  id: string;
  rollNo: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  fatherNameUrdu: string;
  gender: Gender;
  institutionSection: Section;
  dob: string;
  city: string;
  system: System;
  categoryId?: ReturnType<typeof inferCategoryId>;
  subcategoryId?: string;
  darja?: Darja;
  hifzJuzCompleted?: number;
  hifzStartedAt?: string;
  wifaqRollNumber?: string;
  ilhaqNumber?: string;
  classId?: string;
  section?: string;
  group?: "science" | "arts" | "commerce";
  monthlyFeeRupees: number;
  status: StudentStatus;
  admissionDate: string;
  guardianPhone: string;
  guardianCnic: string;
  guardianRelation: Student["guardianRelation"];
  siblingIds?: string[];
};

function inferCategoryId(): Student["categoryId"] {
  return undefined;
}

const seeds: Seed[] = [
  { id: "S1000", rollNo: "HB-101", name: "Muhammad Hamza Khan", nameUrdu: "محمد حمزہ خان", fatherName: "Iqbal Hussain", fatherNameUrdu: "اقبال حسین", gender: "male", institutionSection: "baneen", dob: "2014-05-12", city: "Lahore", system: "madrassa", categoryId: "hifz", subcategoryId: "hifz-beginner", hifzJuzCompleted: 6, hifzStartedAt: "2024-02-01", monthlyFeeRupees: 1500, status: "active", admissionDate: "2024-01-20", guardianPhone: "0300-4561234", guardianCnic: "35202-1234567-1", guardianRelation: "father", siblingIds: ["S1003"] },
  { id: "S1001", rollNo: "HI-201", name: "Ahmad Raza Siddiqui", nameUrdu: "احمد رضا صدیقی", fatherName: "Tariq Siddiqui", fatherNameUrdu: "طارق صدیقی", gender: "male", institutionSection: "baneen", dob: "2012-08-30", city: "Karachi", system: "madrassa", categoryId: "hifz", subcategoryId: "hifz-mid", hifzJuzCompleted: 18, hifzStartedAt: "2023-03-15", monthlyFeeRupees: 1500, status: "active", admissionDate: "2023-03-10", guardianPhone: "0321-9988776", guardianCnic: "42201-9988776-5", guardianRelation: "father" },
  { id: "S1002", rollNo: "HA-301", name: "Bilal Ahmad", nameUrdu: "بلال احمد", fatherName: "Sajjad Ahmad", fatherNameUrdu: "سجاد احمد", gender: "male", institutionSection: "baneen", dob: "2010-11-04", city: "Faisalabad", system: "madrassa", categoryId: "hifz", subcategoryId: "hifz-advanced", hifzJuzCompleted: 27, hifzStartedAt: "2021-09-10", monthlyFeeRupees: 1200, status: "active", admissionDate: "2021-09-01", guardianPhone: "0333-5544332", guardianCnic: "33100-5544332-7", guardianRelation: "father" },
  { id: "S1003", rollNo: "QD-105", name: "Maryam Iqbal", nameUrdu: "مریم اقبال", fatherName: "Iqbal Hussain", fatherNameUrdu: "اقبال حسین", gender: "female", institutionSection: "banat", dob: "2017-02-18", city: "Lahore", system: "madrassa", categoryId: "qaida_nazira", subcategoryId: "qn-qaida", monthlyFeeRupees: 800, status: "active", admissionDate: "2024-09-01", guardianPhone: "0300-4561234", guardianCnic: "35202-1234567-1", guardianRelation: "father", siblingIds: ["S1000"] },
  { id: "S1004", rollNo: "NZ2-118", name: "Aisha Tariq", nameUrdu: "عائشہ طارق", fatherName: "Tariq Mehmood", fatherNameUrdu: "طارق محمود", gender: "female", institutionSection: "banat", dob: "2013-07-21", city: "Lahore", system: "madrassa", categoryId: "qaida_nazira", subcategoryId: "qn-nazira-2", monthlyFeeRupees: 1000, status: "active", admissionDate: "2023-02-12", guardianPhone: "0301-7766554", guardianCnic: "35202-7766554-3", guardianRelation: "father" },
  { id: "S1005", rollNo: "DN0-012", name: "Usama Aslam", nameUrdu: "اسامہ اسلم", fatherName: "Muhammad Aslam", fatherNameUrdu: "محمد اسلم", gender: "male", institutionSection: "baneen", dob: "2011-04-08", city: "Multan", system: "madrassa", categoryId: "dars_nizami", subcategoryId: "dn-idadiya", darja: "idadiya", monthlyFeeRupees: 2000, status: "active", admissionDate: "2022-08-15", guardianPhone: "0312-1122334", guardianCnic: "36302-1122334-9", guardianRelation: "father" },
  { id: "S1006", rollNo: "DN3-007", name: "Hamid Mehmood", nameUrdu: "حامد محمود", fatherName: "Naseer Mehmood", fatherNameUrdu: "نصیر محمود", gender: "male", institutionSection: "baneen", dob: "2007-12-15", city: "Rawalpindi", system: "madrassa", categoryId: "dars_nizami", subcategoryId: "dn-soyam", darja: "soyam", wifaqRollNumber: "WMA-2024-44512", ilhaqNumber: "IL-784221", monthlyFeeRupees: 2500, status: "active", admissionDate: "2019-04-01", guardianPhone: "0345-2233445", guardianCnic: "37405-2233445-2", guardianRelation: "father" },
  { id: "S1007", rollNo: "DN4-005", name: "Zain ul Abideen", nameUrdu: "زین العابدین", fatherName: "Habib ur Rahman", fatherNameUrdu: "حبیب الرحمن", gender: "male", institutionSection: "baneen", dob: "2006-06-25", city: "Lahore", system: "madrassa", categoryId: "dars_nizami", subcategoryId: "dn-aamma", darja: "sanawiyya_amma", wifaqRollNumber: "WMA-2024-44621", ilhaqNumber: "IL-784221", monthlyFeeRupees: 3000, status: "active", admissionDate: "2018-03-15", guardianPhone: "0301-3344556", guardianCnic: "35202-3344556-1", guardianRelation: "father" },
  { id: "S1008", rollNo: "DN7-002", name: "Mufti Abdul Wahab", nameUrdu: "مفتی عبدالوہاب", fatherName: "Abdul Sattar", fatherNameUrdu: "عبدالستار", gender: "male", institutionSection: "baneen", dob: "2002-09-10", city: "Lahore", system: "madrassa", categoryId: "dars_nizami", subcategoryId: "dn-alimiyya", darja: "alimiyyah", wifaqRollNumber: "WMA-2024-49001", ilhaqNumber: "IL-784221", monthlyFeeRupees: 0, status: "active", admissionDate: "2014-04-01", guardianPhone: "0300-7788990", guardianCnic: "35202-7788990-3", guardianRelation: "father" },
  { id: "S1009", rollNo: "TI-001", name: "Mufti Hassan Ali", nameUrdu: "مفتی حسن علی", fatherName: "Ali Akbar", fatherNameUrdu: "علی اکبر", gender: "male", institutionSection: "baneen", dob: "2000-01-22", city: "Karachi", system: "madrassa", categoryId: "takhassus", subcategoryId: "tk-ifta", monthlyFeeRupees: 0, status: "active", admissionDate: "2023-04-01", guardianPhone: "0321-1199887", guardianCnic: "42201-1199887-7", guardianRelation: "father" },
  // ---------- School ----------
  { id: "S1010", rollNo: "SCH-2024-001", name: "Aliyan Khan", nameUrdu: "علیان خان", fatherName: "Naveed Khan", fatherNameUrdu: "نوید خان", gender: "male", institutionSection: "baneen", dob: "2017-03-14", city: "Lahore", system: "school", classId: "c1", section: "A", monthlyFeeRupees: 4500, status: "active", admissionDate: "2024-04-01", guardianPhone: "0300-1212121", guardianCnic: "35202-1212121-1", guardianRelation: "father" },
  { id: "S1011", rollNo: "SCH-2024-002", name: "Fatima Khan", nameUrdu: "فاطمہ خان", fatherName: "Naveed Khan", fatherNameUrdu: "نوید خان", gender: "female", institutionSection: "banat", dob: "2015-08-21", city: "Lahore", system: "school", classId: "c3", section: "A", monthlyFeeRupees: 4500, status: "active", admissionDate: "2022-04-01", guardianPhone: "0300-1212121", guardianCnic: "35202-1212121-1", guardianRelation: "father", siblingIds: ["S1010"] },
  { id: "S1012", rollNo: "SCH-2024-003", name: "Sajid Hussain", nameUrdu: "ساجد حسین", fatherName: "Liaqat Hussain", fatherNameUrdu: "لیاقت حسین", gender: "male", institutionSection: "baneen", dob: "2013-11-09", city: "Sialkot", system: "school", classId: "c5", section: "B", monthlyFeeRupees: 5000, status: "active", admissionDate: "2020-04-01", guardianPhone: "0322-3344556", guardianCnic: "34603-3344556-7", guardianRelation: "father" },
  { id: "S1013", rollNo: "SCH-2023-018", name: "Hassan Mehmood", nameUrdu: "حسن محمود", fatherName: "Tariq Mehmood", fatherNameUrdu: "طارق محمود", gender: "male", institutionSection: "baneen", dob: "2011-06-30", city: "Lahore", system: "school", classId: "c7", section: "A", monthlyFeeRupees: 5500, status: "active", admissionDate: "2018-04-01", guardianPhone: "0301-7766554", guardianCnic: "35202-7766554-3", guardianRelation: "father" },
  { id: "S1014", rollNo: "SCH-2023-021", name: "Hira Aslam", nameUrdu: "حرا اسلم", fatherName: "Muhammad Aslam", fatherNameUrdu: "محمد اسلم", gender: "female", institutionSection: "banat", dob: "2010-02-14", city: "Multan", system: "school", classId: "c8", section: "B", monthlyFeeRupees: 5500, status: "active", admissionDate: "2017-04-01", guardianPhone: "0312-1122334", guardianCnic: "36302-1122334-9", guardianRelation: "father", siblingIds: ["S1005"] },
  { id: "S1015", rollNo: "SCH-2022-009", name: "Umar Farooq", nameUrdu: "عمر فاروق", fatherName: "Farooq Akhtar", fatherNameUrdu: "فاروق اختر", gender: "male", institutionSection: "baneen", dob: "2009-10-05", city: "Rawalpindi", system: "school", classId: "c9", section: "Science", group: "science", monthlyFeeRupees: 7000, status: "active", admissionDate: "2016-04-01", guardianPhone: "0345-4455667", guardianCnic: "37405-4455667-2", guardianRelation: "father" },
  { id: "S1016", rollNo: "SCH-2022-014", name: "Mahnoor Ali", nameUrdu: "ماہ نور علی", fatherName: "Ali Shahzad", fatherNameUrdu: "علی شہزاد", gender: "female", institutionSection: "banat", dob: "2008-04-19", city: "Lahore", system: "school", classId: "c10", section: "Arts", group: "arts", monthlyFeeRupees: 7000, status: "active", admissionDate: "2015-04-01", guardianPhone: "0303-5566778", guardianCnic: "35202-5566778-8", guardianRelation: "father" },
  { id: "S1017", rollNo: "SCH-2021-003", name: "Ibrahim Rasheed", nameUrdu: "ابراہیم رشید", fatherName: "Rasheed Anwar", fatherNameUrdu: "رشید انور", gender: "male", institutionSection: "baneen", dob: "2007-01-28", city: "Lahore", system: "school", classId: "c11", section: "Pre-Engineering", group: "science", monthlyFeeRupees: 9000, status: "active", admissionDate: "2014-04-01", guardianPhone: "0301-8899001", guardianCnic: "35202-8899001-4", guardianRelation: "father" },
  { id: "S1018", rollNo: "SCH-2020-005", name: "Zainab Akbar", nameUrdu: "زینب اکبر", fatherName: "Akbar Ali", fatherNameUrdu: "اکبر علی", gender: "female", institutionSection: "banat", dob: "2006-07-11", city: "Karachi", system: "school", classId: "c12", section: "Pre-Medical", group: "science", monthlyFeeRupees: 9000, status: "active", admissionDate: "2013-04-01", guardianPhone: "0321-2233445", guardianCnic: "42201-2233445-9", guardianRelation: "father" },
  { id: "S1019", rollNo: "SCH-2019-001", name: "Abdul Rehman", nameUrdu: "عبدالرحمن", fatherName: "Hidayatullah", fatherNameUrdu: "ہدایت اللہ", gender: "male", institutionSection: "baneen", dob: "2005-12-02", city: "Lahore", system: "school", classId: "c10", section: "Science", group: "science", monthlyFeeRupees: 7000, status: "graduated", admissionDate: "2012-04-01", guardianPhone: "0300-9988776", guardianCnic: "35202-9988776-2", guardianRelation: "father" },
];

function findCategory(id?: Student["categoryId"]) {
  return madrassaCategories.find((c) => c.id === id);
}
function findSubcat(id?: string) {
  return allSubcategories.find((s) => s.id === id);
}

export const students: Student[] = seeds.map((s) => ({
  id: s.id,
  rollNo: s.rollNo,
  name: s.name,
  nameUrdu: s.nameUrdu,
  fatherName: s.fatherName,
  fatherNameUrdu: s.fatherNameUrdu,
  gender: s.gender,
  institutionSection: s.institutionSection,
  dob: new Date(s.dob).toISOString(),
  cnicBForm: undefined,
  address: `House #${s.id.slice(-3)}, ${s.city}`,
  city: s.city,
  system: s.system,
  categoryId: s.categoryId,
  subcategoryId: s.subcategoryId,
  darja: s.darja,
  wifaqRollNumber: s.wifaqRollNumber,
  ilhaqNumber: s.ilhaqNumber,
  hifzJuzCompleted: s.hifzJuzCompleted,
  hifzStartedAt: s.hifzStartedAt ? new Date(s.hifzStartedAt).toISOString() : undefined,
  classId: s.classId,
  section: s.section,
  group: s.group,
  monthlyFeePaisa: s.monthlyFeeRupees * 100,
  status: s.status,
  admissionDate: new Date(s.admissionDate).toISOString(),
  guardianName: s.fatherName,
  guardianNameUrdu: s.fatherNameUrdu,
  guardianPhone: s.guardianPhone,
  guardianCnic: s.guardianCnic,
  guardianRelation: s.guardianRelation,
  siblingIds: s.siblingIds,
}));

export const studentsById = Object.fromEntries(students.map((s) => [s.id, s]));

/** Convenience: students filtered by active system. */
export function studentsForSystem(system: "madrassa" | "school") {
  return students.filter((s) => s.system === system || s.system === "both");
}

/** Useful for displays: get the category + subcategory of a Madrassa student. */
export function studentMadrassaPath(s: Student) {
  if (s.system !== "madrassa") return null;
  const cat = findCategory(s.categoryId);
  const sub = findSubcat(s.subcategoryId);
  return cat && sub ? { cat, sub } : null;
}

/** Useful for displays: get the class + section of a school student. */
export function studentSchoolPath(s: Student) {
  if (s.system !== "school") return null;
  const cls = schoolClasses.find((c) => c.id === s.classId);
  return cls ? { cls, section: s.section ?? "—" } : null;
}