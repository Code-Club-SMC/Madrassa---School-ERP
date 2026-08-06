import { createFileRoute, useParams } from "@tanstack/react-router";
import { ExamDetailWorkspace } from "@/components/exams/exam-workspace";

export const Route = createFileRoute("/_authenticated/school/exams/$id/")({
  component: ExamDetailPage,
});

function ExamDetailPage() {
  const { id } = useParams({ from: "/_authenticated/school/exams/$id/" });
  return <ExamDetailWorkspace examId={id} system="school" />;
}
