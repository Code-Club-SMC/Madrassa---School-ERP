import { createFileRoute } from "@tanstack/react-router";
import { FeeWorkspace } from "@/components/fees/fee-workspace";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/madrassa/fees")({
  component: MadrassaFeesPage,
});

function MadrassaFeesPage() {
  const { gender } = useSystem();
  const institutionId = gender === "male" ? "jamia_qasmia_baneen" : "jamia_zainab_banat";
  return <FeeWorkspace system="madrassa" institutionId={institutionId} />;
}
