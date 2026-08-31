import { createFileRoute } from "@tanstack/react-router";
import { ExamWorkspace } from "@/components/exams/exam-workspace";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/exams/")({
  component: ExamsPage,
});

function ExamsPage() {
  const { module } = useSystem();
  return <ExamWorkspace system={module === "school" ? "school" : "madrassa"} />;
}
