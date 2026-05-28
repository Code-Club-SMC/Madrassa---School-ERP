export type SeatingStudent = {
  id: string;
  name: string;
  rollNo: string;
  gradeId: number;
  gradeLabel: string;
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
  gradeId: number,
  gap: number,
): boolean {
  for (let dc = 1; dc <= gap; dc++)
    if (c - dc >= 0 && grid[r][c - dc]?.gradeId === gradeId) return false;
  for (let dr = 1; dr <= gap; dr++)
    if (r - dr >= 0 && grid[r - dr][c]?.gradeId === gradeId) return false;
  return true;
}

export function countViolations(
  grid: SeatGrid,
  rows: number,
  cols: number,
  gap: number,
): number {
  let count = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const s = grid[r][c];
      if (!s) continue;
      for (let dc = 1; dc <= gap; dc++)
        if (c + dc < cols && grid[r][c + dc]?.gradeId === s.gradeId) count++;
      for (let dr = 1; dr <= gap; dr++)
        if (r + dr < rows && grid[r + dr][c]?.gradeId === s.gradeId) count++;
    }
  return count;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isViolation(
  grid: SeatGrid,
  r: number,
  c: number,
  gap: number,
): boolean {
  const s = grid[r][c];
  if (!s) return false;
  const rows = grid.length;
  const cols = grid[0].length;
  for (let dc = 1; dc <= gap; dc++) {
    if (c - dc >= 0 && grid[r][c - dc]?.gradeId === s.gradeId) return true;
    if (c + dc < cols && grid[r][c + dc]?.gradeId === s.gradeId) return true;
  }
  for (let dr = 1; dr <= gap; dr++) {
    if (r - dr >= 0 && grid[r - dr][c]?.gradeId === s.gradeId) return true;
    if (r + dr < rows && grid[r + dr][c]?.gradeId === s.gradeId) return true;
  }
  return false;
}

export function buildHallSeating(
  hallId: string,
  hallName: string,
  rows: number,
  cols: number,
  students: SeatingStudent[],
  gap: number,
): HallSeating {
  const grades = Array.from(new Set(students.map((s) => s.gradeId))).sort((a, b) => a - b);
  const numGrades = grades.length || 1;
  const { step: rowStep, period: colPeriod } = findRowStep(numGrades, gap);
  const feasible = gap < numGrades;

  // bucket and shuffle students per grade
  const buckets: Record<number, SeatingStudent[]> = {};
  for (const g of grades) buckets[g] = [];
  for (const s of students) buckets[s.gradeId].push(s);
  for (const g of grades) buckets[g] = shuffle(buckets[g]);

  // create grid
  const grid: SeatGrid = Array.from({ length: rows }, () => Array<SeatingStudent | null>(cols).fill(null));

  // overflow holder: cells we want to fill later
  const overflowCells: { r: number; c: number; preferredGradeIdx: number }[] = [];

  // 1) try to place by designated slot
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const slotIdx = (r * rowStep + c) % numGrades;
      const gid = grades[slotIdx];
      const bucket = buckets[gid];
      if (bucket && bucket.length > 0) {
        grid[r][c] = bucket.shift()!;
      } else {
        overflowCells.push({ r, c, preferredGradeIdx: slotIdx });
      }
    }
  }

  // 2) greedy fill remaining cells from leftover students
  const leftover: SeatingStudent[] = [];
  for (const g of grades) leftover.push(...buckets[g]);

  for (const cell of overflowCells) {
    if (leftover.length === 0) break;
    // try to find a student whose placement does not violate
    let pickIdx = -1;
    for (let i = 0; i < leftover.length; i++) {
      if (canPlaceGreedy(grid, cell.r, cell.c, leftover[i].gradeId, gap)) {
        pickIdx = i;
        break;
      }
    }
    if (pickIdx === -1) pickIdx = 0; // forced placement
    grid[cell.r][cell.c] = leftover.splice(pickIdx, 1)[0];
  }

  return { hallId, hallName, rows, cols, students, grid, rowStep, colPeriod, feasible };
}