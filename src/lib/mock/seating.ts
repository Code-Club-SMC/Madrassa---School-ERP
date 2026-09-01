import type { SeatingStudent } from "@/lib/seating";

export type MockHall = { id: string; name: string; rows: number; cols: number };

export const mockGrades: { id: number; label: string }[] = [
  { id: 1, label: "Grade 6" },
  { id: 2, label: "Grade 7" },
  { id: 3, label: "Grade 8" },
  { id: 4, label: "Grade 9" },
  { id: 5, label: "Grade 10" },
];

export const mockHalls: MockHall[] = [
  { id: "hall-a", name: "Hall A — Ground Floor", rows: 6, cols: 8 },
  { id: "hall-b", name: "Hall B — First Floor", rows: 5, cols: 7 },
  { id: "hall-c", name: "Hall C — Library Wing", rows: 5, cols: 6 },
  { id: "hall-d", name: "Hall D — Annex", rows: 4, cols: 6 },
];

const FIRST_NAMES = ["Muhammad", "Ahmad", "Ali", "Bilal", "Hassan", "Hussain", "Umar", "Usman", "Zain", "Yusuf", "Ibrahim", "Ismail", "Hamza", "Talha", "Saad", "Owais"];
const LAST_NAMES = ["Khan", "Ahmed", "Raza", "Hussain", "Iqbal", "Malik", "Sheikh", "Qureshi", "Siddiqui", "Abbasi", "Awan", "Tariq"];

function makeStudent(idx: number, gradeId: number, gradeLabel: string): SeatingStudent {
  const fn = FIRST_NAMES[idx % FIRST_NAMES.length];
  const ln = LAST_NAMES[(idx * 3) % LAST_NAMES.length];
  const classId = `class-${gradeId}`;
  return {
    id: `stu-${gradeId}-${idx}`,
    name: `${fn} ${ln}`,
    rollNo: `R-${gradeId}${String(idx + 1).padStart(3, "0")}`,
    gradeId,
    gradeLabel,
    classId,
    className: gradeLabel,
  };
}

// Distribute round-robin across halls so every hall has a balanced mix per grade.
export function buildMockStudentsForHalls(halls: MockHall[]): Record<string, SeatingStudent[]> {
  const perHall: Record<string, SeatingStudent[]> = {};
  for (const h of halls) perHall[h.id] = [];

  // approximate: ~80% capacity for each hall
  const capacities = halls.map((h) => Math.floor(h.rows * h.cols * 0.85));
  const perGradeCounts: Record<number, number> = {};
  mockGrades.forEach((g) => (perGradeCounts[g.id] = 0));

  const totalSeats = capacities.reduce((a, b) => a + b, 0);
  // pre-create students for each grade, evenly
  const perGrade = Math.ceil(totalSeats / mockGrades.length);

  const pool: SeatingStudent[] = [];
  for (const g of mockGrades) {
    for (let i = 0; i < perGrade; i++) {
      pool.push(makeStudent(i, g.id, g.label));
    }
  }

  // round-robin by grade across halls
  const hallIdx: Record<string, number> = {};
  let cursor = 0;
  for (const s of pool) {
    // pick next hall with remaining capacity
    for (let i = 0; i < halls.length; i++) {
      const h = halls[(cursor + i) % halls.length];
      if (perHall[h.id].length < capacities[(cursor + i) % halls.length]) {
        perHall[h.id].push(s);
        cursor = (cursor + 1) % halls.length;
        break;
      }
    }
  }
  // capture used to avoid lint
  void hallIdx;
  return perHall;
}

export const mockStudentsPerHall = buildMockStudentsForHalls(mockHalls);