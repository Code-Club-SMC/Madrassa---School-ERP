import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/exams")({
  component: ExamsLayout,
});

function ExamsLayout() {
  return <Outlet />;
}
