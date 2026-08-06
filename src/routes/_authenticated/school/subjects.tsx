import { createFileRoute } from "@tanstack/react-router";
import { ExamSubjectWorkspace } from "@/components/exams/exam-workspace";

export const Route = createFileRoute("/_authenticated/school/subjects")({
  component: SubjectsPage,
});

function SubjectsPage() {
  return <ExamSubjectWorkspace system="school" />;
}
