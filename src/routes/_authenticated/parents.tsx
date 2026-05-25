import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/parents")({
  component: () => (
    <PlaceholderPage title="Parents Portal" titleUrdu="والدین پورٹل" icon={HeartHandshake} />
  ),
});
