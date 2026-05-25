import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/teachers")({
  component: () => (
    <PlaceholderPage title="Teachers" titleUrdu="اساتذہ" icon={GraduationCap} />
  ),
});
