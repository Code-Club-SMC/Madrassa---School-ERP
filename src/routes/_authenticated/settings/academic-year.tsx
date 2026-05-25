import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/settings/academic-year")({
  component: () => (
    <PlaceholderPage
      title="Academic Year"
      titleUrdu="تعلیمی سال"
      icon={CalendarRange}
    />
  ),
});