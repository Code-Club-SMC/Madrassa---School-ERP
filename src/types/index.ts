// Centralized type definitions for MSMIS.
// Per brief: use `type` (not `interface`). All money fields are in PAISA (PKR × 100).

export type System = "madrassa" | "school" | "both";
export type Gender = "male" | "female";
export type Section = "baneen" | "banat"; // بنین / بنات

export type StudentStatus =
  | "active"
  | "inactive"
  | "graduated"
  | "dropout"
  | "transferred"
  | "promoted"
  | "demoted";

export type UserRole = "super_admin" | "admin" | "teacher" | "parent";
export type UserStatus = "active" | "inactive";
export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type AttendanceStatus = "present" | "absent" | "late" | "leave";
export type FeeStatus = "paid" | "unpaid" | "partial" | "waived" | "overdue";

// ---------- Madrassa categories (Wifaq-aligned tree per §41.4) ----------
export type MadrassaTrack =
  | "qaida_nazira"
  | "hifz"
  | "tajweed"
  | "dars_nizami"
  | "takhassus";

export type Darja =
  | "idadiya"
  | "awwal"
  | "daum"
  | "soyam"
  | "sanawiyya_amma"
  | "sanawiyya_khasa"
  | "aliyah"
  | "alimiyyah";

export type MadrassaSubcategory = {
  id: string;
  name: string;
  nameUrdu: string;
  rollPrefix: string;
  count: number;
  darja?: Darja;
  govtEquivalent?: string;
  durationYears?: number;
};

export type MadrassaCategory = {
  id: MadrassaTrack;
  name: string;
  nameUrdu: string;
  description: string;
  descriptionUrdu: string;
  subcategories: MadrassaSubcategory[];
};

// ---------- School classes & sections ----------
export type SchoolClass = {
  id: string;
  name: string;
  nameUrdu: string;
  level: "pre_primary" | "primary" | "middle" | "secondary" | "higher_secondary";
  govtEquivalent?: string;
  sections: Array<{ id: string; name: string; group?: "science" | "arts" | "commerce" }>;
};

// ---------- Subject ----------
export type Subject = {
  id: string;
  name: string;
  nameUrdu: string;
  system: System;
  totalMarks: number;
  passingMarks: number;
  classIds?: string[]; // school
  darjat?: Darja[]; // madrassa
};

// ---------- Student ----------
export type Student = {
  id: string;
  rollNo: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  fatherNameUrdu: string;
  gender: Gender;
  institutionSection: Section; // baneen / banat
  dob: string;
  cnicBForm?: string;
  address: string;
  city: string;
  system: System;
  // Madrassa
  categoryId?: MadrassaTrack;
  subcategoryId?: string;
  darja?: Darja;
  wifaqRollNumber?: string;
  ilhaqNumber?: string;
  // Hifz-specific
  hifzJuzCompleted?: number;
  hifzStartedAt?: string;
  // School
  classId?: string;
  section?: string; // A / B / C
  group?: "science" | "arts" | "commerce";
  // Money (paisa)
  monthlyFeePaisa: number;
  concessionPaisa?: number;
  // Lifecycle
  status: StudentStatus;
  admissionDate: string;
  guardianName: string;
  guardianNameUrdu: string;
  guardianPhone: string;
  guardianCnic: string;
  guardianRelation: "father" | "mother" | "uncle" | "brother" | "other";
  // Photo (mock)
  photoUrl?: string;
  // Siblings (links)
  siblingIds?: string[];
};

// ---------- Hifz tracking ----------
export type JuzStatus = "not_started" | "in_progress" | "completed";
export type JuzQuality = "mumtaz" | "achcha" | "theek" | "kamzor"; // ممتاز / اچھا / ٹھیک / کمزور
export type JuzProgress = {
  juzNumber: number; // 1..30
  surahStartName: string;
  surahStartNameUrdu: string;
  status: JuzStatus;
  completedAt?: string;
  lastRevisionAt?: string;
  notes?: string;
};
export type HifzRevision = {
  id: string;
  studentId: string;
  date: string;
  juzNumber: number;
  pages: number;
  quality: JuzQuality;
  teacherId: string;
  notes?: string;
};

// ---------- Attendance ----------
export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
};

// ---------- Fees ----------
export type FeeRecord = {
  id: string;
  studentId: string;
  rollNo: string;
  nameUrdu: string;
  subgroup: string;
  monthlyFeePaisa: number;
  paidAmountPaisa: number;
  concessionPaisa: number;
  paidOn: string | null;
  month: string;
  status: FeeStatus;
  receiptNo?: string;
};

export type Concession = {
  id: string;
  studentId: string;
  reason: "orphan" | "hardship" | "merit" | "sibling" | "staff_child" | "other";
  reasonUrdu: string;
  percent: number; // 0..100
  amountPaisa: number;
  approvedBy: string;
  startedAt: string;
  active: boolean;
};

// ---------- Exams ----------
export type SchoolExamType = "monthly" | "quarterly" | "midterm" | "annual" | "board";
export type MadrassaExamType = "sah_mahi" | "nisfus_sana" | "salanah" | "wifaqi_salanah" | "zimni";
export type ExamStatus = "upcoming" | "active" | "completed";

export type ExamSubjectRef = {
  subjectId: string;
  totalMarks: number;
  passingMarks: number;
  scheduledOn: string;
};

export type SchoolExam = {
  id: string;
  name: string;
  nameUrdu: string;
  type: SchoolExamType;
  status: ExamStatus;
  startDate: string;
  endDate: string;
  classIds: string[];
  subjects: ExamSubjectRef[];
};

export type MadrassaExam = {
  id: string;
  name: string;
  nameUrdu: string;
  type: MadrassaExamType;
  status: ExamStatus;
  startDate: string;
  endDate: string;
  darjat: Darja[];
  isBoard: boolean;
  subjects: ExamSubjectRef[];
};

export type ExamResult = {
  id: string;
  examId: string;
  studentId: string;
  marks: Array<{ subjectId: string; obtained: number; total: number }>;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: PakistaniGrade;
  position?: number;
  remarks?: string;
};

// Pakistani grading system (§42.6)
export type PakistaniGrade = "A1" | "A" | "B" | "C" | "D" | "E" | "F";

// ---------- Applications ----------
export type Application = {
  id: string;
  refNo: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  fatherNameUrdu: string;
  gender: Gender;
  dob: string;
  system: System;
  preferredCategory: string;
  preferredCategoryUrdu: string;
  phone: string;
  city: string;
  submittedAt: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  assignedRollNo?: string;
};

// ---------- Teachers ----------
export type TeacherDesignation =
  | "qari"
  | "hafiz"
  | "mudarris"
  | "ustaad"
  | "principal"
  | "subject_teacher"
  | "sports"
  | "assistant";

export type Teacher = {
  id: string;
  name: string;
  nameUrdu: string;
  designation: TeacherDesignation;
  qualification: string;
  qualificationUrdu: string;
  subjects: string[]; // subject IDs
  system: System;
  phone: string;
  cnic: string;
  address: string;
  joinedAt: string;
  monthlySalaryPaisa: number;
  bankName?: string;
  bankAccount?: string;
  active: boolean;
  photoUrl?: string;
};

export type SalarySlip = {
  id: string;
  teacherId: string;
  month: string; // YYYY-MM
  baseSalaryPaisa: number;
  allowancesPaisa: number;
  deductionsPaisa: number;
  netPaisa: number;
  paidOn?: string;
  paymentMethod: "cash" | "bank";
};

// ---------- Inventory ----------
export type InventoryItem = {
  id: string;
  name: string;
  nameUrdu: string;
  category: string;
  quantity: number;
  unit: string;
  type: "purchased" | "donated" | "gift";
  valuePaisa: number;
  lowStockThreshold: number;
  updatedAt: string;
};

export type StockMovement = {
  id: string;
  itemId: string;
  date: string;
  change: number; // +in / -out
  reason: "purchase" | "donation" | "distribution" | "graduation_gift" | "loss" | "adjustment";
  note?: string;
};

// ---------- Finance ----------
export type FinanceType = "income" | "expense";
export type FinanceCategory = "fees" | "donation" | "charity" | "zakat" | "inventory" | "salary" | "utilities" | "misc";
export type FinanceRecord = {
  id: string;
  date: string;
  type: FinanceType;
  category: FinanceCategory;
  categoryUrdu: string;
  description: string;
  amountPaisa: number;
  source: string;
};

// ---------- Users ----------
export type User = {
  id: string;
  name: string;
  nameUrdu?: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  linkedStudentIds?: string[];
  linkedTeacherId?: string;
  createdBy: string;
  createdAt: string;
  lastLoginAt?: string;
};

// ---------- Announcements ----------
export type Announcement = {
  id: string;
  title: string;
  titleUrdu: string;
  body: string;
  bodyUrdu: string;
  date: string;
  audience: "all" | "parents" | "teachers" | "public_website";
  showOnWebsite: boolean;
};

// ---------- Holidays & academic year ----------
export type Holiday = {
  id: string;
  date: string;
  nameEnglish: string;
  nameUrdu: string;
  type: "national" | "religious" | "institutional";
  recurring: boolean;
};
export type AcademicYear = {
  id: string;
  name: string; // e.g. "2024-25"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  termCount: number;
};

// ---------- Timetable ----------
export type TimetablePeriod = {
  id: string;
  classId: string;
  section: string;
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
  startTime: string; // HH:mm
  endTime: string;
  subjectId: string;
  teacherId: string;
  room?: string;
};

// ---------- Audit ----------
export type AuditEntry = {
  id: string;
  at: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
};

// ---------- Activity feed (dashboard) ----------
export type ActivityEvent = {
  id: string;
  type: "admission" | "fee" | "exam" | "attendance" | "inventory" | "finance";
  title: string;
  titleUrdu: string;
  at: string;
};