import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/madrassa/exams")({
  component: () => (
    <PlaceholderPage
      title="Madrassa Exams"
      titleUrdu="مدرسہ امتحانات"
      icon={GraduationCap}
      description="Sah Mahi · Nisfus Sana · Salanah — Wifaqi & Zimni"
    />
  ),
});