import { createFileRoute } from "@tanstack/react-router";
import {
  createAnnouncementSchema,
  createLocalAnnouncement,
  listNotifications,
  listNotificationsQuerySchema,
} from "@/lib/server/notifications/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/notifications/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = listNotificationsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success)
          return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await listNotifications(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load notifications");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, createAnnouncementSchema);
        if (!body.ok) return body.response;

        try {
          return json(await createLocalAnnouncement(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not create announcement");
        }
      },
    },
  },
});
