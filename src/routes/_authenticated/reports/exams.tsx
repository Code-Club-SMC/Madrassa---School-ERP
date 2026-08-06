import { createFileRoute } from "@tanstack/react-router";
import { ExamReportWorkspace } from "@/components/exams/exam-workspace";

export const Route = createFileRoute("/_authenticated/reports/exams")({
  component: ExamReportPage,
});

function ExamReportPage() {
  return <ExamReportWorkspace />;
}
