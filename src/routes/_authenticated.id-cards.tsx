import { createFileRoute } from "@tanstack/react-router";
import { IdCard } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/id-cards")({
  component: () => (
    <PlaceholderPage title="ID Card Generator" titleUrdu="شناختی کارڈ ساز" icon={IdCard} />
  ),
});
