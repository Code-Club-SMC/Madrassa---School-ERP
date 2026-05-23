import { createFileRoute } from "@tanstack/react-router";
import { Banknote } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/school/fees")({
  component: () => (
    <PlaceholderPage title="School Fees" titleUrdu="اسکول — فیس" icon={Banknote} />
  ),
});
