import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/school")({
  beforeLoad: () => ({ activeSystem: "school" as const }),
  component: Outlet,
});
