import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/madrassa/categories")({
  component: () => (
    <PlaceholderPage title="Categories" titleUrdu="اقسام" icon={Layers} />
  ),
});
