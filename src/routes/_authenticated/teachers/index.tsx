import { createFileRoute } from "@tanstack/react-router";
import { TeacherWorkspace } from "@/components/teachers/teacher-workspace";

export const Route = createFileRoute("/_authenticated/teachers/")({
  component: TeacherWorkspace,
});
