import { createFileRoute, useParams } from "@tanstack/react-router";
import { MarksEntry } from "@/components/exams/marks-entry";

export const Route = createFileRoute("/_authenticated/school/exams/$id/marks")({
  component: MarksPage,
});

function MarksPage() {
  const { id } = useParams({ from: "/_authenticated/school/exams/$id/marks" });
  return <MarksEntry examId={id} system="school" />;
}

