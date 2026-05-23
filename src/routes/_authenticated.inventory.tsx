import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: () => (
    <PlaceholderPage title="Inventory" titleUrdu="انوینٹری" icon={Package} />
  ),
});
