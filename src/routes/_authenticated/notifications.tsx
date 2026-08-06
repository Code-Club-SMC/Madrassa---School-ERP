import { createFileRoute } from "@tanstack/react-router";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationCenter,
});
