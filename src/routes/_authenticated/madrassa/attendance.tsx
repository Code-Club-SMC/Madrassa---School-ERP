import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/madrassa/attendance")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/attendance" });
  },
  component: () => null,
});
