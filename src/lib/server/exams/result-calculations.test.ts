import { assignPositions, buildTranscript, calculateExamResult, gradeForPercentage } from "./result-calculations";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("exam result calculations", () => {
  test("maps Pakistani percentage bands to grades", () => {
    expect(gradeForPercentage(80)).toBe("A1");
    expect(gradeForPercentage(70)).toBe("A");
    expect(gradeForPercentage(60)).toBe("B");
    expect(gradeForPercentage(50)).toBe("C");
    expect(gradeForPercentage(40)).toBe("D");
    expect(gradeForPercentage(33)).toBe("E");
    expect(gradeForPercentage(32.99)).toBe("F");
  });

  test("calculates pass result with total percentage and grade", () => {
    const result = calculateExamResult({
      studentId: "s1",
      enrollmentId: "e1",
      marks: [
        {
          code: "ENG",
          name: "English",
          nameUrdu: "English",
          totalMarks: 100,
          passingMarks: 33,
          attendanceStatus: "present",
          obtainedMarks: 80,
        },
        {
          code: "MAT",
          name: "Math",
          nameUrdu: "Math",
          totalMarks: 100,
          passingMarks: 33,
          attendanceStatus: "present",
          obtainedMarks: 70,
        },
      ],
    });

    expect(result).toMatchObject({
      obtainedMarks: 150,
      totalMarks: 200,
      percentageTimes100: 7500,
      grade: "A",
      status: "pass",
      failedSubjects: [],
    });
  });

  test("marks absent subject as failed with zero obtained marks", () => {
    const result = calculateExamResult({
      studentId: "s1",
      enrollmentId: "e1",
      marks: [
        {
          code: "SCI",
          name: "Science",
          nameUrdu: "Science",
          totalMarks: 75,
          passingMarks: 25,
          attendanceStatus: "absent",
          obtainedMarks: null,
        },
      ],
    });

    expect(result.status).toBe("fail");
    expect(result.obtainedMarks).toBe(0);
    expect(result.failedSubjects).toEqual([{ code: "SCI", name: "Science", nameUrdu: "Science" }]);
  });

  test("assigns tied positions with competition ranking", () => {
    const ranked = assignPositions([
      {
        studentId: "a",
        enrollmentId: "ea",
        obtainedMarks: 90,
        totalMarks: 100,
        percentageTimes100: 9000,
        percentage: 90,
        grade: "A1",
        status: "pass",
        position: null,
        failedSubjects: [],
      },
      {
        studentId: "b",
        enrollmentId: "eb",
        obtainedMarks: 90,
        totalMarks: 100,
        percentageTimes100: 9000,
        percentage: 90,
        grade: "A1",
        status: "pass",
        position: null,
        failedSubjects: [],
      },
      {
        studentId: "c",
        enrollmentId: "ec",
        obtainedMarks: 80,
        totalMarks: 100,
        percentageTimes100: 8000,
        percentage: 80,
        grade: "A1",
        status: "pass",
        position: null,
        failedSubjects: [],
      },
    ]);

    expect(ranked.map((row) => [row.studentId, row.position])).toEqual([
      ["a", 1],
      ["b", 1],
      ["c", 3],
    ]);
  });

  test("builds transcript grouped by academic year", () => {
    const transcript = buildTranscript([
      {
        academicYear: "2025-2026",
        classLabel: "Grade 5",
        examName: "First Term",
        examType: "quarterly",
        obtainedMarks: 350,
        totalMarks: 500,
        percentageTimes100: 7000,
        grade: "A",
        status: "pass",
      },
      {
        academicYear: "2025-2026",
        classLabel: "Grade 5",
        examName: "Annual",
        examType: "annual",
        obtainedMarks: 420,
        totalMarks: 500,
        percentageTimes100: 8400,
        grade: "A1",
        status: "pass",
      },
    ]);

    expect(transcript[0]).toMatchObject({
      academicYear: "2025-2026",
      classLabel: "Grade 5",
      averagePercentage: 77,
      finalStatus: "pass",
    });
    expect(transcript[0]?.annualResult?.examName).toBe("Annual");
  });
});
