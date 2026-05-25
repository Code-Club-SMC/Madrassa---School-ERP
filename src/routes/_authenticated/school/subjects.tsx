import { createFileRoute } from "@tanstack/react-router";
import { BookMarked } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/school/subjects")({
  component: () => (
    <PlaceholderPage title="School Subjects" titleUrdu="مضامین" icon={BookMarked} />
  ),
});