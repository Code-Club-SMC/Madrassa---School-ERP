import { createFileRoute, useParams } from "@tanstack/react-router";
import { MarksEntry } from "@/components/exams/marks-entry";

export const Route = createFileRoute("/_authenticated/school/exams/$id/results")({
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = useParams({ from: "/_authenticated/school/exams/$id/results" });
  return <MarksEntry examId={id} system="school" />;
}
