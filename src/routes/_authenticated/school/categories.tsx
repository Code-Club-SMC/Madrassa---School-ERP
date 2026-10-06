import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/school/categories")({
  beforeLoad: () => {
    throw redirect({ to: "/school/classes" });
  },
  component: () => null,
});

