import fs from "node:fs";
import path from "node:path";

export type ConcessionReason = "orphan" | "hardship" | "merit" | "sibling" | "staff_child" | "other";

export type SystemKey =
  | "qasimia_madrassa"
  | "zainab_madrassa"
  | "qasim_academy"
  | "zainab_school";

export interface Concession {
  id: string;
  studentId: string;
  studentName?: string;
  studentNameUrdu?: string;
  fatherName?: string;
  rollNo?: string;
  systemKey?: SystemKey;
  systemName?: string;
  systemNameUrdu?: string;
  classId?: string;
  className?: string;
  classNameUrdu?: string;
  monthlyFeePaisa?: number;
  reason: ConcessionReason;
  reasonUrdu: string;
  percent: number;
  approvedBy: string;
  active: boolean;
  notes?: string;
  createdAt?: string;
}

export interface ConcessionsSummary {
  totalCount: number;
  activeCount: number;
  orphansCount: number;
  scholarshipsCount: number;
  totalMonthlyWaivedPaisa: number;
}

const DEFAULT_CONCESSIONS: Concession[] = [
  {
    id: "c-101",
    studentId: "stu_demo_01",
    studentName: "Muhammad Bilal",
    studentNameUrdu: "محمد بلال",
    rollNo: "DN-101",
    fatherName: "Abdur Rahman",
    systemKey: "qasimia_madrassa",
    systemName: "Jamia Qasmia (Madrassa - Boys)",
    systemNameUrdu: "جامعہ قاسمیہ للبنین (مدرسہ)",
    className: "Dars-e-Nizami (Awwala)",
    classNameUrdu: "درس نظامی اولیٰ",
    monthlyFeePaisa: 250000,
    reason: "orphan",
    reasonUrdu: "یتیم",
    percent: 100,
    approvedBy: "Principal / مہتمم",
    active: true,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "c-102",
    studentId: "stu_demo_02",
    studentName: "Hamza Farooq",
    studentNameUrdu: "حمزہ فاروق",
    rollNo: "SCH-204",
    fatherName: "Farooq Ahmad",
    systemKey: "qasim_academy",
    systemName: "Al-Qasim Academy (School - Boys)",
    systemNameUrdu: "القاسم اکیڈمی (سکول)",
    className: "Class 6",
    classNameUrdu: "ششم",
    monthlyFeePaisa: 200000,
    reason: "sibling",
    reasonUrdu: "بھائی بہن رعایت",
    percent: 25,
    approvedBy: "Accountant / اکاؤنٹنٹ",
    active: true,
    createdAt: "2026-05-02T00:00:00.000Z",
  },
  {
    id: "c-103",
    studentId: "stu_demo_03",
    studentName: "Fatima Zahra",
    studentNameUrdu: "فاطمہ زہرا",
    rollNo: "ZDN-302",
    fatherName: "Tariq Mahmood",
    systemKey: "zainab_madrassa",
    systemName: "Jamia Zainab (Madrassa - Girls)",
    systemNameUrdu: "جامعہ زینب للبنات (مدرسہ)",
    className: "Dars-e-Nizami (Saniya)",
    classNameUrdu: "درس نظامی ثانیہ",
    monthlyFeePaisa: 220000,
    reason: "merit",
    reasonUrdu: "وظیفہ",
    percent: 50,
    approvedBy: "Admin / منتظم",
    active: true,
    createdAt: "2026-05-03T00:00:00.000Z",
  },
];

let memoryConcessions: Concession[] | null = null;

function getDataFilePaths(): string[] {
  return [
    path.join(process.cwd(), "public", "finance-concessions.json"),
    path.join(process.cwd(), ".output", "public", "finance-concessions.json"),
    path.join(process.cwd(), ".vercel", "output", "static", "finance-concessions.json"),
  ];
}

function readFromFile(): Concession[] | null {
  for (const filePath of getDataFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed as Concession[];
        }
      }
    } catch {
      // try next path
    }
  }
  return null;
}

function writeToFile(concessions: Concession[]) {
  for (const filePath of getDataFilePaths()) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(concessions, null, 2), "utf-8");
    } catch {
      // ignore errors for secondary paths
    }
  }
}

export function computeConcessionsSummary(items: Concession[]): ConcessionsSummary {
  const activeItems = items.filter((i) => i.active);
  const totalMonthlyWaivedPaisa = activeItems.reduce((sum, c) => {
    const fee = c.monthlyFeePaisa ?? 200000;
    return sum + Math.round((fee * c.percent) / 100);
  }, 0);

  return {
    totalCount: items.length,
    activeCount: activeItems.length,
    orphansCount: items.filter((i) => i.reason === "orphan" && i.active).length,
    scholarshipsCount: items.filter((i) => i.reason === "merit" && i.active).length,
    totalMonthlyWaivedPaisa,
  };
}

export function listConcessions(): Concession[] {
  if (memoryConcessions !== null) {
    return memoryConcessions;
  }

  const fromFile = readFromFile();
  if (fromFile !== null) {
    memoryConcessions = fromFile;
    return memoryConcessions;
  }

  // Initial clean state is empty if finance has been reset
  memoryConcessions = [];
  writeToFile(memoryConcessions);
  return memoryConcessions;
}

export function saveConcession(input: Partial<Concession> & { studentId: string; reason: ConcessionReason; percent: number }): Concession {
  const current = listConcessions();
  const id = input.id || `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const existingIndex = current.findIndex((c) => c.id === id);

  const concession: Concession = {
    id,
    studentId: input.studentId,
    studentName: input.studentName || input.studentId,
    studentNameUrdu: input.studentNameUrdu,
    fatherName: input.fatherName,
    rollNo: input.rollNo,
    systemKey: input.systemKey,
    systemName: input.systemName,
    systemNameUrdu: input.systemNameUrdu,
    classId: input.classId,
    className: input.className,
    classNameUrdu: input.classNameUrdu,
    monthlyFeePaisa: input.monthlyFeePaisa ?? 200000,
    reason: input.reason,
    reasonUrdu: input.reasonUrdu || input.reason,
    percent: input.percent,
    approvedBy: input.approvedBy || "Admin / منتظم",
    active: input.active !== false,
    notes: input.notes,
    createdAt: input.createdAt || new Date().toISOString(),
  };

  let updated: Concession[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = concession;
  } else {
    updated = [concession, ...current];
  }

  memoryConcessions = updated;
  writeToFile(updated);
  return concession;
}

export function deleteConcession(id: string): boolean {
  const current = listConcessions();
  const filtered = current.filter((c) => c.id !== id);
  memoryConcessions = filtered;
  writeToFile(filtered);
  return true;
}

export function deleteAllConcessions(): boolean {
  memoryConcessions = [];
  writeToFile([]);
  return true;
}

export function resetConcessionsToDefault(): Concession[] {
  memoryConcessions = [...DEFAULT_CONCESSIONS];
  writeToFile(memoryConcessions);
  return memoryConcessions;
}
