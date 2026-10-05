import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/school/attendance")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/attendance" });
  },
  component: () => null,
});
