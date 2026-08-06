import { createFileRoute } from "@tanstack/react-router";
import { FeeWorkspace } from "@/components/fees/fee-workspace";

export const Route = createFileRoute("/_authenticated/school/fees")({
  component: SchoolFeesPage,
});

function SchoolFeesPage() {
  return <FeeWorkspace system="school" />;
}
