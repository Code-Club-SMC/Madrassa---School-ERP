import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/school/attendance")({
  component: () => (
    <PlaceholderPage title="School Attendance" titleUrdu="اسکول — حاضری" icon={CalendarCheck} />
  ),
});
