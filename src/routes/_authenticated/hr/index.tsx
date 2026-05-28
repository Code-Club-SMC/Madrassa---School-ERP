import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/hr/")({
  component: () => <Navigate to="/hr/staff" replace />,
});