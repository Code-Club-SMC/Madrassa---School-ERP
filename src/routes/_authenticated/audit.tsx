import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/audit")({
  component: () => (
    <PlaceholderPage title="Audit Log" titleUrdu="آڈٹ لاگ" icon={ShieldCheck} />
  ),
});