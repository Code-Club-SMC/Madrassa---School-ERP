export type StudentSystem = "school" | "madrassa";

export type StudentStatus = "active" | "inactive" | "graduated" | "dropout" | "transferred";

export type StudentListItem = {
  id: string;
  rollNo: string;
  admissionNo: string;
  name: string;
  nameUrdu: string;
  fatherName: string;
  fatherNameUrdu: string | null;
  gender: string;
  dob: string;
  cnicBForm: string | null;
  status: StudentStatus;
  photoPath: string | null;
  system: StudentSystem;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  institutionSection: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  classId?: string;
  section?: string;
  categoryId?: string;
  subcategoryId?: string;
  darja?: string;
  groupLabel: string;
  groupEnglish: string;
  admissionDate: string;
  guardianId: string | null;
  guardianName: string;
  guardianNameUrdu: string;
  guardianPhone: string;
  guardianCnic: string;
  guardianEmail: string | null;
  guardianAddress: string;
  monthlyFee: number;
  monthlyFeePaisa: number;
};

export type StudentEnrollmentProfile = {
  id: string;
  rollNo: string;
  admissionNo: string;
  status: StudentStatus;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  programSystem: "school" | "school_support" | "madrassa";
  schoolClassId: string | null;
  schoolClassName: string | null;
  schoolClassNameUrdu: string | null;
  schoolSectionId: string | null;
  schoolSectionName: string | null;
  madrassaCategoryId: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu: string | null;
  madrassaSubcategoryId: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  darja: string | null;
  startedAt: string;
  endedAt: string | null;
};

export type StudentGuardianProfile = {
  guardianId: string;
  userId: string | null;
  name: string;
  nameUrdu: string | null;
  cnic: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  relation: string;
  isPrimary: boolean;
  parentUserEmail: string | null;
  parentUserUsername: string | null;
};

export type StudentSiblingProfile = {
  id: string;
  name: string;
  nameUrdu: string;
  rollNo: string | null;
  status: string;
};

export type StudentEventProfile = {
  id: string;
  studentId: string;
  enrollmentId: string | null;
  type: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export type StudentAdmissionProfile = {
  id: string;
  refNo: string;
  source: string;
  variantKey: string;
  submittedAt: string;
  decidedAt: string | null;
};

export type StudentProfilePayload = {
  student: StudentListItem;
  enrollments: StudentEnrollmentProfile[];
  guardians: StudentGuardianProfile[];
  siblings: StudentSiblingProfile[];
  events: StudentEventProfile[];
  admission: StudentAdmissionProfile | null;
};

export type ParentCreds = {
  nameUrdu: string;
  nameEnglish: string;
  email: string;
  username?: string;
  role: "parent";
  password: string;
};

export type AdmissionAcceptanceWarning = {
  code: "parent_account_failed";
  message: string;
  metadata?: {
    email?: string;
    username?: string;
    reason?: string;
  };
};

export type ParentAccountRetryResponse = {
  parentCredentials: ParentCreds | null;
  warning?: {
    code: "parent_account_failed";
    message: string;
    metadata?: {
      email?: string;
      username?: string;
      reason?: string;
      guardianId?: string;
    };
  };
};
