import { createFileRoute } from "@tanstack/react-router";
import { FeeWorkspace } from "@/components/fees/fee-workspace";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/school/fees")({
  component: SchoolFeesPage,
});

function SchoolFeesPage() {
  const { gender } = useSystem();
  const institutionId = gender === "male" ? "al_qasim_academy" : "jamia_zainab_banat";
  return <FeeWorkspace system="school" institutionId={institutionId} />;
}
