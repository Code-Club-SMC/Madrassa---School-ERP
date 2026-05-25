import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/madrassa/timetable")({
  component: () => (
    <PlaceholderPage
      title="Dars Timetable"
      titleUrdu="نظامِ اوقات"
      icon={CalendarClock}
    />
  ),
});