import { createFileRoute } from "@tanstack/react-router";
import { CalendarX } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/holidays")({
  component: () => (
    <PlaceholderPage title="Holidays" titleUrdu="تعطیلات" icon={CalendarX} />
  ),
});