import { describe, expect, it, beforeEach } from "bun:test";
import {
  computeConcessionsSummary,
  deleteAllConcessions,
  deleteConcession,
  listConcessions,
  saveConcession,
  type Concession,
} from "./concessions-service";

describe("Concessions Service & Persistence", () => {
  beforeEach(() => {
    deleteAllConcessions();
  });

  it("starts with clean empty list and does not resurrect default items", () => {
    const items = listConcessions();
    expect(items).toEqual([]);

    const summary = computeConcessionsSummary(items);
    expect(summary.totalCount).toBe(0);
    expect(summary.activeCount).toBe(0);
    expect(summary.orphansCount).toBe(0);
    expect(summary.scholarshipsCount).toBe(0);
    expect(summary.totalMonthlyWaivedPaisa).toBe(0);
  });

  it("saves a new concession and computes accurate summary", () => {
    const saved = saveConcession({
      studentId: "stu-test-1",
      studentName: "Ahmad Raza",
      studentNameUrdu: "احمد رضا",
      rollNo: "R-101",
      reason: "orphan",
      reasonUrdu: "یتیم",
      percent: 100,
      monthlyFeePaisa: 250000,
      systemKey: "qasimia_madrassa",
      approvedBy: "Principal",
    });

    expect(saved.id).toBeDefined();
    expect(saved.studentName).toBe("Ahmad Raza");
    expect(saved.percent).toBe(100);

    const items = listConcessions();
    expect(items.length).toBe(1);

    const summary = computeConcessionsSummary(items);
    expect(summary.totalCount).toBe(1);
    expect(summary.activeCount).toBe(1);
    expect(summary.orphansCount).toBe(1);
    expect(summary.totalMonthlyWaivedPaisa).toBe(250000);
  });

  it("deletes a single concession and ensures deletion persists", () => {
    const c1 = saveConcession({
      studentId: "stu-1",
      studentName: "Student One",
      reason: "sibling",
      percent: 25,
      monthlyFeePaisa: 200000,
    });
    const c2 = saveConcession({
      studentId: "stu-2",
      studentName: "Student Two",
      reason: "merit",
      percent: 50,
      monthlyFeePaisa: 200000,
    });

    expect(listConcessions().length).toBe(2);

    deleteConcession(c1.id);

    const remaining = listConcessions();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(c2.id);

    const summary = computeConcessionsSummary(remaining);
    expect(summary.scholarshipsCount).toBe(1);
    expect(summary.totalMonthlyWaivedPaisa).toBe(100000);
  });

  it("clears all concessions and stays empty without resurrecting on subsequent reads", () => {
    saveConcession({
      studentId: "stu-1",
      studentName: "Demo Student",
      reason: "orphan",
      percent: 100,
    });

    expect(listConcessions().length).toBe(1);

    deleteAllConcessions();

    const afterClear = listConcessions();
    expect(afterClear).toEqual([]);
    expect(afterClear.length).toBe(0);
  });
});
