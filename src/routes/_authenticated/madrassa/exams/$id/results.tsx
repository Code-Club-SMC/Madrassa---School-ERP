import { createFileRoute, useParams } from "@tanstack/react-router";
import { MarksEntry } from "@/components/exams/marks-entry";

export const Route = createFileRoute("/_authenticated/madrassa/exams/$id/results")({
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = useParams({ from: "/_authenticated/madrassa/exams/$id/results" });
  return <MarksEntry examId={id} system="madrassa" readOnly />;
}
