import {
  buildHallSeating,
  countViolations,
  seededRandom,
  shuffle,
  type SeatingStudent,
} from "@/lib/seating";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

const students: SeatingStudent[] = Array.from({ length: 12 }, (_, index) => {
  const gradeId = (index % 3) + 1;
  const classId = `class-${gradeId}`;
  return {
    id: `s${index + 1}`,
    name: `Student ${index + 1}`,
    rollNo: `R-${index + 1}`,
    gradeId,
    gradeLabel: `Grade ${gradeId}`,
    classId,
    className: `Grade ${gradeId}`,
  };
});

function seatedIds(seed: string) {
  return buildHallSeating("h1", "Hall 1", 3, 4, students, 1, seed)
    .grid.flat()
    .map((student) => student?.id ?? null);
}

describe("exam seating", () => {
  test("seededRandom is reproducible", () => {
    const first = seededRandom("exam-1");
    const second = seededRandom("exam-1");

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  test("shuffle returns deterministic order for the same seed", () => {
    expect(shuffle([1, 2, 3, 4, 5], "seed-a")).toEqual(shuffle([1, 2, 3, 4, 5], "seed-a"));
    expect(shuffle([1, 2, 3, 4, 5], "seed-a")).not.toEqual(shuffle([1, 2, 3, 4, 5], "seed-b"));
  });

  test("buildHallSeating preserves existing unseeded call compatibility", () => {
    const sameClass = (a: { gradeId: number }, b: { gradeId: number }) => a.gradeId === b.gradeId;
    const hall = buildHallSeating("h1", "Hall 1", 3, 4, students, 1);

    expect(hall.grid.flat().filter(Boolean)).toHaveLength(12);
    expect(hall.feasible).toBe(true);
    expect(countViolations(hall.grid, hall.rows, hall.cols, 1, sameClass)).toBe(0);
  });

  test("buildHallSeating produces repeatable seeded layouts", () => {
    expect(seatedIds("exam-annual-2026")).toEqual(seatedIds("exam-annual-2026"));
    expect(seatedIds("exam-annual-2026")).not.toEqual(seatedIds("exam-mid-2026"));
  });
});
