import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/reports")({
  component: () => (
    <PlaceholderPage title="Reports" titleUrdu="رپورٹس" icon={BarChart3} />
  ),
});
