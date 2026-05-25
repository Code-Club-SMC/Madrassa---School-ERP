import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/school/exams")({
  component: () => (
    <PlaceholderPage title="Examinations" titleUrdu="امتحانات" icon={ClipboardList} />
  ),
});
