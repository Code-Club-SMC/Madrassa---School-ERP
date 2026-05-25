import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/settings/website")({
  component: () => (
    <PlaceholderPage
      title="Website CMS"
      titleUrdu="ویب سائٹ"
      icon={Globe}
      description="Edit public pages, gallery, notices, and contact info"
    />
  ),
});