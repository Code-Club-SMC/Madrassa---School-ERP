import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/madrassa")({
  beforeLoad: () => ({ activeSystem: "madrassa" as const }),
  component: Outlet,
});
