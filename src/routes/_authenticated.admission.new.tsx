import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/admission/new")({
  component: () => (
    <PlaceholderPage title="New Admission" titleUrdu="نیا داخلہ" icon={UserPlus} />
  ),
});
