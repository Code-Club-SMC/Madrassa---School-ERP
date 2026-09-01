import { createFileRoute } from "@tanstack/react-router";
import { ExamDashboard } from "@/components/exams/exam-dashboard";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/exams/")({
  component: ExamsPage,
});

function ExamsPage() {
  const { module } = useSystem();
  return <ExamDashboard system={module === "school" ? "school" : "madrassa"} />;
}
