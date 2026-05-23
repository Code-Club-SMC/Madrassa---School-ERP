import { createFileRoute } from "@tanstack/react-router";
import { Users2 } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/school/students")({
  component: () => (
    <PlaceholderPage title="Students — School" titleUrdu="اسکول — طلبہ" icon={Users2} />
  ),
});
