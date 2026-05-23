import { createFileRoute } from "@tanstack/react-router";
import { Banknote } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/madrassa/fees")({
  component: () => (
    <PlaceholderPage title="Madrassa Fees" titleUrdu="مدرسہ — فیس" icon={Banknote} />
  ),
});
