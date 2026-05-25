import { createFileRoute } from "@tanstack/react-router";
import { School } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/school/classes")({
  component: () => (
    <PlaceholderPage
      title="Classes & Sections"
      titleUrdu="جماعتیں و حصے"
      icon={School}
    />
  ),
});