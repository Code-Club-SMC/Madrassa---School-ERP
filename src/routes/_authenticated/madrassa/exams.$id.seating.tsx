import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ExamSeating } from "@/components/shared/ExamSeating";

export const Route = createFileRoute("/_authenticated/madrassa/exams/$id/seating")({
  component: MadrassaSeatingPage,
});

function MadrassaSeatingPage() {
  const { id } = useParams({ from: "/_authenticated/madrassa/exams/$id/seating" });
  return (
    <div>
      <Link to="/madrassa/exams/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        Back to exam
      </Link>
      <ExamSeating examId={id} module="madrassa" />
    </div>
  );
}
