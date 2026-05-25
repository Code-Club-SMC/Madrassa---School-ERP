import type { SalarySlip, Teacher } from "@/types";

export const teachers: Teacher[] = [
  {
    id: "T1", name: "Hafiz Bilal Ahmad", nameUrdu: "حافظ بلال احمد",
    designation: "hafiz", qualification: "Hifz-ul-Quran, Tajweed",
    qualificationUrdu: "حفظ القرآن، تجوید",
    subjects: ["sub-tajweed"], system: "madrassa", phone: "0300-1234567",
    cnic: "35202-1111111-1", address: "Township, Lahore",
    joinedAt: "2022-04-01", monthlySalaryPaisa: 45_000_00,
    bankName: "Meezan Bank", bankAccount: "PK36MEZN0000001234567890",
    active: true,
  },
  {
    id: "T2", name: "Maulana Imran Hussain", nameUrdu: "مولانا عمران حسین",
    designation: "mudarris", qualification: "Alimiyyah (Wifaq), Specialization in Fiqh",
    qualificationUrdu: "عالمیہ (وفاق)، تخصص فی الفقہ",
    subjects: ["sub-fiqh", "sub-usul-fiqh"], system: "madrassa", phone: "0301-2345678",
    cnic: "35202-2222222-2", address: "Garden Town, Lahore",
    joinedAt: "2021-08-15", monthlySalaryPaisa: 65_000_00,
    bankName: "Bank Alfalah", bankAccount: "PK24BAFL0000002345678901",
    active: true,
  },
  {
    id: "T3", name: "Sir Adeel Akhtar", nameUrdu: "سر عدیل اختر",
    designation: "subject_teacher", qualification: "MSc Mathematics, B.Ed",
    qualificationUrdu: "ایم ایس سی ریاضی، بی ایڈ",
    subjects: ["sub-math", "sub-physics"], system: "school", phone: "0302-3456789",
    cnic: "35202-3333333-3", address: "Model Town, Lahore",
    joinedAt: "2023-01-10", monthlySalaryPaisa: 55_000_00,
    bankName: "HBL", bankAccount: "PK11HABB0000003456789012",
    active: true,
  },
  {
    id: "T4", name: "Miss Ayesha Tariq", nameUrdu: "مس عائشہ طارق",
    designation: "subject_teacher", qualification: "MA English, M.Ed",
    qualificationUrdu: "ایم اے انگریزی، ایم ایڈ",
    subjects: ["sub-english"], system: "school", phone: "0303-4567890",
    cnic: "35202-4444444-4", address: "DHA Phase 5, Lahore",
    joinedAt: "2022-11-22", monthlySalaryPaisa: 50_000_00,
    bankName: "UBL", bankAccount: "PK45UNIL0000004567890123",
    active: true,
  },
  {
    id: "T5", name: "Qari Saleem Raza", nameUrdu: "قاری سلیم رضا",
    designation: "qari", qualification: "Saba Qira'at, Tajweed",
    qualificationUrdu: "سبع قراءات، تجوید",
    subjects: ["sub-tajweed", "sub-quran"], system: "madrassa", phone: "0304-5678901",
    cnic: "35202-5555555-5", address: "Shahdara, Lahore",
    joinedAt: "2020-06-05", monthlySalaryPaisa: 40_000_00,
    bankName: "Meezan Bank", bankAccount: "PK36MEZN0000005678901234",
    active: true,
  },
  {
    id: "T6", name: "Sir Faisal Khan", nameUrdu: "سر فیصل خان",
    designation: "subject_teacher", qualification: "MSc Chemistry",
    qualificationUrdu: "ایم ایس سی کیمیا",
    subjects: ["sub-chem", "sub-bio"], system: "school", phone: "0305-6789012",
    cnic: "35202-6666666-6", address: "Johar Town, Lahore",
    joinedAt: "2023-04-01", monthlySalaryPaisa: 52_000_00,
    bankName: "Faysal Bank", bankAccount: "PK67FAYS0000006789012345",
    active: true,
  },
  {
    id: "T7", name: "Madam Nazia Aslam", nameUrdu: "میڈم نازیہ اسلم",
    designation: "subject_teacher", qualification: "MA Urdu, B.Ed",
    qualificationUrdu: "ایم اے اردو، بی ایڈ",
    subjects: ["sub-urdu", "sub-islamiat"], system: "school", phone: "0306-7890123",
    cnic: "35202-7777777-7", address: "Iqbal Town, Lahore",
    joinedAt: "2021-09-15", monthlySalaryPaisa: 48_000_00,
    bankName: "MCB", bankAccount: "PK88MUCB0000007890123456",
    active: true,
  },
  {
    id: "T8", name: "Mufti Abdul Wahab", nameUrdu: "مفتی عبدالوہاب",
    designation: "mudarris", qualification: "Alimiyyah, Takhassus fi al-Ifta",
    qualificationUrdu: "عالمیہ، تخصص فی الافتاء",
    subjects: ["sub-fiqh", "sub-hadith"], system: "madrassa", phone: "0307-8901234",
    cnic: "35202-8888888-8", address: "Sabzazar, Lahore",
    joinedAt: "2019-04-01", monthlySalaryPaisa: 70_000_00,
    bankName: "Meezan Bank", bankAccount: "PK36MEZN0000008901234567",
    active: true,
  },
  {
    id: "T9", name: "Sir Tariq Mehmood", nameUrdu: "سر طارق محمود",
    designation: "principal", qualification: "MA Education, M.Phil",
    qualificationUrdu: "ایم اے ایجوکیشن، ایم فل",
    subjects: [], system: "school", phone: "0308-9012345",
    cnic: "35202-9999999-9", address: "Cantt, Lahore",
    joinedAt: "2018-01-01", monthlySalaryPaisa: 90_000_00,
    bankName: "Bank Alfalah", bankAccount: "PK24BAFL0000009012345678",
    active: true,
  },
  {
    id: "T10", name: "Hafiz Junaid Iqbal", nameUrdu: "حافظ جنید اقبال",
    designation: "hafiz", qualification: "Hifz-ul-Quran",
    qualificationUrdu: "حافظ القرآن",
    subjects: ["sub-quran"], system: "madrassa", phone: "0310-0123456",
    cnic: "35202-0000000-0", address: "Walled City, Lahore",
    joinedAt: "2023-09-01", monthlySalaryPaisa: 38_000_00,
    bankName: "Allied Bank", bankAccount: "PK19ABPA0000000123456789",
    active: true,
  },
  {
    id: "T11", name: "Miss Hira Mehmood", nameUrdu: "مس حرا محمود",
    designation: "subject_teacher", qualification: "BSc Computer Science",
    qualificationUrdu: "بی ایس کمپیوٹر سائنس",
    subjects: ["sub-comp"], system: "school", phone: "0311-1234567",
    cnic: "35202-0011001-1", address: "Wapda Town, Lahore",
    joinedAt: "2024-04-01", monthlySalaryPaisa: 45_000_00,
    bankName: "UBL", bankAccount: "PK45UNIL0000001100110011",
    active: true,
  },
  {
    id: "T12", name: "Ustaad Naeem Akhtar", nameUrdu: "استاد نعیم اختر",
    designation: "ustaad", qualification: "Sanawiyya Khasa",
    qualificationUrdu: "ثانویہ خاصہ",
    subjects: ["sub-sarf", "sub-nahw"], system: "madrassa", phone: "0312-2345678",
    cnic: "35202-0022002-2", address: "Misri Shah, Lahore",
    joinedAt: "2022-08-01", monthlySalaryPaisa: 35_000_00,
    active: false,
  },
  {
    id: "T13", name: "Sir Akhtar Hussain", nameUrdu: "سر اختر حسین",
    designation: "sports", qualification: "Diploma in Sports",
    qualificationUrdu: "ڈپلومہ کھیل",
    subjects: [], system: "school", phone: "0313-3456789",
    cnic: "35202-0033003-3", address: "Mughalpura, Lahore",
    joinedAt: "2023-04-01", monthlySalaryPaisa: 32_000_00,
    active: true,
  },
  {
    id: "T14", name: "Mufti Zubair Anwar", nameUrdu: "مفتی زبیر انور",
    designation: "mudarris", qualification: "Takhassus fi al-Hadith",
    qualificationUrdu: "تخصص فی الحدیث",
    subjects: ["sub-hadith", "sub-tafseer"], system: "madrassa", phone: "0314-4567890",
    cnic: "35202-0044004-4", address: "Multan Road, Lahore",
    joinedAt: "2020-09-01", monthlySalaryPaisa: 60_000_00,
    bankName: "Meezan Bank", bankAccount: "PK36MEZN0000004400440044",
    active: true,
  },
  {
    id: "T15", name: "Madam Sumera Ali", nameUrdu: "میڈم سمیرا علی",
    designation: "assistant", qualification: "BA, Diploma in Childcare",
    qualificationUrdu: "بی اے، چائلڈ کیئر ڈپلومہ",
    subjects: [], system: "school", phone: "0315-5678901",
    cnic: "35202-0055005-5", address: "Samanabad, Lahore",
    joinedAt: "2024-01-15", monthlySalaryPaisa: 28_000_00,
    active: true,
  },
];

export const teachersById = Object.fromEntries(teachers.map((t) => [t.id, t]));

/** Generate salary slips for the last N months for every active teacher. */
export function generateSalarySlips(months = 3): SalarySlip[] {
  const slips: SalarySlip[] = [];
  const now = new Date();
  for (const t of teachers) {
    if (!t.active) continue;
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const allowances = Math.round(t.monthlySalaryPaisa * 0.08);
      const deductions = i === 0 ? 0 : Math.round(t.monthlySalaryPaisa * 0.03);
      const net = t.monthlySalaryPaisa + allowances - deductions;
      slips.push({
        id: `slip-${t.id}-${month}`,
        teacherId: t.id,
        month,
        baseSalaryPaisa: t.monthlySalaryPaisa,
        allowancesPaisa: allowances,
        deductionsPaisa: deductions,
        netPaisa: net,
        paidOn: i === 0 ? undefined : new Date(d.getFullYear(), d.getMonth(), 28).toISOString(),
        paymentMethod: t.bankAccount ? "bank" : "cash",
      });
    }
  }
  return slips;
}

export const salarySlips = generateSalarySlips();