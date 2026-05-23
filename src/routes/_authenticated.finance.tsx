import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/finance")({
  component: () => (
    <PlaceholderPage title="Finance Dashboard" titleUrdu="مالیاتی ڈیش بورڈ" icon={Wallet} />
  ),
});
