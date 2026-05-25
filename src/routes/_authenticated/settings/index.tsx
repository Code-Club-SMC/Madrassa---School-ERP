import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: () => (
    <PlaceholderPage title="Settings" titleUrdu="ترتیبات" icon={Settings} />
  ),
});
