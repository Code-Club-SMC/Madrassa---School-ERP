import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  FeeChargeStatus,
  FeeChargeType,
  FeePaymentMethod,
  FeePaymentStatus,
} from "@/db/schema/finance";
import {
  buildChargeLedger,
  summarizeStudentLedger,
  type ChargeLedgerRow,
  type StudentLedgerSummary,
} from "./ledger";
import { syncPaymentToFile } from "./transaction-service";

export type StoredFeeStudent = {
  studentId: string;
  studentName: string;
  studentNameUrdu: string;
  fatherName: string;
  fatherNameUrdu?: string;
  gender: "male" | "female";
  dob: string;
  status: "active" | "inactive" | "graduated" | "dropout" | "transferred";
  enrollmentId: string;
  rollNo: string;
  admissionNo: string;
  institutionId: string;
  institutionName: string;
  institutionNameUrdu: string;
  programId: string;
  programName: string;
  programNameUrdu: string;
  programSystem: "madrassa" | "school" | "school_support";
  schoolClassId: string | null;
  schoolClassName: string | null;
  schoolClassNameUrdu: string | null;
  schoolSectionId?: string | null;
  schoolSectionName?: string | null;
  schoolClassFee: number | null;
  madrassaSubcategoryId: string | null;
  madrassaSubcategoryName: string | null;
  madrassaSubcategoryNameUrdu: string | null;
  madrassaSubcategoryFee: number | null;
  madrassaCategoryId: string | null;
  madrassaCategoryName: string | null;
  madrassaCategoryNameUrdu?: string | null;
  darja?: string | null;
  guardianId: string;
  guardianName: string;
  guardianNameUrdu: string;
  guardianPhone: string;
  guardianCnic: string;
  guardianEmail?: string | null;
  guardianAddress?: string | null;
  academicYearId: string | null;
  system: "madrassa" | "school";
};

export type StoredFeeCharge = {
  id: string;
  studentId: string;
  enrollmentId: string;
  institutionId: string;
  programId: string;
  schoolClassId: string | null;
  madrassaSubcategoryId: string | null;
  type: FeeChargeType;
  label: string;
  period: string | null;
  amountPaisa: number;
  dueDate: string | null;
  status: FeeChargeStatus;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdByUserId: string | null;
  reversedAt: string | null;
  reversedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredFeePayment = {
  id: string;
  receiptNo: string;
  studentId: string;
  enrollmentId: string;
  institutionId: string;
  amountPaisa: number;
  method: FeePaymentMethod;
  status: FeePaymentStatus;
  receivedAt: string;
  receivedByUserId: string | null;
  payerName: string | null;
  payerPhone: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  reversedAt: string | null;
  reversedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredFeeAllocation = {
  id: string;
  paymentId: string;
  chargeId: string;
  amountPaisa: number;
  createdAt: string;
};

export type StoredFeeAdjustment = {
  id: string;
  studentId: string;
  enrollmentId: string;
  chargeId: string | null;
  paymentId: string | null;
  type: "concession" | "waiver" | "charge_reversal" | "payment_reversal" | "refund";
  amountPaisa: number;
  method: FeePaymentMethod | null;
  reason: string;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type FeeStoreData = {
  students: StoredFeeStudent[];
  charges: StoredFeeCharge[];
  payments: StoredFeePayment[];
  allocations: StoredFeeAllocation[];
  adjustments: StoredFeeAdjustment[];
};

const SEED_STUDENTS: StoredFeeStudent[] = [
  // 1. Jamia Qasimia Lil-Baneen (Boys Madrassa)
  {
    studentId: "stu-jqb-001",
    studentName: "Muhammad Abdullah Khan",
    studentNameUrdu: "محمد عبداللہ خان",
    fatherName: "Tariq Mehmood Khan",
    fatherNameUrdu: "طارق محمود خان",
    gender: "male",
    dob: "2010-03-14",
    status: "active",
    enrollmentId: "enr-jqb-001",
    rollNo: "JQB-2026-101",
    admissionNo: "ADM-JQB-101",
    institutionId: "jamia_qasmia_baneen",
    institutionName: "Jamia Qasimia Lil-Baneen",
    institutionNameUrdu: "جامعہ قاسمیہ للبنین",
    programId: "qasmia_dars_e_nizami",
    programName: "Dars-e-Nizami (Boys)",
    programNameUrdu: "درس نظامی (بنین)",
    programSystem: "madrassa",
    schoolClassId: null,
    schoolClassName: null,
    schoolClassNameUrdu: null,
    schoolClassFee: null,
    madrassaSubcategoryId: "amama_tul_kutub_1",
    madrassaSubcategoryName: "Darja Aammah Year 1",
    madrassaSubcategoryNameUrdu: "درجہ عامہ سال اول",
    madrassaSubcategoryFee: 3000,
    madrassaCategoryId: "dars_e_nizami",
    madrassaCategoryName: "Dars-e-Nizami",
    madrassaCategoryNameUrdu: "درس نظامی",
    darja: "Darja Aammah",
    guardianId: "grd-001",
    guardianName: "Tariq Mehmood Khan",
    guardianNameUrdu: "طارق محمود خان",
    guardianPhone: "0300-4112233",
    guardianCnic: "35201-4112233-1",
    guardianEmail: "tariq.khan@example.com",
    guardianAddress: "House 14, Street 3, Model Town, Lahore",
    academicYearId: "ay-2026",
    system: "madrassa",
  },
  {
    studentId: "stu-jqb-002",
    studentName: "Hafiz Huzaifa Ahmad",
    studentNameUrdu: "حافظ حذیفہ احمد",
    fatherName: "Riaz Ahmad Qureshi",
    fatherNameUrdu: "ریاض احمد قریشی",
    gender: "male",
    dob: "2012-08-20",
    status: "active",
    enrollmentId: "enr-jqb-002",
    rollNo: "JQB-2026-102",
    admissionNo: "ADM-JQB-102",
    institutionId: "jamia_qasmia_baneen",
    institutionName: "Jamia Qasimia Lil-Baneen",
    institutionNameUrdu: "جامعہ قاسمیہ للبنین",
    programId: "qasmia_hifz",
    programName: "Tahfeez-ul-Quran (Boys)",
    programNameUrdu: "تحفیظ القرآن (بنین)",
    programSystem: "madrassa",
    schoolClassId: null,
    schoolClassName: null,
    schoolClassNameUrdu: null,
    schoolClassFee: null,
    madrassaSubcategoryId: "hifz_1",
    madrassaSubcategoryName: "Hifz Section A",
    madrassaSubcategoryNameUrdu: "حفظ سیکشن الف",
    madrassaSubcategoryFee: 2500,
    madrassaCategoryId: "hifz",
    madrassaCategoryName: "Tahfeez-ul-Quran",
    madrassaCategoryNameUrdu: "تحفیظ القرآن",
    darja: "Hifz",
    guardianId: "grd-002",
    guardianName: "Riaz Ahmad Qureshi",
    guardianNameUrdu: "ریاض احمد قریشی",
    guardianPhone: "0321-5223344",
    guardianCnic: "35202-5223344-3",
    guardianEmail: "riaz.qureshi@example.com",
    guardianAddress: "Block B, Gulberg III, Lahore",
    academicYearId: "ay-2026",
    system: "madrassa",
  },
  {
    studentId: "stu-jqb-003",
    studentName: "Usman Ghani",
    studentNameUrdu: "عثمان غنی",
    fatherName: "Abdul Ghani",
    fatherNameUrdu: "عبدالغنی",
    gender: "male",
    dob: "2014-01-10",
    status: "active",
    enrollmentId: "enr-jqb-003",
    rollNo: "JQB-2026-103",
    admissionNo: "ADM-JQB-103",
    institutionId: "jamia_qasmia_baneen",
    institutionName: "Jamia Qasimia Lil-Baneen",
    institutionNameUrdu: "جامعہ قاسمیہ للبنین",
    programId: "qasmia_nazira",
    programName: "Nazira Quran (Boys)",
    programNameUrdu: "ناظرہ قرآن (بنین)",
    programSystem: "madrassa",
    schoolClassId: null,
    schoolClassName: null,
    schoolClassNameUrdu: null,
    schoolClassFee: null,
    madrassaSubcategoryId: "nazira_boys_1",
    madrassaSubcategoryName: "Nazira Primary",
    madrassaSubcategoryNameUrdu: "ناظرہ ابتدائی",
    madrassaSubcategoryFee: 2000,
    madrassaCategoryId: "nazira",
    madrassaCategoryName: "Nazira & Qaida",
    madrassaCategoryNameUrdu: "ناظرہ و قاعدہ",
    darja: "Nazira",
    guardianId: "grd-003",
    guardianName: "Abdul Ghani",
    guardianNameUrdu: "عبدالغنی",
    guardianPhone: "0333-6334455",
    guardianCnic: "35201-6334455-5",
    guardianEmail: "abdul.ghani@example.com",
    guardianAddress: "Johar Town Phase 2, Lahore",
    academicYearId: "ay-2026",
    system: "madrassa",
  },
  {
    studentId: "stu-jqb-004",
    studentName: "Talha Zubair",
    studentNameUrdu: "طلحہ زبیر",
    fatherName: "Muhammad Zubair",
    fatherNameUrdu: "محمد زبیر",
    gender: "male",
    dob: "2009-11-05",
    status: "active",
    enrollmentId: "enr-jqb-004",
    rollNo: "JQB-2026-104",
    admissionNo: "ADM-JQB-104",
    institutionId: "jamia_qasmia_baneen",
    institutionName: "Jamia Qasimia Lil-Baneen",
    institutionNameUrdu: "جامعہ قاسمیہ للبنین",
    programId: "qasmia_dars_e_nizami",
    programName: "Dars-e-Nizami (Boys)",
    programNameUrdu: "درس نظامی (بنین)",
    programSystem: "madrassa",
    schoolClassId: null,
    schoolClassName: null,
    schoolClassNameUrdu: null,
    schoolClassFee: null,
    madrassaSubcategoryId: "khasa_1",
    madrassaSubcategoryName: "Darja Khassah Year 1",
    madrassaSubcategoryNameUrdu: "درجہ خاصہ سال اول",
    madrassaSubcategoryFee: 3500,
    madrassaCategoryId: "dars_e_nizami",
    madrassaCategoryName: "Dars-e-Nizami",
    madrassaCategoryNameUrdu: "درس نظامی",
    darja: "Darja Khassah",
    guardianId: "grd-004",
    guardianName: "Muhammad Zubair",
    guardianNameUrdu: "محمد زبیر",
    guardianPhone: "0345-7445566",
    guardianCnic: "35202-7445566-7",
    guardianEmail: "zubair@example.com",
    guardianAddress: "Allama Iqbal Town, Lahore",
    academicYearId: "ay-2026",
    system: "madrassa",
  },

  // 2. Al-Qasim Academy (Boys School)
  {
    studentId: "stu-aqa-001",
    studentName: "Ahmad Raza Khan",
    studentNameUrdu: "احمد رضا خان",
    fatherName: "Tariq Mehmood Khan", // Sibling of stu-jqb-001!
    fatherNameUrdu: "طارق محمود خان",
    gender: "male",
    dob: "2013-04-12",
    status: "active",
    enrollmentId: "enr-aqa-001",
    rollNo: "AQA-2026-201",
    admissionNo: "ADM-AQA-201",
    institutionId: "al_qasim_academy",
    institutionName: "Al-Qasim Academy",
    institutionNameUrdu: "القاسم اکیڈمی (اسکول)",
    programId: "al_qasim_school",
    programName: "Al-Qasim School System",
    programNameUrdu: "القاسم اسکول سسٹم",
    programSystem: "school",
    schoolClassId: "class_8",
    schoolClassName: "Class 8",
    schoolClassNameUrdu: "جماعت ہشتم",
    schoolSectionId: "A",
    schoolSectionName: "Section A",
    schoolClassFee: 4500,
    madrassaSubcategoryId: null,
    madrassaSubcategoryName: null,
    madrassaSubcategoryNameUrdu: null,
    madrassaSubcategoryFee: null,
    madrassaCategoryId: null,
    madrassaCategoryName: null,
    guardianId: "grd-001",
    guardianName: "Tariq Mehmood Khan",
    guardianNameUrdu: "طارق محمود خان",
    guardianPhone: "0300-4112233",
    guardianCnic: "35201-4112233-1",
    guardianEmail: "tariq.khan@example.com",
    guardianAddress: "House 14, Street 3, Model Town, Lahore",
    academicYearId: "ay-2026",
    system: "school",
  },
  {
    studentId: "stu-aqa-002",
    studentName: "Hamza Ali Siddiqui",
    studentNameUrdu: "حمزہ علی صدیقی",
    fatherName: "Salman Siddiqui",
    fatherNameUrdu: "سلمان صدیقی",
    gender: "male",
    dob: "2011-09-25",
    status: "active",
    enrollmentId: "enr-aqa-002",
    rollNo: "AQA-2026-202",
    admissionNo: "ADM-AQA-202",
    institutionId: "al_qasim_academy",
    institutionName: "Al-Qasim Academy",
    institutionNameUrdu: "القاسم اکیڈمی (اسکول)",
    programId: "al_qasim_school",
    programName: "Al-Qasim School System",
    programNameUrdu: "القاسم اسکول سسٹم",
    programSystem: "school",
    schoolClassId: "class_10",
    schoolClassName: "Class 10 (Matric)",
    schoolClassNameUrdu: "جماعت دہم",
    schoolSectionId: "A",
    schoolSectionName: "Section A",
    schoolClassFee: 5500,
    madrassaSubcategoryId: null,
    madrassaSubcategoryName: null,
    madrassaSubcategoryNameUrdu: null,
    madrassaSubcategoryFee: null,
    madrassaCategoryId: null,
    madrassaCategoryName: null,
    guardianId: "grd-005",
    guardianName: "Salman Siddiqui",
    guardianNameUrdu: "سلمان صدیقی",
    guardianPhone: "0301-8556677",
    guardianCnic: "35202-8556677-9",
    guardianEmail: "salman.siddiqui@example.com",
    guardianAddress: "Faisal Town, Lahore",
    academicYearId: "ay-2026",
    system: "school",
  },
  {
    studentId: "stu-aqa-003",
    studentName: "Zain-ul-Abideen",
    studentNameUrdu: "زین العابدین",
    fatherName: "Kashif Mehmood",
    fatherNameUrdu: "کاشف محمود",
    gender: "male",
    dob: "2015-06-18",
    status: "active",
    enrollmentId: "enr-aqa-003",
    rollNo: "AQA-2026-203",
    admissionNo: "ADM-AQA-203",
    institutionId: "al_qasim_academy",
    institutionName: "Al-Qasim Academy",
    institutionNameUrdu: "القاسم اکیڈمی (اسکول)",
    programId: "al_qasim_school",
    programName: "Al-Qasim School System",
    programNameUrdu: "القاسم اسکول سسٹم",
    programSystem: "school",
    schoolClassId: "class_5",
    schoolClassName: "Class 5",
    schoolClassNameUrdu: "جماعت پنجم",
    schoolSectionId: "A",
    schoolSectionName: "Section A",
    schoolClassFee: 4000,
    madrassaSubcategoryId: null,
    madrassaSubcategoryName: null,
    madrassaSubcategoryNameUrdu: null,
    madrassaSubcategoryFee: null,
    madrassaCategoryId: null,
    madrassaCategoryName: null,
    guardianId: "grd-006",
    guardianName: "Kashif Mehmood",
    guardianNameUrdu: "کاشف محمود",
    guardianPhone: "0312-9667788",
    guardianCnic: "35201-9667788-1",
    guardianEmail: "kashif.mehmood@example.com",
    guardianAddress: "Wapda Town, Lahore",
    academicYearId: "ay-2026",
    system: "school",
  },
  {
    studentId: "stu-aqa-004",
    studentName: "Bilal Hassan",
    studentNameUrdu: "بلال حسن",
    fatherName: "Hassan Nawaz",
    fatherNameUrdu: "حسن نواز",
    gender: "male",
    dob: "2012-12-03",
    status: "active",
    enrollmentId: "enr-aqa-004",
    rollNo: "AQA-2026-204",
    admissionNo: "ADM-AQA-204",
    institutionId: "al_qasim_academy",
    institutionName: "Al-Qasim Academy",
    institutionNameUrdu: "القاسم اکیڈمی (اسکول)",
    programId: "al_qasim_school",
    programName: "Al-Qasim School System",
    programNameUrdu: "القاسم اسکول سسٹم",
    programSystem: "school",
    schoolClassId: "class_9",
    schoolClassName: "Class 9",
    schoolClassNameUrdu: "جماعت نہم",
    schoolSectionId: "A",
    schoolSectionName: "Section A",
    schoolClassFee: 5000,
    madrassaSubcategoryId: null,
    madrassaSubcategoryName: null,
    madrassaSubcategoryNameUrdu: null,
    madrassaSubcategoryFee: null,
    madrassaCategoryId: null,
    madrassaCategoryName: null,
    guardianId: "grd-007",
    guardianName: "Hassan Nawaz",
    guardianNameUrdu: "حسن نواز",
    guardianPhone: "0322-3114455",
    guardianCnic: "35202-3114455-3",
    guardianEmail: "hassan.nawaz@example.com",
    guardianAddress: "Garden Town, Lahore",
    academicYearId: "ay-2026",
    system: "school",
  },

  // 3. Jamia Zainab Lil-Banat (Girls Madrassa)
  {
    studentId: "stu-jzb-001",
    studentName: "Fatima Tuz Zahra",
    studentNameUrdu: "فاطمۃ الزہراء",
    fatherName: "Tariq Mehmood Khan", // Sibling of stu-jqb-001 & stu-aqa-001
    fatherNameUrdu: "طارق محمود خان",
    gender: "female",
    dob: "2011-05-19",
    status: "active",
    enrollmentId: "enr-jzb-001",
    rollNo: "JZB-2026-301",
    admissionNo: "ADM-JZB-301",
    institutionId: "jamia_zainab_banat",
    institutionName: "Jamia Zainab Lil-Banat",
    institutionNameUrdu: "جامعہ زینب للبنات",
    programId: "zainab_dars_e_nizami",
    programName: "Alimiyat Lil-Banat",
    programNameUrdu: "عالمیت للبنات",
    programSystem: "madrassa",
    schoolClassId: null,
    schoolClassName: null,
    schoolClassNameUrdu: null,
    schoolClassFee: null,
    madrassaSubcategoryId: "banat_aalimiyat_1",
    madrassaSubcategoryName: "Aalimiyat Banat Year 1",
    madrassaSubcategoryNameUrdu: "عالمیت بنات سال اول",
    madrassaSubcategoryFee: 2800,
    madrassaCategoryId: "dars_e_nizami",
    madrassaCategoryName: "Dars-e-Nizami (Banat)",
    madrassaCategoryNameUrdu: "درس نظامی (بنات)",
    darja: "Khassah Banat",
    guardianId: "grd-001",
    guardianName: "Tariq Mehmood Khan",
    guardianNameUrdu: "طارق محمود خان",
    guardianPhone: "0300-4112233",
    guardianCnic: "35201-4112233-1",
    guardianEmail: "tariq.khan@example.com",
    guardianAddress: "House 14, Street 3, Model Town, Lahore",
    academicYearId: "ay-2026",
    system: "madrassa",
  },
  {
    studentId: "stu-jzb-002",
    studentName: "Ayesha Siddiqa",
    studentNameUrdu: "عائشہ صدیقہ",
    fatherName: "Riaz Ahmad Qureshi", // Sibling of stu-jqb-002
    fatherNameUrdu: "ریاض احمد قریشی",
    gender: "female",
    dob: "2013-07-08",
    status: "active",
    enrollmentId: "enr-jzb-002",
    rollNo: "JZB-2026-302",
    admissionNo: "ADM-JZB-302",
    institutionId: "jamia_zainab_banat",
    institutionName: "Jamia Zainab Lil-Banat",
    institutionNameUrdu: "جامعہ زینب للبنات",
    programId: "zainab_nazira",
    programName: "Nazira & Tajweed (Banat)",
    programNameUrdu: "ناظرہ و تجوید (بنات)",
    programSystem: "madrassa",
    schoolClassId: null,
    schoolClassName: null,
    schoolClassNameUrdu: null,
    schoolClassFee: null,
    madrassaSubcategoryId: "nazira_girls_1",
    madrassaSubcategoryName: "Nazira Banat Section A",
    madrassaSubcategoryNameUrdu: "ناظرہ بنات سیکشن الف",
    madrassaSubcategoryFee: 2000,
    madrassaCategoryId: "nazira",
    madrassaCategoryName: "Nazira & Qaida",
    madrassaCategoryNameUrdu: "ناظرہ و قاعدہ",
    darja: "Nazira Banat",
    guardianId: "grd-002",
    guardianName: "Riaz Ahmad Qureshi",
    guardianNameUrdu: "ریاض احمد قریشی",
    guardianPhone: "0321-5223344",
    guardianCnic: "35202-5223344-3",
    guardianEmail: "riaz.qureshi@example.com",
    guardianAddress: "Block B, Gulberg III, Lahore",
    academicYearId: "ay-2026",
    system: "madrassa",
  },
  {
    studentId: "stu-jzb-003",
    studentName: "Zainab Bibi",
    studentNameUrdu: "زینب بی بی",
    fatherName: "Mian Muhammad Aslam",
    fatherNameUrdu: "میاں محمد اسلم",
    gender: "female",
    dob: "2010-10-14",
    status: "active",
    enrollmentId: "enr-jzb-003",
    rollNo: "JZB-2026-303",
    admissionNo: "ADM-JZB-303",
    institutionId: "jamia_zainab_banat",
    institutionName: "Jamia Zainab Lil-Banat",
    institutionNameUrdu: "جامعہ زینب للبنات",
    programId: "zainab_dars_e_nizami",
    programName: "Alimiyat Lil-Banat",
    programNameUrdu: "عالمیت للبنات",
    programSystem: "madrassa",
    schoolClassId: null,
    schoolClassName: null,
    schoolClassNameUrdu: null,
    schoolClassFee: null,
    madrassaSubcategoryId: "banat_aalimiyat_2",
    madrassaSubcategoryName: "Aalimiyat Banat Year 2",
    madrassaSubcategoryNameUrdu: "عالمیت بنات سال دوم",
    madrassaSubcategoryFee: 3000,
    madrassaCategoryId: "dars_e_nizami",
    madrassaCategoryName: "Dars-e-Nizami (Banat)",
    madrassaCategoryNameUrdu: "درس نظامی (بنات)",
    darja: "Aaliyah Banat",
    guardianId: "grd-008",
    guardianName: "Mian Muhammad Aslam",
    guardianNameUrdu: "میاں محمد اسلم",
    guardianPhone: "0300-9887766",
    guardianCnic: "35201-9887766-2",
    guardianEmail: "aslam@example.com",
    guardianAddress: "Samanabad, Lahore",
    academicYearId: "ay-2026",
    system: "madrassa",
  },
  {
    studentId: "stu-jzb-004",
    studentName: "Khadija Tul Kubra",
    studentNameUrdu: "خدیجۃ الکبریٰ",
    fatherName: "Hafiz Naeem Ullah",
    fatherNameUrdu: "حافظ نعیم اللہ",
    gender: "female",
    dob: "2012-02-28",
    status: "active",
    enrollmentId: "enr-jzb-004",
    rollNo: "JZB-2026-304",
    admissionNo: "ADM-JZB-304",
    institutionId: "jamia_zainab_banat",
    institutionName: "Jamia Zainab Lil-Banat",
    institutionNameUrdu: "جامعہ زینب للبنات",
    programId: "zainab_hifz",
    programName: "Tahfeez Lil-Banat",
    programNameUrdu: "تحفیظ القرآن للبنات",
    programSystem: "madrassa",
    schoolClassId: null,
    schoolClassName: null,
    schoolClassNameUrdu: null,
    schoolClassFee: null,
    madrassaSubcategoryId: "hifz_1",
    madrassaSubcategoryName: "Hifz Banat Section",
    madrassaSubcategoryNameUrdu: "حفظ بنات سیکشن",
    madrassaSubcategoryFee: 2500,
    madrassaCategoryId: "hifz",
    madrassaCategoryName: "Tahfeez-ul-Quran",
    madrassaCategoryNameUrdu: "تحفیظ القرآن",
    darja: "Hifz Banat",
    guardianId: "grd-009",
    guardianName: "Hafiz Naeem Ullah",
    guardianNameUrdu: "حافظ نعیم اللہ",
    guardianPhone: "0334-5566778",
    guardianCnic: "35202-5566778-4",
    guardianEmail: "naeem@example.com",
    guardianAddress: "Township, Lahore",
    academicYearId: "ay-2026",
    system: "madrassa",
  },

  // 4. Jamia Zainab Girls School (zainab_school_support under jamia_zainab_banat)
  {
    studentId: "stu-jzs-001",
    studentName: "Maryam Siddiqui",
    studentNameUrdu: "مریم صدیقی",
    fatherName: "Salman Siddiqui", // Sibling of stu-aqa-002
    fatherNameUrdu: "سلمان صدیقی",
    gender: "female",
    dob: "2013-03-15",
    status: "active",
    enrollmentId: "enr-jzs-001",
    rollNo: "JZS-2026-401",
    admissionNo: "ADM-JZS-401",
    institutionId: "jamia_zainab_banat",
    institutionName: "Jamia Zainab School (Girls)",
    institutionNameUrdu: "جامعہ زینب اسکول (بنات)",
    programId: "zainab_school_support",
    programName: "Zainab Girls School",
    programNameUrdu: "زینب گرلز اسکول",
    programSystem: "school_support",
    schoolClassId: "class_7",
    schoolClassName: "Class 7 (Girls)",
    schoolClassNameUrdu: "جماعت ہفتم (بنات)",
    schoolSectionId: "A",
    schoolSectionName: "Section A",
    schoolClassFee: 4200,
    madrassaSubcategoryId: null,
    madrassaSubcategoryName: null,
    madrassaSubcategoryNameUrdu: null,
    madrassaSubcategoryFee: null,
    madrassaCategoryId: null,
    madrassaCategoryName: null,
    guardianId: "grd-005",
    guardianName: "Salman Siddiqui",
    guardianNameUrdu: "سلمان صدیقی",
    guardianPhone: "0301-8556677",
    guardianCnic: "35202-8556677-9",
    guardianEmail: "salman.siddiqui@example.com",
    guardianAddress: "Faisal Town, Lahore",
    academicYearId: "ay-2026",
    system: "school",
  },
  {
    studentId: "stu-jzs-002",
    studentName: "Hafsa Noor",
    studentNameUrdu: "حفصہ نور",
    fatherName: "Noor Muhammad",
    fatherNameUrdu: "نور محمد",
    gender: "female",
    dob: "2011-08-11",
    status: "active",
    enrollmentId: "enr-jzs-002",
    rollNo: "JZS-2026-402",
    admissionNo: "ADM-JZS-402",
    institutionId: "jamia_zainab_banat",
    institutionName: "Jamia Zainab School (Girls)",
    institutionNameUrdu: "جامعہ زینب اسکول (بنات)",
    programId: "zainab_school_support",
    programName: "Zainab Girls School",
    programNameUrdu: "زینب گرلز اسکول",
    programSystem: "school_support",
    schoolClassId: "class_9",
    schoolClassName: "Class 9 (Girls)",
    schoolClassNameUrdu: "جماعت نہم (بنات)",
    schoolSectionId: "A",
    schoolSectionName: "Section A",
    schoolClassFee: 4800,
    madrassaSubcategoryId: null,
    madrassaSubcategoryName: null,
    madrassaSubcategoryNameUrdu: null,
    madrassaSubcategoryFee: null,
    madrassaCategoryId: null,
    madrassaCategoryName: null,
    guardianId: "grd-010",
    guardianName: "Noor Muhammad",
    guardianNameUrdu: "نور محمد",
    guardianPhone: "0344-6677889",
    guardianCnic: "35201-6677889-6",
    guardianEmail: "noor.muhammad@example.com",
    guardianAddress: "DHA Phase 4, Lahore",
    academicYearId: "ay-2026",
    system: "school",
  },
  {
    studentId: "stu-jzs-003",
    studentName: "Amna Batool",
    studentNameUrdu: "آمنہ بتول",
    fatherName: "Syed Ali Raza",
    fatherNameUrdu: "سید علی رضا",
    gender: "female",
    dob: "2014-05-22",
    status: "active",
    enrollmentId: "enr-jzs-003",
    rollNo: "JZS-2026-403",
    admissionNo: "ADM-JZS-403",
    institutionId: "jamia_zainab_banat",
    institutionName: "Jamia Zainab School (Girls)",
    institutionNameUrdu: "جامعہ زینب اسکول (بنات)",
    programId: "zainab_school_support",
    programName: "Zainab Girls School",
    programNameUrdu: "زینب گرلز اسکول",
    programSystem: "school_support",
    schoolClassId: "class_6",
    schoolClassName: "Class 6 (Girls)",
    schoolClassNameUrdu: "جماعت ششم (بنات)",
    schoolSectionId: "A",
    schoolSectionName: "Section A",
    schoolClassFee: 4000,
    madrassaSubcategoryId: null,
    madrassaSubcategoryName: null,
    madrassaSubcategoryNameUrdu: null,
    madrassaSubcategoryFee: null,
    madrassaCategoryId: null,
    madrassaCategoryName: null,
    guardianId: "grd-011",
    guardianName: "Syed Ali Raza",
    guardianNameUrdu: "سید علی رضا",
    guardianPhone: "0315-7788990",
    guardianCnic: "35202-7788990-8",
    guardianEmail: "ali.raza@example.com",
    guardianAddress: "Cantt, Lahore",
    academicYearId: "ay-2026",
    system: "school",
  },
  {
    studentId: "stu-jzs-004",
    studentName: "Sara Fatima",
    studentNameUrdu: "سارہ فاطمہ",
    fatherName: "Kashif Mehmood", // Sibling of stu-aqa-003
    fatherNameUrdu: "کاشف محمود",
    gender: "female",
    dob: "2010-11-30",
    status: "active",
    enrollmentId: "enr-jzs-004",
    rollNo: "JZS-2026-404",
    admissionNo: "ADM-JZS-404",
    institutionId: "jamia_zainab_banat",
    institutionName: "Jamia Zainab School (Girls)",
    institutionNameUrdu: "جامعہ زینب اسکول (بنات)",
    programId: "zainab_school_support",
    programName: "Zainab Girls School",
    programNameUrdu: "زینب گرلز اسکول",
    programSystem: "school_support",
    schoolClassId: "class_10",
    schoolClassName: "Class 10 (Girls)",
    schoolClassNameUrdu: "جماعت دہم (بنات)",
    schoolSectionId: "A",
    schoolSectionName: "Section A",
    schoolClassFee: 5200,
    madrassaSubcategoryId: null,
    madrassaSubcategoryName: null,
    madrassaSubcategoryNameUrdu: null,
    madrassaSubcategoryFee: null,
    madrassaCategoryId: null,
    madrassaCategoryName: null,
    guardianId: "grd-006",
    guardianName: "Kashif Mehmood",
    guardianNameUrdu: "کاشف محمود",
    guardianPhone: "0312-9667788",
    guardianCnic: "35201-9667788-1",
    guardianEmail: "kashif.mehmood@example.com",
    guardianAddress: "Wapda Town, Lahore",
    academicYearId: "ay-2026",
    system: "school",
  },
];

function buildInitialStoreData(): FeeStoreData {
  const charges: StoredFeeCharge[] = [];
  const payments: StoredFeePayment[] = [];
  const allocations: StoredFeeAllocation[] = [];
  const adjustments: StoredFeeAdjustment[] = [];

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const curPeriod = `${curYear}-${String(curMonth).padStart(2, "0")}`;

  SEED_STUDENTS.forEach((student) => {
    const monthlyFeePaisa =
      student.system === "madrassa"
        ? (student.madrassaSubcategoryFee ?? 2500) * 100
        : (student.schoolClassFee ?? 4500) * 100;

    const curChargeId = `chg-cur-${student.studentId}`;
    const curDate = `${curPeriod}-01T08:00:00.000Z`;
    const curDueDate = `${curPeriod}-10T00:00:00.000Z`;

    charges.push({
      id: curChargeId,
      studentId: student.studentId,
      enrollmentId: student.enrollmentId,
      institutionId: student.institutionId,
      programId: student.programId,
      schoolClassId: student.schoolClassId,
      madrassaSubcategoryId: student.madrassaSubcategoryId,
      type: "monthly",
      label: `Monthly Fee (${curPeriod})`,
      period: curPeriod,
      amountPaisa: monthlyFeePaisa,
      dueDate: curDueDate,
      status: "open", // All fees are initially unpaid
      notes: "Current month tuition fee",
      metadata: null,
      createdByUserId: "super-admin",
      reversedAt: null,
      reversedByUserId: null,
      createdAt: curDate,
      updatedAt: curDate,
    });
  });

  return {
    students: SEED_STUDENTS.map((s) => ({ ...s })),
    charges,
    payments,
    allocations,
    adjustments,
  };
}

let memoryStore: FeeStoreData | null = null;

function getStoreFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "finance-student-ledgers.json"),
    path.join(process.cwd(), ".output", "public", "finance-student-ledgers.json"),
  ];
}

export function loadFeeStore(): FeeStoreData {
  for (const filePath of getStoreFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as FeeStoreData;
        if (parsed && Array.isArray(parsed.students) && parsed.students.length > 0) {
          memoryStore = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  if (memoryStore) return memoryStore;
  const initial = buildInitialStoreData();
  memoryStore = initial;
  saveFeeStore(initial);
  return initial;
}

export function saveFeeStore(data: FeeStoreData): void {
  memoryStore = data;
  const serialized = JSON.stringify(data, null, 2);
  for (const filePath of getStoreFilePaths()) {
    try {
      const dir = path.dirname(filePath);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(filePath, serialized, "utf-8");
      }
    } catch {
      // ignore
    }
  }
}

export function getInstitutionDisplayInfo(institutionId: string, programId?: string | null, system?: string) {
  if (institutionId === "jamia_qasmia_baneen") {
    return {
      institutionKey: "qasimia_madrassa",
      institutionName: "Jamia Qasimia Lil-Baneen",
      institutionNameUrdu: "جامعہ قاسمیہ للبنین",
      systemLabel: "Jamia Qasimia (Boys Madrassa)",
      system: "madrassa" as const,
    };
  }
  if (institutionId === "al_qasim_academy") {
    return {
      institutionKey: "qasim_academy",
      institutionName: "Al-Qasim Academy",
      institutionNameUrdu: "القاسم اکیڈمی (اسکول)",
      systemLabel: "Al-Qasim Academy (Boys School)",
      system: "school" as const,
    };
  }
  if (
    institutionId === "jamia_zainab_banat" &&
    (programId === "zainab_school_support" || system === "school" || system === "school_support")
  ) {
    return {
      institutionKey: "zainab_school",
      institutionName: "Jamia Zainab School (Girls)",
      institutionNameUrdu: "جامعہ زینب اسکول (بنات)",
      systemLabel: "Jamia Zainab School (Girls School)",
      system: "school" as const,
    };
  }
  return {
    institutionKey: "zainab_madrassa",
    institutionName: "Jamia Zainab Lil-Banat",
    institutionNameUrdu: "جامعہ زینب للبنات",
    systemLabel: "Jamia Zainab (Girls Madrassa)",
    system: "madrassa" as const,
  };
}

export function updateFeePaymentStatusInFile(
  paymentId: string,
  receiptNo: string,
  newStatus: "reversed" | "refunded" | "partially_refunded",
  refundedPaisa?: number,
) {
  const paths = [
    path.join(process.cwd(), "public", "finance-fee-payments.json"),
    path.join(process.cwd(), ".output", "public", "finance-fee-payments.json"),
  ];
  for (const p of paths) {
    try {
      if (!fs.existsSync(p)) continue;
      const list = JSON.parse(fs.readFileSync(p, "utf-8"));
      if (!Array.isArray(list)) continue;
      let changed = false;
      const updated = list
        .map((item: any) => {
          if (item.id === paymentId || item.voucherNo === receiptNo || item.reference === receiptNo) {
            changed = true;
            if (newStatus === "reversed" || newStatus === "refunded") {
              return { ...item, status: "cancelled", amount: 0 };
            }
            if (newStatus === "partially_refunded" && refundedPaisa) {
              const nextAmt = Math.max(0, Number(item.amount || 0) - Math.round(refundedPaisa / 100));
              return { ...item, amount: nextAmt };
            }
          }
          return item;
        })
        .filter((item: any) => item.status !== "cancelled" && Number(item.amount || 0) > 0);
      if (changed) {
        fs.writeFileSync(p, JSON.stringify(updated, null, 2), "utf-8");
      }
    } catch {
      // ignore
    }
  }
}

export function toDateLedgerInput(store: FeeStoreData, studentIds?: string[]) {
  const idSet = studentIds ? new Set(studentIds) : null;
  const charges = store.charges
    .filter((c) => !idSet || idSet.has(c.studentId))
    .map((c) => ({
      ...c,
      dueDate: c.dueDate ? new Date(c.dueDate) : null,
      reversedAt: c.reversedAt ? new Date(c.reversedAt) : null,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    }));
  const payments = store.payments
    .filter((p) => !idSet || idSet.has(p.studentId))
    .map((p) => ({
      ...p,
      receivedAt: new Date(p.receivedAt),
      reversedAt: p.reversedAt ? new Date(p.reversedAt) : null,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  const chargeIdSet = new Set(charges.map((c) => c.id));
  const paymentIdSet = new Set(payments.map((p) => p.id));
  const allocations = store.allocations
    .filter((a) => chargeIdSet.has(a.chargeId) || paymentIdSet.has(a.paymentId))
    .map((a) => ({
      ...a,
      createdAt: new Date(a.createdAt),
    }));
  const adjustments = store.adjustments
    .filter((adj) => !idSet || idSet.has(adj.studentId))
    .map((adj) => ({
      ...adj,
      createdAt: new Date(adj.createdAt),
    }));

  return { charges, payments, allocations, adjustments };
}

export function getStudentFeeSummaryFromStore(studentId: string): StudentLedgerSummary {
  const store = loadFeeStore();
  const ledgerInput = toDateLedgerInput(store, [studentId]);
  return summarizeStudentLedger(ledgerInput);
}
