import fs from "node:fs";
import path from "node:path";

export type StoredAdmissionApplication = {
  id: string;
  refNo: string;
  source: "public" | "admin";
  variantKey?: string;
  status:
    | "pending"
    | "under_review"
    | "interview_scheduled"
    | "documents_pending"
    | "waitlisted"
    | "accepted"
    | "rejected";
  name: string;
  nameUrdu: string;
  fatherName: string;
  fatherNameUrdu?: string;
  gender: "male" | "female";
  dob?: string | null;
  phone: string;
  guardianName?: string;
  guardianPhone?: string | null;
  guardianCnic?: string | null;
  guardianEmail?: string | null;
  address?: string | null;
  system: "madrassa" | "school";
  categoryOrClass: string;
  institutionId?: string | null;
  programId?: string | null;
  schoolClassId?: string | null;
  madrassaSubcategoryId?: string | null;
  darja?: string | null;
  photoPath?: string | null;
  acceptedStudentId?: string | null;
  acceptedEnrollmentId?: string | null;
  submittedAt: string;
  decidedAt?: string | null;
  notes?: string | null;
};

function getApplicationsFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "admission-applications.json"),
    path.join(process.cwd(), ".output", "public", "admission-applications.json"),
  ];
}

export const CANONICAL_SEED_APPLICATIONS: StoredAdmissionApplication[] = [
  {
    id: "app_pub_101",
    refNo: "APP-WEB-2026-001",
    source: "public",
    variantKey: "school_boys",
    status: "interview_scheduled",
    name: "Muhammad Huzaifa",
    nameUrdu: "محمد حذیفہ",
    fatherName: "Tariq Mahmood",
    fatherNameUrdu: "طارق محمود",
    gender: "male",
    phone: "0300-1234567",
    guardianName: "Tariq Mahmood",
    guardianPhone: "0300-1234567",
    guardianCnic: "37405-1234567-1",
    system: "school",
    categoryOrClass: "Class 5 (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-10-25T10:00:00Z",
  },
  {
    id: "app_pub_102",
    refNo: "APP-WEB-2026-002",
    source: "public",
    variantKey: "school_girls",
    status: "accepted",
    name: "Fatima Zahra",
    nameUrdu: "فاطمہ زہرا",
    fatherName: "Muhammad Imran",
    fatherNameUrdu: "محمد عمران",
    gender: "female",
    phone: "0321-9876543",
    guardianName: "Muhammad Imran",
    guardianPhone: "0321-9876543",
    guardianCnic: "37405-2345678-2",
    system: "school",
    categoryOrClass: "Class 1 (Girls)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-10-26T11:30:00Z",
    decidedAt: "2026-11-01T12:00:00Z",
  },
  {
    id: "app_dir_103",
    refNo: "APP-DIR-2026-003",
    source: "admin",
    variantKey: "madrassa_boys_hifz",
    status: "interview_scheduled",
    name: "Abdul Rehman",
    nameUrdu: "عبد الرحمن",
    fatherName: "Saeed Ahmad",
    fatherNameUrdu: "سعید احمد",
    gender: "male",
    phone: "0333-5551234",
    guardianName: "Saeed Ahmad",
    guardianPhone: "0333-5551234",
    guardianCnic: "37405-3456789-3",
    system: "madrassa",
    categoryOrClass: "Hifz Quran (حفظ قرآن)",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_hifz",
    submittedAt: "2026-10-27T09:15:00Z",
  },
  {
    id: "app_pub_104",
    refNo: "APP-WEB-2026-004",
    source: "public",
    variantKey: "madrassa_boys_nazira",
    status: "under_review",
    name: "Zainab Bibi",
    nameUrdu: "زینب بی بی",
    fatherName: "Iqbal Hussain",
    fatherNameUrdu: "اقبال حسین",
    gender: "female",
    phone: "0345-4448899",
    guardianName: "Iqbal Hussain",
    guardianPhone: "0345-4448899",
    guardianCnic: "37405-4567890-4",
    system: "madrassa",
    categoryOrClass: "Nazira Quran (ناظرہ قرآن)",
    institutionId: "jamia_zainab_banat",
    programId: "zainab_nazira",
    submittedAt: "2026-10-28T14:20:00Z",
  },
  {
    id: "app_dir_105",
    refNo: "APP-DIR-2026-005",
    source: "admin",
    variantKey: "school_boys",
    status: "pending",
    name: "Muhammad Bilal",
    nameUrdu: "محمد بلال",
    fatherName: "Rashid Ali",
    fatherNameUrdu: "راشد علی",
    gender: "male",
    phone: "0312-7776655",
    guardianName: "Rashid Ali",
    guardianPhone: "0312-7776655",
    guardianCnic: "37405-5678901-5",
    system: "school",
    categoryOrClass: "Class 7 (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-10-28T16:00:00Z",
  },
  {
    id: "app_pub_106",
    refNo: "APP-WEB-2026-006",
    source: "public",
    variantKey: "school_boys",
    status: "accepted",
    name: "Abdullah Khan",
    nameUrdu: "عبد اللہ خان",
    fatherName: "Farooq Khan",
    fatherNameUrdu: "فاروق خان",
    gender: "male",
    phone: "0301-4433221",
    guardianName: "Farooq Khan",
    guardianPhone: "0301-4433221",
    system: "school",
    categoryOrClass: "Class 9 Science (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-09-12T08:30:00Z",
    decidedAt: "2026-09-20T10:00:00Z",
  },
  {
    id: "app_pub_107",
    refNo: "APP-WEB-2026-007",
    source: "public",
    variantKey: "school_girls",
    status: "documents_pending",
    name: "Ayesha Noor",
    nameUrdu: "عائشہ نور",
    fatherName: "Noor Muhammad",
    fatherNameUrdu: "نور محمد",
    gender: "female",
    phone: "0322-1122334",
    guardianName: "Noor Muhammad",
    guardianPhone: "0322-1122334",
    system: "school",
    categoryOrClass: "Class 6 (Girls)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-10-29T09:40:00Z",
  },
  {
    id: "app_dir_108",
    refNo: "APP-DIR-2026-008",
    source: "admin",
    variantKey: "madrassa_boys_dars_nizami",
    status: "accepted",
    name: "Hafiz Usman",
    nameUrdu: "حافظ عثمان",
    fatherName: "Abdul Ghani",
    fatherNameUrdu: "عبد الغنی",
    gender: "male",
    phone: "0331-9988776",
    guardianName: "Abdul Ghani",
    guardianPhone: "0331-9988776",
    system: "madrassa",
    categoryOrClass: "Dars-e-Nizami (درس نظامی)",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_dars_nizami",
    submittedAt: "2026-08-15T10:00:00Z",
    decidedAt: "2026-08-25T14:00:00Z",
  },
  {
    id: "app_pub_109",
    refNo: "APP-WEB-2026-009",
    source: "public",
    variantKey: "school_girls",
    status: "under_review",
    name: "Maryam Tariq",
    nameUrdu: "مریم طارق",
    fatherName: "Tariq Jamil",
    fatherNameUrdu: "طارق جمیل",
    gender: "female",
    phone: "0343-6677889",
    guardianName: "Tariq Jamil",
    guardianPhone: "0343-6677889",
    system: "school",
    categoryOrClass: "Class 3 (Girls)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-10-30T11:20:00Z",
  },
  {
    id: "app_dir_110",
    refNo: "APP-DIR-2026-010",
    source: "admin",
    variantKey: "madrassa_boys_hifz",
    status: "waitlisted",
    name: "Abu Bakr Siddique",
    nameUrdu: "ابو بکر صدیق",
    fatherName: "Siddique Akbar",
    fatherNameUrdu: "صدیق اکبر",
    gender: "male",
    phone: "0302-3344556",
    guardianName: "Siddique Akbar",
    guardianPhone: "0302-3344556",
    system: "madrassa",
    categoryOrClass: "Hifz Quran (حفظ قرآن)",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_hifz",
    submittedAt: "2026-10-18T13:00:00Z",
  },
  {
    id: "app_pub_111",
    refNo: "APP-WEB-2026-011",
    source: "public",
    variantKey: "school_boys",
    status: "accepted",
    name: "Saad Rafiq",
    nameUrdu: "سعد رفیق",
    fatherName: "Rafiq Ahmad",
    fatherNameUrdu: "رفیق احمد",
    gender: "male",
    phone: "0313-5566778",
    guardianName: "Rafiq Ahmad",
    guardianPhone: "0313-5566778",
    system: "school",
    categoryOrClass: "Class 8 (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-07-20T10:00:00Z",
    decidedAt: "2026-07-28T11:00:00Z",
  },
  {
    id: "app_dir_112",
    refNo: "APP-DIR-2026-012",
    source: "admin",
    variantKey: "madrassa_girls_dars_nizami",
    status: "accepted",
    name: "Khadija Tul Kubra",
    nameUrdu: "خدیجہ الکبریٰ",
    fatherName: "Maulana Akram",
    fatherNameUrdu: "مولانا اکرم",
    gender: "female",
    phone: "0323-8899001",
    guardianName: "Maulana Akram",
    guardianPhone: "0323-8899001",
    system: "madrassa",
    categoryOrClass: "Jamia Zainab Dars-e-Nizami",
    institutionId: "jamia_zainab_banat",
    programId: "zainab_dars_nizami",
    submittedAt: "2026-08-05T09:10:00Z",
    decidedAt: "2026-08-14T15:30:00Z",
  },
  {
    id: "app_pub_113",
    refNo: "APP-WEB-2026-013",
    source: "public",
    variantKey: "school_boys",
    status: "accepted",
    name: "Hamza Farooq",
    nameUrdu: "حمزہ فاروق",
    fatherName: "Farooq Azam",
    fatherNameUrdu: "فاروق اعظم",
    gender: "male",
    phone: "0332-1237890",
    guardianName: "Farooq Azam",
    guardianPhone: "0332-1237890",
    system: "school",
    categoryOrClass: "Class 10 (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-06-18T11:00:00Z",
    decidedAt: "2026-06-25T14:00:00Z",
  },
  {
    id: "app_dir_114",
    refNo: "APP-DIR-2026-014",
    source: "admin",
    variantKey: "madrassa_boys_nazira",
    status: "interview_scheduled",
    name: "Tayyab Rehman",
    nameUrdu: "طیب الرحمن",
    fatherName: "Rehman Gul",
    fatherNameUrdu: "رحمن گل",
    gender: "male",
    phone: "0344-9871234",
    guardianName: "Rehman Gul",
    guardianPhone: "0344-9871234",
    system: "madrassa",
    categoryOrClass: "Nazira Quran (ناظرہ قرآن)",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_nazira",
    submittedAt: "2026-10-31T08:45:00Z",
  },
  {
    id: "app_pub_115",
    refNo: "APP-WEB-2026-015",
    source: "public",
    variantKey: "madrassa_girls_hifz",
    status: "documents_pending",
    name: "Asma Bint Khalid",
    nameUrdu: "اسماء بنت خالد",
    fatherName: "Khalid Mehmood",
    fatherNameUrdu: "خالد محمود",
    gender: "female",
    phone: "0303-6543210",
    guardianName: "Khalid Mehmood",
    guardianPhone: "0303-6543210",
    system: "madrassa",
    categoryOrClass: "Jamia Zainab Hifz",
    institutionId: "jamia_zainab_banat",
    programId: "zainab_hifz",
    submittedAt: "2026-11-01T10:15:00Z",
  },
  {
    id: "app_dir_116",
    refNo: "APP-DIR-2026-016",
    source: "admin",
    variantKey: "school_boys",
    status: "pending",
    name: "Ibrahim Shah",
    nameUrdu: "ابراہیم شاہ",
    fatherName: "Syed Alam Shah",
    fatherNameUrdu: "سید عالم شاہ",
    gender: "male",
    phone: "0314-7890123",
    guardianName: "Syed Alam Shah",
    guardianPhone: "0314-7890123",
    system: "school",
    categoryOrClass: "Class 4 (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-11-01T14:30:00Z",
  },
  {
    id: "app_pub_117",
    refNo: "APP-WEB-2026-017",
    source: "public",
    variantKey: "school_girls",
    status: "waitlisted",
    name: "Zunaira Akram",
    nameUrdu: "زنیرہ اکرم",
    fatherName: "Muhammad Akram",
    fatherNameUrdu: "محمد اکرم",
    gender: "female",
    phone: "0324-4321098",
    guardianName: "Muhammad Akram",
    guardianPhone: "0324-4321098",
    system: "school",
    categoryOrClass: "Class 2 (Girls)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-10-22T12:10:00Z",
  },
  {
    id: "app_dir_118",
    refNo: "APP-DIR-2026-018",
    source: "admin",
    variantKey: "madrassa_boys_dars_nizami",
    status: "interview_scheduled",
    name: "Muhammad Zubair",
    nameUrdu: "محمد زبیر",
    fatherName: "Zubair Ahmad",
    fatherNameUrdu: "زبیر احمد",
    gender: "male",
    phone: "0334-8765432",
    guardianName: "Zubair Ahmad",
    guardianPhone: "0334-8765432",
    system: "madrassa",
    categoryOrClass: "Dars-e-Nizami (درس نظامی)",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_dars_nizami",
    submittedAt: "2026-11-02T09:00:00Z",
  },
  {
    id: "app_pub_119",
    refNo: "APP-WEB-2026-019",
    source: "public",
    variantKey: "school_boys",
    status: "documents_pending",
    name: "Huzaifa Afridi",
    nameUrdu: "حذیفہ آفریدی",
    fatherName: "Gulzar Khan",
    fatherNameUrdu: "گلزار خان",
    gender: "male",
    phone: "0346-5678901",
    guardianName: "Gulzar Khan",
    guardianPhone: "0346-5678901",
    system: "school",
    categoryOrClass: "Class 7 (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-11-02T11:15:00Z",
  },
  {
    id: "app_pub_120",
    refNo: "APP-WEB-2026-020",
    source: "public",
    variantKey: "madrassa_girls_nazira",
    status: "accepted",
    name: "Sumayya Bibi",
    nameUrdu: "سمیہ بی بی",
    fatherName: "Haji Abdul Wahab",
    fatherNameUrdu: "حاجی عبد الوہاب",
    gender: "female",
    phone: "0304-3210987",
    guardianName: "Haji Abdul Wahab",
    guardianPhone: "0304-3210987",
    system: "madrassa",
    categoryOrClass: "Jamia Zainab Nazira",
    institutionId: "jamia_zainab_banat",
    programId: "zainab_nazira",
    submittedAt: "2026-09-01T08:15:00Z",
    decidedAt: "2026-09-10T12:00:00Z",
  },
  {
    id: "app_dir_121",
    refNo: "APP-DIR-2026-021",
    source: "admin",
    variantKey: "school_boys",
    status: "under_review",
    name: "Talha Tariq",
    nameUrdu: "طلحہ طارق",
    fatherName: "Tariq Aziz",
    fatherNameUrdu: "طارق عزیز",
    gender: "male",
    phone: "0315-6789012",
    guardianName: "Tariq Aziz",
    guardianPhone: "0315-6789012",
    system: "school",
    categoryOrClass: "Class 5 (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-11-02T13:40:00Z",
  },
  {
    id: "app_pub_122",
    refNo: "APP-WEB-2026-022",
    source: "public",
    variantKey: "school_boys",
    status: "accepted",
    name: "Hassan Ali",
    nameUrdu: "حسن علی",
    fatherName: "Liaquat Ali",
    fatherNameUrdu: "لیاقت علی",
    gender: "male",
    phone: "0325-7890123",
    guardianName: "Liaquat Ali",
    guardianPhone: "0325-7890123",
    system: "school",
    categoryOrClass: "Class 8 (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-08-20T10:20:00Z",
    decidedAt: "2026-08-30T11:45:00Z",
  },
  {
    id: "app_dir_123",
    refNo: "APP-DIR-2026-023",
    source: "admin",
    variantKey: "madrassa_boys_hifz",
    status: "pending",
    name: "Affan Qureshi",
    nameUrdu: "عفان قریشی",
    fatherName: "Qureshi Sahib",
    fatherNameUrdu: "قریشی صاحب",
    gender: "male",
    phone: "0335-9012345",
    guardianName: "Qureshi Sahib",
    guardianPhone: "0335-9012345",
    system: "madrassa",
    categoryOrClass: "Hifz Quran (حفظ قرآن)",
    institutionId: "jamia_qasmia_baneen",
    programId: "qasmia_hifz",
    submittedAt: "2026-11-03T07:15:00Z",
  },
  {
    id: "app_pub_124",
    refNo: "APP-WEB-2026-024",
    source: "public",
    variantKey: "school_boys",
    status: "under_review",
    name: "Umar Farooq",
    nameUrdu: "عمر فاروق",
    fatherName: "Farooq Ahmad",
    fatherNameUrdu: "فاروق احمد",
    gender: "male",
    phone: "0347-1234560",
    guardianName: "Farooq Ahmad",
    guardianPhone: "0347-1234560",
    system: "school",
    categoryOrClass: "Class 9 Arts (Boys)",
    institutionId: "al_qasim_academy",
    programId: "al_qasim_school",
    submittedAt: "2026-11-03T08:00:00Z",
  },
];

let memoryApplications: StoredAdmissionApplication[] | null = null;

function readFromFile(): StoredAdmissionApplication[] | null {
  for (const p of getApplicationsFilePaths()) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as StoredAdmissionApplication[];
        }
      }
    } catch {}
  }
  return null;
}

function writeToFile(apps: StoredAdmissionApplication[]): void {
  for (const p of getApplicationsFilePaths()) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(apps, null, 2), "utf-8");
    } catch {}
  }
}

export function loadStoredApplications(): StoredAdmissionApplication[] {
  if (memoryApplications && memoryApplications.length > 0) {
    return memoryApplications;
  }
  const fromFile = readFromFile();
  if (fromFile && fromFile.length > 0) {
    memoryApplications = fromFile;
    return memoryApplications;
  }
  memoryApplications = [...CANONICAL_SEED_APPLICATIONS];
  writeToFile(memoryApplications);
  return memoryApplications;
}

export function saveStoredApplication(
  app: Partial<StoredAdmissionApplication> & { id: string; refNo: string },
): StoredAdmissionApplication {
  const current = loadStoredApplications();
  const existingIdx = current.findIndex((a) => a.id === app.id || a.refNo === app.refNo);

  const fullApp: StoredAdmissionApplication = {
    id: app.id,
    refNo: app.refNo,
    source: app.source || "public",
    variantKey: app.variantKey || "school_boys",
    status: app.status || "pending",
    name: app.name || "Student Applicant",
    nameUrdu: app.nameUrdu || app.name || "امیدوار",
    fatherName: app.fatherName || "Father",
    fatherNameUrdu: app.fatherNameUrdu || app.fatherName,
    gender: app.gender || "male",
    dob: app.dob || null,
    phone: app.phone || app.guardianPhone || "",
    guardianName: app.guardianName || app.fatherName,
    guardianPhone: app.guardianPhone || app.phone,
    guardianCnic: app.guardianCnic,
    guardianEmail: app.guardianEmail,
    address: app.address,
    system: app.system || "school",
    categoryOrClass: app.categoryOrClass || "General Class",
    institutionId: app.institutionId,
    programId: app.programId,
    schoolClassId: app.schoolClassId,
    madrassaSubcategoryId: app.madrassaSubcategoryId,
    darja: app.darja,
    photoPath: app.photoPath,
    acceptedStudentId: app.acceptedStudentId,
    acceptedEnrollmentId: app.acceptedEnrollmentId,
    submittedAt: app.submittedAt || new Date().toISOString(),
    decidedAt: app.decidedAt,
    notes: app.notes,
  };

  let nextList: StoredAdmissionApplication[];
  if (existingIdx >= 0) {
    nextList = current.map((a, i) => (i === existingIdx ? { ...a, ...fullApp } : a));
  } else {
    nextList = [fullApp, ...current];
  }

  memoryApplications = nextList;
  writeToFile(nextList);
  return fullApp;
}

export function updateStoredApplicationStatus(
  id: string,
  status: StoredAdmissionApplication["status"],
  notes?: string,
): StoredAdmissionApplication | null {
  const current = loadStoredApplications();
  const found = current.find((a) => a.id === id || a.refNo === id);
  if (!found) return null;

  const decidedAt = status === "accepted" || status === "rejected" ? new Date().toISOString() : found.decidedAt;
  const updated: StoredAdmissionApplication = {
    ...found,
    status,
    decidedAt,
    notes: notes ?? found.notes,
  };

  const nextList = current.map((a) => (a.id === found.id ? updated : a));
  memoryApplications = nextList;
  writeToFile(nextList);
  return updated;
}

export function getAdmissionDashboardMetrics(systemFilter?: "all" | "madrassa" | "school") {
  const all = loadStoredApplications();
  const list = !systemFilter || systemFilter === "all" ? all : all.filter((a) => a.system === systemFilter);

  const total = list.length;
  const pending = list.filter((a) => a.status === "pending").length;
  const underReview = list.filter((a) => a.status === "under_review").length;
  const interviews = list.filter((a) => a.status === "interview_scheduled").length;
  const docsPending = list.filter((a) => a.status === "documents_pending").length;
  const waitlisted = list.filter((a) => a.status === "waitlisted").length;
  const accepted = list.filter((a) => a.status === "accepted").length;
  const rejected = list.filter((a) => a.status === "rejected").length;

  const madrassaCount = list.filter((a) => a.system === "madrassa").length;
  const schoolCount = list.filter((a) => a.system === "school").length;

  const activeProcessing = pending + underReview;
  const inEvaluation = interviews + docsPending;
  const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  // Monthly timeline for the last 6 months
  const monthNamesEn = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const monthNamesUr = ["مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر"];
  const monthlyHistory = monthNamesEn.map((mName, idx) => {
    const monthNum = idx + 5; // May (5) to Nov (11)
    const inMonth = list.filter((a) => {
      const d = new Date(a.submittedAt);
      return !isNaN(d.getTime()) && d.getMonth() + 1 === monthNum;
    });

    const rec = inMonth.length;
    const acc = inMonth.filter((a) => a.status === "accepted").length;
    const rev = inMonth.filter((a) => a.status === "under_review" || a.status === "pending").length;
    const int = inMonth.filter((a) => a.status === "interview_scheduled" || a.status === "documents_pending").length;

    return {
      month: mName,
      monthUr: monthNamesUr[idx],
      received: rec,
      accepted: acc,
      inReview: rev,
      evaluation: int,
    };
  });

  // Stage Progression Flow Data for Charts
  const stages = [
    {
      id: "pending",
      name: "1. Intake Received",
      nameUrdu: "1. موصولہ درخواستیں",
      count: activeProcessing,
      pct: total > 0 ? Math.round((activeProcessing / total) * 100) : 0,
      fill: "#f59e0b", // Amber
    },
    {
      id: "under_review",
      name: "2. Under Review",
      nameUrdu: "2. زیرِ پڑتال",
      count: underReview,
      pct: total > 0 ? Math.round((underReview / total) * 100) : 0,
      fill: "#f97316", // Orange
    },
    {
      id: "interview",
      name: "3. Interview & Test",
      nameUrdu: "3. انٹرویو و ٹیسٹ",
      count: interviews,
      pct: total > 0 ? Math.round((interviews / total) * 100) : 0,
      fill: "#3b82f6", // Blue
    },
    {
      id: "docs",
      name: "4. Doc Verification",
      nameUrdu: "4. تصدیق دستاویزات",
      count: docsPending,
      pct: total > 0 ? Math.round((docsPending / total) * 100) : 0,
      fill: "#a855f7", // Purple
    },
    {
      id: "waitlist",
      name: "5. Waitlisted",
      nameUrdu: "5. ویٹ لسٹ",
      count: waitlisted,
      pct: total > 0 ? Math.round((waitlisted / total) * 100) : 0,
      fill: "#fb7185", // Rose
    },
    {
      id: "accepted",
      name: "6. Enrolled (Roll #)",
      nameUrdu: "6. باضابطہ داخلہ",
      count: accepted,
      pct: conversionRate,
      fill: "#10b981", // Emerald
    },
  ];

  // Campus distribution breakdown
  const campusDistribution = [
    {
      name: "Madrassa (Qasimia & Zainab)",
      nameUrdu: "جامعہ (مدرسہ شعبہ)",
      value: madrassaCount,
      color: "#10b981",
    },
    {
      name: "School (Al-Qasim Academy)",
      nameUrdu: "سکول (القاسم اکیڈمی)",
      value: schoolCount,
      color: "#0ea5e9",
    },
  ];

  return {
    total,
    pending,
    underReview,
    interviews,
    docsPending,
    waitlisted,
    accepted,
    rejected,
    madrassaCount,
    schoolCount,
    activeProcessing,
    inEvaluation,
    conversionRate,
    monthlyHistory,
    stages,
    campusDistribution,
    applications: list,
  };
}

