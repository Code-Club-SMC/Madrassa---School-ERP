import { createFileRoute } from "@tanstack/react-router";
import { Users2 } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/madrassa/students")({
  component: () => (
    <PlaceholderPage title="Students — Madrassa" titleUrdu="مدرسہ — طلبہ" icon={Users2} />
  ),
});
