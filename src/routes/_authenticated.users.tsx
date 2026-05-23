import { createFileRoute } from "@tanstack/react-router";
import { ShieldUser } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/users")({
  component: () => (
    <PlaceholderPage title="User Management" titleUrdu="صارف انتظام" icon={ShieldUser} />
  ),
});
