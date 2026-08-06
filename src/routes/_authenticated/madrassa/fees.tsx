import { createFileRoute } from "@tanstack/react-router";
import { FeeWorkspace } from "@/components/fees/fee-workspace";

export const Route = createFileRoute("/_authenticated/madrassa/fees")({
  component: MadrassaFeesPage,
});

function MadrassaFeesPage() {
  return <FeeWorkspace system="madrassa" />;
}
