export type TeacherSystemScope = "school" | "madrassa" | "both" | "all" | "qasmia-both" | "qasmia-madrassa" | "qasmia-school" | "zainab-both" | "zainab-madrassa" | "zainab-school";
export type TeacherSystem = "school" | "madrassa";
export type TeacherEmploymentStatus = "active" | "inactive";
export type TeacherPaymentMethod = "cash" | "bank";

export type TeacherListItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  nameUrdu: string | null;
  phone: string | null;
  cnic: string | null;
  systemScope: TeacherSystemScope;
  designation: string;
  qualification: string | null;
  joinedAt: string;
  employmentStatus: TeacherEmploymentStatus;
  baseMonthlySalaryPaisa: number;
};

export type TeacherCredentials = {
  nameUrdu: string;
  nameEnglish: string;
  email: string;
  role: "teacher";
  password: string;
};

export type TeacherAssignment = {
  id: string;
  system: TeacherSystem;
  institutionId: string;
  programId: string;
  schoolClassId: string | null;
  schoolSectionId: string | null;
  madrassaCategoryId: string | null;
  madrassaSubcategoryId: string | null;
  subjectId: string | null;
  academicYear: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  active: boolean;
};

export type TeacherTimetablePeriod = Omit<TeacherAssignment, "id"> & {
  id: string;
  assignmentId: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string | null;
};

export type TeacherProfile = {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  nameUrdu?: string | null;
  phone?: string | null;
  cnic?: string | null;
  systemScope: TeacherSystemScope;
  gender: string | null;
  designation: string;
  qualification: string | null;
  qualificationUrdu: string | null;
  address: string | null;
  joinedAt: string;
  employmentStatus: TeacherEmploymentStatus;
  baseMonthlySalaryPaisa: number;
  bankName: string | null;
  bankAccount: string | null;
  paymentMethod: TeacherPaymentMethod;
  salaryEffectiveDate: string | null;
  salaryNotes: string | null;
  notes: string | null;
};

export type TeacherAccount = {
  id: string;
  name: string;
  email: string;
  nameUrdu?: string | null;
  phone?: string | null;
  cnic?: string | null;
  status: string | null;
  banned: boolean | null;
};

export type TeacherDetail = {
  profile: TeacherProfile;
  account: TeacherAccount;
  assignments: TeacherAssignment[];
  timetable: TeacherTimetablePeriod[];
};

export type AcademicInstitution = {
  id: string;
  name: string;
  nameUrdu?: string | null;
  system?: TeacherSystem | "both" | null;
  active?: boolean;
};

export type AcademicProgram = {
  id: string;
  institutionId: string;
  name: string;
  nameUrdu?: string | null;
  system: TeacherSystem;
  active?: boolean;
};

export type SchoolClassOption = {
  id: string;
  name: string;
  nameUrdu: string;
  active?: boolean;
  sections: Array<{
    id: string;
    name: string;
    active?: boolean;
  }>;
};

export type ExamSubjectOption = {
  id: string;
  code: string;
  name: string;
  nameUrdu: string;
  system: TeacherSystem;
  schoolClassId: string | null;
  madrassaSubcategoryId: string | null;
  active: boolean;
};
