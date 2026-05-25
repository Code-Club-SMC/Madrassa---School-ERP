import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/madrassa/attendance")({
  component: () => (
    <PlaceholderPage title="Madrassa Attendance" titleUrdu="مدرسہ — حاضری" icon={CalendarCheck} />
  ),
});
