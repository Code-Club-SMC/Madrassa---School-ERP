export type ExamSubjectMarkInput = {
  code: string;
  name: string;
  nameUrdu: string;
  totalMarks: number;
  passingMarks: number;
  attendanceStatus: "present" | "absent" | "leave";
  obtainedMarks: number | null;
};

export type ExamResultCalculationInput = {
  studentId: string;
  enrollmentId: string;
  marks: ExamSubjectMarkInput[];
};

export type ExamResultCalculation = {
  studentId: string;
  enrollmentId: string;
  obtainedMarks: number;
  totalMarks: number;
  percentageTimes100: number;
  percentage: number;
  grade: string;
  status: "pass" | "fail";
  position: number | null;
  failedSubjects: Array<{ code: string; name: string; nameUrdu: string }>;
};

export type TranscriptExamRow = {
  academicYear: string;
  classLabel: string;
  examName: string;
  examType: string;
  obtainedMarks: number;
  totalMarks: number;
  percentageTimes100: number;
  grade: string;
  status: "pass" | "fail";
};

export type TranscriptYear = {
  academicYear: string;
  classLabel: string;
  exams: TranscriptExamRow[];
  annualResult: TranscriptExamRow | null;
  averagePercentage: number;
  finalStatus: "pass" | "fail";
};

export function gradeForPercentage(percentage: number) {
  if (percentage >= 80) return "A1";
  if (percentage >= 70) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  if (percentage >= 33) return "E";
  return "F";
}

export function calculateExamResult(input: ExamResultCalculationInput): ExamResultCalculation {
  const totalMarks = input.marks.reduce((sum, mark) => sum + mark.totalMarks, 0);
  const obtainedMarks = input.marks.reduce((sum, mark) => {
    if (mark.attendanceStatus !== "present") return sum;
    return sum + Math.max(0, Math.min(mark.totalMarks, mark.obtainedMarks ?? 0));
  }, 0);
  const failedSubjects = input.marks
    .filter((mark) => mark.attendanceStatus !== "present" || (mark.obtainedMarks ?? 0) < mark.passingMarks)
    .map((mark) => ({ code: mark.code, name: mark.name, nameUrdu: mark.nameUrdu }));
  const percentageTimes100 = totalMarks ? Math.round((obtainedMarks / totalMarks) * 10000) : 0;
  const percentage = percentageTimes100 / 100;
  const grade = gradeForPercentage(percentage);

  return {
    studentId: input.studentId,
    enrollmentId: input.enrollmentId,
    obtainedMarks,
    totalMarks,
    percentageTimes100,
    percentage,
    grade,
    status: failedSubjects.length === 0 ? "pass" : "fail",
    position: null,
    failedSubjects,
  };
}

export function assignPositions(results: ExamResultCalculation[]) {
  const sorted = [...results].sort(
    (a, b) =>
      b.obtainedMarks - a.obtainedMarks ||
      b.percentageTimes100 - a.percentageTimes100 ||
      a.studentId.localeCompare(b.studentId),
  );
  let lastScore: string | null = null;
  let lastPosition = 0;

  return sorted.map((result, index) => {
    const score = `${result.obtainedMarks}:${result.percentageTimes100}`;
    const position = score === lastScore ? lastPosition : index + 1;
    lastScore = score;
    lastPosition = position;
    return { ...result, position };
  });
}

export function buildTranscript(rows: TranscriptExamRow[]): TranscriptYear[] {
  const byYear = new Map<string, TranscriptExamRow[]>();
  for (const row of rows) {
    const list = byYear.get(row.academicYear) ?? [];
    list.push(row);
    byYear.set(row.academicYear, list);
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([academicYear, exams]) => {
      const annualResult = exams.find((exam) => ["annual", "salanah"].includes(exam.examType)) ?? null;
      const averagePercentage =
        exams.length === 0
          ? 0
          : Math.round(exams.reduce((sum, exam) => sum + exam.percentageTimes100, 0) / exams.length / 100);

      return {
        academicYear,
        classLabel: annualResult?.classLabel ?? exams[0]?.classLabel ?? "",
        exams,
        annualResult,
        averagePercentage,
        finalStatus: exams.some((exam) => exam.status === "fail") ? "fail" : "pass",
      };
    });
}
