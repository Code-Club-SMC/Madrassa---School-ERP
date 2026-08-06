import { createFileRoute } from "@tanstack/react-router";
import { ExamWorkspace } from "@/components/exams/exam-workspace";

export const Route = createFileRoute("/_authenticated/madrassa/exams/")({
  component: ExamsPage,
});

function ExamsPage() {
  return <ExamWorkspace system="madrassa" />;
}
