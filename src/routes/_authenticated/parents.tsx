import { createFileRoute } from "@tanstack/react-router";
import { ParentPortal } from "@/components/parents/parent-portal";

export const Route = createFileRoute("/_authenticated/parents")({
  component: ParentPortal,
});
