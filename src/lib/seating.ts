export type SeatingStudent = {
  id: string;
  name: string;
  rollNo: string;
  gradeId: number;
  gradeLabel: string;
  classId: string;
  className: string;
};

export type SeatGrid = (SeatingStudent | null)[][];

export type HallSeating = {
  hallId: string;
  hallName: string;
  rows: number;
  cols: number;
  students: SeatingStudent[];
  grid: SeatGrid;
  rowStep: number;
  colPeriod: number;
  feasible: boolean;
};

export type SeatingConfig = {
  gap: number;
  rows: number;
  cols: number;
  aisleEveryRow: number;
  aisleEveryCol: number;
  cellSizePx: number;
};

export type SeatingMode = "alam" | "mixed";

export function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function findRowStep(numGrades: number, gap: number): { step: number; period: number } {
  let best = 1;
  let bestP = 1;
  for (let s = 1; s < numGrades; s++) {
    const p = numGrades / gcd(s, numGrades);
    if (p > bestP) {
      best = s;
      bestP = p;
    }
    if (p > gap) return { step: s, period: p };
  }
  return { step: best, period: bestP };
}

export function canPlaceGreedy(
  grid: SeatGrid,
  r: number,
  c: number,
  student: SeatingStudent,
  gap: number,
  sameClass: (a: SeatingStudent, b: SeatingStudent) => boolean,
): boolean {
  for (let dc = 1; dc <= gap; dc++) {
    if (c - dc >= 0 && grid[r][c - dc] && sameClass(student, grid[r][c - dc]!)) return false;
  }
  for (let dr = 1; dr <= gap; dr++) {
    if (r - dr >= 0 && grid[r - dr][c] && sameClass(student, grid[r - dr][c]!)) return false;
  }
  return true;
}

export function countViolations(
  grid: SeatGrid,
  rows: number,
  cols: number,
  gap: number,
  sameClass: (a: SeatingStudent, b: SeatingStudent) => boolean,
): number {
  let count = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const s = grid[r][c];
      if (!s) continue;
      for (let dc = 1; dc <= gap; dc++) {
        if (c + dc < cols && grid[r][c + dc] && sameClass(s, grid[r][c + dc]!)) count++;
      }
      for (let dr = 1; dr <= gap; dr++) {
        if (r + dr < rows && grid[r + dr][c] && sameClass(s, grid[r + dr][c]!)) count++;
      }
    }
  return count;
}

export function seededRandom(seed: string | number): () => number {
  let hash = 2166136261;
  const value = String(seed);

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let t = hash;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], seed?: string | number): T[] {
  const random = seed === undefined ? Math.random : seededRandom(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isViolation(grid: SeatGrid, r: number, c: number, gap: number, sameClass: (a: SeatingStudent, b: SeatingStudent) => boolean): boolean {
  const s = grid[r][c];
  if (!s) return false;
  const rows = grid.length;
  const cols = grid[0].length;
  for (let dc = 1; dc <= gap; dc++) {
    if (c - dc >= 0 && grid[r][c - dc] && sameClass(s, grid[r][c - dc]!)) return true;
    if (c + dc < cols && grid[r][c + dc] && sameClass(s, grid[r][c + dc]!)) return true;
  }
  for (let dr = 1; dr <= gap; dr++) {
    if (r - dr >= 0 && grid[r - dr][c] && sameClass(s, grid[r - dr][c]!)) return true;
    if (r + dr < rows && grid[r + dr][c] && sameClass(s, grid[r + dr][c]!)) return true;
  }
  return false;
}

const sameGradeId = (a: SeatingStudent, b: SeatingStudent) => a.gradeId === b.gradeId;
const sameClassId = (a: SeatingStudent, b: SeatingStudent) => a.classId === b.classId;

export function buildHallSeating(
  hallId: string,
  hallName: string,
  rows: number,
  cols: number,
  students: SeatingStudent[],
  gap: number,
  seed?: string | number,
): HallSeating {
  return buildHallSeatingMode(hallId, hallName, rows, cols, students, gap, seed, "alam", sameGradeId);
}

export function buildHallSeatingMode(
  hallId: string,
  hallName: string,
  rows: number,
  cols: number,
  students: SeatingStudent[],
  gap: number,
  seed: string | number | undefined,
  mode: SeatingMode,
  sameClass: (a: SeatingStudent, b: SeatingStudent) => boolean,
): HallSeating {
  const grades = Array.from(new Set(students.map((s) => s.gradeId))).sort((a, b) => a - b);
  const numGrades = grades.length || 1;
  const { step: rowStep, period: colPeriod } = findRowStep(numGrades, gap);
  const feasible = gap < numGrades;

  const buckets: Record<number, SeatingStudent[]> = {};
  for (const g of grades) buckets[g] = [];
  for (const s of students) buckets[s.gradeId].push(s);
  for (const g of grades)
    buckets[g] = shuffle(buckets[g], seed === undefined ? undefined : `${seed}:${g}`);

  const grid: SeatGrid = Array.from({ length: rows }, () =>
    Array<SeatingStudent | null>(cols).fill(null),
  );

  const overflowCells: { r: number; c: number; preferredGradeIdx: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const slotIdx = (r * rowStep + c) % numGrades;
      const gid = grades[slotIdx];
      const bucket = buckets[gid];
      if (bucket && bucket.length > 0) {
        const student = bucket.shift()!;
        if (canPlaceGreedy(grid, r, c, student, gap, sameClass)) {
          grid[r][c] = student;
        } else {
          overflowCells.push({ r, c, preferredGradeIdx: slotIdx });
        }
      } else {
        overflowCells.push({ r, c, preferredGradeIdx: slotIdx });
      }
    }
  }

  const leftover: SeatingStudent[] = [];
  for (const g of grades) leftover.push(...buckets[g]);

  for (const cell of overflowCells) {
    if (leftover.length === 0) break;
    let pickIdx = -1;
    for (let i = 0; i < leftover.length; i++) {
      if (canPlaceGreedy(grid, cell.r, cell.c, leftover[i], gap, sameClass)) {
        pickIdx = i;
        break;
      }
    }
    if (pickIdx === -1) pickIdx = 0;
    grid[cell.r][cell.c] = leftover.splice(pickIdx, 1)[0];
  }

  return { hallId, hallName, rows, cols, students, grid, rowStep, colPeriod, feasible };
}

export function buildMixedHallSeating(
  hallId: string,
  hallName: string,
  rows: number,
  cols: number,
  students: SeatingStudent[],
  gap: number,
  seed: string | number | undefined,
): HallSeating {
  const shuffled = shuffle(students, seed);
  const grid: SeatGrid = Array.from({ length: rows }, () =>
    Array<SeatingStudent | null>(cols).fill(null),
  );

  const remaining = [...shuffled];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (remaining.length === 0) break;
      let pickIdx = -1;
      for (let i = 0; i < remaining.length; i++) {
        if (canPlaceGreedy(grid, r, c, remaining[i], gap, sameClassId)) {
          pickIdx = i;
          break;
        }
      }
      if (pickIdx === -1) pickIdx = 0;
      grid[r][c] = remaining.splice(pickIdx, 1)[0];
    }
  }

  const violationCount = countViolations(grid, rows, cols, gap, sameClassId);
  return { hallId, hallName, rows, cols, students: shuffled, grid, rowStep: 0, colPeriod: 0, feasible: true };
}
