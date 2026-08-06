import { createFileRoute, useParams } from "@tanstack/react-router";
import { ExamSeatingWorkspace } from "@/components/exams/exam-seating-workspace";

export const Route = createFileRoute("/_authenticated/madrassa/exams/$id/seating")({
  component: SeatingPage,
});

function SeatingPage() {
  const { id } = useParams({ from: "/_authenticated/madrassa/exams/$id/seating" });
  return <ExamSeatingWorkspace examId={id} system="madrassa" />;
}
