import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/madrassa/classes")({
  component: () => (
    <PlaceholderPage
      title="Daraja (Classes)"
      titleUrdu="درجات"
      icon={BookOpen}
      description="Dars-e-Nizami stages from Aamma to Khamisa"
    />
  ),
});