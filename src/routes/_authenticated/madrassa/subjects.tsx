import { createFileRoute } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/madrassa/subjects")({
  component: () => (
    <PlaceholderPage title="Subjects" titleUrdu="مضامین" icon={Library} />
  ),
});