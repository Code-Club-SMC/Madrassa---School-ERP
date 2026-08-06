import { createFileRoute } from "@tanstack/react-router";
import { TeacherProfileWorkspace } from "@/components/teachers/teacher-profile-workspace";

export const Route = createFileRoute("/_authenticated/teachers/$id")({
  component: TeacherProfileWorkspace,
});
