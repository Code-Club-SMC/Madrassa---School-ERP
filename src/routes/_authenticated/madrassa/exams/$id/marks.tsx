import { createFileRoute, useParams } from "@tanstack/react-router";
import { MarksEntry } from "@/components/exams/marks-entry";

export const Route = createFileRoute("/_authenticated/madrassa/exams/$id/marks")({
  component: MarksPage,
});

function MarksPage() {
  const { id } = useParams({ from: "/_authenticated/madrassa/exams/$id/marks" });
  return <MarksEntry examId={id} system="madrassa" />;
}
