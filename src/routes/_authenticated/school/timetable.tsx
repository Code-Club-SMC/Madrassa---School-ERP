import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/school/timetable")({
  component: () => (
    <PlaceholderPage title="School Timetable" titleUrdu="نظامِ اوقات" icon={CalendarClock} />
  ),
});